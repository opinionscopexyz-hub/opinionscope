"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaderboard } from "@/components/whales/leaderboard";
import { FollowedWhales } from "@/components/whales/followed-whales";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function WhalesPage() {
  const { isAuthenticated } = useCurrentUser();
  console.log(isAuthenticated);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-primary font-mono text-sm mb-2 tracking-wider">
            {"// WHALE_TRACKER"}
          </p>
          <h1 className="text-2xl font-bold">Whale Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Follow top traders and track their moves
          </p>
        </div>
      </div>

      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          {isAuthenticated && (
            <TabsTrigger value="following">Following</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="leaderboard" className="mt-4">
          <Leaderboard />
        </TabsContent>

        {isAuthenticated && (
          <TabsContent value="following" className="mt-4">
            <FollowedWhales />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
