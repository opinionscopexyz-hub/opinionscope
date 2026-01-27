# Opinion.Trade API Research Report

**Date:** 2026-01-20 | **Topic:** Whale Discovery API Endpoints | **Status:** Initial Research

## Summary

Opinion.Trade has a public REST API (`docs.opinion.trade`) but **NO dedicated leaderboard/top-holders endpoints** found in official docs. API is read-only for market data access.

## Available API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/openapi/market` | GET | List all markets (paginated) |
| `/openapi/market/{marketId}` | GET | Retrieve specific market details |
| `/openapi/token/latest-price` | GET | Get latest token prices |
| `/openapi/token/orderbook` | GET | Get order book depth |
| `/openapi/token/price-history` | GET | Get historical price data |
| `/openapi/trade/user/{walletAddress}` | GET | Get user's filled trades |

## Trade History Endpoint (Relevant for Whale Discovery)

**Path:** `GET /openapi/trade/user/{walletAddress}`
**Base URL:** `https://openapi.opinion.trade/openapi/trade/user/{walletAddress}`

### Parameters
- `walletAddress` (required, path): Target user's wallet address
- `page` (optional, query): Page number (default: 1)
- `limit` (optional, query): Items per page, max 20 (default: 10)
- `marketId` (optional, query): Filter by market ID
- `chainId` (optional, query): Filter by chain ID

### Response Format
```json
{
  "code": 0,
  "msg": "string",
  "result": {
    "total": "int",
    "list": [
      {
        "txHash": "string",
        "marketId": "int64",
        "marketTitle": "string",
        "side": "BUY|SELL",
        "outcome": "string",
        "price": "number",
        "shares": "number",
        "amount": "number",
        "fee": "number",
        "profit": "number",
        "quoteToken": "string",
        "status": "string",
        "createdAt": "timestamp"
      }
    ]
  }
}
```

## Authentication

**Method:** API Key in header
**Header Name:** `apikey`
**Type:** Required for all requests

## Rate Limiting

- **Rate Limit:** 15 requests/second per API key
- **Max Results Per Page:** 20 items

## Key Findings

1. **NO leaderboard endpoint exists** - Must aggregate data from individual user trades
2. **Trade endpoint only returns filled trades** - sorted by creation time (descending)
3. **API is read-only** - Use CLOB SDK for placing/canceling orders
4. **User-based approach required** - Need to iterate wallet addresses or use alternative discovery

## Whale Discovery Workaround

Since no leaderboard API exists:
1. Discover whales via on-chain analysis or other sources
2. Query individual wallet trades using `/openapi/trade/user/{walletAddress}`
3. Aggregate profit/loss, trade volume, market activity per whale
4. Build local leaderboard cache from multiple wallet queries

## Unresolved Questions

- Is there a hidden/undocumented leaderboard endpoint?
- Does Opinion.Trade expose whale rankings via Web UI that could be scraped?
- Are there SDK methods for leaderboard queries not in REST API docs?
- How to discover new whale wallets to query (need external data source)?

## References

- [Opinion Open API Overview](https://docs.opinion.trade/developer-guide/opinion-open-api/overview)
- [Opinion Trade Endpoints](https://docs.opinion.trade/developer-guide/opinion-open-api/trade)
- [Opinion API Documentation](https://docs.opinion.trade/developer-guide/opinion-open-api)
