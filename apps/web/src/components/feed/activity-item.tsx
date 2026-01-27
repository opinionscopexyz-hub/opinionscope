"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVolume, formatTimeAgo, formatAddress } from "@/lib/format-utils";
import type { Doc } from "@opinion-scope/backend/convex/_generated/dataModel";

type Whale = Doc<"whales">;
type Market = Doc<"markets">;
type WhaleActivity = Doc<"whaleActivity">;

interface ActivityItemProps {
  activity: WhaleActivity & {
    whale: Whale | null;
    market: Market | null;
  };
  isNew?: boolean;
}

/**
 * Single activity item displaying whale trade details.
 * Shows whale info, trade action, market, amount and timestamp.
 */
export function ActivityItem({ activity, isNew }: ActivityItemProps) {
  const whaleName =
    activity.whale?.nickname ?? formatAddress(activity.whale?.address ?? "");

  return (
    <Card
      className={cn(
        "p-4 transition-all duration-200 border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/20",
        isNew && "animate-in fade-in slide-in-from-top-2 duration-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
        activity.action === "BUY"
          ? "border-l-2 border-l-emerald-500"
          : "border-l-2 border-l-red-500"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Action Icon */}
        <div
          className={cn(
            "p-2 rounded-lg shrink-0 border",
            activity.action === "BUY"
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-red-500/10 border-red-500/30"
          )}
        >
          {activity.action === "BUY" ? (
            <ArrowUpRight className="h-5 w-5 text-emerald-500" />
          ) : (
            <ArrowDownRight className="h-5 w-5 text-red-500" />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Whale Info */}
          <a className="flex items-center gap-2 mb-1 hover:text-primary transition-colors" href={`/whales/${activity.whale?.address}`}>
            <Avatar className="h-6 w-6 border border-border/50">
              <AvatarImage src={activity.whale?.avatar ?? undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-mono">
                {whaleName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{whaleName}</span>
            {activity.whale?.isVerified && (
              <CheckCircle className="h-4 w-4 text-primary" />
            )}
            <Badge variant="outline" className="text-xs font-mono border-border/50">
              {activity.whale?.tradeCount ?? 0} trades
            </Badge>
          </a>

          {/* Trade Details */}
          <div className="text-sm">
            <span
              className={cn(
                "font-medium",
                activity.action === "BUY" ? "text-emerald-500" : "text-red-500"
              )}
            >
              {activity.action === "BUY" ? "Bought" : "Sold"}{" "}
              <span className="font-mono">{formatVolume(activity.amount)}</span>
            </span>
            {" "}
            <span className="font-mono tabular-nums text-muted-foreground">@ {(activity.price * 100).toFixed(0)}%</span>
            <span className="text-muted-foreground"> on </span>
            <a className="font-medium hover:text-primary transition-colors" href={`https://app.opinion.trade/detail?topicId=${activity.market?.externalId}`} target="_blank"
              rel="noopener noreferrer">
              {activity.market?.title ?? "Unknown Market"}
            </a>
          </div>

          
        </div>

        {/* txHash and Link */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(activity.timestamp)}
          </span>
          {activity.market?.url && (
            <a
              href={`https://bscscan.com/tx/${activity.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
              aria-label="View transaction on BSCScan"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
