"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import type { Id } from "@opinion-scope/backend/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WhaleAlertFormProps {
  onSuccess: () => void;
}

export function WhaleAlertForm({ onSuccess }: WhaleAlertFormProps) {
  const [selectedWhaleId, setSelectedWhaleId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createWhaleAlert = useMutation(api.alerts.createWhaleAlert);
  const followedWhales = useQuery(api.whales.getFollowedWhales);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWhaleId) return;

    setIsSubmitting(true);
    try {
      await createWhaleAlert({ whaleId: selectedWhaleId as Id<"whales"> });
      toast.success("Whale alert created");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create alert"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Select a whale you follow</Label>

        {followedWhales === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : followedWhales.length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground text-sm">
            You&apos;re not following any whales yet. Follow whales from the
            leaderboard to create alerts.
          </Card>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {followedWhales.map((whale) => {
              if (!whale) return null;
              const name =
                whale.nickname ??
                `${whale.address.slice(0, 6)}...${whale.address.slice(-4)}`;

              return (
                <Card
                  key={whale._id}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedWhaleId === whale._id
                      ? "border-primary bg-muted"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedWhaleId(whale._id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={whale.avatar ?? undefined} />
                      <AvatarFallback>
                        {name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm">{name}</span>
                        {whale.isVerified && (
                          <CheckCircle className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {whale.tradeCount} trades
                      </div>
                    </div>
                    {selectedWhaleId === whale._id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!selectedWhaleId || isSubmitting || followedWhales?.length === 0}
      >
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Create Alert
      </Button>
    </form>
  );
}
