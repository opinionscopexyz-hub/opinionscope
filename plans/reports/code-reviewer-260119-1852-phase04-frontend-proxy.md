# Code Review: Phase 04 Frontend Proxy Implementation

**Reviewer:** code-reviewer
**Date:** 2026-01-19 18:52
**Plan:** `plans/260119-1610-optimized-price-polling/phase-04-frontend-proxy.md`

---

## Score: 8.5/10

Good implementation with proper auth, rate limiting, and error handling. Deductions for memory leak risk and missing Convex writeback optimization.

---

## Scope

### Files Reviewed
- `apps/web/src/app/api/markets/refresh/route.ts` (NEW - 69 lines)
- `apps/web/src/app/screener/page.tsx` (MODIFIED - added refresh button)

### Review Focus
- Security (auth, rate limiting)
- Error handling
- CORS resolution
- UI/UX patterns
- Alignment with phase plan

---

## Overall Assessment

Implementation successfully resolves CORS issues via server-side proxy pattern. Auth via Clerk and rate limiting protect against abuse. Error handling comprehensive. UI feedback clear with loading/success/error states.

**Build Status:** ✅ Clean compilation (`bun run build` passed)

---

## Critical Issues

**None identified.**

---

## High Priority Findings

### H1: Memory Leak Risk - Rate Limiter Map Growth (Medium Impact)
**Location:** `route.ts:5-6`

```typescript
const userLastRequest = new Map<string, number>();
```

**Issue:** Map grows unbounded. High-traffic scenarios = eventual OOM crash.

**Impact:** Production stability risk if 10k+ unique users hit endpoint.

**Fix:** Add periodic cleanup or TTL-based eviction:
```typescript
// Option 1: Periodic cleanup (simple)
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamp] of userLastRequest.entries()) {
    if (now - timestamp > RATE_LIMIT_MS * 2) {
      userLastRequest.delete(userId);
    }
  }
}, 60000); // Clean every 60s

// Option 2: Use LRU cache (better)
import { LRUCache } from 'lru-cache';
const userLastRequest = new LRUCache<string, number>({
  max: 10000, // Max entries
  ttl: RATE_LIMIT_MS * 2,
});
```

**Recommendation:** Implement Option 2 with `lru-cache` package for production. Current code acceptable for MVP.

---

### H2: Missing Convex Writeback Optimization
**Location:** `route.ts:60` (planned but not implemented)

**Issue:** Phase plan (line 89-92) mentions optional Convex writeback to benefit all users. Not implemented.

**Impact:**
- Redundant API calls if 10 users refresh within 30s window
- Missed opportunity to centralize data freshness
- Higher Opinion.Trade API quota consumption

**Fix:** Add Convex mutation after successful fetch:
```typescript
// After line 57
const data = await response.json();

// Write to Convex (all users benefit)
await fetch(`${process.env.CONVEX_URL}/api/upsertMarkets`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.CONVEX_DEPLOY_KEY}`,
  },
  body: JSON.stringify({ markets: data }),
});

