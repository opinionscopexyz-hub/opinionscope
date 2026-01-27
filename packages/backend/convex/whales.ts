import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthenticatedUser, requireAuth, getEffectiveTier } from "./lib/auth";
import { getTierLimits } from "./lib/tierLimits";
import type { Id } from "./_generated/dataModel";

// NOTE: MIN_TRADES_FOR_LEADERBOARD filter removed - we trust the API data

export const getLeaderboard = query({
  args: {
    sortBy: v.optional(
      v.union(
        v.literal("totalVolume"),
        v.literal("totalPnl"),
        v.literal("followerCount"),
        // Period-specific sort options
        v.literal("volume24h"),
        v.literal("volume7d"),
        v.literal("volume30d"),
        v.literal("pnl24h"),
        v.literal("pnl7d"),
        v.literal("pnl30d"),
        // Points sort options
        v.literal("totalPoints"),
        v.literal("points7d")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { sortBy = "totalVolume", limit = 50 } = args;

    // Leaderboard is free data - no tier restriction
    // Cap at 100 for performance (matches frontend max)
    const effectiveLimit = Math.min(limit, 100);

    // Use index range queries for efficient filtering (excludes undefined and 0)
    // Index range is evaluated at DB level, much faster than JS filter
    const db = ctx.db;
    let whales;

    switch (sortBy) {
      case "totalVolume":
        whales = await db.query("whales").withIndex("by_totalVolume", (q) => q.gt("totalVolume", 0)).order("desc").take(effectiveLimit);
        break;
      case "totalPnl":
        whales = await db.query("whales").withIndex("by_totalPnl", (q) => q.gt("totalPnl", 0)).order("desc").take(effectiveLimit);
        break;
      case "followerCount":
        whales = await db.query("whales").withIndex("by_followerCount", (q) => q.gt("followerCount", 0)).order("desc").take(effectiveLimit);
        break;
      case "volume24h":
        whales = await db.query("whales").withIndex("by_volume24h", (q) => q.gt("volume24h", 0)).order("desc").take(effectiveLimit);
        break;
      case "volume7d":
        whales = await db.query("whales")
          .filter((q) => q.gt(q.field("volume7d"), 0))
          .take(effectiveLimit * 3)
          .then((all) => all.sort((a, b) => (b.volume7d ?? 0) - (a.volume7d ?? 0)).slice(0, effectiveLimit));
        break;
      case "volume30d":
        whales = await db.query("whales")
          .filter((q) => q.gt(q.field("volume30d"), 0))
          .take(effectiveLimit * 3)
          .then((all) => all.sort((a, b) => (b.volume30d ?? 0) - (a.volume30d ?? 0)).slice(0, effectiveLimit));
        break;
      case "pnl24h":
        whales = await db.query("whales").withIndex("by_pnl24h", (q) => q.gt("pnl24h", 0)).order("desc").take(effectiveLimit);
        break;
      case "pnl7d":
        whales = await db.query("whales")
          .filter((q) => q.neq(q.field("pnl7d"), 0))
          .take(effectiveLimit * 3)
          .then((all) => all.sort((a, b) => (b.pnl7d ?? 0) - (a.pnl7d ?? 0)).slice(0, effectiveLimit));
        break;
      case "pnl30d":
        whales = await db.query("whales")
          .filter((q) => q.neq(q.field("pnl30d"), 0))
          .take(effectiveLimit * 3)
          .then((all) => all.sort((a, b) => (b.pnl30d ?? 0) - (a.pnl30d ?? 0)).slice(0, effectiveLimit));
        break;
      case "totalPoints":
        whales = await db.query("whales").withIndex("by_totalPoints", (q) => q.gt("totalPoints", 0)).order("desc").take(effectiveLimit);
        break;
      case "points7d":
        whales = await db.query("whales").withIndex("by_points7d", (q) => q.gt("points7d", 0)).order("desc").take(effectiveLimit);
        break;
      default:
        whales = await db.query("whales").withIndex("by_totalVolume", (q) => q.gt("totalVolume", 0)).order("desc").take(effectiveLimit);
    }

    return {
      whales,
      isLimited: effectiveLimit < limit,
      limit: effectiveLimit,
    };
  },
});

export const getById = query({
  args: { id: v.id("whales") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByAddress = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("whales")
      .withIndex("by_address", (q) => q.eq("address", args.address))
      .unique();
  },
});

export const getFollowedWhales = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();

    if (!user) return [];

    const whales = await Promise.all(
      user.followedWhaleIds.map((id) => ctx.db.get(id))
    );

    return whales.filter(Boolean);
  },
});

