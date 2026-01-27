// ============ CLEANUP FUNCTIONS ============
// Sync failure marking and old data cleanup

import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { RETENTION_DAYS, CLEANUP_BATCH_SIZE } from "./shared/constants";

// Max continuation batches to prevent runaway scheduling
const MAX_CLEANUP_CONTINUATIONS = 50;

/**
 * Mark a sync operation as failed with error message
 * Used by all sync domains when API calls or processing fails
 */
export const markSyncFailed = internalMutation({
  args: {
    syncId: v.id("syncLogs"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.db.patch(args.syncId, {
        status: "failed",
        endedAt: Date.now(),
        error: args.error,
      });
    } catch (error) {
      console.error(`Failed to mark sync ${args.syncId} as failed:`, error);
      throw error; // Re-throw to propagate failure
    }
  },
});

/**
 * Clean up old activity and sync logs beyond retention period
 * Runs as scheduled cron job to prevent database bloat
 * Processes in batches and self-schedules continuation if more items remain
 */
export const cleanupOldActivity = internalMutation({
  args: {
    continuationCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const continuation = args.continuationCount ?? 0;
    const cutoffTimestamp = Math.floor(Date.now() / 1000) - RETENTION_DAYS * 24 * 60 * 60;
    let totalDeleted = 0;
    let errorCount = 0;

    // Delete old whaleActivity records in batches
    const oldActivity = await ctx.db
      .query("whaleActivity")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoffTimestamp))
      .take(CLEANUP_BATCH_SIZE);

    for (const activity of oldActivity) {
      try {
        await ctx.db.delete(activity._id);
        totalDeleted++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to delete activity ${activity._id}:`, error);
      }
    }

    // Delete old syncLogs records in batches
    const oldSyncs = await ctx.db
      .query("syncLogs")
      .withIndex("by_startedAt")
      .filter((q) => q.lt(q.field("startedAt"), cutoffTimestamp))
      .take(CLEANUP_BATCH_SIZE);

    for (const sync of oldSyncs) {
      try {
        await ctx.db.delete(sync._id);
        totalDeleted++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to delete sync log ${sync._id}:`, error);
      }
    }

    const hasMore = oldActivity.length === CLEANUP_BATCH_SIZE || oldSyncs.length === CLEANUP_BATCH_SIZE;

    // Self-schedule continuation if more items remain (with safety limit)
    if (hasMore && continuation < MAX_CLEANUP_CONTINUATIONS) {
      await ctx.scheduler.runAfter(1000, internal.scheduling.cleanupOldActivity, {
        continuationCount: continuation + 1,
      });
      console.log(`Cleanup batch ${continuation + 1}: deleted ${totalDeleted}, scheduling next batch...`);
    } else if (hasMore) {
      console.warn(`Cleanup reached max continuations (${MAX_CLEANUP_CONTINUATIONS}), stopping. More items may remain.`);
    }

    return {
      totalDeleted,
      errorCount,
      cutoffDate: new Date(cutoffTimestamp * 1000).toISOString(),
      hasMore,
      continuation,
    };
  },
});
