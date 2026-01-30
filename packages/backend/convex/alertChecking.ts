// DISABLED: Alert email functionality - Resend causes bundling issues
// TODO: Re-enable when splitting Node.js actions into separate files
import { v } from "convex/values";
import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Tier-based cooldown periods (in ms)
const COOLDOWN_BY_TIER = {
  free: 60 * 60 * 1000, // 1 hour
  pro: 30 * 60 * 1000, // 30 minutes
  pro_plus: 15 * 60 * 1000, // 15 minutes
} as const;

function getCooldownForTier(tier: "free" | "pro" | "pro_plus"): number {
  return COOLDOWN_BY_TIER[tier];
}

// ============ PRICE ALERT CHECKING ============

// Check all price alerts against current market prices
export const checkPriceAlerts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get all active price alerts
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .filter((q) => q.eq(q.field("type"), "price"))
      .collect();

    if (alerts.length === 0) return { checkedCount: 0, triggeredCount: 0 };

    // Batch fetch all unique markets
    const marketIds = [...new Set(alerts.map((a) => a.marketId).filter(Boolean))];
    const marketsData = await Promise.all(marketIds.map((id) => ctx.db.get(id!)));
    const marketMap = new Map(
      marketsData.filter(Boolean).map((m) => [m!._id, m!])
    );

    // Batch fetch all unique users for tier info
    const userIds = [...new Set(alerts.map((a) => a.userId))];
    const usersData = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userMap = new Map(
      usersData.filter(Boolean).map((u) => [u!._id, u!])
    );

    let triggeredCount = 0;

    for (const alert of alerts) {
      if (!alert.marketId || !alert.condition) continue;

      // Get user to determine cooldown
      const user = userMap.get(alert.userId);
      if (!user) continue;

      const cooldown = getCooldownForTier(user.tier);

      // Check cooldown first to avoid unnecessary processing
      if (alert.lastTriggeredAt && now - alert.lastTriggeredAt < cooldown) {
        continue;
      }

      // Get market from pre-fetched data
      const market = marketMap.get(alert.marketId);
      if (!market) continue;

      const currentPrice = market.yesPrice;
      const { operator, value } = alert.condition;

      // Evaluate condition
      let triggered = false;
      switch (operator) {
        case "gt":
          triggered = currentPrice > value;
          break;
        case "lt":
          triggered = currentPrice < value;
          break;
        case "gte":
          triggered = currentPrice >= value;
          break;
        case "lte":
          triggered = currentPrice <= value;
          break;
        case "eq":
          triggered = Math.abs(currentPrice - value) < 0.01;
          break;
      }

      if (triggered) {
        // Mark as triggered
        await ctx.db.patch(alert._id, {
          lastTriggeredAt: now,
          triggerCount: alert.triggerCount + 1,
        });

        const content = `${market.title} reached ${(currentPrice * 100).toFixed(0)}%`;

        // Log in-app notification (always)
        await ctx.db.insert("notificationLog", {
          userId: alert.userId,
          alertId: alert._id,
          type: "price",
          channel: "in_app",
          status: "sent",
          content,
          sentAt: now,
        });

        triggeredCount++;
      }
    }

    return { checkedCount: alerts.length, triggeredCount };
  },
});

// ============ WHALE ALERT CHECKING ============

