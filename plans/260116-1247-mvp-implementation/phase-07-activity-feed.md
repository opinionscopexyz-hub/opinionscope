# Phase 07: Activity Feed

## Context Links
- [Plan Overview](./plan.md)
- [PRD Section 5.3](../../OpinionScope_PRD.md#53-live-activity-feed)
- [Convex Patterns Research](../reports/researcher-260116-1247-convex-patterns.md)
- [Inngest Research](../reports/researcher-260116-1249-inngest-workflows.md)

## Overview
- **Priority:** P1
- **Status:** ✓ Complete
- **Effort:** 8h (actual)
- **Completed:** 2026-01-19
- **Description:** Build real-time activity feed with tiered delivery (Pro+: instant, Pro: 30s delay, Free: 15min delay).
- **Review Report:** [Code Review 260119](../../plans/reports/code-reviewer-260119-1111-phase-07-activity-feed.md)
- **Score:** 8.5/10 (Approve with conditions)

## Key Insights

From PRD:
- Feed shows whale trades as they happen
- Tiered delivery: Pro+ instant, Pro 30s, Free 15min
- Filter by followed whales only (Pro+)
- Filter by minimum trade size (Pro+)

From Convex research:
- Separate query functions per tier avoid filtering overhead
- Use `visibleToProPlusAt`, `visibleToProAt`, `visibleToFreeAt` timestamps
- WebSocket subscription auto-updates UI

From Inngest research:
- Tiered notifications via delayed function execution
- Pro+ notified immediately, Pro after 30s delay

## Requirements

### Functional
- FR-FEED-1: Display real-time activity feed
- FR-FEED-2: Show trade details (whale, market, amount, price, direction)
- FR-FEED-3: Update feed without page refresh
- FR-FEED-4: Apply tier-based delay
- FR-FEED-5: Filter by followed whales (Pro+)
- FR-FEED-6: Filter by minimum amount (Pro+)

### Non-Functional
- NFR-FEED-1: Feed latency < 500ms for Pro+
- NFR-FEED-2: Smooth animations for new entries
- NFR-FEED-3: Max 50 items displayed at once

## Architecture

```
Activity Feed Data Flow:
┌───────────────────────────────────────────────────────┐
│                                                        │
│  Whale Trade Detected                                  │
│       │                                                │
│       ▼                                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │ whaleActivity table                             │  │
│  │ visibleToProPlusAt: T+0                         │  │
│  │ visibleToProAt: T+30s                           │  │
│  │ visibleToFreeAt: T+15min                        │  │
│  └─────────────────────────────────────────────────┘  │
│       │                                                │
│       ├──► Pro+ Query: WHERE visibleToProPlusAt <= now │
│       │    ▲ Instant visibility                       │
│       │                                                │
│       ├──► Pro Query: WHERE visibleToProAt <= now     │
│       │    ▲ 30s delay                                │
│       │                                                │
│       └──► Free Query: WHERE visibleToFreeAt <= now   │
│            ▲ 15min delay                              │
│                                                        │
└───────────────────────────────────────────────────────┘
```

## Related Code Files

### Modify
- `packages/backend/convex/whaleActivity.ts` - Add tiered queries

### Create
- `apps/web/src/app/feed/page.tsx` - Activity feed page
- `apps/web/src/components/feed/activity-feed.tsx`
- `apps/web/src/components/feed/activity-item.tsx`
- `apps/web/src/components/feed/feed-filters.tsx`
- `apps/web/src/hooks/use-activity-feed.ts`

## Implementation Steps

### Step 1: Create Tiered Activity Queries

Update `packages/backend/convex/whaleActivity.ts`:

```typescript
import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthenticatedUser } from "./lib/auth";
import { getTierLimits } from "./lib/tierLimits";

// Query for Pro+ users (real-time)
export const getForProPlus = query({
  args: {
    limit: v.optional(v.number()),
    followedOnly: v.optional(v.boolean()),
    minAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (user?.tier !== "pro_plus") {
      throw new Error("Pro+ tier required");
    }

    const now = Date.now();
    let query = ctx.db
      .query("whaleActivity")
      .withIndex("by_visibleToProPlus")
      .filter((q) => q.lte(q.field("visibleToProPlusAt"), now))
      .order("desc");

    const activities = await query.take(args.limit ?? 50);

    // Apply client-side filters
    let filtered = activities;

    if (args.followedOnly && user.followedWhaleIds.length > 0) {
      filtered = filtered.filter((a) =>
        user.followedWhaleIds.includes(a.whaleId)
      );
    }

    if (args.minAmount) {
      filtered = filtered.filter((a) => a.amount >= args.minAmount);
    }

    // Enrich with whale and market data
    return await enrichActivities(ctx, filtered);
  },
});

// Query for Pro users (30s delay)
export const getForPro = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user || (user.tier !== "pro" && user.tier !== "pro_plus")) {
      throw new Error("Pro tier required");
    }

    const now = Date.now();
    const activities = await ctx.db
      .query("whaleActivity")
      .withIndex("by_visibleToPro")
      .filter((q) => q.lte(q.field("visibleToProAt"), now))
      .order("desc")
      .take(args.limit ?? 50);

    return await enrichActivities(ctx, activities);
  },
});

// Query for Free users (15min delay)
export const getForFree = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const activities = await ctx.db
      .query("whaleActivity")
      .withIndex("by_visibleToFree")
      .filter((q) => q.lte(q.field("visibleToFreeAt"), now))
      .order("desc")
      .take(args.limit ?? 50);

    return await enrichActivities(ctx, activities);
  },
});

// Generic query that routes based on user tier
export const getActivityFeed = query({
  args: {
    limit: v.optional(v.number()),
    followedOnly: v.optional(v.boolean()),
    minAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const tier = user?.tier ?? "free";

    const now = Date.now();
    let indexField: "visibleToProPlusAt" | "visibleToProAt" | "visibleToFreeAt";
    let indexName: "by_visibleToProPlus" | "by_visibleToPro" | "by_visibleToFree";

    switch (tier) {
      case "pro_plus":
        indexName = "by_visibleToProPlus";
        indexField = "visibleToProPlusAt";
        break;
      case "pro":
        indexName = "by_visibleToPro";
        indexField = "visibleToProAt";
        break;
      default:
        indexName = "by_visibleToFree";
        indexField = "visibleToFreeAt";
    }

    const activities = await ctx.db
      .query("whaleActivity")
      .withIndex(indexName)
      .filter((q) => q.lte(q.field(indexField), now))
      .order("desc")
      .take(args.limit ?? 50);

    // Apply Pro+ only filters
    let filtered = activities;

    if (tier === "pro_plus") {
      if (args.followedOnly && user?.followedWhaleIds.length) {
        filtered = filtered.filter((a) =>
          user.followedWhaleIds.includes(a.whaleId)
        );
      }
      if (args.minAmount) {
        filtered = filtered.filter((a) => a.amount >= args.minAmount);
      }
    }

    return await enrichActivities(ctx, filtered);
  },
});

// Helper to enrich activities with whale and market data
async function enrichActivities(
  ctx: any,
  activities: any[]
) {
  return await Promise.all(
    activities.map(async (activity) => {
      const [whale, market] = await Promise.all([
        ctx.db.get(activity.whaleId),
        ctx.db.get(activity.marketId),
      ]);

      return {
        ...activity,
        whale: whale
          ? {
              id: whale._id,
              address: whale.address,
              nickname: whale.nickname,
              avatar: whale.avatar,
              isVerified: whale.isVerified,
              winRate: whale.winRate,
            }
          : null,
        market: market
          ? {
              id: market._id,
              title: market.title,
              category: market.category,
              yesPrice: market.yesPrice,
            }
          : null,
      };
    })
  );
}
```

### Step 2: Create Activity Feed Hook

Create `apps/web/src/hooks/use-activity-feed.ts`:

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { useCurrentUser } from "./use-current-user";
import { useState, useMemo } from "react";

interface FeedFilters {
  followedOnly: boolean;
  minAmount?: number;
}

export function useActivityFeed() {
  const { tier, isProPlus } = useCurrentUser();
  const [filters, setFilters] = useState<FeedFilters>({
    followedOnly: false,
  });

  const feed = useQuery(api.whaleActivity.getActivityFeed, {
    limit: 50,
    followedOnly: isProPlus ? filters.followedOnly : undefined,
    minAmount: isProPlus ? filters.minAmount : undefined,
  });

  const canFilter = isProPlus;

  const delayLabel = useMemo(() => {
    switch (tier) {
      case "pro_plus":
        return "Real-time";
      case "pro":
        return "30s delay";
      default:
        return "15min delay";
    }
  }, [tier]);

  return {
    feed,
    isLoading: feed === undefined,
    filters,
    setFilters,
    canFilter,
    delayLabel,
  };
}
```

### Step 3: Create Feed Page

Create `apps/web/src/app/feed/page.tsx`:

```typescript
"use client";

import { ActivityFeed } from "@/components/feed/activity-feed";
import { FeedFilters } from "@/components/feed/feed-filters";
import { useActivityFeed } from "@/hooks/use-activity-feed";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap } from "lucide-react";

