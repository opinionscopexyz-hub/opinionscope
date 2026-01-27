"use client";

import type { Doc } from "@opinion-scope/backend/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Medal, Award, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVolume, formatPnl, formatTimeAgo, formatAddress, formatPoints } from "@/lib/format-utils";

type Period = "all" | "24h" | "7d" | "30d";

interface WhaleRowProps {
  whale: Doc<"whales">;
  rank: number;
  highlightField?: "volume" | "profit" | "points";
  period?: Period;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 border border-primary/30">
        <Crown className="h-4 w-4 text-primary" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted border border-border/50">
        <Medal className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30">
        <Award className="h-4 w-4 text-orange-500" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-8 h-8 font-mono text-sm font-medium text-muted-foreground">
      {rank}
    </div>
  );
}

// Get the appropriate value based on data type and period
function getVolumeValue(whale: Doc<"whales">, period: Period): number {
  switch (period) {
    case "24h": return whale.volume24h ?? 0;
    case "7d": return whale.volume7d ?? 0;
    case "30d": return whale.volume30d ?? 0;
    default: return whale.totalVolume ?? 0;
  }
}

function getPnlValue(whale: Doc<"whales">, period: Period): number {
  switch (period) {
    case "24h": return whale.pnl24h ?? 0;
    case "7d": return whale.pnl7d ?? 0;
    case "30d": return whale.pnl30d ?? 0;
    default: return whale.totalPnl ?? 0;
  }
}

function getPointsValue(whale: Doc<"whales">, period: Period): number | undefined {
  switch (period) {
    case "7d": return whale.points7d;
    default: return whale.totalPoints;
  }
}

// Staleness thresholds based on period type
// Period stats are stale if older than their window, all-time is lenient
function isStaleForPeriod(syncedAt: number | undefined, period: Period): boolean {
  if (!syncedAt) return false; // No sync timestamp = don't show stale indicator
  const daysSinceSync = (Date.now() - syncedAt) / (24 * 60 * 60 * 1000);
  switch (period) {
    case "24h": return daysSinceSync > 1;
    case "7d": return daysSinceSync > 7;
    case "30d": return daysSinceSync > 30;
    default: return daysSinceSync > 30; // All-time: lenient 30-day threshold
  }
}

const periodLabels: Record<Period, string> = {
  all: "",
  "24h": "24h",
  "7d": "7d",
  "30d": "30d",
};

export function WhaleRow({
  whale,
  rank,
  highlightField = "volume",
  period = "all",
}: WhaleRowProps) {
  const displayName = whale.nickname ?? formatAddress(whale.address);

  // Get period-specific values
  const volumeValue = getVolumeValue(whale, period);
  const pnlValue = getPnlValue(whale, period);
  const pointsValue = getPointsValue(whale, period);
  const periodLabel = periodLabels[period];
  const isStale = isStaleForPeriod(whale.leaderboardSyncedAt, period);

  return (
    <a
      href={`/whales/${whale.address}`}
      className="flex items-center gap-4 p-4 hover:bg-primary/5 cursor-pointer transition-all duration-200 border-l-2 border-l-transparent hover:border-l-primary"
    >
      <RankBadge rank={rank} />

      <Avatar>
        <AvatarImage src={whale.avatar ?? undefined} />
        <AvatarFallback>
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{displayName}</span>
          {whale.isVerified && (
            <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {whale.tradeCount?.toLocaleString() ?? "0"} trades | Last active{" "}
          {formatTimeAgo(whale.lastActiveAt)}
        </div>
      </div>

      {/* Show only the active data type column */}
      {highlightField === "volume" && (
        <div className="text-right">
          <div className={cn("font-mono tabular-nums font-bold text-base md:text-lg lg:text-xl", isStale ? "text-muted-foreground" : "text-primary")}>
            {formatVolume(volumeValue)}{isStale && period === "all" && "+"}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground font-mono">
            {periodLabel ? `${periodLabel} Vol` : "Volume"}
            {isStale && " (stale)"}
          </div>
        </div>
      )}

      {highlightField === "profit" && (
        <div className="text-right">
          <div className={cn(
            "font-mono tabular-nums font-bold text-base md:text-lg lg:text-xl",
            isStale ? "text-muted-foreground" : pnlValue >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {formatPnl(pnlValue)}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">
            {periodLabel ? `${periodLabel} P&L` : "P&L"}
            {isStale && " (stale)"}
          </div>
        </div>
      )}

      {highlightField === "points" && pointsValue !== undefined && (
        <div className="text-right">
          <div className={cn("font-mono tabular-nums font-bold text-base md:text-lg lg:text-xl", isStale ? "text-muted-foreground" : "text-violet-500")}>
            {formatPoints(pointsValue)}{isStale && period === "all" && "+"}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground font-mono">
            {periodLabel ? `${periodLabel} Pts` : "Points"}
            {isStale && " (stale)"}
          </div>
        </div>
      )}
    </a>
  );
}
