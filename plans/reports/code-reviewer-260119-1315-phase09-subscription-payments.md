# Code Review: Phase 09 Subscription Payments

**Date:** 2026-01-19
**Reviewer:** code-reviewer (a6ee398)
**Score:** 6.5/10

---

## Scope

**Files Reviewed:**
1. `apps/web/src/lib/polar/client.ts` - Polar SDK client (56 lines)
2. `apps/web/src/app/pricing/page.tsx` - Pricing page (65 lines)
3. `apps/web/src/components/pricing/pricing-cards.tsx` - Pricing cards (194 lines)
4. `apps/web/src/components/pricing/feature-comparison.tsx` - Feature table (123 lines)
5. `apps/web/src/app/billing/page.tsx` - Billing page (105 lines)
6. `apps/web/src/components/billing/subscription-card.tsx` - Subscription card (84 lines)
7. `packages/backend/convex/subscriptions.ts` - Subscription mutations (224 lines)
8. `packages/backend/convex/http.ts` - Webhook handler (226 lines)

**Total Lines:** 1,077 lines
**Review Focus:** Security, architecture, type safety, error handling

---

## Overall Assessment

Implementation provides functional Polar integration with client/server separation. Major security gaps exist in webhook verification and environment variable handling. Type safety acceptable but uses `any` types. Error handling present but incomplete.

---

## CRITICAL ISSUES (MUST FIX)

### 1. **Webhook Signature Verification Missing** 🔴
**File:** `packages/backend/convex/http.ts:28-31`

```typescript
// TODO: Implement signature verification once Polar SDK provides it
if (!signature) {
  console.warn("No polar-signature header received");
}
```

**Impact:** Webhooks are unauthenticated - any actor can forge subscription events and escalate user privileges.

**Fix Required:**
```typescript
// Use crypto.subtle or Polar SDK verification
const isValid = await verifyPolarSignature(body, signature, webhookSecret);
if (!isValid) {
  return new Response(JSON.stringify({ error: "Invalid signature" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
```

**Priority:** P0 - Block production deployment

---

### 2. **Environment Variables Exposed Client-Side** 🔴
**File:** `apps/web/src/lib/polar/client.ts:10-13`

```typescript
export const POLAR_PRODUCTS = {
  pro_monthly: process.env.NEXT_PUBLIC_POLAR_PRO_MONTHLY_ID ?? "",
  pro_annual: process.env.NEXT_PUBLIC_POLAR_PRO_ANNUAL_ID ?? "",
  // ...
}
```

**Impact:** Product IDs prefixed with `NEXT_PUBLIC_` are bundled into client JS. While IDs themselves aren't secrets, this pattern encourages leaking `POLAR_ACCESS_TOKEN` if misnamed.

**Fix Required:**
- Keep product IDs server-side only
- Pass checkout URLs via API route

```typescript
// Server-side API route
export async function POST(req: Request) {
  const { productId, email } = await req.json();
  const checkoutUrl = getCheckoutUrl(productId, email, successUrl);
  return Response.json({ url: checkoutUrl });
}
```

**Priority:** P0 - Security best practice violation

---

### 3. **No Input Validation on Webhook Data** 🔴
**File:** `packages/backend/convex/http.ts:127-132`

```typescript
async function handleSubscriptionActive(ctx: any, data: WebhookData) {
  const { customer_email, product_id, id: subscriptionId, customer_id } = data;

  if (!customer_email || !product_id) {
    console.error("Missing customer_email or product_id");
    return; // Silently fails - no error logged to syncLogs
  }
}
```

**Impact:** Malicious/malformed webhooks can inject invalid data (SQL injection if email used in raw queries, type confusion).

**Fix Required:**
```typescript
// Use zod validator
const webhookDataSchema = z.object({
  customer_email: z.string().email(),
  product_id: z.string().min(1),
  id: z.string().min(1),
  customer_id: z.string().optional(),
});

const parsed = webhookDataSchema.safeParse(data);
if (!parsed.success) {
  console.error("Invalid webhook data:", parsed.error);
  return new Response(JSON.stringify({ error: "Invalid data" }), { status: 400 });
}
```

**Priority:** P0 - Data integrity risk

---

### 4. **Race Condition in Tier Downgrade** 🟠
**File:** `packages/backend/convex/http.ts:176-185`

```typescript
// Set tier expiration (keep features until period ends)
const tierExpiresAt = current_period_end
  ? new Date(current_period_end).getTime()
  : Date.now() + 24 * 60 * 60 * 1000;

await ctx.runMutation(internal.subscriptions.updateUserSubscription, {
  email: customer_email,
  tier: tier ?? "pro", // Fallback to "pro" if tier unknown!
  tierExpiresAt,
});
```

**Impact:** If `product_id` missing in cancellation webhook, user keeps arbitrary "pro" tier. User could cancel Pro+ but retain Pro indefinitely.

**Fix Required:**
```typescript
// Fetch current tier from DB before setting expiration
const user = await getUserByEmail(customer_email);
await updateUserSubscription({
  email: customer_email,
  tier: user.tier, // Use EXISTING tier
  tierExpiresAt,
});
```

**Priority:** P1 - Business logic vulnerability

---

## WARNINGS (SHOULD FIX)

### 5. **TypeScript `any` Type Leakage** 🟡
**File:** `packages/backend/convex/http.ts:124, 163, 199`

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionActive(ctx: any, data: WebhookData) {
  // ctx should be typed
}
```

**Lint Output:**
```
124:8  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
```

**Fix:**
```typescript
import type { RunMutationCtx } from "./_generated/server";

