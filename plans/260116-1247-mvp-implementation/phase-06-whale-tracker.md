# Phase 06: Whale Tracker

## Context Links
- [Plan Overview](./plan.md)
- [PRD Section 5.2](../../OpinionScope_PRD.md#52-whale-tracker)
- [Phase 02: Database Schema](./phase-02-database-schema.md)
- [Phase 04: Data Sync](./phase-04-data-sync.md)

## Overview
- **Priority:** P0
- **Status:** ✓ Complete
- **Effort:** 12h (12h spent)
- **Description:** Build whale leaderboard, profile pages, follow functionality, and tier-gated access to whale data.
- **Completed:** 2026-01-16 21:42
- **Review:** See [Code Review Report](../reports/code-reviewer-260116-2155-whale-tracker.md)

## Key Insights

From PRD:
- Leaderboard sorted by win rate (min 20 trades)
- Tier limits: Free top 10, Pro top 50, Pro+ all
- Follow limits: Free 3, Pro 20, Pro+ unlimited
- Recent trades visible: Free 3, Pro 10, Pro+ 50
- Performance charts Pro+ only

From Convex research:
- Denormalized whale stats avoid joins
- Follower count stored on whale for efficient display
- Real-time subscription updates followed whales

## Requirements

### Functional
- FR-WHALE-1: Display leaderboard sorted by win rate
- FR-WHALE-2: Show whale stats (win rate, volume, P&L, streak)
- FR-WHALE-3: View whale profile with recent trades
- FR-WHALE-4: Follow/unfollow whales
- FR-WHALE-5: View followed whales list
- FR-WHALE-6: Tier-gate leaderboard size
- FR-WHALE-7: Tier-gate trade history depth

### Non-Functional
- NFR-WHALE-1: Leaderboard load < 500ms
- NFR-WHALE-2: Follow action < 200ms
- NFR-WHALE-3: Real-time follower count updates

## Architecture

```
Whale Tracker Page:
┌─────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────┐ │
│ │ Leaderboard        │ My Followed Whales   │ │
│ │ [Tab]              │ [Tab]                 │ │
│ └─────────────────────────────────────────────┘ │
│                                                   │
│ Leaderboard Tab:                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Rank │ Whale   │ Win Rate │ Volume │ P&L   │ │
│ │ ──────────────────────────────────────────── │
│ │ 1    │ [Avatar] CryptoKing │ 78% │ $1.2M │  │
│ │ 2    │ [Avatar] Predictor  │ 72% │ $800K │  │
│ │ 3    │ [Avatar] WhalePro   │ 68% │ $500K │  │
│ │ ...  │ [Show more - upgrade]                │ │
│ └─────────────────────────────────────────────┘ │
│                                                   │
│ Whale Profile Slide-out:                         │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Avatar] CryptoKing          [Follow] [X]   │ │
│ │ Win Rate: 78%  │  Volume: $1.2M  │  P&L: +  │ │
│ │ ──────────────────────────────────────────── │
│ │ Recent Trades:                              │ │
│ │ • BTC $150k (BUY $5k) 2h ago               │ │
│ │ • ETH $5k (SELL $2k) 5h ago                │ │
│ │ [Show more - Pro+ only]                     │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Related Code Files

### Create
- `apps/web/src/app/whales/page.tsx` - Main whales page
- `apps/web/src/components/whales/leaderboard.tsx`
- `apps/web/src/components/whales/whale-row.tsx`
- `apps/web/src/components/whales/whale-profile-sheet.tsx`
- `apps/web/src/components/whales/whale-stats.tsx`
- `apps/web/src/components/whales/recent-trades.tsx`
- `apps/web/src/components/whales/follow-button.tsx`
- `apps/web/src/components/whales/followed-whales.tsx`
- `packages/backend/convex/whales.ts` - Whale queries/mutations

## Implementation Steps

### Step 1: Create Whale Queries

Create `packages/backend/convex/whales.ts`:

```typescript
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthenticatedUser, requireAuth } from "./lib/auth";
import { getTierLimits, canFollowWhale } from "./lib/tierLimits";

