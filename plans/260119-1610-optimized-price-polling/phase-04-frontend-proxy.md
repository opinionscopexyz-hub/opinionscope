# Phase 04: Frontend Proxy Route

## Context Links
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 01](./phase-01-schema-token-ids.md) (for token IDs in response)
- Reference: [checkout/route.ts](../../apps/web/src/app/api/checkout/route.ts)

## Overview
- **Priority:** P2
- **Status:** ✅ Done (2026-01-19 18:58 UTC)
- **Description:** Create Next.js API route to proxy Opinion.Trade API calls, bypassing CORS restrictions for frontend refresh
- **Review:** [code-reviewer-260119-1852-phase04-frontend-proxy.md](../reports/code-reviewer-260119-1852-phase04-frontend-proxy.md)

## Key Insights
- Browser → Opinion.Trade API = CORS blocked
- Browser → Next.js API → Opinion.Trade = Works (server-to-server)
- Proxy can write to Convex, benefiting all users
- Rate limiting prevents abuse

## Requirements

### Functional
- `/api/markets/refresh` endpoint
- Fetch markets from Opinion.Trade API
- Return fresh market data to client
- Optionally update Convex DB

### Non-Functional
- Require Clerk authentication
- Rate limit: 1 request per 30 seconds per user
- Handle API errors gracefully
- Return appropriate HTTP status codes

## Architecture

```
Browser                 Next.js API                Opinion.Trade
   │                        │                           │
   │─── GET /refresh ──────>│                           │
   │    (with auth)         │                           │
   │                        │───── GET /market ────────>│
   │                        │<──── Markets data ────────│
   │                        │                           │
   │                        │─── Convex mutation ──────>│ (optional)
   │                        │                           │
   │<── Fresh markets ──────│                           │
```

## Related Code Files

### To Create
- `apps/web/src/app/api/markets/refresh/route.ts` - Proxy endpoint

### To Modify
- `apps/web/src/app/screener/page.tsx` - Add refresh button

### Reference
- `apps/web/src/app/api/checkout/route.ts` - Auth pattern

## Implementation Steps

1. **Create rate limiter utility**
   ```typescript
   // Simple in-memory rate limiter
   const userLastRequest = new Map<string, number>();
   const RATE_LIMIT_MS = 30000; // 30 seconds

   function isRateLimited(userId: string): boolean {
     const lastRequest = userLastRequest.get(userId);
     if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_MS) {
       return true;
     }
     userLastRequest.set(userId, Date.now());
     return false;
   }
   ```

2. **Create /api/markets/refresh route**
   - Auth check via Clerk
   - Rate limit check
   - Fetch from Opinion.Trade API
   - Return JSON response

3. **Add refresh button to screener**
   - State: isRefreshing
   - Handler: call /api/markets/refresh
   - Update UI with loading state
   - Show success/error toast

4. **Optional: Write back to Convex**
   - After fetching, call Convex mutation
   - All users benefit from refreshed data
   - Reduces redundant API calls

## Todo List

- [x] Create rate limiter utility
- [x] Create /api/markets/refresh route
- [x] Add Clerk auth check
- [x] Implement Opinion.Trade API fetch
- [x] Add refresh button to screener header
- [x] Add loading/error states
- [x] Test CORS resolution
- [x] Optional: Add Convex writeback (deferred to Phase 05)

## Code Snippets

### route.ts
```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Simple in-memory rate limiter
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

    // 2. Rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: "Rate limited. Try again in 30 seconds." },
        { status: 429 }
      );
    }

    // 3. Fetch from Opinion.Trade
    const apiKey = process.env.OPINION_TRADE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${process.env.OPINION_TRADE_BASE_URL}/market?limit=50`,
      { headers: { apikey: apiKey } }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch markets" },
        { status: 502 }
      );
    }

    const data = await response.json();

    // 4. Return fresh data
    return NextResponse.json(data);
  } catch (error) {
    console.error("Market refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Refresh Button Component
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/markets/refresh");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Refresh failed");
      }
      // Convex subscription will auto-update if writeback enabled
    } catch (error) {
      console.error("Refresh error:", error);
      // Show toast
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
      {isRefreshing ? "Refreshing..." : "Refresh"}
    </Button>
  );
}
```

## Success Criteria

- [x] /api/markets/refresh returns fresh data
- [x] Auth required (401 for unauthenticated)
- [x] Rate limit enforced (429 after request)
- [x] No CORS errors in browser
- [x] Refresh button shows loading state
- [x] Data updates in screener after refresh

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Proxy abuse | Medium | High | Rate limit + auth required |
| API quota exhaustion | Low | Medium | 30s rate limit per user |
| Memory leak (rate limiter) | Low | Low | Map entries auto-overwritten |

## Security Considerations
- Clerk auth required for all requests
- API key kept server-side only
- Rate limiting prevents abuse
- No user data exposed in logs

## Next Steps
- Deploy and test end-to-end
- Monitor API usage
- Consider Redis for distributed rate limiting (future)

---

## Implementation Notes (2026-01-19)

### What Was Built
1. **Proxy Route** (`apps/web/src/app/api/markets/refresh/route.ts`)
   - Clerk auth integration ✅
   - In-memory rate limiter (30s per user) ✅
   - Opinion.Trade API fetch with error handling ✅
   - Proper HTTP status codes (401, 429, 500, 502) ✅

2. **UI Integration** (`apps/web/src/app/screener/page.tsx`)
   - Refresh button with loading state ✅
   - Toast notifications (success/error) ✅
   - Disabled state during refresh ✅
   - Icon animation during loading ✅

### Code Review Findings
- **Score:** 8.5/10
- **Build:** ✅ Clean compilation
- **Security:** ✅ Auth required, API key server-side only
- **CORS:** ✅ Resolved via proxy pattern

### Known Limitations
1. **Memory Leak Risk:** In-memory rate limiter Map grows unbounded
   - Acceptable for MVP (<1k users)
   - Recommend LRU cache for production scale
2. **Missing Convex Writeback:** Deferred to Phase 05
   - Current: Each user refresh hits Opinion.Trade API
   - Future: Centralized refresh benefits all users
3. **Error Parsing:** Assumes JSON error responses
   - Add try-catch for non-JSON upstream errors

### Recommendations
**Before Production:**
- Add JSON parsing error handling in toast logic
- Improve rate limit feedback (specific 429 message)

**Phase 05:**
- Implement Convex writeback optimization
- Add LRU cache when user base >1k

**Future:**
- Structured logging for debugging
- Redis-based rate limiting for multi-instance deployments
