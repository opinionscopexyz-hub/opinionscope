# Phase 09: Subscription Payments

## Context Links
- [Plan Overview](./plan.md)
- [PRD Section 7](../../OpinionScope_PRD.md#7-subscription-model)
- [Polar Payments Research](../reports/researcher-260116-1247-polar-payments.md)
- [Phase 03: Auth Integration](./phase-03-auth-integration.md)

## Overview
- **Priority:** P0
- **Status:** Complete (2026-01-19 13:23)
- **Effort:** 8h
- **Description:** Integrate Polar for subscription management with Free, Pro ($29/mo), and Pro+ ($79/mo) tiers.

## Key Insights

From Polar research:
- 4% + $0.40 per transaction
- Webhook events for subscription lifecycle
- Customer portal for self-service
- Sandbox available for testing

From PRD:
- Pro: $29/mo or $290/year
- Pro+: $79/mo or $790/year
- 7-day trial for Pro+ (requires card)

## Requirements

### Functional
- FR-PAY-1: Display pricing page with tier comparison
- FR-PAY-2: Redirect to Polar checkout
- FR-PAY-3: Handle subscription webhooks
- FR-PAY-4: Update user tier on subscription change
- FR-PAY-5: Provide customer portal access
- FR-PAY-6: Handle cancellations

### Non-Functional
- NFR-PAY-1: Webhook processing < 5 seconds
- NFR-PAY-2: Tier update reflected immediately

## Architecture

```
Subscription Flow:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  User clicks "Upgrade"                                      │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Pricing Page                                        │   │
│  │ - Compare Free / Pro / Pro+                        │   │
│  │ - Toggle monthly / annual                          │   │
│  │ - Click "Subscribe"                                │   │
│  └─────────────────────────────────────────────────────┘   │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Polar Checkout                                      │   │
│  │ - Pre-filled email from Clerk                      │   │
│  │ - Stripe-powered card entry                        │   │
│  └─────────────────────────────────────────────────────┘   │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Polar Webhook → Inngest → Convex                   │   │
│  │ - subscription.created                             │   │
│  │ - Update user tier                                 │   │
│  │ - Send welcome email                               │   │
│  └─────────────────────────────────────────────────────┘   │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Redirect to App                                     │   │
│  │ - Success toast                                    │   │
│  │ - Features unlocked                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files

### Create
- `apps/web/src/app/pricing/page.tsx` - Pricing page
- `apps/web/src/app/billing/page.tsx` - Billing management
- `apps/web/src/app/api/webhooks/polar/route.ts` - Polar webhook
- `apps/web/src/components/pricing/pricing-cards.tsx`
- `apps/web/src/components/pricing/feature-comparison.tsx`
- `apps/web/src/components/billing/subscription-card.tsx`
- `apps/web/src/lib/polar/client.ts` - Polar API client
- `apps/web/src/lib/inngest/functions/handle-subscription.ts`

### Modify
- `packages/backend/convex/users.ts` - Add tier update mutations

## Implementation Steps

### Step 1: Create Polar Client

Create `apps/web/src/lib/polar/client.ts`:

```typescript
import { Polar } from "@polar-sh/sdk";

export const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
});

// Product IDs (set these after creating products in Polar dashboard)
export const POLAR_PRODUCTS = {
  pro_monthly: process.env.POLAR_PRO_MONTHLY_ID!,
  pro_annual: process.env.POLAR_PRO_ANNUAL_ID!,
  pro_plus_monthly: process.env.POLAR_PRO_PLUS_MONTHLY_ID!,
  pro_plus_annual: process.env.POLAR_PRO_PLUS_ANNUAL_ID!,
} as const;

export function getCheckoutUrl(
  productId: string,
  customerEmail: string,
  successUrl: string
): string {
  const params = new URLSearchParams({
    product_id: productId,
    customer_email: customerEmail,
    success_url: successUrl,
  });

  return `https://checkout.polar.sh?${params.toString()}`;
}

