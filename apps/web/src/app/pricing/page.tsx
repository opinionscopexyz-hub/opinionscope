"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { FeatureComparison } from "@/components/pricing/feature-comparison";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { user } = useUser();
  const { tier } = useCurrentUser();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <p className="text-primary font-mono text-sm mb-2 tracking-wider">
          {"// PRICING"}
        </p>
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get real-time whale tracking, advanced filters, and priority alerts.
          Upgrade anytime.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Label
          htmlFor="billing-toggle"
          className={cn(
            "font-mono transition-colors duration-200 cursor-pointer",
            !isAnnual ? "font-bold text-primary" : "text-muted-foreground"
          )}
        >
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={isAnnual}
          onCheckedChange={setIsAnnual}
          className="data-[state=checked]:bg-primary"
        />
        <div className="flex items-center gap-2">
          <Label
            htmlFor="billing-toggle"
            className={cn(
              "font-mono transition-colors duration-200 cursor-pointer",
              isAnnual ? "font-bold text-primary" : "text-muted-foreground"
            )}
          >
            Annual
          </Label>
          <Badge variant="secondary" className="text-xs font-mono bg-primary/10 text-primary border-primary/20">
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
