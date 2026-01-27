"use client";

import { ActivityItem } from "./activity-item";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import type { Doc } from "@opinion-scope/backend/convex/_generated/dataModel";

type Whale = Doc<"whales">;
type Market = Doc<"markets">;
type WhaleActivity = Doc<"whaleActivity">;

type EnrichedActivity = WhaleActivity & {
  whale: Whale | null;
  market: Market | null;
};

interface ActivityFeedProps {
  activities: EnrichedActivity[];
  isLoading: boolean;
}

/**
 * Activity feed list displaying whale trades.
 * Shows loading skeleton, empty state, or list of activity items.
 */
export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-medium mb-2">No activity yet</h3>
        <p className="text-sm text-muted-foreground">
          Whale trades will appear here as they happen.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <ActivityItem
          key={activity._id}
          activity={activity}
          isNew={index === 0}
        />
      ))}
    </div>
  );
}
