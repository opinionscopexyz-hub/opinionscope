import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

export type AuthenticatedUser = Doc<"users">;

/**
 * Get the currently authenticated user from Convex context.
 * Returns null if not authenticated or user not found in DB.
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<AuthenticatedUser | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  return user;
}

/**
 * Require authentication - throws if user not found.
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(ctx);
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

/**
 * Require a minimum subscription tier.
 */
export async function requireTier(
  ctx: QueryCtx | MutationCtx,
  minTier: "free" | "pro" | "pro_plus"
): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx);

  const tierOrder = { free: 0, pro: 1, pro_plus: 2 };
  if (tierOrder[user.tier] < tierOrder[minTier]) {
    throw new Error(`This feature requires ${minTier} tier or higher`);
  }

  return user;
}

/**
 * Check if user's subscription has expired.
 */
export function isTierExpired(user: AuthenticatedUser): boolean {
  if (!user.tierExpiresAt) return false;
  return Date.now() > user.tierExpiresAt;
}

/**
 * Get the effective tier (accounts for expiration).
 */
export function getEffectiveTier(
  user: AuthenticatedUser
): "free" | "pro" | "pro_plus" {
  if (user.tier !== "free" && isTierExpired(user)) {
    return "free";
  }
  return user.tier;
}
