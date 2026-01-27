// ============ SCHEDULING CONSTANTS ============
// Batch sizes, delays, and URLs for API rate limiting

// Whale sync rate limiting
export const WHALE_BATCH_SIZE = 10 as const; // Process 5 whales per batch
export const BATCH_DELAY_MS = 500 as const; // 1 second delay between batches

// Opinion.Trade proxy API endpoint (requires API key)
export const LEADERBOARD_PROXY_URL =
  "https://proxy.opinion.trade:8443/api/bsc/api/v2" as const;

// Token price sync batching
export const TOKEN_BATCH_SIZE = 10 as const; // 10 tokens per batch (5 markets worth)
export const TOKEN_BATCH_DELAY_MS = 100 as const; // 100ms between batches (stay under 15 req/sec)

// Market holders sync
export const MARKET_HOLDERS_BATCH_SIZE = 5 as const; // 5 markets per batch (10 API calls)
export const HOLDERS_PER_MARKET = 5 as const; // Top 100 per side (200 total per market)

// Cleanup settings
export const CLEANUP_BATCH_SIZE = 1000 as const; // Larger batch for cleanup operations
export const RETENTION_DAYS = 3 as const; // Keep 1 day of activity data
