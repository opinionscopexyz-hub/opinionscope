// DISABLED: Subscription email functionality - Resend causes bundling issues
// TODO: Re-enable when splitting Node.js actions into separate files
import { v } from "convex/values";
import { internalMutation, internalAction, query } from "./_generated/server";

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

// ============ INTERNAL ACTIONS FOR EMAIL (DISABLED) ============

// STUB: Email sending disabled - Resend causes bundling issues with Node.js runtime
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
    console.warn(`[DISABLED] sendSubscriptionEmail called for ${args.to}, type: ${args.type}`);
    return { sent: false, error: "Email sending disabled - pending Node.js runtime split" };
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
