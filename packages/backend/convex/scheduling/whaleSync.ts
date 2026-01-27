// Whale Sync: Fetches whale trading activity from Opinion.Trade API
// Uses chunked actions to avoid timeout issues with slow API responses
import { v } from "convex/values";
import { internalMutation, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { delay, getApiBaseUrl, validateApiKey } from "./shared/helpers";
import type { ApiBaseResponse, PaginatedResult, TradeApiResponse } from "./shared/types";
import { isValidTradeResponse } from "./shared/typeGuards";

// Chunk size for splitting whale sync into multiple actions
const CHUNK_SIZE = 10;
// Delay between scheduling chunks (ms) to stagger API load
const CHUNK_SCHEDULE_DELAY = 2000;
// Fetch timeout per whale (ms) to avoid hanging on slow responses
const FETCH_TIMEOUT_MS = 20000;

// ============ SYNC TRIGGER ============
// Schedules multiple chunk actions instead of one large action

export const triggerWhaleSync = internalMutation({
  args: {},
  handler: async (ctx) => {
    const syncId = await ctx.db.insert("syncLogs", { type: "whales", status: "running", startedAt: Date.now() });
    const whales = await ctx.db.query("whales").collect();

    if (whales.length === 0) {
      await ctx.db.patch(syncId, { status: "completed", endedAt: Date.now(), itemCount: 0 });
      return { syncId, message: "No whales to sync" };
    }

    const addresses = whales.map((w) => w.address);
    const totalChunks = Math.ceil(addresses.length / CHUNK_SIZE);

    // Schedule chunks with staggered delays
    for (let i = 0; i < addresses.length; i += CHUNK_SIZE) {
      const chunk = addresses.slice(i, i + CHUNK_SIZE);
      const chunkIndex = Math.floor(i / CHUNK_SIZE);
      const delayMs = chunkIndex * CHUNK_SCHEDULE_DELAY;

      await ctx.scheduler.runAfter(delayMs, internal.scheduling.fetchWhaleChunk, {
        syncId,
        addresses: chunk,
        chunkIndex,
        totalChunks,
      });
    }

    // Mark sync as completed immediately (fire-and-forget approach)
    // Each chunk will process independently and log its own results
    await ctx.db.patch(syncId, {
      status: "completed",
      endedAt: Date.now(),
      itemCount: whales.length,
      error: `Scheduled ${totalChunks} chunks`,
    });

    return { syncId, totalChunks, whaleCount: whales.length };
  },
});

// ============ CHUNK PROCESSOR ============
// Processes a single chunk of whales (typically 20)

export const fetchWhaleChunk = internalAction({
  args: {
    syncId: v.id("syncLogs"),
    addresses: v.array(v.string()),
    chunkIndex: v.number(),
    totalChunks: v.number(),
  },
  handler: async (ctx, args) => {
    const { addresses, chunkIndex, totalChunks } = args;
    const apiKey = validateApiKey();

    type Trade = {
      marketId: string;
      action: "BUY" | "SELL";
      outcome: string;
      outcomeSide: number;
      amount: number;
      price: number;
      timestamp: number;
      txHash?: string;
    };

    const activities: Array<{ address: string; trades: Trade[]; totalTrades: number }> = [];
    let fetchErrors = 0;
    let skippedTrades = 0;

    console.log(`[WhaleSync] Chunk ${chunkIndex + 1}/${totalChunks}: Processing ${addresses.length} whales`);

    for (const address of addresses) {
      try {
        // Fetch with timeout to avoid hanging on slow responses
        await delay(200);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);


        const response = await fetch(
          `${getApiBaseUrl()}/trade/user/${address}?limit=20&chainId=56`,
          { headers: { apikey: apiKey }, signal: controller.signal }
        );
        clearTimeout(timeout);

        const data: ApiBaseResponse<PaginatedResult<TradeApiResponse>> = await response.json();

        if (!response.ok) {
          fetchErrors++;
          console.error(`[WhaleSync] API error for ${address}: ${response.status}`);
          continue;
        }

        if (data.errno !== 0 || !data.result?.list) {
          fetchErrors++;
          continue;
        }

        const validTrades: Trade[] = [];
        for (const t of data.result.list) {
          if (!isValidTradeResponse(t)) {
            skippedTrades++;
            continue;
          }
          const amount = parseFloat(t.amount);
          const price = parseFloat(t.price);
          if (isNaN(amount) || isNaN(price) || !t.createdAt) {
            skippedTrades++;
            continue;
          }
          validTrades.push({
            marketId: String(t.marketId),
            action: t.side.toUpperCase() === "SELL" ? "SELL" : "BUY",
            outcome: t.outcome,
            outcomeSide: t.outcomeSide,
            amount,
            price,
            timestamp: t.createdAt,
            txHash: t.txHash,
          });
        }

        activities.push({ address, trades: validTrades, totalTrades: data.result.total ?? 0 });
      } catch (error) {
        fetchErrors++;
        const isTimeout = error instanceof Error && error.name === "AbortError";
        console.error(`[WhaleSync] ${isTimeout ? "Timeout" : "Failed"} for ${address}:`, error);
      }
    }

    // Process results for this chunk
    await ctx.runMutation(internal.scheduling.processWhaleChunkResults, {
      activities,
      fetchErrors,
      skippedTrades,
      chunkIndex,
      totalChunks,
    });

    console.log(`[WhaleSync] Chunk ${chunkIndex + 1}/${totalChunks}: Done. ${activities.length} whales, ${fetchErrors} errors`);
    return { chunkIndex, processed: activities.length, errors: fetchErrors };
  },
});

