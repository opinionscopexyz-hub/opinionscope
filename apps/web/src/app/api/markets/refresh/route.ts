import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Simple in-memory rate limiter (30 seconds per user)
const userLastRequest = new Map<string, number>();
const RATE_LIMIT_MS = 30000;

function checkRateLimit(userId: string): boolean {
  const lastRequest = userLastRequest.get(userId);
  const now = Date.now();
  if (lastRequest && now - lastRequest < RATE_LIMIT_MS) {
    return false; // Rate limited
  }
  userLastRequest.set(userId, now);
  return true; // Allowed
}

export async function GET() {
  try {
    // 1. Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate limit check
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: "Rate limited. Try again in 30 seconds." },
        { status: 429 }
      );
    }

    // 3. Validate API config
    const apiKey = process.env.OPINION_TRADE_API_KEY;
    const baseUrl = process.env.OPINION_TRADE_BASE_URL;
    if (!apiKey || !baseUrl) {
      return NextResponse.json(
        { error: "API not configured" },
        { status: 500 }
      );
    }

    // 4. Fetch from Opinion.Trade API
    const response = await fetch(`${baseUrl}/market?limit=50`, {
      headers: { apikey: apiKey },
    });

    if (!response.ok) {
      console.error("Opinion.Trade API error:", response.status);
      return NextResponse.json(
        { error: "Failed to fetch markets" },
        { status: 502 }
      );
    }

    const data = await response.json();

    // 5. Return fresh data
    return NextResponse.json(data);
  } catch (error) {
    console.error("Market refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
