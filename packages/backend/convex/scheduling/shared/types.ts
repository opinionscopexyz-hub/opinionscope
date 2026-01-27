// ============ SCHEDULING API TYPES ============
// Type definitions for Opinion.Trade API responses

// API base response wrapper (actual format from Opinion.Trade API)
export interface ApiBaseResponse<T> {
  errno: number;
  errmsg: string;
  result: T;
}

export interface PaginatedResult<T> {
  total: number;
  list: T[];
}

// Market API response (matches Opinion.Trade API spec)
export interface MarketApiResponse {
  marketId: number;
  marketTitle: string;
  status: number;
  statusEnum: "Activated" | "Resolved"; // Capitalized per actual API response
  marketType: number; // 0=Binary, 1=Categorical (parent)
  thumbnailUrl: string; // Market thumbnail image
  coverUrl: string;
  childMarkets: ChildMarketApiResponse[] | null; // Child markets for categorical (type=1)
  yesLabel: string;
  noLabel: string;
  rules: string;
  yesTokenId: string; // Empty for categorical parents
  noTokenId: string; // Empty for categorical parents
  conditionId: string;
  resultTokenId: string | null;
  volume: string;
  volume24h: string;
  volume7d: string;
  quoteToken: string;
  chainId: string;
  questionId: string;
  createdAt: number;
  cutoffAt: number;
  resolvedAt: number;
}

// Child market structure (categorical market children - no marketType field)
export interface ChildMarketApiResponse {
  marketId: number;
  marketTitle: string;
  status: number;
  statusEnum: string;
  yesLabel: string;
  noLabel: string;
  rules: string;
  yesTokenId: string; // Has token IDs (these are tradeable)
  noTokenId: string;
  conditionId: string;
  resultTokenId: string | null;
  volume: string;
  quoteToken: string;
  chainId: string;
  questionId: string;
  createdAt: number;
  cutoffAt: number;
  resolvedAt: number;
}

// Flattened market structure for processing (includes parentExternalId)
export interface FlattenedMarket {
  marketId: number;
  marketTitle: string;
  status: number;
  statusEnum: string;
  thumbnailUrl?: string;
  rules: string;
  yesTokenId: string;
  noTokenId: string;
  volume: string;
  volume24h?: string;
  volume7d?: string;
  quoteToken: string;
  chainId: string;
  cutoffAt: number;
  resolvedAt: number;
  parentExternalId?: string; // Set for categorical children
}

// Trade API response (matches Opinion.Trade API spec)
export interface TradeApiResponse {
  txHash: string;
  marketId: number;
  marketTitle: string;
  rootMarketId: number;
  rootMarketTitle: string;
  side: string;
  outcome: string;
  outcomeSide: number;
  outcomeSideEnum: "Yes" | "No";
  price: string;
  shares: string;
  amount: string;
  fee: string;
  profit: string;
  quoteToken: string;
  quoteTokenUsdPrice: string;
  usdAmount: string;
  status: number;
  statusEnum: "Pending" | "Filled" | "Cancelled";
  chainId: string;
  createdAt: number;
}

// Leaderboard types
export interface LeaderboardTrader {
  id: number; // External API ranking entry ID (validated but not persisted)
  walletAddress: string;
  userName: string;
  avatar: string;
  rankingValue: string; // API returns decimal string (e.g., "12345.67")
  rankingChange: number; // Position change from previous period
  rankingType: number; // Ranking category type
  xUsername?: string;
  xUserId?: string;
}

export interface LeaderboardApiResponse {
  errno: number;
  result: {
    list: LeaderboardTrader[];
  };
}

// Market holder types
export interface MarketHolder {
  walletAddress: string;
  userName: string;
  avatar: string;
  profit: number;
  sharesAmount: number;
}

export interface HolderApiResponse {
  errno: number;
  result: {
    list: MarketHolder[];
  };
}

// Token price response
export interface TokenPriceResponse {
  tokenId: string;
  price: string;
  side: string;
  size: string;
  timestamp: number;
}
