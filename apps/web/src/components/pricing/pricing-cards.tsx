"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Check, Zap, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
}: PricingCardsProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: (typeof PLANS)[number]) => {
    if (plan.tier === "free") return;

    setLoadingPlan(plan.tier);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.tier, isAnnual }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout");
      }

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
      setLoadingPlan(null);
    }
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
        const isLoading = loadingPlan === plan.tier;

        return (
          <Card
            key={plan.name}
            className={cn(
              "relative border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/30",
              plan.popular && "border-primary/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
            )}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="bg-primary text-primary-foreground text-xs font-mono font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Zap className="h-3 w-3" />
                  RECOMMENDED
                </div>
              </div>
            )}

            <CardHeader className="pt-8">
              <div className="flex items-center gap-2 mb-1">
                {plan.tier === "pro_plus" && <Crown className="h-5 w-5 text-primary" />}
                {plan.tier === "pro" && <Zap className="h-5 w-5 text-primary" />}
                <h3 className="text-xl font-bold">{plan.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4 pb-4 border-b border-border/50">
                <span className="font-mono text-4xl font-bold">
                  ${price === 0 ? "0" : price}
                </span>
                {price > 0 && (
                  <span className="text-muted-foreground font-mono text-sm">{period}</span>
                )}
                {isAnnual && plan.monthlyPrice > 0 && (
                  <div className="text-sm text-muted-foreground font-mono mt-1">
                    ${(plan.annualPrice / 12).toFixed(2)}/mo effective
                  </div>
                )}
              </div>
              {plan.trial && (
                <div className="text-sm text-primary font-medium font-mono mt-2">
                  {plan.trial}
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.limitations.length > 0 && (
                <ul className="space-y-2 pt-2 border-t border-border/50">
                  {plan.limitations.map((limitation) => (
                    <li
                      key={limitation}
                      className="flex items-start gap-2 text-muted-foreground text-sm"
                    >
                      <span className="text-muted-foreground/50">−</span>
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>

            <CardFooter>
              <Button
                className={cn(
                  "w-full cursor-pointer",
                  plan.popular && "shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                )}
                variant={plan.popular ? "default" : "outline"}
                disabled={isCurrentPlan || (!canUpgrade && plan.tier !== "free") || isLoading}
                onClick={() => handleSubscribe(plan)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : isCurrentPlan ? (
                  "Current Plan"
                ) : plan.tier === "free" ? (
                  "Get Started"
                ) : canUpgrade ? (
                  `Upgrade to ${plan.name}`
                ) : (
                  "Contact Sales"
                )}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
