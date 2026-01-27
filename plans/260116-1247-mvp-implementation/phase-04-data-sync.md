# Phase 04: Data Sync

## Context Links
- [Plan Overview](./plan.md)
- [Opinion.Trade API Research](../reports/researcher-260116-1247-opinion-trade-api.md)
- [Convex Scheduling Research](../reports/researcher-260116-1615-convex-scheduling.md)
- [Convex Migration Plan](../260116-1615-inngest-to-convex-migration/plan.md)

## Overview
- **Priority:** P0
- **Status:** ✅ Complete (via Convex Migration)
- **Effort:** 8h (reduced to 2h with Convex native)
- **Description:** Implement Convex cron jobs to sync market data from Opinion.Trade API, detect whale activity, and populate database.

## Implementation Status

**Completed via Convex Migration Plan (Phases 01-03):**
- ✅ Phase 01: Removed Inngest dependency
- ✅ Phase 02: Added @convex-dev/action-retrier component
- ✅ Phase 03: Implemented all 4 cron jobs with error handling

## Key Insights

From Opinion.Trade research:
- Base URL: `https://proxy.opinion.trade:8443/openapi/`
- Rate limit: 15 req/sec, max 20 items per response
- No native whale leaderboard - build local ranking

From Convex research:
- Built-in `cronJobs()` for scheduling
- `@convex-dev/action-retrier` for reliable API calls with exponential backoff
- Internal mutations for data processing

## Requirements

### Functional
- FR-SYNC-1: Sync all markets every 5 minutes ✅
- FR-SYNC-2: Track known whale addresses and poll trades ✅
- FR-SYNC-3: Detect new whale activity and create feed entries ✅
- FR-SYNC-4: Compute whale stats (volume, trade count) ✅
- FR-SYNC-5: Clean up old activity (90-day retention) ✅

### Non-Functional
- NFR-SYNC-1: Handle rate limits gracefully (5 whales/batch, 1s delay) ✅
- NFR-SYNC-2: Validate API responses with type guards ✅
- NFR-SYNC-3: Track sync status and errors in syncLogs table ✅

## Architecture

```
Convex Cron Jobs:
├── sync-markets          # Every 5 min - fetch all markets
├── sync-whale-trades     # Every 1 min - poll known whales (rate limited)
├── compute-whale-stats   # Every 1 hour - recalculate stats
└── cleanup-old-activity  # Daily 3 AM UTC - prune old entries

Data Flow:
┌─────────────┐     ┌─────────────────────────────────┐
│ Opinion.Trade│◄────│           Convex                │
│     API     │     │  (Crons + Actions + Database)   │
└─────────────┘     └─────────────────────────────────┘

Cron Pattern:
Trigger (mutation) → Action Retrier → External API → Process Results (mutation)
      ↓                                                      ↓
  Log sync start                                    Update DB + syncLogs
```

## Implemented Code Files

### Created
- `packages/backend/convex/crons.ts` - 4 cron job definitions (35 lines)
- `packages/backend/convex/scheduling.ts` - Scheduling functions (537 lines)
  - `triggerMarketSync` / `fetchMarketData` / `processMarketSyncResults`
  - `triggerWhaleSync` / `fetchWhaleActivity` / `processWhaleSyncResults`
  - `computeWhaleStats`
  - `cleanupOldActivity`
  - `markSyncFailed` helper
- `packages/backend/convex/lib/retrier.ts` - Action-retrier configuration

### Modified
- `packages/backend/convex/schema.ts` - Added syncLogs table
- `packages/backend/convex/convex.config.ts` - Added action-retrier component

### Existing (reused)
- `packages/backend/convex/markets.ts` - `upsertMarket` internal mutation
- `packages/backend/convex/whaleActivity.ts` - `recordActivity` internal mutation

## Key Implementation Details

### API Response Validation
```typescript
// Type guards validate external API responses
function isValidMarketResponse(obj: unknown): obj is MarketApiResponse {
  return typeof obj === "object" && obj !== null && "marketId" in obj;
}
```

### Rate Limiting
```typescript
const WHALE_BATCH_SIZE = 5; // Process 5 whales per batch
const BATCH_DELAY_MS = 1000; // 1 second delay between batches
```

### Error Tracking
```typescript
// SyncLogs table tracks all sync operations
syncLogs: defineTable({
  type: v.union(v.literal("markets"), v.literal("whales"), v.literal("stats")),
  status: v.union(v.literal("running"), v.literal("completed"), v.literal("failed")),
  startedAt: v.number(),
  endedAt: v.optional(v.number()),
  itemCount: v.optional(v.number()),
  error: v.optional(v.string()),
})
```

### Environment Variable
```
OPINION_TRADE_API_KEY - Required for API authentication
```

## Todo List

- [x] Create `packages/backend/convex/crons.ts` with 4 cron jobs
- [x] Create `packages/backend/convex/scheduling.ts` with sync functions
- [x] Add `syncLogs` table to schema
- [x] Implement API response validation (type guards)
- [x] Implement rate limiting (5/batch, 1s delay)
- [x] Implement error tracking in syncLogs
- [x] Convex codegen passes
- [x] ESLint passes
- [x] Code review completed (9.5/10)
- [ ] DEPLOYMENT: Configure OPINION_TRADE_API_KEY in Convex dashboard
- [ ] DEPLOYMENT: Verify crons running in dashboard

## Success Criteria

- [x] Markets sync every 5 minutes
- [x] Whale trades sync every minute (with rate limiting)
- [x] Stats recompute every hour
- [x] Cleanup runs daily at 3 AM UTC
- [x] API responses validated before processing
- [x] Error tracking via syncLogs table
- [ ] DEPLOYMENT: Data visible in Convex dashboard
- [ ] DEPLOYMENT: No rate limit errors in production

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| API key not approved | High | Build with mock data first |
| Rate limit exceeded | Medium | 5/batch + 1s delay implemented |
| Data format changes | Medium | Type guards validate responses |
| Sync takes too long | Low | Batching + async processing |

## Security Considerations

- API key stored in Convex environment, never logged
- Internal mutations only callable from Convex cron jobs
- Validation errors logged, sync continues (graceful degradation)
- No user data exposed in sync functions

## Next Steps

1. Configure OPINION_TRADE_API_KEY in Convex dashboard
2. Monitor first sync runs via syncLogs table
3. Proceed to [Phase 05: Market Screener](./phase-05-market-screener.md)