export const getLeaderboard = query({
  args: {
    sortBy: v.optional(
      v.union(
        v.literal("winRate"),
        v.literal("totalVolume"),
        v.literal("totalPnl")
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const tier = user?.tier ?? "free";
    const limits = getTierLimits(tier);

    const sortBy = args.sortBy ?? "winRate";
    const indexName = sortBy === "totalVolume" ? "by_totalVolume" : "by_winRate";

    // Get whales with minimum trade requirement
    const whales = await ctx.db
      .query("whales")
      .withIndex(indexName)
      .order("desc")
      .filter((q) => q.gte(q.field("tradeCount"), 20))
      .take(limits.leaderboardLimit === Infinity ? 1000 : limits.leaderboardLimit);

    // Add rank
    return whales.map((whale, index) => ({
      ...whale,
      rank: index + 1,
    }));
  },
});

export const getById = query({
  args: { id: v.id("whales") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByAddress = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("whales")
      .withIndex("by_address", (q) => q.eq("address", args.address))
      .unique();
  },
});

export const getRecentTrades = query({
  args: {
    whaleId: v.id("whales"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const tier = user?.tier ?? "free";
    const limits = getTierLimits(tier);

    const trades = await ctx.db
      .query("whaleActivity")
      .withIndex("by_whaleId_timestamp", (q) => q.eq("whaleId", args.whaleId))
      .order("desc")
      .take(limits.recentTradesVisible);

    // Enrich with market data
    const enrichedTrades = await Promise.all(
      trades.map(async (trade) => {
        const market = await ctx.db.get(trade.marketId);
        return {
          ...trade,
          marketTitle: market?.title ?? "Unknown Market",
          marketCategory: market?.category,
        };
      })
    );

    return enrichedTrades;
  },
});

export const follow = mutation({
  args: { whaleId: v.id("whales") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Check if already following
    if (user.followedWhaleIds.includes(args.whaleId)) {
      return { success: true, alreadyFollowing: true };
    }

    // Check tier limit
    if (!canFollowWhale(user, user.followedWhaleIds.length)) {
      const limits = getTierLimits(user.tier);
      throw new Error(
        `You can only follow ${limits.maxFollowedWhales} whales on your plan. Upgrade to follow more.`
      );
    }

    // Add to followed list
    await ctx.db.patch(user._id, {
      followedWhaleIds: [...user.followedWhaleIds, args.whaleId],
      updatedAt: Date.now(),
    });

    // Increment follower count
    const whale = await ctx.db.get(args.whaleId);
    if (whale) {
      await ctx.db.patch(args.whaleId, {
        followerCount: whale.followerCount + 1,
      });
    }

    return { success: true, alreadyFollowing: false };
  },
});

export const unfollow = mutation({
  args: { whaleId: v.id("whales") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    if (!user.followedWhaleIds.includes(args.whaleId)) {
      return { success: true, wasFollowing: false };
    }

    // Remove from followed list
    await ctx.db.patch(user._id, {
      followedWhaleIds: user.followedWhaleIds.filter((id) => id !== args.whaleId),
      updatedAt: Date.now(),
    });

    // Decrement follower count
    const whale = await ctx.db.get(args.whaleId);
    if (whale && whale.followerCount > 0) {
      await ctx.db.patch(args.whaleId, {
        followerCount: whale.followerCount - 1,
      });
    }

    return { success: true, wasFollowing: true };
  },
});

export const getFollowedWhales = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return [];

    const whales = await Promise.all(
      user.followedWhaleIds.map((id) => ctx.db.get(id))
    );

    return whales.filter(Boolean);
  },
});

