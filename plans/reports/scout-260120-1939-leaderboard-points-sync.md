# Scout Report: Leaderboard Points Sync

## Key Files

| File | Purpose |
|------|---------|
| `packages/backend/convex/schema.ts` | Whale table schema - needs `dataType` field |
| `packages/backend/convex/whales.ts` | Whale queries & mutations |
| `packages/backend/convex/scheduling/leaderboardSync.ts` | Leaderboard sync - add points market type |
| `packages/backend/convex/scheduling/shared/types.ts` | API response types |

## Current State

### Whale Schema (schema.ts:54-86)
```typescript
whales: defineTable({
  address: v.string(),
  totalVolume: v.number(),
  totalPnl: v.number(),
  volume24h: v.optional(v.number()),
  volume7d: v.optional(v.number()),
  pnl24h: v.optional(v.number()),
  pnl7d: v.optional(v.number()),
  // NO dataType field currently
})
```

### Leaderboard Sync (leaderboardSync.ts)
- Current data types: `volume`, `profit`
- Current periods: `0` (all-time), `1` (24h), `7` (7d), `30` (30d)
- Need to add: `points` data type with periods `0` and `7`

### Current Field Mapping
```
volume + period 0  → totalVolume
volume + period 1  → volume24h
volume + period 7  → volume7d
volume + period 30 → volume30d
profit + period 0  → totalPnl
profit + period 1  → pnl24h
profit + period 7  → pnl7d
profit + period 30 → pnl30d
```

## Required Changes

### 1. Schema Changes (schema.ts)
Add `dataType` field to whales table:
```typescript
dataType: v.optional(v.union(
  v.literal("volume"),
  v.literal("profit"),
  v.literal("points"),
  v.literal("other")
))
```

### 2. Leaderboard Sync Changes (leaderboardSync.ts)
- Add `points` to data types array
- Add points-specific periods: `[0, 7]`
- Add field mapping for points data
- Update `upsertWhale` to set `dataType`

### 3. New Fields for Points (schema.ts)
```typescript
totalPoints: v.optional(v.number()),
points7d: v.optional(v.number()),
```

## Unresolved Questions

1. Should `dataType` track the FIRST source or LATEST source of whale data?
2. If whale exists from volume sync, then appears in points sync - update `dataType` or keep original?
