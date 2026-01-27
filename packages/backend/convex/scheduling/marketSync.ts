// Market Sync: Syncs markets from Opinion.Trade API (binary + categorical children with token IDs)
import { v } from "convex/values";
import { internalMutation, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { retrier } from "../lib/retrier";
import { getApiBaseUrl, validateApiKey, delay } from "./shared/helpers";
import type { ApiBaseResponse, PaginatedResult, MarketApiResponse, FlattenedMarket } from "./shared/types";
import { isValidMarketResponse } from "./shared/typeGuards";

// Flatten markets: binary use directly, categorical extract children with token IDs
function flattenMarkets(apiMarkets: MarketApiResponse[]): FlattenedMarket[] {
  const flat: FlattenedMarket[] = [];
  for (const m of apiMarkets) {
    if (m.marketType === 0 && m.yesTokenId && m.noTokenId) {
      flat.push({
        marketId: m.marketId, marketTitle: m.marketTitle, status: m.status, statusEnum: m.statusEnum,
        thumbnailUrl: m.thumbnailUrl, rules: m.rules, yesTokenId: m.yesTokenId, noTokenId: m.noTokenId,
        volume: m.volume, volume24h: m.volume24h, volume7d: m.volume7d,
        quoteToken: m.quoteToken, chainId: m.chainId, cutoffAt: m.cutoffAt, resolvedAt: m.resolvedAt,
      });
    } else if (m.marketType === 1 && m.childMarkets?.length) {
      for (const c of m.childMarkets) {
        if (c.yesTokenId && c.noTokenId) {
          flat.push({
            marketId: c.marketId, marketTitle: `${m.marketTitle}: ${c.marketTitle}`,
            status: c.status, statusEnum: c.statusEnum, thumbnailUrl: m.thumbnailUrl, rules: c.rules || m.rules,
            yesTokenId: c.yesTokenId, noTokenId: c.noTokenId, volume: c.volume,
            quoteToken: c.quoteToken, chainId: c.chainId, cutoffAt: c.cutoffAt || m.cutoffAt,
            resolvedAt: c.resolvedAt, parentExternalId: String(m.marketId),
          });
        }
      }
    }
  }
  return flat;
}

export const triggerMarketSync = internalMutation({
  args: {},
  handler: async (ctx) => {
    const syncId = await ctx.db.insert("syncLogs", { type: "markets", status: "running", startedAt: Date.now() });
    await retrier.run(ctx, internal.scheduling.fetchMarketData, { syncId });
    return { syncId };
  },
});

export const fetchMarketData = internalAction({
  args: { syncId: v.id("syncLogs") },
  handler: async (ctx, args) => {
    const apiKey = validateApiKey();
    let page = 1;
    const limit = 20, allMarkets: MarketApiResponse[] = [];
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`${getApiBaseUrl()}/market?page=${page}&limit=${limit}&marketType=2&status=activated`, { headers: { apikey: apiKey } });
      const data: ApiBaseResponse<PaginatedResult<MarketApiResponse>> = await response.json();

      if (!response.ok) {
        await ctx.runMutation(internal.scheduling.markSyncFailed, { syncId: args.syncId, error: `API error: ${response.status} - ${data.errmsg || response.statusText}` });
        throw new Error(`Opinion.Trade API error: ${response.status}`);
      }
      if (data.errno !== 0 || !data.result?.list) {
        await ctx.runMutation(internal.scheduling.markSyncFailed, { syncId: args.syncId, error: `Invalid API response: ${data.errmsg || "expected { errno: 0, result: { list: [] } }"}` });
        throw new Error("Invalid API response structure");
      }

      allMarkets.push(...data.result.list);
      hasMore = allMarkets.length < data.result.total && page < Math.ceil(data.result.total / limit);
      page++;
      if (hasMore) await delay(500);
    }

    const validMarkets = allMarkets.filter(isValidMarketResponse);
    const invalidCount = allMarkets.length - validMarkets.length;
    if (invalidCount > 0) console.warn(`Skipped ${invalidCount} invalid market records`);

    const flattenedMarkets = flattenMarkets(validMarkets);
    console.log(`Flattened ${validMarkets.length} API markets to ${flattenedMarkets.length} tradeable markets`);

    await ctx.runMutation(internal.scheduling.processMarketSyncResults, { syncId: args.syncId, markets: flattenedMarkets, skippedCount: invalidCount });
    return { syncId: args.syncId, marketCount: flattenedMarkets.length };
  },
});

export const processMarketSyncResults = internalMutation({
  args: { syncId: v.id("syncLogs"), markets: v.array(v.any()), skippedCount: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { syncId, markets, skippedCount = 0 } = args;
    let processedCount = 0, errorCount = 0;

    for (const m of markets as FlattenedMarket[]) {
      try {
        await ctx.runMutation(internal.markets.upsertMarket, {
          externalId: String(m.marketId), platform: "opinion_trade", title: m.marketTitle, description: m.rules,
          category: "prediction", yesTokenId: m.yesTokenId || undefined, noTokenId: m.noTokenId || undefined,
          parentExternalId: m.parentExternalId, yesPrice: 0.5, noPrice: 0.5,
          volume: parseFloat(m.volume) || 0, volume24h: parseFloat(m.volume24h || "0") || 0, volume7d: parseFloat(m.volume7d || "0") || 0,
          liquidity: 0, endDate: m.cutoffAt, resolvedAt: m.resolvedAt > 0 ? m.resolvedAt : undefined,
          url: `https://app.opinion.trade/detail?topicId=${m.marketId}`, imageUrl: m.thumbnailUrl || undefined,
          chainId: parseInt(m.chainId, 10) || undefined, quoteToken: m.quoteToken,
        });
        processedCount++;
      } catch (error) { errorCount++; console.error(`Failed to upsert market ${m.marketId}:`, error); }
    }

    const hasErrors = errorCount > 0 || skippedCount > 0;
    await ctx.db.patch(syncId, {
      status: processedCount === 0 && hasErrors ? "failed" : "completed", endedAt: Date.now(), itemCount: processedCount,
      error: hasErrors ? `Processed: ${processedCount}, Errors: ${errorCount}, Skipped: ${skippedCount}` : undefined,
    });
    return { processedCount, errorCount, skippedCount };
  },
});
