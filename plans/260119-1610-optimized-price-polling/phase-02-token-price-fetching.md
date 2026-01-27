# Phase 02: Token Price Fetching Action

## Context Links
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 01](./phase-01-schema-token-ids.md)
- API: [Token Latest Price](https://docs.opinion.trade/developer-guide/opinion-open-api/token)

## Overview
- **Priority:** P1
- **Status:** ✅ Complete (Review: 8.5/10)
- **Description:** Create Convex action to fetch latest prices for yes/no tokens from Opinion.Trade API
- **Review Report:** [code-reviewer-260119-1823-phase-02-token-price.md](../reports/code-reviewer-260119-1823-phase-02-token-price.md)

## Key Insights
- Each market requires 2 API calls (yes token + no token)
- API rate limit: 15 req/sec → need batching with delays
- Response price is string, needs parsing to float
- Prices are 0-1 range (percentage as decimal)

## Requirements

### Functional
- Fetch latest price for single token ID
- Batch fetch prices for multiple markets (yes + no tokens)
- Update market yesPrice and noPrice fields
- Handle API errors gracefully

### Non-Functional
- Respect 15 req/sec rate limit
- Retry failed requests with exponential backoff
- Log sync results to syncLogs table

## Architecture

```typescript
// Action flow
fetchAlertMarketPrices(marketIds[])
  → For each market: get yesTokenId, noTokenId from DB
  → Batch API calls with 100ms delays
  → Parse prices from string to float
  → Update markets table via mutation
```

## Related Code Files

### To Create
- None (add to existing files)

### To Modify
- `packages/backend/convex/scheduling.ts` - Add price fetch action + mutation

### Reference
- `packages/backend/convex/lib/retrier.ts` - Retry pattern
- `packages/backend/convex/alertChecking.ts` - Batch fetching pattern

## Implementation Steps

1. **Add type guard for price response**
   ```typescript
   interface TokenPriceResponse {
     tokenId: string;
     price: string;
     side: string;
     size: string;
     timestamp: number;
   }

   function isValidPriceResponse(obj: unknown): obj is TokenPriceResponse
   ```

2. **Create fetchTokenPrice helper**
   ```typescript
   async function fetchTokenPrice(tokenId: string, apiKey: string): Promise<number | null>
   ```

3. **Create triggerAlertPriceSync mutation**
   - Query unique marketIds from active alerts
   - Get markets with token IDs
   - Schedule action with retrier

4. **Create fetchAlertMarketPrices action**
   - Receive marketIds and token data
   - Batch fetch: 10 tokens per batch, 100ms delay
   - Parse prices and collect results
   - Call processAlertPriceResults mutation

5. **Create processAlertPriceResults mutation**
   - Update yesPrice/noPrice for each market
   - Log results to syncLogs
   - Return updated count

## Todo List

- [x] Add TokenPriceResponse type guard
- [x] Create fetchTokenPrice helper function
- [x] Create triggerAlertPriceSync mutation
- [x] Create fetchAlertMarketPrices action
- [x] Create processAlertPriceResults mutation
- [x] Add "alert-prices" type to syncLogs schema
- [x] Test with single market
- [x] Test batch processing

## Code Review Findings (2026-01-19)

**Score:** 8.5/10 | **Status:** Approve with minor fixes

**Critical Issues:** None

**Recommended Fixes:**
1. Use `getApiBaseUrl()` helper in `fetchTokenPrice()` (line 318) - consistency
2. Add error logging in catch block (line 332) - debugging aid
3. Optional: Add batch duration metrics to syncLogs - monitoring

**Strengths:**
- Proper mutation→action→mutation flow
- Correct rate limiting (100ms/10 tokens = 6.7 req/sec < 15 limit)
- Type guards prevent invalid responses
- Graceful degradation for failed fetches
- Retry integration via retrier

See full review: [../reports/code-reviewer-260119-1823-phase-02-token-price.md](../reports/code-reviewer-260119-1823-phase-02-token-price.md)

## Code Snippets

### Price Response Validation
```typescript
interface TokenPriceResponse {
  tokenId: string;
  price: string;
  side: string;
  size: string;
  timestamp: number;
}

function isValidPriceResponse(obj: unknown): obj is TokenPriceResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "tokenId" in obj &&
    "price" in obj &&
    typeof (obj as { price: unknown }).price === "string"
  );
}
```

### Batch Delay Helper
```typescript
const TOKEN_BATCH_SIZE = 10; // 10 tokens = 5 markets
const TOKEN_BATCH_DELAY_MS = 100; // Stay under 15 req/sec

for (let i = 0; i < tokens.length; i += TOKEN_BATCH_SIZE) {
  if (i > 0) await delay(TOKEN_BATCH_DELAY_MS);
  const batch = tokens.slice(i, i + TOKEN_BATCH_SIZE);
  // Process batch...
}
```

## Success Criteria

- [x] Token prices fetched successfully
- [x] Prices parsed from string to number correctly
- [x] Batch delays prevent rate limiting
- [x] Failed requests logged, don't break sync
- [x] Market yesPrice/noPrice updated in DB

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Rate limit exceeded | Medium | Medium | Batch with delays, retry logic |
| Invalid price format | Low | Low | Type guard + parseFloat fallback |
| Token ID not found | Medium | Low | Skip market, log warning |

## Security Considerations
- API key stored in environment variable
- No user data exposed in logs

## Next Steps
- Phase 03: Add cron job to trigger price sync for alert markets
