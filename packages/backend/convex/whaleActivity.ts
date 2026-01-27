import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { calculateVisibilityTimestamps } from "./lib/tierLimits";

export const getFeed = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
    // Pro+ only filters
    followedOnly: v.optional(v.boolean()),
    minAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit = 50, cursor, followedOnly, minAmount } = args;

    // Determine visibility based on user tier
    const identity = await ctx.auth.getUserIdentity();
    let visibilityField:
      | "visibleToProPlusAt"
      | "visibleToProAt"
      | "visibleToFreeAt" = "visibleToFreeAt";
    const now = Date.now();
    let userTier: "free" | "pro" | "pro_plus" = "free";
    let followedWhaleIdsSet: Set<string> = new Set();

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) =>
          q.eq("clerkId", identity.tokenIdentifier)
        )
        .unique();

      if (user) {
        userTier = user.tier;
        // Use Set for O(1) lookups instead of array O(n)
        followedWhaleIdsSet = new Set(
          user.followedWhaleIds.map((id) => id.toString())
        );
        if (user.tier === "pro_plus") {
          visibilityField = "visibleToProPlusAt";
        } else if (user.tier === "pro") {
          visibilityField = "visibleToProAt";
        }
      }
    }

    // Validate minAmount (must be positive number)
    const validMinAmount =
      minAmount !== undefined && !isNaN(minAmount) && minAmount > 0
        ? minAmount
        : undefined;

    // Query activities visible to user's tier
    const dbQuery = ctx.db.query("whaleActivity");
    let query;

    switch (visibilityField) {
      case "visibleToProPlusAt":
        query = dbQuery.withIndex("by_visibleToProPlus");
        break;
      case "visibleToProAt":
        query = dbQuery.withIndex("by_visibleToPro");
        break;
      default:
        query = dbQuery.withIndex("by_visibleToFree");
    }

    // Apply cursor filter if provided
    let filteredQuery = query.order("desc");
    if (cursor !== undefined) {
      filteredQuery = filteredQuery.filter((q) =>
        q.lt(q.field("timestamp"), cursor)
      );
    }
    filteredQuery = filteredQuery.filter((q) =>
      q.lte(q.field(visibilityField), now)
    );

    // Fetch more items to account for post-query filtering
    // If filters are active, fetch extra to ensure we get enough results
    const fetchMultiplier =
      userTier === "pro_plus" && (followedOnly || validMinAmount) ? 4 : 1;
    const fetchLimit = (limit + 1) * fetchMultiplier;
    const activities = await filteredQuery.take(fetchLimit);

    let filteredActivities = activities;

    // Apply Pro+ only filters (post-query due to Convex limitations)
    if (userTier === "pro_plus") {
      if (followedOnly && followedWhaleIdsSet.size > 0) {
        filteredActivities = filteredActivities.filter((a) =>
          followedWhaleIdsSet.has(a.whaleId.toString())
        );
      }
      if (validMinAmount !== undefined) {
        filteredActivities = filteredActivities.filter(
          (a) => a.amount >= validMinAmount
        );
      }
    }

    const hasMore = filteredActivities.length > limit;
    const page = filteredActivities.slice(0, limit);

    // Fetch related whales and markets
    const activitiesWithDetails = await Promise.all(
      page.map(async (activity) => {
        const [whale, market] = await Promise.all([
          ctx.db.get(activity.whaleId),
          ctx.db.get(activity.marketId),
        ]);
        return { ...activity, whale, market };
      })
    );

    return {
      activities: activitiesWithDetails,
      hasMore,
      nextCursor: hasMore ? page[page.length - 1]?.timestamp : undefined,
      tier: userTier,
    };
  },
});

export const getByWhale = query({
  args: {
    whaleId: v.id("whales"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { whaleId, limit = 20 } = args;

    // Check user tier
    const identity = await ctx.auth.getUserIdentity();
    let maxTrades = 3; // Free tier

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) =>
          q.eq("clerkId", identity.tokenIdentifier)
        )
        .unique();

      if (user) {
        const { getTierLimits } = await import("./lib/tierLimits");
        const limits = getTierLimits(user.tier);
        maxTrades = limits.recentTradesVisible;
      }
    }

    const effectiveLimit = Math.min(limit, maxTrades);

    const activities = await ctx.db
      .query("whaleActivity")
      .withIndex("by_whaleId_timestamp", (q) => q.eq("whaleId", whaleId))
      .order("desc")
      .take(effectiveLimit);

    // Fetch related markets
    const activitiesWithMarkets = await Promise.all(
      activities.map(async (activity) => {
        const market = await ctx.db.get(activity.marketId);
        return { ...activity, market };
      })
    );

    return {
      activities: activitiesWithMarkets,
      isLimited: effectiveLimit < limit,
      limit: effectiveLimit,
    };
  },
});

export const getByMarket = query({
  args: {
    marketId: v.id("markets"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { marketId, limit = 20 } = args;

    const activities = await ctx.db
      .query("whaleActivity")
      .withIndex("by_marketId_timestamp", (q) => q.eq("marketId", marketId))
      .order("desc")
      .take(limit);

    // Fetch related whales
    const activitiesWithWhales = await Promise.all(
      activities.map(async (activity) => {
        const whale = await ctx.db.get(activity.whaleId);
        return { ...activity, whale };
      })
    );

    return activitiesWithWhales;
  },
});

// Internal mutation for recording whale activity
export const recordActivity = internalMutation({
  args: {
    whaleId: v.id("whales"),
    marketId: v.id("markets"),
    action: v.union(v.literal("BUY"), v.literal("SELL")),
    outcome: v.string(), // Outcome label from the API
    outcomeSide: v.number(), // Numeric side identifier (0 or 1)
    amount: v.number(),
    price: v.number(),
    platform: v.string(),
    txHash: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const { timestamp, ...data } = args;

    // Calculate visibility timestamps for tiered delivery
    const visibility = calculateVisibilityTimestamps(timestamp);

    const activityId = await ctx.db.insert("whaleActivity", {
      ...data,
      timestamp,
      ...visibility,
    });

    // Trigger whale alert check for users following this whale
    await ctx.scheduler.runAfter(0, internal.alertChecking.checkWhaleAlertsForActivity, {
      whaleId: args.whaleId,
      activityId,
    });

    return activityId;
  },
});
