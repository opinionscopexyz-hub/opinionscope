"use client";

import { useQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";

/**
 * TEMPORARY: Subscription disabled - all authenticated users get pro_plus limits.
 * To re-enable subscriptions, remove this flag and use user.tier directly.
 */
const SUBSCRIPTION_DISABLED = true;

/**
 * Hook to get the current authenticated user from Convex.
 * Returns tier information and helper booleans.
 * Supports both email and web3 wallet authentication.
 */
export function useCurrentUser() {
  const user = useQuery(api.users.getCurrentUser);
  const isAuthenticated = user !== null && user !== undefined;

  // When subscriptions disabled, treat all authenticated users as pro_plus
  const effectiveTier = SUBSCRIPTION_DISABLED && isAuthenticated
    ? "pro_plus"
    : (user?.tier ?? "free");

  return {
    user,
    isLoading: user === undefined,
    isAuthenticated,
    tier: effectiveTier,
    isPro: effectiveTier === "pro" || effectiveTier === "pro_plus",
    isProPlus: effectiveTier === "pro_plus",
    // User identifiers (at least one will be present)
    email: user?.email,
    walletAddress: user?.walletAddress,
  };
}