return NextResponse.json(data);
```

**Recommendation:** Implement in Phase 05 or next iteration to reduce API load.

---

## Medium Priority Improvements

### M1: Error Response Parsing Risk
**Location:** `page.tsx:32`

```typescript
const error = await res.json();
throw new Error(error.error || "Refresh failed");
```

**Issue:** Assumes error response is JSON. Network errors or 502 from upstream may return HTML/text.

**Fix:** Add try-catch for JSON parsing:
```typescript
if (!res.ok) {
  let errorMsg = "Refresh failed";
  try {
    const error = await res.json();
    errorMsg = error.error || errorMsg;
  } catch {
    errorMsg = `Server error (${res.status})`;
  }
  throw new Error(errorMsg);
}
```

---

### M2: Rate Limit Feedback Insufficient
**Location:** `page.tsx:38`

**Issue:** Toast shows generic error message. User doesn't know they're rate-limited vs API down.

**Current:**
```typescript
toast.error(message); // "Rate limited. Try again in 30 seconds."
```

**Improvement:**
```typescript
if (res.status === 429) {
  toast.error("Too many requests. Please wait 30 seconds.", {
    duration: 5000,
  });
} else {
  toast.error(message);
}
```

---

### M3: Missing API Config Validation
**Location:** `route.ts:35-42`

**Issue:** Validates `apiKey` and `baseUrl` at runtime. Should fail fast at startup.

**Fix:** Add validation in Next.js config or middleware:
```typescript
// middleware.ts or route startup
if (!process.env.OPINION_TRADE_API_KEY) {
  throw new Error("OPINION_TRADE_API_KEY not configured");
}
```

**Alternative:** Use `@opinion-scope/env` schema validation (if exists in monorepo).

---

## Low Priority Suggestions

### L1: Hardcoded Limit Parameter
**Location:** `route.ts:45`

```typescript
const response = await fetch(`${baseUrl}/market?limit=50`, {
```

**Suggestion:** Extract to env var or constant:
```typescript
const MARKET_FETCH_LIMIT = Number(process.env.MARKET_FETCH_LIMIT) || 50;
```

---

### L2: Console.error Lacks Context
**Location:** `route.ts:50, 62`

**Current:**
```typescript
console.error("Opinion.Trade API error:", response.status);
console.error("Market refresh error:", error);
```

**Enhancement:** Add structured logging with userId for debugging:
```typescript
console.error("[Market Refresh]", {
  userId,
  status: response.status,
  timestamp: new Date().toISOString(),
});
```

---

### L3: Button Layout on Mobile
**Location:** `page.tsx:57-68`

**Observation:** Refresh + Export buttons in horizontal flex. May wrap awkwardly on small screens.

**Suggestion:** Add responsive breakpoint:
```typescript
<div className="flex flex-col sm:flex-row items-center gap-2">
```

---

## Positive Observations

✅ **Excellent Auth Pattern** - Follows `checkout/route.ts` reference correctly
✅ **Clean Error Handling** - Try-catch with specific HTTP status codes (401, 429, 500, 502)
✅ **Good UX** - Loading state with spinner animation, success/error toasts
✅ **CORS Resolution** - Server-to-server proxy bypasses browser restrictions effectively
✅ **Rate Limiting Logic** - Simple but functional, prevents abuse
✅ **Type Safety** - No TypeScript errors, clean compilation

---

## Recommended Actions

### Immediate (Before Merge)
1. **Add JSON parsing error handling** (M1) - 5 min fix, prevents crashes
2. **Improve rate limit toast feedback** (M2) - 2 min fix, better UX

### Next Sprint
3. **Implement Convex writeback** (H2) - Aligns with phase plan, reduces API load
4. **Add LRU cache for rate limiter** (H1) - Production stability (when traffic scales)

### Future Enhancements
5. Extract `MARKET_FETCH_LIMIT` to env var (L1)
6. Add structured logging (L2)
7. Test mobile responsiveness (L3)

---

## Metrics

- **Type Coverage:** 100% (TypeScript compilation clean)
- **Build Status:** ✅ Pass
- **Lines Added:** ~90 (69 route.ts + ~21 page.tsx)
- **Security Checks:** ✅ Auth required, API key server-side only
- **CORS Issues:** ✅ Resolved via proxy pattern

---

## Plan Status Update

### Todo Completion (7/8 tasks done)
- ✅ Create rate limiter utility
- ✅ Create /api/markets/refresh route
- ✅ Add Clerk auth check
- ✅ Implement Opinion.Trade API fetch
- ✅ Add refresh button to screener header
- ✅ Add loading/error states
- ✅ Test CORS resolution
- ⬜ Optional: Add Convex writeback (deferred to Phase 05)

### Success Criteria (6/6 met)
- ✅ /api/markets/refresh returns fresh data
- ✅ Auth required (401 for unauthenticated)
- ✅ Rate limit enforced (429 after request)
- ✅ No CORS errors in browser
- ✅ Refresh button shows loading state
- ✅ Data updates in screener after refresh

---

## Unresolved Questions

1. **Convex Writeback Scope:** Should writeback be part of Phase 04 or separate phase? Plan says "optional" but impacts multi-user efficiency.
2. **Rate Limiter Scalability:** At what user threshold should we migrate to Redis-based rate limiting? Current in-memory approach sufficient for MVP?
3. **Error Monitoring:** Should we add Sentry/LogRocket for production error tracking? Console.error insufficient for production debugging.

---

## Conclusion

Solid implementation meeting all core requirements. Auth secure, CORS resolved, UX polished. Main gap is missing Convex writeback optimization planned in phase docs. Recommend addressing H2 (writeback) and M1/M2 (error handling improvements) before production deployment. Current code production-ready for MVP scale (<1k users).

**Overall Grade: 8.5/10** - High-quality proxy implementation with room for optimization.
