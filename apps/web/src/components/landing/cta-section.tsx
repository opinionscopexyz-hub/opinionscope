"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignUpButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export function CTASection() {
  const { isSignedIn } = useUser();

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(16,185,129,0.15) 0%, transparent 50%)`,
          }}
        />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Terminal-style header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-sm text-primary">
                LIVE: 2,847 markets tracked
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Trade Smarter?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join professional traders using OpinionScope for real-time whale
              intelligence and market insights.
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              <span>Real-time data</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Bank-grade security</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span>7-day money-back</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isSignedIn ? (
              <Link
                href="/whales"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                )}
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <Button
                  size="lg"
                  className="gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </SignUpButton>
            )}
            <Link
              href="/whales"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "gap-2"
              )}
            >
              View Live Demo
            </Link>
          </div>

          {/* Bottom note */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            No credit card required • Cancel anytime • Free tier available
          </p>
        </div>
      </div>
    </section>
  );
}
