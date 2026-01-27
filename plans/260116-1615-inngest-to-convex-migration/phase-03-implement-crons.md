# Phase 03: Implement Cron Jobs

## Context Links
- [Plan Overview](./plan.md)
- [Convex Scheduling Research](../reports/researcher-260116-1615-convex-scheduling.md)
- [Original Phase 04 Data Sync](../260116-1247-mvp-implementation/phase-04-data-sync.md)
- [Tester Report](../reports/tester-260116-1731-phase-03-crons-testing.md)
- [Code Review Report](../reports/code-reviewer-260116-1735-phase-03-crons.md)

## Overview
- **Priority:** P0
- **Status:** ✅ Completed (Code Review: 9.5/10 after fixes)
- **Effort:** 2h
- **Description:** Implement all 4 cron jobs using Convex native cronJobs + action-retrier.
- **Completed:** 2026-01-16T18:00:00Z

## Cron Jobs to Implement

| Job | Schedule | Purpose |
|-----|----------|---------|
| sync-markets | Every 5 minutes | Fetch markets from Opinion.Trade |
| sync-whale-trades | Every 1 minute | Poll whale wallet activity |
| compute-whale-stats | Every hour | Recalculate whale statistics |
| cleanup-old-activity | Daily at 3 AM UTC | Prune old activity records |

## Architecture

```
Cron Trigger → Internal Mutation → Action Retrier → External API
                    ↓                    ↓
              Log sync start      On complete callback
                                       ↓
                              Update DB with results
```

## Implementation Steps

### Step 1: Create Crons Definition

Create `packages/backend/convex/crons.ts`:

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Market data sync - every 5 minutes
crons.interval(
  "sync-markets",
  { minutes: 5 },
  internal.scheduling.triggerMarketSync
);

// Whale activity sync - every 1 minute
crons.interval(
  "sync-whale-trades",
  { minutes: 1 },
  internal.scheduling.triggerWhaleSync
);

// Stats computation - every hour at minute 0
crons.hourly(
  "compute-whale-stats",
  { minuteUTC: 0 },
  internal.scheduling.computeWhaleStats
);

// Daily cleanup - 3 AM UTC
crons.daily(
  "cleanup-old-activity",
  { hourUTC: 3, minuteUTC: 0 },
  internal.scheduling.cleanupOldActivity
);

export default crons;
```

### Step 2: Create Scheduling Module

Create `packages/backend/convex/scheduling.ts`:

```typescript
import { v } from "convex/values";
import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { retrier } from "./lib/retrier";

// ============ MARKET SYNC ============

export const triggerMarketSync = internalMutation({
  handler: async (ctx) => {
    // Log sync start
    const syncId = await ctx.db.insert("syncLogs", {
      type: "markets",
      status: "running",
      startedAt: Date.now(),
    });

    // Schedule API call with retries
    await retrier.run(
      ctx,
      internal.scheduling.fetchMarketData,
      { syncId },
      {
        initialBackoffMs: 500,
        maxFailures: 3,
        onComplete: internal.scheduling.handleMarketSyncComplete,
      }
    );

    return { syncId };
  },
});

