# Scout Report: Leaderboard Synchronization Logic

**Date:** 2026-01-21 | **Status:** Complete

## Executive Summary

The backend contains a comprehensive multi-tier leaderboard synchronization system with modular cron jobs, volume tracking, and whale discovery mechanisms. The system syncs from Opinion.Trade API via a proxy, maintains denormalized whale statistics, and tracks all sync operations with detailed logging.

---

## 1. Leaderboard Sync - Primary File

**File:** `D:/works/cv/opinion-scope/packages/backend/convex/scheduling/leaderboardSync.ts` (258 lines)

Syncs top traders from Opinion.Trade leaderboard API:
- **Data Types:** volume, profit, points
- **Periods:** 0 (all-time), 1 (24h), 7 (7d), 30 (30d)
- **Points:** Only periods 0, 7
- **API Endpoint:** `https://proxy.opinion.trade:8443/api/bsc/api/v2/leaderboard`
- **Cron Schedule:** Daily 4 AM UTC
- **Rate Limiting:** 200ms between API calls (8 total calls per run)

### Execution Flow
```
triggerLeaderboardSync (mutation)
  ↓ retrier.run()
  ↓
fetchAllLeaderboards (action)
  ↓ loop through dataType/period combinations
  ↓
processLeaderboardResults (mutation)
  ↓ upsertWhale for each trader
  ↓
markSyncCompleted (mutation)
```

### Field Mapping
- volume-0 → whale.totalVolume
- volume-1 → whale.volume24h
- volume-7 → whale.volume7d
- volume-30 → whale.volume30d
- profit-0 → whale.totalPnl
- profit-1 → whale.pnl24h
- profit-7 → whale.pnl7d
- profit-30 → whale.pnl30d
- points-0 → whale.totalPoints
- points-7 → whale.points7d

---

## 2. Volume Sync Operations

Three-tier volume sync system:

### 2a. Leaderboard Volume (Daily 4 AM)
- Source: leaderboardSync.ts
- Updates: totalVolume, volume24h, volume7d, volume30d on whales table
- 8 API calls (volume×4, profit×4, points×2)

### 2b. Market Volume (Every 15 min)
- File: `D:/works/cv/opinion-scope/packages/backend/convex/scheduling/marketSync.ts` (114 lines)
- Fetches: all active markets from Opinion.Trade API
- Updates: markets.volume, markets.volume24h, markets.volume7d
- Flattens: binary markets (type 0) + categorical children (type 1)

### 2c. Whale Activity Volume (DISABLED)
- File: `D:/works/cv/opinion-scope/packages/backend/convex/scheduling/whaleSync.ts` (112 lines)
- Status: Disabled due to Opinion.Trade API issues (crons.ts lines 24-30)
- Would: Fetch trades per whale, update whaleActivity.amount
- Would aggregate: Via computeWhaleStats hourly

---

## 3. Whale Discovery

### Active: Leaderboard-Based (Daily 4 AM)
- Schedule: Daily 4 AM UTC
- Source: Opinion.Trade global leaderboard ranking API
- Data Type: "leaderboard"
- Sync Log: "leaderboard-whales"
- Scale: Top 100 traders × 8 combinations
- Dedup: By wallet address

### Disabled: Market Holders (Future)
- File: `D:/works/cv/opinion-scope/packages/backend/convex/scheduling/marketHoldersSync.ts` (112 lines, commented)
- Purpose: Fetch YES/NO holders per market
- Rate Limit: 5 markets/batch, 100ms between sides
- Status: Disabled - API rate limiting concerns
- Sync Log: "market-holders"

---

## 4. Database Schema - Leaderboard Fields

**Whales Table:** `D:/works/cv/opinion-scope/packages/backend/convex/schema.ts` (lines 54-95)

### Leaderboard-Synced Fields
```
Volumes:
  totalVolume, volume24h, volume7d, volume30d

P&L:
  totalPnl, pnl24h, pnl7d, pnl30d

Points:
  totalPoints, points7d

Activity-Computed:
  tradeCount, lastActiveAt

Data Source:
  dataType (leaderboard | other)
```

### Indexes for Leaderboard Queries
- by_totalVolume
- by_volume24h
- by_pnl24h
- by_totalPnl
- by_totalPoints
- by_points7d

---

## 5. Sync Logs Tracking

**Table:** `D:/works/cv/opinion-scope/packages/backend/convex/schema.ts` (lines 215-237)

