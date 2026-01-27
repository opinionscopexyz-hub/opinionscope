"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CategoryPillsProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

// Human-friendly labels for categories
const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  crypto: "Crypto",
  politics: "Politics",
  sports: "Sports",
  entertainment: "Entertainment",
  science: "Science",
  economics: "Economics",
  tech: "Technology",
  other: "Other",
};

export function CategoryPills({
  categories,
  selected,
  onSelect,
}: CategoryPillsProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label="Filter by category"
    >
      {categories.map((category) => (
        <Button
          key={category}
          variant={selected === category ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(category)}
          className={cn(
            "rounded-full",
            selected === category && "bg-primary text-primary-foreground"
          )}
          role="tab"
          aria-selected={selected === category}
          aria-controls="markets-table"
        >
          {CATEGORY_LABELS[category.toLowerCase()] ?? category}
        </Button>
      ))}
    </div>
  );
}