export const fetchMarketData = internalAction({
  args: { syncId: v.id("syncLogs") },
  handler: async (ctx, args) => {
    // TODO: Replace with actual Opinion.Trade API call
    const response = await fetch(
      "https://proxy.opinion.trade:8443/openapi/market/list",
      {
        headers: {
          "X-API-KEY": process.env.OPINION_TRADE_API_KEY ?? "",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Opinion.Trade API error: ${response.status}`);
    }

    const data = await response.json();
    return { syncId: args.syncId, markets: data.data ?? [] };
  },
});

export const handleMarketSyncComplete = internalMutation({
  args: {
    result: v.any(), // ActionRetrier result type
  },
  handler: async (ctx, args) => {
    const { result } = args;

    if (result.type === "success") {
      const { syncId, markets } = result.returnValue;

      // Upsert markets
      for (const market of markets) {
        const existing = await ctx.db
          .query("markets")
          .withIndex("by_externalId", (q) =>
            q.eq("platform", "opinion_trade").eq("externalId", market.marketId)
          )
          .unique();

        const marketData = {
          externalId: market.marketId,
          platform: "opinion_trade" as const,
          title: market.title,
          category: market.labels?.[0] ?? "other",
          yesPrice: 0.5, // TODO: Get from token price
          noPrice: 0.5,
          volume: market.volume ?? 0,
          volume24h: market.volume24h ?? 0,
          liquidity: 0,
          endDate: new Date(market.cutoffAt).getTime(),
          url: `https://opinion.trade/market/${market.marketId}`,
          updatedAt: Date.now(),
        };

        if (existing) {
          await ctx.db.patch(existing._id, marketData);
        } else {
          await ctx.db.insert("markets", {
            ...marketData,
            createdAt: Date.now(),
          });
        }
      }

      // Update sync log
      await ctx.db.patch(syncId, {
        status: "completed",
        endedAt: Date.now(),
        itemCount: markets.length,
      });
    } else {
      // Handle failure
      const syncId = result.args?.syncId;
      if (syncId) {
        await ctx.db.patch(syncId, {
          status: "failed",
          endedAt: Date.now(),
          error: result.error ?? "Unknown error",
        });
      }
    }
  },
});

// ============ WHALE SYNC ============

export const triggerWhaleSync = internalMutation({
  handler: async (ctx) => {
    const syncId = await ctx.db.insert("syncLogs", {
      type: "whales",
      status: "running",
      startedAt: Date.now(),
    });

    // Get all tracked whale addresses
    const whales = await ctx.db.query("whales").collect();

    if (whales.length === 0) {
      await ctx.db.patch(syncId, {
        status: "completed",
        endedAt: Date.now(),
        itemCount: 0,
      });
      return { syncId, message: "No whales to sync" };
    }

    // Schedule API call for each whale (batched)
    await retrier.run(
      ctx,
      internal.scheduling.fetchWhaleActivity,
      {
        syncId,
        whaleAddresses: whales.map((w) => w.address),
      },
      {
        initialBackoffMs: 250,
        maxFailures: 3,
        onComplete: internal.scheduling.handleWhaleSyncComplete,
      }
    );

    return { syncId };
  },
});

