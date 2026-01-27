# Phase 2: Extract Cleanup and Stats Modules

## Context Links
- Source: `packages/backend/convex/scheduling.ts` (lines 970-1063)
- Shared modules: `convex/scheduling/shared/`
- Phase 1: `./phase-01-create-shared-modules.md`

## Overview
- **Priority**: P1
- **Status**: ✅ Done (2026-01-20)
- **Estimated Effort**: 30 min

Extract `markSyncFailed`, `cleanupOldActivity`, and `computeWhaleStats` - these are standalone functions with minimal dependencies, making them ideal for early extraction.

## Key Insights
- `markSyncFailed` is used by all sync domains (shared utility)
- `cleanupOldActivity` and `computeWhaleStats` are standalone cron handlers
- Low coupling with other sync domains

## Requirements

### Functional
- Extract `markSyncFailed` to `cleanup.ts`
- Extract `cleanupOldActivity` to `cleanup.ts`
- Extract `computeWhaleStats` to `stats-computation.ts`

### Non-Functional
- Each file under 100 lines
- Proper Convex function exports

## Architecture

```
convex/scheduling/
├── cleanup.ts            # markSyncFailed, cleanupOldActivity
└── stats-computation.ts  # computeWhaleStats
```

## Related Code Files

### Files to Create
- `packages/backend/convex/scheduling/cleanup.ts`
- `packages/backend/convex/scheduling/stats-computation.ts`

### Source Code References

**cleanup.ts source** (lines 970-1063):
```typescript
// markSyncFailed (lines 972-984)
export const markSyncFailed = internalMutation({
  args: { syncId: v.id("syncLogs"), error: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.syncId, {
      status: "failed",
      endedAt: Date.now(),
      error: args.error,
    });
  },
});

// cleanupOldActivity (lines 1029-1063)
// Uses RETENTION_DAYS and CLEANUP_BATCH_SIZE from constants
```

**stats-computation.ts source** (lines 986-1023):
```typescript
export const computeWhaleStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Aggregate trade data for all whales
    // Update whale.totalVolume, tradeCount, lastActiveAt
  }
});
```

## Implementation Steps

### 1. Create `cleanup.ts` (~50 lines)
```typescript
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { RETENTION_DAYS, CLEANUP_BATCH_SIZE } from "./shared/constants";

export const markSyncFailed = internalMutation({
  args: {
    syncId: v.id("syncLogs"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.syncId, {
      status: "failed",
      endedAt: Date.now(),
      error: args.error,
    });
  },
});

export const cleanupOldActivity = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffTimestamp = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let totalDeleted = 0;

    // Delete old whaleActivity records
    const oldActivity = await ctx.db
      .query("whaleActivity")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoffTimestamp))
      .take(CLEANUP_BATCH_SIZE);

    for (const activity of oldActivity) {
      await ctx.db.delete(activity._id);
      totalDeleted++;
    }

    // Delete old syncLogs records
    const oldSyncs = await ctx.db
      .query("syncLogs")
      .withIndex("by_startedAt")
      .filter((q) => q.lt(q.field("startedAt"), cutoffTimestamp))
      .take(CLEANUP_BATCH_SIZE);

    for (const sync of oldSyncs) {
      await ctx.db.delete(sync._id);
      totalDeleted++;
    }

    return {
      totalDeleted,
      cutoffDate: new Date(cutoffTimestamp).toISOString(),
    };
  },
});
```

### 2. Create `stats-computation.ts` (~40 lines)
```typescript
import { internalMutation } from "../_generated/server";

export const computeWhaleStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const whales = await ctx.db.query("whales").collect();
    let updatedCount = 0;

    for (const whale of whales) {
      const activity = await ctx.db
        .query("whaleActivity")
        .withIndex("by_whaleId_timestamp", (q) => q.eq("whaleId", whale._id))
        .collect();

      let totalVolume = 0;
      let lastActiveAt = whale.lastActiveAt;

      for (const trade of activity) {
        totalVolume += trade.amount;
        lastActiveAt = Math.max(lastActiveAt, trade.timestamp);
      }

      await ctx.db.patch(whale._id, {
        totalVolume,
        tradeCount: activity.length,
        lastActiveAt,
        updatedAt: Date.now(),
      });

      updatedCount++;
    }

    return { updatedCount };
  },
});
```

## Todo List
- [x] Create `convex/scheduling/cleanup.ts` (84 lines, with error handling + hasMore indicator)
- [x] Create `convex/scheduling/stats-computation.ts` (69 lines, fixed N+1 with Map lookup)
- [x] Verify imports from `shared/constants`
- [x] TypeScript compilation check
- [x] Fix N+1 query pattern in computeWhaleStats (2 queries instead of N+1)
- [x] Add error handling to all mutations

## Success Criteria
- Both files compile without errors
- Functions export correctly for Convex internal API
- Each file under 100 lines

## Risk Assessment
- **Low risk**: Standalone functions with no cross-dependencies
- `markSyncFailed` used by multiple sync domains (import will change in Phase 3)

## Security Considerations
- No external API calls
- Database operations only

## Next Steps
- Phase 3: Extract sync domain modules
- Sync domains will import `markSyncFailed` from cleanup.ts
