---
title: "OpinionScope MVP Implementation"
description: "Complete MVP build for prediction market intelligence platform with Opinion.Trade integration"
status: completed
priority: P1
effort: 80h
branch: master
tags: [mvp, opinion-trade, convex, clerk, polar]
created: 2026-01-16
---

# OpinionScope MVP Implementation Plan

## Overview

Build a prediction market intelligence platform with market screening, whale tracking, real-time activity feeds, and tiered subscriptions. Data source: Opinion.Trade API.

## Tech Stack

- **Frontend:** Next.js 16 + React 19, Tailwind v4, shadcn/ui
- **Backend:** Convex (real-time DB + functions)
- **Auth:** Clerk
- **Payments:** Polar
- **Background Jobs:** Convex Native (cronJobs + action-retrier)
- **Monorepo:** Turborepo + Bun

## Research Reports

- [Opinion.Trade API](../reports/researcher-260116-1247-opinion-trade-api.md)
- [Polar Payments](../reports/researcher-260116-1247-polar-payments.md)
- [Inngest Workflows](../reports/researcher-260116-1249-inngest-workflows.md)
- [Convex Patterns](../reports/researcher-260116-1247-convex-patterns.md)

## Phase Overview

| Phase | Title | Priority | Effort | Status |
|-------|-------|----------|--------|--------|
| 01 | [Project Setup](./phase-01-project-setup.md) | P0 | 4h | ✓ Complete |
| 02 | [Database Schema](./phase-02-database-schema.md) | P0 | 4h | ✓ Complete |
| 03 | [Auth Integration](./phase-03-auth-integration.md) | P0 | 4h | ✓ Complete |
| 04 | [Data Sync](./phase-04-data-sync.md) | P0 | 8h | ✓ Complete (via Convex migration) |
| 05 | [Market Screener](./phase-05-market-screener.md) | P0 | 12h | ✓ Complete |
| 06 | [Whale Tracker](./phase-06-whale-tracker.md) | P0 | 12h | ✓ Complete |
| 07 | [Activity Feed](./phase-07-activity-feed.md) | P1 | 8h | ✓ Complete |
| 08 | [Alert System](./phase-08-alert-system.md) | P1 | 10h | ✓ Complete |
| 09 | [Subscription Payments](./phase-09-subscription-payments.md) | P0 | 8h | ✓ Complete |
| 10 | [Landing Page](./phase-10-landing-page.md) | P1 | 10h | ✓ Complete |

## Critical Dependencies

1. Opinion.Trade API key (apply early - may take 1-2 weeks)
2. Clerk account + JWT template for Convex
3. Polar organization + sandbox setup

## Success Criteria

- 1,000 signups, 50 paid subscribers
- < 3 critical bugs at launch
- < 2s page load, < 500ms real-time latency
- 99.9% uptime

## Risk Summary

| Risk | Mitigation |
|------|-----------|
| Opinion.Trade API approval delay | Apply immediately, build with mock data |
| Whale detection latency | Accept 30-60s delay for MVP, improve in v1.1 |
| Rate limits (15 req/sec) | Implement request batching + caching |
