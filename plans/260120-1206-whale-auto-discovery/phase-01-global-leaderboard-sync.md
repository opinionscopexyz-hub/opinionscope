# Phase 1: Global Leaderboard Sync

## Context Links
- [scheduling.ts](../../packages/backend/convex/scheduling.ts) - Sync handlers
- [whales.ts](../../packages/backend/convex/whales.ts) - upsertWhale mutation
- [crons.ts](../../packages/backend/convex/crons.ts) - Cron definitions
- [schema.ts](../../packages/backend/convex/schema.ts) - DB schema

## Overview
- **Priority**: High
- **Status**: Complete
- **Effort**: 1.5 hours
- **Description**: Daily sync of top 100 traders from Opinion.Trade global leaderboard
- **Completed**: 2026-01-20

## Key Insights

1. **API Endpoint**: Different base URL from main API
   - URL: `https://proxy.opinion.trade:8443/api/bsc/api/v2/leaderboard`
   - No API key required (public endpoint)

2. **Response Structure**:
   ```typescript
   interface LeaderboardResponse {
     errno: number;
     result: {
       list: Array<{
         walletAddress: string;
         userName: string;
         avatar: string;
         rankingValue: number;
         xUsername?: string;
         xUserId?: string;
       }>;
     };
   }
   ```

3. **Data Mapping**:
   - `walletAddress` → whale `address`
   - `userName` → whale `nickname`
   - `avatar` → whale `avatar`

## Requirements

### Functional
- Fetch top 100 traders by volume from leaderboard API
- Upsert each trader as whale using existing `upsertWhale` mutation
- Log sync results to `syncLogs` table
- Run daily at 4 AM UTC

### Non-Functional
- Single API call (no rate limiting needed)
- Use retrier for reliability
- Complete within 30 seconds

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Cron: 4 AM UTC Daily                    │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│          triggerLeaderboardSync (internalMutation)         │
│  - Create syncLog entry (type: "leaderboard-whales")       │
│  - Schedule fetchLeaderboardData with retrier              │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│           fetchLeaderboardData (internalAction)            │
│  - GET proxy.opinion.trade:8443/api/bsc/api/v2/leaderboard │
│  - Params: limit=100, dataType=volume, chainId=56, period=0│
│  - Validate response structure                             │
│  - Call processLeaderboardResults mutation                 │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│        processLeaderboardResults (internalMutation)        │
│  - For each trader: call upsertWhale                       │
│  - Update syncLog with results                             │
└────────────────────────────────────────────────────────────┘
```

## Related Code Files

### Files to Modify
| File | Changes |
|------|---------|
| `packages/backend/convex/scheduling.ts` | Add 3 functions: trigger, fetch, process |
| `packages/backend/convex/crons.ts` | Add `sync-leaderboard-whales` cron |
| `packages/backend/convex/schema.ts` | Add `leaderboard-whales` to syncLogs type |

### Existing Code to Use
- `upsertWhale` mutation at `whales.ts:297`
- `retrier.run()` for action retry
- `delay()` helper if needed

## Implementation Steps

### Step 1: Update Schema (schema.ts)

Add `leaderboard-whales` to syncLogs type union:

```typescript
// Line ~200 in schema.ts
syncLogs: defineTable({
  type: v.union(
    v.literal("markets"),
    v.literal("whales"),
    v.literal("stats"),
    v.literal("alert-prices"),
    v.literal("leaderboard-whales"),  // ADD THIS
    v.literal("market-holders")        // ADD THIS (for Phase 2)
  ),
  // ... rest unchanged
})
```

### Step 2: Add Leaderboard API Types (scheduling.ts)

Add near top of file after existing interfaces:

```typescript
// ============ LEADERBOARD SYNC TYPES ============

const LEADERBOARD_PROXY_URL = "https://proxy.opinion.trade:8443/api/bsc/api/v2";

interface LeaderboardTrader {
  walletAddress: string;
  userName: string;
  avatar: string;
  rankingValue: number;
  xUsername?: string;
  xUserId?: string;
}

interface LeaderboardApiResponse {
  errno: number;
  result: {
    list: LeaderboardTrader[];
  };
}

function isValidLeaderboardTrader(obj: unknown): obj is LeaderboardTrader {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "walletAddress" in obj &&
    typeof (obj as { walletAddress: unknown }).walletAddress === "string" &&
    (obj as { walletAddress: string }).walletAddress.length > 0
  );
}
```

### Step 3: Add Trigger Mutation (scheduling.ts)

```typescript
// ============ LEADERBOARD WHALE SYNC ============

