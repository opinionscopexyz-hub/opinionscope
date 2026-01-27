"use client";

import { useMemo } from "react";
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

  const { isExpiring, expiryDate } = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return {
      isExpiring: user.tierExpiresAt && user.tierExpiresAt > now,
      expiryDate: user.tierExpiresAt
        ? new Date(user.tierExpiresAt).toLocaleDateString()
        : null,
    };
  }, [user.tierExpiresAt]);

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
            Your subscription will end on {expiryDate}. After that, you&apos;ll
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
