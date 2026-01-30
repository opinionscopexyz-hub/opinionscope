---
title: "Per-Stat SyncedAt Timestamps"
description: "Add per-stat timestamps to exclude stale whale data from leaderboard"
status: completed
priority: P2
effort: 1h
branch: master
tags: [whales, leaderboard, sync, staleness]
created: 2026-01-30
---

# Per-Stat SyncedAt Timestamps

## Problem

Whales that drop out of top 100 leaderboard have stale stat values (pnl30d, totalPnl, etc.) that persist indefinitely. Current single `leaderboardSyncedAt` doesn't track per-field freshness.

## Solution

Add individual `*SyncedAt` timestamp for each stat field. Filter stale data in queries using threshold = sync interval + buffer.

## Implementation Phases

| Phase | Description | Status | Effort |
|-------|-------------|--------|--------|
| [Phase 1](./phase-01-add-synced-at-fields-to-whale-schema.md) | Add 10 SyncedAt fields to schema | ✅ done | 15m |
| [Phase 2](./phase-02-update-leaderboard-sync-to-set-per-stat-timestamps.md) | Update leaderboard sync to set timestamps | ✅ done | 20m |
| [Phase 3](./phase-03-add-stale-data-filter-to-leaderboard-queries.md) | Add stale data filtering to queries | ✅ done | 25m |

## Key Files

- `packages/backend/convex/schema.ts` - Schema definition
- `packages/backend/convex/scheduling/leaderboardSync.ts` - Sync logic
- `packages/backend/convex/whales.ts` - Query handlers

## Constants

```typescript
// Sync runs daily 4 AM UTC = 24h interval
LEADERBOARD_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000

// Add 2h buffer for edge cases
STALE_THRESHOLD_MS = 26 * 60 * 60 * 1000
```

## New Fields (10 total)

| Stat Field | SyncedAt Field |
|------------|----------------|
| pnl24h | pnl24hSyncedAt |
| pnl7d | pnl7dSyncedAt |
| pnl30d | pnl30dSyncedAt |
| totalPnl | totalPnlSyncedAt |
| volume24h | volume24hSyncedAt |
| volume7d | volume7dSyncedAt |
| volume30d | volume30dSyncedAt |
| totalVolume | totalVolumeSyncedAt |
| points7d | points7dSyncedAt |
| totalPoints | totalPointsSyncedAt |
