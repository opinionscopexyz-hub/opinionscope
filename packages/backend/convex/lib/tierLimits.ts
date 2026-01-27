import type { Doc } from "../_generated/dataModel";

/**
 * TEMPORARY: Subscription disabled - all authenticated users get pro_plus limits.
 * To re-enable subscriptions, set this to false.
 */
export const SUBSCRIPTION_DISABLED = true;

export const TIER_LIMITS = {
  free: {
    maxAlerts: 3,
    maxFollowedWhales: 3,
    maxSavedPresets: 1,
    leaderboardLimit: Infinity, // Leaderboard is free data - no tier limit
    recentTradesVisible: 3,
    csvExportRows: 10,
    feedDelayMinutes: 15,
    earlyAccessSeconds: 15 * 60, // 15 minute delay
    channels: ["email", "in_app"] as const,
  },
  pro: {
    maxAlerts: 50,
    maxFollowedWhales: 20,
    maxSavedPresets: 10,
    leaderboardLimit: 50,
    recentTradesVisible: 10,
    csvExportRows: 100,
    feedDelayMinutes: 0, // Real-time
    earlyAccessSeconds: 30, // 30s delay
    channels: ["email", "push", "telegram", "discord", "in_app"] as const,
  },
  pro_plus: {
    maxAlerts: Infinity,
    maxFollowedWhales: Infinity,
    maxSavedPresets: Infinity,
    leaderboardLimit: Infinity,
    recentTradesVisible: 50,
    csvExportRows: Infinity,
    feedDelayMinutes: 0, // Real-time + early access
    earlyAccessSeconds: 0, // Instant
    channels: ["email", "push", "telegram", "discord", "in_app"] as const,
  },
} as const;

export type UserTier = keyof typeof TIER_LIMITS;

/**
 * Get effective tier - returns pro_plus for all users when subscriptions disabled.
 */
export function getEffectiveTier(tier: UserTier): UserTier {
  return SUBSCRIPTION_DISABLED ? "pro_plus" : tier;
}

export function getTierLimits(tier: UserTier) {
  const effectiveTier = getEffectiveTier(tier);
  return TIER_LIMITS[effectiveTier];
}

export function canAddAlert(user: Doc<"users">, currentAlertCount: number): boolean {
  const limits = getTierLimits(user.tier);
  return currentAlertCount < limits.maxAlerts;
}

export function canFollowWhale(user: Doc<"users">, currentFollowCount: number): boolean {
  const limits = getTierLimits(user.tier);
  return currentFollowCount < limits.maxFollowedWhales;
}

export function canSavePreset(user: Doc<"users">, currentPresetCount: number): boolean {
  const limits = getTierLimits(user.tier);
  return currentPresetCount < limits.maxSavedPresets;
}

export function getActivityFeedTimestamp(tier: UserTier): number {
  const limits = getTierLimits(tier);
  const delayMs = limits.feedDelayMinutes * 60 * 1000;
  return Date.now() - delayMs;
}

// Calculate visibility timestamps for tiered delivery
export function calculateVisibilityTimestamps(tradeTimestamp: number) {
  return {
    visibleToProPlusAt: tradeTimestamp, // Instant
    visibleToProAt: tradeTimestamp + 30 * 1000, // +30 seconds
    visibleToFreeAt: tradeTimestamp + 15 * 60 * 1000, // +15 minutes
  };
}
