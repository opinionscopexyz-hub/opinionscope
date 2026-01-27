import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { canSavePreset, getTierLimits } from "./lib/tierLimits";

const filtersValidator = v.object({
  category: v.optional(v.string()),
  minVolume: v.optional(v.number()),
  maxVolume: v.optional(v.number()),
  minPrice: v.optional(v.number()),
  maxPrice: v.optional(v.number()),
  maxDays: v.optional(v.number()),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("savedPresets")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { used: 0, limit: 1, tier: "free" as const };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();

    if (!user) return { used: 0, limit: 1, tier: "free" as const };

    const presets = await ctx.db
      .query("savedPresets")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const limits = getTierLimits(user.tier);

    return {
      used: presets.length,
      limit: limits.maxSavedPresets === Infinity ? -1 : limits.maxSavedPresets,
      tier: user.tier,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    filterExpression: v.optional(v.string()),
    filters: filtersValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    // Check tier limit
    const existingPresets = await ctx.db
      .query("savedPresets")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    if (!canSavePreset(user, existingPresets.length)) {
      const limits = getTierLimits(user.tier);
      throw new Error(
        `Preset limit reached. Upgrade to save more presets (current limit: ${limits.maxSavedPresets})`
      );
    }

    const now = Date.now();
    return await ctx.db.insert("savedPresets", {
      userId: user._id,
      name: args.name,
      filterExpression: args.filterExpression,
      filters: args.filters,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("savedPresets"),
    name: v.optional(v.string()),
    filterExpression: v.optional(v.string()),
    filters: v.optional(filtersValidator),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const preset = await ctx.db.get(args.id);
    if (!preset || preset.userId !== user._id) {
      throw new Error("Preset not found");
    }

    const { id, ...updates } = args;

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      const presets = await ctx.db
        .query("savedPresets")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();

      for (const p of presets) {
        if (p._id !== id && p.isDefault) {
          await ctx.db.patch(p._id, { isDefault: false });
        }
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("savedPresets") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const preset = await ctx.db.get(args.id);
    if (!preset || preset.userId !== user._id) {
      throw new Error("Preset not found");
    }

    await ctx.db.delete(args.id);
  },
});
