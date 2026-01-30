---
phase: 3
title: "Add Stale Data Filter to Leaderboard Queries"
status: pending
effort: 25m
---

# Phase 3: Add Stale Data Filter to Leaderboard Queries

## Context

- Parent: [plan.md](./plan.md)
- Depends on: [Phase 2](./phase-02-update-leaderboard-sync-to-set-per-stat-timestamps.md)
- File: `packages/backend/convex/whales.ts`

## Overview

Update `getLeaderboard` query to filter out whales with stale stat timestamps.

## Key Code Locations

- `getLeaderboard()` at lines 9-98 - Main query handler
- Switch cases for each sortBy option at lines 42-90

## Constants

```typescript
// Stale threshold = sync interval (24h) + buffer (2h)
const STALE_THRESHOLD_MS = 26 * 60 * 60 * 1000;
```

## Implementation Steps

### Step 1: Add constant at top of file (after imports)

```typescript
// Stale threshold: 24h sync interval + 2h buffer
const STALE_THRESHOLD_MS = 26 * 60 * 60 * 1000;
```

### Step 2: Create stale filter helper

```typescript
// Maps sortBy field to its timestamp field for staleness check
function getSyncedAtField(sortBy: string): string | null {
  const map: Record<string, string> = {
    totalVolume: "totalVolumeSyncedAt",
    totalPnl: "totalPnlSyncedAt",
    volume24h: "volume24hSyncedAt",
    volume7d: "volume7dSyncedAt",
    volume30d: "volume30dSyncedAt",
    pnl24h: "pnl24hSyncedAt",
    pnl7d: "pnl7dSyncedAt",
    pnl30d: "pnl30dSyncedAt",
    totalPoints: "totalPointsSyncedAt",
    points7d: "points7dSyncedAt",
  };
  return map[sortBy] ?? null;
}
```

### Step 3: Update each switch case to add stale filter

Example for `totalPnl` case (line 46-47):
```typescript
case "totalPnl": {
  const staleThreshold = Date.now() - STALE_THRESHOLD_MS;
  whales = await db.query("whales")
    .withIndex("by_totalPnl", (q) => q.gt("totalPnl", 0))
    .filter((q) => q.gt(q.field("totalPnlSyncedAt"), staleThreshold))
    .order("desc")
    .take(effectiveLimit);
  break;
}
```

For non-indexed cases (volume7d, volume30d, pnl7d, pnl30d), add to existing filter:
```typescript
case "pnl30d": {
  const staleThreshold = Date.now() - STALE_THRESHOLD_MS;
  whales = await db.query("whales")
    .filter((q) => q.and(
      q.neq(q.field("pnl30d"), 0),
      q.gt(q.field("pnl30dSyncedAt"), staleThreshold)
    ))
    .take(effectiveLimit * 3)
    .then((all) => all.sort((a, b) => (b.pnl30d ?? 0) - (a.pnl30d ?? 0)).slice(0, effectiveLimit));
  break;
}
```

### Step 4: Handle followerCount case

`followerCount` is not from leaderboard sync - no stale filter needed.

## Cases to Update

| sortBy | Has Index | Timestamp Field |
|--------|-----------|-----------------|
| totalVolume | Yes | totalVolumeSyncedAt |
| totalPnl | Yes | totalPnlSyncedAt |
| followerCount | Yes | N/A (not synced) |
| volume24h | Yes | volume24hSyncedAt |
| volume7d | No | volume7dSyncedAt |
| volume30d | No | volume30dSyncedAt |
| pnl24h | Yes | pnl24hSyncedAt |
| pnl7d | No | pnl7dSyncedAt |
| pnl30d | No | pnl30dSyncedAt |
| totalPoints | Yes | totalPointsSyncedAt |
| points7d | Yes | points7dSyncedAt |

## Todo

- [ ] Add STALE_THRESHOLD_MS constant
- [ ] Add getSyncedAtField helper function
- [ ] Update totalVolume case with stale filter
- [ ] Update totalPnl case with stale filter
- [ ] Update volume24h case with stale filter
- [ ] Update volume7d case with stale filter
- [ ] Update volume30d case with stale filter
- [ ] Update pnl24h case with stale filter
- [ ] Update pnl7d case with stale filter
- [ ] Update pnl30d case with stale filter
- [ ] Update totalPoints case with stale filter
- [ ] Update points7d case with stale filter
- [ ] Update default case with stale filter
- [ ] Test queries filter out stale data

## Success Criteria

- Whales with stale timestamps (>26h old) excluded from results
- Whales with undefined timestamps excluded (never synced)
- Query performance acceptable (filter adds overhead)
- followerCount unchanged (not synced)

## Risk

Medium - Stale data becomes invisible. If sync fails for >26h, all data disappears.

## Mitigation

- Monitor sync job success
- Consider alerting on sync failures
- Future: Add UI indicator for data freshness
