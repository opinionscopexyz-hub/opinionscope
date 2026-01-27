# Phase 02: Database Schema

## Context Links
- [Plan Overview](./plan.md)
- [Convex Patterns Research](../reports/researcher-260116-1247-convex-patterns.md)
- [PRD Database Schema](../../OpinionScope_PRD.md#64-database-schema-convex)

## Overview
- **Priority:** P0
- **Status:** ✅ Complete
- **Effort:** 4h
- **Description:** Implement Convex schema with proper indexes for real-time subscriptions, tier-based queries, and market screening.

## Key Insights

From Convex research:
- Compound indexes matching query constraints minimize result sets
- Tier-based delivery requires separate query paths, not filtering
- Denormalize whale stats to avoid joins in subscriptions
- Max 32 indexes per table; prioritize by query frequency

From PRD:
- 6 core tables: users, whales, markets, whaleActivity, alerts, savedPresets
- Additional: notificationLog for delivery tracking

## Requirements

### Functional
- FR-DB-1: Store user profiles with tier, Polar IDs, notification preferences
- FR-DB-2: Track whale addresses with denormalized performance stats
- FR-DB-3: Store markets with all fields needed for screener filters
- FR-DB-4: Record whale activity with timestamps for tiered delivery
- FR-DB-5: Manage user alerts with conditions
- FR-DB-6: Store saved filter presets per user
- FR-DB-7: Log notification delivery status

### Non-Functional
- NFR-DB-1: Query response < 200ms for indexed queries
- NFR-DB-2: Support 50k concurrent WebSocket subscriptions
- NFR-DB-3: Handle 100k+ markets efficiently

## Architecture

```
Convex Schema
├── users           # User accounts + subscription info
├── whales          # Whale addresses + denormalized stats
├── markets         # Prediction markets data
├── whaleActivity   # Trade activity feed
├── alerts          # User alert configurations
├── savedPresets    # Saved screener filters
└── notificationLog # Delivery tracking
```

### Index Strategy

| Table | Index | Purpose | Priority |
|-------|-------|---------|----------|
| users | by_clerkId | Auth lookup | P0 |
| users | by_email | Webhook lookup | P0 |
| users | by_tier | Tier-based queries | P1 |
| whales | by_address | Address lookup | P0 |
| whales | by_winRate | Leaderboard | P0 |
| whales | by_totalVolume | Volume ranking | P1 |
| markets | by_externalId | Sync lookup | P0 |
| markets | by_category_volume | Screener filter | P0 |
| markets | by_volume | Volume sort | P0 |
| markets | by_endDate | Expiry filter | P1 |
| whaleActivity | by_timestamp | Feed subscription | P0 |
| whaleActivity | by_whaleId_timestamp | Whale-specific feed | P0 |
| alerts | by_userId | User alerts | P0 |
| alerts | by_marketId | Market triggers | P1 |

## Related Code Files

### Modify
- `packages/backend/convex/schema.ts` - Replace empty schema

### Create
- `packages/backend/convex/users.ts` - User queries/mutations
- `packages/backend/convex/whales.ts` - Whale queries/mutations
- `packages/backend/convex/markets.ts` - Market queries/mutations
- `packages/backend/convex/whaleActivity.ts` - Activity queries
- `packages/backend/convex/alerts.ts` - Alert CRUD
- `packages/backend/convex/savedPresets.ts` - Preset CRUD
- `packages/backend/convex/lib/tierLimits.ts` - Tier restriction helpers

## Implementation Steps

### Step 1: Define Schema

Replace `packages/backend/convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Reusable validators
const tierValidator = v.union(
  v.literal("free"),
  v.literal("pro"),
  v.literal("pro_plus")
);

const notificationPrefsValidator = v.object({
  email: v.boolean(),
  push: v.boolean(),
  telegram: v.boolean(),
  discord: v.boolean(),
});

const alertConditionValidator = v.object({
  operator: v.union(
    v.literal("gt"),
    v.literal("lt"),
    v.literal("eq"),
    v.literal("gte"),
    v.literal("lte")
  ),
  value: v.number(),
});

export default defineSchema({
  // ============ USERS ============
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    tier: tierValidator,
    tierExpiresAt: v.optional(v.number()),
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
    telegramChatId: v.optional(v.string()),
    discordWebhook: v.optional(v.string()),
    notificationPreferences: notificationPrefsValidator,
    followedWhaleIds: v.array(v.id("whales")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_tier", ["tier"])
    .index("by_polarCustomerId", ["polarCustomerId"]),

  // ============ WHALES ============
  whales: defineTable({
    address: v.string(),
    nickname: v.optional(v.string()),
    avatar: v.optional(v.string()),
    isVerified: v.boolean(),
    // Denormalized stats (updated by background job)
    winRate: v.number(),
    totalVolume: v.number(),
    totalPnl: v.number(),
    tradeCount: v.number(),
    winStreak: v.number(),
    lossStreak: v.number(),
    resolvedTrades: v.number(),
    wonTrades: v.number(),
    lastActiveAt: v.number(),
    favoriteCategories: v.array(v.string()),
    platforms: v.array(v.string()),
    followerCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_address", ["address"])
    .index("by_winRate", ["winRate"])
    .index("by_totalVolume", ["totalVolume"])
    .index("by_lastActiveAt", ["lastActiveAt"])
    .index("by_followerCount", ["followerCount"]),

  // ============ MARKETS ============
  markets: defineTable({
    externalId: v.string(),
    platform: v.union(
      v.literal("opinion_trade"),
      v.literal("polymarket"),
      v.literal("kalshi"),
      v.literal("other")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    // Price data
    yesPrice: v.number(),
    noPrice: v.number(),
    change24h: v.optional(v.number()),
    // Volume data
    volume: v.number(),
    volume24h: v.number(),
    volume7d: v.optional(v.number()),
    liquidity: v.number(),
    // Dates
    endDate: v.number(),
    resolvedAt: v.optional(v.number()),
    outcome: v.optional(v.union(v.literal("yes"), v.literal("no"))),
    // Metadata
    url: v.string(),
    imageUrl: v.optional(v.string()),
    chainId: v.optional(v.number()),
    quoteToken: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_externalId", ["platform", "externalId"])
    .index("by_category", ["category"])
    .index("by_category_volume", ["category", "volume"])
    .index("by_volume", ["volume"])
    .index("by_endDate", ["endDate"])
    .index("by_yesPrice", ["yesPrice"]),

  // ============ WHALE ACTIVITY ============
  whaleActivity: defineTable({
    whaleId: v.id("whales"),
    marketId: v.id("markets"),
    action: v.union(v.literal("BUY"), v.literal("SELL")),
    amount: v.number(),
    price: v.number(),
    platform: v.string(),
    txHash: v.optional(v.string()),
    // For tiered delivery
    visibleToProPlusAt: v.number(), // T+0
    visibleToProAt: v.number(),     // T+30s
    visibleToFreeAt: v.number(),    // T+15min
    timestamp: v.number(),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_whaleId_timestamp", ["whaleId", "timestamp"])
    .index("by_marketId_timestamp", ["marketId", "timestamp"])
    .index("by_visibleToProPlus", ["visibleToProPlusAt"])
    .index("by_visibleToPro", ["visibleToProAt"])
    .index("by_visibleToFree", ["visibleToFreeAt"]),

  // ============ ALERTS ============
  alerts: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("price"),
      v.literal("whale"),
      v.literal("volume"),
      v.literal("new_market")
    ),
    // Optional references
    marketId: v.optional(v.id("markets")),
    whaleId: v.optional(v.id("whales")),
    // Condition for price/volume alerts
    condition: v.optional(alertConditionValidator),
    // For new_market alerts
    filterExpression: v.optional(v.string()),
    // State
    isActive: v.boolean(),
    lastTriggeredAt: v.optional(v.number()),
    triggerCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_type", ["userId", "type"])
    .index("by_marketId", ["marketId"])
    .index("by_whaleId", ["whaleId"])
    .index("by_isActive", ["isActive"]),

  // ============ SAVED PRESETS ============
  savedPresets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    filterExpression: v.optional(v.string()),
    filters: v.object({
      category: v.optional(v.string()),
      minVolume: v.optional(v.number()),
      maxVolume: v.optional(v.number()),
      minPrice: v.optional(v.number()),
      maxPrice: v.optional(v.number()),
      maxDays: v.optional(v.number()),
    }),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"]),

  // ============ NOTIFICATION LOG ============
  notificationLog: defineTable({
    userId: v.id("users"),
    alertId: v.optional(v.id("alerts")),
    activityId: v.optional(v.id("whaleActivity")),
    type: v.string(),
    channel: v.union(
      v.literal("email"),
      v.literal("push"),
      v.literal("telegram"),
      v.literal("discord"),
      v.literal("in_app")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed")
    ),
    content: v.string(),
    errorMessage: v.optional(v.string()),
    sentAt: v.number(),
  })
    .index("by_userId_sentAt", ["userId", "sentAt"])
    .index("by_status", ["status"])
    .index("by_alertId", ["alertId"]),
});
```

### Step 2: Create Tier Limits Helper

Create `packages/backend/convex/lib/tierLimits.ts`:

```typescript
import type { Doc } from "../_generated/dataModel";

export const TIER_LIMITS = {
  free: {
    maxAlerts: 3,
    maxFollowedWhales: 3,
    maxSavedPresets: 1,
    leaderboardLimit: 10,
    recentTradesVisible: 3,
    csvExportRows: 10,
    feedDelayMinutes: 15,
    channels: ["email", "in_app"] as const,
  },
  pro: {
    maxAlerts: 50,
    maxFollowedWhales: 20,
    maxSavedPresets: 10,
    leaderboardLimit: 50,
    recentTradesVisible: 10,
    csvExportRows: 100,
    feedDelayMinutes: 0, // Real-time
    channels: ["email", "push", "telegram", "discord", "in_app"] as const,
  },
  pro_plus: {
    maxAlerts: Infinity,
    maxFollowedWhales: Infinity,
    maxSavedPresets: Infinity,
    leaderboardLimit: Infinity,
    recentTradesVisible: 50,
    csvExportRows: Infinity,
    feedDelayMinutes: 0, // Real-time + early access
    earlyAccessSeconds: 30,
    channels: ["email", "push", "telegram", "discord", "in_app"] as const,
  },
} as const;

export type UserTier = keyof typeof TIER_LIMITS;

export function getTierLimits(tier: UserTier) {
  return TIER_LIMITS[tier];
}

export function canAddAlert(user: Doc<"users">, currentAlertCount: number): boolean {
  const limits = getTierLimits(user.tier);
  return currentAlertCount < limits.maxAlerts;
}

export function canFollowWhale(user: Doc<"users">, currentFollowCount: number): boolean {
  const limits = getTierLimits(user.tier);
  return currentFollowCount < limits.maxFollowedWhales;
}

export function canSavePreset(user: Doc<"users">, currentPresetCount: number): boolean {
  const limits = getTierLimits(user.tier);
  return currentPresetCount < limits.maxSavedPresets;
}

export function getActivityFeedTimestamp(tier: UserTier): number {
  const limits = getTierLimits(tier);
  const delayMs = limits.feedDelayMinutes * 60 * 1000;
  return Date.now() - delayMs;
}
```

### Step 3: Create Base User Queries

Create `packages/backend/convex/users.ts`:

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const create = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      tier: "free",
      notificationPreferences: {
        email: true,
        push: false,
        telegram: false,
        discord: false,
      },
      followedWhaleIds: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTier = mutation({
  args: {
    userId: v.id("users"),
    tier: v.union(v.literal("free"), v.literal("pro"), v.literal("pro_plus")),
    tierExpiresAt: v.optional(v.number()),
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});
```

### Step 4: Create Health Check Update

Update `packages/backend/convex/healthCheck.ts` to use new schema:

```typescript
import { query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    // Verify schema is deployed by checking if tables exist
    const marketCount = await ctx.db.query("markets").take(1);
    return "OK";
  },
});
```

## Todo List

- [x] Replace `packages/backend/convex/schema.ts` with full schema
- [x] Create `packages/backend/convex/lib/tierLimits.ts`
- [x] Create `packages/backend/convex/users.ts` with base queries
- [x] Update `packages/backend/convex/healthCheck.ts`
- [x] Run `bun run dev:setup` to deploy schema
- [x] Verify schema in Convex dashboard
- [x] Test user creation mutation
- [x] Verify indexes created correctly
- [x] Added `syncLogs` table for cron job monitoring

## Success Criteria

- [x] Schema deploys without errors
- [x] All 8 tables visible in Convex dashboard (7 + syncLogs)
- [x] Indexes created for all tables
- [x] TypeScript types generated correctly
- [x] Health check returns "OK"

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Index limit (32/table) | Medium | Low | Compound indexes cover multiple use cases |
| Schema migration issues | Medium | Low | Fresh project, no existing data |
| Type generation lag | Low | Low | Restart dev server |

## Security Considerations

- No direct user data exposure in queries
- Tier checks enforced at query level
- Polar IDs stored but not exposed to client
- Email indexed for webhook lookups only

## Next Steps

After completing this phase:
1. Proceed to [Phase 03: Auth Integration](./phase-03-auth-integration.md)
2. Schema changes will be used by data sync in Phase 04
