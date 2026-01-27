"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Play, TrendingUp, Activity, Eye } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SignUpButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Image from "next/image";

export function HeroSection() {
  const { isSignedIn } = useUser();
  const [price, setPrice] = useState(0.6542);
  const [volume, setVolume] = useState(2847);

  // Simulate live price ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setPrice((prev) => prev + (Math.random() - 0.5) * 0.001);
      setVolume((prev) => prev + Math.floor(Math.random() * 10));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-background via-background to-background/95">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.30_0.02_160)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.30_0.02_160)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="OpinionScope" width={100} height={100} className="mx-auto" />

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              The{" "}
              <span className="bg-linear-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent" style={{ textShadow: '0 0 15px rgba(16, 185, 129, 0.15)' }}>
                Whales Tracking
              </span>{" "}
              for Prediction Markets
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Track whale trades in real-time, screen thousands of markets, and
              get alerts before prices move. Professional-grade analytics at
              accessible prices.
            </p>
          </div>

          {/* Mock Dashboard Preview */}
          <div className="grid md:grid-cols-3 gap-4 mb-10 max-w-4xl mx-auto">
            {/* Live Price Ticker */}
            <Card className="p-4 bg-card/50 border-primary/20 backdrop-blur-sm hover:border-primary/40 transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Live Price</span>
                </div>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="font-mono text-2xl font-bold text-foreground mb-1">
                {price.toFixed(4)}
              </div>
              <div className="text-xs text-primary font-mono">+2.34% (24h)</div>
            </Card>

            {/* Whale Trade Feed */}
            <Card className="p-4 bg-card/50 border-primary/20 backdrop-blur-sm hover:border-primary/40 transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Whale Activity</span>
                <Eye className="h-4 w-4 text-primary" />
              </div>
              <div className="font-mono text-2xl font-bold text-foreground mb-1">
                247
              </div>
              <div className="text-xs text-muted-foreground font-mono">Trades (Last hour)</div>
            </Card>

            {/* Market Stats */}
            <Card className="p-4 bg-card/50 border-primary/20 backdrop-blur-sm hover:border-primary/40 transition-all duration-200 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Volume (24h)</span>
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div className="font-mono text-2xl font-bold text-foreground mb-1">
                ${volume.toLocaleString()}K
              </div>
              <div className="text-xs text-muted-foreground font-mono">Across 1,284 markets</div>
            </Card>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isSignedIn ? (
              <Link
                href="/whales"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                )}
              >
                Go to Whales
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <Button
                  size="lg"
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </SignUpButton>
            )}
            <Link
              href="/whales"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
              )}
            >
              <Play className="h-4 w-4" />
              View Demo
            </Link>
          </div>

          {/* Social Proof - Monospace Numbers */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary font-mono">1,000+</span>
              <span className="text-sm">Active Traders</span>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary font-mono">$50M+</span>
              <span className="text-sm">Markets Tracked</span>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary font-mono">500+</span>
              <span className="text-sm">Whales Monitored</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
