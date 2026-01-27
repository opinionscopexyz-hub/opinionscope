import { v } from "convex/values";
import { internalMutation, internalAction, query } from "./_generated/server";
import { Resend } from "resend";
import { buildSubscriptionEmailContent } from "./lib/subscriptionEmails";

// ============ INTERNAL MUTATIONS ============

// Update user subscription tier (called from webhook on subscription.created/updated)
export const updateUserSubscription = internalMutation({
  args: {
    email: v.string(),
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("pro_plus")),
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
    tierExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      console.error(`User not found for email: ${args.email}`);
      return { success: false, error: "User not found" };
    }

    await ctx.db.patch(user._id, {
      tier: args.tier,
      polarCustomerId: args.polarCustomerId,
      polarSubscriptionId: args.polarSubscriptionId,
      tierExpiresAt: args.tierExpiresAt,
      updatedAt: Date.now(),
    });

    return { success: true, userId: user._id };
  },
});

// Mark subscription as canceled (sets expiration, keeps current tier)
export const markSubscriptionCanceled = internalMutation({
  args: {
    email: v.string(),
    tierExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      console.error(`User not found for email: ${args.email}`);
      return { success: false, error: "User not found", tier: null };
    }

    // Keep current tier but set expiration
    await ctx.db.patch(user._id, {
      tierExpiresAt: args.tierExpiresAt,
      updatedAt: Date.now(),
    });

    return { success: true, userId: user._id, tier: user.tier };
  },
});

// Downgrade user to free tier (called when subscription expires/revoked)
export const downgradeToFree = internalMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      console.error(`User not found for email: ${args.email}`);
      return { success: false, error: "User not found", previousTier: null };
    }

    const previousTier = user.tier;

    await ctx.db.patch(user._id, {
      tier: "free",
      tierExpiresAt: undefined,
      polarSubscriptionId: undefined,
      updatedAt: Date.now(),
    });

    return { success: true, userId: user._id, previousTier };
  },
});

// ============ INTERNAL ACTIONS FOR EMAIL ============

export const sendSubscriptionEmail = internalAction({
  args: {
    to: v.string(),
    tier: v.union(v.literal("pro"), v.literal("pro_plus")),
    type: v.union(
      v.literal("welcome"),
      v.literal("canceled"),
      v.literal("expired")
    ),
  },
  handler: async (_, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not configured, skipping subscription email");
      return { sent: false, error: "RESEND_API_KEY not configured" };
    }

    const resend = new Resend(apiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "hello@opinionscope.xyz";
    const { subject, html } = buildSubscriptionEmailContent(args.tier, args.type);

    try {
      await resend.emails.send({
        from: fromEmail,
        to: args.to,
        subject,
        html,
      });
      return { sent: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Failed to send subscription email to ${args.to}:`, errorMessage);
      return { sent: false, error: errorMessage };
    }
  },
});

// ============ PUBLIC QUERIES FOR BILLING ============

export const getCustomerPortalInfo = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();

    if (!user) return null;

    return {
      tier: user.tier,
      polarCustomerId: user.polarCustomerId,
      polarSubscriptionId: user.polarSubscriptionId,
      tierExpiresAt: user.tierExpiresAt,
    };
  },
});
