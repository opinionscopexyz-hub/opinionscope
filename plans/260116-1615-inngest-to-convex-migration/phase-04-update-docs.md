# Phase 04: Update Documentation

## Context Links
- [Plan Overview](./plan.md)
- [System Architecture](../../docs/system-architecture.md)
- [MVP Plan](../260116-1247-mvp-implementation/plan.md)

## Overview
- **Priority:** P1
- **Status:** ✅ Completed
- **Effort:** 30m
- **Description:** Update all documentation to reflect Convex-native scheduling.
- **Completed:** 2026-01-16T18:00:00Z

## Documents to Update

### 1. System Architecture (`docs/system-architecture.md`)

Update the architecture diagram:

```diff
- Inngest["Inngest<br/>(Background Jobs)"]
+ Convex["Convex<br/>(DB + Crons + Actions)"]
```

Remove Inngest from:
- System overview diagram
- Data flow diagrams
- External integrations section
- Technology justification table

Add Convex scheduling section:
```markdown
### Background Jobs (Convex Native)

**Cron Jobs:**
- Market sync: Every 5 minutes
- Whale sync: Every 1 minute
- Stats compute: Hourly
- Cleanup: Daily at 3 AM UTC

**Components Used:**
- Built-in `cronJobs()` for scheduling
- `@convex-dev/action-retrier` for reliable external API calls

**Pattern:**
Cron → Internal Mutation → Action Retrier → External API → Callback
```

### 2. MVP Plan (`plans/260116-1247-mvp-implementation/plan.md`)

Update tech stack:
```diff
- **Background Jobs:** Inngest
+ **Background Jobs:** Convex Native (cronJobs + action-retrier)
```

Update critical dependencies:
```diff
- 4. Inngest account + event key
```

Update tags:
```diff
- tags: [mvp, opinion-trade, convex, clerk, polar, inngest]
+ tags: [mvp, opinion-trade, convex, clerk, polar]
```

### 3. Phase 04 Data Sync (`plans/260116-1247-mvp-implementation/phase-04-data-sync.md`)

Replace entire implementation with Convex-native approach. Key changes:
- Remove all Inngest references
- Point to new `convex/crons.ts` and `convex/scheduling.ts`
- Update architecture diagram
- Update implementation steps

### 4. Codebase Summary (`docs/codebase-summary.md`)

Update to reflect:
- No Inngest directory in web app
- New crons.ts and scheduling.ts in backend
- action-retrier dependency

## Implementation Steps

### Step 1: Update system-architecture.md

Remove Inngest box from all diagrams. Update "External Integrations" section.

### Step 2: Update MVP plan.md

Change tech stack and remove Inngest from dependencies.

### Step 3: Rewrite phase-04-data-sync.md

Replace Inngest implementation with Convex native pattern.

### Step 4: Update codebase-summary.md

Reflect new file structure.

## Todo List

- [x] Update `docs/system-architecture.md` - remove Inngest, add Convex scheduling
- [x] Update `plans/260116-1247-mvp-implementation/plan.md` - tech stack
- [x] Rewrite `plans/260116-1247-mvp-implementation/phase-04-data-sync.md`
- [x] Update `docs/codebase-summary.md` - added new files
- [x] Update `docs/code-standards.md` - added Convex cron patterns
- [x] Update `docs/README.md` - updated quick links
- [x] Create `docs/deployment-guide.md` - new deployment documentation
- [x] Verify all internal links work

## Success Criteria

- [x] No mention of Inngest in active documentation
- [x] Architecture diagrams show Convex-only stack
- [x] Phase 04 reflects Convex native implementation
- [x] README accurate for background jobs

## Documentation Summary

**Report:** [docs-manager-260116-1800-summary.md](../reports/docs-manager-260116-1800-summary.md)

### Files Updated (4)
- `docs/system-architecture.md` - Added Phase 03 details, syncLogs table
- `docs/codebase-summary.md` - Added crons.ts, scheduling.ts
- `docs/code-standards.md` - Added Convex cron patterns (+180 lines)
- `docs/README.md` - Updated tech stack, deployment guide link

### Files Created (1)
- `docs/deployment-guide.md` - Complete deployment documentation (357 lines)

### Key Documentation
- 4 cron jobs fully documented with schedules
- 3-step handler pattern (mutation → action → mutation)
- Type guard validation patterns
- Rate limiting specifications
- SyncLogs monitoring instructions
- Environment variable reference

## Next Steps

Migration complete! Return to MVP implementation with Phase 05 (Market Screener).
