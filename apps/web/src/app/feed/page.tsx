"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { ActivityFeed } from "@/components/feed/activity-feed";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const INITIAL_LIMIT = 50;
const LOAD_MORE_LIMIT = 50;
const MAX_ACTIVITIES = 200;

export default function FeedPage() {
  const [limit, setLimit] = useState(INITIAL_LIMIT);

  const feedData = useQuery(api.whaleActivity.getFeed, { limit });
  const isLoading = feedData === undefined;
  const activities = feedData?.activities ?? [];
  const hasMore = feedData?.hasMore ?? false;

  const canLoadMore = hasMore && activities.length < MAX_ACTIVITIES;
  const isLoadingMore = limit > INITIAL_LIMIT && isLoading;

  const handleLoadMore = () => {
    const newLimit = Math.min(limit + LOAD_MORE_LIMIT, MAX_ACTIVITIES);
    setLimit(newLimit);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <p className="text-primary font-mono text-sm tracking-wider">
            {"// ACTIVITY_FEED"}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-xs text-primary">LIVE</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold">Activity Feed</h1>
        <p className="text-muted-foreground">
          Live whale trades as they happen
        </p>
      </div>

      <ActivityFeed activities={activities} isLoading={isLoading && limit === INITIAL_LIMIT} />

      {activities.length > 0 && (
        <div className="mt-6 text-center">
          {canLoadMore ? (
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="hover:border-primary/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-200 cursor-pointer"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <span className="font-mono">{`Load More (${activities.length}/${MAX_ACTIVITIES})`}</span>
              )}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground font-mono">
              {activities.length >= MAX_ACTIVITIES
                ? `Showing maximum ${MAX_ACTIVITIES} activities`
                : "No more activities"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