export const getRecentActivity = query({
  args: {
    whaleId: v.id("whales"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { whaleId, limit = 10 } = args;

    // Check user tier for visibility
    const identity = await ctx.auth.getUserIdentity();
    let visibleAfter = Date.now() - 15 * 60 * 1000; // Default: 15 min delay (free)

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) =>
          q.eq("clerkId", identity.tokenIdentifier)
        )
        .unique();

      if (user) {
        const effectiveTier = getEffectiveTier(user);
        const tierLimits = getTierLimits(effectiveTier);

        if (tierLimits.earlyAccessSeconds === 0) {
          visibleAfter = 0; // Pro+ sees everything instantly
        } else if (effectiveTier === "pro") {
          visibleAfter = Date.now() - 30 * 1000; // Pro sees after 30s
        }
      }
    }

    const activities = await ctx.db
      .query("whaleActivity")
      .withIndex("by_whaleId_timestamp", (q) => q.eq("whaleId", whaleId))
      .order("desc")
      .filter((q) => q.gte(q.field("timestamp"), visibleAfter))
      .take(limit);

    // Fetch related markets
    const activitiesWithMarkets = await Promise.all(
      activities.map(async (activity) => {
        const market = await ctx.db.get(activity.marketId);
        return { ...activity, market };
      })
    );

    return activitiesWithMarkets;
  },
});

// Query to check if user is following a whale
export const isFollowing = query({
  args: { whaleId: v.id("whales") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return false;
    return user.followedWhaleIds.includes(args.whaleId);
  },
});

// Follow a whale
export const follow = mutation({
  args: { whaleId: v.id("whales") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const effectiveTier = getEffectiveTier(user);

    // Verify whale exists
    const whale = await ctx.db.get(args.whaleId);
    if (!whale) {
      throw new Error("Whale not found");
    }

    // Re-read user to get fresh followedWhaleIds (avoid race condition)
    const freshUser = await ctx.db.get(user._id);
    if (!freshUser) {
      throw new Error("User not found");
    }

    // Check if already following
    if (freshUser.followedWhaleIds.includes(args.whaleId)) {
      return { success: true, alreadyFollowing: true };
    }

    // Check tier limit with effective tier (accounts for expiration)
    const limits = getTierLimits(effectiveTier);
    if (freshUser.followedWhaleIds.length >= limits.maxFollowedWhales) {
      throw new Error(
        `You can only follow ${limits.maxFollowedWhales} whales on your plan. Upgrade to follow more.`
      );
    }

    // Add to followed list
    await ctx.db.patch(freshUser._id, {
      followedWhaleIds: [...freshUser.followedWhaleIds, args.whaleId],
      updatedAt: Date.now(),
    });

    // Re-read whale to get fresh followerCount (avoid race condition)
    const freshWhale = await ctx.db.get(args.whaleId);
    if (freshWhale) {
      await ctx.db.patch(args.whaleId, {
        followerCount: freshWhale.followerCount + 1,
      });
    }

    return { success: true, alreadyFollowing: false };
  },
});

// Unfollow a whale
export const unfollow = mutation({
  args: { whaleId: v.id("whales") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Re-read user to get fresh followedWhaleIds (avoid race condition)
    const freshUser = await ctx.db.get(user._id);
    if (!freshUser) {
      throw new Error("User not found");
    }

    if (!freshUser.followedWhaleIds.includes(args.whaleId)) {
      return { success: true, wasFollowing: false };
    }

    // Remove from followed list
    await ctx.db.patch(freshUser._id, {
      followedWhaleIds: freshUser.followedWhaleIds.filter((id) => id !== args.whaleId),
      updatedAt: Date.now(),
    });

    // Re-read whale to get fresh followerCount (avoid race condition)
    const whale = await ctx.db.get(args.whaleId);
    if (whale && whale.followerCount > 0) {
      await ctx.db.patch(args.whaleId, {
        followerCount: whale.followerCount - 1,
      });
    }

    return { success: true, wasFollowing: true };
  },
});

