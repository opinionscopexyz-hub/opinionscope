"use client";

import { useMutation } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@opinion-scope/backend/convex/_generated/dataModel";

interface FollowButtonProps {
  whaleId: Id<"whales">;
  isFollowing: boolean;
}

export function FollowButton({ whaleId, isFollowing }: FollowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const follow = useMutation(api.whales.follow);
  const unfollow = useMutation(api.whales.unfollow);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollow({ whaleId });
        toast.success("Unfollowed whale");
      } else {
        await follow({ whaleId });
        toast.success("Now following whale");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-1" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1" />
          Follow
        </>
      )}
    </Button>
  );
}
