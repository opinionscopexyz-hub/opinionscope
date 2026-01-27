# Phase 08: Alert System

## Context Links
- [Plan Overview](./plan.md)
- [PRD Section 5.4](../../OpinionScope_PRD.md#54-alert-system)
- [Inngest Research](../reports/researcher-260116-1249-inngest-workflows.md)
- [Phase 02: Database Schema](./phase-02-database-schema.md)

## Overview
- **Priority:** P1
- **Status:** ✅ COMPLETE - Production Ready (9.0/10)
- **Effort:** 10h (actual: ~10h including fixes)
- **Description:** Build alert system with price alerts and whale activity alerts, delivered via email (MVP) with tier-based limits.
- **Review Report:** [Code Review Report - Post-Fix](../../plans/reports/code-reviewer-260119-1207-phase08-alert-system-review.md)

## Key Insights

From PRD:
- Alert types: price, whale, volume, new_market
- Tier limits: Free 3, Pro 50, Pro+ unlimited
- Channels: Free (email, in_app), Pro+ (all channels)
- MVP focus: price alerts + whale alerts + email delivery

From Inngest research:
- Use event-driven functions for alert triggering
- Rate limit per user to prevent spam
- Debounce for rapid price changes

## Requirements

### Functional
- FR-ALERT-1: Create price alerts on markets
- FR-ALERT-2: Create whale activity alerts
- FR-ALERT-3: List user's alerts
- FR-ALERT-4: Toggle alert active/inactive
- FR-ALERT-5: Delete alerts
- FR-ALERT-6: Trigger alerts when conditions met
- FR-ALERT-7: Send email notifications

### Non-Functional
- NFR-ALERT-1: Alert check < 5 seconds after data change
- NFR-ALERT-2: Email delivery within 1 minute
- NFR-ALERT-3: Max 1 alert per market per user per hour

## Architecture

```
Alert Flow:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Market Price Update / Whale Activity                       │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Inngest: check-price-alerts                         │   │
│  │ - Query active alerts for market                    │   │
│  │ - Evaluate conditions                               │   │
│  │ - Trigger matching alerts                           │   │
│  └─────────────────────────────────────────────────────┘   │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Inngest: send-alert-notification                    │   │
│  │ - Rate limit per user                               │   │
│  │ - Send email via Resend                             │   │
│  │ - Log to notificationLog                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files

### Create
- `apps/web/src/app/alerts/page.tsx` - Alerts management page
- `apps/web/src/components/alerts/alert-list.tsx`
- `apps/web/src/components/alerts/create-alert-dialog.tsx`
- `apps/web/src/components/alerts/price-alert-form.tsx`
- `apps/web/src/components/alerts/whale-alert-form.tsx`
- `packages/backend/convex/alerts.ts` - Alert CRUD
- `apps/web/src/lib/inngest/functions/check-alerts.ts`
- `apps/web/src/lib/inngest/functions/send-notification.ts`
- `apps/web/src/lib/email/templates/alert-email.tsx`

## Implementation Steps

### Step 1: Create Alert Queries and Mutations

Create `packages/backend/convex/alerts.ts`:

```typescript
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { canAddAlert, getTierLimits } from "./lib/tierLimits";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    // Enrich with market/whale data
    return await Promise.all(
      alerts.map(async (alert) => {
        const market = alert.marketId
          ? await ctx.db.get(alert.marketId)
          : null;
        const whale = alert.whaleId ? await ctx.db.get(alert.whaleId) : null;

        return {
          ...alert,
          market: market
            ? { id: market._id, title: market.title, yesPrice: market.yesPrice }
            : null,
          whale: whale
            ? { id: whale._id, nickname: whale.nickname, address: whale.address }
            : null,
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal("price"),
      v.literal("whale"),
      v.literal("volume"),
      v.literal("new_market")
    ),
    marketId: v.optional(v.id("markets")),
    whaleId: v.optional(v.id("whales")),
    condition: v.optional(
      v.object({
        operator: v.union(
          v.literal("gt"),
          v.literal("lt"),
          v.literal("eq"),
          v.literal("gte"),
          v.literal("lte")
        ),
        value: v.number(),
      })
    ),
    filterExpression: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Check tier limit
    const existingAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    if (!canAddAlert(user, existingAlerts.length)) {
      const limits = getTierLimits(user.tier);
      throw new Error(
        `Alert limit reached (${limits.maxAlerts}). Upgrade to create more alerts.`
      );
    }

    // Validate based on type
    if (args.type === "price" && !args.marketId) {
      throw new Error("Price alerts require a market");
    }
    if (args.type === "whale" && !args.whaleId) {
      throw new Error("Whale alerts require a whale");
    }
    if (args.type === "price" && !args.condition) {
      throw new Error("Price alerts require a condition");
    }

    // Check for duplicate
    const duplicate = existingAlerts.find(
      (a) =>
        a.type === args.type &&
        a.marketId === args.marketId &&
        a.whaleId === args.whaleId
    );
    if (duplicate) {
      throw new Error("You already have an alert for this");
    }

    return await ctx.db.insert("alerts", {
      userId: user._id,
      type: args.type,
      marketId: args.marketId,
      whaleId: args.whaleId,
      condition: args.condition,
      filterExpression: args.filterExpression,
      isActive: true,
      triggerCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const toggle = mutation({
  args: {
    alertId: v.id("alerts"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const alert = await ctx.db.get(args.alertId);

    if (!alert || alert.userId !== user._id) {
      throw new Error("Alert not found");
    }

    await ctx.db.patch(args.alertId, {
      isActive: args.isActive,
    });
  },
});

export const remove = mutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const alert = await ctx.db.get(args.alertId);

    if (!alert || alert.userId !== user._id) {
      throw new Error("Alert not found");
    }

    await ctx.db.delete(args.alertId);
  },
});

// For Inngest: Get alerts that match market conditions
export const getActiveAlertsForMarket = query({
  args: { marketId: v.id("markets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_marketId", (q) => q.eq("marketId", args.marketId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// For Inngest: Get alerts for whale
export const getActiveAlertsForWhale = query({
  args: { whaleId: v.id("whales") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_whaleId", (q) => q.eq("whaleId", args.whaleId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Mark alert as triggered
export const markTriggered = mutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    if (!alert) return;

    await ctx.db.patch(args.alertId, {
      lastTriggeredAt: Date.now(),
      triggerCount: alert.triggerCount + 1,
    });
  },
});

export const getAlertCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    return alerts.length;
  },
});
```

### Step 2: Create Alert Check Inngest Function

Create `apps/web/src/lib/inngest/functions/check-alerts.ts`:

```typescript
import { inngest } from "../client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@opinion-scope/backend/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Triggered after market data sync
export const checkPriceAlerts = inngest.createFunction(
  {
    id: "check-price-alerts",
    concurrency: { limit: 5 },
  },
  { event: "market/updated" },
  async ({ event, step }) => {
    const { marketId, currentPrice } = event.data;

    // Get active alerts for this market
    const alerts = await step.run("get-alerts", async () => {
      return await convex.query(api.alerts.getActiveAlertsForMarket, {
        marketId,
      });
    });

    if (alerts.length === 0) return { triggeredCount: 0 };

    let triggeredCount = 0;

    for (const alert of alerts) {
      const triggered = await step.run(`check-alert-${alert._id}`, async () => {
        if (!alert.condition) return false;

        const { operator, value } = alert.condition;
        let matches = false;

        switch (operator) {
          case "gt":
            matches = currentPrice > value;
            break;
          case "lt":
            matches = currentPrice < value;
            break;
          case "gte":
            matches = currentPrice >= value;
            break;
          case "lte":
            matches = currentPrice <= value;
            break;
          case "eq":
            matches = Math.abs(currentPrice - value) < 0.01;
            break;
        }

        return matches;
      });

      if (triggered) {
        // Check cooldown (1 hour)
        const lastTriggered = alert.lastTriggeredAt ?? 0;
        const cooldownMs = 60 * 60 * 1000; // 1 hour

        if (Date.now() - lastTriggered < cooldownMs) {
          continue;
        }

        // Send notification event
        await step.run(`trigger-alert-${alert._id}`, async () => {
          await inngest.send({
            name: "alert/triggered",
            data: {
              alertId: alert._id,
              userId: alert.userId,
              type: "price",
              marketId,
              currentPrice,
              condition: alert.condition,
            },
          });

          // Mark as triggered
          await convex.mutation(api.alerts.markTriggered, {
            alertId: alert._id,
          });
        });

        triggeredCount++;
      }
    }

    return { triggeredCount };
  }
);

// Triggered when whale activity is detected
export const checkWhaleAlerts = inngest.createFunction(
  {
    id: "check-whale-alerts",
    concurrency: { limit: 5 },
  },
  { event: "whale/activity" },
  async ({ event, step }) => {
    const { whaleId, activityId, action, amount, marketId } = event.data;

    // Get active alerts for this whale
    const alerts = await step.run("get-alerts", async () => {
      return await convex.query(api.alerts.getActiveAlertsForWhale, { whaleId });
    });

    if (alerts.length === 0) return { triggeredCount: 0 };

    let triggeredCount = 0;

    for (const alert of alerts) {
      // Check cooldown
      const lastTriggered = alert.lastTriggeredAt ?? 0;
      const cooldownMs = 60 * 60 * 1000;

      if (Date.now() - lastTriggered < cooldownMs) {
        continue;
      }

      await step.run(`trigger-alert-${alert._id}`, async () => {
        await inngest.send({
          name: "alert/triggered",
          data: {
            alertId: alert._id,
            userId: alert.userId,
            type: "whale",
            whaleId,
            activityId,
            action,
            amount,
            marketId,
          },
        });

        await convex.mutation(api.alerts.markTriggered, {
          alertId: alert._id,
        });
      });

      triggeredCount++;
    }

    return { triggeredCount };
  }
);
```

### Step 3: Create Notification Sender

Create `apps/web/src/lib/inngest/functions/send-notification.ts`:

```typescript
import { inngest } from "../client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { Resend } from "resend";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendAlertNotification = inngest.createFunction(
  {
    id: "send-alert-notification",
    rateLimit: {
      limit: 10,
      period: "1m",
      key: "event.data.userId",
    },
  },
  { event: "alert/triggered" },
  async ({ event, step }) => {
    const { alertId, userId, type, ...data } = event.data;

    // Get user
    const user = await step.run("get-user", async () => {
      // Need to add a query to get user by ID
      return await convex.query(api.users.getById, { id: userId });
    });

    if (!user || !user.notificationPreferences.email) {
      return { sent: false, reason: "Email notifications disabled" };
    }

    // Build email content
    let subject = "";
    let body = "";

    if (type === "price") {
      const market = await step.run("get-market", async () => {
        return await convex.query(api.markets.getById, { id: data.marketId });
      });

      subject = `Price Alert: ${market?.title ?? "Market"}`;
      body = `
        Your price alert has triggered!

        Market: ${market?.title}
        Current Price: ${((data.currentPrice as number) * 100).toFixed(0)}%
        Condition: ${data.condition?.operator} ${((data.condition?.value as number) * 100).toFixed(0)}%

        View on Opinion.Trade: ${market?.url ?? "#"}
      `;
    } else if (type === "whale") {
      const whale = await step.run("get-whale", async () => {
        return await convex.query(api.whales.getById, { id: data.whaleId });
      });
      const market = await step.run("get-market", async () => {
        return await convex.query(api.markets.getById, { id: data.marketId });
      });

      const whaleName =
        whale?.nickname ??
        `${whale?.address.slice(0, 6)}...${whale?.address.slice(-4)}`;

      subject = `Whale Alert: ${whaleName} made a trade!`;
      body = `
        A whale you're following just made a trade!

        Whale: ${whaleName}
        Action: ${data.action}
        Amount: $${(data.amount as number).toLocaleString()}
        Market: ${market?.title}

        View on Opinion.Trade: ${market?.url ?? "#"}
      `;
    }

    // Send email
    const result = await step.run("send-email", async () => {
      try {
        await resend.emails.send({
          from: "OpinionScope <alerts@opinionscope.io>",
          to: user.email,
          subject,
          text: body,
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    // Log notification
    await step.run("log-notification", async () => {
      await convex.mutation(api.notifications.log, {
        userId,
        alertId,
        type,
        channel: "email",
        status: result.success ? "sent" : "failed",
        content: subject,
        errorMessage: result.error,
      });
    });

    return { sent: result.success };
  }
);
```

### Step 4: Create Notification Log Mutation

Add to `packages/backend/convex/notifications.ts`:

```typescript
import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";

export const log = internalMutation({
  args: {
    userId: v.id("users"),
    alertId: v.optional(v.id("alerts")),
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notificationLog", {
      ...args,
      sentAt: Date.now(),
    });
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    return await ctx.db
      .query("notificationLog")
      .withIndex("by_userId_sentAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 20);
  },
});
```

### Step 5: Create Alerts Page

Create `apps/web/src/app/alerts/page.tsx`:

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AlertList } from "@/components/alerts/alert-list";
import { CreateAlertDialog } from "@/components/alerts/create-alert-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Lock } from "lucide-react";
import Link from "next/link";

export default function AlertsPage() {
  const { isAuthenticated, tier } = useCurrentUser();
  const alerts = useQuery(api.alerts.list);
  const alertCount = useQuery(api.alerts.getAlertCount);

  const tierLimit = tier === "free" ? 3 : tier === "pro" ? 50 : Infinity;
  const canCreate = (alertCount ?? 0) < tierLimit;

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="p-8 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Sign in to create alerts</h2>
          <p className="text-muted-foreground mb-4">
            Get notified when markets reach your target prices or whales make trades.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            {alertCount ?? 0} / {tierLimit === Infinity ? "unlimited" : tierLimit} alerts used
          </p>
        </div>
        {canCreate ? (
          <CreateAlertDialog />
        ) : (
          <Button variant="outline" asChild>
            <Link href="/pricing">
              <Lock className="h-4 w-4 mr-2" />
              Upgrade for more
            </Link>
          </Button>
        )}
      </div>

      <AlertList alerts={alerts ?? []} />
    </div>
  );
}
```

### Step 6: Create Alert List Component

Create `apps/web/src/components/alerts/alert-list.tsx`:

```typescript
"use client";

import { useMutation } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, TrendingUp, User } from "lucide-react";
import { toast } from "sonner";

interface AlertListProps {
  alerts: Array<{
    _id: string;
    type: "price" | "whale" | "volume" | "new_market";
    isActive: boolean;
    condition?: { operator: string; value: number };
    triggerCount: number;
    lastTriggeredAt?: number;
    market?: { id: string; title: string; yesPrice: number } | null;
    whale?: { id: string; nickname?: string; address: string } | null;
  }>;
}

export function AlertList({ alerts }: AlertListProps) {
  const toggleAlert = useMutation(api.alerts.toggle);
  const removeAlert = useMutation(api.alerts.remove);

  if (alerts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-medium mb-2">No alerts yet</h3>
        <p className="text-sm text-muted-foreground">
          Create your first alert to get notified about market movements.
        </p>
      </Card>
    );
  }

  const handleToggle = async (alertId: string, isActive: boolean) => {
    try {
      await toggleAlert({ alertId: alertId as any, isActive });
      toast.success(isActive ? "Alert enabled" : "Alert disabled");
    } catch (error) {
      toast.error("Failed to update alert");
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      await removeAlert({ alertId: alertId as any });
      toast.success("Alert deleted");
    } catch (error) {
      toast.error("Failed to delete alert");
    }
  };

  const formatOperator = (op: string) => {
    const map: Record<string, string> = {
      gt: ">",
      lt: "<",
      gte: ">=",
      lte: "<=",
      eq: "=",
    };
    return map[op] ?? op;
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Card key={alert._id} className="p-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="p-2 rounded-full bg-muted">
              {alert.type === "price" ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs capitalize">
                  {alert.type}
                </Badge>
                {alert.triggerCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Triggered {alert.triggerCount}x
                  </span>
                )}
              </div>

              {alert.type === "price" && alert.market && (
                <div className="text-sm">
                  <span className="font-medium">{alert.market.title}</span>
                  {alert.condition && (
                    <span className="text-muted-foreground">
                      {" "}
                      {formatOperator(alert.condition.operator)}{" "}
                      {(alert.condition.value * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              )}

              {alert.type === "whale" && alert.whale && (
                <div className="text-sm">
                  <span className="font-medium">
                    {alert.whale.nickname ??
                      `${alert.whale.address.slice(0, 6)}...`}
                  </span>
                  <span className="text-muted-foreground"> makes a trade</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Switch
                checked={alert.isActive}
                onCheckedChange={(checked) =>
                  handleToggle(alert._id, checked)
                }
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(alert._id)}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

### Step 7: Create Alert Dialog

Create `apps/web/src/components/alerts/create-alert-dialog.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceAlertForm } from "./price-alert-form";
import { WhaleAlertForm } from "./whale-alert-form";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function CreateAlertDialog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"price" | "whale">("price");

  const createAlert = useMutation(api.alerts.create);

  const handleCreatePriceAlert = async (data: {
    marketId: string;
    operator: string;
    value: number;
  }) => {
    try {
      await createAlert({
        type: "price",
        marketId: data.marketId as any,
        condition: {
          operator: data.operator as any,
          value: data.value,
        },
      });
      toast.success("Price alert created");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create alert"
      );
    }
  };

  const handleCreateWhaleAlert = async (data: { whaleId: string }) => {
    try {
      await createAlert({
        type: "whale",
        whaleId: data.whaleId as any,
      });
      toast.success("Whale alert created");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create alert"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Alert
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Alert</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="price" className="flex-1">
              Price Alert
            </TabsTrigger>
            <TabsTrigger value="whale" className="flex-1">
              Whale Alert
            </TabsTrigger>
          </TabsList>

          <TabsContent value="price" className="mt-4">
            <PriceAlertForm onSubmit={handleCreatePriceAlert} />
          </TabsContent>

          <TabsContent value="whale" className="mt-4">
            <WhaleAlertForm onSubmit={handleCreateWhaleAlert} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

### Step 8: Create Price Alert Form

Create `apps/web/src/components/alerts/price-alert-form.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
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

interface PriceAlertFormProps {
  onSubmit: (data: {
    marketId: string;
    operator: string;
    value: number;
  }) => Promise<void>;
}

export function PriceAlertForm({ onSubmit }: PriceAlertFormProps) {
  const [search, setSearch] = useState("");
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [operator, setOperator] = useState<string>("lt");
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const markets = useQuery(api.markets.list, {
    search: search || undefined,
    paginationOpts: { numItems: 10, cursor: null },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMarket || !value) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        marketId: selectedMarket,
        operator,
        value: Number(value) / 100, // Convert percentage to decimal
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMarketData = markets?.page.find(
    (m) => m._id === selectedMarket
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Market Search */}
      <div className="space-y-2">
        <Label>Market</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {search && markets?.page && (
          <div className="border rounded-md max-h-40 overflow-y-auto">
            {markets.page.map((market) => (
              <div
                key={market._id}
                className={`p-2 cursor-pointer hover:bg-muted ${
                  selectedMarket === market._id ? "bg-muted" : ""
                }`}
                onClick={() => {
                  setSelectedMarket(market._id);
                  setSearch("");
                }}
              >
                <div className="text-sm font-medium truncate">
                  {market.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(market.yesPrice * 100).toFixed(0)}% YES
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedMarketData && (
          <div className="p-2 bg-muted rounded-md">
            <div className="text-sm font-medium truncate">
              {selectedMarketData.title}
            </div>
            <div className="text-xs text-muted-foreground">
              Current: {(selectedMarketData.yesPrice * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </div>

      {/* Condition */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Condition</Label>
          <Select value={operator} onValueChange={setOperator}>
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
            placeholder="50"
            min="1"
            max="99"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!selectedMarket || !value || isSubmitting}
      >
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Create Alert
      </Button>
    </form>
  );
}
```

### Step 9: Create Whale Alert Form

Create `apps/web/src/components/alerts/whale-alert-form.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Loader2 } from "lucide-react";

interface WhaleAlertFormProps {
  onSubmit: (data: { whaleId: string }) => Promise<void>;
}

export function WhaleAlertForm({ onSubmit }: WhaleAlertFormProps) {
  const [selectedWhale, setSelectedWhale] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const followedWhales = useQuery(api.whales.getFollowedWhales);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWhale) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ whaleId: selectedWhale });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Select a whale you follow</Label>

        {followedWhales?.length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground text-sm">
            You're not following any whales yet. Follow whales from the
            leaderboard to create alerts.
          </Card>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {followedWhales?.map((whale) => {
              const name =
                whale.nickname ??
                `${whale.address.slice(0, 6)}...${whale.address.slice(-4)}`;

              return (
                <Card
                  key={whale._id}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedWhale === whale._id
                      ? "border-primary bg-muted"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedWhale(whale._id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={whale.avatar ?? undefined} />
                      <AvatarFallback>
                        {name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm">{name}</span>
                        {whale.isVerified && (
                          <CheckCircle className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(whale.winRate * 100).toFixed(0)}% win rate
                      </div>
                    </div>
                    {selectedWhale === whale._id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!selectedWhale || isSubmitting}
      >
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Create Alert
      </Button>
    </form>
  );
}
```

### Step 10: Update Inngest Functions Registry

Update `apps/web/src/lib/inngest/functions/index.ts`:

```typescript
import { syncMarkets } from "./sync-markets";
import { syncWhaleTrades } from "./sync-whale-trades";
import { computeWhaleStats } from "./compute-whale-stats";
import { cleanupOldActivity } from "./cleanup-old-activity";
import { checkPriceAlerts, checkWhaleAlerts } from "./check-alerts";
import { sendAlertNotification } from "./send-notification";

export const functions = [
  syncMarkets,
  syncWhaleTrades,
  computeWhaleStats,
  cleanupOldActivity,
  checkPriceAlerts,
  checkWhaleAlerts,
  sendAlertNotification,
];
```

## Todo List

### Implementation (Complete)
- [x] Create `packages/backend/convex/alerts.ts` (used Convex instead of Inngest)
- [x] Create `packages/backend/convex/notifications.ts`
- [x] Create `packages/backend/convex/alertChecking.ts` (Convex mutations instead of Inngest)
- [x] Create `packages/backend/convex/crons.ts` (price alert cron job)
- [x] Create `apps/web/src/app/alerts/page.tsx`
- [x] Create `apps/web/src/components/alerts/alert-list.tsx`
- [x] Create `apps/web/src/components/alerts/create-alert-dialog.tsx`
- [x] Create `apps/web/src/components/alerts/price-alert-form.tsx`
- [x] Create `apps/web/src/components/alerts/whale-alert-form.tsx`
- [x] Install shadcn/ui Dialog, Select components

### Architecture Deviation
- [x] ✅ Inngest integration NOT implemented (used Convex mutations/crons instead - JUSTIFIED)
- [x] ✅ Email delivery implemented via Resend + Convex actions

### Critical Fixes Required (from code review) - ALL COMPLETE ✅
- [x] ✅ Fix DialogTrigger invalid `render` prop
- [x] ✅ Replace repeated auth code with `requireAuth()` helper
- [x] ✅ Add input validation for alert condition values (0-1 range)
- [x] ✅ Fix whale-alert-form filter logic (removed useless null check)
- [x] ✅ Implement email delivery (Resend + Convex actions)

### High Priority Fixes - ALL COMPLETE ✅
- [x] ✅ Optimize N+1 queries in alert enrichment (batch fetching)
- [x] ✅ Implement tier-based cooldowns (Free: 1h, Pro: 30min, Pro+: 15min)
- [x] ✅ Add transaction safety to alert checking (Convex mutations)
- [x] ✅ Add error boundaries to frontend (error.tsx)

### Testing
- [x] ✅ Test price alert creation (manual testing done)
- [x] ✅ Test whale alert creation (manual testing done)
- [x] ✅ Test alert triggering (verified working)
- [x] ✅ Test email delivery (Resend integration verified)
- [ ] 🟡 Write integration tests (recommended before next phase)
- [ ] 🟡 Write E2E tests (recommended before next phase)

## Success Criteria

### Completed ✅ ALL SUCCESS CRITERIA MET
- [x] Users can create price alerts
- [x] Users can create whale alerts
- [x] Alert limits enforced by tier (Free: 3, Pro: 50, Pro+: unlimited)
- [x] Tier-based cooldown prevents spam (Free: 1h, Pro: 30min, Pro+: 15min)
- [x] Notification log records deliveries (status tracking complete)
- [x] Alerts trigger correctly (price alerts via cron, whale alerts on activity)
- [x] Emails sent via Resend (HTML templates, batch sending, error handling)

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Email deliverability | High | Medium | Use verified domain, monitor bounces |
| Alert spam | Medium | Medium | 1-hour cooldown per alert |
| Slow alert checking | Medium | Low | Limit concurrent checks |

## Security Considerations

- User can only access own alerts
- Rate limit per user prevents abuse
- Email content sanitized
- No PII in notification logs

## Next Steps

### Immediate (Before Production)
1. **Fix critical issues** from code review (DialogTrigger, auth helper, validation, filter logic)
2. **Implement email delivery** via Inngest + Resend OR Convex Actions + Resend
3. **Add integration tests** for alert triggering flow
4. **End-to-end testing** of complete alert workflow

### Short-term
1. Optimize N+1 queries and add caching
2. Add error boundaries and retry logic
3. Make cooldown tier-configurable
4. Add monitoring/metrics for alert delivery rates

### Long-term
1. Proceed to [Phase 09: Subscription Payments](./phase-09-subscription-payments.md)
2. Add Telegram/Discord channels (future)
3. Add push notifications (future)
4. Implement real-time WebSocket alerts for Pro+ users

---

## Review Summary

**Initial Score:** 7.5/10 (with critical issues)
**Final Score:** 9.0/10 ✅ **PRODUCTION READY**

**Strengths:**
- All critical issues resolved
- Email delivery working (Resend + Convex actions)
- Optimized database queries (batch fetching)
- Tier-based cooldowns implemented
- Error boundaries added
- Type-safe, secure, well-documented

**Weaknesses:**
- No automated tests (manual testing only)
- Missing monitoring/metrics dashboard

**Recommendation:** ✅ **Deploy to production** after manual E2E verification

See full review: [Code Review Report - Post-Fix](../../plans/reports/code-reviewer-260119-1207-phase08-alert-system-review.md)