export function getCustomerPortalUrl(customerId: string): string {
  return `https://polar.sh/dashboard/${customerId}`;
}
```

### Step 2: Create Pricing Page

Create `apps/web/src/app/pricing/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { FeatureComparison } from "@/components/pricing/feature-comparison";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { user } = useUser();
  const { tier } = useCurrentUser();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get real-time whale tracking, advanced filters, and priority alerts.
          Upgrade anytime.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Label
          htmlFor="billing-toggle"
          className={!isAnnual ? "font-bold" : "text-muted-foreground"}
        >
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={isAnnual}
          onCheckedChange={setIsAnnual}
        />
        <div className="flex items-center gap-2">
          <Label
            htmlFor="billing-toggle"
            className={isAnnual ? "font-bold" : "text-muted-foreground"}
          >
            Annual
          </Label>
          <Badge variant="secondary" className="text-xs">
            2 months free
          </Badge>
        </div>
      </div>

      {/* Pricing Cards */}
      <PricingCards
        isAnnual={isAnnual}
        currentTier={tier}
        userEmail={user?.primaryEmailAddress?.emailAddress}
      />

      {/* Feature Comparison */}
      <FeatureComparison />
    </div>
  );
}
```

### Step 3: Create Pricing Cards Component

Create `apps/web/src/components/pricing/pricing-cards.tsx`:

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Check, Star } from "lucide-react";
import { POLAR_PRODUCTS, getCheckoutUrl } from "@/lib/polar/client";
import { cn } from "@/lib/utils";

interface PricingCardsProps {
  isAnnual: boolean;
  currentTier: "free" | "pro" | "pro_plus";
  userEmail?: string;
}

const PLANS = [
  {
    name: "Free",
    tier: "free" as const,
    description: "Get started with basic features",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "Basic market screener",
      "Top 10 whale leaderboard",
      "15-minute delayed feed",
      "3 alerts",
      "Email notifications",
    ],
    limitations: [
      "No custom filters",
      "Limited trade history",
      "No real-time data",
    ],
  },
  {
    name: "Pro",
    tier: "pro" as const,
    description: "For serious traders",
    monthlyPrice: 29,
    annualPrice: 290,
    productMonthly: POLAR_PRODUCTS.pro_monthly,
    productAnnual: POLAR_PRODUCTS.pro_annual,
    popular: true,
    features: [
      "Custom filter expressions",
      "Top 50 whale leaderboard",
      "Real-time activity feed",
      "50 alerts",
      "All notification channels",
      "CSV export (100/day)",
      "Follow 20 whales",
    ],
    limitations: [],
  },
  {
    name: "Pro+",
    tier: "pro_plus" as const,
    description: "Maximum alpha",
    monthlyPrice: 79,
    annualPrice: 790,
    productMonthly: POLAR_PRODUCTS.pro_plus_monthly,
    productAnnual: POLAR_PRODUCTS.pro_plus_annual,
    features: [
      "Everything in Pro",
      "Full whale leaderboard",
      "30-second early access",
      "Unlimited alerts",
      "Unlimited CSV exports",
      "Unlimited follows",
      "Performance charts",
      "Priority support",
    ],
    limitations: [],
    trial: "7-day free trial",
  },
];

export function PricingCards({
  isAnnual,
  currentTier,
  userEmail,
}: PricingCardsProps) {
  const handleSubscribe = (plan: (typeof PLANS)[number]) => {
    if (plan.tier === "free") return;

    const productId = isAnnual ? plan.productAnnual : plan.productMonthly;
    if (!productId) return;

    const successUrl = `${window.location.origin}/billing?success=true`;
    const checkoutUrl = getCheckoutUrl(
      productId,
      userEmail ?? "",
      successUrl
    );

    window.location.href = checkoutUrl;
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {PLANS.map((plan) => {
        const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
        const period = isAnnual ? "/year" : "/mo";
        const isCurrentPlan = currentTier === plan.tier;
        const canUpgrade =
          (currentTier === "free" && plan.tier !== "free") ||
          (currentTier === "pro" && plan.tier === "pro_plus");

        return (
          <Card
            key={plan.name}
            className={cn(
              "relative",
              plan.popular && "border-primary shadow-lg"
            )}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Most Popular
                </div>
              </div>
            )}

            <CardHeader className="pt-8">
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground">
                {plan.description}
              </p>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  ${price === 0 ? "0" : price}
                </span>
                {price > 0 && (
                  <span className="text-muted-foreground">{period}</span>
                )}
                {isAnnual && plan.monthlyPrice > 0 && (
                  <div className="text-sm text-muted-foreground">
                    ${(plan.annualPrice / 12).toFixed(2)}/mo effective
                  </div>
                )}
              </div>
              {plan.trial && (
                <div className="text-sm text-green-600 font-medium mt-2">
                  {plan.trial}
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.limitations.length > 0 && (
                <ul className="space-y-2 pt-2 border-t">
                  {plan.limitations.map((limitation) => (
                    <li
                      key={limitation}
                      className="flex items-start gap-2 text-muted-foreground"
                    >
                      <span className="text-sm">- {limitation}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                disabled={isCurrentPlan || (!canUpgrade && plan.tier !== "free")}
                onClick={() => handleSubscribe(plan)}
              >
                {isCurrentPlan
                  ? "Current Plan"
                  : plan.tier === "free"
                    ? "Get Started"
                    : canUpgrade
                      ? `Upgrade to ${plan.name}`
                      : "Contact Sales"}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
```

