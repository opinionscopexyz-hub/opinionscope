# Code Review: Phase 08 Alert System

**Review Date:** 2026-01-19
**Reviewer:** code-reviewer (aad9a34)
**Scope:** Alert system implementation (price alerts + whale alerts)
**Score:** 7.5/10

---

## Summary

Phase 08 alert system implemented with Convex backend instead of planned Inngest approach. Core functionality works: price alerts, whale alerts, CRUD operations, tier limits, cooldown logic. Build passes. Major deviation: no email delivery (Inngest/Resend not implemented). Several security, performance, and architecture issues require attention.

---

## Scope

**Backend (Convex):**
- `packages/backend/convex/alerts.ts` (262 lines)
- `packages/backend/convex/alertChecking.ts` (250 lines)
- `packages/backend/convex/notifications.ts` (74 lines)
- `packages/backend/convex/whaleActivity.ts` (239 lines)
- `packages/backend/convex/crons.ts` (42 lines)

**Frontend (Next.js):**
- `apps/web/src/app/alerts/page.tsx` (81 lines)
- `apps/web/src/components/alerts/alert-list.tsx` (171 lines)
- `apps/web/src/components/alerts/create-alert-dialog.tsx` (65 lines)
- `apps/web/src/components/alerts/price-alert-form.tsx` (179 lines)
- `apps/web/src/components/alerts/whale-alert-form.tsx` (115 lines)

**Total:** ~1,478 lines analyzed

---

## Critical Issues (MUST FIX)

### 1. **Missing Email Delivery** 🔴
**Severity:** Critical
**Location:** Entire system
**Issue:** Plan specifies Inngest + Resend for email delivery. Implementation logs to `notificationLog` with `status: "pending"` but never sends emails.

```typescript
// alertChecking.ts:73-82
if (user && user.notificationPreferences.email) {
  // Log notification (email sending via external action)
  await ctx.db.insert("notificationLog", {
    status: "pending",  // ❌ Never processed
    channel: "email",
    content: `Price alert triggered...`,
  });
}
```

**Impact:** Users won't receive email notifications - core feature non-functional
**Fix:** Either:
1. Implement Inngest functions as planned (recommended)
2. Use Convex Actions + HTTP endpoints to send via Resend
3. Document as "email pending implementation"

---

### 2. **Auth Helper Not Used** 🔴
**Severity:** High
**Location:** `alerts.ts` mutations
**Issue:** Code has `requireAuth()` helper but doesn't use it. Repeats auth logic 6 times.

```typescript
// alerts.ts:81-89 (repeated in 5+ places)
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Unauthorized");
const user = await ctx.db.query("users")...
if (!user) throw new Error("User not found");
```

**Impact:** Code duplication, inconsistent error messages, maintenance burden
**Fix:**
```typescript
// Use existing helper
const user = await requireAuth(ctx);
```

---

### 3. **Race Condition in Alert Checking** 🔴
**Severity:** High
**Location:** `alertChecking.ts:12-101`
**Issue:** Price alert check is `internalMutation` with N+1 queries + writes in loop. No transaction safety.

```typescript
// alertChecking.ts:27-96
for (const alert of alerts) {
  const market = await ctx.db.get(alert.marketId);  // N+1 query
  // ... condition check ...
  await ctx.db.patch(alert._id, { ... });  // N writes
  await ctx.db.insert("notificationLog", { ... });  // N more writes
}
```

**Impact:**
- If function runs twice (cron + manual trigger), duplicate notifications
- No cooldown check before writing (checked but not atomic)
- Performance degrades with alert count

**Fix:**
1. Make alert checking idempotent
2. Use scheduler for notification inserts
3. Consider batch processing

---

### 4. **Unsafe Type Assertions** 🔴
**Severity:** Medium-High
**Location:** `whale-alert-form.tsx:60`
**Issue:** `.filter(Boolean)` without null check on items

