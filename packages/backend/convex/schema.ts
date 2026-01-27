import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Reusable validators
const tierValidator = v.union(
  v.literal("free"),
  v.literal("pro"),
  v.literal("pro_plus")
);

const notificationPrefsValidator = v.object({
  email: v.boolean(),
  push: v.boolean(),
  telegram: v.boolean(),
  discord: v.boolean(),
});

const alertConditionValidator = v.object({
  operator: v.union(
    v.literal("gt"),
    v.literal("lt"),
    v.literal("eq"),
    v.literal("gte"),
    v.literal("lte")
  ),
  value: v.number(),
});

export default defineSchema({
  // ============ USERS ============
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()), // Optional - may not exist for web3 wallet users
    walletAddress: v.optional(v.string()), // Web3 wallet address (lowercase)
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    tier: tierValidator,
    tierExpiresAt: v.optional(v.number()),
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
    telegramChatId: v.optional(v.string()),
    discordWebhook: v.optional(v.string()),
    notificationPreferences: notificationPrefsValidator,
    followedWhaleIds: v.array(v.id("whales")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_walletAddress", ["walletAddress"])
    .index("by_tier", ["tier"])
    .index("by_polarCustomerId", ["polarCustomerId"]),

  // ============ WHALES ============
  whales: defineTable({
    address: v.string(),
    nickname: v.optional(v.string()),
    avatar: v.optional(v.string()),
    isVerified: v.boolean(),
    // Data source: leaderboard (from leaderboard API) takes priority over other (future features)
    dataType: v.optional(v.union(v.literal("leaderboard"), v.literal("other"))),
    // Denormalized stats (updated by leaderboard sync)
    // Optional to allow partial sync - each leaderboard type only updates its field
    totalVolume: v.optional(v.number()),
    totalPnl: v.optional(v.number()),
    tradeCount: v.optional(v.number()),
    lastActiveAt: v.number(),
    favoriteCategories: v.array(v.string()),
    platforms: v.array(v.string()),
    followerCount: v.number(),
    // Period-specific volume stats (from leaderboard API)
    volume24h: v.optional(v.number()),
    volume7d: v.optional(v.number()),
    volume30d: v.optional(v.number()),
    // Period-specific P&L stats (from leaderboard API)
    pnl24h: v.optional(v.number()),
    pnl7d: v.optional(v.number()),
    pnl30d: v.optional(v.number()),
    // Points stats (from leaderboard API - points market type)
    totalPoints: v.optional(v.number()),
    points7d: v.optional(v.number()),
    // Staleness tracking: when this whale was last seen in leaderboard API
    // Used to show staleness indicators for whales who dropped off top 100
    leaderboardSyncedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_address", ["address"])
    .index("by_totalVolume", ["totalVolume"])
    .index("by_lastActiveAt", ["lastActiveAt"])
    .index("by_followerCount", ["followerCount"])
    // Period-specific indexes for leaderboard sorting
    .index("by_volume24h", ["volume24h"])
    .index("by_pnl24h", ["pnl24h"])
    .index("by_totalPnl", ["totalPnl"])
    // Points indexes for leaderboard sorting
    .index("by_totalPoints", ["totalPoints"])
    .index("by_points7d", ["points7d"]),

  // ============ MARKETS ============
  markets: defineTable({
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
    // Token IDs for price lookups (Opinion.Trade specific)
    yesTokenId: v.optional(v.string()),
    noTokenId: v.optional(v.string()),
    // Parent market ID for categorical child markets (Opinion.Trade)
    // Stores externalId of categorical parent, null for binary/standalone markets
    parentExternalId: v.optional(v.string()),
    // Price data
    yesPrice: v.number(),
    noPrice: v.number(),
    change24h: v.optional(v.number()),
    // Volume data
    volume: v.number(),
    volume24h: v.number(),
    volume7d: v.optional(v.number()),
    liquidity: v.number(),
    // Dates
    endDate: v.number(),
    resolvedAt: v.optional(v.number()),
    outcome: v.optional(v.string()), // Outcome label from the API
    // Metadata
    url: v.string(),
    imageUrl: v.optional(v.string()),
    chainId: v.optional(v.number()),
    quoteToken: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_externalId", ["platform", "externalId"])
    .index("by_category", ["category"])
    .index("by_category_volume", ["category", "volume"])
    .index("by_volume", ["volume"])
    .index("by_endDate", ["endDate"])
    .index("by_yesPrice", ["yesPrice"])
    .index("by_noPrice", ["noPrice"])
    .index("by_parentExternalId", ["parentExternalId"]),

  // ============ WHALE ACTIVITY ============
  whaleActivity: defineTable({
    whaleId: v.id("whales"),
    marketId: v.id("markets"),
    action: v.union(v.literal("BUY"), v.literal("SELL")),
    outcome: v.string(), // Outcome label from the API (e.g., "Yes", "No", or custom labels)
    outcomeSide: v.number(), // Numeric side identifier (0 or 1) for logic/indexing
    amount: v.number(),
    price: v.number(),
    platform: v.string(),
    txHash: v.optional(v.string()),
    // For tiered delivery
    visibleToProPlusAt: v.number(), // T+0
    visibleToProAt: v.number(), // T+30s
    visibleToFreeAt: v.number(), // T+15min
    timestamp: v.number(),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_whaleId_timestamp", ["whaleId", "timestamp"])
    .index("by_marketId_timestamp", ["marketId", "timestamp"])
    .index("by_visibleToProPlus", ["visibleToProPlusAt"])
    .index("by_visibleToPro", ["visibleToProAt"])
    .index("by_visibleToFree", ["visibleToFreeAt"]),

  // ============ ALERTS ============
  alerts: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("price"),
      v.literal("whale"),
      v.literal("volume"),
      v.literal("new_market")
    ),
    // Optional references
    marketId: v.optional(v.id("markets")),
    whaleId: v.optional(v.id("whales")),
    // Condition for price/volume alerts
    condition: v.optional(alertConditionValidator),
    // For new_market alerts
    filterExpression: v.optional(v.string()),
    // State
    isActive: v.boolean(),
    lastTriggeredAt: v.optional(v.number()),
    triggerCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_type", ["userId", "type"])
    .index("by_marketId", ["marketId"])
    .index("by_whaleId", ["whaleId"])
    .index("by_isActive", ["isActive"]),

  // ============ SAVED PRESETS ============
  savedPresets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    filterExpression: v.optional(v.string()),
    filters: v.object({
      category: v.optional(v.string()),
      minVolume: v.optional(v.number()),
      maxVolume: v.optional(v.number()),
      minPrice: v.optional(v.number()),
      maxPrice: v.optional(v.number()),
      maxDays: v.optional(v.number()),
    }),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // ============ SYNC LOGS ============
  syncLogs: defineTable({
    type: v.union(
      v.literal("markets"),
      v.literal("whales"),
      v.literal("stats"),
      v.literal("alert-prices"), // Token price updates for alert markets
      v.literal("leaderboard-whales"), // Global leaderboard whale discovery
      v.literal("market-holders") // Market-specific holder discovery
    ),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    itemCount: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_startedAt", ["startedAt"]),

  // ============ NOTIFICATION LOG ============
  notificationLog: defineTable({
    userId: v.id("users"),
    alertId: v.optional(v.id("alerts")),
    activityId: v.optional(v.id("whaleActivity")),
    type: v.string(),
    channel: v.union(
      v.literal("email"),
      v.literal("push"),
      v.literal("telegram"),
      v.literal("discord"),
      v.literal("in_app")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed")
    ),
    content: v.string(),
    errorMessage: v.optional(v.string()),
    sentAt: v.number(),
  })
    .index("by_userId_sentAt", ["userId", "sentAt"])
    .index("by_status", ["status"])
    .index("by_alertId", ["alertId"]),
});
