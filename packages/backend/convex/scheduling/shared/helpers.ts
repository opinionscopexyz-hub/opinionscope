// ============ SCHEDULING HELPERS ============
// Utility functions for API calls and rate limiting

/**
 * Get Opinion.Trade API base URL from environment
 * @throws Error if OPINION_TRADE_BASE_URL not configured
 */
export function getApiBaseUrl(): string {
  const url = process.env.OPINION_TRADE_BASE_URL;
  if (!url) {
    throw new Error("OPINION_TRADE_BASE_URL not configured");
  }
  return url;
}

/**
 * Validate and return Opinion.Trade API key from environment
 * @throws Error if OPINION_TRADE_API_KEY not configured
 */
export function validateApiKey(): string {
  const apiKey = process.env.OPINION_TRADE_API_KEY;
  if (!apiKey) {
    throw new Error("OPINION_TRADE_API_KEY not configured");
  }
  return apiKey;
}

/**
 * Delay helper for rate limiting between API calls
 * @param ms - Milliseconds to delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