```typescript
// whale-alert-form.tsx:59-60
{followedWhales.filter(Boolean).map((whale) => {
  if (!whale) return null;  // ❌ This line is dead code
```

**Impact:** If `followedWhales` contains null/undefined, runtime error
**Fix:**
```typescript
{followedWhales.map((whale) => {
  if (!whale) return null;  // Now actually works
```

---

## High Priority (SHOULD FIX)

### 5. **Missing Input Validation**
**Location:** `alerts.ts:75-114`, `price-alert-form.tsx:157-164`
**Issue:** No server-side validation of condition values

```typescript
// Frontend sends 1-99, backend accepts any number
condition: { operator: "lt", value: 9999 }  // ✅ Accepted
```

**Fix:**
```typescript
if (args.condition) {
  if (args.condition.value < 0 || args.condition.value > 1) {
    throw new Error("Price must be between 0 and 1");
  }
}
```

---

### 6. **Inefficient N+1 Queries**
**Location:** `alerts.ts:35-41`, `whaleActivity.ts:108-115`
**Issue:** Fetching related entities in loop instead of batch

```typescript
// alerts.ts:35-41
const alertsWithDetails = await Promise.all(
  alerts.map(async (alert) => {
    const market = alert.marketId ? await ctx.db.get(alert.marketId) : null;
    const whale = alert.whaleId ? await ctx.db.get(alert.whaleId) : null;
    // ❌ 2N queries for N alerts
  })
);
```

