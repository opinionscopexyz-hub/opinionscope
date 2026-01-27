# Phase 10: Landing Page

## Context Links
- [Plan Overview](./plan.md)
- [PRD User Flows](../../OpinionScope_PRD.md#42-user-flows)
- [PRD Product Vision](../../OpinionScope_PRD.md#11-product-vision)

## Overview
- **Priority:** P1
- **Status:** Complete (2026-01-19)
- **Effort:** 10h
- **Description:** Build marketing landing page with hero section, feature highlights, social proof, pricing preview, and call-to-action.

## Key Insights

From PRD:
- Target: 1,000 signups, 50 paid subscribers at launch
- Value proposition: "Bloomberg Terminal for Prediction Markets"
- Key differentiators: Real-time whale tracking, smart screener, tiered signals

Design considerations:
- Mobile-first responsive design
- Fast load time (< 2s)
- Clear CTAs above fold
- Social proof / testimonials

## Requirements

### Functional
- FR-LAND-1: Hero section with value proposition
- FR-LAND-2: Feature highlights with icons
- FR-LAND-3: How it works section
- FR-LAND-4: Pricing preview
- FR-LAND-5: Social proof / testimonials
- FR-LAND-6: FAQ section
- FR-LAND-7: Footer with links

### Non-Functional
- NFR-LAND-1: Page load < 2 seconds
- NFR-LAND-2: Mobile responsive
- NFR-LAND-3: SEO optimized
- NFR-LAND-4: Accessible (WCAG AA)

## Architecture

```
Landing Page Structure:
┌─────────────────────────────────────────────────────────────┐
│ Header (sticky)                                             │
│ Logo | Screener | Whales | Feed | Pricing | [Sign In]       │
├─────────────────────────────────────────────────────────────┤
│ Hero Section                                                │
│ "Bloomberg Terminal for Prediction Markets"                 │
│ [Get Started Free] [View Demo]                              │
├─────────────────────────────────────────────────────────────┤
│ Social Proof Bar                                            │
│ "Trusted by 1,000+ traders"                                │
├─────────────────────────────────────────────────────────────┤
│ Features Grid                                               │
│ [Screener] [Whale Tracker] [Alerts] [Real-time Feed]       │
├─────────────────────────────────────────────────────────────┤
│ How It Works                                                │
│ 1. Sign up → 2. Set alerts → 3. Follow whales → 4. Profit  │
├─────────────────────────────────────────────────────────────┤
│ Pricing Preview                                             │
│ Free | Pro $29/mo | Pro+ $79/mo                            │
├─────────────────────────────────────────────────────────────┤
│ Testimonials / Social Proof                                 │
│ "Finally a tool that..." - @CryptoTrader                   │
├─────────────────────────────────────────────────────────────┤
│ FAQ                                                         │
├─────────────────────────────────────────────────────────────┤
│ CTA Section                                                 │
│ "Ready to find alpha?" [Get Started Free]                  │
├─────────────────────────────────────────────────────────────┤
│ Footer                                                      │
│ Links | Social | Legal                                      │
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files

### Modify
- `apps/web/src/app/page.tsx` - Replace with landing page

### Create
- `apps/web/src/components/landing/hero-section.tsx`
- `apps/web/src/components/landing/features-grid.tsx`
- `apps/web/src/components/landing/how-it-works.tsx`
- `apps/web/src/components/landing/pricing-preview.tsx`
- `apps/web/src/components/landing/testimonials.tsx`
- `apps/web/src/components/landing/faq.tsx`
- `apps/web/src/components/landing/cta-section.tsx`
- `apps/web/src/components/landing/footer.tsx`

## Implementation Steps

### Step 1: Update Home Page

Replace `apps/web/src/app/page.tsx`:

```typescript
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PricingPreview } from "@/components/landing/pricing-preview";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturesGrid />
      <HowItWorks />
      <PricingPreview />
      <Testimonials />
      <FAQ />
      <CTASection />
      <Footer />
    </main>
  );
}
```

### Step 2: Create Hero Section

Create `apps/web/src/components/landing/hero-section.tsx`:

```typescript
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Zap } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6">
            <Zap className="h-3 w-3 mr-1" />
            Now tracking Opinion.Trade markets
          </Badge>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            The{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Bloomberg Terminal
            </span>{" "}
            for Prediction Markets
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track whale trades in real-time, screen thousands of markets, and
            get alerts before prices move. Professional-grade tools at
            accessible prices.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/screener">
                <Play className="h-4 w-4 mr-2" />
                View Demo
              </Link>
            </Button>
          </div>

          {/* Social Proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">1,000+</span>
              <span className="text-sm">Active Traders</span>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">$50M+</span>
              <span className="text-sm">Markets Tracked</span>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">500+</span>
              <span className="text-sm">Whales Monitored</span>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-500/10 to-transparent rounded-full" />
      </div>
    </section>
  );
}
```

### Step 3: Create Features Grid

Create `apps/web/src/components/landing/features-grid.tsx`:

```typescript
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Search,
  Users,
  Bell,
  Activity,
  Download,
  TrendingUp,
} from "lucide-react";

const FEATURES = [
  {
    icon: Search,
    title: "Smart Market Screener",
    description:
      "Filter thousands of markets by price, volume, category, and custom expressions. Find opportunities in seconds.",
  },
  {
    icon: Users,
    title: "Whale Tracker",
    description:
      "Follow top traders with verified track records. See their positions, win rates, and recent trades.",
  },
  {
    icon: Activity,
    title: "Real-Time Feed",
    description:
      "Watch whale trades as they happen. Pro+ users get 30-second early access before anyone else.",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    description:
      "Get notified when markets hit your targets or whales make moves. Email, push, Telegram, Discord.",
  },
  {
    icon: TrendingUp,
    title: "Performance Analytics",
    description:
      "Track whale performance over time. Identify who to follow based on data, not hype.",
  },
  {
    icon: Download,
    title: "Data Export",
    description:
      "Export market data and trade history to CSV. Build your own analysis and strategies.",
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Everything You Need to Win
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Professional trading tools that were previously only available to
            sophisticated traders. Now accessible to everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-md">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### Step 4: Create How It Works

Create `apps/web/src/components/landing/how-it-works.tsx`:

```typescript
import { Badge } from "@/components/ui/badge";

const STEPS = [
  {
    number: 1,
    title: "Sign Up Free",
    description:
      "Create your account in seconds. No credit card required to start.",
  },
  {
    number: 2,
    title: "Explore Markets",
    description:
      "Use the screener to find markets that match your criteria.",
  },
  {
    number: 3,
    title: "Follow Whales",
    description:
      "Identify top traders and follow their moves in real-time.",
  },
  {
    number: 4,
    title: "Set Alerts",
    description:
      "Get notified when opportunities arise. Never miss a trade.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes. No complex setup required.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((step, index) => (
              <div key={step.number} className="relative text-center">
                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-border" />
                )}

                {/* Step number */}
                <div className="relative z-10 mx-auto w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-4">
                  {step.number}
                </div>

                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

### Step 5: Create Pricing Preview

Create `apps/web/src/components/landing/pricing-preview.tsx`:

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Star } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    description: "Get started with basics",
    features: [
      "Basic market screener",
      "Top 10 whale leaderboard",
      "3 alerts",
      "15-minute feed delay",
    ],
    cta: "Get Started",
    href: "/sign-up",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For serious traders",
    features: [
      "Custom filter expressions",
      "Top 50 whale leaderboard",
      "50 alerts, all channels",
      "Real-time feed",
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
    features: [
      "Everything in Pro",
      "30-second early access",
      "Unlimited alerts & follows",
      "Performance charts",
    ],
    cta: "Start Free Trial",
    href: "/pricing",
  },
];

