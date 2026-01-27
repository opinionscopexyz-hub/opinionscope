# Phase 3: Extract Sync Domain Modules

## Context Links
- Source: `packages/backend/convex/scheduling.ts`
- Shared modules: `convex/scheduling/shared/`
- Phase 1: `./phase-01-create-shared-modules.md`
- Phase 2: `./phase-02-extract-cleanup-and-stats.md`

## Overview
- **Priority**: P1
- **Status**: ✅ Done (2026-01-20)
- **Estimated Effort**: 90 min

Extract 5 sync domain modules. Each domain contains trigger mutation, fetch action, and process mutation functions.

## Key Insights
- Each domain follows same pattern: trigger → fetch (action) → process
- All use `internal.scheduling.markSyncFailed` for error handling
- All use `retrier.run()` from `lib/retrier` for action retry
- Cross-domain dependencies: None (each domain is independent)

## Requirements

### Functional
- Extract market-sync.ts (4 functions)
- Extract alert-price-sync.ts (4 functions)
- Extract whale-sync.ts (3 functions)
- Extract leaderboard-sync.ts (3 functions)
- Extract market-holders-sync.ts (5 functions)

### Non-Functional
- Each file 100-200 lines
- Consistent import structure
- Preserve all Convex validators exactly

## Architecture

```
convex/scheduling/
├── market-sync.ts          # triggerMarketSync, flattenMarkets, fetchMarketData, processMarketSyncResults
├── alert-price-sync.ts     # triggerAlertPriceSync, fetchTokenPrice, fetchAlertMarketPrices, processAlertPriceResults
├── whale-sync.ts           # triggerWhaleSync, fetchWhaleActivity, processWhaleSyncResults
├── leaderboard-sync.ts     # triggerLeaderboardSync, fetchLeaderboardData, processLeaderboardResults
└── market-holders-sync.ts  # triggerMarketHoldersSync, fetchHoldersForSide, updateHolderMap, fetchMarketHolders, processMarketHoldersResults
```

## Related Code Files

### Files to Create
- `packages/backend/convex/scheduling/market-sync.ts`
- `packages/backend/convex/scheduling/alert-price-sync.ts`
- `packages/backend/convex/scheduling/whale-sync.ts`
- `packages/backend/convex/scheduling/leaderboard-sync.ts`
- `packages/backend/convex/scheduling/market-holders-sync.ts`

## Implementation Steps

### 1. Create `market-sync.ts` (~150 lines)

**Source**: Lines 227-457

**Functions to extract**:
- `triggerMarketSync` (internalMutation)
- `flattenMarkets` (helper function)
- `fetchMarketData` (internalAction)
- `processMarketSyncResults` (internalMutation)

**Template structure**:
```typescript
import { v } from "convex/values";
import { internalMutation, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { retrier } from "../lib/retrier";
import { getApiBaseUrl, validateApiKey, delay } from "./shared/helpers";
import type { MarketApiResponse, FlattenedMarket, ApiBaseResponse, PaginatedResult } from "./shared/types";
import { isValidMarketResponse } from "./shared/type-guards";

// Helper: flattenMarkets (not exported, internal to this module)
function flattenMarkets(apiMarkets: MarketApiResponse[]): FlattenedMarket[] { ... }

export const triggerMarketSync = internalMutation({ ... });
export const fetchMarketData = internalAction({ ... });
export const processMarketSyncResults = internalMutation({ ... });
```

**Import note**: Uses `internal.scheduling.markSyncFailed` - will work via barrel export.

### 2. Create `alert-price-sync.ts` (~170 lines)

**Source**: Lines 459-706

**Functions to extract**:
- `fetchTokenPrice` (async helper)
- `triggerAlertPriceSync` (internalMutation)
- `fetchAlertMarketPrices` (internalAction)
- `processAlertPriceResults` (internalMutation)

**Template structure**:
```typescript
import { v } from "convex/values";
import { internalMutation, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { retrier } from "../lib/retrier";
import { getApiBaseUrl, validateApiKey, delay } from "./shared/helpers";
import { TOKEN_BATCH_SIZE, TOKEN_BATCH_DELAY_MS } from "./shared/constants";
import type { ApiBaseResponse, TokenPriceResponse } from "./shared/types";
import { isValidPriceResponse } from "./shared/type-guards";

// Helper: fetchTokenPrice (not exported)
async function fetchTokenPrice(tokenId: string, apiKey: string): Promise<number | null> { ... }

export const triggerAlertPriceSync = internalMutation({ ... });
export const fetchAlertMarketPrices = internalAction({ ... });
export const processAlertPriceResults = internalMutation({ ... });
```

**Chain note**: `processAlertPriceResults` calls `internal.alertChecking.checkPriceAlerts` via scheduler.

### 3. Create `whale-sync.ts` (~180 lines)

**Source**: Lines 708-968

**Functions to extract**:
- `triggerWhaleSync` (internalMutation)
- `fetchWhaleActivity` (internalAction)
- `processWhaleSyncResults` (internalMutation)