// Check whale alerts when new activity is recorded
export const checkWhaleAlertsForActivity = internalMutation({
  args: {
    whaleId: v.id("whales"),
    activityId: v.id("whaleActivity"),
  },
  handler: async (ctx, args) => {
    const { whaleId, activityId } = args;
    const now = Date.now();

    // Get all active alerts for this whale
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_whaleId", (q) => q.eq("whaleId", whaleId))
      .filter((q) =>
        q.and(q.eq(q.field("isActive"), true), q.eq(q.field("type"), "whale"))
      )
      .collect();

    if (alerts.length === 0) return { triggeredCount: 0 };

    // Get activity, whale, and market in parallel
    const [activity, whale] = await Promise.all([
      ctx.db.get(activityId),
      ctx.db.get(whaleId),
    ]);

    if (!activity || !whale) return { triggeredCount: 0 };

    const market = await ctx.db.get(activity.marketId);

    // Batch fetch users
    const userIds = [...new Set(alerts.map((a) => a.userId))];
    const usersData = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userMap = new Map(
      usersData.filter(Boolean).map((u) => [u!._id, u!])
    );

    const whaleName =
      whale.nickname ?? `${whale.address.slice(0, 6)}...${whale.address.slice(-4)}`;
    const content = `${whaleName} ${activity.action.toLowerCase()} $${activity.amount.toLocaleString()} on ${market?.title ?? "a market"}`;

    let triggeredCount = 0;

    for (const alert of alerts) {
      const user = userMap.get(alert.userId);
      if (!user) continue;

      const cooldown = getCooldownForTier(user.tier);

      // Check cooldown
      if (alert.lastTriggeredAt && now - alert.lastTriggeredAt < cooldown) {
        continue;
      }

      // Mark as triggered
      await ctx.db.patch(alert._id, {
        lastTriggeredAt: now,
        triggerCount: alert.triggerCount + 1,
      });

      // Log in-app notification (always)
      await ctx.db.insert("notificationLog", {
        userId: alert.userId,
        alertId: alert._id,
        activityId,
        type: "whale",
        channel: "in_app",
        status: "sent",
        content,
        sentAt: now,
      });

      triggeredCount++;
    }

    return { triggeredCount };
  },
});

// ============ EMAIL SENDING (DISABLED) ============

// STUB: Mutation to collect pending emails - disabled
export const sendPendingEmails = internalMutation({
  args: {},
  handler: async () => {
    console.warn("[DISABLED] sendPendingEmails called - email functionality disabled");
    return { sentCount: 0 };
  },
});

// STUB: Action to send emails - disabled (Resend causes bundling issues)
export const sendEmailBatch = internalAction({
  args: {
    emails: v.array(
      v.object({
        notificationId: v.id("notificationLog"),
        to: v.string(),
        subject: v.string(),
        content: v.string(),
        type: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    console.warn(`[DISABLED] sendEmailBatch called for ${args.emails.length} emails`);
    // Mark all as failed
    for (const email of args.emails) {
      await ctx.runMutation(internal.alertChecking.updateNotificationStatus, {
        notificationId: email.notificationId,
        status: "failed",
        errorMessage: "Email sending disabled - pending Node.js runtime split",
      });
    }
    return { sentCount: 0, failedCount: args.emails.length };
  },
});

// Mutation to update notification status (called from action)
export const updateNotificationStatus = internalMutation({
  args: {
    notificationId: v.id("notificationLog"),
    status: v.union(v.literal("sent"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      status: args.status,
      errorMessage: args.errorMessage,
    });
  },
});

// ============ BATCH WHALE ALERT CHECK (for recent activities) ============

export const checkWhaleAlertsForRecent = internalMutation({
  args: {
    sinceTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Get recent whale activities
    const recentActivities = await ctx.db
      .query("whaleActivity")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), args.sinceTimestamp))
      .collect();

    if (recentActivities.length === 0) return { checkedCount: 0, triggeredCount: 0 };

    let totalTriggered = 0;

    // Group by whale to minimize queries
    const activityByWhale = new Map<string, typeof recentActivities>();
    for (const activity of recentActivities) {
      const whaleId = activity.whaleId as string;
      if (!activityByWhale.has(whaleId)) {
        activityByWhale.set(whaleId, []);
      }
      activityByWhale.get(whaleId)!.push(activity);
    }

    // Process each whale's activities
    for (const [, activities] of activityByWhale) {
      // Use most recent activity for notification
      const latestActivity = activities.sort((a, b) => b.timestamp - a.timestamp)[0];

      const result = await ctx.runMutation(
        internal.alertChecking.checkWhaleAlertsForActivity,
        {
          whaleId: latestActivity.whaleId,
          activityId: latestActivity._id,
        }
      );

      totalTriggered += result.triggeredCount;
    }

    return { checkedCount: recentActivities.length, triggeredCount: totalTriggered };
  },
});
