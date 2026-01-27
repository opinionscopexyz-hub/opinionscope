# OpinionScope Deployment Guide

Production deployment & environment configuration for OpinionScope.

---

## Environment Variables

### Required (All Environments)

**Core Services:**
```bash
# Convex
CONVEX_DEPLOYMENT=prod:your-deployment-id

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_JWT_ISSUER_DOMAIN=https://your-domain.clerk.accounts.com

# Polar Payments (Phase 09)
POLAR_ACCESS_TOKEN=...
POLAR_WEBHOOK_SECRET=whsec_...
POLAR_ORGANIZATION_ID=org_...
POLAR_PRO_MONTHLY_ID=product_...
POLAR_PRO_ANNUAL_ID=product_...
POLAR_PRO_PLUS_MONTHLY_ID=product_...
POLAR_PRO_PLUS_ANNUAL_ID=product_...

# Resend Email (Phase 09)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@opinionscope.xyz
```

### Phase 03: Data Sync (Cron Jobs)

**Opinion.Trade API [REQUIRED for production sync]:**
```bash
OPINION_TRADE_API_KEY=your-api-key-here
```

**Note:** Apply at https://opinion.trade/developers - approval takes 1-2 weeks.

### Optional (Development Only)

```bash
# Local Convex
LOCAL_CONVEX_URL=http://localhost:3210
CONVEX_URL=http://localhost:3210

# Debug logging
DEBUG=opinion-scope:*
```

---

## Configuration Files

### Frontend (.env.local)

```bash
# apps/web/.env.local

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### Backend (.env.local)

```bash
# packages/backend/.env.local

# Opinion.Trade API [Phase 03]
OPINION_TRADE_API_KEY=your-api-key-here

# Clerk JWT validation
CLERK_JWT_ISSUER_DOMAIN=https://your-domain.clerk.accounts.com
```

---

## Deployment Steps

### 1. Convex Deployment (Backend)

**Prerequisites:**
- Convex account created
- Deployment ID generated

**Deploy Schema & Functions:**
```bash
cd packages/backend
bun run deploy
```

**Verify Cron Jobs Registered:**
```bash
convex functions list
```

Expected output:
```
crons.ts:
  - sync-markets (interval: 5 minutes)
  - sync-whale-trades (interval: 1 minute)
  - compute-whale-stats (hourly)
  - cleanup-old-activity (daily @ 3 AM UTC)
```

**Check Sync Logs:**
```bash
convex query syncLogs.list
```

### 2. Frontend Deployment (Next.js)

**Option A: Vercel (Recommended)**
```bash
# Login to Vercel
vercel login

# Deploy
cd apps/web
vercel deploy --prod
```

**Configure Environment Variables in Vercel Dashboard:**
- Add all `.env.local` variables as secrets
- Set Region: US (or closest to users)

**Option B: Self-Hosted**
```bash
cd apps/web
bun run build
bun run start
```

---

## Post-Deployment Verification

### 1. Cron Job Health

**Check last sync run:**
```bash
curl -X POST https://your-deployment.convex.cloud/health/sync-status \
  -H "Authorization: Bearer $CONVEX_API_KEY"
```

**Monitor syncLogs table:**
- Access Convex dashboard
- Navigate to syncLogs
- Verify entries exist (status: "completed" or "failed")

### 2. Data Flow Validation

**Test Market Sync:**
```typescript
// In Convex console
await db.query("syncLogs").eq("type", "markets").order("desc").first()
```

**Verify market data populated:**
```typescript
const markets = await db.query("markets").take(5)
console.log(markets.length) // Should be > 0
```

### 3. Alert System Check

**Verify whale tracking enabled:**
```typescript
const whales = await db.query("whales").take(1).collect()
// If empty, add test whales first
```

---

## Cron Job Configuration (Phase 03)

### Schedules

| Job | Frequency | Time | Purpose |
|-----|-----------|------|---------|
| `sync-markets` | Every 5 min | Any | Fetch market listings |
| `sync-whale-trades` | Every 1 min | Any | Poll whale wallets |
| `compute-whale-stats` | Hourly | :00 UTC | Aggregate trade stats |
| `cleanup-old-activity` | Daily | 03:00 UTC | Delete records > 90 days |

### Error Recovery

**Automatic Retry Logic:**
- Failed actions retry with exponential backoff (via action-retrier)
- Max retries: 3 attempts
- Backoff: 1s → 2s → 4s

**Manual Retry:**
```typescript
// In Convex mutations
const syncId = args.syncId
await retrier.run(ctx, internal.scheduling.fetchMarketData, { syncId })
```

### Monitoring SyncLogs

**Fields:**
- `type`: "markets", "whales", "stats"
- `status`: "running", "completed", "failed"
- `startedAt`: Timestamp (ms)
- `endedAt`: Timestamp (ms) - undefined if still running
- `itemCount`: Records processed (optional)
- `error`: Error message (optional)

**Query recent syncs:**
```typescript
const recent = await db
  .query("syncLogs")
  .order("desc")
  .take(10)
  .collect()
