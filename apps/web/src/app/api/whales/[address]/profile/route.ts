import { NextResponse } from "next/server";
import { opinionTradeClient } from "@/lib/opinion-trade/client";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const url = new URL(req.url);
    const chainId = url.searchParams.get("chainId") ?? "56";

    // Fetch profile from Opinion BSC API v2
    const profile = await opinionTradeClient.getUserProfile(address, {
      chainId,
    });

    return NextResponse.json({
      volume: profile.Volume,
      totalProfit: profile.totalProfit,
      portfolio: profile.portfolio,
      netWorth: profile.netWorth,
      follower: profile.follower,
      following: profile.following,
      userName: profile.userName,
      avatarUrl: profile.avatarUrl,
    });
  } catch (error) {
    console.error("Whale profile API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
