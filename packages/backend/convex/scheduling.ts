// ============ SCHEDULING RE-EXPORTS ============
// Backward compatibility layer for internal.scheduling.* API paths
// All functions are now in scheduling/ subdirectory modules
// This file re-exports them to preserve existing cron job references
//
// NOTE: Re-exporting Convex functions can cause TS2589 "Type instantiation is
// excessively deep" in dependent files. This is a TypeScript limitation with
// deeply nested generic types. Runtime behavior is unaffected.

// Cleanup
export { markSyncFailed, cleanupOldActivity } from "./scheduling/cleanup";

// Market Sync
export {
  triggerMarketSync,
  fetchMarketData,
  processMarketSyncResults,
} from "./scheduling/marketSync";

// Alert Price Sync
export {
  triggerAlertPriceSync,
  fetchAlertMarketPrices,
  processAlertPriceResults,
} from "./scheduling/alertPriceSync";

// Whale Sync
export {
  triggerWhaleSync,
  fetchWhaleActivity,
  processWhaleSyncResults,
  fetchWhaleChunk,
  processWhaleChunkResults,
} from "./scheduling/whaleSync";

// Leaderboard Sync
export {
  triggerLeaderboardSync,
  fetchLeaderboardData,
  fetchAllLeaderboards,
  processLeaderboardResults,
  markSyncCompleted,
} from "./scheduling/leaderboardSync";

// DISABLED: Market Holders Sync - future feature (may cause API rate limiting issues)
// export {
//   triggerMarketHoldersSync,
//   fetchMarketHolders,
//   processMarketHoldersResults,
// } from "./scheduling/marketHoldersSync";