```

---

## Troubleshooting

### Cron Job Not Running

**Check 1: Deployment registered**
```bash
convex functions list | grep sync
```

**Check 2: Convex Cloud status**
- Visit https://status.convex.dev
- Verify no active incidents

**Check 3: Error in syncLogs**
```typescript
const failed = await db
  .query("syncLogs")
  .eq("status", "failed")
  .take(1)
  .collect()
console.log(failed[0].error)
```

### API Key Issues

**Error:** "OPINION_TRADE_API_KEY not configured"
- Verify `.env.local` in `packages/backend/`
- Restart Convex dev server: `bun run dev:setup`
- For Convex Cloud, check environment variables in dashboard

**Error:** "API error: 401"
- API key expired or invalid
- Regenerate at https://opinion.trade/settings/api

### Rate Limiting (Opinion.Trade)

**Symptom:** Market/whale sync fails intermittently
- Current limit: 15 requests/second
- Whale sync batches at 5 per batch with 1s delay
- Market sync runs every 5 minutes

**Solution:**
- Increase batch interval or reduce batch size in `scheduling.ts`
- Contact Opinion.Trade for higher limits

---

## Rollback Procedures

### Revert Cron Job Changes

```bash
# Check git history
git log --oneline packages/backend/convex/crons.ts

# Revert to previous version
git checkout <commit-hash> packages/backend/convex/crons.ts

# Redeploy
cd packages/backend && bun run deploy
```

### Reset SyncLogs

```typescript
// WARNING: Destructive operation - audit before running
const logs = await db.query("syncLogs").collect()
for (const log of logs) {
  await db.delete(log._id)
}
```

---

## Scaling Considerations

### Cron Job Load

**Current volumes:**
- Market sync: 1 call/5min (288/day)
- Whale sync: ~1 call/whale/min (scales with tracked whales)
- Stats computation: 1 call/hour (computes all whales)
- Cleanup: 1 call/day (batch deletes)

**Projected limits (before optimization):**
- 1,000 whales: ~1,000 whale sync calls/min → needs batching
- Already batched: 5 whales/batch → ~200 requests/min

### Database Growth

**SyncLogs retention:** 90 days
- At 1,000 syncs/day → ~90,000 records
- Daily cleanup job maintains this cap

**WhaleActivity retention:** 90 days
- Depends on active whales & trade frequency
- Batch cleanup: 500 records per execution

---

## Security Notes

### API Keys

- Store in `.env.local` (not committed to git)
- Use `.gitignore` to prevent accidental commits
- Rotate Opinion.Trade API key quarterly
- Never commit Clerk/Polar keys

### Rate Limiting

- Implemented in whale sync: 5 wallets/batch, 1s delay
- Prevents Opinion.Trade API throttling
- Future: Add request queuing for scale

### Data Validation

- All API responses validated via type guards
- Invalid records skipped (logged, sync continues)
- No partial updates to database

---

## Monitoring & Alerts (Future)

**TODO:**
- [ ] Set up Sentry for error tracking
- [ ] Add CloudFlare analytics
- [ ] Slack alerts for failed syncs
- [ ] Dashboard for sync metrics

---

**Last Updated:** January 16, 2026 (Phase 03)
**Version:** 1.0 (Initial)
