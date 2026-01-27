"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { WhaleStats } from "@/components/whales/whale-stats";
import { FollowButton } from "@/components/whales/follow-button";
import { WhaleTradeHistory } from "@/components/whales/whale-trade-history";
import { WhalePositions } from "@/components/whales/whale-positions";
import { CheckCircle, Copy, Check, ArrowLeft, ExternalLink, TrendingUp, History } from "lucide-react";
import { formatAddress } from "@/lib/format-utils";
import { useState } from "react";

export default function WhaleProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [totalTrades, setTotalTrades] = useState<number | undefined>();
  const { isAuthenticated } = useCurrentUser();

  // Get address from URL param (may be URL-encoded)
  const address = decodeURIComponent(params.address as string);

  const whale = useQuery(api.whales.getByAddress, { address });
  const isFollowing = useQuery(
    api.whales.isFollowing,
    whale?._id ? { whaleId: whale._id } : "skip"
  );

  const displayName = whale
    ? whale.nickname ?? formatAddress(whale.address)
    : "";

  // Loading state
  if (whale === undefined) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Not found state
  if (whale === null) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/whales")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Whale Tracker
        </Button>
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Whale Not Found</h2>
          <p className="text-muted-foreground">
            This whale profile does not exist or has been removed.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Back navigation */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/whales")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Whale Tracker
      </Button>

      {/* Profile header */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={whale.avatar ?? undefined} />
            <AvatarFallback className="text-2xl">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              {whale.isVerified && (
                <CheckCircle className="h-6 w-6 text-blue-500" />
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono mb-2">
              {formatAddress(whale.address, 12, 10)}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  navigator.clipboard.writeText(whale.address);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                aria-label="Copy address"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <a
                href={`https://bscscan.com/address/${whale.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
                aria-label="View address on BSCScan"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{whale.followerCount} followers</span>
              {/* {whale.platforms.length > 0 && (
                <span className="capitalize">
                  {whale.platforms.join(", ").replace(/_/g, " ")}
                </span>
              )} */}
            </div>
          </div>

          {isAuthenticated && whale._id && (
            <FollowButton whaleId={whale._id} isFollowing={isFollowing ?? false} />
          )}
        </div>
      </Card>

      {/* Stats grid */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Performance Stats</h2>
        <WhaleStats whale={whale} totalTrades={totalTrades} />
      </div>

      {/* Tabbed section for positions and trades */}
      <Tabs defaultValue="positions">
        <TabsList variant="line" className="mb-4">
          <TabsTrigger value="positions">
            <TrendingUp className="h-4 w-4" />
            Market Positions
          </TabsTrigger>
          <TabsTrigger value="trades">
            <History className="h-4 w-4" />
            Trade History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <WhalePositions whaleAddress={whale.address} />
        </TabsContent>

        <TabsContent value="trades">
          <WhaleTradeHistory whaleAddress={whale.address} onTotalLoaded={setTotalTrades} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
