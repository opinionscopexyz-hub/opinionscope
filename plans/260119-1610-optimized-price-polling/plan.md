---
title: "Optimized Market Price Polling"
description: "Alert-focused token price updates with frontend proxy for CORS-free refresh"
status: completed
priority: P1
effort: 6h
branch: master
tags: [optimization, polling, api, alerts, proxy]
created: 2026-01-19
---

# Optimized Market Price Polling Strategy

## Overview

Optimize market data syncing by separating metadata sync from price updates. Use Opinion.Trade's `/token/latest-price` endpoint for targeted price polling on alert markets while providing frontend proxy for on-demand screener refresh.

## Current State

- `sync-markets` cron (5 min): Fetches ALL markets, updates everything
- `check-price-alerts` cron (5 min): Reads prices from DB, evaluates alerts
- No frontend refresh capability (CORS blocked)
- Markets table missing `yesTokenId`/`noTokenId` fields

## Target State

- `sync-markets` cron (15 min): Full metadata sync (slower, cost-efficient)
- `sync-alert-prices` cron (2 min): Token price updates ONLY for alert markets
- `/api/markets/refresh` proxy: CORS-free frontend refresh with rate limiting
- Schema updated with token IDs for price lookups

## Implementation Phases

| Phase | Description | Effort | Status |
|-------|-------------|--------|--------|
| [Phase 01](./phase-01-schema-token-ids.md) | Add yesTokenId/noTokenId to schema | 1h | ✅ Done |
| [Phase 02](./phase-02-token-price-fetching.md) | Create token price fetch action | 2h | ✅ Done |
| [Phase 03](./phase-03-alert-price-cron.md) | Add alert-focused price cron job | 1.5h | ✅ Done (2026-01-19) |
| [Phase 04](./phase-04-frontend-proxy.md) | Create Next.js API proxy route | 1.5h | ✅ Done |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CONVEX BACKEND                            │
├─────────────────────────────────────────────────────────────┤
│  Cron: sync-markets (15 min)                                │
│  └── Full metadata sync (titles, volumes, token IDs)        │
│                                                              │
│  Cron: sync-alert-prices (2 min)                            │
│  ├── Query unique marketIds from active alerts              │
│  ├── Get yesTokenId + noTokenId for each market             │
│  ├── Batch fetch prices via /token/latest-price             │
│  ├── Update yesPrice + noPrice in markets table             │
│  └── Trigger alert evaluation                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS API ROUTE (PROXY)                       │
│              /api/markets/refresh                            │
├─────────────────────────────────────────────────────────────┤
│  1. Auth check (Clerk)                                       │
│  2. Rate limit (1 req/30s per user)                         │
│  3. Fetch markets from Opinion.Trade API                    │
│  4. Write to Convex DB (shared benefit)                     │
│  5. Return fresh data to client                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND                                 │
├─────────────────────────────────────────────────────────────┤
│  Screener Page                                               │
│  ├── useQuery(api.markets.list) → Convex subscription       │
│  └── "Refresh" button → /api/markets/refresh                │
└─────────────────────────────────────────────────────────────┘
```

## API Reference

### Token Latest Price Endpoint

```
GET https://openapi.opinion.trade/openapi/token/latest-price
Headers: apikey: {API_KEY}
Params: token_id={tokenId}

Response:
{
  "errno": 0,
  "errmsg": "",
  "result": {
    "tokenId": "7455993776902564272875350325976732457143880671375090630008294772802951715577",
    "price": "0.752",
    "side": "sell-limit",
    "size": "92.981",
    "timestamp": 1768813325000
  }
}
```

## Success Criteria

1. Alert markets get fresh prices every 2 minutes
2. Full market sync continues at 15 min intervals
3. Frontend can trigger manual refresh via proxy (no CORS)
4. API costs reduced (~50-70% fewer calls)
5. No breaking changes to existing functionality
6. Rate limiting prevents proxy abuse

## Dependencies

- Opinion.Trade API access
- Clerk authentication
- Convex action-retrier for reliability

## Risks

| Risk | Mitigation |
|------|------------|
| API rate limits (15 req/sec) | Batch requests with 100ms delays |
| Token ID not in current sync | Phase 01 updates schema + sync |
| Proxy abuse | Rate limit + auth required |
