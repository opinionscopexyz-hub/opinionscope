"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function AlertsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Alerts page error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="p-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <h2 className="text-lg font-medium mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Failed to load alerts. Please try again.
        </p>
        <Button onClick={reset} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      </Card>
    </div>
  );
}