**Fix:** Pre-fetch all IDs, then query in batch (Convex doesn't support batch get, but can optimize with indexes)

---

### 7. **Weak Cooldown Logic**
**Location:** `alertChecking.ts:31-33`
**Issue:** Cooldown check happens AFTER query, wasting resources

```typescript
// alertChecking.ts:27-33
for (const alert of alerts) {
  if (!alert.marketId || !alert.condition) continue;

  if (alert.lastTriggeredAt && now - alert.lastTriggeredAt < ALERT_COOLDOWN_MS) {
    continue;  // ❌ Already fetched from DB
  }
```

**Fix:** Filter at query time:
```typescript
.filter((q) =>
  q.or(
    q.eq(q.field("lastTriggeredAt"), undefined),
    q.lt(q.field("lastTriggeredAt"), now - ALERT_COOLDOWN_MS)
  )
)
```

---

### 8. **Type Safety Issues**
**Location:** `create-alert-dialog.tsx:28`
**Issue:** Invalid DialogTrigger usage (deprecated `render` prop)

```typescript
// create-alert-dialog.tsx:28-33
<DialogTrigger
  render={  // ❌ Not a valid prop
    <Button size="sm">...</Button>
  }
/>
```

**Fix:**
```typescript
<DialogTrigger asChild>
  <Button size="sm">...</Button>
</DialogTrigger>
```

---

## Medium Priority (NICE TO HAVE)

### 9. **Missing Error Boundaries**
Frontend components don't handle query errors. If `api.alerts.list` fails, page crashes.

**Fix:** Add Suspense boundaries + error handling

---

### 10. **Hardcoded Cooldown**
`ALERT_COOLDOWN_MS = 60 * 60 * 1000` should be tier-configurable (free: 1hr, pro: 30min, pro+: 15min)

---

### 11. **Verbose Notification Content**
`alertChecking.ts:79` creates notification content inline. Should use template function for consistency.

---

### 12. **Missing Indexes**
No index on `notificationLog.status` for pending email processing (when implemented).

---

## Architecture Review

### ✅ **What Works Well**

1. **Clean Separation:** Backend logic separated from frontend UI
2. **Tier Enforcement:** Correctly uses `canAddAlert()` and `getTierLimits()`
3. **Duplicate Prevention:** Checks for duplicate whale alerts (lines 145-151)
4. **Cooldown Implemented:** 1-hour cooldown prevents spam
5. **Type Safety:** Mostly type-safe with Convex validators
6. **Build Passes:** No TypeScript errors

### ⚠️ **Architecture Concerns**

1. **Plan Deviation:** Inngest not used (plan specified event-driven architecture)
2. **Mixed Responsibilities:** `alertChecking.ts` does checking + notification creation + logging (should be separate)
3. **Cron Timing:** Price alert cron runs every 5min, may miss rapid price changes
4. **No Retry Logic:** If notification insert fails, alert is still marked triggered

---

## Security Audit

### ✅ **Secure**
- Auth checks on all mutations
- User ownership verified before alert operations
- No SQL injection (Convex uses validators)
- No XSS in notification content (text only)

### ⚠️ **Potential Issues**
- Internal queries lack auth (acceptable if only called internally)
- No rate limiting on alert creation (could spam DB with 50 alerts quickly)
- Email content includes market URL without validation

---

## Performance Analysis

### Bottlenecks
1. **Alert Checking:** O(N) alerts × O(M) DB queries per check
2. **Feed Query:** Uses `Promise.all()` for N activities (acceptable for small N)
3. **No Caching:** Repeated `ctx.db.get()` calls for same market

### Recommendations
- Add caching layer for frequently accessed markets
- Batch alert checks by market (check 1 market → trigger all alerts)
- Consider pagination for alert lists

---

## YAGNI/KISS/DRY Compliance

### ✅ **KISS Compliance**
- Simple CRUD operations
- Straightforward UI components
- No over-engineering

### ⚠️ **DRY Violations**
- Auth code repeated 6 times (use `requireAuth`)
- Market fetching logic duplicated in `alerts.ts` and `whaleActivity.ts`
- Notification content formatting repeated

### ✅ **YAGNI Compliance**
- No premature optimizations
- Focuses on price + whale alerts only (no volume/new_market)

---

## Test Coverage

**Status:** ❌ No tests found

**Recommended Tests:**
1. Unit: Alert condition evaluation logic
2. Integration: Alert triggering flow
3. E2E: Create alert → trigger condition → verify notification
4. Security: Unauthorized access attempts

---

## Positive Observations

1. **Code Quality:** Clean, readable code with good variable names
2. **UI Polish:** Loading states, error handling, empty states
3. **Accessibility:** Proper ARIA labels, keyboard navigation
4. **Error Messages:** User-friendly error messages
5. **Schema Design:** Well-structured with proper indexes
6. **Cooldown Logic:** Prevents notification spam

---

## Recommended Actions (Priority Order)

### Must Do Before Merge
1. **Fix DialogTrigger** (breaking change in shadcn/ui)
2. **Replace repeated auth code** with `requireAuth()`
3. **Add input validation** for condition values
4. **Fix whale form filter** logic
5. **Document email delivery status** (pending/not implemented)

### Should Do This Sprint
6. Implement Inngest + Resend for email delivery
7. Add cooldown filtering at query time
8. Batch entity fetching to reduce N+1 queries
9. Add error boundaries to frontend
10. Write integration tests for alert triggering

### Can Do Later
11. Add notification templates
12. Implement retry logic for failed notifications
13. Add caching for frequently accessed data
14. Make cooldown tier-configurable
15. Add prometheus metrics for alert performance

---

## Metrics

- **Type Coverage:** 95% (missing some `any` types)
- **Test Coverage:** 0% (no tests)
- **Linting Issues:** 0 (build passes)
- **Security Issues:** 2 medium (email validation, rate limiting)
- **Performance Issues:** 3 high (N+1 queries, no caching, cooldown filtering)

---

## Unresolved Questions

1. **Email Delivery:** When will Inngest integration be implemented? Should we block on this?
2. **Cron Frequency:** Is 5-minute price check acceptable or do we need real-time?
3. **Alert Limits:** Should we rate-limit alert creation (e.g., max 5/minute)?
4. **Notification Retry:** What happens if email send fails after alert marked triggered?
5. **Testing Strategy:** Do we need test environment before prod deploy?
6. **Monitoring:** How will we track alert delivery success rates?
