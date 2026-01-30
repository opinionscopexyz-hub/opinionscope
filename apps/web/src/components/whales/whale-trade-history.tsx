"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/format-utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { TradeData } from "@/lib/opinion-trade/types";

interface WhaleTradeHistoryProps {
  whaleAddress: string;
  onTotalLoaded?: (total: number) => void;
}

interface TradesResponse {
  trades: TradeData[];
  total: number;
  page: number;
  hasMore: boolean;
  isLimited: boolean;
  tierLimit: number;
}

export function WhaleTradeHistory({ whaleAddress, onTotalLoaded }: WhaleTradeHistoryProps) {
  useCurrentUser();
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [, setIsLimited] = useState(false);
  const [, setTierLimit] = useState(3);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await fetch(
        `/api/whales/${whaleAddress}/trades?page=${pageNum}&limit=10`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch trades");
      }

      const data: TradesResponse = await res.json();

      if (append) {
        setTrades((prev) => [...prev, ...data.trades]);
      } else {
        setTrades(data.trades);
        // Notify parent of total trades count on initial load
        onTotalLoaded?.(data.total);
      }

      setHasMore(data.hasMore);
      setIsLimited(data.isLimited);
      setTierLimit(data.tierLimit);
      setPage(data.page);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trades");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [whaleAddress, onTotalLoaded]);

  useEffect(() => {
    fetchTrades(1);
  }, [fetchTrades]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTrades(page + 1, true);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Failed to load trades: {error}
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No trades recorded yet
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {trades.map((trade, index) => (
        <Card key={index} className="p-3">
          <div className="flex items-center gap-3">
            {/* Action icon */}
            <div
              className={cn(
                "p-2 rounded-full shrink-0",
                trade.side === "Buy"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              )}
            >
              {trade.side === "Buy" ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
            </div>

            {/* Trade details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate text-sm">
                  {trade.rootMarketTitle}
                </span>
                <a
                  href={`https://app.opinion.trade/detail?topicId=${trade.marketId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="View market on Opinion Trade"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              {trade.rootMarketId !== trade.marketId && (
                <div className="text-xs text-muted-foreground truncate">
                  → {trade.marketTitle}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={cn(
                    "font-medium",
                    trade.side === "Buy" ? "text-green-600" : "text-red-600"
                  )}
                >
                  {trade.side.toUpperCase()}
                </span>
                <span className="capitalize">{trade.outcome}</span>
                <span>@ {(parseFloat(trade.price) * 100).toFixed(1)}¢</span>
              </div>
            </div>

            {/* Amount and time */}
            <div className="text-right shrink-0">
              <div className="font-mono tabular-nums text-sm font-medium">
                ${(parseFloat(trade.usdAmount)/1e18).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                <span>{formatTimeAgo(trade.createdAt)}</span>
                <a
                  href={`https://bscscan.com/tx/${trade.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                  aria-label="View transaction on BSCScan"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
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
            Your plan shows {tierLimit} trades. Upgrade to see more history.
          </p>
          <a href="/pricing" className={buttonVariants({ size: "sm" })}>
            Upgrade
          </a>
        </Card>
      )} */}
    </div>
  );
}
