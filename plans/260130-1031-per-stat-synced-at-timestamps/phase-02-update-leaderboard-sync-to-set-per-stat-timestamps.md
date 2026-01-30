---
phase: 2
title: "Update Leaderboard Sync to Set Per-Stat Timestamps"
status: pending
effort: 20m
---

# Phase 2: Update Leaderboard Sync to Set Per-Stat Timestamps

## Context

- Parent: [plan.md](./plan.md)
- Depends on: [Phase 1](./phase-01-add-synced-at-fields-to-whale-schema.md)
- File: `packages/backend/convex/scheduling/leaderboardSync.ts`

## Overview

Modify sync logic to set timestamp for each stat field when updated.

## Key Code Locations

- `getWhaleFieldName()` at lines 26-40 - Maps dataType+period to field name
- `processLeaderboardResults()` at lines 173-229 - Builds updateFields
- `updateFields` construction at lines 206-208

## Implementation Steps

### Step 1: Add timestamp field mapping function (after line 40)

```typescript
// Maps stat field name to its timestamp field name
function getTimestampFieldName(fieldName: string): string {
  return `${fieldName}SyncedAt`;
}
```

### Step 2: Update processLeaderboardResults (lines 206-208)

Change from:
```typescript
const updateFields: Record<string, number | string | undefined> = {
  [trader.fieldName]: value,
};
```

To:
```typescript
const updateFields: Record<string, number | string | undefined> = {
  [trader.fieldName]: value,
  [getTimestampFieldName(trader.fieldName)]: Date.now(),
};
```

### Step 3: Update upsertWhale args in whales.ts

Add new optional args to accept timestamp fields:
```typescript
// Per-stat sync timestamps
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

- [ ] Add `getTimestampFieldName()` helper function
- [ ] Update `updateFields` to include timestamp
- [ ] Add 10 SyncedAt args to `upsertWhale` mutation
- [ ] Test sync updates timestamp correctly

## Success Criteria

- Sync sets `{stat}SyncedAt` alongside `{stat}` value
- Timestamp is current Date.now() at sync time
- Existing functionality unchanged

## Risk

Low - Additive change, spreads into existing updateFields object.