export const triggerLeaderboardSync = internalMutation({
  args: {},
  handler: async (ctx) => {
    const syncId = await ctx.db.insert("syncLogs", {
      type: "leaderboard-whales",
      status: "running",
      startedAt: Date.now(),
    });

    await retrier.run(ctx, internal.scheduling.fetchLeaderboardData, { syncId });

    return { syncId };
  },
});
```

### Step 4: Add Fetch Action (scheduling.ts)

```typescript
export const fetchLeaderboardData = internalAction({
  args: { syncId: v.id("syncLogs") },
  handler: async (ctx, args) => {
    // Fetch top 100 traders by volume
    const response = await fetch(
      `${LEADERBOARD_PROXY_URL}/leaderboard?limit=100&dataType=volume&chainId=56&period=0`
    );

    if (!response.ok) {
      await ctx.runMutation(internal.scheduling.markSyncFailed, {
        syncId: args.syncId,
        error: `Leaderboard API error: ${response.status}`,
      });
      throw new Error(`Leaderboard API error: ${response.status}`);
    }

    const data: LeaderboardApiResponse = await response.json();

    if (data.errno !== 0 || !data.result?.list) {
      await ctx.runMutation(internal.scheduling.markSyncFailed, {
        syncId: args.syncId,
        error: `Invalid leaderboard response: errno=${data.errno}`,
      });
      throw new Error("Invalid leaderboard response structure");
    }

    // Filter valid traders
    const validTraders = data.result.list.filter(isValidLeaderboardTrader);

    await ctx.runMutation(internal.scheduling.processLeaderboardResults, {
      syncId: args.syncId,
      traders: validTraders,
      skippedCount: data.result.list.length - validTraders.length,
    });

    return { syncId: args.syncId, traderCount: validTraders.length };
  },
});
```

### Step 5: Add Process Mutation (scheduling.ts)

```typescript
export const processLeaderboardResults = internalMutation({
  args: {
    syncId: v.id("syncLogs"),
    traders: v.array(
      v.object({
        walletAddress: v.string(),
        userName: v.string(),
        avatar: v.string(),
        rankingValue: v.number(),
        xUsername: v.optional(v.string()),
        xUserId: v.optional(v.string()),
      })
    ),
    skippedCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { syncId, traders, skippedCount = 0 } = args;
    let processedCount = 0;
    let errorCount = 0;

    for (const trader of traders) {
      try {
        await ctx.runMutation(internal.whales.upsertWhale, {
          address: trader.walletAddress,
          nickname: trader.userName || undefined,
          avatar: trader.avatar || undefined,
          totalVolume: trader.rankingValue, // Volume in USD
        });
        processedCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to upsert whale ${trader.walletAddress}:`, error);
      }
    }

    const hasErrors = errorCount > 0 || skippedCount > 0;
    const status = processedCount === 0 && hasErrors ? "failed" : "completed";

    await ctx.db.patch(syncId, {
      status,
      endedAt: Date.now(),
      itemCount: processedCount,
      error: hasErrors
        ? `Processed: ${processedCount}, Errors: ${errorCount}, Skipped: ${skippedCount}`
        : undefined,
    });

    return { processedCount, errorCount, skippedCount };
  },
});
```

### Step 6: Add Cron Job (crons.ts)

```typescript
// Leaderboard whale discovery - daily at 4 AM UTC
crons.daily(
  "sync-leaderboard-whales",
  { hourUTC: 4, minuteUTC: 0 },
  internal.scheduling.triggerLeaderboardSync
);
```

## Todo List

- [x] Update schema.ts with new syncLogs types
- [x] Add leaderboard types and type guard to scheduling.ts
- [x] Implement triggerLeaderboardSync mutation
- [x] Implement fetchLeaderboardData action
- [x] Implement processLeaderboardResults mutation
- [x] Add cron job to crons.ts
- [x] Test locally with `npx convex run scheduling:triggerLeaderboardSync`
- [x] Verify sync logs show correct data

## Success Criteria

- [x] Cron triggers daily at 4 AM UTC
- [x] API fetch returns 100 traders
- [x] Each trader upsets correctly (no duplicates)
- [x] SyncLog shows type "leaderboard-whales"
- [x] Error handling marks failed syncs properly

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API endpoint changes | Low | High | Log response structure, alert on parse failures |
| API downtime | Medium | Low | Retrier handles transient failures |
| Rate limiting | Low | Low | Single call, well within limits |

## Security Considerations

- No API key required (public endpoint)
- Wallet addresses are public blockchain data
- No sensitive data stored beyond public trader info

## Next Steps

After Phase 1 completion:
1. Monitor sync logs for first few days
2. Proceed to Phase 2: Market Holders Sync
3. Consider adding X/Twitter profile linking (xUsername, xUserId)
