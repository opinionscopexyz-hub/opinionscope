"use client";

import { useState, useEffect, useCallback } from "react";
import type { Doc } from "@opinion-scope/backend/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVolume, formatPnl } from "@/lib/format-utils";

interface OpinionProfileData {
  volume: string;
  totalProfit: string;
}

interface WhaleStatsProps {
  whale: Doc<"whales">;
  totalTrades?: number; // Override from trades API
}

export function WhaleStats({ whale, totalTrades }: WhaleStatsProps) {
  const [profile, setProfile] = useState<OpinionProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch live profile data from Opinion API
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/whales/${whale.address}/profile`);
      if (res.ok) {
        const data: OpinionProfileData = await res.json();
        console.log('data', data);
        setProfile(data);
      }
    } catch {
      // Fallback to Convex data on error
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [whale.address]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Use live Opinion data if available, otherwise fallback to Convex
  const volume = profile ? parseFloat(profile.volume) : (whale.totalVolume ?? 0);
  const pnl = profile ? parseFloat(profile.totalProfit) : (whale.totalPnl ?? 0);
  const tradeCount = totalTrades ?? whale.tradeCount ?? 0;

  const stats = [
    {
      label: "Total Volume",
      value: formatVolume(volume),
      icon: DollarSign,
      color: "text-blue-600",
      loading: loading,
    },
    {
      label: "Total P&L",
      value: formatPnl(pnl),
      icon: TrendingUp,
      color: pnl >= 0 ? "text-green-600" : "text-red-600",
      loading: loading,
    },
    {
      label: "Total Trades",
      value: tradeCount.toLocaleString(),
      icon: Award,
      color: "text-purple-600",
      loading: false, // Trades come from separate API
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <stat.icon className="h-4 w-4" />
            <span className="text-xs">{stat.label}</span>
          </div>
          {stat.loading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <div className={cn("text-lg font-bold", stat.color)}>
              {stat.value}
            </div>
          )}
        </Card>
      ))}

      {whale.favoriteCategories.length > 0 && (
        <Card className="p-3 col-span-1 sm:col-span-3">
          <div className="text-xs text-muted-foreground mb-2">
            Favorite Categories
          </div>
          <div className="flex flex-wrap gap-2">
            {whale.favoriteCategories.map((cat) => (
              <span
                key={cat}
                className="px-2 py-1 bg-muted rounded-full text-xs capitalize"
              >
                {cat}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