### Step 4: Create Feature Comparison

Create `apps/web/src/components/pricing/feature-comparison.tsx`:

```typescript
"use client";

import { Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FEATURES = [
  {
    category: "Market Screener",
    features: [
      { name: "Basic filters", free: true, pro: true, proPlus: true },
      { name: "Custom expressions", free: false, pro: true, proPlus: true },
      { name: "Saved presets", free: "1", pro: "10", proPlus: "Unlimited" },
      { name: "CSV export", free: "10 rows", pro: "100/day", proPlus: "Unlimited" },
    ],
  },
  {
    category: "Whale Tracker",
    features: [
      { name: "Leaderboard access", free: "Top 10", pro: "Top 50", proPlus: "All" },
      { name: "Recent trades visible", free: "3", pro: "10", proPlus: "50" },
      { name: "Follow whales", free: "3", pro: "20", proPlus: "Unlimited" },
      { name: "Performance charts", free: false, pro: false, proPlus: true },
    ],
  },
  {
    category: "Activity Feed",
    features: [
      { name: "Feed access", free: true, pro: true, proPlus: true },
      { name: "Feed delay", free: "15 min", pro: "Real-time", proPlus: "Real-time" },
      { name: "Early access", free: false, pro: false, proPlus: "+30 seconds" },
      { name: "Filter by amount", free: false, pro: true, proPlus: true },
    ],
  },
  {
    category: "Alerts",
    features: [
      { name: "Total alerts", free: "3", pro: "50", proPlus: "Unlimited" },
      { name: "Email notifications", free: true, pro: true, proPlus: true },
      { name: "Push notifications", free: false, pro: true, proPlus: true },
      { name: "Telegram/Discord", free: false, pro: true, proPlus: true },
    ],
  },
];

export function FeatureComparison() {
  const renderValue = (value: boolean | string) => {
    if (value === true) {
      return <Check className="h-4 w-4 text-green-600 mx-auto" />;
    }
    if (value === false) {
      return <X className="h-4 w-4 text-muted-foreground mx-auto" />;
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-center mb-8">
        Feature Comparison
      </h2>

      <div className="max-w-4xl mx-auto overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Feature</TableHead>
              <TableHead className="text-center">Free</TableHead>
              <TableHead className="text-center">Pro</TableHead>
              <TableHead className="text-center">Pro+</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FEATURES.map((category) => (
              <>
                <TableRow key={category.category}>
                  <TableCell
                    colSpan={4}
                    className="bg-muted font-medium"
                  >
                    {category.category}
                  </TableCell>
                </TableRow>
                {category.features.map((feature) => (
                  <TableRow key={feature.name}>
                    <TableCell>{feature.name}</TableCell>
                    <TableCell className="text-center">
                      {renderValue(feature.free)}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderValue(feature.pro)}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderValue(feature.proPlus)}
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

### Step 5: Create Polar Webhook Handler

Create `apps/web/src/app/api/webhooks/polar/route.ts`:

```typescript
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();

  // Verify webhook signature
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET!;
  const signature = headersList.get("polar-signature");

  // TODO: Implement signature verification
  // For now, proceed with event handling

  const event = JSON.parse(body);

  // Forward to Inngest for processing
  await inngest.send({
    name: "polar/webhook",
    data: event,
  });

  return NextResponse.json({ received: true });
}
```

### Step 6: Create Subscription Handler

Create `apps/web/src/lib/inngest/functions/handle-subscription.ts`:

```typescript
import { inngest } from "../client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { Resend } from "resend";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const resend = new Resend(process.env.RESEND_API_KEY);

