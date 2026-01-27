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
    icon: Users,
    title: "Whale Tracker",
    description:
      "Follow top traders with verified track records. See their positions, win rates, and recent trades.",
    metric: "500+",
    metricLabel: "Whales tracked",
  },
  {
    icon: Search,
    title: "Smart Market Screener",
    description:
      "Filter thousands of markets by price, volume, category, and custom expressions. Find opportunities in seconds.",
    metric: "1,284",
    metricLabel: "Markets indexed",
  },
  {
    icon: Activity,
    title: "Real-Time Feed",
    description:
      "Watch whale trades as they happen. Pro+ users get 30-second early access before anyone else.",
    metric: "<30s",
    metricLabel: "Update latency",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    description:
      "Get notified when markets hit your targets or whales make moves. Email, push, Telegram, Discord.",
    metric: "99.9%",
    metricLabel: "Delivery rate",
  },
  {
    icon: TrendingUp,
    title: "Performance Analytics",
    description:
      "Track whale performance over time. Identify who to follow based on data, not hype.",
    metric: "78%",
    metricLabel: "Avg win rate",
  },
  {
    icon: Download,
    title: "Data Export",
    description:
      "Export market data and trade history to CSV. Build your own analysis and strategies.",
    metric: "100K+",
    metricLabel: "Rows exported/day",
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,oklch(0.30_0.02_160)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.30_0.02_160)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />

      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Professional-Grade Analytics Suite
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Data-driven tools that were previously only available to
            institutional traders. Now accessible to everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="group bg-card/50 border-border hover:border-primary/40 transition-all duration-200 cursor-pointer backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xl font-bold text-primary">
                      {feature.metric}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      {feature.metricLabel}
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
