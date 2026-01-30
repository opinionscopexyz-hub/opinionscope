// Leaderboard Whale Sync: Syncs top traders from leaderboard API for whale discovery
// Fetches multiple dataType/period combinations: volume and profit for periods 0,1,7,30
import { v } from "convex/values";
import { internalMutation, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { validateApiKey } from "./shared/helpers";
import { LEADERBOARD_PROXY_URL } from "./shared/constants";
import type { LeaderboardApiResponse } from "./shared/types";
import { isValidLeaderboardTrader } from "./shared/typeGuards";

// Leaderboard data types and periods to sync
const DATA_TYPES = ["volume", "profit", "points"] as const;
const PERIODS = [0, 1, 7, 30] as const; // 0=all-time, 1=24h, 7=7d, 30=30d

type DataType = (typeof DATA_TYPES)[number];
type Period = (typeof PERIODS)[number];

// Points only syncs periods 0 (all-time) and 7 (7d)
const PERIODS_BY_DATA_TYPE: Record<DataType, readonly Period[]> = {
  volume: PERIODS,
  profit: PERIODS,
  points: [0, 7] as const,
};

// Maps dataType + period to whale field name
function getWhaleFieldName(dataType: DataType, period: Period): string {
  const fieldMap: Record<string, string> = {
    "volume-0": "totalVolume",
    "volume-1": "volume24h",
    "volume-7": "volume7d",
    "volume-30": "volume30d",
    "profit-0": "totalPnl",
    "profit-1": "pnl24h",
    "profit-7": "pnl7d",
    "profit-30": "pnl30d",
    "points-0": "totalPoints",
    "points-7": "points7d",
  };
  return fieldMap[`${dataType}-${period}`];
}

// Maps stat field name to its timestamp field name for staleness tracking
function getTimestampFieldName(fieldName: string): string {
  return `${fieldName}SyncedAt`;
}

// ============ SYNC TRIGGER ============

export const triggerLeaderboardSync = internalMutation({
  args: {},
  handler: async (ctx) => {
    const syncId = await ctx.db.insert("syncLogs", {
      type: "leaderboard-whales",
      status: "running",
      startedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.scheduling.fetchAllLeaderboards, { syncId });

    return { syncId };
  },
});

// ============ FETCH ALL COMBINATIONS ============

export const fetchAllLeaderboards = internalAction({
  args: { syncId: v.id("syncLogs") },
  handler: async (ctx, args) => {
    const apiKey = validateApiKey();
    let totalProcessed = 0;
    let totalErrors = 0;
    let totalSkipped = 0;

    // Fetch all dataType/period combinations sequentially to avoid rate limiting
    for (const dataType of DATA_TYPES) {
      const periods = PERIODS_BY_DATA_TYPE[dataType];
      for (const period of periods) {
        try {
          const result = await fetchLeaderboardCombination(
            ctx,
            apiKey,
            dataType,
            period
          );
          totalProcessed += result.processedCount;
          totalErrors += result.errorCount;
          totalSkipped += result.skippedCount;

          // Small delay between API calls to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(
            `Failed to fetch leaderboard: dataType=${dataType}, period=${period}`,
            error
          );
          totalErrors++;
        }
      }
    }

    // Update sync log with final results
    await ctx.runMutation(internal.scheduling.markSyncCompleted, {
      syncId: args.syncId,
      itemCount: totalProcessed,
      error:
        totalErrors > 0 || totalSkipped > 0
          ? `Processed: ${totalProcessed}, Errors: ${totalErrors}, Skipped: ${totalSkipped}`
          : undefined,
    });

    return { syncId: args.syncId, totalProcessed, totalErrors, totalSkipped };
  },
});

// Fetch single dataType/period combination
async function fetchLeaderboardCombination(
  ctx: { runMutation: typeof internalAction.prototype },
  apiKey: string,
  dataType: DataType,
  period: Period
): Promise<{ processedCount: number; errorCount: number; skippedCount: number }> {
  const url = `${LEADERBOARD_PROXY_URL}/leaderboard?limit=100&dataType=${dataType}&chainId=56&period=${period}`;
  console.log(`Fetching leaderboard: dataType=${dataType}, period=${period}`);

  const response = await fetch(url, { headers: { apikey: apiKey } });

  if (!response.ok) {
    throw new Error(`Leaderboard API error: ${response.status}`);
  }

  const data: LeaderboardApiResponse = await response.json();

  if (data.errno !== 0 || !data.result?.list) {
    throw new Error(`Invalid leaderboard response: errno=${data.errno}`);
  }

  // Filter valid traders and deduplicate by address
  const validTraders = data.result.list.filter(isValidLeaderboardTrader);
  const seenAddresses = new Set<string>();
  const uniqueTraders = validTraders.filter((t) => {
    if (seenAddresses.has(t.walletAddress)) return false;
    seenAddresses.add(t.walletAddress);
    return true;
  });

  const fieldName = getWhaleFieldName(dataType, period);
  const skippedCount = data.result.list.length - uniqueTraders.length;

  // Map traders with the correct field for this dataType/period
  const tradersForDb = uniqueTraders.map((t) => ({
    walletAddress: t.walletAddress,
    userName: t.userName,
    avatar: t.avatar,
    rankingValue: t.rankingValue,
    fieldName,
    xUsername: t.xUsername,
    xUserId: t.xUserId,
  }));

  // Process results via mutation
  const result = await ctx.runMutation(
    internal.scheduling.processLeaderboardResults,
    {
      traders: tradersForDb,
      skippedCount,
    }
  );

  console.log(
    `Leaderboard ${dataType}-${period}: processed=${result.processedCount}, errors=${result.errorCount}`
  );

  return result;
}

// ============ RESULTS PROCESSING ============

export const processLeaderboardResults = internalMutation({
  args: {
    traders: v.array(
      v.object({
        walletAddress: v.string(),
        userName: v.string(),
        avatar: v.string(),
        rankingValue: v.string(), // API returns decimal string
        fieldName: v.string(), // Which whale field to update
        xUsername: v.optional(v.string()),
        xUserId: v.optional(v.string()),
      })
    ),
    skippedCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { traders, skippedCount: inputSkippedCount = 0 } = args;
    let processedCount = 0;
    let errorCount = 0;
    let localSkippedCount = 0;

    for (const trader of traders) {
      try {
        const value = parseFloat(trader.rankingValue);

        // Skip zero/invalid values to prevent overwriting real data
        // API sometimes returns empty strings or zeros for valid traders
        if (isNaN(value) || value === 0) {
          localSkippedCount++;
          continue;
        }

        // Build update object with the specific field and its timestamp for staleness tracking
        const updateFields: Record<string, number | string | undefined> = {
          [trader.fieldName]: value,
          [getTimestampFieldName(trader.fieldName)]: Date.now(),
        };

        await ctx.runMutation(internal.whales.upsertWhale, {
          address: trader.walletAddress,
          nickname: trader.userName || undefined,
          avatar: trader.avatar || undefined,
          dataType: "leaderboard",
          ...updateFields,
        });
        processedCount++;
      } catch (error) {
        errorCount++;
        console.error(
          `Failed to upsert whale: addr=${trader.walletAddress}, field=${trader.fieldName}, val=${trader.rankingValue}`,
          error
        );
      }
    }

    return { processedCount, errorCount, skippedCount: inputSkippedCount + localSkippedCount };
  },
});

// ============ SYNC STATUS HELPERS ============

export const markSyncCompleted = internalMutation({
  args: {
    syncId: v.id("syncLogs"),
    itemCount: v.number(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.syncId, {
      status: "completed",
      endedAt: Date.now(),
      itemCount: args.itemCount,
      error: args.error,
    });
  },
});

// Legacy: Keep for backwards compatibility with existing retrier calls
export const fetchLeaderboardData = internalAction({
  args: { syncId: v.id("syncLogs") },
  handler: async (ctx, args): Promise<{
    syncId: string;
    totalProcessed: number;
    totalErrors: number;
    totalSkipped: number;
  }> => {
    // Delegate to new multi-fetch function
    const result = await ctx.runAction(
      internal.scheduling.fetchAllLeaderboards,
      args
    );
    return result;
  },
});