// Map Polar product IDs to tiers
const PRODUCT_TO_TIER: Record<string, "pro" | "pro_plus"> = {
  [process.env.POLAR_PRO_MONTHLY_ID!]: "pro",
  [process.env.POLAR_PRO_ANNUAL_ID!]: "pro",
  [process.env.POLAR_PRO_PLUS_MONTHLY_ID!]: "pro_plus",
  [process.env.POLAR_PRO_PLUS_ANNUAL_ID!]: "pro_plus",
};

export const handlePolarWebhook = inngest.createFunction(
  { id: "handle-polar-webhook" },
  { event: "polar/webhook" },
  async ({ event, step }) => {
    const { type, data } = event.data;

    switch (type) {
      case "subscription.created":
      case "subscription.updated":
        await handleSubscriptionActive(step, data);
        break;

      case "subscription.canceled":
        await handleSubscriptionCanceled(step, data);
        break;

      case "subscription.revoked":
        await handleSubscriptionRevoked(step, data);
        break;

      default:
        return { handled: false, type };
    }

    return { handled: true, type };
  }
);

async function handleSubscriptionActive(step: any, data: any) {
  const { customer_email, product_id, id: subscriptionId, customer_id } = data;

  const tier = PRODUCT_TO_TIER[product_id] ?? "pro";

  // Find user by email
  const user = await step.run("find-user", async () => {
    return await convex.query(api.users.getByEmail, { email: customer_email });
  });

  if (!user) {
    throw new Error(`User not found for email: ${customer_email}`);
  }

  // Update user tier
  await step.run("update-tier", async () => {
    await convex.mutation(api.users.updateTier, {
      userId: user._id,
      tier,
      polarCustomerId: customer_id,
      polarSubscriptionId: subscriptionId,
    });
  });

  // Send welcome email
  await step.run("send-welcome-email", async () => {
    await resend.emails.send({
      from: "OpinionScope <hello@opinionscope.io>",
      to: customer_email,
      subject: `Welcome to OpinionScope ${tier === "pro_plus" ? "Pro+" : "Pro"}!`,
      text: `
        Welcome to OpinionScope ${tier === "pro_plus" ? "Pro+" : "Pro"}!

        Your subscription is now active. Here's what you can do:

        ${tier === "pro_plus" ? `
        - Real-time whale alerts with 30-second early access
        - Unlimited alerts and follows
        - Performance charts
        - Priority support
        ` : `
        - Real-time whale activity feed
        - 50 alerts across all channels
        - Custom filter expressions
        - Follow up to 20 whales
        `}

        Start exploring: https://opinionscope.io/screener

        Questions? Reply to this email.

        - The OpinionScope Team
      `,
    });
  });
}

