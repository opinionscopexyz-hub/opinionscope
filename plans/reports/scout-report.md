# Scout Report: Leaderboard & Whale System

Date: 2026-01-20 | Time: 16:29

## 1. Leaderboard API Implementation

### Backend
**File:** `packages/backend/convex/scheduling/leaderboardSync.ts`

- `triggerLeaderboardSync()` - Start sync
- `fetchLeaderboardData()` - Call proxy API
- `processLeaderboardResults()` - Upsert whales

**Endpoint:** `https://proxy.opinion.trade:8443/api/bsc/api/v2/leaderboard?limit=100&dataType=volume&chainId=56&period=0`

### Frontend
**File:** `apps/web/src/components/whales/leaderboard.tsx`

- `useQuery(api.whales.getLeaderboard, {})`
- Sorting: winRate, totalVolume, totalPnl, followerCount
- Tier limits: Free=10, Pro=50, Pro+=Infinity
- Min trades: 20

## 2. Database Schema

### Whale
**File:** `packages/backend/convex/schema.ts` (lines 52-78)

Fields: address, nickname, avatar, isVerified, winRate, totalVolume, totalPnl, tradeCount, winStreak, lossStreak, resolvedTrades, wonTrades, lastActiveAt, favoriteCategories, platforms, followerCount

Indexes: by_address, by_winRate, by_totalVolume, by_lastActiveAt, by_followerCount

### User
**File:** `packages/backend/convex/schema.ts` (lines 31-50)

Fields: clerkId, email, tier, tierExpiresAt, followedWhaleIds, notificationPreferences

Indexes: by_clerkId, by_email, by_tier

### Whale Activity
**File:** `packages/backend/convex/schema.ts` (lines 128-150)

Fields: whaleId, marketId, action, outcome, outcomeSide, amount, price, platform, timestamp, visibleToProPlusAt, visibleToProAt, visibleToFreeAt

Indexes: by_timestamp, by_whaleId_timestamp, by_marketId_timestamp, by_visibleToProPlus, by_visibleToPro, by_visibleToFree

## 3. Caching Strategies

### Backend
1. **Denormalized Stats** - Pre-computed fields on whales table
2. **Indexing** - by_whaleId_timestamp for sorting
3. **Tiered Visibility** - 3 timestamps for Pro+/Pro/Free access
4. **Set Lookups** - O(1) membership tests for followed whales

### Frontend
1. **Convex Cache** - Automatic via useQuery
2. **Pagination** - Cursor-based with timestamp
3. **Skeleton Loading** - While result === undefined
4. **Related Data** - Backend pre-fetches whale + market

### Sync
- Retry: 500ms, 1s, 2s, 4s (exponential, max 4 attempts)
- Sync logs track: type, status, timestamps, error count
- Batch processing with rate limits

## 4. Frontend State Management

### Pattern 1: Simple Hook (use-current-user.ts)
```
user = useQuery(api.users.getCurrentUser)
Returns: user, isLoading, isAuthenticated, tier, isPro, isProPlus
```

### Pattern 2: Filtered Query (use-activity-feed.ts)
```
filters state: {followedOnly, minAmount}
Query args conditional based on tier
Returns: activities, hasMore, filters, setFilters, canFilter, delayLabel
```

### Pattern 3: Tier Limits (leaderboard.tsx)
```
tierLimit = free ? 10 : pro ? 50 : Infinity
showUpgrade = tier !== pro_plus && whales.length >= tierLimit
```

### Pattern 4: Related Data Enrichment
```
Backend parallel fetch: [whale, market] = await Promise.all([...])
Frontend gets complete object graph
```

## 5. Tier System

**Free:**
- Leaderboard: 10
- Recent trades: 3
- Followed whales: 3
- Delay: 15 minutes
- Alerts: 3

**Pro:**
- Leaderboard: 50
- Recent trades: 10
- Followed whales: 20
- Delay: 30 seconds
- Alerts: 50

**Pro+:**
- Leaderboard: Unlimited
- Recent trades: 50
- Followed whales: Unlimited
- Delay: 0 (instant)
- Alerts: Unlimited

## 6. Configuration

**Proxy:** https://proxy.opinion.trade:8443/api/bsc/api/v2

**Batch Sizes:**
- Whale: 5
- Tokens: 10
- Market holders: 5
- Cleanup: 500

**Timing:**
- Batch delay: 1000ms
- Token delay: 100ms
- Retention: 90 days

## 7. Key Files

**Backend:**
- schema.ts
- whales.ts (getLeaderboard, getById, getByAddress, getFollowedWhales, getRecentTrades, follow, unfollow, upsertWhale)
- whaleActivity.ts (getFeed, getByWhale, getByMarket, recordActivity)
- scheduling/leaderboardSync.ts
- lib/tierLimits.ts
- lib/auth.ts
- lib/retrier.ts

**Frontend:**
- components/whales/leaderboard.tsx
- components/whales/recent-trades.tsx
- components/whales/whale-row.tsx
- components/whales/whale-stats.tsx
- hooks/use-current-user.ts
- hooks/use-activity-feed.ts

**Config:**
- scheduling/shared/types.ts
- scheduling/shared/constants.ts
- scheduling/shared/helpers.ts

## 8. Caching Architecture

Multi-layer:
1. DB denormalization (pre-computed stats)
2. Strategic indexing (fast lookups)
3. Tiered visibility (timestamped access)
4. Convex caching (real-time sync)
5. Frontend state (React hooks)
6. Pagination (cursor-based)
7. Batch processing (retry with backoff)

Result: Efficient leaderboard queries + real-time feed + tier-respecting delivery

## Unresolved Questions

1. Sync frequency for leaderboardSync?
2. Cache invalidation hooks for whale stats?
3. What triggers statsComputation?
4. Max age for cached whale stats?
5. Market holder discovery process?
6. Opinion.Trade API connection limits?
