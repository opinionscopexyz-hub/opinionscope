"use client";

import NextLink from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignUpButton, useUser } from "@clerk/nextjs";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    description: "Get started with basics",
    icon: null,
    features: [
      { text: "Basic market screener", included: true },
      { text: "Top 10 whale leaderboard", included: true },
      { text: "3 alerts", included: true },
      { text: "15-minute feed delay", included: true },
    ],
    cta: "Get Started",
    href: null,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For serious traders",
    icon: Zap,
    features: [
      { text: "Custom filter expressions", included: true },
      { text: "Top 50 whale leaderboard", included: true },
      { text: "50 alerts, all channels", included: true },
      { text: "Real-time feed", included: true },
    ],
    cta: "Start Free Trial",
    href: "/pricing",
    popular: true,
  },
  {
    name: "Pro+",
    price: "$79",
    period: "/mo",
    description: "Maximum alpha",
    icon: Crown,
    features: [
      { text: "Everything in Pro", included: true },
      { text: "30-second early access", included: true },
      { text: "Unlimited alerts & follows", included: true },
      { text: "Performance charts", included: true },
    ],
    cta: "Start Free Trial",
    href: "/pricing",
  },
];

export function PricingPreview() {
  const { isSignedIn } = useUser();

  return (
    <section className="py-20 bg-muted/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-primary font-mono text-sm mb-2 tracking-wider">
            {" // PRICING"}
          </p>
          <h2 className="text-3xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade when you need more. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "relative border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/30",
                plan.popular &&
                  "border-primary/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
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

              <CardHeader className="pt-8 text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {plan.icon && (
                    <plan.icon className="h-5 w-5 text-primary" />
                  )}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <div className="mt-4 pb-4 border-b border-border/50">
                  <span className="font-mono text-4xl font-bold">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-muted-foreground font-mono text-sm">
                      {plan.period}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.text}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.href === null ? (
                  isSignedIn ? (
                    <NextLink
                      href="/whales"
                      className={cn(
                        buttonVariants({
                          variant: plan.popular ? "default" : "outline",
                        }),
                        "w-full cursor-pointer",
                        plan.popular &&
                          "shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      )}
                    >
                      {plan.cta}
                    </NextLink>
                  ) : (
                    <SignUpButton mode="modal">
                      <Button
                        variant={plan.popular ? "default" : "outline"}
                        className={cn(
                          "w-full cursor-pointer",
                          plan.popular &&
                            "shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        )}
                      >
                        {plan.cta}
                      </Button>
                    </SignUpButton>
                  )
                ) : (
                  <NextLink
                    href={plan.href as "/pricing"}
                    className={cn(
                      buttonVariants({
                        variant: plan.popular ? "default" : "outline",
                      }),
                      "w-full cursor-pointer",
                      plan.popular && "shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    )}
                  >
                    {plan.cta}
                  </NextLink>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <NextLink
            href="/pricing"
            className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
          >
            View full feature comparison →
          </NextLink>
        </div>
      </div>
    </section>
  );
}
