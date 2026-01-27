// Opinion.Trade API types
// Based on API documentation: https://docs.opinion.trade/developer-guide/opinion-open-api

// ============================================
// Base Response Types
// ============================================

export interface APIBaseResponse<T> {
  errno: number; // 0 = success, non-zero = error
  errmsg: string;
  result: T;
}

export interface PaginatedResult<T> {
  total: number;
  list: T[];
}

// ============================================
// Market Types
// ============================================

export interface IncentiveFactor {
  [key: string]: unknown;
}

export interface OpinionMarket {
  marketId: number;
  marketTitle: string;
  status: number;
  statusEnum: "activated" | "resolved";
  marketType: number; // 0=Binary, 1=Categorical
  yesLabel: string;
  noLabel: string;
  rules: string;
  yesTokenId: string;
  noTokenId: string;
  conditionId: string;
  resultTokenId: string | null;
  volume: string;
  volume24h: string;
  volume7d: string;
  quoteToken: string;
  chainId: string;
  questionId: string;
  incentiveFactor: IncentiveFactor;
  createdAt: number; // Unix timestamp
  cutoffAt: number; // Unix timestamp
  resolvedAt: number | null; // Unix timestamp
}

export interface ChildMarketData {
  marketId: number;
  marketTitle: string;
  status: number;
  statusEnum: string;
  yesLabel: string;
  noLabel: string;
  rules: string;
  yesTokenId: string; // Child markets have token IDs (tradeable)
  noTokenId: string;
  conditionId: string;
  resultTokenId: string | null;
  volume: string;
  // Note: Child markets don't have volume24h/7d in API response
  quoteToken: string;
  chainId: string;
  questionId: string;
  createdAt: number;
  cutoffAt: number;
  resolvedAt: number;
}

export interface CategoricalMarket extends OpinionMarket {
  childMarkets: ChildMarketData[];
}

// ============================================
// Token / Price Types
// ============================================

export interface LatestPrice {
  tokenId: string;
  price: string;
  side: string;
  size: string;
  timestamp: number;
}

export interface OrderbookLevel {
  price: string;
  size: string;
}

export interface Orderbook {
  market: string;
  tokenId: string;
  timestamp: number;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
}

export interface PricePoint {
  t: number; // timestamp
  p: string; // price
}

export interface PriceHistory {
  history: PricePoint[];
}

// ============================================
// QuoteToken Types
// ============================================

export interface QuoteTokenData {
  id: number;
  quoteTokenName: string;
  quoteTokenAddress: string;
  ctfExchangeAddress: string;
  decimal: number;
  symbol: string;
  chainId: string;
  createdAt: number;
}

// ============================================
// Position Types
// ============================================

export interface PositionData {
  marketId: number;
  marketTitle: string;
  marketStatus: number;
  marketStatusEnum: string;
  marketCutoffAt: number;
  rootMarketId: number;
  rootMarketTitle: string;
  outcome: string;
  outcomeSide: number;
  outcomeSideEnum: "Yes" | "No";
  sharesOwned: string;
  sharesFrozen: string;
  unrealizedPnl: string;
  unrealizedPnlPercent: string;
  dailyPnlChange: string;
  dailyPnlChangePercent: string;
  conditionId: string;
  tokenId: string;
  currentValueInQuoteToken: string;
  avgEntryPrice: string;
  claimStatus: number;
  claimStatusEnum: "CanNotClaim" | "CanClaim" | "Claimed";
  quoteToken: string;
}

// ============================================
// Trade Types
// ============================================

export interface TradeData {
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

// ============================================
// API Response Types (for client methods)
// ============================================

export type MarketListResponse = APIBaseResponse<PaginatedResult<OpinionMarket>>;
export type MarketDetailResponse = APIBaseResponse<OpinionMarket>;
export type CategoricalMarketResponse = APIBaseResponse<CategoricalMarket>;
export type LatestPriceResponse = APIBaseResponse<LatestPrice>;
export type OrderbookResponse = APIBaseResponse<Orderbook>;
export type PriceHistoryResponse = APIBaseResponse<PriceHistory>;
export type QuoteTokenListResponse = APIBaseResponse<PaginatedResult<QuoteTokenData>>;
export type PositionsResponse = APIBaseResponse<PaginatedResult<PositionData>>;
export type UserTradeListResponse = APIBaseResponse<PaginatedResult<TradeData>>;

// ============================================
// Request Parameter Types
// ============================================

export interface MarketListParams {
  page?: number;
  limit?: number;
  status?: "activated" | "resolved";
  marketType?: 0 | 1 | 2; // 0=Binary, 1=Categorical, 2=All
  sortBy?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  chainId?: string;
}

export interface PriceHistoryParams {
  token_id: string;
  interval?: "1m" | "1h" | "1d" | "1w" | "max";
  start_at?: number;
  end_at?: number;
}

export interface UserTradeParams {
  page?: number;
  limit?: number;
  marketId?: number;
  chainId?: string;
}

export interface UserPositionParams {
  page?: number;
  limit?: number;
  marketId?: number;
  chainId?: string;
}

export interface QuoteTokenParams {
  page?: number;
  limit?: number;
  quoteTokenName?: string;
  chainId?: string;
}

// ============================================
// User Profile Types (BSC API v2)
// ============================================

export interface UserProfileBalance {
  balance: string;
  chainId: string;
  currencyAddress: string;
  netWorth: string;
  totalBalance: string;
}

export interface UserProfile {
  Volume: string; // Total trading volume
  VolumeIncRate: string;
  alert: boolean;
  avatarUrl: string;
  balance: UserProfileBalance[];
  email: string;
  followed: boolean;
  follower: number;
  following: number;
  introduction: string;
  location: string;
  multiSignedWalletAddress: Record<string, string>;
  netWorth: string;
  portfolio: string;
  profitIncRate: string;
  rankTheWeek: number;
  score: string;
  totalProfit: string; // Total P&L
  userName: string;
  walletAddress: string;
  xUserId: string;
  xUsername: string;
}

export type UserProfileResponse = APIBaseResponse<UserProfile>;

export interface UserProfileParams {
  chainId?: string;
}
