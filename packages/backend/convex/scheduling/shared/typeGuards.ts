// ============ SCHEDULING TYPE GUARDS ============
// Validation functions for API responses

import type {
  MarketApiResponse,
  TradeApiResponse,
  LeaderboardTrader,
  MarketHolder,
  TokenPriceResponse,
} from "./types";

/**
 * Type guard for market API response
 * Validates required fields: marketId (number), marketTitle (string)
 */
export function isValidMarketResponse(obj: unknown): obj is MarketApiResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "marketId" in obj &&
    typeof (obj as { marketId: unknown }).marketId === "number" &&
    "marketTitle" in obj &&
    typeof (obj as { marketTitle: unknown }).marketTitle === "string"
  );
}

/**
 * Type guard for trade API response
 * Validates required fields: marketId (number), txHash (exists)
 */
export function isValidTradeResponse(obj: unknown): obj is TradeApiResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "marketId" in obj &&
    typeof (obj as { marketId: unknown }).marketId === "number" &&
    "txHash" in obj
  );
}

/**
 * Type guard for leaderboard trader
 * Validates: id (number), walletAddress (non-empty string), userName (string),
 * avatar (string), rankingValue (parseable decimal string), rankingChange (number), rankingType (number)
 * Note: id, rankingChange, rankingType are validated for API contract but not persisted to DB
 */
export function isValidLeaderboardTrader(
  obj: unknown
): obj is LeaderboardTrader {
  if (typeof obj !== "object" || obj === null) return false;
  const t = obj as Record<string, unknown>;
  return (
    typeof t.id === "number" &&
    typeof t.walletAddress === "string" &&
    t.walletAddress.length > 0 &&
    typeof t.userName === "string" &&
    typeof t.avatar === "string" &&
    typeof t.rankingValue === "string" &&
    !isNaN(parseFloat(t.rankingValue)) &&
    typeof t.rankingChange === "number" &&
    typeof t.rankingType === "number"
  );
}

/**
 * Type guard for market holder
 * Validates: walletAddress (non-empty string, 0x prefix, 40 hex chars)
 */
export function isValidHolder(obj: unknown): obj is MarketHolder {
  if (typeof obj !== "object" || obj === null) return false;
  const h = obj as Record<string, unknown>;
  // Validate wallet address: non-empty string, 0x prefix, hex format
  if (typeof h.walletAddress !== "string" || h.walletAddress.length === 0)
    return false;
  // Basic hex address check (0x + 40 hex chars)
  if (!/^0x[a-fA-F0-9]{40}$/.test(h.walletAddress)) return false;
  return true;
}

/**
 * Type guard for token price response
 * Validates: tokenId (exists), price (string)
 */
export function isValidPriceResponse(obj: unknown): obj is TokenPriceResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "tokenId" in obj &&
    "price" in obj &&
    typeof (obj as { price: unknown }).price === "string"
  );
}