async function handleSubscriptionCanceled(step: any, data: any) {
  const { customer_email, current_period_end } = data;

  const user = await step.run("find-user", async () => {
    return await convex.query(api.users.getByEmail, { email: customer_email });
  });

  if (!user) return;

  // Set tier expiration (keep features until period ends)
  await step.run("set-expiration", async () => {
    await convex.mutation(api.users.updateTier, {
      userId: user._id,
      tier: user.tier, // Keep current tier
      tierExpiresAt: new Date(current_period_end).getTime(),
    });
  });

  // Send cancellation email
  await step.run("send-cancellation-email", async () => {
    await resend.emails.send({
      from: "OpinionScope <hello@opinionscope.io>",
      to: customer_email,
      subject: "Your subscription has been canceled",
      text: `
        We're sorry to see you go.

        Your subscription has been canceled but you'll retain access to your current features until ${new Date(current_period_end).toLocaleDateString()}.

        After that, your account will revert to the free tier.

        Changed your mind? You can resubscribe anytime: https://opinionscope.io/pricing

        Feedback? We'd love to hear what we could improve: reply to this email.

        - The OpinionScope Team
      `,
    });
  });
}

async function handleSubscriptionRevoked(step: any, data: any) {
  const { customer_email } = data;

  const user = await step.run("find-user", async () => {
    return await convex.query(api.users.getByEmail, { email: customer_email });
  });

  if (!user) return;

  // Immediately downgrade to free
  await step.run("downgrade-to-free", async () => {
    await convex.mutation(api.users.updateTier, {
      userId: user._id,
      tier: "free",
      tierExpiresAt: undefined,
      polarSubscriptionId: undefined,
    });
  });
}
```

### Step 7: Create Billing Page

Create `apps/web/src/app/billing/page.tsx`:

```typescript
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SubscriptionCard } from "@/components/billing/subscription-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { user, tier } = useCurrentUser();

  // Show success message if coming from checkout
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Subscription activated! Welcome to OpinionScope Pro.");
    }
  }, [searchParams]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Please sign in to manage your subscription.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      <SubscriptionCard user={user} tier={tier} />

      {user.polarCustomerId && (
        <Card className="p-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Manage Subscription</h3>
              <p className="text-sm text-muted-foreground">
                Update payment method, view invoices, or cancel
              </p>
            </div>
            <Button variant="outline" asChild>
              <a
                href={`https://polar.sh/dashboard/${user.polarCustomerId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Customer Portal
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </Card>
      )}

      {tier === "free" && (
        <Card className="p-6 mt-4 bg-muted/50">
          <div className="text-center">
            <h3 className="font-medium mb-2">Upgrade Your Plan</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get real-time alerts, unlimited follows, and more.
            </p>
            <Button asChild>
              <Link href="/pricing">View Plans</Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
```

### Step 8: Create Subscription Card

Create `apps/web/src/components/billing/subscription-card.tsx`:

```typescript
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Crown } from "lucide-react";
import type { Doc } from "@opinion-scope/backend/convex/_generated/dataModel";

interface SubscriptionCardProps {
  user: Doc<"users">;
  tier: "free" | "pro" | "pro_plus";
}

const TIER_INFO = {
  free: {
    name: "Free",
    description: "Basic features",
    icon: null,
    color: "text-muted-foreground",
  },
  pro: {
    name: "Pro",
    description: "$29/month",
    icon: CheckCircle,
    color: "text-blue-600",
  },
  pro_plus: {
    name: "Pro+",
    description: "$79/month",
    icon: Crown,
    color: "text-yellow-600",
  },
};

export function SubscriptionCard({ user, tier }: SubscriptionCardProps) {
  const info = TIER_INFO[tier];
  const Icon = info.icon;

  const isExpiring = user.tierExpiresAt && user.tierExpiresAt > Date.now();
  const expiryDate = user.tierExpiresAt
    ? new Date(user.tierExpiresAt).toLocaleDateString()
    : null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className={`h-6 w-6 ${info.color}`} />}
          <div>
            <h2 className="text-xl font-bold">{info.name}</h2>
            <p className="text-sm text-muted-foreground">{info.description}</p>
          </div>
        </div>
        <Badge variant={tier === "free" ? "secondary" : "default"}>
          {tier === "free" ? "Free Plan" : "Active"}
        </Badge>
      </div>

      {isExpiring && (
        <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-md">
          <Clock className="h-4 w-4" />
          <span>
            Your subscription will end on {expiryDate}. After that, you'll
            revert to the free plan.
          </span>
        </div>
      )}

      {tier !== "free" && !isExpiring && (
        <div className="text-sm text-muted-foreground">
          Your subscription renews automatically. Manage it in the customer
          portal below.
        </div>
      )}
    </Card>
  );
}
```

### Step 9: Update Inngest Functions Registry

Update `apps/web/src/lib/inngest/functions/index.ts`:

```typescript
import { syncMarkets } from "./sync-markets";
import { syncWhaleTrades } from "./sync-whale-trades";
import { computeWhaleStats } from "./compute-whale-stats";
import { cleanupOldActivity } from "./cleanup-old-activity";
import { checkPriceAlerts, checkWhaleAlerts } from "./check-alerts";
import { sendAlertNotification } from "./send-notification";
import { handlePolarWebhook } from "./handle-subscription";

export const functions = [
  syncMarkets,
  syncWhaleTrades,
  computeWhaleStats,
  cleanupOldActivity,
  checkPriceAlerts,
  checkWhaleAlerts,
  sendAlertNotification,
  handlePolarWebhook,
];
```

### Step 10: Add Environment Variables

Add to `.env`:
```env
# Polar
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_ORGANIZATION_ID=
POLAR_PRO_MONTHLY_ID=
POLAR_PRO_ANNUAL_ID=
POLAR_PRO_PLUS_MONTHLY_ID=
POLAR_PRO_PLUS_ANNUAL_ID=

# Resend
RESEND_API_KEY=
```

## Todo List

- [ ] Create Polar organization and products
- [ ] Create `apps/web/src/lib/polar/client.ts`
- [ ] Create `apps/web/src/app/pricing/page.tsx`
- [ ] Create `apps/web/src/components/pricing/pricing-cards.tsx`
- [ ] Create `apps/web/src/components/pricing/feature-comparison.tsx`
- [ ] Create `apps/web/src/app/api/webhooks/polar/route.ts`
- [ ] Create `apps/web/src/lib/inngest/functions/handle-subscription.ts`
- [ ] Create `apps/web/src/app/billing/page.tsx`
- [ ] Create `apps/web/src/components/billing/subscription-card.tsx`
- [ ] Update Inngest functions registry
- [ ] Configure Polar webhook in dashboard
- [ ] Test checkout flow (sandbox)
- [ ] Test subscription.created webhook
- [ ] Test cancellation flow
- [ ] Test tier expiration

## Success Criteria

- [ ] Pricing page displays correctly
- [ ] Checkout redirects to Polar
- [ ] Webhook updates user tier
- [ ] Welcome email sent on subscription
- [ ] Customer portal accessible
- [ ] Cancellation handled correctly
- [ ] Tier expiration works

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Webhook failure | High | Low | Retry logic, alert on failure |
| Payment fraud | High | Low | Polar handles via Stripe |
| Tier sync delay | Medium | Low | Queue-based processing |

## Security Considerations

- Verify Polar webhook signatures
- Store Polar IDs in database, not client
- Customer portal uses Polar auth
- No card data touches our servers

## Next Steps

After completing this phase:
1. Proceed to [Phase 10: Landing Page](./phase-10-landing-page.md)
2. Set up Polar production environment
3. Configure custom domain for emails
