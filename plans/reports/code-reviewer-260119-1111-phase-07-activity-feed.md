# Code Review Report: Phase 07 Activity Feed Implementation

**Reviewer:** code-reviewer
**Date:** 2026-01-19
**Scope:** Activity Feed Implementation (Phase 07)
**Build Status:** ✅ PASS

---

## Executive Summary

**Overall Score: 8.5/10**

Activity feed implementation solid. Tier-based delivery works, security enforced server-side, real-time updates via Convex. Architecture follows YAGNI/KISS principles.

**Key Strengths:**
- Server-side tier verification prevents privilege escalation
- Visibility timestamps enforce tiered delivery at DB level
- Clean component separation, good DRY adherence
- Type-safe throughout, build passes

**Key Concerns:**
- Potential data leakage through filtered activities (CRITICAL)
- Missing pagination/cursor implementation
- No input validation on filters
- Performance risk: post-query filtering inefficient

---

## Scope

**Files Reviewed:**
- Backend: `packages/backend/convex/whaleActivity.ts` (209 lines)
- Frontend Hook: `apps/web/src/hooks/use-activity-feed.ts` (57 lines)
- Page: `apps/web/src/app/feed/page.tsx` (57 lines)
- Components:
  - `apps/web/src/components/feed/activity-feed.tsx` (62 lines)
  - `apps/web/src/components/feed/activity-item.tsx` (132 lines)
  - `apps/web/src/components/feed/feed-filters.tsx` (68 lines)
  - `apps/web/src/components/feed/live-indicator.tsx` (41 lines)

**Total LOC:** ~626 lines
**Review Focus:** Security, tier enforcement, performance, architecture
**Build/TypeCheck:** ✅ PASS (Next.js 16.1.2)

---

## Critical Issues

### 1. Data Leakage via Filter Application Order (SECURITY)

**File:** `packages/backend/convex/whaleActivity.ts:61-80`

**Issue:** Filters applied AFTER fetching limit+1 records. If Pro+ user has 100 followed whales but feed contains 50 non-followed activities first, filter returns empty despite more data existing.

**Code:**
```typescript
// Line 61-64: Fetch limit+1
const activities = await query
  .order("desc")
  .filter((q) => q.lte(q.field(visibilityField), now))
  .take(limit + 1);

// Line 69-79: Apply filters AFTER fetch
if (userTier === "pro_plus") {
  if (followedOnly && followedWhaleIds.length > 0) {
    filteredActivities = filteredActivities.filter((a) =>
      followedWhaleIds.includes(a.whaleId.toString())
    );
  }
}
```

**Risk:**
- Incorrect pagination: `hasMore` based on pre-filter count
- Poor UX: Empty feed when followed whales have activity outside initial fetch
- No data *security* leak but logical flaw

**Mitigation:**
```typescript
// Option 1: Compound index (preferred)
.withIndex("by_visibleToProPlus_whaleId", ["visibleToProPlusAt", "whaleId"])

// Option 2: Fetch more and slice client-side
const fetchLimit = followedOnly ? limit * 3 : limit;
```

**Severity:** HIGH (breaks filter feature)

---

### 2. Missing Cursor Implementation

**File:** `packages/backend/convex/whaleActivity.ts:8,99`

**Issue:** Cursor param accepted but never used. Pagination broken.

**Code:**
```typescript
args: {
  cursor: v.optional(v.number()), // Line 8
},
handler: async (ctx, args) => {
  const { limit = 50, cursor: _cursor, ... } = args; // Line 14 - prefixed with _ = unused
```

**Impact:** Infinite scroll impossible, users limited to 50 items max.

**Fix:**
```typescript
// Add cursor filtering
let baseQuery = query.order("desc")
  .filter((q) => q.lte(q.field(visibilityField), now));

if (cursor) {
  baseQuery = baseQuery.filter((q) => q.lt(q.field("timestamp"), cursor));
}

const activities = await baseQuery.take(limit + 1);
```

**Severity:** HIGH (missing feature)

---

## High Priority Findings

### 3. No Input Validation on Filters

**File:** `apps/web/src/components/feed/feed-filters.tsx:56-60`

**Issue:** User can input negative/invalid values for `minAmount`.

**Code:**
```typescript
onChange={(e) =>
  onChange({
    ...filters,
    minAmount: e.target.value ? Number(e.target.value) : undefined,
  })
}
```

**Risk:** NaN values, negative amounts bypass validation.

**Fix:**
```typescript
onChange={(e) => {
  const val = parseFloat(e.target.value);
  onChange({
    ...filters,
    minAmount: !isNaN(val) && val >= 0 ? val : undefined,
  });
}}
```

