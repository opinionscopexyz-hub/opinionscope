// Alert Price Sync: Fetches token prices for markets with active price alerts
import { v } from "convex/values";
import { internalMutation, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { retrier } from "../lib/retrier";
import { getApiBaseUrl, validateApiKey, delay } from "./shared/helpers";
import { TOKEN_BATCH_SIZE, TOKEN_BATCH_DELAY_MS } from "./shared/constants";
import type { ApiBaseResponse, TokenPriceResponse } from "./shared/types";
import { isValidPriceResponse } from "./shared/typeGuards";

async function fetchTokenPrice(tokenId: string, apiKey: string): Promise<number | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/token/latest-price?token_id=${tokenId}`, { headers: { apikey: apiKey } });
    if (!response.ok) return null;
    const data: ApiBaseResponse<TokenPriceResponse> = await response.json();
    if (data.errno !== 0 || !isValidPriceResponse(data.result)) return null;
    const price = parseFloat(data.result.price);
    return isNaN(price) ? null : price;
  } catch (error) { console.warn(`Failed to fetch price for token ${tokenId}:`, error); return null; }
}

export const triggerAlertPriceSync = internalMutation({
  args: {},
  handler: async (ctx) => {
    const syncId = await ctx.db.insert("syncLogs", { type: "alert-prices", status: "running", startedAt: Date.now() });
    const alerts = await ctx.db.query("alerts").withIndex("by_isActive", (q) => q.eq("isActive", true)).filter((q) => q.eq(q.field("type"), "price")).collect();
    const marketIds = Array.from(new Set(alerts.map((a) => a.marketId).filter(Boolean)));

    if (marketIds.length === 0) {
      await ctx.db.patch(syncId, { status: "completed", endedAt: Date.now(), itemCount: 0 });
      return { syncId, message: "No alert markets to sync" };
    }

    const marketsWithTokens: Array<{ marketId: Id<"markets">; yesTokenId: string; noTokenId: string }> = [];
    for (const id of marketIds) {
      const market = await ctx.db.get(id!);
      if (market && "yesTokenId" in market && "noTokenId" in market) {
        const yesToken = market.yesTokenId, noToken = market.noTokenId;
        if (typeof yesToken === "string" && typeof noToken === "string") {
          marketsWithTokens.push({ marketId: market._id as Id<"markets">, yesTokenId: yesToken, noTokenId: noToken });
        }
      }
    }

    if (marketsWithTokens.length === 0) {
      await ctx.db.patch(syncId, { status: "completed", endedAt: Date.now(), itemCount: 0, error: "No markets with token IDs found" });
      return { syncId, message: "No markets with token IDs" };
    }

    await retrier.run(ctx, internal.scheduling.fetchAlertMarketPrices, { syncId, markets: marketsWithTokens });
    return { syncId, marketCount: marketsWithTokens.length };
  },
});

export const fetchAlertMarketPrices = internalAction({
  args: { syncId: v.id("syncLogs"), markets: v.array(v.object({ marketId: v.id("markets"), yesTokenId: v.string(), noTokenId: v.string() })) },
  handler: async (ctx, args) => {
    const apiKey = validateApiKey();
    const tokenTasks: Array<{ marketId: Id<"markets">; tokenId: string; type: "yes" | "no" }> = [];
    for (const m of args.markets) {
      tokenTasks.push({ marketId: m.marketId, tokenId: m.yesTokenId, type: "yes" });
      tokenTasks.push({ marketId: m.marketId, tokenId: m.noTokenId, type: "no" });
    }

    const priceMap = new Map<Id<"markets">, { yes: number | null; no: number | null }>();
    for (let i = 0; i < tokenTasks.length; i += TOKEN_BATCH_SIZE) {
      if (i > 0) await delay(TOKEN_BATCH_DELAY_MS);
      const batch = tokenTasks.slice(i, i + TOKEN_BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(async (t) => ({ ...t, price: await fetchTokenPrice(t.tokenId, apiKey) })));
      for (const r of batchResults) {
        if (!priceMap.has(r.marketId)) priceMap.set(r.marketId, { yes: null, no: null });
        const entry = priceMap.get(r.marketId)!;
        if (r.type === "yes") entry.yes = r.price; else entry.no = r.price;
      }
    }

    const results = Array.from(priceMap.entries()).map(([marketId, prices]) => ({ marketId, yesPrice: prices.yes, noPrice: prices.no }));
    await ctx.runMutation(internal.scheduling.processAlertPriceResults, { syncId: args.syncId, results });
    return { syncId: args.syncId, marketCount: results.length };
  },
});

export const processAlertPriceResults = internalMutation({
  args: { syncId: v.id("syncLogs"), results: v.array(v.object({ marketId: v.id("markets"), yesPrice: v.union(v.number(), v.null()), noPrice: v.union(v.number(), v.null()) })) },
  handler: async (ctx, args) => {
    const { syncId, results } = args;
    let updatedCount = 0, skippedCount = 0;

    for (const r of results) {
      if (r.yesPrice === null && r.noPrice === null) { skippedCount++; continue; }
      const patch: { yesPrice?: number; noPrice?: number } = {};
      if (r.yesPrice !== null) patch.yesPrice = r.yesPrice;
      if (r.noPrice !== null) patch.noPrice = r.noPrice;
      await ctx.db.patch(r.marketId, patch);
      updatedCount++;
    }

    await ctx.db.patch(syncId, {
      status: "completed", endedAt: Date.now(), itemCount: updatedCount,
      error: skippedCount > 0 ? `Updated: ${updatedCount}, Skipped: ${skippedCount}` : undefined,
    });

    if (updatedCount > 0) await ctx.scheduler.runAfter(0, internal.alertChecking.checkPriceAlerts, {});
    return { updatedCount, skippedCount };
  },
});