export function PricingPreview() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade when you need more. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <CardHeader className="pt-8 text-center">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/pricing"
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            View full feature comparison
          </Link>
        </div>
      </div>
    </section>
  );
}
```

### Step 6: Create Testimonials

Create `apps/web/src/components/landing/testimonials.tsx`:

```typescript
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "Finally, a tool that shows me what the smart money is doing. I've caught multiple 10x moves just by following the right whales.",
    author: "Alex T.",
    role: "Full-time Trader",
    avatar: null,
  },
  {
    quote:
      "The screener is incredible. What used to take me hours of research now takes seconds. Worth every penny of the Pro subscription.",
    author: "Sarah M.",
    role: "Crypto Analyst",
    avatar: null,
  },
  {
    quote:
      "The 30-second early access has been a game changer. I'm consistently getting better entries than before.",
    author: "Michael R.",
    role: "Pro+ Member",
    avatar: null,
  },
];

export function Testimonials() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Loved by Traders</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of traders who use OpinionScope to find alpha.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {TESTIMONIALS.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-md">
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-muted-foreground mb-6">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar ?? undefined} />
                    <AvatarFallback>
                      {testimonial.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### Step 7: Create FAQ

Create `apps/web/src/components/landing/faq.tsx`:

```typescript
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    question: "What prediction markets do you track?",
    answer:
      "We currently track Opinion.Trade markets. We're adding support for Polymarket, Kalshi, and others in the coming months.",
  },
  {
    question: "How do you identify whales?",
    answer:
      "We classify traders as whales based on total volume traded (>$100k), win rate (>60% with 20+ trades), or single trade size (>$10k). All metrics are verified on-chain.",
  },
  {
    question: "How real-time is the feed?",
    answer:
      "Pro+ users get trades within seconds of on-chain confirmation, with 30-second early access. Pro users get real-time updates. Free users see a 15-minute delayed feed.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes! You can cancel your subscription at any time from the billing page. You'll retain access to paid features until your billing period ends.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We offer a full refund within 7 days of your first subscription payment, no questions asked. Contact support@opinionscope.io.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. We never store your payment information (handled by Stripe via Polar). Your data is encrypted in transit and at rest. We don't sell your data.",
  },
];

export function FAQ() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Got questions? We've got answers.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
```

### Step 8: Create CTA Section

Create `apps/web/src/components/landing/cta-section.tsx`:

```typescript
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find Your Edge?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of traders using OpinionScope to track whales and
            discover opportunities. Start free today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### Step 9: Create Footer

Create `apps/web/src/components/landing/footer.tsx`:

```typescript
import Link from "next/link";
import { Twitter, Github, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-4">OpinionScope</h3>
            <p className="text-sm text-muted-foreground">
              Professional prediction market intelligence for serious traders.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-medium mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/screener" className="hover:text-foreground">
                  Market Screener
                </Link>
              </li>
              <li>
                <Link href="/whales" className="hover:text-foreground">
                  Whale Tracker
                </Link>
              </li>
              <li>
                <Link href="/feed" className="hover:text-foreground">
                  Activity Feed
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@opinionscope.io"
                  className="hover:text-foreground"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-medium mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} OpinionScope. All rights reserved.
          </p>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a
              href="https://twitter.com/opinionscope"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://discord.gg/opinionscope"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
            <a
              href="https://github.com/opinionscope"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

### Step 10: Add SEO Metadata

Update `apps/web/src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpinionScope - Prediction Market Intelligence",
  description:
    "Track whale trades in real-time, screen thousands of markets, and get alerts before prices move. Professional-grade tools for prediction market traders.",
  keywords: [
    "prediction markets",
    "polymarket",
    "whale tracking",
    "crypto trading",
    "market screener",
  ],
  openGraph: {
    title: "OpinionScope - Bloomberg Terminal for Prediction Markets",
    description:
      "Track whale trades in real-time, screen thousands of markets, and get alerts before prices move.",
    url: "https://opinionscope.io",
    siteName: "OpinionScope",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpinionScope - Prediction Market Intelligence",
    description:
      "Track whale trades in real-time, screen thousands of markets, and get alerts before prices move.",
    images: ["/og-image.png"],
  },
};
```

## Todo List

- [ ] Replace `apps/web/src/app/page.tsx` with landing page
- [ ] Create `apps/web/src/components/landing/hero-section.tsx`
- [ ] Create `apps/web/src/components/landing/features-grid.tsx`
- [ ] Create `apps/web/src/components/landing/how-it-works.tsx`
- [ ] Create `apps/web/src/components/landing/pricing-preview.tsx`
- [ ] Create `apps/web/src/components/landing/testimonials.tsx`
- [ ] Create `apps/web/src/components/landing/faq.tsx`
- [ ] Create `apps/web/src/components/landing/cta-section.tsx`
- [ ] Create `apps/web/src/components/landing/footer.tsx`
- [ ] Install shadcn/ui Accordion component
- [ ] Update metadata in layout.tsx
- [ ] Create OG image (/public/og-image.png)
- [ ] Test mobile responsiveness
- [ ] Test page load speed
- [ ] Create placeholder pages (/about, /privacy, /terms)

## Success Criteria

- [ ] Landing page loads < 2 seconds
- [ ] All sections display correctly
- [ ] Mobile responsive on all breakpoints
- [ ] CTAs link to correct pages
- [ ] SEO metadata renders correctly
- [ ] No layout shifts on load

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Slow image loading | Medium | Medium | Use next/image, optimize assets |
| Poor mobile UX | Medium | Low | Mobile-first design |
| Low conversion | Medium | Medium | A/B test CTAs, headlines |

## Security Considerations

- No sensitive data on landing page
- External links use rel="noopener"
- Contact email doesn't expose full address

## Next Steps

After completing this phase:
1. MVP is complete - prepare for launch
2. Set up analytics (Vercel Analytics, PostHog)
3. Create marketing assets (blog posts, social)
4. Begin user acquisition
