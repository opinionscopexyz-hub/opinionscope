# Polar.sh Subscription Integration Research Report

**Date:** 2026-01-16
**Project:** OpinionScope (Prediction Market Intelligence)
**Scope:** Subscription tiers (Free/Pro/$29mo/Pro+/$79mo)

---

## Executive Summary

Polar is a developer-friendly SaaS monetization platform handling payments, subscriptions, tax compliance, and webhooks. Ideal for OpinionScope's three-tier model. Charges 4% + $0.40/transaction. Open-source (Apache 2.0) with SDKs for Node.js, Python, Go, PHP. Fully compatible with Next.js + Convex stack.

---

## 1. API & SDK Overview

**Base URLs:**
- Production: `https://api.polar.sh/v1`
- Sandbox: `https://sandbox-api.polar.sh/v1` (isolated testing)

**Available SDKs:**
- JavaScript/Node.js (polar-js) ✅ Primary choice
- Python (polar-python)
- Go, PHP available
- Framework adapters: Next.js, Laravel, BetterAuth

**Authentication:**
- Organization Access Tokens (OAT) for backend
- OAuth 2.0 for partner integrations
- Customer Access Tokens for customer portal access
- Automatic token revocation via GitHub Secret Scanning integration

**Rate Limits:**
- Standard endpoints: 300 req/min per organization
- License key ops: 3 req/sec (unauthenticated)
- Sandbox available for safe testing

---

## 2. Subscription & Product Management

**Product Model:**
- Unified API treats subscriptions and pay-once purchases identically
- Two types: Subscription (recurring) | Pay-Once (one-time)

**Pricing Options:**
- Fixed Price (OpinionScope use case: $29/mo, $79/mo)
- Pay What You Want (optional minimum)
- Free tier supported

**Key Constraint:** Billing cycle and pricing type locked after creation. Must finalize during setup (monthly vs annual decided upfront).

**Variant Strategy:**
- Create separate products for monthly ($29) and annual ($290, $79→$790)
- Both displayed at checkout simultaneously
- Customer chooses billing frequency

**Features:**
- Trial periods configurable (e.g., 7-day free trial for Pro+)
- Trial requires credit card (fraud prevention)
- Automated benefits: license keys, file downloads, GitHub access, Discord roles

---

## 3. Webhook Events & Subscription Lifecycle

**Event Categories:**
- Customer events (creation, updates, deletion)
- Subscription events (created, active, updated, canceled, uncanceled, revoked)
- Order events (checkout, payment)
- Refund events
- Benefit events (grant, cycling, revocation)

**Key Subscription Events:**
- `subscription.created` - Subscription initiated (after payment)
- `subscription.updated` - Changes to subscription (e.g., tier upgrade)
- `subscription.canceled` - Cancellation initiated
- `subscription.revoked` - Admin-triggered cancellation
- `order.created` - Payment processed

**Webhook Setup:**
- Endpoint configuration via `/integrate/webhooks/endpoints`
- Automatic retries with exponential backoff
- Sandbox testing environment

**Integration with Inngest:**
- Webhook → Inngest → Update Convex user tier
- Send welcome email
- Trigger feature activation workflow

---

## 4. Integration Approach with Next.js + Convex

**Flow:**

```
User → [Pricing Modal] → [Redirect to Polar Checkout]
                              ↓
                    [Stripe-powered Payment]
                              ↓
                    [Webhook: subscription.created]
                              ↓
           [Inngest: Update user tier in Convex]
                              ↓
        [Redirect back to app + Success notification]
```

**Implementation Steps:**

1. **Frontend (Next.js):**
   - Pricing modal showing Free/Pro/Pro+ comparison
   - Toggle monthly/annual billing
   - Button redirects to Polar checkout with parameters
   - Pre-fill email from Clerk session

2. **Backend (Convex):**
   - Schema field: `polarCustomerId`, `polarSubscriptionId`
   - Function to fetch user subscription status
   - Index queries by Polar subscription ID for webhook lookups

3. **Webhooks (Inngest):**
   - Receive `subscription.created` event
   - Lookup user by email
   - Atomic update: tier, polarCustomerId, polarSubscriptionId
   - Send email notification

4. **Customer Portal:**
   - Generate customer access token server-side
   - Customer can view/manage subscriptions
   - Handle upgrades/downgrades via portal
   - Webhook updates Convex automatically

**Sample Checkout URL:**
```
https://checkout.polar.sh/...
?product_id=prod_xxx
&customer_email=user@example.com
```

---

## 5. Pricing & Fees

**Polar's Pricing:**
- 4% + $0.40 per successful transaction
- No monthly/setup fees
- No hidden charges
- MoR (Merchant of Record) included

**OpinionScope Revenue Model (Month 1 example):**
- 10 Pro subscribers × $29 = $290
- Polar fees: ($290 × 0.04) + (10 × $0.40) = $11.60 + $4 = $15.60
- Net: $274.40 per month
- Effective rate: ~5.4% (competitive vs Stripe ~2.9% + $0.30)

**Annual Billing Benefit:**
- $290/year Pro = ~$24.17/month effective
- $790/year Pro+ = ~$65.83/month effective
- Single transaction fee on annual, not monthly
- Higher margin for annual plans

---

## 6. Key Advantages for OpinionScope

✅ **Tax Compliance:** Polar handles VAT, GST, sales tax globally (MoR)
✅ **Fast Setup:** Integrated checkout, no custom billing logic
✅ **Webhook-driven:** Perfect with Inngest workflow
✅ **Developer-friendly:** Excellent docs, Sandbox environment
✅ **Scalable:** Handles growth from 1→10k+ subscribers
✅ **Flexible:** Supports both subscriptions and future one-time purchases
✅ **Convex-native:** No database schema conflicts
✅ **OAuth ready:** Future multi-tenant enterprise features

---

## 7. Integration Considerations

| Item | Detail |
|------|--------|
| **Latency** | Webhook delivery ~100ms-2s (acceptable for non-real-time) |
| **Failure Handling** | Implement webhook signature verification + idempotency keys |
| **Upgrades/Downgrades** | Handled by customer or admin portal—webhook notifies |
| **Churn** | `subscription.canceled` event—store churn timestamp |
| **Revenue Tracking** | Query Polar API for MRR dashboard (optional) |

---

## Unresolved Questions

- Will Polar handle mid-cycle upgrades with proration? (Likely yes, but verify in docs)
- Can annual plans be purchased as gift cards? (Not mentioned in research)
- Enterprise SLA/dedicated support available? (Typical SaaS model, verify pricing)

---

## Next Steps for Planner

1. Create implementation plan with Polar API integration
2. Set up Polar dev account + sandbox
3. Design Convex schema extension for subscription tracking
4. Build checkout redirect component
5. Implement webhook handler in Inngest
6. Test full upgrade flow (free → Pro → Pro+)
