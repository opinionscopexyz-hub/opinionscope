# Phase 01: Add Token IDs to Schema

## Context Links
- Parent: [plan.md](./plan.md)
- Docs: [code-standards.md](../../docs/code-standards.md)
- API: [Opinion.Trade Token API](https://docs.opinion.trade/developer-guide/opinion-open-api/token)

## Overview
- **Priority:** P1 (Blocking)
- **Status:** ✅ DONE (2026-01-19 16:53)
- **Description:** Add `yesTokenId` and `noTokenId` fields to markets schema and update market sync to store them

## Key Insights
- Market API response already includes `yesTokenId` and `noTokenId` (see `scheduling.ts:43-44`)
- Schema currently missing these fields - prices set to 0.5 placeholder
- Token IDs are required to call `/token/latest-price` endpoint

## Requirements

### Functional
- Markets table stores `yesTokenId` and `noTokenId`
- Market sync populates token IDs from API response
- Existing markets get token IDs on next sync

### Non-Functional
- No downtime during migration
- Backward compatible (fields optional)

## Architecture

```
markets table:
+ yesTokenId: v.optional(v.string())  // Opinion.Trade yes token ID
+ noTokenId: v.optional(v.string())   // Opinion.Trade no token ID
```

## Related Code Files

### To Modify
- `packages/backend/convex/schema.ts` - Add token ID fields
- `packages/backend/convex/scheduling.ts` - Store token IDs in upsert

### Reference
- `packages/backend/convex/markets.ts` - upsertMarket mutation

## Implementation Steps

1. **Update schema.ts**
   - Add `yesTokenId: v.optional(v.string())` to markets table
   - Add `noTokenId: v.optional(v.string())` to markets table

2. **Update markets.ts upsertMarket mutation**
   - Add `yesTokenId` and `noTokenId` to args validator
   - Include in insert/patch operations

3. **Update scheduling.ts processMarketSyncResults**
   - Pass `yesTokenId` and `noTokenId` from API response to upsertMarket
   - Map from `market.yesTokenId` and `market.noTokenId`

4. **Deploy and verify**
   - Push schema changes
   - Trigger manual market sync
   - Verify token IDs populated in DB

## Todo List

- [x] Add yesTokenId field to markets schema
- [x] Add noTokenId field to markets schema
- [x] Update upsertMarket mutation args
- [x] Update processMarketSyncResults to pass token IDs
- [x] Deploy schema changes
- [x] Verify token IDs populated after sync

## Success Criteria

- [x] Schema deployed without errors
- [x] Markets have yesTokenId and noTokenId after sync
- [x] No breaking changes to existing queries (fields are optional)
- [x] Token IDs match API response format (validated in code review)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Schema migration fails | Low | High | Fields are optional, no breaking change |
| API doesn't return token IDs | Low | Medium | Type guard validates response |

## Security Considerations
- Token IDs are public blockchain data, no PII concerns
- No auth changes required

## Review Notes
- **Initial Review:** [code-reviewer-260119-1642-phase-01-token-ids.md](../reports/code-reviewer-260119-1642-phase-01-token-ids.md) - Score: 8.5/10
- **Re-Review:** [code-reviewer-260119-1650-phase-01-re-review.md](../reports/code-reviewer-260119-1650-phase-01-re-review.md) - Score: 9.5/10
- **Status:** ✅ APPROVED - Previous type error fixed (stale .next cache), ready for deployment
- **Scope Note:** Additional refactoring acceptable (API spec alignment, env config best practices)

## Next Steps
1. ✅ Type error resolved (cleared .next cache)
2. ✅ Schema changes deployed to Convex
3. ✅ Manual market sync triggered - token IDs verified in DB
4. Phase 02: Create token price fetch action using stored token IDs
