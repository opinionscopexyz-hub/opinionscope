import { ActionRetrier } from "@convex-dev/action-retrier";
import { components } from "../_generated/api";

/**
 * Retry configuration for external API calls.
 * Matches Inngest's default retry behavior.
 *
 * Schedule: 500ms → 1s → 2s → 4s (exponential with base 2)
 */
export const RETRY_CONFIG = {
  initialBackoffMs: 500, // Start with 500ms delay
  base: 2, // Exponential multiplier (doubles each retry)
  maxFailures: 1, // Max retry attempts
} as const;

/**
 * Configured retrier for reliable external API calls with exponential backoff.
 * Replaces Inngest's retry behavior with Convex-native solution.
 */
export const retrier = new ActionRetrier(components.actionRetrier, RETRY_CONFIG);
