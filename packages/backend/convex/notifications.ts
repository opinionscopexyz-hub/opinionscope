import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./lib/auth";

// ============ INTERNAL MUTATION FOR LOGGING NOTIFICATIONS ============

export const log = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notificationLog", {
      ...args,
      sentAt: Date.now(),
    });
  },
});

// ============ PUBLIC QUERIES FOR USER NOTIFICATION HISTORY ============

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("notificationLog")
      .withIndex("by_userId_sentAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return 0;

    // Count in_app notifications sent in the last 24h
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recent = await ctx.db
      .query("notificationLog")
      .withIndex("by_userId_sentAt", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("channel"), "in_app"),
          q.gte(q.field("sentAt"), oneDayAgo)
        )
      )
      .collect();

    return recent.length;
  },
});
