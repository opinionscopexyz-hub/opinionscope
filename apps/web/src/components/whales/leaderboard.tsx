"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { WhaleRow } from "./whale-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Data type options (maps to API dataType)
type DataType = "volume" | "profit" | "points";

// Period options (maps to API period param)
type Period = "all" | "24h" | "7d" | "30d";

// Available periods per data type (points only has all-time and 7d)
const PERIODS_BY_DATA_TYPE: Record<DataType, Period[]> = {
  volume: ["all", "24h", "7d", "30d"],
  profit: ["all", "24h", "7d", "30d"],
  points: ["all", "7d"],
};

// Backend-supported sortBy values
type SortBy =
  | "totalVolume" | "volume24h" | "volume7d" | "volume30d"
  | "totalPnl" | "pnl24h" | "pnl7d" | "pnl30d"
  | "totalPoints" | "points7d";

// Maps dataType + period to backend sortBy field
function getSortBy(dataType: DataType, period: Period): SortBy {
  const mapping: Record<DataType, Record<Period, SortBy>> = {
    volume: {
      all: "totalVolume",
      "24h": "volume24h",
      "7d": "volume7d",
      "30d": "volume30d",
    },
    profit: {
      all: "totalPnl",
      "24h": "pnl24h",
      "7d": "pnl7d",
      "30d": "pnl30d",
    },
    points: {
      all: "totalPoints",
      "24h": "totalPoints",  // points doesn't have 24h
      "7d": "points7d",
      "30d": "totalPoints",  // points doesn't have 30d
    },
  };
  return mapping[dataType][period];
}

// Labels for display
const periodLabels: Record<Period, string> = {
  all: "All Time",
  "24h": "24 Hours",
  "7d": "7 Days",
  "30d": "30 Days",
};

const PAGE_SIZE = 20;

export function Leaderboard() {
  const [dataType, setDataType] = useState<DataType>("volume");
  const [period, setPeriod] = useState<Period>("all");
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Reset period if not available for new dataType
  const availablePeriods = PERIODS_BY_DATA_TYPE[dataType];
  const effectivePeriod = availablePeriods.includes(period) ? period : "all";

  const sortBy = getSortBy(dataType, effectivePeriod);
  const result = useQuery(api.whales.getLeaderboard, { sortBy, limit });
  const whales = result?.whales ?? [];
  const hasMore = whales.length === limit && limit < 100; // Max 100 for performance
  const isLoadingMore = result === undefined && limit > PAGE_SIZE;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Data Type Tabs */}
        <Tabs
          value={dataType}
          onValueChange={(v) => {
            setDataType(v as DataType);
            setLimit(PAGE_SIZE); // Reset pagination on filter change
          }}
        >
          <TabsList>
            <TabsTrigger value="volume">Top Volume</TabsTrigger>
            <TabsTrigger value="profit">Top P&L</TabsTrigger>
            <TabsTrigger value="points">Top Points</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Period Selector */}
        <Select
          value={effectivePeriod}
          onValueChange={(v) => {
            setPeriod(v as Period);
            setLimit(PAGE_SIZE); // Reset pagination on filter change
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {availablePeriods.map((p) => (
              <SelectItem key={p} value={p}>
                {periodLabels[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {result === undefined && (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {/* Leaderboard */}
      {result !== undefined && whales.length > 0 && (
        <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="divide-y divide-border/50">
            {whales.map((whale, index) => (
              <WhaleRow
                key={whale._id}
                whale={whale}
                rank={index + 1}
                highlightField={dataType}
                period={effectivePeriod}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Load More Button */}
      {result !== undefined && hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            className="cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all"
            onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <span className="font-mono text-sm">
                Load More ({whales.length} shown)
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {result !== undefined && whales.length === 0 && (
        <Card className="p-8 text-center border-border/50 bg-card/50 backdrop-blur-sm">
          <p className="text-muted-foreground">
            No data for {periodLabels[effectivePeriod].toLowerCase()} yet. Try a
            different time period.
          </p>
        </Card>
      )}
    </div>
  );
}
