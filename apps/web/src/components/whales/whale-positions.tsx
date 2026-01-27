"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, ExternalLink, TrendingUp, ChevronDown } from "lucide-react";
import { formatPnl, formatVolume } from "@/lib/format-utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { PositionData } from "@/lib/opinion-trade/types";

interface WhalePositionsProps {
  whaleAddress: string;
}

interface PositionsResponse {
  positions: PositionData[];
  total: number;
  page: number;
  hasMore: boolean;
  isLimited: boolean;
  tierLimit: number;
}

export function WhalePositions({ whaleAddress }: WhalePositionsProps) {
  const { isPro } = useCurrentUser();
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isLimited, setIsLimited] = useState(false);
  const [tierLimit, setTierLimit] = useState(3);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await fetch(
        `/api/whales/${whaleAddress}/positions?page=${pageNum}&limit=10`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch positions");
      }

      const data: PositionsResponse = await res.json();

      if (append) {
        setPositions((prev) => [...prev, ...data.positions]);
      } else {
        setPositions(data.positions);
      }

      setHasMore(data.hasMore);
      setIsLimited(data.isLimited);
      setTierLimit(data.tierLimit);
      setPage(data.page);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch positions");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [whaleAddress]);

  useEffect(() => {
    fetchPositions(1);
  }, [fetchPositions]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPositions(page + 1, true);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Failed to load positions: {error}
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No active positions detected</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {positions.map((position) => (
        <Card key={`${position.marketId}-${position.outcome}`} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Market title */}
              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {position.rootMarketTitle}
                  </span>
                  <a
                    href={`https://app.opinion.trade/detail?topicId=${position.marketId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    aria-label="View market on Opinion Trade"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {position.rootMarketId !== position.marketId && (
                  <div className="text-xs text-muted-foreground truncate">
                    → {position.marketTitle}
                  </div>
                )}
              </div>

              {/* Position details */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded capitalize">
                  {position.outcome}
                </span>
                <span>{position.outcomeSideEnum}</span>
                <span>
                  {parseFloat(position.sharesOwned).toLocaleString()} shares
                </span>
              </div>
            </div>

            {/* Position value */}
            <div className="text-right shrink-0">
              <div className="font-mono tabular-nums text-sm font-semibold text-green-600">
                {formatVolume(parseFloat(position.currentValueInQuoteToken))}
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">
                @ {(parseFloat(position.avgEntryPrice) * 100).toFixed(1)}¢
              </div>
              {parseFloat(position.unrealizedPnl) !== 0 && (
                <div className={`text-xs font-mono tabular-nums ${parseFloat(position.unrealizedPnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                 {formatPnl(parseFloat(position.unrealizedPnl))}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}

      {/* Load more button */}
      {hasMore && (
        <Button
          variant="outline"
          className="w-full"
          onClick={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? (
            "Loading..."
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Load More
            </>
          )}
        </Button>
      )}

      {/* Tier limit prompt - only show for free users */}
      {/* {isLimited && !isPro && (
        <Card className="p-4 text-center bg-muted/50">
          <Lock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Your plan shows {tierLimit} positions. Upgrade for full visibility.
          </p>
          <a href="/pricing" className={buttonVariants({ size: "sm" })}>
            Upgrade
          </a>
        </Card>
      )} */}
    </div>
  );
}