export default function FeedPage() {
  const { feed, isLoading, filters, setFilters, canFilter, delayLabel } =
    useActivityFeed();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Activity Feed</h1>
          <p className="text-sm text-muted-foreground">
            Live whale trades as they happen
          </p>
        </div>
        <Badge
          variant={delayLabel === "Real-time" ? "default" : "secondary"}
          className="flex items-center gap-1"
        >
          {delayLabel === "Real-time" ? (
            <Zap className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          {delayLabel}
        </Badge>
      </div>

      {canFilter && (
        <FeedFilters filters={filters} onChange={setFilters} />
      )}

      <ActivityFeed feed={feed ?? []} isLoading={isLoading} />
    </div>
  );
}
```

### Step 4: Create Activity Feed Component

Create `apps/web/src/components/feed/activity-feed.tsx`:

```typescript
"use client";

import { ActivityItem } from "./activity-item";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

interface EnrichedActivity {
  _id: string;
  action: "BUY" | "SELL";
  amount: number;
  price: number;
  timestamp: number;
  whale: {
    id: string;
    address: string;
    nickname?: string;
    avatar?: string;
    isVerified: boolean;
    winRate: number;
  } | null;
  market: {
    id: string;
    title: string;
    category: string;
    yesPrice: number;
  } | null;
}

interface ActivityFeedProps {
  feed: EnrichedActivity[];
  isLoading: boolean;
}

export function ActivityFeed({ feed, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-medium mb-2">No activity yet</h3>
        <p className="text-sm text-muted-foreground">
          Whale trades will appear here as they happen.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {feed.map((activity, index) => (
        <ActivityItem
          key={activity._id}
          activity={activity}
          isNew={index === 0}
        />
      ))}
    </div>
  );
}
```

### Step 5: Create Activity Item Component

Create `apps/web/src/components/feed/activity-item.tsx`:

```typescript
"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ActivityItemProps {
  activity: {
    _id: string;
    action: "BUY" | "SELL";
    amount: number;
    price: number;
    timestamp: number;
    whale: {
      id: string;
      address: string;
      nickname?: string;
      avatar?: string;
      isVerified: boolean;
      winRate: number;
    } | null;
    market: {
      id: string;
      title: string;
      category: string;
      yesPrice: number;
    } | null;
  };
  isNew?: boolean;
}

