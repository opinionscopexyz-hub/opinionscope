"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export interface ScreenerFilters {
  search: string;
  category: string;
  minPrice?: number;
  maxPrice?: number;
  minVolume?: number;
  maxVolume?: number;
  maxDays?: number;
  sortBy: "volume" | "yesPrice" | "noPrice" | "change24h" | "endDate";
  sortOrder: "asc" | "desc";
}

const DEFAULT_FILTERS: ScreenerFilters = {
  search: "",
  category: "all",
  sortBy: "volume",
  sortOrder: "desc",
};

// Valid sort options for XSS prevention
const VALID_SORT_BY = ["volume", "yesPrice", "noPrice", "change24h", "endDate"] as const;
const VALID_SORT_ORDER = ["asc", "desc"] as const;

// Safe number parsing - returns undefined for invalid values
function safeParseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : undefined;
}

export function useScreenerFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse filters from URL with validation
  const filters = useMemo((): ScreenerFilters => {
    const rawSortBy = searchParams.get("sortBy");
    const rawSortOrder = searchParams.get("sortOrder");

    // Validate sortBy - only allow whitelisted values
    const sortBy = VALID_SORT_BY.includes(rawSortBy as (typeof VALID_SORT_BY)[number])
      ? (rawSortBy as ScreenerFilters["sortBy"])
      : "volume";

    // Validate sortOrder
    const sortOrder = VALID_SORT_ORDER.includes(rawSortOrder as (typeof VALID_SORT_ORDER)[number])
      ? (rawSortOrder as ScreenerFilters["sortOrder"])
      : "desc";

    return {
      search: searchParams.get("search") ?? "",
      category: searchParams.get("category") ?? "all",
      minPrice: safeParseNumber(searchParams.get("minPrice")),
      maxPrice: safeParseNumber(searchParams.get("maxPrice")),
      minVolume: safeParseNumber(searchParams.get("minVolume")),
      maxVolume: safeParseNumber(searchParams.get("maxVolume")),
      maxDays: safeParseNumber(searchParams.get("maxDays")),
      sortBy,
      sortOrder,
    };
  }, [searchParams]);

  // Update filters and sync to URL
  const setFilters = useCallback(
    (updates: Partial<ScreenerFilters>) => {
      const newFilters = { ...filters, ...updates };
      const params = new URLSearchParams();

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== "all") {
          params.set(key, String(value));
        }
      });

      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(url as Parameters<typeof router.push>[0]);
    },
    [filters, pathname, router]
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    router.push(pathname as Parameters<typeof router.push>[0]);
  }, [pathname, router]);

  // Apply quick filter preset
  const applyQuickFilter = useCallback(
    (preset: "trending" | "expiring" | "highVolume" | "undervalued") => {
      const presets: Record<string, Partial<ScreenerFilters>> = {
        trending: { sortBy: "change24h", sortOrder: "desc" },
        expiring: { maxDays: 7, sortBy: "endDate", sortOrder: "asc" },
        highVolume: { minVolume: 1000000, sortBy: "volume", sortOrder: "desc" },
        undervalued: { maxPrice: 0.2, minVolume: 100000, sortBy: "volume" },
      };
      setFilters(presets[preset] ?? {});
    },
    [setFilters]
  );

  return {
    filters,
    setFilters,
    resetFilters,
    applyQuickFilter,
    DEFAULT_FILTERS,
  };
}
