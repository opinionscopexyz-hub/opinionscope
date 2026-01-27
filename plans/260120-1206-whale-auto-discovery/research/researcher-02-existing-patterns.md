# Existing Whale Sync Implementation Analysis

## Sync Pipeline Pattern

**Three-stage pattern:** Trigger (mutation) → Fetch (action) → Process (mutation)

1. **Trigger (`triggerWhaleSync`)**: Creates syncLog entry, retrieves tracked whale addresses, schedules fetch via retrier
2. **Fetch (`fetchWhaleActivity`)**: HTTP action with rate limiting, transforms Opinion.Trade API responses, returns activities list
3. **Process (`processWhaleSyncResults`)**: Mutation that records activity, updates stats, logs results

## Retrier Usage

`retrier.run(ctx, internal.scheduling.fetchWhaleActivity, { syncId, whaleAddresses })`

- Wraps flaky API calls with retry logic
- Provides automatic error recovery
- Called from trigger mutation (enables retries within internal transactions)
- Returns when action completes

## Rate Limiting Strategy

- **Whale batch size**: 5 addresses per batch (WHALE_BATCH_SIZE)
- **Batch delay**: 1000ms between batches (BATCH_DELAY_MS)
- **Effective rate**: ~5 req/sec (within Opinion.Trade's 15 req/sec limit)
- **Token pricing**: Same pattern in alert-prices (TOKEN_BATCH_SIZE=10, delay=100ms)

## SyncLogs Table Usage

```typescript
// Insert with metadata
await ctx.db.insert("syncLogs", {
  type: "whales",
  status: "running",
  startedAt: Date.now(),
});

// Update with results
await ctx.db.patch(syncId, {
  status: "completed|failed",
  endedAt: Date.now(),
  itemCount: newActivityCount,
  error: "detailed error summary"
});
```

Tracks: type, status, timing, item counts, error summaries. Used for monitoring/debugging.

## upsertWhale Mutation Signature

```typescript
export const upsertWhale = internalMutation({
  args: {
    address: v.string(),
    nickname?: v.string(),
    avatar?: v.string(),
    isVerified?: v.boolean(),
    winRate?: v.number(),
    totalVolume?: v.number(),
    totalPnl?: v.number(),
    tradeCount?: v.number(),
    winStreak?: v.number(),
    lossStreak?: v.number(),
    resolvedTrades?: v.number(),
    wonTrades?: v.number(),
    favoriteCategories?: v.array(v.string()),
    platforms?: v.array(v.string()),
  }
});
```

**Behavior**: Lookup by address via `by_address` index. If exists: patch with data + update `lastActiveAt`/`updatedAt`. If new: insert with defaults (followerCount=0, platforms=["opinion_trade"]).

**NOT USED** in whale sync currently - called via `recordActivity` instead for trade events.
