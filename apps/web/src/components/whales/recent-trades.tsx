"use client";

import { useQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/format-utils";
import type { Id } from "@opinion-scope/backend/convex/_generated/dataModel";

interface RecentTradesProps {
  whaleId: Id<"whales">;
}

export function RecentTrades({ whaleId }: RecentTradesProps) {
  useCurrentUser();
  const trades = useQuery(api.whales.getRecentTrades, { whaleId });

  if (trades === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-medium mb-3">Recent Trades</h3>

      {trades.length === 0 ? (
        <Card className="p-4 text-center text-muted-foreground">
          No trades recorded yet
        </Card>
      ) : (
        <div className="space-y-2">
          {trades.map((trade) => (
            <Card key={trade._id} className="p-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-full",
                    trade.action === "BUY"
                      ? "bg-green-100 dark:bg-green-900"
                      : "bg-red-100 dark:bg-red-900"
                  )}
                >
                  {trade.action === "BUY" ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm">
                    {trade.marketTitle}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {trade.action} @ {(trade.price * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono tabular-nums text-sm">
                    ${trade.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTimeAgo(trade.timestamp)}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* {showUpgrade && trades.length >= tierLimit && (
            <Card className="p-4 text-center bg-muted/50">
              <Lock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                {tier === "free"
                  ? "Free tier shows 3 trades. Upgrade to see more."
                  : "Pro tier shows 10 trades. Upgrade to Pro+ for 50."}
              </p>
              <a href="/pricing" className={buttonVariants({ size: "sm" })}>
                Upgrade
              </a>
            </Card>
          )} */}
        </div>
      )}
    </div>
  );
}
