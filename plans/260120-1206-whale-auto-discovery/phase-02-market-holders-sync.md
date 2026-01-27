# Phase 2: Market Holders Sync

## Context Links
- [scheduling.ts](../../packages/backend/convex/scheduling.ts) - Sync handlers
- [whales.ts](../../packages/backend/convex/whales.ts) - upsertWhale mutation
- [crons.ts](../../packages/backend/convex/crons.ts) - Cron definitions
- [markets.ts](../../packages/backend/convex/markets.ts) - Market queries
- [Phase 1](./phase-01-global-leaderboard-sync.md) - Prerequisite phase

## Overview
- **Priority**: Medium
- **Status**: Complete
- **Effort**: 1.5 hours
- **Description**: 6-hourly discovery of market-specific whales via top holders API

## Key Insights

1. **API Endpoint**:
   - URL: `https://proxy.opinion.trade:8443/api/bsc/api/v2/topic/{marketId}/holder`
   - Params: `type=yes|no`, `chainId=56`, `page=1`, `limit=100`
   - No API key required

2. **Response Structure**:
   ```typescript
   interface HolderResponse {
     errno: number;
     result: {
       list: Array<{
         walletAddress: string;
         userName: string;
         avatar: string;
         profit: number;
         sharesAmount: number;
       }>;
     };
   }
   ```

3. **Discovery Strategy**:
   - Query active markets (not resolved)
   - Fetch top 100 holders for YES and NO sides
   - Discover whales not in global leaderboard

4. **Rate Limiting**:
   - 5 markets per batch, 1s delay between batches
   - 2 API calls per market (YES + NO holders)

## Requirements

### Functional
- Query active markets from DB
- For each market: fetch top holders for YES and NO
- Upsert discovered holders as whales
- Log sync results to `syncLogs` table
- Run every 6 hours

### Non-Functional
- Rate limit: 5 markets/batch, 1s delay
- Use retrier for reliability
- Handle large market counts gracefully
- Complete within 5 minutes (typical ~50 markets)

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                   Cron: Every 6 Hours                      │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│         triggerMarketHoldersSync (internalMutation)        │
│  - Create syncLog entry (type: "market-holders")           │
│  - Query active markets from DB                            │
│  - Schedule fetchMarketHolders with retrier                │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│            fetchMarketHolders (internalAction)             │
│  - For each market (batched, rate limited):                │
│    - GET .../topic/{marketId}/holder?type=yes              │
│    - GET .../topic/{marketId}/holder?type=no               │
│  - Collect unique wallet addresses                         │
│  - Call processMarketHoldersResults mutation               │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│       processMarketHoldersResults (internalMutation)       │
│  - Dedupe by wallet address                                │
│  - For each holder: call upsertWhale                       │
│  - Update syncLog with results                             │
└────────────────────────────────────────────────────────────┘
```

## Related Code Files

### Files to Modify
| File | Changes |
|------|---------|
| `packages/backend/convex/scheduling.ts` | Add 3 functions: trigger, fetch, process |
| `packages/backend/convex/crons.ts` | Add `sync-market-holders` cron |

### Files Already Modified in Phase 1
| File | Status |
|------|--------|
| `packages/backend/convex/schema.ts` | `market-holders` type already added |

### Existing Code to Use
- `upsertWhale` mutation at `whales.ts:297`
- `retrier.run()` for action retry
- `delay()` helper from scheduling.ts
- `WHALE_BATCH_SIZE` (5) and `BATCH_DELAY_MS` (1000) constants

## Implementation Steps

### Step 1: Add Holder API Types (scheduling.ts)

Add after leaderboard types:

```typescript
// ============ MARKET HOLDERS SYNC TYPES ============

const MARKET_HOLDERS_BATCH_SIZE = 5; // 5 markets per batch (10 API calls)
const HOLDERS_PER_MARKET = 100; // Top 100 per side (200 total per market)

interface MarketHolder {
  walletAddress: string;
  userName: string;
  avatar: string;
  profit: number;
  sharesAmount: number;
}

interface HolderApiResponse {
  errno: number;
  result: {
    list: MarketHolder[];
  };
}