**Severity:** MEDIUM

---

### 4. followedWhaleIds Array Conversion Inefficiency

**File:** `packages/backend/convex/whaleActivity.ts:36`

**Issue:** Converting every ID to string on every query.

**Code:**
```typescript
followedWhaleIds = user.followedWhaleIds.map((id) => id.toString());
```

**Performance:** O(n) conversion on every feed query. If user follows 1000 whales, 1000 string conversions per query.

**Fix:** Use Set for O(1) lookups:
```typescript
const followedWhaleIdSet = new Set(user.followedWhaleIds.map(String));

// Later:
filteredActivities = filteredActivities.filter((a) =>
  followedWhaleIdSet.has(a.whaleId.toString())
);
```

**Severity:** MEDIUM (scale concern)

---

### 5. Race Condition in LiveIndicator

**File:** `apps/web/src/components/feed/live-indicator.tsx:20-24`

**Issue:** Interval not cleared if `isRealTime` changes mid-execution.

**Code:**
```typescript
useEffect(() => {
  if (!isRealTime) return; // Early return BEFORE setting interval
  const interval = setInterval(...);
  return () => clearInterval(interval);
}, [isRealTime]);
```

**Risk:** If tier changes from pro_plus → pro while interval running, cleanup might miss.

**Fix:**
```typescript
useEffect(() => {
  if (!isRealTime) {
    setPulse(false);
    return;
  }
  const interval = setInterval(() => setPulse((p) => !p), 1000);
  return () => clearInterval(interval);
}, [isRealTime]);
```

**Severity:** LOW (edge case)

---

## Medium Priority Improvements

### 6. Magic Numbers for Tier Delays

**Files:** Multiple

**Issue:** Hardcoded delays scattered across files.

**Examples:**
- `whaleActivity.ts:70-71` - timestamp calculations
- `tierLimits.ts:12,22,33` - delay configs
- `use-activity-feed.ts:32-41` - UI labels

**Better:** Single source of truth already exists in `tierLimits.ts`. Use it:

```typescript
import { TIER_LIMITS } from "@opinion-scope/backend/convex/lib/tierLimits";

const delayLabel = useMemo(() => {
  const limits = TIER_LIMITS[tier];
  return limits.feedDelayMinutes === 0 ? "Real-time" : `${limits.feedDelayMinutes}m delay`;
}, [tier]);
```

**Severity:** MEDIUM (maintainability)

---

### 7. Whale/Market Data Missing Null Checks

**File:** `apps/web/src/components/feed/activity-item.tsx:34,96`

**Issue:** Optional chaining but no fallback for null whale/market.

**Code:**
```typescript
const whaleName = activity.whale?.nickname ?? formatAddress(activity.whale?.address ?? "");
// If whale is null, formatAddress("") returns ""
```

**Better:**
```typescript
const whaleName = activity.whale?.nickname
  ?? (activity.whale?.address ? formatAddress(activity.whale.address) : "Unknown Whale");
```

**Severity:** LOW (rare edge case)

---

### 8. No Error Boundary for Feed

**File:** `apps/web/src/app/feed/page.tsx`

**Issue:** If Convex query fails, entire page crashes.

**Fix:** Add error boundary or loading/error states:

```typescript
const { activities, hasMore, isLoading, error } = useActivityFeed();

if (error) return <ErrorState error={error} />;
```

**Severity:** MEDIUM (UX resilience)

---

## Low Priority Suggestions

### 9. isNew Animation Only on First Item

**File:** `apps/web/src/components/feed/activity-feed.tsx:56`

**Issue:** Only first item gets animation. New items from real-time updates won't animate.

**Suggestion:** Track previous activities and compare:
```typescript
const [prevIds, setPrevIds] = useState<Set<string>>(new Set());
useEffect(() => {
  setPrevIds(new Set(activities.map(a => a._id)));
}, [activities]);

// In map:
isNew={!prevIds.has(activity._id)}
```

**Severity:** LOW (polish)

---

### 10. Hardcoded Platform URL

**File:** `apps/web/src/components/feed/activity-item.tsx:117-126`

**Issue:** Using `market.url` correctly but no validation.

**Code:**
```typescript
{activity.market?.url && (
  <a href={activity.market.url} ...>
```

**Good:** Already using stored URL from schema. No issue.

**Severity:** N/A (false alarm)

---

## Architecture Review

### ✅ Strengths

1. **Tier Security:**
   - Visibility timestamps calculated server-side (`calculateVisibilityTimestamps`)
   - User tier verified from DB, not client claims
   - Separate indexes per tier prevent cross-tier leaks

