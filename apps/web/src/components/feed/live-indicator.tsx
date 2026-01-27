"use client";

import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  isRealTime: boolean;
}

/**
 * Pulsing live indicator for real-time feed (Pro+ users).
 * Shows a green pulsing dot with "LIVE" text using CSS animation.
 */
export function LiveIndicator({ isRealTime }: LiveIndicatorProps) {
  if (!isRealTime) return null;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "h-2 w-2 rounded-full bg-green-500 animate-pulse motion-reduce:animate-none"
        )}
      />
      <span className="text-xs text-green-600 font-medium">LIVE</span>
    </div>
  );
}
