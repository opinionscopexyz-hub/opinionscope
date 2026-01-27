"use client";

import { useState, useMemo } from "react";
import type { ScreenerFilters } from "@/hooks/use-screener-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, RotateCcw } from "lucide-react";

interface FilterPanelProps {
  filters: ScreenerFilters;
  onChange: (updates: Partial<ScreenerFilters>) => void;
  onReset: () => void;
}

// Helper to serialize filter values for comparison
function getFilterKey(filters: ScreenerFilters): string {
  return [
    filters.minPrice,
    filters.maxPrice,
    filters.minVolume,
    filters.maxVolume,
    filters.maxDays,
  ].join("-");
}

export function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const currentFilterKey = getFilterKey(filters);

  // Compute local filters: re-sync when external filters change
  const initialLocalFilters = useMemo(() => ({
    minPrice: filters.minPrice ? String(filters.minPrice * 100) : "",
    maxPrice: filters.maxPrice ? String(filters.maxPrice * 100) : "",
    minVolume: filters.minVolume ? String(filters.minVolume) : "",
    maxVolume: filters.maxVolume ? String(filters.maxVolume) : "",
    maxDays: filters.maxDays ? String(filters.maxDays) : "",
  }), [filters.minPrice, filters.maxPrice, filters.minVolume, filters.maxVolume, filters.maxDays]);

  // Local state for input fields (prices stored as percentages in UI)
  const [localFilters, setLocalFilters] = useState(initialLocalFilters);
  const [lastFilterKey, setLastFilterKey] = useState(currentFilterKey);

  // Sync local state when external filters change (e.g., URL params)
  if (currentFilterKey !== lastFilterKey) {
    setLastFilterKey(currentFilterKey);
    setLocalFilters(initialLocalFilters);
  }

  const handleApply = () => {
    onChange({
      minPrice: localFilters.minPrice
        ? Number(localFilters.minPrice) / 100
        : undefined,
      maxPrice: localFilters.maxPrice
        ? Number(localFilters.maxPrice) / 100
        : undefined,
      minVolume: localFilters.minVolume
        ? Number(localFilters.minVolume)
        : undefined,
      maxVolume: localFilters.maxVolume
        ? Number(localFilters.maxVolume)
        : undefined,
      maxDays: localFilters.maxDays ? Number(localFilters.maxDays) : undefined,
    });
  };

  const handleReset = () => {
    setLocalFilters({
      minPrice: "",
      maxPrice: "",
      minVolume: "",
      maxVolume: "",
      maxDays: "",
    });
    onReset();
  };

  // Handle Enter key to apply filters
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApply();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="h-4 w-4" aria-hidden="true" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" role="form" aria-label="Market filters">
        {/* Price Range */}
        <div className="space-y-2">
          <Label className="text-sm" id="price-label">YES Price (%)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              name="minPrice"
              placeholder="Min"
              min={0}
              max={100}
              value={localFilters.minPrice}
              onChange={(e) =>
                setLocalFilters((f) => ({ ...f, minPrice: e.target.value }))
              }
              onKeyDown={handleKeyDown}
              className="w-full"
              aria-label="Minimum price percentage"
              autoComplete="off"
            />
            <Input
              type="number"
              name="maxPrice"
              placeholder="Max"
              min={0}
              max={100}
              value={localFilters.maxPrice}
              onChange={(e) =>
                setLocalFilters((f) => ({ ...f, maxPrice: e.target.value }))
              }
              onKeyDown={handleKeyDown}
              className="w-full"
              aria-label="Maximum price percentage"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Volume Range */}
        <div className="space-y-2">
          <Label className="text-sm" id="volume-label">Volume ($)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              name="minVolume"
              placeholder="Min"
              min={0}
              value={localFilters.minVolume}
              onChange={(e) =>
                setLocalFilters((f) => ({ ...f, minVolume: e.target.value }))
              }
              onKeyDown={handleKeyDown}
              className="w-full"
              aria-label="Minimum volume"
              autoComplete="off"
            />
            <Input
              type="number"
              name="maxVolume"
              placeholder="Max"
              min={0}
              value={localFilters.maxVolume}
              onChange={(e) =>
                setLocalFilters((f) => ({ ...f, maxVolume: e.target.value }))
              }
              onKeyDown={handleKeyDown}
              className="w-full"
              aria-label="Maximum volume"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Days to Resolution */}
        <div className="space-y-2">
          <Label className="text-sm" id="days-label">Expires Within (days)</Label>
          <Input
            type="number"
            name="maxDays"
            placeholder="Max days"
            min={1}
            value={localFilters.maxDays}
            onChange={(e) =>
              setLocalFilters((f) => ({ ...f, maxDays: e.target.value }))
            }
            onKeyDown={handleKeyDown}
            aria-label="Maximum days until expiration"
            autoComplete="off"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleApply} className="flex-1">
            Apply
          </Button>
          <Button variant="outline" onClick={handleReset} aria-label="Reset filters">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
