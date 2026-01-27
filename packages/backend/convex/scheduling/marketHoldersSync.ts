// DISABLED: Market Holders Sync - future feature (may cause API rate limiting issues)
// This entire file is commented out. Re-enable when ready to implement holder-based whale discovery.

/*
// Market Holders Sync: Fetches top YES/NO holders for whale discovery
import { v } from "convex/values";
import { internalMutation, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { retrier } from "../lib/retrier";
import { delay, validateApiKey } from "./shared/helpers";
import { LEADERBOARD_PROXY_URL, MARKET_HOLDERS_BATCH_SIZE, HOLDERS_PER_MARKET, BATCH_DELAY_MS } from "./shared/constants";
import type { MarketHolder, HolderApiResponse } from "./shared/types";
import { isValidHolder } from "./shared/typeGuards";

async function fetchHoldersForSide(marketId: string, side: "yes" | "no", apiKey: string): Promise<MarketHolder[]> {
  const response = await fetch(`${LEADERBOARD_PROXY_URL}/topic/${marketId}/holder?type=${side}&chainId=56&page=1&limit=${HOLDERS_PER_MARKET}`, { headers: { apikey: apiKey } });
  if (!response.ok) throw new Error(`Holder API error: ${response.status}`);
  let data: HolderApiResponse;
  try { data = await response.json(); } catch { console.error(`Malformed JSON for market ${marketId} ${side}`); return []; }
  if (typeof data !== "object" || data === null || data.errno !== 0 || !data.result?.list) return [];
  return data.result.list.filter(isValidHolder);
}

function updateHolderMap(map: Map<string, { walletAddress: string; userName: string; avatar: string; totalProfit: number }>, h: MarketHolder): void {
  const existing = map.get(h.walletAddress);
  if (existing) {
    existing.totalProfit += h.profit || 0;
    if (h.userName) existing.userName = h.userName;
    if (h.avatar) existing.avatar = h.avatar;
  } else {
    map.set(h.walletAddress, { walletAddress: h.walletAddress, userName: h.userName || "", avatar: h.avatar || "", totalProfit: h.profit || 0 });
  }
}

export const triggerMarketHoldersSync = internalMutation({
  args: {},
  handler: async (ctx) => {
    const syncId = await ctx.db.insert("syncLogs", { type: "market-holders", status: "running", startedAt: Date.now() });
    // Only binary markets have holders (categorical children have parentExternalId set)
    const activeMarkets = await ctx.db.query("markets").filter((q) => q.and(q.eq(q.field("platform"), "opinion_trade"), q.eq(q.field("resolvedAt"), undefined), q.eq(q.field("parentExternalId"), undefined))).collect();
    if (activeMarkets.length === 0) {
      await ctx.db.patch(syncId, { status: "completed", endedAt: Date.now(), itemCount: 0 });
      return { syncId, message: "No active markets to scan" };
    }
    await retrier.run(ctx, internal.scheduling.fetchMarketHolders, { syncId, marketIds: activeMarkets.map((m) => m.externalId) });
    return { syncId, marketCount: activeMarkets.length };
  },
});

export const fetchMarketHolders = internalAction({
  args: { syncId: v.id("syncLogs"), marketIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const { syncId, marketIds } = args;
    const apiKey = validateApiKey();
    const holdersMap = new Map<string, { walletAddress: string; userName: string; avatar: string; totalProfit: number }>();
    let fetchErrors = 0, marketsProcessed = 0;

    for (let i = 0; i < marketIds.length; i += MARKET_HOLDERS_BATCH_SIZE) {
      if (i > 0) await delay(BATCH_DELAY_MS);
      const batch = marketIds.slice(i, i + MARKET_HOLDERS_BATCH_SIZE);

      for (const marketId of batch) {
        try {
          const yesHolders = await fetchHoldersForSide(marketId, "yes", apiKey);

          for (const h of yesHolders) updateHolderMap(holdersMap, h);
        } catch (error) { fetchErrors++; console.error(`Failed YES holders for ${marketId}:`, error); }
        await delay(100);
        try {
          const noHolders = await fetchHoldersForSide(marketId, "no", apiKey);
          for (const h of noHolders) updateHolderMap(holdersMap, h);
        } catch (error) { fetchErrors++; console.error(`Failed NO holders for ${marketId}:`, error); }
        marketsProcessed++;
      }
    }

    await ctx.runMutation(internal.scheduling.processMarketHoldersResults, { syncId, holders: Array.from(holdersMap.values()), fetchErrors, marketsProcessed });
    return { syncId, holderCount: holdersMap.size, marketsProcessed };
  },
});

export const processMarketHoldersResults = internalMutation({
  args: {
    syncId: v.id("syncLogs"),
    holders: v.array(v.object({ walletAddress: v.string(), userName: v.string(), avatar: v.string(), totalProfit: v.number() })),
    fetchErrors: v.optional(v.number()),
    marketsProcessed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { syncId, holders, fetchErrors = 0, marketsProcessed = 0 } = args;
    let processedCount = 0, errorCount = 0, newWhalesCount = 0;
    console.log("holders list:", holders.splice(0, 10));

    for (const h of holders) {
      try {
        const existing = await ctx.db.query("whales").withIndex("by_address", (q) => q.eq("address", h.walletAddress)).unique();
        if (!existing) newWhalesCount++;
        await ctx.runMutation(internal.whales.upsertWhale, { address: h.walletAddress, nickname: h.userName || undefined, avatar: h.avatar || undefined, totalPnl: h.totalProfit });
        processedCount++;
      } catch (error) { errorCount++; console.error(`Failed to upsert holder ${h.walletAddress}:`, error); }
    }

    const hasErrors = errorCount > 0 || fetchErrors > 0;
    await ctx.db.patch(syncId, {
      status: processedCount === 0 && hasErrors ? "failed" : "completed", endedAt: Date.now(), itemCount: processedCount,
      error: hasErrors ? `Markets: ${marketsProcessed}, Holders: ${processedCount}, New: ${newWhalesCount}, FetchErrs: ${fetchErrors}, ProcessErrs: ${errorCount}` : `Markets: ${marketsProcessed}, Holders: ${processedCount}, New: ${newWhalesCount}`,
    });
    return { processedCount, errorCount, newWhalesCount };
  },
});
*/