export const fetchWhaleActivity = internalAction({
  args: {
    syncId: v.id("syncLogs"),
    whaleAddresses: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: Replace with actual API calls
    // For MVP, return empty until API key approved
    const activities: Array<{
      address: string;
      trades: Array<{
        marketId: string;
        action: "BUY" | "SELL";
        amount: number;
        price: number;
        timestamp: number;
      }>;
    }> = [];

    // Batch fetch trades for each whale
    for (const address of args.whaleAddresses) {
      try {
        const response = await fetch(
          `https://proxy.opinion.trade:8443/openapi/user/${address}/trades`,
          {
            headers: {
              "X-API-KEY": process.env.OPINION_TRADE_API_KEY ?? "",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          activities.push({
            address,
            trades: data.data ?? [],
          });
        }
      } catch (error) {
        console.error(`Failed to fetch trades for ${address}:`, error);
      }
    }

    return { syncId: args.syncId, activities };
  },
});

export const handleWhaleSyncComplete = internalMutation({
  args: { result: v.any() },
  handler: async (ctx, args) => {
    const { result } = args;

    if (result.type === "success") {
      const { syncId, activities } = result.returnValue;
      let newActivityCount = 0;

      for (const { address, trades } of activities) {
        // Find whale by address
        const whale = await ctx.db
          .query("whales")
          .withIndex("by_address", (q) => q.eq("address", address))
          .unique();

        if (!whale) continue;

        // Get latest synced timestamp
        const latestActivity = await ctx.db
          .query("whaleActivity")
          .withIndex("by_whaleId_timestamp", (q) => q.eq("whaleId", whale._id))
          .order("desc")
          .first();

        const lastTimestamp = latestActivity?.timestamp ?? 0;

        // Insert new trades
        for (const trade of trades) {
          if (trade.timestamp <= lastTimestamp) continue;

          // Find market
          const market = await ctx.db
            .query("markets")
            .withIndex("by_externalId", (q) =>
              q.eq("platform", "opinion_trade").eq("externalId", trade.marketId)
            )
            .unique();

          if (!market) continue;

          const now = trade.timestamp;
          await ctx.db.insert("whaleActivity", {
            whaleId: whale._id,
            marketId: market._id,
            action: trade.action,
            amount: trade.amount,
            price: trade.price,
            platform: "opinion_trade",
            timestamp: now,
            visibleToProPlusAt: now,
            visibleToProAt: now + 30 * 1000, // +30s
            visibleToFreeAt: now + 15 * 60 * 1000, // +15min
          });

          newActivityCount++;
        }
      }

      await ctx.db.patch(syncId, {
        status: "completed",
        endedAt: Date.now(),
        itemCount: newActivityCount,
      });
    } else {
      const syncId = result.args?.syncId;
      if (syncId) {
        await ctx.db.patch(syncId, {
          status: "failed",
          endedAt: Date.now(),
          error: result.error ?? "Unknown error",
        });
      }
    }
  },
});

// ============ STATS COMPUTATION ============

export const computeWhaleStats = internalMutation({
  handler: async (ctx) => {
    const whales = await ctx.db.query("whales").collect();
    let updatedCount = 0;

    for (const whale of whales) {
      // Get all activity for this whale
      const activity = await ctx.db
        .query("whaleActivity")
        .withIndex("by_whaleId_timestamp", (q) => q.eq("whaleId", whale._id))
        .collect();

      // Compute stats
      let totalVolume = 0;
      let lastActiveAt = whale.lastActiveAt;

      for (const trade of activity) {
        totalVolume += trade.amount;
        lastActiveAt = Math.max(lastActiveAt, trade.timestamp);
      }

      // Update whale record
      await ctx.db.patch(whale._id, {
        totalVolume,
        tradeCount: activity.length,
        lastActiveAt,
        updatedAt: Date.now(),
      });

      updatedCount++;
    }

    return { updatedCount };
  },
});

// ============ CLEANUP ============

const RETENTION_DAYS = 90;

export const cleanupOldActivity = internalMutation({
  handler: async (ctx) => {
    const cutoffTimestamp = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let totalDeleted = 0;

    // Delete old activity in batches
    const oldActivity = await ctx.db
      .query("whaleActivity")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoffTimestamp))
      .take(100);

    for (const activity of oldActivity) {
      await ctx.db.delete(activity._id);
      totalDeleted++;
    }

    // Delete old sync logs
    const oldSyncs = await ctx.db
      .query("syncLogs")
      .filter((q) => q.lt(q.field("startedAt"), cutoffTimestamp))
      .take(100);

    for (const sync of oldSyncs) {
      await ctx.db.delete(sync._id);
      totalDeleted++;
    }

    return { totalDeleted, cutoffDate: new Date(cutoffTimestamp).toISOString() };
  },
});
```

### Step 3: Add SyncLogs Table to Schema

Update `packages/backend/convex/schema.ts` to add:

```typescript
// Add to existing schema
syncLogs: defineTable({
  type: v.union(v.literal("markets"), v.literal("whales"), v.literal("stats")),
  status: v.union(
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed")
  ),
  startedAt: v.number(),
  endedAt: v.optional(v.number()),
  itemCount: v.optional(v.number()),
  error: v.optional(v.string()),
})
  .index("by_type", ["type"])
  .index("by_status", ["status"])
  .index("by_startedAt", ["startedAt"]),
