# Phase 1: Create Shared Modules

## Context Links
- Source: `packages/backend/convex/scheduling.ts` (lines 7-223)
- Code Standards: `docs/code-standards.md`

## Overview
- **Priority**: P1 (foundational for other phases)
- **Status**: ✅ Done (2026-01-20)
- **Estimated Effort**: 45 min

Extract shared types, constants, helpers, and type guards into `convex/scheduling/shared/` directory. These have no Convex function dependencies and serve as foundation for domain modules.

## Key Insights
- All interfaces and type guards are pure TypeScript (no Convex imports needed)
- Constants and helpers have no external dependencies except `process.env`
- Type guards validate API responses before processing

## Requirements

### Functional
- Extract all interfaces to `shared/types.ts`
- Extract constants to `shared/constants.ts`
- Extract helper functions to `shared/helpers.ts`
- Extract type guards to `shared/type-guards.ts`

### Non-Functional
- Each file under 100 lines
- Proper TypeScript exports
- No circular dependencies

## Architecture

```
convex/scheduling/shared/
├── types.ts        # All API response interfaces
├── constants.ts    # WHALE_BATCH_SIZE, URLs, delays
├── helpers.ts      # getApiBaseUrl, validateApiKey, delay
└── type-guards.ts  # isValidMarketResponse, isValidTradeResponse, etc.
```

## Related Code Files

### Files to Create
- `packages/backend/convex/scheduling/shared/types.ts`
- `packages/backend/convex/scheduling/shared/constants.ts`
- `packages/backend/convex/scheduling/shared/helpers.ts`
- `packages/backend/convex/scheduling/shared/type-guards.ts`

### Files to Modify
- None (extraction only, original scheduling.ts modified in Phase 4)

## Implementation Steps

### 1. Create directory structure
```bash
mkdir -p packages/backend/convex/scheduling/shared
```

### 2. Create `shared/constants.ts` (~15 lines)
Extract from lines 7-13:
```typescript
// Batch sizes and rate limiting
export const WHALE_BATCH_SIZE = 5;
export const LEADERBOARD_PROXY_URL = "https://proxy.opinion.trade:8443/api/bsc/api/v2";
export const BATCH_DELAY_MS = 1000;
export const CLEANUP_BATCH_SIZE = 500;
export const TOKEN_BATCH_SIZE = 10;
export const TOKEN_BATCH_DELAY_MS = 100;
export const MARKET_HOLDERS_BATCH_SIZE = 5;
export const HOLDERS_PER_MARKET = 100;
export const RETENTION_DAYS = 90;
```

### 3. Create `shared/helpers.ts` (~30 lines)
Extract from lines 14-30, 220-223:
```typescript
export function getApiBaseUrl(): string { ... }
export function validateApiKey(): string { ... }
export function delay(ms: number): Promise<void> { ... }
```

### 4. Create `shared/types.ts` (~80 lines)
Extract all interfaces:
- `MarketApiResponse` (lines 33-58)
- `ChildMarketApiResponse` (lines 60-80)
- `FlattenedMarket` (lines 82-100)
- `TradeApiResponse` (lines 113-136)
- `ApiBaseResponse<T>` (lines 148-153)
- `PaginatedResult<T>` (lines 155-158)
- `LeaderboardTrader` (lines 162-169)
- `LeaderboardApiResponse` (lines 171-176)
- `MarketHolder` (lines 195-201)
- `HolderApiResponse` (lines 203-208)
- `TokenPriceResponse` (lines 465-471)

### 5. Create `shared/type-guards.ts` (~80 lines)
Extract all validation functions:
- `isValidMarketResponse` (lines 102-111)
- `isValidTradeResponse` (lines 138-146)
- `isValidLeaderboardTrader` (lines 178-188)
- `isValidHolder` (lines 210-218)
- `isValidPriceResponse` (lines 473-481)

Import types from `./types.ts` for type guard return types.

## Todo List
- [x] Create `convex/scheduling/shared/` directory
- [x] Create `constants.ts` with all batch sizes and URLs (22 lines, with `as const`)
- [x] Create `helpers.ts` with utility functions (34 lines)
- [x] Create `types.ts` with all API response interfaces (151 lines)
- [x] Create `type-guards.ts` with all validators (87 lines)
- [x] Create `index.ts` barrel export for cleaner imports (40 lines)
- [x] Verify TypeScript compilation

## Success Criteria
- All shared files compile without errors
- No Convex imports in shared/ directory
- Each file under 100 lines
- All exports are properly typed

## Risk Assessment
- **Low risk**: No runtime changes, pure extraction
- Mitigation: Verify imports work in isolation

## Security Considerations
- `validateApiKey()` throws on missing key (preserve behavior)
- No secrets stored in code

## Next Steps
- Phase 2 will import from shared/ modules
- Original scheduling.ts unchanged until Phase 4
