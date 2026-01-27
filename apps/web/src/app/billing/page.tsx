"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SubscriptionCard } from "@/components/billing/subscription-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { getCustomerPortalUrl } from "@/lib/polar/client";

function BillingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, tier, isLoading } = useCurrentUser();

  // Show success message if coming from checkout
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "true") {
      toast.success("Subscription activated! Welcome to OpinionScope Pro.");
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

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
            <Button
              variant="outline"
              onClick={() => window.open(getCustomerPortalUrl(user.polarCustomerId!), "_blank")}
            >
              Customer Portal
              <ExternalLink className="h-4 w-4 ml-2" />
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
            <Button onClick={() => router.push("/pricing" as Parameters<typeof router.push>[0])}>
              View Plans
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
