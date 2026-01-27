"use client";

import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, DollarSign, Target } from "lucide-react";

interface QuickFiltersProps {
  onApply: (
    preset: "trending" | "expiring" | "highVolume" | "undervalued"
  ) => void;
}

export function QuickFilters({ onApply }: QuickFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={() => onApply("trending")}>
        <TrendingUp className="h-4 w-4 mr-1" />
        Trending
      </Button>
      <Button variant="secondary" size="sm" onClick={() => onApply("expiring")}>
        <Clock className="h-4 w-4 mr-1" />
        Expiring Soon
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onApply("highVolume")}
      >
        <DollarSign className="h-4 w-4 mr-1" />
        High Volume
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onApply("undervalued")}
      >
        <Target className="h-4 w-4 mr-1" />
        Undervalued
      </Button>
    </div>
  );
}