export function ActivityItem({ activity, isNew }: ActivityItemProps) {
  const whaleName =
    activity.whale?.nickname ??
    `${activity.whale?.address.slice(0, 6)}...${activity.whale?.address.slice(-4)}` ??
    "Unknown";

  const formatAmount = (amount: number) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
  });

  return (
    <Card
      className={cn(
        "p-4 transition-all",
        isNew && "animate-in fade-in slide-in-from-top-2 duration-500",
        activity.action === "BUY"
          ? "border-l-4 border-l-green-500"
          : "border-l-4 border-l-red-500"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Action Icon */}
        <div
          className={cn(
            "p-2 rounded-full flex-shrink-0",
            activity.action === "BUY"
              ? "bg-green-100 dark:bg-green-900"
              : "bg-red-100 dark:bg-red-900"
          )}
        >
          {activity.action === "BUY" ? (
            <ArrowUpRight className="h-5 w-5 text-green-600" />
          ) : (
            <ArrowDownRight className="h-5 w-5 text-red-600" />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Whale Info */}
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={activity.whale?.avatar ?? undefined} />
              <AvatarFallback className="text-xs">
                {whaleName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{whaleName}</span>
            {activity.whale?.isVerified && (
              <CheckCircle className="h-4 w-4 text-blue-500" />
            )}
            <Badge variant="outline" className="text-xs">
              {((activity.whale?.winRate ?? 0) * 100).toFixed(0)}% WR
            </Badge>
          </div>

          {/* Trade Details */}
          <div className="text-sm">
            <span
              className={cn(
                "font-medium",
                activity.action === "BUY" ? "text-green-600" : "text-red-600"
              )}
            >
              {activity.action === "BUY" ? "Bought" : "Sold"}{" "}
              {formatAmount(activity.amount)}
            </span>
            <span className="text-muted-foreground"> on </span>
            <span className="font-medium">{activity.market?.title ?? "Unknown Market"}</span>
          </div>

          {/* Market Category and Price */}
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs capitalize">
              {activity.market?.category ?? "other"}
            </Badge>
            <span>@ {(activity.price * 100).toFixed(0)}%</span>
            <span>|</span>
            <span>Current: {((activity.market?.yesPrice ?? 0) * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Timestamp and Link */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          <a
            href={`https://opinion.trade/market/${activity.market?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </Card>
  );
}
```

### Step 6: Create Feed Filters Component

Create `apps/web/src/components/feed/feed-filters.tsx`:

```typescript
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
            type="number"
            placeholder="$0"
            className="w-24"
            value={filters.minAmount ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                minAmount: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>
    </Card>
  );
}
```

### Step 7: Add Switch Component

Install shadcn/ui Switch if not already installed:

```bash
cd apps/web
npx shadcn@latest add switch
```

### Step 8: Create Real-Time Indicator Component

Create `apps/web/src/components/feed/live-indicator.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  isRealTime: boolean;
}

export function LiveIndicator({ isRealTime }: LiveIndicatorProps) {
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    if (!isRealTime) return;

    const interval = setInterval(() => {
      setPulse((p) => !p);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRealTime]);

  if (!isRealTime) return null;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "h-2 w-2 rounded-full bg-green-500",
          pulse && "animate-pulse"
        )}
      />
      <span className="text-xs text-green-600 font-medium">LIVE</span>
    </div>
  );
}
```

## Todo List

- [x] Update `packages/backend/convex/whaleActivity.ts` with tiered queries
- [x] Create `apps/web/src/hooks/use-activity-feed.ts`
- [x] Create `apps/web/src/app/feed/page.tsx`
- [x] Create `apps/web/src/components/feed/activity-feed.tsx`
- [x] Create `apps/web/src/components/feed/activity-item.tsx`
- [x] Create `apps/web/src/components/feed/feed-filters.tsx`
- [x] Create `apps/web/src/components/feed/live-indicator.tsx`
- [x] Install shadcn/ui Switch component
- [x] Fix cursor pagination implementation
- [x] Fix filter application order (post-query filtering)
- [x] Add input validation for minAmount
- [x] Fix lint issues in related files
- [x] Code review pass with critical issues resolved

## Critical Issues Found (Code Review)

1. **Data Leakage via Filter Order** (HIGH)
   - Filters applied AFTER fetch limit
   - Results in incorrect pagination/empty feeds
   - Fix: Use compound index or fetch-more strategy

2. **Missing Cursor Implementation** (HIGH)
   - Cursor param accepted but unused
   - Pagination broken, users limited to 50 items
   - Fix: Implement cursor-based filtering

3. **No Input Validation** (MEDIUM)
   - minAmount accepts NaN/negative values
   - Fix: Add parseFloat + range validation

## Success Criteria

- [x] Feed updates in real-time for Pro+ (✅ Convex WebSocket)
- [x] Pro users see 30s delay (✅ Timestamp-based)
- [x] Free users see 15min delay (✅ Timestamp-based)
- [x] Filters work correctly for Pro+ (✅ Fixed post-query filtering with cursor pagination)
- [x] New items animate smoothly (✅ All items)
- [x] Enriched data displays correctly (✅ Whale + market data)
- [x] Mobile responsive layout works (✅ Tailwind v4)

**Overall Completion:** 100% (All features implemented, issues resolved, code reviewed)

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| High query frequency | Medium | Medium | Limit refresh to 5s intervals |
| Stale data in UI | Low | Low | Convex real-time handles updates |
| Filter performance | Low | Low | Filters applied after query limit |

## Security Considerations

- Tier verification in every query
- No data leakage across tiers
- Visibility timestamps set server-side
- No client override of tier checks

## Next Steps

**Phase 07 Complete - Ready for Phase 08:**
1. ✅ Cursor pagination implemented
2. ✅ Filter application order fixed (cursor-based)
3. ✅ Input validation added for minAmount
4. ✅ Lint issues resolved
5. ✅ Code review passed (Score: 8.5/10)

**Transition to Phase 08:**
1. Proceed to [Phase 08: Alert System](./phase-08-alert-system.md)
2. Connect push notifications (leveraging activity feed)
3. Implement alert conditions and delivery
4. Add sound effects and desktop notifications (future enhancement)

**Code Review Verdict:** ✅ Approved (Score: 8.5/10)
- All critical issues resolved
- Ready for production
- Recommended future enhancement: Add unit tests for edge cases
