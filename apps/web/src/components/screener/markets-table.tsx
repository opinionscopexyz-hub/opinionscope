"use client";

import { usePaginatedQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import type { ScreenerFilters } from "@/hooks/use-screener-filters";
import { MarketRow } from "./market-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface MarketsTableProps {
  filters: ScreenerFilters;
  onSort: (updates: Partial<ScreenerFilters>) => void;
}

// Extracted outside component to avoid recreation on each render
function getSortIcon(
  column: ScreenerFilters["sortBy"],
  currentSortBy: ScreenerFilters["sortBy"],
  sortOrder: ScreenerFilters["sortOrder"]
) {
  if (currentSortBy !== column) {
    return <ArrowUpDown className="h-4 w-4 ml-1" aria-hidden="true" />;
  }
  return sortOrder === "asc" ? (
    <ArrowUp className="h-4 w-4 ml-1" aria-hidden="true" />
  ) : (
    <ArrowDown className="h-4 w-4 ml-1" aria-hidden="true" />
  );
}

export function MarketsTable({ filters, onSort }: MarketsTableProps) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.markets.list,
    {
      search: filters.search || undefined,
      category: filters.category === "all" ? undefined : filters.category,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minVolume: filters.minVolume,
      maxVolume: filters.maxVolume,
      maxDays: filters.maxDays,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    },
    { initialNumItems: 50 }
  );

  const handleSort = (column: ScreenerFilters["sortBy"]) => {
    if (filters.sortBy === column) {
      // Toggle order if same column
      onSort({ sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" });
    } else {
      // New column: default to descending
      onSort({ sortBy: column, sortOrder: "desc" });
    }
  };

  const getSortLabel = (column: ScreenerFilters["sortBy"]) => {
    const labels: Record<ScreenerFilters["sortBy"], string> = {
      volume: "Sort by volume",
      yesPrice: "Sort by YES price",
      noPrice: "Sort by NO price",
      change24h: "Sort by 24h change",
      endDate: "Sort by end date",
    };
    const direction =
      filters.sortBy === column
        ? filters.sortOrder === "asc"
          ? "ascending"
          : "descending"
        : "";
    return `${labels[column]}${direction ? `, currently ${direction}` : ""}`;
  };

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border" id="markets-table" role="region" aria-label="Markets list">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Market</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-4"
                onClick={() => handleSort("yesPrice")}
                aria-label={getSortLabel("yesPrice")}
              >
                YES {getSortIcon("yesPrice", filters.sortBy, filters.sortOrder)}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-4"
                onClick={() => handleSort("noPrice")}
                aria-label={getSortLabel("noPrice")}
              >
                NO {getSortIcon("noPrice", filters.sortBy, filters.sortOrder)}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-4"
                onClick={() => handleSort("change24h")}
                aria-label={getSortLabel("change24h")}
              >
                24h {getSortIcon("change24h", filters.sortBy, filters.sortOrder)}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-4"
                onClick={() => handleSort("volume")}
                aria-label={getSortLabel("volume")}
              >
                Volume {getSortIcon("volume", filters.sortBy, filters.sortOrder)}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-4"
                onClick={() => handleSort("endDate")}
                aria-label={getSortLabel("endDate")}
              >
                Ends {getSortIcon("endDate", filters.sortBy, filters.sortOrder)}
              </Button>
            </TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((market) => (
            <MarketRow key={market._id} market={market} />
          ))}
        </TableBody>
      </Table>

      {status === "CanLoadMore" && (
        <div className="p-4 text-center">
          <Button variant="outline" onClick={() => loadMore(50)}>
            Load More
          </Button>
        </div>
      )}

      {results.length === 0 && status !== "LoadingMore" && (
        <div className="p-8 text-center text-muted-foreground" role="status">
          No markets found matching your filters.
        </div>
      )}
    </div>
  );
}