2. **Separation of Concerns:**
   - Hook (`use-activity-feed`) handles state
   - Components purely presentational
   - Backend queries isolated by tier

3. **DRY Compliance:**
   - Format utils centralized (`format-utils.ts`)
   - Tier limits in single config (`tierLimits.ts`)
   - Component reuse (Avatar, Badge, Card)

4. **KISS Compliance:**
   - No over-engineering
   - Direct Convex queries, no unnecessary abstraction
   - Simple filter state management

### ⚠️ Weaknesses

1. **Post-Query Filtering (YAGNI Violation):**
   - Fetches data then discards it
   - Should use DB indexes for filters

2. **Missing Pagination:**
   - Cursor param unused
   - No infinite scroll
   - Limits users to 50 items

3. **No Optimistic Updates:**
   - Convex handles real-time, but no optimistic UI for actions

---

## Performance Analysis

### Database Queries

**Indexes Used:**
- ✅ `by_visibleToProPlus` - efficient
- ✅ `by_visibleToPro` - efficient
- ✅ `by_visibleToFree` - efficient

**Concerns:**
- ❌ Post-filter reduces effectiveness of `limit`
- ❌ No compound index for `followedOnly` filter
- ⚠️ N+1 query pattern for whale/market enrichment (mitigated by `Promise.all`)

**Recommendation:** Add compound index:
```typescript
.withIndex("by_visibleToProPlus_whaleId", ["visibleToProPlusAt", "whaleId"])
```

### Frontend Rendering

- ✅ Memoized delay label
- ✅ Skeleton loading states
- ✅ Conditional filter rendering
- ⚠️ No virtualization for long lists (acceptable for 50 item limit)

---

## Security Audit

### ✅ Passed Checks

1. **Tier Verification:**
   ```typescript
   // Line 26-42: Always fetches user from DB
   const user = await ctx.db.query("users")
     .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
     .unique();
   ```

2. **Server-Side Timestamps:**
   ```typescript
   // calculateVisibilityTimestamps in tierLimits.ts
   return {
     visibleToProPlusAt: tradeTimestamp,
     visibleToProAt: tradeTimestamp + 30 * 1000,
     visibleToFreeAt: tradeTimestamp + 15 * 60 * 1000,
   };
   ```

3. **Client Can't Override:**
   - Filters only applied server-side for verified Pro+ users
   - Free users can't request Pro+ filters

### ⚠️ Minor Concerns

1. **followedWhaleIds Trust:**
   - Assumes `user.followedWhaleIds` hasn't been tampered
   - Safe since Convex DB-backed, but no explicit validation

2. **No Rate Limiting:**
   - Convex handles this, but no app-level limits
   - Pro+ users could spam queries

---

## YAGNI/KISS/DRY Compliance

### ✅ YAGNI - Good
- No premature abstraction
- No unused features (except cursor param)
- Simple filter state management

### ⚠️ KISS - Mostly Good
- Clean component hierarchy
- **BUT:** Tiered visibility could use simpler single query with dynamic index selection (already implemented this way)

### ✅ DRY - Excellent
- Format utils centralized
- Tier limits in config
- Reusable UI components
- Single `getFeed` query handles all tiers

---

## Type Safety

**Status:** ✅ PASS

- All Convex queries properly typed
- Doc types from schema used correctly
- No `any` types found
- Nullable types handled with optional chaining

**Minor Issue:**
```typescript
// activity-feed.tsx:13-14
type Whale = Doc<"whales">;
type Market = Doc<"markets">;
```
These types re-exported from schema. Could import from central type file.

---

## Test Coverage Assessment

**Status:** ⚠️ NO TESTS FOUND

**Critical Paths Needing Tests:**
1. Tier-based visibility filtering
2. Pro+ filter application (followedOnly, minAmount)
3. Pagination with cursor
4. Null whale/market handling
5. Filter input validation

**Recommended:**
```typescript
// Backend tests
describe("whaleActivity.getFeed", () => {
  it("enforces tier-based visibility", async () => {
    // Create activity at T+0
    // Query as Free user at T+5min
    // Expect: empty
    // Query at T+16min
    // Expect: activity visible
  });

  it("applies Pro+ filters correctly", async () => {
    // Create 100 activities
    // 10 from followed whale
    // Query with followedOnly=true
    // Expect: only 10 results
  });
});
```

---

## Positive Observations

