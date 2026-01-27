# Brainstorm: Inngest vs Convex Scheduling

**Date:** 2026-01-16
**Decision:** ✅ Migrate to Convex-only (drop Inngest)

---

## Problem Statement

Project has Inngest in architecture for background jobs (market sync, whale tracking, alerts). Question: is Inngest needed when Convex has native scheduling?

## Evaluated Approaches

### Option A: Keep Inngest (Current Plan)
**Pros:**
- Already documented in phase-04
- Mature workflow engine
- Good observability dashboard

**Cons:**
- Extra service to manage
- Cross-service latency
- Separate auth/config
- Higher complexity

### Option B: Convex-Only ✅ SELECTED
**Pros:**
- Single platform
- Transactional consistency
- Lower latency
- Simpler stack
- $0 extra cost
- One dashboard

**Cons:**
- Need to install components
- Slightly different API patterns

---

## Convex Components Required

| Component | Purpose | Weekly Downloads |
|-----------|---------|-----------------|
| `@convex-dev/workflow` | Durable multi-step workflows | 16K |
| `@convex-dev/workpool` | Priority queues, concurrency | 42K |
| `@convex-dev/crons` | Scheduled jobs | 4K |
| `@convex-dev/action-retrier` | External API retry | 13K |
| `@convex-dev/rate-limiter` | Rate limiting | 29K |
| `@convex-dev/resend` | Email notifications | 22K |

---

## Migration Tasks

### Remove
- [ ] Delete `apps/web/src/lib/inngest/` directory
- [ ] Delete `apps/web/src/app/api/inngest/route.ts`
- [ ] Remove `inngest` from `package.json`
- [ ] Remove `INNGEST_*` env vars
- [ ] Update `docs/system-architecture.md`

### Add
- [ ] Install `@convex-dev/workflow`
- [ ] Install `@convex-dev/workpool`
- [ ] Install `@convex-dev/crons` (or use built-in)
- [ ] Install `@convex-dev/action-retrier`
- [ ] Create `packages/backend/convex/crons.ts`
- [ ] Create workflow definitions in Convex

### Update
- [ ] Rewrite `phase-04-data-sync.md` for Convex patterns
- [ ] Update system architecture diagram
- [ ] Update codebase-summary.md

---

## New Architecture

```
Data Flow (Convex-Only):
┌─────────────────┐     ┌─────────────────┐
│ Opinion.Trade   │     │     Convex      │
│     API         │◄────│   (Crons +      │
└─────────────────┘     │   Workflows +   │
                        │   Database)     │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   Web Client    │
                        │  (Real-time)    │
                        └─────────────────┘
```

### Cron Jobs (Convex Native)
```typescript
// packages/backend/convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("sync-markets", { minutes: 5 }, internal.sync.syncMarkets);
crons.interval("sync-whale-trades", { minutes: 1 }, internal.sync.syncWhaleTrades);
crons.interval("compute-whale-stats", { hours: 1 }, internal.sync.computeWhaleStats);
crons.daily("cleanup-old-activity", { hourUTC: 3 }, internal.sync.cleanupOldActivity);

export default crons;
```

---

## Success Criteria

- [ ] All scheduled jobs run on Convex
- [ ] No Inngest dependencies in codebase
- [ ] Data sync works same as before
- [ ] Alert processing works with Convex workflows
- [ ] Single dashboard for monitoring

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Learning curve | Low | Convex docs well documented |
| Migration bugs | Medium | Test thoroughly before removing Inngest |
| Missing feature | Low | Convex components are mature (high download counts) |

---

## Next Steps

1. Update phase-04 plan with Convex-native approach
2. Remove Inngest files and dependencies
3. Install Convex components
4. Implement crons and workflows
5. Update architecture docs