function isValidHolder(obj: unknown): obj is MarketHolder {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "walletAddress" in obj &&
    typeof (obj as { walletAddress: unknown }).walletAddress === "string" &&
    (obj as { walletAddress: string }).walletAddress.length > 0
  );
}
```

### Step 2: Add Trigger Mutation (scheduling.ts)

```typescript
// ============ MARKET HOLDERS WHALE SYNC ============

export const triggerMarketHoldersSync = internalMutation({
  args: {},
  handler: async (ctx) => {
    const syncId = await ctx.db.insert("syncLogs", {
      type: "market-holders",
      status: "running",
      startedAt: Date.now(),
    });

    // Get active markets (not resolved, has externalId)
    const activeMarkets = await ctx.db
      .query("markets")
      .filter((q) =>
        q.and(
          q.eq(q.field("platform"), "opinion_trade"),
          q.eq(q.field("resolvedAt"), undefined)
        )
      )
      .collect();

    if (activeMarkets.length === 0) {
      await ctx.db.patch(syncId, {
        status: "completed",
        endedAt: Date.now(),
        itemCount: 0,
      });
      return { syncId, message: "No active markets to scan" };
    }

    // Extract external IDs for API calls
    const marketIds = activeMarkets.map((m) => m.externalId);

    await retrier.run(ctx, internal.scheduling.fetchMarketHolders, {
      syncId,
      marketIds,
    });

    return { syncId, marketCount: marketIds.length };
  },
});
```

### Step 3: Add Fetch Action (scheduling.ts)

```typescript
export const fetchMarketHolders = internalAction({
  args: {
    syncId: v.id("syncLogs"),
    marketIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { syncId, marketIds } = args;

    // Collect all unique holders across markets
    const holdersMap = new Map<string, {
      walletAddress: string;
      userName: string;
      avatar: string;
      totalProfit: number;
    }>();

    let fetchErrors = 0;
    let marketsProcessed = 0;

    // Process markets in batches
    for (let i = 0; i < marketIds.length; i += MARKET_HOLDERS_BATCH_SIZE) {
      // Add delay between batches (except first)
      if (i > 0) {
        await delay(BATCH_DELAY_MS);
      }

      const batch = marketIds.slice(i, i + MARKET_HOLDERS_BATCH_SIZE);

      for (const marketId of batch) {
        // Fetch YES holders
        try {
          const yesHolders = await fetchHoldersForSide(marketId, "yes");
          for (const holder of yesHolders) {
            updateHolderMap(holdersMap, holder);
          }
        } catch (error) {
          fetchErrors++;
          console.error(`Failed to fetch YES holders for ${marketId}:`, error);
        }

        // Small delay between YES and NO calls
        await delay(100);

        // Fetch NO holders
        try {
          const noHolders = await fetchHoldersForSide(marketId, "no");
          for (const holder of noHolders) {
            updateHolderMap(holdersMap, holder);
          }
        } catch (error) {
          fetchErrors++;
          console.error(`Failed to fetch NO holders for ${marketId}:`, error);
        }

        marketsProcessed++;
      }
    }

    // Convert to array for mutation
    const holders = Array.from(holdersMap.values());

    await ctx.runMutation(internal.scheduling.processMarketHoldersResults, {
      syncId,
      holders,
      fetchErrors,
      marketsProcessed,
    });

    return { syncId, holderCount: holders.length, marketsProcessed };
  },
});

// Helper: Fetch holders for a specific side
async function fetchHoldersForSide(
  marketId: string,
  side: "yes" | "no"
): Promise<MarketHolder[]> {
  const response = await fetch(
    `${LEADERBOARD_PROXY_URL}/topic/${marketId}/holder?type=${side}&chainId=56&page=1&limit=${HOLDERS_PER_MARKET}`
  );

  if (!response.ok) {
    throw new Error(`Holder API error: ${response.status}`);
  }

  const data: HolderApiResponse = await response.json();

  if (data.errno !== 0 || !data.result?.list) {
    return [];
  }

  return data.result.list.filter(isValidHolder);
}

