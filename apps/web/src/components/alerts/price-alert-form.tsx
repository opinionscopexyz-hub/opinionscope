"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import type { Id } from "@opinion-scope/backend/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PriceAlertFormProps {
  onSuccess: () => void;
}

export function PriceAlertForm({ onSuccess }: PriceAlertFormProps) {
  const [search, setSearch] = useState("");
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [operator, setOperator] = useState<string>("lt");
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const createPriceAlert = useMutation(api.alerts.createPriceAlert);

  // Search markets
  const marketsResult = useQuery(
    api.markets.list,
    search.length > 0
      ? {
          search,
          paginationOpts: { numItems: 10, cursor: null },
        }
      : "skip"
  );

  const markets = marketsResult?.page ?? [];

  // Get selected market details
  const selectedMarket = markets.find((m) => m._id === selectedMarketId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMarketId || !value) return;

    setIsSubmitting(true);
    try {
      await createPriceAlert({
        marketId: selectedMarketId as Id<"markets">,
        condition: {
          operator: operator as "gt" | "lt" | "eq" | "gte" | "lte",
          value: Number(value) / 100, // Convert percentage to decimal
        },
      });
      toast.success("Price alert created");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create alert"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarketSelect = (marketId: string) => {
    setSelectedMarketId(marketId);
    setSearch("");
    setShowResults(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Market Search */}
      <div className="space-y-2">
        <Label>Market</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="market-search"
            placeholder="Search markets..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="pl-10"
            autoComplete="off"
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && search && markets.length > 0 && (
          <div className="border rounded-md max-h-40 overflow-y-auto bg-background">
            {markets.map((market) => (
              <button
                type="button"
                key={market._id}
                className={`w-full p-2 text-left hover:bg-muted cursor-pointer ${
                  selectedMarketId === market._id ? "bg-muted" : ""
                }`}
                onClick={() => handleMarketSelect(market._id)}
              >
                <div className="text-sm font-medium truncate">
                  {market.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(market.yesPrice * 100).toFixed(0)}% YES
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected Market Display */}
        {selectedMarket && (
          <div className="p-2 bg-muted rounded-md">
            <div className="text-sm font-medium truncate">
              {selectedMarket.title}
            </div>
            <div className="text-xs text-muted-foreground">
              Current: {(selectedMarket.yesPrice * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </div>

      {/* Condition */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Condition</Label>
          <Select
            value={operator}
            onValueChange={(value) => value && setOperator(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lt">Falls below</SelectItem>
              <SelectItem value="gt">Rises above</SelectItem>
              <SelectItem value="lte">Reaches or below</SelectItem>
              <SelectItem value="gte">Reaches or above</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Target Price (%)</Label>
          <Input
            type="number"
            name="target-price"
            placeholder="50"
            min="1"
            max="99"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!selectedMarketId || !value || isSubmitting}
      >
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Create Alert
      </Button>
    </form>
  );
}