Types:
- markets
- whales (activity)
- stats (computation)
- alert-prices
- leaderboard-whales ← Primary
- market-holders (disabled)

Each entry: type, status, startedAt, endedAt, itemCount, error

---

## 6. Cron Jobs

**File:** `D:/works/cv/opinion-scope/packages/backend/convex/crons.ts` (65 lines)

### Active
1. sync-markets (15min) - Market volume sync
2. sync-alert-prices (5min) - Token prices
3. compute-whale-stats (hourly :00) - Activity aggregation
4. cleanup-old-activity (daily 3 AM) - 1-day retention
5. sync-leaderboard-whales (daily 4 AM) - Leaderboard discovery

### Disabled
- sync-whale-trades - Opinion.Trade API issues
- sync-market-holders - API rate limiting concerns

---

## 7. Sync Interactions

### Volume Data Flow
```
Leaderboard Sync (daily 4 AM)
  ↓ volume API value
  ↓ whale.totalVolume, volume24h, volume7d, volume30d

Market Volume Sync (15min)
  ↓ market.volume
  ↓ markets table ONLY

Whale Activity Sync (DISABLED)
  ↓ trade amounts
  ↓ whaleActivity records
  ↓ computeWhaleStats aggregates (hourly)
```

### Conflict Resolution
- Leaderboard + Activity both update totalVolume
- Last write wins (no explicit strategy)
- Currently: Leaderboard data dominates (activity sync disabled)

---

## 8. Shared Infrastructure

**Location:** `D:/works/cv/opinion-scope/packages/backend/convex/scheduling/shared/`

- types.ts (155 lines) - API response interfaces
- typeGuards.ts (93 lines) - Response validators
- constants.ts (23 lines) - Batch sizes, URLs, delays
- helpers.ts (35 lines) - API key validation, utilities
- index.ts (42 lines) - Barrel export

### Key Constants
```
WHALE_BATCH_SIZE = 3
BATCH_DELAY_MS = 1500
LEADERBOARD_PROXY_URL = https://proxy.opinion.trade:8443/api/bsc/api/v2
TOKEN_BATCH_SIZE = 10
TOKEN_BATCH_DELAY_MS = 100
```

---

## 9. Whale Stats Computation

**File:** `D:/works/cv/opinion-scope/packages/backend/convex/scheduling/statsComputation.ts` (69 lines)

- Runs: Hourly at :00
- Aggregates: whaleActivity records
- Updates: totalVolume, tradeCount, lastActiveAt
- Status: Currently empty (whale activity sync disabled)

---

## 10. Related Frontend

**File:** `D:/works/cv/opinion-scope/packages/backend/convex/whales.ts` (539 lines)

### getLeaderboard() Query
- sortBy: totalVolume, totalPnl, volume24h, pnl24h, totalPoints, points7d
- limit: 50 default, max 100
- filters: null/zero values for sort field
- returns: whales array, isLimited flag

---

## File Structure

```
D:/works/cv/opinion-scope/packages/backend/convex/
├── crons.ts (65)
├── schema.ts (265)
├── whales.ts (539)
├── markets.ts
├── whaleActivity.ts
│
├── scheduling/
│   ├── leaderboardSync.ts (258) ★★★ PRIMARY
│   ├── marketSync.ts (114)
│   ├── whaleSync.ts (112) [DISABLED]
│   ├── alertPriceSync.ts (107)
│   ├── marketHoldersSync.ts (112) [DISABLED]
│   ├── statsComputation.ts (69)
│   ├── cleanup.ts (84)
│   └── shared/
│       ├── types.ts (155)
│       ├── typeGuards.ts (93)
│       ├── constants.ts (23)
│       ├── helpers.ts (35)
│       └── index.ts (42)
```

---

## Key Insights

1. **Multi-tier Discovery:** Leaderboard (active) + Market Holders (disabled)
2. **Period-Specific Fields:** Each period (24h/7d/30d) stored as separate field
3. **Flexible Upserts:** Only provided fields updated, preserves unrelated data
4. **Rate Limited:** 200ms leaderboard, 100ms tokens, 1.5s whale batches
5. **Comprehensive Logging:** Every sync tracked with type/status/count/errors
6. **Graceful Degradation:** Works with leaderboard alone if activity unavailable

---

## Unresolved Questions

- When was whale activity sync disabled and for what specific API issue?
- What is the impact of disabled market holders sync on coverage?
- How should conflicts between leaderboard and activity volume be resolved?
- Are there plans to re-enable whale activity sync?