// ============ CHUNK RESULTS PROCESSOR ============
// Processes results from a single chunk - updates whale records and activities

const tradeValidator = v.object({
  marketId: v.string(),
  action: v.union(v.literal("BUY"), v.literal("SELL")),
  outcome: v.string(),
  outcomeSide: v.number(),
  amount: v.number(),
  price: v.number(),
  timestamp: v.number(),
  txHash: v.optional(v.string()),
});

export const processWhaleChunkResults = internalMutation({
  args: {
    activities: v.array(v.object({ address: v.string(), trades: v.array(tradeValidator), totalTrades: v.number() })),
    fetchErrors: v.number(),
    skippedTrades: v.number(),
    chunkIndex: v.number(),
    totalChunks: v.number(),
  },
  handler: async (ctx, args) => {
    const { activities, chunkIndex, totalChunks } = args;
    let newActivityCount = 0;
    let processErrors = 0;

    for (const { address, trades, totalTrades } of activities) {
      const whale = await ctx.db.query("whales").withIndex("by_address", (q) => q.eq("address", address)).unique();
      if (!whale) continue;

      // Update whale's trade count and last active timestamp from API
      if (totalTrades > 0) {
        const latestTradeTimestamp = trades.length > 0 ? trades[0].timestamp : undefined;
        await ctx.db.patch(whale._id, {
          tradeCount: totalTrades,
          ...(latestTradeTimestamp && { lastActiveAt: latestTradeTimestamp }),
          updatedAt: Date.now(),
        });
      }

      // Get latest activity to avoid duplicates
      const latestActivity = await ctx.db
        .query("whaleActivity")
        .withIndex("by_whaleId_timestamp", (q) => q.eq("whaleId", whale._id))
        .order("desc")
        .first();
      const lastTimestamp = latestActivity?.timestamp ?? 0;

      for (const trade of trades) {
        if (trade.timestamp <= lastTimestamp) continue;

        const market = await ctx.db
          .query("markets")
          .withIndex("by_externalId", (q) => q.eq("platform", "opinion_trade").eq("externalId", trade.marketId))
          .unique();
        if (!market) continue;

        try {
          await ctx.runMutation(internal.whaleActivity.recordActivity, {
            whaleId: whale._id,
            marketId: market._id,
            action: trade.action,
            outcome: trade.outcome,
            outcomeSide: trade.outcomeSide,
            amount: trade.amount,
            price: trade.price,
            platform: "opinion_trade",
            txHash: trade.txHash,
            timestamp: trade.timestamp,
          });
          newActivityCount++;
        } catch (error) {
          processErrors++;
          console.error(`[WhaleSync] Failed to record activity:`, error);
        }
      }
    }

    console.log(`[WhaleSync] Chunk ${chunkIndex + 1}/${totalChunks} processed: ${newActivityCount} new activities, ${processErrors} errors`);
    return { newActivityCount, processErrors };
  },
});

// ============ LEGACY EXPORTS (for backwards compatibility) ============
// These are no longer used but kept to avoid breaking existing code

export const fetchWhaleActivity = internalAction({
  args: { syncId: v.id("syncLogs"), whaleAddresses: v.array(v.string()) },
  handler: async () => {
    console.warn("[WhaleSync] fetchWhaleActivity is deprecated. Use fetchWhaleChunk instead.");
    return { deprecated: true };
  },
});

export const processWhaleSyncResults = internalMutation({
  args: {
    syncId: v.id("syncLogs"),
    activities: v.array(v.object({ address: v.string(), trades: v.array(tradeValidator), totalTrades: v.number() })),
    fetchErrors: v.optional(v.number()),
    skippedTrades: v.optional(v.number()),
  },
  handler: async () => {
    console.warn("[WhaleSync] processWhaleSyncResults is deprecated. Use processWhaleChunkResults instead.");
    return { deprecated: true };
  },
});
