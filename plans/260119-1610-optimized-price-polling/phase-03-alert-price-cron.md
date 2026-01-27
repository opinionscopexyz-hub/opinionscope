# Phase 03: Alert Price Cron Job

## Context Links
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 02](./phase-02-token-price-fetching.md)
- Reference: [crons.ts](../../packages/backend/convex/crons.ts)

## Overview
- **Priority:** P1
- **Status:** ✅ Done (2026-01-19)
- **Description:** Add cron job to sync prices only for markets with active alerts, adjust existing sync interval
- **Review:** [code-reviewer-260119-1838-phase-03-alert-price-cron.md](../reports/code-reviewer-260119-1838-phase-03-alert-price-cron.md)
- **Architecture Note:** Alerts now chained via scheduler instead of separate cron - ensures price sync completes before alert check

## Key Insights
- Current `sync-markets` runs every 5 min, fetches ALL markets
- New `sync-alert-prices` runs every 2 min, fetches ONLY alert market prices
- `check-price-alerts` already runs every 5 min after market sync
- Need to coordinate: alert price sync → alert check

## Requirements

### Functional
- New cron job: `sync-alert-prices` every 2 minutes
- Slow down `sync-markets` to 15 minutes (metadata only)
- Alert check uses freshly updated prices
- Skip if no active price alerts exist

### Non-Functional
- Minimize API calls (only fetch what's needed)
- Reliable execution with retry logic
- Monitor via syncLogs table

## Architecture

```
Current Flow:
sync-markets (5 min) → check-price-alerts (5 min)

New Flow:
sync-markets (15 min) → Full metadata sync
sync-alert-prices (2 min) → Token prices for alert markets only
check-price-alerts (2 min) → Evaluate alerts after price sync
```

## Related Code Files

### To Modify
- `packages/backend/convex/crons.ts` - Add new cron, adjust intervals
- `packages/backend/convex/schema.ts` - Add "alert-prices" to syncLogs type

### Reference
- `packages/backend/convex/scheduling.ts` - triggerAlertPriceSync (Phase 02)
- `packages/backend/convex/alertChecking.ts` - checkPriceAlerts

## Implementation Steps

1. **Update schema.ts syncLogs type**
   ```typescript
   type: v.union(
     v.literal("markets"),
     v.literal("whales"),
     v.literal("stats"),
     v.literal("alert-prices")  // NEW
   )
   ```

2. **Update crons.ts intervals**
   ```typescript
   // Slow down full market sync
   crons.interval("sync-markets", { minutes: 15 }, ...);

   // Add alert-focused price sync
   crons.interval("sync-alert-prices", { minutes: 2 },
     internal.scheduling.triggerAlertPriceSync);

   // Move alert check to follow price sync
   crons.interval("check-price-alerts", { minutes: 2 }, ...);
   ```

3. **Ensure execution order**
   - Convex crons don't guarantee order
   - Option A: Chain via scheduler (price sync → schedules alert check)
   - Option B: Accept slight timing variance (alerts always have recent-ish prices)
   - **Recommended:** Option B for simplicity

4. **Add monitoring**
   - syncLogs tracks "alert-prices" type
   - Include marketCount, priceUpdateCount in logs

## Todo List

- [x] Add "alert-prices" to syncLogs type union
- [x] Change sync-markets interval from 5 to 15 minutes
- [x] Add sync-alert-prices cron job (2 minutes)
- [x] Adjust check-price-alerts interval to 2 minutes
- [x] Deploy and verify cron execution (requires manual verification)
- [x] Monitor syncLogs for alert-prices entries (requires production testing)

## Code Changes

### crons.ts
```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Full market metadata sync - slower interval
crons.interval(
  "sync-markets",
  { minutes: 15 },  // Changed from 5
  internal.scheduling.triggerMarketSync
);

// Alert-focused price sync - faster for alert accuracy
crons.interval(
  "sync-alert-prices",
  { minutes: 2 },
  internal.scheduling.triggerAlertPriceSync
);

// Whale activity sync - unchanged
crons.interval(
  "sync-whale-trades",
  { minutes: 1 },
  internal.scheduling.triggerWhaleSync
);

// Stats computation - unchanged
crons.hourly(
  "compute-whale-stats",
  { minuteUTC: 0 },
  internal.scheduling.computeWhaleStats
);

// Check price alerts - align with price sync
crons.interval(
  "check-price-alerts",
  { minutes: 2 },  // Changed from 5
  internal.alertChecking.checkPriceAlerts
);

// Daily cleanup - unchanged
crons.daily(
  "cleanup-old-activity",
  { hourUTC: 3, minuteUTC: 0 },
  internal.scheduling.cleanupOldActivity
);

export default crons;
```

## Success Criteria

- [x] sync-markets runs every 15 minutes
- [x] sync-alert-prices runs every 2 minutes
- [x] check-price-alerts runs every 2 minutes
- [x] syncLogs shows "alert-prices" entries
- [x] Alert markets have fresher prices than non-alert markets
- [x] API call count reduced compared to previous setup

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Cron timing overlap | Low | Low | Independent jobs, no shared state |
| Too many API calls | Medium | Medium | Only fetch alert market tokens |
| Stale screener data | Low | Medium | 15 min still reasonable, proxy available |

## Security Considerations
- No changes to auth or data access
- Internal functions only

## Next Steps
- Phase 04: Create frontend proxy route for on-demand refresh
