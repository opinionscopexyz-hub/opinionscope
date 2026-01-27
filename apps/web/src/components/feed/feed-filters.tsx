"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Filter } from "lucide-react";

interface FeedFiltersProps {
  filters: {
    followedOnly: boolean;
    minAmount?: number;
  };
  onChange: (filters: { followedOnly: boolean; minAmount?: number }) => void;
}

/**
 * Pro+ only filter controls for the activity feed.
 * Allows filtering by followed whales and minimum trade amount.
 */
export function FeedFilters({ filters, onChange }: FeedFiltersProps) {
  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">Filters</span>
        <span className="text-xs text-muted-foreground">(Pro+ only)</span>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        {/* Followed Only Toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="followed-only"
            checked={filters.followedOnly}
            onCheckedChange={(checked) =>
              onChange({ ...filters, followedOnly: checked })
            }
          />
          <Label htmlFor="followed-only" className="text-sm">
            Followed whales only
          </Label>
        </div>

        {/* Minimum Amount */}
        <div className="flex items-center gap-2">
          <Label htmlFor="min-amount" className="text-sm whitespace-nowrap">
            Min amount:
          </Label>
          <Input
            id="min-amount"
            name="minAmount"
            type="number"
            placeholder="$0"
            min={0}
            className="w-24"
            autoComplete="off"
            value={filters.minAmount ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              // Validate: must be empty, positive number, or zero
              if (value === "") {
                onChange({ ...filters, minAmount: undefined });
                return;
              }
              const parsed = parseFloat(value);
              if (!isNaN(parsed) && parsed >= 0) {
                onChange({ ...filters, minAmount: parsed });
              }
            }}
          />
        </div>
      </div>
    </Card>
  );
}
