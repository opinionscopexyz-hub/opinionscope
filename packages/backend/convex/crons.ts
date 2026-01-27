import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// NOTE: @ts-expect-error suppresses TS2589 "Type instantiation is excessively deep"
// caused by re-exporting Convex functions from subdirectory modules. This is a
// TypeScript limitation with deeply nested generic types. Runtime is unaffected.

// Full market metadata sync - every 15 minutes (slowed from 5 for cost efficiency)
crons.interval(
  "sync-markets",
  { minutes: 15 },
  internal.scheduling.triggerMarketSync
);

// Alert-focused price sync - every 5 minutes (only markets with active alerts)
// crons.interval(
//   "sync-alert-prices",
//   { minutes: 5 },
//   internal.scheduling.triggerAlertPriceSync
// );

// Whale activity sync - every 10 minutes
crons.interval(
  "sync-whale-trades",
  { minutes: 15 },
  internal.scheduling.triggerWhaleSync
);

// Price alerts: chained via scheduler in processAlertPriceResults (guaranteed order)
// - sync-alert-prices completes → triggers checkPriceAlerts immediately
// No standalone cron needed - alerts checked with fresh prices every 2 min

// Daily cleanup - 3 AM UTC (self-schedules continuation batches if needed)
crons.daily(
  "cleanup-old-activity",
  { hourUTC: 3, minuteUTC: 0 },
  internal.scheduling.cleanupOldActivity,
  { continuationCount: 0 }
);

// Leaderboard whale discovery - daily at 4 AM UTC
crons.daily(
  "sync-leaderboard-whales",
  { hourUTC: 4, minuteUTC: 0 },
  internal.scheduling.triggerLeaderboardSync
);

// DISABLED: Market holders sync - future feature (may cause API rate limiting issues)
// crons.interval(
//   "sync-market-holders",
//   { hours: 6 },
//   internal.scheduling.triggerMarketHoldersSync
// );

export default crons;