async function handleSubscriptionActive(
  ctx: RunMutationCtx,
  data: WebhookData
) {
  // Fully typed
}
```

**Priority:** P2 - Type safety

---

### 6. **Missing Error Boundary in Client Components** 🟡
**File:** `apps/web/src/app/pricing/page.tsx`

No error boundary wraps `PricingCards` - if Clerk/Convex fails, user sees blank page.

**Fix:**
```tsx
<ErrorBoundary fallback={<PricingErrorFallback />}>
  <PricingCards {...props} />
</ErrorBoundary>
```

**Priority:** P2 - User experience

---

### 7. **No Logging for Successful Webhook Events** 🟡
**File:** `packages/backend/convex/http.ts:76-80`

```typescript
return new Response(JSON.stringify({ received: true }), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});
```

**Impact:** No audit trail for subscription lifecycle events (compliance issue for refunds/disputes).

**Fix:**
```typescript
await ctx.db.insert("webhookLogs", {
  type: event.type,
  customerId: data.customer_id,
  status: "processed",
  timestamp: Date.now(),
});
```

**Priority:** P2 - Observability

---

### 8. **Unused Variable in Lint** 🟡
**File:** `apps/web/src/app/alerts/page.tsx:14`

```
14:52  warning  'tier' is assigned a value but never used
```

**Fix:** Remove unused destructuring or use variable.

**Priority:** P3 - Code quality

---

## SUGGESTIONS (NICE TO HAVE)

### 9. **Hardcoded Pricing in Frontend** 💡
**File:** `apps/web/src/components/pricing/pricing-cards.tsx:44-65`

```typescript
const PLANS = [
  {
    name: "Pro",
    monthlyPrice: 29,
    annualPrice: 290,
    // ...
  },
];
```

**Suggestion:** Fetch prices from Polar Products API to ensure sync with dashboard.

```typescript
export async function GET() {
  const products = await polarClient.products.list();
  return Response.json(products);
}
```

**Benefit:** Single source of truth for pricing

---

### 10. **Email HTML Not Tested for Dark Mode** 💡
**File:** `packages/backend/convex/subscriptions.ts:150-173`

Email styles use light mode only:
```html
<body style="background-color: #f5f5f5;">
```

**Suggestion:** Add `prefers-color-scheme` media queries.

**Priority:** P4 - User experience

---

### 11. **No Idempotency Key for Webhooks** 💡
**File:** `packages/backend/convex/http.ts`

Duplicate webhook deliveries (Polar retries) could create race conditions.

**Fix:**
```typescript
// Check if webhook already processed
const existing = await ctx.db
  .query("webhookLogs")
  .withIndex("by_eventId", q => q.eq("eventId", event.id))
  .unique();

if (existing) {
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

**Priority:** P3 - Reliability

---

### 12. **Inline Styles in Email Templates** 💡
**File:** `packages/backend/convex/subscriptions.ts:143-173`

224-line function with embedded HTML - violates 200-line limit.

**Fix:** Extract email templates to separate module:
```typescript
import { welcomeEmailTemplate } from "./lib/email-templates";

const html = welcomeEmailTemplate({ tier, userName });
```

**Priority:** P3 - Maintainability (file size = 224 lines)

---

## Positive Observations ✅

1. **Separation of Concerns:** Client utility (`polar/client.ts`) vs backend webhooks well separated
2. **Proper Suspense Usage:** `billing/page.tsx` uses Suspense boundary correctly
3. **Type Safety in Frontend:** Props interfaces defined for all components
4. **Error Handling Present:** Try-catch blocks in webhook handlers
5. **Environment Variable Checks:** Validates `RESEND_API_KEY` before sending emails
6. **Tier Expiration Logic:** Grace period on cancellation (retain access until period ends)

---

## Metrics

| Metric | Value |
|--------|-------|
| **Type Coverage** | ~85% (deducting `any` types in http.ts) |
| **Linting Issues** | 9 warnings (6 in http.ts, 3 in web) |
| **Files > 200 Lines** | 1 (subscriptions.ts = 224 lines) |
| **Security Gaps** | 3 critical (webhook auth, input validation, env vars) |
| **Test Coverage** | Unknown (no tests provided) |

---

## Recommended Actions

### Immediate (Before Production)
1. ✅ Implement webhook signature verification (http.ts:28)
2. ✅ Add zod validation for webhook payloads
3. ✅ Move product IDs to server-side API route
4. ✅ Fix tier fallback logic in cancellation handler (http.ts:183)

### Short-term (This Sprint)
5. ✅ Remove `any` types in webhook handlers
6. ✅ Add error boundaries to pricing/billing pages
7. ✅ Create webhookLogs table for audit trail
8. ✅ Fix unused variable linting errors

### Long-term (Next Sprint)
9. ✅ Extract email templates to separate module (reduce subscriptions.ts to <200 lines)
10. ✅ Add idempotency checks for webhook processing
11. ✅ Fetch pricing from Polar API (eliminate hardcoded prices)
12. ✅ Write integration tests for webhook flows

---

## Unresolved Questions

1. **Polar SDK Capabilities:** Does `@polar-sh/sdk` v1.x support webhook signature verification? (Check docs/upgrade if available)
2. **Tier Migration Strategy:** What happens if user upgrades Pro → Pro+ while Pro has pending expiration?
3. **Refund Handling:** Are `subscription.refunded` or `charge.refunded` events supported? Need handlers?
4. **Test Coverage:** Were manual tests performed? Need E2E tests for checkout flow?
5. **Customer Portal URL:** `getCustomerPortalUrl()` uses `https://polar.sh/dashboard/${customerId}` - is this correct for Polar v2 API?

---

**Review Completed:** 2026-01-19 13:15 UTC
**Next Steps:** Address P0/P1 issues before production deployment