export const isFollowing = query({
  args: { whaleId: v.id("whales") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) return false;
    return user.followedWhaleIds.includes(args.whaleId);
  },
});
```

### Step 2: Create Whales Page

Create `apps/web/src/app/whales/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaderboard } from "@/components/whales/leaderboard";
import { FollowedWhales } from "@/components/whales/followed-whales";
import { WhaleProfileSheet } from "@/components/whales/whale-profile-sheet";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { Id } from "@opinion-scope/backend/convex/_generated/dataModel";

export default function WhalesPage() {
  const { isAuthenticated } = useCurrentUser();
  const [selectedWhaleId, setSelectedWhaleId] = useState<Id<"whales"> | null>(
    null
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Whale Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Follow top traders and see their moves
          </p>
        </div>
      </div>

      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          {isAuthenticated && (
            <TabsTrigger value="following">Following</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="leaderboard" className="mt-4">
          <Leaderboard onSelectWhale={setSelectedWhaleId} />
        </TabsContent>

        {isAuthenticated && (
          <TabsContent value="following" className="mt-4">
            <FollowedWhales onSelectWhale={setSelectedWhaleId} />
          </TabsContent>
        )}
      </Tabs>

      <WhaleProfileSheet
        whaleId={selectedWhaleId}
        onClose={() => setSelectedWhaleId(null)}
      />
    </div>
  );
}
```

### Step 3: Create Leaderboard Component

Create `apps/web/src/components/whales/leaderboard.tsx`:

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { WhaleRow } from "./whale-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Lock } from "lucide-react";
import type { Id } from "@opinion-scope/backend/convex/_generated/dataModel";
import Link from "next/link";

interface LeaderboardProps {
  onSelectWhale: (id: Id<"whales">) => void;
}

export function Leaderboard({ onSelectWhale }: LeaderboardProps) {
  const { tier } = useCurrentUser();
  const whales = useQuery(api.whales.getLeaderboard, {});

  const tierLimit = tier === "free" ? 10 : tier === "pro" ? 50 : Infinity;
  const showUpgrade = tier !== "pro_plus" && (whales?.length ?? 0) >= tierLimit;

  if (whales === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="divide-y">
          {whales.map((whale) => (
            <WhaleRow
              key={whale._id}
              whale={whale}
              rank={whale.rank}
              onClick={() => onSelectWhale(whale._id)}
            />
          ))}
        </div>
      </Card>

      {showUpgrade && (
        <Card className="p-4 text-center bg-muted/50">
          <Lock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            {tier === "free"
              ? "Free tier shows top 10. Upgrade to see more."
              : "Pro tier shows top 50. Upgrade to Pro+ for full access."}
          </p>
          <Button asChild>
            <Link href="/pricing">Upgrade Now</Link>
          </Button>
        </Card>
      )}

      {whales.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No whales tracked yet. Check back soon!
          </p>
        </Card>
      )}
    </div>
  );
}
```

### Step 4: Create Whale Row Component

Create `apps/web/src/components/whales/whale-row.tsx`:

```typescript
"use client";

import type { Doc } from "@opinion-scope/backend/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Medal, Award, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhaleRowProps {
  whale: Doc<"whales"> & { rank: number };
  rank: number;
  onClick: () => void;
}

const formatVolume = (vol: number) => {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
};

const formatPnl = (pnl: number) => {
  const sign = pnl >= 0 ? "+" : "";
  if (Math.abs(pnl) >= 1_000_000) return `${sign}$${(pnl / 1_000_000).toFixed(1)}M`;
  if (Math.abs(pnl) >= 1_000) return `${sign}$${(pnl / 1_000).toFixed(0)}K`;
  return `${sign}$${pnl.toFixed(0)}`;
};

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900">
        <Crown className="h-4 w-4 text-yellow-600" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800">
        <Medal className="h-4 w-4 text-gray-500" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900">
        <Award className="h-4 w-4 text-orange-600" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-8 h-8 text-sm font-medium text-muted-foreground">
      {rank}
    </div>
  );
};

export function WhaleRow({ whale, rank, onClick }: WhaleRowProps) {
  const displayName =
    whale.nickname ?? `${whale.address.slice(0, 6)}...${whale.address.slice(-4)}`;

  return (
    <div
      className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <RankBadge rank={rank} />

      <Avatar>
        <AvatarImage src={whale.avatar ?? undefined} />
        <AvatarFallback>
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{displayName}</span>
          {whale.isVerified && (
            <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {whale.tradeCount} trades | Last active{" "}
          {formatTimeAgo(whale.lastActiveAt)}
        </div>
      </div>

      <div className="text-right">
        <div className="font-mono font-bold text-green-600">
          {(whale.winRate * 100).toFixed(0)}%
        </div>
        <div className="text-xs text-muted-foreground">Win Rate</div>
      </div>

      <div className="text-right hidden sm:block">
        <div className="font-mono">{formatVolume(whale.totalVolume)}</div>
        <div className="text-xs text-muted-foreground">Volume</div>
      </div>

      <div className="text-right hidden md:block">
        <div
          className={cn(
            "font-mono",
            whale.totalPnl >= 0 ? "text-green-600" : "text-red-600"
          )}
        >
          {formatPnl(whale.totalPnl)}
        </div>
        <div className="text-xs text-muted-foreground">P&L</div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
```

### Step 5: Create Whale Profile Sheet

Create `apps/web/src/components/whales/whale-profile-sheet.tsx`:

```typescript
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WhaleStats } from "./whale-stats";
import { RecentTrades } from "./recent-trades";
import { FollowButton } from "./follow-button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle } from "lucide-react";
import type { Id } from "@opinion-scope/backend/convex/_generated/dataModel";

interface WhaleProfileSheetProps {
  whaleId: Id<"whales"> | null;
  onClose: () => void;
}

export function WhaleProfileSheet({
  whaleId,
  onClose,
}: WhaleProfileSheetProps) {
  const { isAuthenticated } = useCurrentUser();
  const whale = useQuery(
    api.whales.getById,
    whaleId ? { id: whaleId } : "skip"
  );
  const isFollowing = useQuery(
    api.whales.isFollowing,
    whaleId ? { whaleId } : "skip"
  );

  const displayName = whale
    ? whale.nickname ??
      `${whale.address.slice(0, 6)}...${whale.address.slice(-4)}`
    : "";

  return (
    <Sheet open={whaleId !== null} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {whale === undefined ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : whale === null ? (
          <div className="text-center py-8 text-muted-foreground">
            Whale not found
          </div>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={whale.avatar ?? undefined} />
                  <AvatarFallback className="text-lg">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <SheetTitle className="text-xl">{displayName}</SheetTitle>
                    {whale.isVerified && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {whale.address.slice(0, 10)}...{whale.address.slice(-8)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {whale.followerCount} followers
                  </div>
                </div>
                {isAuthenticated && whaleId && (
                  <FollowButton
                    whaleId={whaleId}
                    isFollowing={isFollowing ?? false}
                  />
                )}
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <WhaleStats whale={whale} />
              {whaleId && <RecentTrades whaleId={whaleId} />}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

### Step 6: Create Whale Stats Component

Create `apps/web/src/components/whales/whale-stats.tsx`:

```typescript
"use client";

import type { Doc } from "@opinion-scope/backend/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { TrendingUp, DollarSign, Target, Flame, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhaleStatsProps {
  whale: Doc<"whales">;
}

export function WhaleStats({ whale }: WhaleStatsProps) {
  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
    return `$${vol.toFixed(0)}`;
  };

  const formatPnl = (pnl: number) => {
    const sign = pnl >= 0 ? "+" : "";
    if (Math.abs(pnl) >= 1_000_000)
      return `${sign}$${(pnl / 1_000_000).toFixed(1)}M`;
    if (Math.abs(pnl) >= 1_000) return `${sign}$${(pnl / 1_000).toFixed(0)}K`;
    return `${sign}$${pnl.toFixed(0)}`;
  };

  const stats = [
    {
      label: "Win Rate",
      value: `${(whale.winRate * 100).toFixed(1)}%`,
      icon: Target,
      color: "text-green-600",
    },
    {
      label: "Total Volume",
      value: formatVolume(whale.totalVolume),
      icon: DollarSign,
      color: "text-blue-600",
    },
    {
      label: "Total P&L",
      value: formatPnl(whale.totalPnl),
      icon: TrendingUp,
      color: whale.totalPnl >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      label: "Win Streak",
      value: whale.winStreak.toString(),
      icon: Flame,
      color: "text-orange-600",
    },
    {
      label: "Total Trades",
      value: whale.tradeCount.toString(),
      icon: Award,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <stat.icon className="h-4 w-4" />
            <span className="text-xs">{stat.label}</span>
          </div>
          <div className={cn("text-lg font-bold", stat.color)}>
            {stat.value}
          </div>
        </Card>
      ))}

      {whale.favoriteCategories.length > 0 && (
        <Card className="p-3 col-span-2">
          <div className="text-xs text-muted-foreground mb-2">
            Favorite Categories
          </div>
          <div className="flex flex-wrap gap-2">
            {whale.favoriteCategories.map((cat) => (
              <span
                key={cat}
                className="px-2 py-1 bg-muted rounded-full text-xs capitalize"
              >
                {cat}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
```

### Step 7: Create Recent Trades Component

Create `apps/web/src/components/whales/recent-trades.tsx`:

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@opinion-scope/backend/convex/_generated/dataModel";
import Link from "next/link";

interface RecentTradesProps {
  whaleId: Id<"whales">;
}

export function RecentTrades({ whaleId }: RecentTradesProps) {
  const { tier } = useCurrentUser();
  const trades = useQuery(api.whales.getRecentTrades, { whaleId });

  const tierLimit = tier === "free" ? 3 : tier === "pro" ? 10 : 50;
  const showUpgrade = tier !== "pro_plus";

  if (trades === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-medium mb-3">Recent Trades</h3>

      {trades.length === 0 ? (
        <Card className="p-4 text-center text-muted-foreground">
          No trades recorded yet
        </Card>
      ) : (
        <div className="space-y-2">
          {trades.map((trade) => (
            <Card key={trade._id} className="p-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-full",
                    trade.action === "BUY"
                      ? "bg-green-100 dark:bg-green-900"
                      : "bg-red-100 dark:bg-red-900"
                  )}
                >
                  {trade.action === "BUY" ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm">
                    {trade.marketTitle}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {trade.action} @ {(trade.price * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-sm">
                    ${trade.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTimeAgo(trade.timestamp)}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {showUpgrade && trades.length >= tierLimit && (
            <Card className="p-4 text-center bg-muted/50">
              <Lock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                {tier === "free"
                  ? "Free tier shows 3 trades. Upgrade to see more."
                  : "Pro tier shows 10 trades. Upgrade to Pro+ for 50."}
              </p>
              <Button size="sm" asChild>
                <Link href="/pricing">Upgrade</Link>
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
```

### Step 8: Create Follow Button Component

Create `apps/web/src/components/whales/follow-button.tsx`:

```typescript
"use client";

import { useMutation } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@opinion-scope/backend/convex/_generated/dataModel";

interface FollowButtonProps {
  whaleId: Id<"whales">;
  isFollowing: boolean;
}

export function FollowButton({ whaleId, isFollowing }: FollowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const follow = useMutation(api.whales.follow);
  const unfollow = useMutation(api.whales.unfollow);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollow({ whaleId });
        toast.success("Unfollowed whale");
      } else {
        await follow({ whaleId });
        toast.success("Now following whale");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-1" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1" />
          Follow
        </>
      )}
    </Button>
  );
}
```

### Step 9: Create Followed Whales Component

Create `apps/web/src/components/whales/followed-whales.tsx`:

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Users } from "lucide-react";
import type { Id } from "@opinion-scope/backend/convex/_generated/dataModel";
import Link from "next/link";

interface FollowedWhalesProps {
  onSelectWhale: (id: Id<"whales">) => void;
}

export function FollowedWhales({ onSelectWhale }: FollowedWhalesProps) {
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
          const displayName =
            whale.nickname ??
            `${whale.address.slice(0, 6)}...${whale.address.slice(-4)}`;

          return (
            <div
              key={whale._id}
              className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer"
              onClick={() => onSelectWhale(whale._id)}
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
                <div className="font-mono font-bold text-green-600">
                  {(whale.winRate * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          );
        })}
      </Card>

      {tier !== "pro_plus" && currentCount >= tierLimit && (
        <Card className="p-4 text-center bg-muted/50">
          <p className="text-sm text-muted-foreground mb-2">
            You've reached your follow limit. Upgrade to follow more whales.
          </p>
          <Button size="sm" asChild>
            <Link href="/pricing">Upgrade</Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
```

## Todo List

### Implementation (Complete)
- [x] Create `packages/backend/convex/whales.ts` with queries/mutations
- [x] Create `apps/web/src/app/whales/page.tsx`
- [x] Create `apps/web/src/components/whales/leaderboard.tsx`
- [x] Create `apps/web/src/components/whales/whale-row.tsx`
- [x] Create `apps/web/src/components/whales/whale-profile-sheet.tsx`
- [x] Create `apps/web/src/components/whales/whale-stats.tsx`
- [x] Create `apps/web/src/components/whales/recent-trades.tsx`
- [x] Create `apps/web/src/components/whales/follow-button.tsx`
- [x] Create `apps/web/src/components/whales/followed-whales.tsx`
- [x] Add shadcn/ui Sheet, Avatar, Tabs components

### Critical Fixes (Complete)
- [x] **FIXED:** Race condition in follow/unfollow mutations (atomic updates)
- [x] **FIXED:** Added whale existence validation before follow
- [x] **FIXED:** Added tier expiration checks with getEffectiveTier()
- [x] **FIXED:** Added leaderboard filter for min 20 trades (per PRD)

### Testing (Complete)
- [x] Test leaderboard tier limits
- [x] Test follow/unfollow functionality
- [x] Test recent trades tier limits
- [x] Test real-time follower count updates
- [x] Test race condition scenarios

### Improvements (Post-Launch)
- [ ] Add compound indexes for efficient filtered queries
- [ ] Consolidate duplicate format utility functions
- [ ] Add logging for data integrity issues
- [ ] Implement follower count repair job

## Success Criteria

- [x] Leaderboard shows whales sorted by win rate ✅
- [x] Tier limits correctly restrict leaderboard size ✅
- [x] Whale profile shows stats and recent trades ✅
- [x] Follow/unfollow updates instantly ✅
- [x] Follower count updates in real-time ✅
- [x] Trade history respects tier limits ✅
- [x] Mobile responsive layout works ✅
- [x] Min 20-trade filter enforced ✅
- [x] Race conditions fixed ✅
- [x] Tier expiration checks implemented ✅

**Score:** 10/10 - All requirements met, production ready

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Slow profile load with many trades | Medium | Low | Limit query size |
| Follow count race condition | Low | Low | Atomic update in mutation |
| Empty leaderboard initially | Medium | Medium | Seed whale data early |

## Security Considerations

- User can only follow/unfollow for themselves
- Tier limits enforced server-side
- Whale addresses truncated in UI
- No sensitive data exposed

## Next Steps

After completing this phase:
1. Proceed to [Phase 07: Activity Feed](./phase-07-activity-feed.md)
2. Connect whale alerts in Phase 08
3. Add performance charts for Pro+ (future)
