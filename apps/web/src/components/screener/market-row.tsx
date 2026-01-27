"use client";

import type { Doc } from "@opinion-scope/backend/convex/_generated/dataModel";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Bell, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatVolume,
  formatPrice,
  formatChange,
  getDaysRemaining,
} from "@/lib/format-utils";

interface MarketRowProps {
  market: Doc<"markets">;
}

export function MarketRow({ market }: MarketRowProps) {
  const daysRemaining = getDaysRemaining(market.endDate);

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium line-clamp-1">{market.title}</span>
          <span className="text-xs text-muted-foreground capitalize">
            {market.category}
          </span>
        </div>
      </TableCell>
      <TableCell className="font-mono tabular-nums">
        {formatPrice(market.yesPrice)}
      </TableCell>
      <TableCell className="font-mono tabular-nums">
        {formatPrice(market.noPrice)}
      </TableCell>
      <TableCell
        className={cn(
          "font-mono tabular-nums",
          market.change24h && market.change24h > 0 && "text-green-600",
          market.change24h && market.change24h < 0 && "text-red-600"
        )}
      >
        {formatChange(market.change24h)}
      </TableCell>
      <TableCell className="font-mono tabular-nums">{formatVolume(market.volume)}</TableCell>
      <TableCell>
        {daysRemaining === 0 ? (
          <span className="text-orange-600 font-medium">Today</span>
        ) : (
          <span>{daysRemaining}d</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Set alert for ${market.title}`}
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
          </Button>
          <a
            href={`https://app.opinion.trade/detail?topicId=${market.externalId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label={`Open ${market.title} in new tab`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </TableCell>
    </TableRow>
  );
}