// Get recent trades with tier limits
export const getRecentTrades = query({
  args: {
    whaleId: v.id("whales"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const effectiveTier = user ? getEffectiveTier(user) : "free";
    const limits = getTierLimits(effectiveTier);

    const trades = await ctx.db
      .query("whaleActivity")
      .withIndex("by_whaleId_timestamp", (q) => q.eq("whaleId", args.whaleId))
      .order("desc")
      .take(limits.recentTradesVisible);

    // Enrich with market data
    const enrichedTrades = await Promise.all(
      trades.map(async (trade) => {
        const market = await ctx.db.get(trade.marketId);
        return {
          ...trade,
          marketTitle: market?.title ?? "Unknown Market",
          marketCategory: market?.category,
        };
      })
    );

    return enrichedTrades;
  },
});

// Get paginated trade history for whale profile page
export const getTradeHistory = query({
  args: {
    whaleId: v.id("whales"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { whaleId, limit = 20, cursor } = args;

    // Check user tier for max trades
    const user = await getAuthenticatedUser(ctx);
    const effectiveTier = user ? getEffectiveTier(user) : "free";
    const limits = getTierLimits(effectiveTier);

    // Build query with cursor-based pagination
    let query = ctx.db
      .query("whaleActivity")
      .withIndex("by_whaleId_timestamp", (q) => q.eq("whaleId", whaleId))
      .order("desc");

    if (cursor !== undefined) {
      query = query.filter((q) => q.lt(q.field("timestamp"), cursor));
    }

    // Fetch trades up to tier limit
    const maxTrades = limits.recentTradesVisible;
    const effectiveLimit = Math.min(limit + 1, maxTrades);
    const trades = await query.take(effectiveLimit);

    const page = trades.slice(0, limit);
    const hasMore = page.length === limit && trades.length < maxTrades;

    // Enrich with market data
    const enrichedTrades = await Promise.all(
      page.map(async (trade) => {
        const market = await ctx.db.get(trade.marketId);
        return {
          ...trade,
          marketTitle: market?.title ?? "Unknown Market",
          marketCategory: market?.category,
          marketUrl: market?.url,
        };
      })
    );

    return {
      trades: enrichedTrades,
      hasMore,
      nextCursor: hasMore && page.length > 0 ? page[page.length - 1].timestamp : undefined,
      tierLimit: maxTrades,
      isLimited: trades.length >= maxTrades,
    };
  },
});

// Get whale's active market positions grouped by market
export const getPositions = query({
  args: {
    whaleId: v.id("whales"),
  },
  handler: async (ctx, args) => {
    const { whaleId } = args;

    // Check user tier
    const user = await getAuthenticatedUser(ctx);
    const effectiveTier = user ? getEffectiveTier(user) : "free";

    // Free tier sees limited positions
    const maxPositions = effectiveTier === "free" ? 3 : effectiveTier === "pro" ? 10 : 50;

    // Get recent trades to calculate positions (last 30 days for accuracy)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const trades = await ctx.db
      .query("whaleActivity")
      .withIndex("by_whaleId_timestamp", (q) => q.eq("whaleId", whaleId))
      .order("desc")
      .filter((q) => q.gte(q.field("timestamp"), thirtyDaysAgo))
      .take(500);

    // Group by market and calculate net position
    const positionMap = new Map<
      string,
      {
        marketId: string;
        buyAmount: number;
        sellAmount: number;
        lastTradeAt: number;
        outcome: string;
      }
    >();

    for (const trade of trades) {
      const key = `${trade.marketId}-${trade.outcome}`;
      const existing = positionMap.get(key);

      if (existing) {
        if (trade.action === "BUY") {
          existing.buyAmount += trade.amount;
        } else {
          existing.sellAmount += trade.amount;
        }
        if (trade.timestamp > existing.lastTradeAt) {
          existing.lastTradeAt = trade.timestamp;
        }
      } else {
        positionMap.set(key, {
          marketId: trade.marketId.toString(),
          buyAmount: trade.action === "BUY" ? trade.amount : 0,
          sellAmount: trade.action === "SELL" ? trade.amount : 0,
          lastTradeAt: trade.timestamp,
          outcome: trade.outcome,
        });
      }
    }

    // Filter to positions with net positive exposure
    const activePositions = Array.from(positionMap.values())
      .filter((p) => p.buyAmount > p.sellAmount)
      .sort((a, b) => b.lastTradeAt - a.lastTradeAt)
      .slice(0, maxPositions);

    // Enrich with market data
    const enrichedPositions = await Promise.all(
      activePositions.map(async (pos) => {
        const market = await ctx.db.get(pos.marketId as Id<"markets">);
        return {
          marketId: pos.marketId,
          marketTitle: market?.title ?? "Unknown Market",
          marketCategory: market?.category,
          marketUrl: market?.url,
          outcome: pos.outcome,
          netPosition: pos.buyAmount - pos.sellAmount,
          currentPrice: market?.yesPrice ?? 0,
          lastTradeAt: pos.lastTradeAt,
        };
      })
    );

    return {
      positions: enrichedPositions,
      isLimited: positionMap.size > maxPositions,
      tierLimit: maxPositions,
    };
  },
});

// Internal mutation for data sync
export const upsertWhale = internalMutation({
  args: {
    address: v.string(),
    nickname: v.optional(v.string()),
    avatar: v.optional(v.string()),
    isVerified: v.optional(v.boolean()),
    // Data source: leaderboard takes priority over other
    dataType: v.optional(v.union(v.literal("leaderboard"), v.literal("other"))),
    totalVolume: v.optional(v.number()),
    totalPnl: v.optional(v.number()),
    tradeCount: v.optional(v.number()),
    favoriteCategories: v.optional(v.array(v.string())),
    platforms: v.optional(v.array(v.string())),
    // Period-specific volume stats
    volume24h: v.optional(v.number()),
    volume7d: v.optional(v.number()),
    volume30d: v.optional(v.number()),
    // Period-specific P&L stats
    pnl24h: v.optional(v.number()),
    pnl7d: v.optional(v.number()),
    pnl30d: v.optional(v.number()),
    // Points stats
    totalPoints: v.optional(v.number()),
    points7d: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { address, dataType, ...data } = args;

    const existing = await ctx.db
      .query("whales")
      .withIndex("by_address", (q) => q.eq("address", address))
      .unique();

    const now = Date.now();

    // Filter out undefined values to avoid overwriting existing period stats
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );

    if (existing) {
      // DataType priority: leaderboard > other (only upgrade, never downgrade)
      const newDataType =
        dataType === "leaderboard" ? "leaderboard" : existing.dataType;

      const patchData = {
        ...updateData,
        ...(newDataType && { dataType: newDataType }),
        // Track when this whale was last seen in leaderboard sync
        ...(dataType === "leaderboard" && { leaderboardSyncedAt: now }),
        lastActiveAt: now,
        updatedAt: now,
      };
      await ctx.db.patch(existing._id, patchData);
      return existing._id;
    } else {
      // Only set fields that are provided - don't default to 0
      // This allows each sync type to populate only its relevant field
      return await ctx.db.insert("whales", {
        address,
        nickname: data.nickname,
        avatar: data.avatar,
        isVerified: data.isVerified ?? false,
        dataType: dataType,
        totalVolume: data.totalVolume,      // undefined if not provided
        totalPnl: data.totalPnl,            // undefined if not provided
        tradeCount: data.tradeCount,        // undefined if not provided
        favoriteCategories: data.favoriteCategories ?? [],
        platforms: data.platforms ?? ["opinion_trade"],
        followerCount: 0,
        volume24h: data.volume24h,
        volume7d: data.volume7d,
        volume30d: data.volume30d,
        pnl24h: data.pnl24h,
        pnl7d: data.pnl7d,
        pnl30d: data.pnl30d,
        totalPoints: data.totalPoints,
        points7d: data.points7d,
        // Track when this whale was first seen in leaderboard sync
        leaderboardSyncedAt: dataType === "leaderboard" ? now : undefined,
        lastActiveAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