// Helper: Update holder map (aggregate profit across markets)
function updateHolderMap(
  map: Map<string, {
    walletAddress: string;
    userName: string;
    avatar: string;
    totalProfit: number;
  }>,
  holder: MarketHolder
): void {
  const existing = map.get(holder.walletAddress);
  if (existing) {
    existing.totalProfit += holder.profit;
    // Update name/avatar if newer data available
    if (holder.userName) existing.userName = holder.userName;
    if (holder.avatar) existing.avatar = holder.avatar;
  } else {
    map.set(holder.walletAddress, {
      walletAddress: holder.walletAddress,
      userName: holder.userName,
      avatar: holder.avatar,
      totalProfit: holder.profit,
    });
  }
}
```

### Step 4: Add Process Mutation (scheduling.ts)

```typescript
export const processMarketHoldersResults = internalMutation({
  args: {
    syncId: v.id("syncLogs"),
    holders: v.array(
      v.object({
        walletAddress: v.string(),
        userName: v.string(),
        avatar: v.string(),
        totalProfit: v.number(),
      })
    ),
    fetchErrors: v.optional(v.number()),
    marketsProcessed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { syncId, holders, fetchErrors = 0, marketsProcessed = 0 } = args;
    let processedCount = 0;
    let errorCount = 0;
    let newWhalesCount = 0;

    for (const holder of holders) {
      try {
        // Check if whale already exists
        const existing = await ctx.db
          .query("whales")
          .withIndex("by_address", (q) => q.eq("address", holder.walletAddress))
          .unique();

        if (!existing) {
          newWhalesCount++;
        }

        await ctx.runMutation(internal.whales.upsertWhale, {
          address: holder.walletAddress,
          nickname: holder.userName || undefined,
          avatar: holder.avatar || undefined,
          totalPnl: holder.totalProfit,
        });
        processedCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to upsert holder ${holder.walletAddress}:`, error);
      }
    }

    const hasErrors = errorCount > 0 || fetchErrors > 0;
    const status = processedCount === 0 && hasErrors ? "failed" : "completed";

    await ctx.db.patch(syncId, {
      status,
      endedAt: Date.now(),
      itemCount: processedCount,
      error: hasErrors
        ? `Markets: ${marketsProcessed}, Holders: ${processedCount}, New: ${newWhalesCount}, FetchErrs: ${fetchErrors}, ProcessErrs: ${errorCount}`
        : `Markets: ${marketsProcessed}, Holders: ${processedCount}, New: ${newWhalesCount}`,
    });

    return { processedCount, errorCount, newWhalesCount };
  },
});
```

### Step 5: Add Cron Job (crons.ts)

```typescript
// Market holders whale discovery - every 6 hours
crons.interval(
  "sync-market-holders",
  { hours: 6 },
  internal.scheduling.triggerMarketHoldersSync
);
```

## Todo List

- [x] Add holder types and helpers to scheduling.ts
- [x] Implement triggerMarketHoldersSync mutation
- [x] Implement fetchMarketHolders action
- [x] Implement fetchHoldersForSide helper
- [x] Implement updateHolderMap helper
- [x] Implement processMarketHoldersResults mutation
- [x] Add cron job to crons.ts
- [x] Test locally with `npx convex run scheduling:triggerMarketHoldersSync`
- [x] Verify new whales discovered beyond leaderboard

## Success Criteria

- [x] Cron triggers every 6 hours
- [x] Active markets scanned successfully
- [x] Both YES and NO holders fetched per market
- [x] Holders deduplicated by wallet address
- [x] SyncLog shows type "market-holders"
- [x] SyncLog includes new whales count
- [x] Rate limiting prevents API throttling

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Large market count | Medium | Medium | Batch processing, reasonable limits |
| API rate limiting | Low | Medium | 5 markets/batch, 1s delays |
| Duplicate API calls | Low | Low | Dedup via Map before processing |
| Long sync duration | Medium | Low | Monitor duration, adjust batch size |

## Security Considerations

- No API key required (public endpoint)
- Wallet addresses and profits are public blockchain data
- No sensitive data stored

## Next Steps

After Phase 2 completion:
1. Monitor sync logs for holder discovery rate
2. Analyze overlap between leaderboard and holder-discovered whales
3. Consider adding "discovered via" field to track source
4. Evaluate adjusting sync frequency based on discovery rate
