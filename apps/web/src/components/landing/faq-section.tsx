"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    question: "What prediction markets do you track?",
    answer:
      "We currently track Opinion.Trade markets. We're adding support for Polymarket, Kalshi, and others in the coming months.",
  },
  {
    question: "How do you identify whales?",
    answer:
      "We currently identify whales using the Opinion.Trade leaderboard rankings. Top performers by volume, profit, and points are tracked. Advanced algorithms based on trade size and win rate are planned for future updates.",
  },
  {
    question: "How real-time is the feed?",
    answer:
      "The activity feed currently has a 15-minute delay due to Opinion.Trade API rate limits. Real-time feeds are planned for future premium tiers.",
  },
  {
    question: "Is OpinionScope free?",
    answer:
      "Yes! OpinionScope is currently completely free for all users. Premium subscription tiers with additional features may be introduced in the future.",
  },
  {
    question: "What wallets are supported?",
    answer:
      "We support most popular crypto wallets including MetaMask, WalletConnect, and Coinbase Wallet. Any EVM-compatible wallet should work.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. We never store your payment information (handled by Stripe via Polar). Your data is encrypted in transit and at rest. We don't sell your data.",
  },
];

function FAQItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border/50 rounded-lg mb-3 bg-card/30 backdrop-blur-sm overflow-hidden hover:border-primary/20 transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-primary/60">
            0{index + 1}
          </span>
          <span className="font-medium">{question}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 motion-reduce:transition-none",
          isOpen ? "max-h-96" : "max-h-0"
        )}
        aria-hidden={!isOpen}
      >
        <div className="px-4 pb-4 pl-12">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FAQSection() {
  return (
    <section className="py-20 bg-muted/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <span className="font-mono text-sm tracking-wider">{"// FAQ"}</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about OpinionScope.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {FAQS.map((faq, index) => (
            <FAQItem
              key={index}
              index={index}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
