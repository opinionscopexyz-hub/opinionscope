"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, Plus, Trash2, Lock, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Doc } from "@opinion-scope/backend/convex/_generated/dataModel";
import type { ScreenerFilters } from "@/hooks/use-screener-filters";

interface SavedPresetsProps {
  onApply: (preset: Doc<"savedPresets">) => void;
  currentFilters: ScreenerFilters;
}

export function SavedPresets({ onApply, currentFilters }: SavedPresetsProps) {
  const { isAuthenticated, tier: _tier } = useCurrentUser();
  const presets = useQuery(api.savedPresets.list);
  const usage = useQuery(api.savedPresets.getUsage);
  const removePreset = useMutation(api.savedPresets.remove);

  const [isAdding, setIsAdding] = useState(false);

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Saved Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sign in to save filter presets.
          </p>
        </CardContent>
      </Card>
    );
  }

  const limitReached =
    usage &&
    usage.limit !== -1 &&
    usage.used >= usage.limit;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Saved Presets
            {usage && usage.limit !== -1 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({usage.used}/{usage.limit})
              </span>
            )}
          </CardTitle>
          {!limitReached && !isAdding && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsAdding(true)}
              aria-label="Add new preset"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isAdding && (
          <AddPresetForm
            onClose={() => setIsAdding(false)}
            currentFilters={currentFilters}
          />
        )}

        {presets?.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground">No saved presets yet.</p>
        )}

        {presets?.map((preset) => (
          <div
            key={preset._id}
            className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer group"
            onClick={() => onApply(preset)}
          >
            <span className="text-sm">{preset.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await removePreset({ id: preset._id });
                  toast.success("Preset deleted");
                } catch {
                  toast.error("Failed to delete preset");
                }
              }}
              aria-label={`Delete preset ${preset.name}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {limitReached && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <Lock className="h-3 w-3" />
            Upgrade to save more presets
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Inline form for adding new preset
function AddPresetForm({
  onClose,
  currentFilters,
}: {
  onClose: () => void;
  currentFilters: ScreenerFilters;
}) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const createPreset = useMutation(api.savedPresets.create);

  const handleSubmit = async () => {
    if (!name.trim() || isLoading) return;
    setIsLoading(true);

    try {
      // Use React state filters (source of truth) instead of URL
      const filters = {
        category:
          currentFilters.category !== "all"
            ? currentFilters.category
            : undefined,
        minVolume: currentFilters.minVolume,
        maxVolume: currentFilters.maxVolume,
        minPrice: currentFilters.minPrice,
        maxPrice: currentFilters.maxPrice,
        maxDays: currentFilters.maxDays,
      };

      await createPreset({ name: name.trim(), filters });
      toast.success("Preset saved");
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save preset";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          name="preset-name"
          placeholder="Preset name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-sm"
          autoFocus
          autoComplete="off"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") onClose();
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleSubmit}
          disabled={!name.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onClose}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
