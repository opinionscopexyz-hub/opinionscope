import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { opinionTradeClient } from "@/lib/opinion-trade/client";

// TEMPORARY: Subscription disabled - all authenticated users get pro_plus limits
const SUBSCRIPTION_DISABLED = true;

// Tier limits for trades (mirrored from backend)
const TIER_TRADE_LIMITS = {
  free: 10,
  pro: 20,
  pro_plus: 100,
} as const;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = parseInt(url.searchParams.get("limit") ?? "10");

    // Get user tier from auth (default to free if not authenticated)
    const { userId } = await auth();

    // When subscriptions disabled, authenticated users get pro_plus limits
    let tierLimit: number = TIER_TRADE_LIMITS.free;
    if (userId) {
      tierLimit = SUBSCRIPTION_DISABLED
        ? TIER_TRADE_LIMITS.pro_plus
        : TIER_TRADE_LIMITS.pro_plus; // TODO: fetch actual tier when re-enabled
    }

    // Calculate effective limit based on tier
    const effectiveLimit = Math.min(limit, tierLimit);
    const maxPage = Math.ceil(tierLimit / effectiveLimit);
    const effectivePage = Math.min(page, maxPage);

    // Fetch trades from Opinion API
    const result = await opinionTradeClient.getUserTrades(address, {
      page: effectivePage,
      limit: effectiveLimit,
      chainId: "56", // BSC
    });

    // Calculate if user has hit tier limit
    const totalFetched = (effectivePage - 1) * effectiveLimit + result.list.length;
    const isLimited = totalFetched >= tierLimit || result.total > tierLimit;
    const hasMore = result.list.length === effectiveLimit && totalFetched < tierLimit;

    return NextResponse.json({
      trades: result.list,
      total: result.total, // Real total from Opinion API for stats display
      page: effectivePage,
      hasMore,
      isLimited,
      tierLimit,
    });
  } catch (error) {
    console.error("Whale trades API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trades" },
      { status: 500 }
    );
  }
}