**Template structure**:
```typescript
import { v } from "convex/values";
import { internalMutation, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { retrier } from "../lib/retrier";
import { getApiBaseUrl, validateApiKey, delay } from "./shared/helpers";
import { WHALE_BATCH_SIZE, BATCH_DELAY_MS } from "./shared/constants";
import type { ApiBaseResponse, PaginatedResult, TradeApiResponse } from "./shared/types";
import { isValidTradeResponse } from "./shared/type-guards";

export const triggerWhaleSync = internalMutation({ ... });
export const fetchWhaleActivity = internalAction({ ... });
export const processWhaleSyncResults = internalMutation({ ... });
```

### 4. Create `leaderboard-sync.ts` (~100 lines)

**Source**: Lines 1066-1180

**Functions to extract**:
- `triggerLeaderboardSync` (internalMutation)
- `fetchLeaderboardData` (internalAction)
- `processLeaderboardResults` (internalMutation)

**Template structure**:
```typescript
import { v } from "convex/values";
import { internalMutation, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { retrier } from "../lib/retrier";
import { LEADERBOARD_PROXY_URL } from "./shared/constants";
import type { LeaderboardApiResponse } from "./shared/types";
import { isValidLeaderboardTrader } from "./shared/type-guards";

export const triggerLeaderboardSync = internalMutation({ ... });
export const fetchLeaderboardData = internalAction({ ... });
export const processLeaderboardResults = internalMutation({ ... });
```

### 5. Create `market-holders-sync.ts` (~150 lines)

**Source**: Lines 1182-1405

**Functions to extract**:
- `fetchHoldersForSide` (async helper)
- `updateHolderMap` (helper)
- `triggerMarketHoldersSync` (internalMutation)
- `fetchMarketHolders` (internalAction)
- `processMarketHoldersResults` (internalMutation)

**Template structure**:
```typescript
import { v } from "convex/values";
import { internalMutation, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { retrier } from "../lib/retrier";
import { delay } from "./shared/helpers";
import { LEADERBOARD_PROXY_URL, MARKET_HOLDERS_BATCH_SIZE, HOLDERS_PER_MARKET, BATCH_DELAY_MS } from "./shared/constants";
import type { MarketHolder, HolderApiResponse } from "./shared/types";
import { isValidHolder } from "./shared/type-guards";

// Helper: fetchHoldersForSide (not exported)
async function fetchHoldersForSide(marketId: string, side: "yes" | "no"): Promise<MarketHolder[]> { ... }

// Helper: updateHolderMap (not exported)
function updateHolderMap(
  map: Map<string, { walletAddress: string; userName: string; avatar: string; totalProfit: number }>,
  holder: MarketHolder
): void { ... }

export const triggerMarketHoldersSync = internalMutation({ ... });
export const fetchMarketHolders = internalAction({ ... });
export const processMarketHoldersResults = internalMutation({ ... });
```

## Internal API Path Preservation

All sync modules use `internal.scheduling.*` paths. These MUST continue working:

| Current Path | Used In |
|--------------|---------|
| `internal.scheduling.fetchMarketData` | triggerMarketSync |
| `internal.scheduling.processMarketSyncResults` | fetchMarketData |
| `internal.scheduling.markSyncFailed` | All fetch actions |
| `internal.scheduling.fetchAlertMarketPrices` | triggerAlertPriceSync |
| `internal.scheduling.processAlertPriceResults` | fetchAlertMarketPrices |
| `internal.scheduling.fetchWhaleActivity` | triggerWhaleSync |
| `internal.scheduling.processWhaleSyncResults` | fetchWhaleActivity |
| `internal.scheduling.fetchLeaderboardData` | triggerLeaderboardSync |
| `internal.scheduling.processLeaderboardResults` | fetchLeaderboardData |
| `internal.scheduling.fetchMarketHolders` | triggerMarketHoldersSync |
| `internal.scheduling.processMarketHoldersResults` | fetchMarketHolders |

**Solution**: Phase 4 barrel export re-exports all functions from scheduling/index.ts, and original scheduling.ts re-exports everything.

## Todo List
- [ ] Create `market-sync.ts` with 4 functions
- [ ] Create `alert-price-sync.ts` with 4 functions
- [ ] Create `whale-sync.ts` with 3 functions
- [ ] Create `leaderboard-sync.ts` with 3 functions
- [ ] Create `market-holders-sync.ts` with 5 functions
- [ ] Verify all imports from shared/
- [ ] Verify Convex validators match exactly
- [ ] TypeScript compilation check

## Success Criteria
- All 5 domain modules compile
- Each module 100-200 lines
- All Convex function signatures unchanged
- Helper functions properly scoped (not exported unless needed)

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| Breaking internal.scheduling.* paths | Barrel export in Phase 4 |
| Missing imports | Systematic extraction with verification |
| Validator mismatch | Copy validators exactly from source |

## Security Considerations
- API key validation preserved in each domain
- No new external dependencies

## Next Steps
- Phase 4: Create barrel export and update original scheduling.ts
