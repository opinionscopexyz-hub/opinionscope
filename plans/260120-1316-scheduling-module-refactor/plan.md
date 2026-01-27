---
title: "Refactor scheduling.ts into Domain-Focused Modules"
description: "Split 1,406-line god module into ~7 focused modules for maintainability"
status: completed
priority: P2
effort: 4h
branch: master
tags: [refactor, convex, scheduling, modularity]
created: 2026-01-20
last-updated: 2026-01-20
---

# Refactor scheduling.ts into Domain-Focused Modules

## Overview

The `packages/backend/convex/scheduling.ts` file has grown to 1,406 lines containing 6 distinct sync domains. This plan breaks it into smaller, focused modules under `convex/scheduling/` while preserving all Convex internal API paths.

## Current State Analysis

| Domain | Lines | Functions |
|--------|-------|-----------|
| Shared (constants, helpers, types) | ~220 | 6 helpers, 10 interfaces, 5 type guards |
| Market Sync | ~230 | 4 functions |
| Alert Price Sync | ~250 | 4 functions |
| Whale Sync | ~260 | 3 functions |
| Leaderboard Sync | ~115 | 3 functions |
| Market Holders Sync | ~225 | 5 functions |
| Stats & Cleanup | ~75 | 3 functions |

## Target Structure

```
convex/scheduling/
├── index.ts                      # Re-exports all functions (preserves internal.scheduling.*)
├── shared/
│   ├── types.ts                  # API response interfaces (~80 lines)
│   ├── constants.ts              # Batch sizes, URLs, delays (~15 lines)
│   ├── helpers.ts                # getApiBaseUrl, validateApiKey, delay (~30 lines)
│   └── type-guards.ts            # Validators (~80 lines)
├── market-sync.ts                # Market sync domain (~150 lines)
├── alert-price-sync.ts           # Alert price domain (~170 lines)
├── whale-sync.ts                 # Whale sync domain (~180 lines)
├── leaderboard-sync.ts           # Leaderboard domain (~100 lines)
├── market-holders-sync.ts        # Market holders domain (~150 lines)
├── stats-computation.ts          # computeWhaleStats (~40 lines)
└── cleanup.ts                    # cleanupOldActivity, markSyncFailed (~50 lines)
```

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| [Phase 1](./phase-01-create-shared-modules.md) | Create shared/ directory with types, constants, helpers, type-guards | ✅ Done |
| [Phase 2](./phase-02-extract-cleanup-and-stats.md) | Extract cleanup.ts and stats-computation.ts (low dependency) | ✅ Done |
| [Phase 3](./phase-03-extract-sync-domains.md) | Extract 5 sync domain modules | ✅ Done |
| [Phase 4](./phase-04-create-barrel-export.md) | Create index.ts barrel, update original scheduling.ts | ✅ Done (14:10) |
| [Phase 5](./phase-05-verify-and-test.md) | Run convex dev, verify paths, test all cron jobs | ✅ Done (14:26) |

## Critical Requirements

1. **Preserve API Paths**: All `internal.scheduling.*` paths must work unchanged
2. **Module Size**: Each file 100-200 lines max
3. **Backward Compatibility**: Original `scheduling.ts` becomes re-export barrel
4. **No Functionality Changes**: Pure structural refactor

## Dependencies

- Convex internal API generation
- Action-retrier integration
- crons.ts references to scheduling functions

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking internal API paths | Keep original scheduling.ts as re-export |
| Circular dependencies | Shared/ contains only types/helpers (no Convex functions) |
| Cron job failures | Test each cron trigger after refactor |

## Success Criteria

- [ ] All 8 cron jobs execute successfully
- [ ] `convex dev` compiles without errors
- [ ] Each module under 200 lines
- [ ] No duplicate code across modules
- [ ] TypeScript types properly imported across modules
