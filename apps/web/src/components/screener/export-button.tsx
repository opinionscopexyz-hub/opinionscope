"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Download, Lock } from "lucide-react";
import type { ScreenerFilters } from "@/hooks/use-screener-filters";

interface ExportButtonProps {
  filters: ScreenerFilters;
}

export function ExportButton({ filters }: ExportButtonProps) {
  const { isPro } = useCurrentUser();

  const handleExport = () => {
    // TODO: Implement CSV export with tier limits
    // Free: 10 rows blurred
    // Pro: 100 rows/day
    // Pro+: Unlimited
    console.log("Export with filters:", filters);
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={!isPro}>
      {!isPro && <Lock className="h-4 w-4 mr-2" />}
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
}
