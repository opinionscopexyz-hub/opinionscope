import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { getAuthenticatedUser, requireAuth } from "./lib/auth";
import { canAddAlert, getTierLimits } from "./lib/tierLimits";

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

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return [];

    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    // Batch fetch related entities to avoid N+1 queries
    const marketIds = alerts.map((a) => a.marketId).filter(Boolean);
    const whaleIds = alerts.map((a) => a.whaleId).filter(Boolean);

    const markets = await Promise.all(marketIds.map((id) => ctx.db.get(id!)));
    const whales = await Promise.all(whaleIds.map((id) => ctx.db.get(id!)));

    const marketMap = new Map(markets.filter(Boolean).map((m) => [m!._id, m]));
    const whaleMap = new Map(whales.filter(Boolean).map((w) => [w!._id, w]));

    return alerts.map((alert) => ({
      ...alert,
      market: alert.marketId ? marketMap.get(alert.marketId) ?? null : null,
      whale: alert.whaleId ? whaleMap.get(alert.whaleId) ?? null : null,
    }));
  },
});

export const getUsage = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return { used: 0, limit: 3, tier: "free" as const };

    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const limits = getTierLimits(user.tier);

    return {
      used: alerts.length,
      limit: limits.maxAlerts === Infinity ? -1 : limits.maxAlerts,
      tier: user.tier,
    };
  },
});

export const createPriceAlert = mutation({
  args: {
    marketId: v.id("markets"),
    condition: alertConditionValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Validate condition value is in 0-1 range (percentage as decimal)
    if (args.condition.value < 0 || args.condition.value > 1) {
      throw new Error("Condition value must be between 0 and 1 (0% to 100%)");
    }

    // Verify market exists
    const market = await ctx.db.get(args.marketId);
    if (!market) {
      throw new Error("Market not found");
    }

    // Check tier limit
    const existingAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    if (!canAddAlert(user, existingAlerts.length)) {
      const limits = getTierLimits(user.tier);
      throw new Error(
        `Alert limit reached. Upgrade to create more alerts (current limit: ${limits.maxAlerts})`
      );
    }

    // Check for duplicate alert
    const existing = existingAlerts.find(
      (a) => a.type === "price" && a.marketId === args.marketId
    );
    if (existing) {
      throw new Error("You already have a price alert for this market");
    }

    return await ctx.db.insert("alerts", {
      userId: user._id,
      type: "price",
      marketId: args.marketId,
      condition: args.condition,
      isActive: true,
      triggerCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const createWhaleAlert = mutation({
  args: {
    whaleId: v.id("whales"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Verify whale exists
    const whale = await ctx.db.get(args.whaleId);
    if (!whale) {
      throw new Error("Whale not found");
    }

    // Check tier limit
    const existingAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    if (!canAddAlert(user, existingAlerts.length)) {
      const limits = getTierLimits(user.tier);
      throw new Error(
        `Alert limit reached. Upgrade to create more alerts (current limit: ${limits.maxAlerts})`
      );
    }

    // Check for duplicate alert
    const existing = existingAlerts.find(
      (a) => a.type === "whale" && a.whaleId === args.whaleId
    );
    if (existing) {
      throw new Error("You already have an alert for this whale");
    }

    return await ctx.db.insert("alerts", {
      userId: user._id,
      type: "whale",
      whaleId: args.whaleId,
      isActive: true,
      triggerCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const toggleAlert = mutation({
  args: {
    alertId: v.id("alerts"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const alert = await ctx.db.get(args.alertId);
    if (!alert || alert.userId !== user._id) {
      throw new Error("Alert not found");
    }

    await ctx.db.patch(args.alertId, { isActive: args.isActive });
  },
});

export const deleteAlert = mutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const alert = await ctx.db.get(args.alertId);
    if (!alert || alert.userId !== user._id) {
      throw new Error("Alert not found");
    }

    await ctx.db.delete(args.alertId);
  },
});

// ============ INTERNAL QUERIES FOR ALERT CHECKING ============

// Get active price alerts for a specific market
export const getActiveAlertsForMarket = internalQuery({
  args: { marketId: v.id("markets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_marketId", (q) => q.eq("marketId", args.marketId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get active whale alerts for a specific whale
export const getActiveAlertsForWhale = internalQuery({
  args: { whaleId: v.id("whales") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_whaleId", (q) => q.eq("whaleId", args.whaleId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get all active price alerts
export const getAllActivePriceAlerts = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .filter((q) => q.eq(q.field("type"), "price"))
      .collect();
  },
});

// Mark alert as triggered
export const markTriggered = internalMutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    if (!alert) return;

    await ctx.db.patch(args.alertId, {
      lastTriggeredAt: Date.now(),
      triggerCount: alert.triggerCount + 1,
    });
  },
});
