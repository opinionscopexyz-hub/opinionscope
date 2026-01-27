import { v } from "convex/values";
import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { Resend } from "resend";

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

        // Log email notification if user has email enabled
        if (user.notificationPreferences.email) {
          await ctx.db.insert("notificationLog", {
            userId: alert.userId,
            alertId: alert._id,
            type: "price",
            channel: "email",
            status: "pending",
            content: `Price alert: ${content}`,
            sentAt: now,
          });
        }

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

    // Schedule email sending for pending notifications
    if (triggeredCount > 0) {
      await ctx.scheduler.runAfter(0, internal.alertChecking.sendPendingEmails, {});
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

      // Log email notification if user has email enabled
      if (user.notificationPreferences.email) {
        await ctx.db.insert("notificationLog", {
          userId: alert.userId,
          alertId: alert._id,
          activityId,
          type: "whale",
          channel: "email",
          status: "pending",
          content: `Whale alert: ${content}`,
          sentAt: now,
        });
      }

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

    // Schedule email sending for pending notifications
    if (triggeredCount > 0) {
      await ctx.scheduler.runAfter(0, internal.alertChecking.sendPendingEmails, {});
    }

    return { triggeredCount };
  },
});

// ============ EMAIL SENDING ============

// Mutation to collect pending emails and dispatch to action
export const sendPendingEmails = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get pending email notifications
    const pendingEmails = await ctx.db
      .query("notificationLog")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .filter((q) => q.eq(q.field("channel"), "email"))
      .take(50);

    if (pendingEmails.length === 0) return { sentCount: 0 };

    // Batch fetch users for email addresses
    const userIds = [...new Set(pendingEmails.map((n) => n.userId))];
    const usersData = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userMap = new Map(
      usersData.filter(Boolean).map((u) => [u!._id, u!])
    );

    // Prepare email payloads
    const emailPayloads: Array<{
      notificationId: Id<"notificationLog">;
      to: string;
      subject: string;
      content: string;
      type: string;
    }> = [];

    for (const notification of pendingEmails) {
      const user = userMap.get(notification.userId);
      if (!user || !user.email) {
        await ctx.db.patch(notification._id, {
          status: "failed",
          errorMessage: "User email not found",
        });
        continue;
      }

      const subject =
        notification.type === "price"
          ? "OpinionScope: Price Alert Triggered"
          : "OpinionScope: Whale Alert";

      emailPayloads.push({
        notificationId: notification._id,
        to: user.email,
        subject,
        content: notification.content,
        type: notification.type,
      });
    }

    if (emailPayloads.length > 0) {
      // Schedule action to send emails
      await ctx.scheduler.runAfter(0, internal.alertChecking.sendEmailBatch, {
        emails: emailPayloads,
      });
    }

    return { scheduledCount: emailPayloads.length };
  },
});

// Action to send emails via Resend API
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
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not configured, skipping email send");
      // Mark all as failed
      for (const email of args.emails) {
        await ctx.runMutation(internal.alertChecking.updateNotificationStatus, {
          notificationId: email.notificationId,
          status: "failed",
          errorMessage: "RESEND_API_KEY not configured",
        });
      }
      return { sentCount: 0, failedCount: args.emails.length };
    }

    const resend = new Resend(apiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "alerts@opinionscope.xyz";
    let sentCount = 0;
    let failedCount = 0;

    for (const email of args.emails) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: email.to,
          subject: email.subject,
          html: buildEmailHtml(email.content, email.type),
        });

        await ctx.runMutation(internal.alertChecking.updateNotificationStatus, {
          notificationId: email.notificationId,
          status: "sent",
        });
        sentCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to send email to ${email.to}:`, errorMessage);

        await ctx.runMutation(internal.alertChecking.updateNotificationStatus, {
          notificationId: email.notificationId,
          status: "failed",
          errorMessage,
        });
        failedCount++;
      }
    }

    return { sentCount, failedCount };
  },
});

// Helper to build email HTML
function buildEmailHtml(content: string, type: string): string {
  const alertType = type === "price" ? "Price Alert" : "Whale Alert";
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="margin: 0 0 16px; color: #333;">${alertType}</h2>
          <p style="margin: 0 0 24px; color: #666; font-size: 16px; line-height: 1.5;">${content}</p>
          <a href="https://opinionscope.xyz/alerts" style="display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View Alerts</a>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
          <p style="margin: 0; color: #999; font-size: 12px;">You received this email because you have alerts enabled on OpinionScope.</p>
        </div>
      </body>
    </html>
  `;
}

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