1. **Excellent Type Safety:** Full Convex schema integration, zero `any` types
2. **Clean Code:** Readable, well-commented, descriptive names
3. **Security Conscious:** Server-side enforcement, no client trust
4. **Good UX:** Loading states, empty states, animations
5. **Accessibility:** Proper labels, semantic HTML
6. **Mobile Responsive:** Flexbox layout adapts well
7. **Format Utils:** Centralized formatting prevents inconsistency
8. **Real-time Ready:** Convex subscriptions auto-update UI

---

## Recommended Actions

### Immediate (Block Release)
1. **Fix cursor pagination** - Feature incomplete
2. **Add input validation** - Prevent NaN/negative minAmount
3. **Fix filter ordering** - Compound index or fetch-more strategy

### High Priority (Before Phase 08)
4. **Add error boundaries** - Prevent full page crash
5. **Optimize followedWhaleIds** - Use Set for O(1) lookups
6. **Write integration tests** - Tier visibility critical path

### Medium Priority (Post-MVP)
7. **Virtualize feed list** - If limit increased beyond 50
8. **Add optimistic updates** - Better UX for follows/unfollows
9. **Implement retry logic** - For failed Convex queries

### Low Priority (Polish)
10. **Animate all new items** - Not just first
11. **Add sound effects** - Per plan.md future work
12. **Export to central types** - Avoid re-declaring Doc types

---

## Phase 07 Plan Completion Status

**Plan File:** `plans/260116-1247-mvp-implementation/phase-07-activity-feed.md`

### ✅ Completed Tasks
- [x] Update `whaleActivity.ts` with tiered queries
- [x] Create `use-activity-feed.ts` hook
- [x] Create `feed/page.tsx`
- [x] Create `activity-feed.tsx` component
- [x] Create `activity-item.tsx` component
- [x] Create `feed-filters.tsx` component
- [x] Create `live-indicator.tsx` component
- [x] Switch component (shadcn/ui)
- [x] Enriched data displays correctly
- [x] Mobile responsive layout

### ❌ Incomplete Tasks
- [ ] Test tiered visibility timestamps (no tests written)
- [ ] Test real-time updates for Pro+ (manual only)
- [ ] Test 30s delay for Pro (manual only)
- [ ] Test 15min delay for Free (manual only)
- [ ] Test followed-only filter (broken by filter order)
- [ ] Test minimum amount filter (no validation)

### Success Criteria Analysis
- [x] Feed updates real-time for Pro+ (Convex WebSocket)
- [x] Pro users see 30s delay (timestamp-based)
- [x] Free users see 15min delay (timestamp-based)
- [~] Filters work correctly for Pro+ (broken by post-query filtering)
- [x] New items animate smoothly (first item only)
- [x] Enriched data displays correctly
- [x] Mobile responsive layout

**Status:** 70% complete. Core works, filters broken, tests missing.

---

## Unresolved Questions

1. **Pagination Strategy:** Should we implement infinite scroll or "Load More" button?
2. **Filter Limit:** Should followed-only filter have max followed whales limit (e.g., 100)?
3. **Real-time Frequency:** Is Convex WebSocket frequency configurable per tier?
4. **Error Handling:** Should tier downgrade errors (expired subscription) redirect to upgrade page?
5. **Null Data Handling:** Can `whale` or `market` legitimately be null? If so, should activity be hidden?
6. **Testing Strategy:** Unit tests (Vitest) vs E2E (Playwright) for tier visibility?
7. **Analytics:** Should we track filter usage to inform Pro+ feature value?

---

## Metrics Summary

| Metric | Value | Status |
|--------|-------|--------|
| Type Coverage | 100% | ✅ |
| Build Status | PASS | ✅ |
| Test Coverage | 0% | ❌ |
| Critical Issues | 2 | ⚠️ |
| High Priority | 3 | ⚠️ |
| Medium Priority | 3 | ⚠️ |
| Lines of Code | 626 | ✅ |
| Files < 200 LOC | 6/7 (85%) | ✅ |
| YAGNI Compliance | Good | ✅ |
| KISS Compliance | Good | ✅ |
| DRY Compliance | Excellent | ✅ |

---

## Final Verdict

**Approve with conditions:**
- Fix cursor pagination (HIGH)
- Fix filter application order (HIGH)
- Add input validation (HIGH)

**Recommended next steps:**
1. Address critical issues (#1, #2)
2. Add integration tests for tier visibility
3. Proceed to Phase 08 (Alert System)

**Code Quality:** B+ (85/100)
**Security:** A- (90/100)
**Performance:** B (80/100)
**Architecture:** A- (88/100)

---

**Report generated:** 2026-01-19 11:11 UTC
**Reviewer:** code-reviewer (ac94bdb)
**Context:** D:\works\cv\opinion-scope
