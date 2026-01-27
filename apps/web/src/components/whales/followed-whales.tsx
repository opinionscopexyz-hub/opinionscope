"use client";

import { useQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Users } from "lucide-react";
import { formatAddress } from "@/lib/format-utils";

export function FollowedWhales() {
  const { tier } = useCurrentUser();
  const whales = useQuery(api.whales.getFollowedWhales);

  const tierLimit =
    tier === "free" ? 3 : tier === "pro" ? 20 : Infinity;
  const currentCount = whales?.length ?? 0;
  const remainingSlots = Math.max(0, tierLimit - currentCount);

  if (whales === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (whales.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-medium mb-2">No whales followed yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Start following whales from the leaderboard to track their trades.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Following {currentCount} / {tierLimit === Infinity ? "unlimited" : tierLimit} whales
        {remainingSlots > 0 && remainingSlots !== Infinity && (
          <span> ({remainingSlots} slots remaining)</span>
        )}
      </div>

      <Card className="divide-y">
        {whales.map((whale) => {
          if (!whale) return null;
          const displayName = whale.nickname ?? formatAddress(whale.address);

          return (
            <a
              key={whale._id}
              href={`/whales/${whale.address}`}
              className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer"
            >
              <Avatar>
                <AvatarImage src={whale.avatar ?? undefined} />
                <AvatarFallback>
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{displayName}</span>
                  {whale.isVerified && (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {whale.tradeCount} trades
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-sm text-muted-foreground">
                  {whale.tradeCount} trades
                </div>
              </div>
            </a>
          );
        })}
      </Card>

      {tier !== "pro_plus" && currentCount >= tierLimit && (
        <Card className="p-4 text-center bg-muted/50">
          <p className="text-sm text-muted-foreground mb-2">
            You&apos;ve reached your follow limit. Upgrade to follow more whales.
          </p>
          <a href="/pricing" className={buttonVariants({ size: "sm" })}>
            Upgrade
          </a>
        </Card>
      )}
    </div>
  );
}
