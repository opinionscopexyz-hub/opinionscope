import { env } from "@opinion-scope/env/server";
import type {
  MarketListResponse,
  MarketDetailResponse,
  CategoricalMarketResponse,
  LatestPriceResponse,
  OrderbookResponse,
  PriceHistoryResponse,
  QuoteTokenListResponse,
  PositionsResponse,
  UserTradeListResponse,
  UserProfileResponse,
  MarketListParams,
  PriceHistoryParams,
  UserTradeParams,
  UserPositionParams,
  QuoteTokenParams,
  UserProfileParams,
  OpinionMarket,
  CategoricalMarket,
  LatestPrice,
  Orderbook,
  PriceHistory,
  QuoteTokenData,
  PositionData,
  TradeData,
  UserProfile,
  PaginatedResult,
} from "./types";

/**
 * Opinion.Trade API Client
 * Handles all interactions with the Opinion.Trade prediction market API
 * Rate limit: 15 requests/second
 * API Docs: https://docs.opinion.trade/developer-guide/opinion-open-api
 */
class OpinionTradeClient {
  private baseUrl: string;
  private apiKey: string | undefined;

  constructor() {
    this.baseUrl =
      env.OPINION_TRADE_BASE_URL ?? "https://proxy.opinion.trade:8443/openapi";
    this.apiKey = env.OPINION_TRADE_API_KEY;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    if (!this.apiKey) {
      throw new Error("Opinion.Trade API key not configured");
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        apikey: this.apiKey,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Opinion.Trade API error: ${response.status} - ${data.errmsg || "Unknown error"}`
      );
    }

    return data;
  }

  /**
   * Extract result from API response and validate success
   */
  private extractResult<T>(response: { errno: number; errmsg: string; result: T }): T {
    if (response.errno !== 0) {
      throw new Error(`Opinion.Trade API error: ${response.errmsg}`);
    }
    return response.result;
  }

  /**
   * Get all markets with pagination and filtering
   * @param params - Optional filtering and pagination parameters
   */
  async getMarkets(params?: MarketListParams): Promise<PaginatedResult<OpinionMarket>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.status) searchParams.set("status", params.status);
    if (params?.marketType !== undefined) searchParams.set("marketType", String(params.marketType));
    if (params?.sortBy) searchParams.set("sortBy", String(params.sortBy));
    if (params?.chainId) searchParams.set("chainId", params.chainId);

    const queryString = searchParams.toString();
    const endpoint = `/market${queryString ? `?${queryString}` : ""}`;
    const response = await this.fetch<MarketListResponse>(endpoint);
    return this.extractResult(response);
  }

  /**
   * Get a single binary market by ID
   * @param marketId - The market ID (integer)
   */
  async getMarket(marketId: number): Promise<OpinionMarket> {
    const response = await this.fetch<MarketDetailResponse>(`/market/${marketId}`);
    return this.extractResult(response);
  }

  /**
   * Get categorical market details with child markets
   * @param marketId - The categorical market ID (integer)
   */
  async getCategoricalMarket(marketId: number): Promise<CategoricalMarket> {
    const response = await this.fetch<CategoricalMarketResponse>(
      `/market/categorical/${marketId}`
    );
    return this.extractResult(response);
  }

  /**
   * Get latest price for a token
   * @param tokenId - The token ID string
   */
  async getLatestPrice(tokenId: string): Promise<LatestPrice> {
    const response = await this.fetch<LatestPriceResponse>(
      `/token/latest-price?token_id=${encodeURIComponent(tokenId)}`
    );
    return this.extractResult(response);
  }

  /**
   * Get orderbook for a token
   * @param tokenId - The token ID string
   */
  async getOrderbook(tokenId: string): Promise<Orderbook> {
    const response = await this.fetch<OrderbookResponse>(
      `/token/orderbook?token_id=${encodeURIComponent(tokenId)}`
    );
    return this.extractResult(response);
  }

  /**
   * Get historical price data for a token
   * @param params - Price history parameters including token_id and optional interval/range
   */
  async getPriceHistory(params: PriceHistoryParams): Promise<PriceHistory> {
    const searchParams = new URLSearchParams();
    searchParams.set("token_id", params.token_id);
    if (params.interval) searchParams.set("interval", params.interval);
    if (params.start_at) searchParams.set("start_at", String(params.start_at));
    if (params.end_at) searchParams.set("end_at", String(params.end_at));

    const response = await this.fetch<PriceHistoryResponse>(
      `/token/price-history?${searchParams.toString()}`
    );
    return this.extractResult(response);
  }

  /**
   * Get list of quote tokens
   * @param params - Optional filtering and pagination parameters
   */
  async getQuoteTokens(params?: QuoteTokenParams): Promise<PaginatedResult<QuoteTokenData>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.quoteTokenName) searchParams.set("quoteTokenName", params.quoteTokenName);
    if (params?.chainId) searchParams.set("chainId", params.chainId);

    const queryString = searchParams.toString();
    const endpoint = `/quoteToken${queryString ? `?${queryString}` : ""}`;
    const response = await this.fetch<QuoteTokenListResponse>(endpoint);
    return this.extractResult(response);
  }

  /**
   * Get positions for a wallet address
   * @param walletAddress - The user's wallet address
   * @param params - Optional filtering and pagination parameters
   */
  async getUserPositions(
    walletAddress: string,
    params?: UserPositionParams
  ): Promise<PaginatedResult<PositionData>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.marketId) searchParams.set("marketId", String(params.marketId));
    if (params?.chainId) searchParams.set("chainId", params.chainId);

    const queryString = searchParams.toString();
    const endpoint = `/positions/user/${walletAddress}${queryString ? `?${queryString}` : ""}`;
    const response = await this.fetch<PositionsResponse>(endpoint);
    return this.extractResult(response);
  }

  /**
   * Get trades for a wallet address
   * @param walletAddress - The user's wallet address
   * @param params - Optional filtering and pagination parameters
   */
  async getUserTrades(
    walletAddress: string,
    params?: UserTradeParams
  ): Promise<PaginatedResult<TradeData>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.marketId) searchParams.set("marketId", String(params.marketId));
    if (params?.chainId) searchParams.set("chainId", params.chainId);

    const queryString = searchParams.toString();
    const endpoint = `/trade/user/${walletAddress}${queryString ? `?${queryString}` : ""}`;
    const response = await this.fetch<UserTradeListResponse>(endpoint);
    return this.extractResult(response);
  }

  /**
   * Get user profile with portfolio stats from BSC API v2
   * Note: Uses different base URL than other endpoints (/api/bsc/api/v2 vs /openapi)
   * @param walletAddress - The user's wallet address
   * @param params - Optional chainId parameter (defaults to 56 for BSC)
   */
  async getUserProfile(
    walletAddress: string,
    params?: UserProfileParams
  ): Promise<UserProfile> {
    const chainId = params?.chainId ?? "56";
    // BSC API v2 uses different base URL structure
    const bscApiBase = "https://proxy.opinion.trade:8443/api/bsc/api/v2";
    const url = `${bscApiBase}/user/${walletAddress}/profile?chainId=${chainId}`;
    console.log('url', url);

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data: UserProfileResponse = await response.json();

    if (!response.ok || data.errno !== 0) {
      throw new Error(
        `Opinion.Trade API error: ${data.errmsg || "Unknown error"}`
      );
    }

    return data.result;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Singleton instance
export const opinionTradeClient = new OpinionTradeClient();
