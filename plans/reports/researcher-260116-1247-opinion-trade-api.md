# Opinion.Trade API Research Report
**Date:** 2026-01-16
**Project:** OpinionScope
**Status:** Complete

---

## Executive Summary

Opinion.Trade provides a production-ready REST API + WebSocket infrastructure for prediction market integration. Supports market discovery, trade history, and real-time data feeds. **Recommended for MVP launch** with clear limitations on whale trade detection.

---

## API Capabilities & Architecture

### REST Endpoints (HTTP)

| Endpoint | Method | Purpose | Response Time |
|----------|--------|---------|---|
| `/market` | GET | List all markets (paginated, filterable) | Real-time |
| `/market/{marketId}` | GET | Binary market details | Real-time |
| `/market/categorical/{marketId}` | GET | Categorical market data | Real-time |
| `/token/latest-price` | GET | Current trade price + orderbook | Real-time |
| `/token/price-history` | GET | Historical price data | Historical |
| `/trade/user/{walletAddress}` | GET | User trade history (filled trades only) | Real-time |
| `/position/{walletAddress}` | GET | User open positions | Real-time |

**Base URL:** `https://proxy.opinion.trade:8443/openapi/`

### Real-Time Capabilities

- **WebSocket Support:** Yes - User Channels + Market Channels for real-time streams
- **Data Freshness:** Production-ready, low-latency optimization (specific SLA not documented)
- **Update Frequency:** Sub-second for price data, order book updates appear near-instantaneous

---

## Authentication & Rate Limits

### Authentication
- **Method:** API Key in header (`apikey: your_api_key`)
- **Access:** Application form required (not immediately available)
- **Scope:** API key covers REST API, WebSocket, and CLOB SDK

### Rate Limits
- **15 requests/second** per API key (strict)
- **Max 20 items per response** (pagination required for large datasets)
- **Exceed limit response:** 429 Too Many Requests

**Impact for OpinionScope:**
- Whale tracking queries need batching (can't poll 1000+ addresses simultaneously)
- Real-time feed via WebSocket avoids per-request rate limit

---

## Market Data Fields

Markets include: `marketId`, `title`, `status`, `type`, labels, `volume`, `volume24h`, `volume7d`, `quoteToken`, `chainId`, `createdAt`, `cutoffAt`, `resolvedAt`.

Categorical markets expose `childMarkets` for multi-outcome structures.

---

## Trader/Whale Activity Detection

### What Works
✅ Query `/trade/user/{walletAddress}` to get filled trades (unlimited history)
✅ Query `/position/{walletAddress}` to get open positions
✅ Parse orderbook via `/token/latest-price` to detect large liquidity provision

### What's Missing
❌ No dedicated "whale trades" endpoint
❌ No user leaderboard/ranking API
❌ No real-time trade stream by address (only market-level WebSocket)
❌ Cannot query "trades matching criteria X" without wallet address

**Workaround:**
- Maintain local index of suspected whale addresses
- Poll `/trade/user/{address}` on rotation (rate-limit carefully)
- Use WebSocket market channels to detect large fills, track buyer addresses via tx hash

---

## Blockchain Integration

### Supported Networks
- **Primary:** Polygon (Chain ID: 137)
- **Contract Settlement:** On-chain order settlement via smart contracts
- **Architecture:** Hybrid (off-chain matching + on-chain settlement)

### On-Chain Data Access
No direct blockchain indexing API provided. Options:
1. **Fallback to polling:** Use `/trade/user/` endpoint for historical data
2. **Direct RPC calls:** Query Polygon RPC for transaction details if tx hash is available
3. **Theming Library:** Consider Thegraph indexing for Opinion contract events (not official)

---

## Data Integration Approach (Recommended)

### Phase 1: MVP (Basic Markets + Historical Trades)
```
- Sync markets: Fetch /market every 5 min via Inngest
- Whale discovery: Manual whitelist of known traders + community submissions
- Trade history: Batch query /trade/user/{address} for followed whales
- Feed delay: 15-30 min (acceptable for free tier)
```

### Phase 2: Growth (Real-Time Feed)
```
- WebSocket subscription to market channels
- Parse large fills from orderbook updates
- Heuristic: trades > $10k likely whale activity
- Pro users get <1 min latency via WebSocket
- Free users: 15 min batch processing
```

### Phase 3: Scale (Dedicated Whale Indexing)
```
- Deploy custom indexer for Polygon Opinion contract
- Detect large orders pre-execution
- Websocket broadcast to Pro+ users (true real-time)
- Consider Graph Protocol or similar for long-term sustainability
```

---

## Key Limitations & Risks

| Issue | Severity | Mitigation |
|-------|----------|-----------|
| No whale leaderboard API | High | Build local ranking system; require community verification |
| 15 req/sec rate limit | Medium | Implement request batching, queue manager, Redis cache |
| No real-time tx stream | Medium | Polygon RPC indexing; accept 30-60s latency initially |
| App approval required | Medium | Apply early; may delay launch 1-2 weeks |
| Limited SLA documentation | Low | Monitor uptime; have Kalshi API as backup |

---

## SDKs & Developer Tools

✅ **Opinion CLOB SDK** - Available (installation, config, API ref)
✅ **WebSocket SDK** - Included
❌ **Official TypeScript/Node SDK** - Not documented (build custom wrapper)

---

## Recommendation for OpinionScope

| Component | Approach |
|-----------|----------|
| **Market Screener** | REST `/market` endpoint + local filtering ✓ Ready |
| **Whale Tracker (MVP)** | Manual whitelist + `/trade/user/` polling ✓ Ready |
| **Live Feed (Free)** | 15-min batch sync ✓ Ready |
| **Live Feed (Pro)** | WebSocket market channels ✓ Ready |
| **Positions Tracking** | `/position/` endpoint ✓ Ready |
| **Real-time Whale Alerts** | Requires Phase 3 (custom indexing) - Defer to v1.1 |

**Go/No-Go:** **GO** - Sufficient for MVP. Start with REST API polling, layer WebSocket for Pro tier.

---

## Unresolved Questions

1. What's the exact SLA/uptime guarantee? (Needed for reliability claims)
2. Is Opinion planning a native whale-tracking API? (Competitive risk)
3. What's the application approval timeline? (Can delay launch)
4. Does OrderBook `/token/latest-price` include ALL fills or just current snapshot?
5. Are there any blockchain indexing partnerships available?

---

## Sources

- [Opinion Open API Overview](https://docs.opinion.trade/developer-guide/opinion-open-api/overview)
- [Market Endpoints](https://docs.opinion.trade/developer-guide/opinion-open-api/market)
- [Trade Endpoints](https://docs.opinion.trade/developer-guide/opinion-open-api/trade)
- [Opinion Open API Documentation](https://docs.opinion.trade/developer-guide/opinion-open-api)
