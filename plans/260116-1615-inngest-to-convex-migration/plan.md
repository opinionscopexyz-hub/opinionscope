---
title: "Inngest to Convex Native Scheduling Migration"
description: "Remove Inngest dependency and migrate to Convex native cronJobs + action-retrier"
status: completed
priority: P0
effort: 4h
branch: master
tags: [migration, inngest, convex, scheduling, crons]
created: 2026-01-16
updated: 2026-01-16T18:00:00Z
---

# Inngest to Convex Native Scheduling Migration

## Overview

Migrate background job scheduling from Inngest (external service) to Convex native solutions (cronJobs + @convex-dev/action-retrier). Simplifies stack, reduces latency, removes external dependency.

## Research Reports

- [Convex Scheduling Research](../reports/researcher-260116-1615-convex-scheduling.md)
- [Brainstorm Decision](../reports/brainstorm-260116-1615-inngest-vs-convex-scheduling.md)

## Phase Overview

| Phase | Title | Priority | Effort | Status |
|-------|-------|----------|--------|--------|
| 01 | [Remove Inngest](./phase-01-remove-inngest.md) | P0 | 30m | ✅ Completed |
| 02 | [Add Convex Components](./phase-02-add-convex-components.md) | P0 | 1h | ✅ Completed |
| 03 | [Implement Cron Jobs](./phase-03-implement-crons.md) | P0 | 2h | ✅ Completed |
| 04 | [Update Documentation](./phase-04-update-docs.md) | P1 | 30m | ✅ Completed |

## Key Changes

### Remove
- `apps/web/src/lib/inngest/` directory
- `apps/web/src/app/api/inngest/route.ts`
- `inngest` package from web/package.json
- `INNGEST_*` env vars

### Add
- `@convex-dev/action-retrier` package
- `packages/backend/convex/crons.ts`
- `packages/backend/convex/scheduling.ts`
- Updated `convex.config.ts`

## Architecture Change

```
BEFORE (Inngest):
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Opinion.Trade│◄────│   Inngest   │◄────│   Convex    │
│     API     │     │  (External) │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘

AFTER (Convex Native):
┌─────────────┐     ┌─────────────────────────────────┐
│ Opinion.Trade│◄────│           Convex               │
│     API     │     │  (Crons + Actions + Database)  │
└─────────────┘     └─────────────────────────────────┘
```

## Success Criteria

- [ ] No Inngest dependencies in codebase
- [ ] All 4 cron jobs running on Convex
- [ ] External API calls use action-retrier with backoff
- [ ] Documentation updated
- [ ] Tests passing

## Risk Summary

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration breaks sync | Medium | Test locally first |
| Different retry behavior | Low | Configure action-retrier to match Inngest |
