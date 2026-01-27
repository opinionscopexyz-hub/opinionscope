# Phase 5: Verify and Test

## Context Links
- All modules: `convex/scheduling/`
- crons.ts: `packages/backend/convex/crons.ts`
- Convex dashboard: https://dashboard.convex.dev

## Overview
- **Priority**: P1 (critical validation)
- **Status**: DONE (14:26)
- **Estimated Effort**: 30 min

Run full verification: TypeScript compilation, Convex type generation, and manual cron job testing.

## Key Insights
- Convex regenerates `_generated/api.ts` on `convex dev`
- All 8 cron jobs must trigger successfully
- Cross-module imports must resolve correctly

## Requirements

### Functional
- All TypeScript files compile without errors
- Convex generates correct API paths
- All cron jobs execute successfully

### Non-Functional
- No runtime errors
- Sync logs show successful execution

## Verification Steps

### 1. TypeScript Compilation Check

```bash
cd packages/backend
bun run check-types
```

Expected: No errors

### 2. Convex Dev Build

```bash
cd packages/backend
bun run convex dev
```

Expected output should show:
- All scheduling functions registered
- No import errors
- Types generated successfully

### 3. Verify Generated API Types

Check `convex/_generated/api.ts` contains:
```typescript
scheduling: {
  triggerMarketSync: ...
  fetchMarketData: ...
  processMarketSyncResults: ...
  triggerAlertPriceSync: ...
  fetchAlertMarketPrices: ...
  processAlertPriceResults: ...
  triggerWhaleSync: ...
  fetchWhaleActivity: ...
  processWhaleSyncResults: ...
  triggerLeaderboardSync: ...
  fetchLeaderboardData: ...
  processLeaderboardResults: ...
  triggerMarketHoldersSync: ...
  fetchMarketHolders: ...
  processMarketHoldersResults: ...
  computeWhaleStats: ...
  cleanupOldActivity: ...
  markSyncFailed: ...
}
```

### 4. Manual Cron Job Testing

Use Convex dashboard or CLI to trigger each cron:

| Cron | Test Command |
|------|--------------|
| sync-markets | Dashboard: Crons > sync-markets > Run Now |
| sync-alert-prices | Dashboard: Crons > sync-alert-prices > Run Now |
| sync-whale-trades | Dashboard: Crons > sync-whale-trades > Run Now |
| compute-whale-stats | Dashboard: Crons > compute-whale-stats > Run Now |
| cleanup-old-activity | Dashboard: Crons > cleanup-old-activity > Run Now |
| sync-leaderboard-whales | Dashboard: Crons > sync-leaderboard-whales > Run Now |
| sync-market-holders | Dashboard: Crons > sync-market-holders > Run Now |

### 5. Verify Sync Logs

Query syncLogs table for recent entries:
```typescript
// In Convex dashboard > Data
db.query("syncLogs").order("desc").take(10)
```

Expected: Recent entries with `status: "completed"` or `status: "running"`

### 6. Module Line Count Verification

Each module should be under 200 lines:

| Module | Target Lines | Status |
|--------|--------------|--------|
| scheduling.ts (re-export) | < 20 | - |
| scheduling/index.ts | < 60 | - |
| shared/types.ts | < 100 | - |
| shared/constants.ts | < 20 | - |
| shared/helpers.ts | < 40 | - |
| shared/type-guards.ts | < 100 | - |
| market-sync.ts | < 160 | - |
| alert-price-sync.ts | < 180 | - |
| whale-sync.ts | < 190 | - |
| leaderboard-sync.ts | < 120 | - |
| market-holders-sync.ts | < 160 | - |
| stats-computation.ts | < 50 | - |
| cleanup.ts | < 60 | - |

## Troubleshooting

### Issue: Import errors in domain modules

**Symptom**: `Cannot find module './shared/types'`

**Fix**: Verify directory structure and TypeScript paths:
```typescript
// Correct import path
import { MarketApiResponse } from "./shared/types";
```

### Issue: Convex path not found

**Symptom**: `internal.scheduling.triggerMarketSync` undefined

**Fix**: Ensure original scheduling.ts re-exports all functions:
```typescript
export { triggerMarketSync } from "./scheduling/index";
```

### Issue: Circular dependency

**Symptom**: Runtime error on import

**Fix**: Move shared types to shared/types.ts (no Convex imports in shared/)

### Issue: Validator mismatch

**Symptom**: Runtime validation error

**Fix**: Copy validators exactly from original file, don't simplify

## Todo List
- [ ] Run `bun run check-types` - no errors
- [ ] Run `bun run convex dev` - successful build
- [ ] Verify `_generated/api.ts` has all paths
- [ ] Trigger sync-markets cron - verify syncLogs
- [ ] Trigger sync-alert-prices cron - verify syncLogs
- [ ] Trigger sync-whale-trades cron - verify syncLogs
- [ ] Trigger compute-whale-stats cron - verify execution
- [ ] Trigger cleanup-old-activity cron - verify execution
- [ ] Trigger sync-leaderboard-whales cron - verify syncLogs
- [ ] Trigger sync-market-holders cron - verify syncLogs
- [ ] Verify all modules under 200 lines

## Success Criteria
- [ ] All TypeScript compiles
- [ ] Convex dev builds successfully
- [ ] All 8 cron jobs execute
- [ ] syncLogs show completed status
- [ ] Each module under 200 lines
- [ ] No duplicate code

## Risk Assessment
| Issue | Severity | Resolution |
|-------|----------|------------|
| Build failure | High | Check imports, revert if needed |
| Cron failure | High | Check function signatures, API paths |
| Type errors | Medium | Verify type exports from shared/ |

## Rollback Plan

If issues persist:
1. Revert scheduling.ts to original content
2. Delete scheduling/ directory
3. Debug individual module in isolation

## Post-Refactor Cleanup

After successful verification:
1. Update `docs/codebase-summary.md` with new file structure
2. Update `docs/code-standards.md` if patterns changed
3. Consider adding scheduling/ to documentation

## Security Considerations
- Verify API keys still validated
- Confirm no new endpoints exposed

## Next Steps
- Mark plan as completed
- Update documentation
- Monitor cron job health for 24 hours