```

## Related Code Files

### Create
- `packages/backend/convex/crons.ts` - Cron job definitions
- `packages/backend/convex/scheduling.ts` - Scheduling functions

### Modify
- `packages/backend/convex/schema.ts` - Add syncLogs table

## Todo List

- [x] Create `convex/crons.ts` with all 4 cron jobs
- [x] Create `convex/scheduling.ts` with trigger/fetch/callback functions
- [x] Add `syncLogs` table to schema
- [x] Deploy to Convex: `bun run dev` (codegen passed)
- [x] Code review completed (8.5/10 → 9.5/10 after fixes)
- [x] Crons implementation complete with 4 scheduling functions
- [x] Market sync (every 5 min) with Opinion.Trade API integration
- [x] Whale activity sync (every 1 min) with rate limiting
- [x] Stats computation (hourly) with aggregation
- [x] Cleanup job (daily at 3 AM UTC) with 90-day retention
- [x] Sync logs table and monitoring infrastructure added
- [x] Fix Critical #1: API response validation in fetchMarketData (type guards added)
- [x] Fix Critical #2: API response validation in fetchWhaleActivity (type guards added)
- [x] Validate OPINION_TRADE_API_KEY at startup (validateApiKey() throws if missing)
- [x] Rate limiting for whale sync (5 per batch, 1s delay between batches)
- [x] Larger cleanup batch size (500 records per run)
- [ ] DEPLOYMENT: Set OPINION_TRADE_API_KEY in Convex dashboard

## Success Criteria

- [x] All 4 crons defined in code
- [x] TypeScript compilation passes (0 errors)
- [x] Convex codegen passes (5.22s)
- [x] ESLint passes (0 errors after fixes)
- [x] Code review completed (Score: 8.5/10 → 9.5/10 after fixes)
- [x] Critical security issues fixed (API validation with type guards)
- [x] Rate limiting implemented (5 whales/batch, 1s delay)
- [x] Error tracking in syncLogs (error field populated on failures)
- [ ] DEPLOYMENT: All 4 crons visible in Convex dashboard
- [ ] DEPLOYMENT: Market sync runs every 5 minutes
- [ ] DEPLOYMENT: Whale sync runs every 1 minute
- [ ] DEPLOYMENT: Stats computed hourly
- [ ] DEPLOYMENT: Cleanup runs daily at 3 AM UTC
- [ ] DEPLOYMENT: Sync logs recorded in database
- [ ] DEPLOYMENT: Retry behavior works on API failure

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| API key not approved | High | Build with mock data first |
| Sync takes too long | Medium | Optimize batching, increase interval |
| Rate limit exceeded | Medium | Add rate limiter component |

## Code Review Summary (2026-01-16)

**Review Status:** ✅ APPROVED (Score: 8.5/10 → 9.5/10 after fixes)
**Reviewer:** code-reviewer agent
**Report:** [Full Review](../reports/code-reviewer-260116-1735-phase-03-crons.md)

### Issues Fixed (All Resolved)
1. ✅ API response validation in `fetchMarketData` - Added `isValidMarketResponse` type guard
2. ✅ API response validation in `fetchWhaleActivity` - Added `isValidTradeResponse` type guard
3. ✅ Rate limiting for whale sync - `WHALE_BATCH_SIZE=5`, `BATCH_DELAY_MS=1000`
4. ✅ Environment variable validation - `validateApiKey()` throws if missing
5. ✅ Error tracking in syncLogs - Error field populated on failures
6. ✅ Larger cleanup batch - `CLEANUP_BATCH_SIZE=500`

### Implementation Details
- Type guards validate API response structure before processing
- Rate limiting: 5 whales per batch with 1s delay between batches
- Fail-fast on missing `OPINION_TRADE_API_KEY`
- Detailed error tracking with fetch/process error counts
- Cleanup handles 500 records per run (up from 100)

### Status
- Implementation: ✅ Complete
- Testing: ✅ Passed (codegen, types, lint)
- Security Review: ✅ All critical issues fixed
- Code Quality: ✅ 9.5/10
- Deployment: ⏳ Pending (requires API key configuration)

## Next Steps

1. Configure OPINION_TRADE_API_KEY in Convex dashboard
2. Deploy and verify crons in dashboard
3. Proceed to [Phase 04: Update Documentation](./phase-04-update-docs.md)
