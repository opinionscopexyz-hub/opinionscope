import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

// Filter validators
const filterArgsValidator = {
  search: v.optional(v.string()),
  category: v.optional(v.string()),
  minPrice: v.optional(v.number()),
  maxPrice: v.optional(v.number()),
  minVolume: v.optional(v.number()),
  maxVolume: v.optional(v.number()),
  maxDays: v.optional(v.number()),
  sortBy: v.optional(
    v.union(
      v.literal("volume"),
      v.literal("yesPrice"),
      v.literal("noPrice"),
      v.literal("change24h"),
      v.literal("endDate")
    )
  ),
  sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
};

export const list = query({
  args: {
    ...filterArgsValidator,
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      minVolume,
      maxVolume,
      maxDays,
      sortBy: _sortBy = "volume",
      sortOrder = "desc",
      paginationOpts,
    } = args;

    // Build query with index
    const dbQuery = ctx.db.query("markets");

    let query;

    // Use category index if filtering by category
    if (category && category !== "all") {
      query = dbQuery.withIndex("by_category", (q) =>
        q.eq("category", category)
      );
    } else {
      // Default to volume index for sorting
      query = dbQuery.withIndex("by_volume");
    }

    // Order
    const orderedQuery = query.order(sortOrder);

    // Paginate first to get manageable batch
    const results = await orderedQuery.paginate(paginationOpts);

    // Apply filters in memory (for secondary filters)
    let filtered = results.page;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((m) =>
        m.title.toLowerCase().includes(searchLower)
      );
    }

    if (minPrice !== undefined) {
      filtered = filtered.filter((m) => m.yesPrice >= minPrice);
    }

    if (maxPrice !== undefined) {
      filtered = filtered.filter((m) => m.yesPrice <= maxPrice);
    }

    if (minVolume !== undefined) {
      filtered = filtered.filter((m) => m.volume >= minVolume);
    }

    if (maxVolume !== undefined) {
      filtered = filtered.filter((m) => m.volume <= maxVolume);
    }

    if (maxDays !== undefined) {
      const maxTimestamp = Date.now() + maxDays * 24 * 60 * 60 * 1000;
      filtered = filtered.filter((m) => m.endDate <= maxTimestamp);
    }

    return {
      ...results,
      page: filtered,
    };
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    // Get distinct categories
    const markets = await ctx.db.query("markets").take(1000);
    const categories = [...new Set(markets.map((m) => m.category))].sort();
    return ["all", ...categories];
  },
});

export const getById = query({
  args: { id: v.id("markets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByExternalId = query({
  args: {
    platform: v.union(
      v.literal("opinion_trade"),
      v.literal("polymarket"),
      v.literal("kalshi"),
      v.literal("other")
    ),
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("markets")
      .withIndex("by_externalId", (q) =>
        q.eq("platform", args.platform).eq("externalId", args.externalId)
      )
      .unique();
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const markets = await ctx.db.query("markets").take(1000);
    const totalVolume = markets.reduce((sum, m) => sum + m.volume, 0);
    const totalMarkets = markets.length;
    const activeMarkets = markets.filter((m) => !m.resolvedAt).length;

    return {
      totalMarkets,
      activeMarkets,
      totalVolume,
    };
  },
});

// Internal mutation for data sync (called by Convex cron jobs)
export const upsertMarket = internalMutation({
  args: {
    externalId: v.string(),
    platform: v.union(
      v.literal("opinion_trade"),
      v.literal("polymarket"),
      v.literal("kalshi"),
      v.literal("other")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    // Token IDs for price lookups
    yesTokenId: v.optional(v.string()),
    noTokenId: v.optional(v.string()),
    // Parent market ID for categorical child markets (Opinion.Trade)
    parentExternalId: v.optional(v.string()),
    yesPrice: v.number(),
    noPrice: v.number(),
    change24h: v.optional(v.number()),
    volume: v.number(),
    volume24h: v.number(),
    volume7d: v.optional(v.number()),
    liquidity: v.number(),
    endDate: v.number(),
    resolvedAt: v.optional(v.number()),
    outcome: v.optional(v.union(v.literal("yes"), v.literal("no"))),
    url: v.string(),
    imageUrl: v.optional(v.string()),
    chainId: v.optional(v.number()),
    quoteToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { externalId, platform, ...data } = args;

    const existing = await ctx.db
      .query("markets")
      .withIndex("by_externalId", (q) =>
        q.eq("platform", platform).eq("externalId", externalId)
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...data,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("markets", {
        externalId,
        platform,
        ...data,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
