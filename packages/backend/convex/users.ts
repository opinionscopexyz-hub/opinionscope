import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const create = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      tier: "free",
      notificationPreferences: {
        email: true,
        push: false,
        telegram: false,
        discord: false,
      },
      followedWhaleIds: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTier = mutation({
  args: {
    userId: v.id("users"),
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("pro_plus")),
    tierExpiresAt: v.optional(v.number()),
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const updateNotificationPreferences = mutation({
  args: {
    email: v.optional(v.boolean()),
    push: v.optional(v.boolean()),
    telegram: v.optional(v.boolean()),
    discord: v.optional(v.boolean()),
    telegramChatId: v.optional(v.string()),
    discordWebhook: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.email !== undefined || args.push !== undefined || args.telegram !== undefined || args.discord !== undefined) {
      updates.notificationPreferences = {
        email: args.email ?? user.notificationPreferences.email,
        push: args.push ?? user.notificationPreferences.push,
        telegram: args.telegram ?? user.notificationPreferences.telegram,
        discord: args.discord ?? user.notificationPreferences.discord,
      };
    }

    if (args.telegramChatId !== undefined) {
      updates.telegramChatId = args.telegramChatId;
    }

    if (args.discordWebhook !== undefined) {
      updates.discordWebhook = args.discordWebhook;
    }

    await ctx.db.patch(user._id, updates);
  },
});

export const followWhale = mutation({
  args: { whaleId: v.id("whales") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    // Check if already following
    if (user.followedWhaleIds.includes(args.whaleId)) {
      return;
    }

    // Import tier limits dynamically to avoid circular deps
    const { canFollowWhale, getTierLimits } = await import("./lib/tierLimits");

    if (!canFollowWhale(user, user.followedWhaleIds.length)) {
      const limits = getTierLimits(user.tier);
      throw new Error(`Follow limit reached. Upgrade to follow more whales (current limit: ${limits.maxFollowedWhales})`);
    }

    // Update user
    await ctx.db.patch(user._id, {
      followedWhaleIds: [...user.followedWhaleIds, args.whaleId],
      updatedAt: Date.now(),
    });

    // Update whale follower count
    const whale = await ctx.db.get(args.whaleId);
    if (whale) {
      await ctx.db.patch(args.whaleId, {
        followerCount: whale.followerCount + 1,
        updatedAt: Date.now(),
      });
    }
  },
});

export const unfollowWhale = mutation({
  args: { whaleId: v.id("whales") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    // Check if following
    if (!user.followedWhaleIds.includes(args.whaleId)) {
      return;
    }

    // Update user
    await ctx.db.patch(user._id, {
      followedWhaleIds: user.followedWhaleIds.filter((id) => id !== args.whaleId),
      updatedAt: Date.now(),
    });

    // Update whale follower count
    const whale = await ctx.db.get(args.whaleId);
    if (whale && whale.followerCount > 0) {
      await ctx.db.patch(args.whaleId, {
        followerCount: whale.followerCount - 1,
        updatedAt: Date.now(),
      });
    }
  },
});

// Internal mutation called from Convex HTTP webhook handler
// Security: http.ts verifies svix signature before calling
// Supports both email and web3 wallet authentication
export const syncFromClerkInternal = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    walletAddress: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    deleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    // Handle user deletion
    if (args.deleted) {
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      return;
    }

    const now = Date.now();

    // Build update object - only include defined values
    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };
    if (args.email !== undefined) updateData.email = args.email;
    if (args.walletAddress !== undefined) updateData.walletAddress = args.walletAddress;
    if (args.name !== undefined) updateData.name = args.name;
    if (args.avatarUrl !== undefined) updateData.avatarUrl = args.avatarUrl;

    // Update existing user
    if (existing) {
      await ctx.db.patch(existing._id, updateData);
      return existing._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      walletAddress: args.walletAddress,
      name: args.name,
      avatarUrl: args.avatarUrl,
      tier: "free",
      notificationPreferences: {
        email: true,
        push: false,
        telegram: false,
        discord: false,
      },
      followedWhaleIds: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Public mutation - kept for backwards compatibility (if used elsewhere)
// TODO: Deprecate once all callers migrated to webhook
export const syncFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    deleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    // Handle user deletion
    if (args.deleted) {
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      return;
    }

    const now = Date.now();

    // Update existing user
    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      tier: "free",
      notificationPreferences: {
        email: true,
        push: false,
        telegram: false,
        discord: false,
      },
      followedWhaleIds: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});
