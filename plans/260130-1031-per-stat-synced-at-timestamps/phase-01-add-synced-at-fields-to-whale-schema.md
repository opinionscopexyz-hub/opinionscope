---
phase: 1
title: "Add SyncedAt Fields to Whale Schema"
status: pending
effort: 15m
---

# Phase 1: Add SyncedAt Fields to Whale Schema

## Context

- Parent: [plan.md](./plan.md)
- File: `packages/backend/convex/schema.ts`

## Overview

Add 10 optional timestamp fields to track when each stat was last synced from leaderboard API.

## Requirements

- All fields optional (v.optional(v.number()))
- No indexes needed (filtering done post-query)
- Maintain backward compatibility (existing whales have undefined)

## Implementation Steps

1. Open `packages/backend/convex/schema.ts`
2. Add fields after line 84 (`leaderboardSyncedAt`):

```typescript
// Per-stat sync timestamps for staleness filtering
pnl24hSyncedAt: v.optional(v.number()),
pnl7dSyncedAt: v.optional(v.number()),
pnl30dSyncedAt: v.optional(v.number()),
totalPnlSyncedAt: v.optional(v.number()),
volume24hSyncedAt: v.optional(v.number()),
volume7dSyncedAt: v.optional(v.number()),
volume30dSyncedAt: v.optional(v.number()),
totalVolumeSyncedAt: v.optional(v.number()),
points7dSyncedAt: v.optional(v.number()),
totalPointsSyncedAt: v.optional(v.number()),
```

## Todo

- [ ] Add 10 SyncedAt fields to whales table schema
- [ ] Run `bun run convex dev` to push schema changes

## Success Criteria

- Schema compiles without errors
- Convex accepts schema push
- No breaking changes to existing queries

## Risk

Low - Adding optional fields is non-breaking.
