"use client";

import { useQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { useCurrentUser } from "./use-current-user";
import { useState, useMemo } from "react";

interface FeedFilters {
  followedOnly: boolean;
  minAmount?: number;
}

/**
 * Hook for managing the activity feed with tier-based delivery.
 * Pro+ users get real-time updates with filter capabilities.
 * Pro users see 30s delay, Free users see 15min delay.
 */
export function useActivityFeed() {
  const { tier, isProPlus } = useCurrentUser();
  const [filters, setFilters] = useState<FeedFilters>({
    followedOnly: false,
  });

  const feed = useQuery(api.whaleActivity.getFeed, {
    limit: 50,
    followedOnly: isProPlus ? filters.followedOnly : undefined,
    minAmount: isProPlus ? filters.minAmount : undefined,
  });

  const canFilter = isProPlus;

  const delayLabel = useMemo(() => {
    switch (tier) {
      case "pro_plus":
        return "Real-time";
      case "pro":
        return "30s delay";
      default:
        return "15min delay";
    }
  }, [tier]);

  const isRealTime = tier === "pro_plus";

  return {
    activities: feed?.activities ?? [],
    hasMore: feed?.hasMore ?? false,
    isLoading: feed === undefined,
    filters,
    setFilters,
    canFilter,
    delayLabel,
    isRealTime,
    tier,
  };
}
