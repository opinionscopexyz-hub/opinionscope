"use client";

import { useMutation } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import type { Id } from "@opinion-scope/backend/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, TrendingUp, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface Alert {
  _id: Id<"alerts">;
  type: "price" | "whale" | "volume" | "new_market";
  isActive: boolean;
  condition?: { operator: string; value: number };
  triggerCount: number;
  lastTriggeredAt?: number;
  market?: {
    _id: Id<"markets">;
    title: string;
    yesPrice: number;
  } | null;
  whale?: {
    _id: Id<"whales">;
    nickname?: string;
    address: string;
  } | null;
}

interface AlertListProps {
  alerts: Alert[];
}

export function AlertList({ alerts }: AlertListProps) {
  const toggleAlert = useMutation(api.alerts.toggleAlert);
  const deleteAlert = useMutation(api.alerts.deleteAlert);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  if (alerts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-medium mb-2">No alerts yet</h3>
        <p className="text-sm text-muted-foreground">
          Create your first alert to get notified about market movements.
        </p>
      </Card>
    );
  }

  const handleToggle = async (alertId: Id<"alerts">, isActive: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [alertId]: true }));
    try {
      await toggleAlert({ alertId, isActive });
      toast.success(isActive ? "Alert enabled" : "Alert disabled");
    } catch {
      toast.error("Failed to update alert");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [alertId]: false }));
    }
  };

  const handleDelete = async (alertId: Id<"alerts">) => {
    setLoadingStates((prev) => ({ ...prev, [`del-${alertId}`]: true }));
    try {
      await deleteAlert({ alertId });
      toast.success("Alert deleted");
    } catch {
      toast.error("Failed to delete alert");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [`del-${alertId}`]: false }));
    }
  };

  const formatOperator = (op: string) => {
    const map: Record<string, string> = {
      gt: ">",
      lt: "<",
      gte: ">=",
      lte: "<=",
      eq: "=",
    };
    return map[op] ?? op;
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Card key={alert._id} className="p-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="p-2 rounded-full bg-muted shrink-0">
              {alert.type === "price" ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs capitalize">
                  {alert.type}
                </Badge>
                {alert.triggerCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Triggered {alert.triggerCount}x
                  </span>
                )}
              </div>

              {alert.type === "price" && alert.market && (
                <div className="text-sm">
                  <span className="font-medium truncate block">
                    {alert.market.title}
                  </span>
                  {alert.condition && (
                    <span className="text-muted-foreground text-xs">
                      {formatOperator(alert.condition.operator)}{" "}
                      {(alert.condition.value * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              )}

              {alert.type === "whale" && alert.whale && (
                <div className="text-sm">
                  <span className="font-medium">
                    {alert.whale.nickname ??
                      `${alert.whale.address.slice(0, 6)}...${alert.whale.address.slice(-4)}`}
                  </span>
                  <span className="text-muted-foreground text-xs block">
                    Makes a trade
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Switch
                checked={alert.isActive}
                disabled={loadingStates[alert._id]}
                onCheckedChange={(checked) => handleToggle(alert._id, checked)}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={loadingStates[`del-${alert._id}`]}
                onClick={() => handleDelete(alert._id)}
              >
                {loadingStates[`del-${alert._id}`] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
