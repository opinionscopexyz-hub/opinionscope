"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  // Use external value as key to reset local state when it changes
  const [localValue, setLocalValue] = useState(value);
  const [lastExternalValue, setLastExternalValue] = useState(value);

  // Detect external changes and sync local state
  if (value !== lastExternalValue) {
    setLastExternalValue(value);
    setLocalValue(value);
  }

  // Debounce search - wait 300ms before triggering URL update
  useEffect(() => {
    // Skip debounce if value just synced from external
    if (localValue === value) return;

    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        name="search"
        placeholder="Search markets..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-10 pr-10"
        autoComplete="off"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => {
            setLocalValue("");
            onChange("");
          }}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
