---
title: "Whale Auto-Discovery via Opinion.Trade APIs"
description: "Automated discovery of whale traders from global leaderboard and market holders"
status: complete
priority: P2
effort: 3h
branch: master
tags: [whales, sync, automation, cron, opinion-trade-api]
created: 2026-01-20
lastUpdated: 2026-01-20
---

# Whale Auto-Discovery Implementation Plan

## Overview

Automate whale discovery using Opinion.Trade's public APIs:
1. **Global Leaderboard** - Top 100 traders by volume (daily sync)
2. **Market Holders** - Top holders per market for YES/NO outcomes (6-hour sync)

## Phases

| Phase | Description | Effort | Status |
|-------|-------------|--------|--------|
| [Phase 1](./phase-01-global-leaderboard-sync.md) | Global leaderboard whale sync (daily) | 1.5h | **DONE** (2026-01-20) |
| [Phase 2](./phase-02-market-holders-sync.md) | Market holders whale discovery (6-hourly) | 1.5h | **DONE** (2026-01-20) |

## Validation Summary

**Validated:** 2026-01-20
**Questions asked:** 6

### Confirmed Decisions
- **Chain support:** BSC only (chainId=56) for now, multi-chain possible in future
- **Volume data:** API totalVolume overwrites local (API is source of truth)
- **Market holders frequency:** Every 6 hours
- **Holders per side:** Top 100 per side (200 total per market)
- **Discovery source tracking:** Not needed, all whales treated equally
- **Proxy URL:** Use main API base URL (proxy.opinion.trade:8443 points to same API)

### Action Items
- [x] Update HOLDERS_PER_MARKET from 50 to 100 in phase-02

## Key Decisions

- **API URL**: Use main API base URL (proxy points to same API)
- **No API key required**: Leaderboard/holder endpoints are public
- **Sync log types**: `leaderboard-whales`, `market-holders`
- **Rate limiting**: Single call for leaderboard; 5 markets/batch for holders

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Cron Jobs                              │
├─────────────────────────────────────────────────────────────┤
│ sync-leaderboard-whales  │ daily 4 AM UTC                   │
│ sync-market-holders      │ every 6 hours                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 scheduling.ts Functions                     │
├─────────────────────────────────────────────────────────────┤
│ triggerLeaderboardSync   → fetchLeaderboardData             │
│                          → processLeaderboardResults        │
│                                                             │
│ triggerMarketHoldersSync → fetchMarketHolders               │
│                          → processMarketHoldersResults      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    whales.upsertWhale                       │
└─────────────────────────────────────────────────────────────┘
```

## Files to Modify

| File | Changes |
|------|---------|
| `packages/backend/convex/scheduling.ts` | Add 6 new functions (2 per pipeline) |
| `packages/backend/convex/crons.ts` | Add 2 new cron definitions |
| `packages/backend/convex/schema.ts` | Extend syncLogs type union |

## Dependencies

- Existing `upsertWhale` mutation (whales.ts:297)
- Existing `retrier` infrastructure (lib/retrier.ts)
- Existing sync pipeline pattern (triggerX → fetchX → processX)

## Success Criteria

- [ ] Leaderboard sync discovers new whales daily
- [ ] Market holders sync finds market-specific whales
- [ ] Sync logs record results with proper types
- [ ] No duplicate whale entries (upsert by address)
- [ ] Rate limiting prevents API throttling
