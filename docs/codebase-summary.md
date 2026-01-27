# OpinionScope Codebase Summary

Comprehensive overview of project structure, key files, and important directories.

---

## Directory Structure

### Root Level (`/`)

```
opinion-scope/
├── .claude/               # Claude AI agent rules and configurations
├── .git/                  # Git version control
├── apps/                  # Application packages
├── packages/              # Library packages
├── docs/                  # Documentation
├── plans/                 # Implementation plans & reports
├── .gitignore             # Git ignore rules
├── .repomixignore         # Repomix ignore patterns
├── CLAUDE.md              # Project instructions for Claude
├── OpinionScope_PRD.md    # Product requirements document
├── README.md              # Root project README
├── bts.jsonc              # BTS (Better-T-Stack) config
├── tsconfig.json          # TypeScript root config
├── turbo.json             # Turborepo config
├── package.json           # Root package definition
├── bun.lock               # Bun dependency lock file
└── release-manifest.json  # Release metadata
```

---

## Apps

### `apps/web/` - Frontend Application

Next.js 16 + React 19 full-stack web application.

**Key Structure:**
```
apps/web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth routes (login, signup)
│   │   ├── (dashboard)/              # Protected dashboard routes
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   ├── screener/page.tsx     # Market screener
│   │   │   ├── whales/page.tsx       # Whale tracker (Phase 06)
│   │   │   ├── feed/page.tsx         # Activity feed (Phase 07)
│   │   │   ├── alerts/page.tsx       # Alert management
│   │   │   └── settings/page.tsx     # User settings
│   │   ├── api/                      # API routes
│   │   │   └── markets/
│   │   │       └── refresh/
│   │   │           └── route.ts      # On-demand market refresh (Phase 04)
│   │   ├── layout.tsx                # Root layout
│   │   └── loading.tsx               # Global loading state
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── dropdown-menu.tsx     # Dropdown component (2KB)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── sheet.tsx             # New: Sheet component for profile
│   │   │   ├── tabs.tsx              # New: Tabs component
│   │   │   └── ... (more UI components)
│   │   │
│   │   ├── layout/                   # Layout components
│   │   │   ├── Navbar.tsx            # Top navigation
│   │   │   ├── Sidebar.tsx           # Left sidebar
│   │   │   └── Footer.tsx            # Footer
│   │   │
│   │   ├── screener/                 # Market screener components (Phase 05)
│   │   │   ├── index.ts              # Barrel export
│   │   │   ├── search-bar.tsx        # Debounced search component
│   │   │   ├── category-pills.tsx    # Category filter pills
│   │   │   ├── quick-filters.tsx     # Quick preset filters
│   │   │   ├── filter-panel.tsx      # Advanced filter panel
│   │   │   ├── saved-presets.tsx     # User saved presets (tier-gated)
│   │   │   ├── markets-table.tsx     # Paginated markets table with sorting
│   │   │   ├── market-row.tsx        # Individual market row with data
│   │   │   └── export-button.tsx     # CSV export button (tier-gated)
│   │   │
│   │   ├── whales/                   # Whale tracker components (Phase 06)
│   │   │   ├── index.ts              # Barrel export
│   │   │   ├── leaderboard.tsx       # Top whales leaderboard
│   │   │   ├── whale-row.tsx         # Individual whale row
│   │   │   ├── whale-profile-sheet.tsx # Whale profile modal
│   │   │   ├── whale-stats.tsx       # Stats grid component
│   │   │   ├── recent-trades.tsx     # Recent trades list
│   │   │   ├── follow-button.tsx     # Follow/unfollow action
│   │   │   └── followed-whales.tsx   # User's followed whales
│   │   │
│   │   ├── feed/                     # Activity feed components (Phase 07)
│   │   │   ├── index.ts              # Barrel export
│   │   │   ├── activity-feed.tsx     # Feed list with loading/empty states
│   │   │   ├── activity-item.tsx     # Individual trade item
│   │   │   ├── feed-filters.tsx      # Pro+ filter controls (followed whales, min amount)
│   │   │   ├── feed-error-boundary.tsx # Error resilience boundary
│   │   │   └── live-indicator.tsx    # Real-time status indicator
│   │   │
│   │   ├── alert-system/             # Alert components
│   │   │
│   │   └── common/                   # Shared components
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── lib/                          # Utility functions & hooks
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useConvex.ts          # Convex query/mutation wrapper
│   │   │   ├── usePagination.ts      # Pagination logic
│   │   │   ├── usePolling.ts         # Polling utilities
│   │   │   ├── use-screener-filters.ts # URL-synced filter state (Phase 05)
│   │   │   ├── use-activity-feed.ts  # Tiered feed with Pro+ filters (Phase 07)
│   │   │   └── use-current-user.ts   # Current user tier & auth info
│   │   │
│   │   ├── utils/                    # Helper functions
│   │   │   ├── format.ts             # Number, date formatting
│   │   │   ├── format-utils.ts       # Whale/market formatting (Phase 06)
│   │   │   │   ├── formatPnl         # P&L number formatting
│   │   │   │   ├── formatTimeAgo     # Relative time display
│   │   │   │   ├── formatWinRate     # Win rate percentage
│   │   │   │   └── formatAddress     # Wallet address truncation
│   │   │   ├── validators.ts         # Input validation
│   │   │   └── constants.ts          # App constants
│   │   │
│   │   ├── convex/                   # Convex client setup
│   │   ├── auth.ts                   # Auth utilities
│   │   └── types.ts                  # TypeScript types
│   │
│   ├── middleware.ts                 # Auth middleware
│   └── index.css                     # Global styles (4KB, Tailwind)
│
├── public/                           # Static assets
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.ts
```

**Key Files:**

| File | Purpose | Size |
|------|---------|------|
| `src/app/layout.tsx` | Root layout, Clerk provider setup | - |
| `src/middleware.ts` | Auth guard, route protection | - |
| `src/app/api/markets/refresh/route.ts` | On-demand market data refresh endpoint (Phase 04) | 68 lines |
| `src/app/screener/page.tsx` | Market screener with refresh button (Phase 04) | 136 lines |
| `src/index.css` | Tailwind config, CSS variables (4.3KB) | 1.7K tokens |
| `src/components/ui/dropdown-menu.tsx` | shadcn dropdown component (8.4KB) | 2.1K tokens |

---

## Packages

### `packages/backend/` - Convex Backend

Serverless backend with real-time database, functions, and Clerk integration.

**Key Structure:**
```
packages/backend/
├── convex/                          # Convex functions & schema
│   ├── schema.ts                    # Database schema (6.4KB, 1.6K tokens)
│   │   ├── users table              # User profiles, subscriptions
│   │   ├── whales table             # Whale wallet data, stats
│   │   ├── markets table            # Market listings, prices
│   │   ├── whaleActivity table      # Trade activity (tiered visibility)
│   │   ├── alerts table             # User-created alerts
│   │   ├── savedPresets table       # Market screener presets
│   │   └── notificationLog table    # Notification delivery tracking
│   │
│   ├── auth.config.ts               # Clerk integration config
│   ├── convex.config.ts             # Convex runtime config
│   │
│   ├── users.ts                     # User queries/mutations (5.9KB)
│   │   ├── getCurrentUser()          # Fetch current authenticated user
│   │   ├── updateNotificationPrefs()
│   │   └── followWhale()
│   │
│   ├── markets.ts                   # Market queries (5.3KB)
│   │   ├── listMarkets()            # Filtered market list
│   │   ├── getMarketById()
│   │   └── searchMarkets()
│   │
│   ├── whales.ts                    # Whale queries/mutations (Phase 06, 8.2KB)
│   │   ├── getLeaderboard()         # Tier-limited leaderboard sorted by win rate
│   │   ├── getById()                # Fetch single whale
│   │   ├── getByAddress()           # Lookup whale by wallet
│   │   ├── getRecentTrades()        # Tier-limited recent whale trades
│   │   ├── follow()                 # Add whale to user's followed list
│   │   ├── unfollow()               # Remove whale from followed
│   │   ├── getFollowedWhales()      # User's followed whales list
│   │   └── isFollowing()            # Check follow status
│   │
│   ├── whaleActivity.ts             # Activity feed queries (4.9KB)
│   │   ├── getActivityFeed()        # Tiered-visibility feed
│   │   └── listWhaleActivity()
│   │
│   ├── alerts.ts                    # Alert queries/mutations (5.7KB)
│   │   ├── createAlert()
│   │   ├── updateAlert()
│   │   ├── deleteAlert()
│   │   └── listAlerts()
│   │
│   ├── savedPresets.ts              # Screener preset mutations (4.7KB)
│   │   ├── savePreset()
│   │   ├── updatePreset()
│   │   └── deletePreset()
│   │
│   ├── healthCheck.ts               # System health check
│   ├── privateData.ts               # Private field handlers
│   │
│   ├── crons.ts                     # Cron job definitions (Phase 01-02)
│   │   ├── sync-markets (every 15min) - cost optimization
│   │   ├── sync-alert-prices (every 2min) - fetches prices for active alerts
│   │   ├── sync-whale-trades (every 1min)
│   │   ├── compute-whale-stats (hourly)
│   │   ├── cleanup-old-activity (daily 3AM UTC)
│   │   ├── sync-leaderboard-whales (daily 4AM UTC) - global leaderboard discovery
│   │   └── sync-market-holders (every 6 hours) - market-specific holder discovery
│   │
│   ├── scheduling/                  # Modular cron job handlers (Phase 04 refactor)
│   │   ├── shared/                  # Shared utilities
│   │   │   ├── types.ts (151 lines)      - API response interfaces & type defs
│   │   │   ├── constants.ts (22 lines)   - Batch sizes, URLs, delays, retention
│   │   │   ├── helpers.ts (34 lines)     - getApiBaseUrl, validateApiKey, delay
│   │   │   ├── typeGuards.ts (87 lines)  - Validators for API responses
│   │   │   └── index.ts (42 lines)       - Barrel export
│   │   ├── marketSync.ts (114 lines)     - Market sync with validation
│   │   ├── alertPriceSync.ts (107 lines) - Alert price sync (every 2min)
│   │   ├── whaleSync.ts (109 lines)      - Whale activity sync with batching
│   │   ├── leaderboardSync.ts (131 lines) - Leaderboard whale discovery
│   │   ├── marketHoldersSync.ts (102 lines) - Market holders (top 100 per side)
│   │   ├── statsComputation.ts (69 lines)   - computeWhaleStats function
│   │   ├── cleanup.ts (84 lines)            - cleanupOldActivity, markSyncFailed
│   │   └── scheduling.ts (47 lines)         - Re-export barrel for backward compatibility
│   │
│   │   **Total:** 1,099 lines (down from 1,406 original, 21.9% reduction)
│   │   **All internal.scheduling.* API paths preserved** via scheduling.ts re-exports
│   │
│   ├── lib/                         # Convex utilities
│   │   ├── retrier.ts               # Action-retrier integration
│   │   └── ... (helper functions)
│   │
│   └── README.md                    # Convex setup guide
│
├── .env.local                       # Local env variables (not in git)
├── package.json
└── tsconfig.json
```

**Database Schema (8 Tables, Phase 03+):**

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | User profiles, auth, subscription | clerkId, email, tier, polarCustomerId |
| `whales` | Whale wallet data & stats | address, winRate, totalVolume, verified |
| `markets` | Market listings, prices, token IDs | externalId, platform, yesTokenId, noTokenId, yesPrice, volume |
| `whaleActivity` | Whale trades (tiered visibility) | whaleId, marketId, action, timestamp |
| `alerts` | User-created alerts | userId, type, condition, isActive |
| `savedPresets` | Market screener filters | userId, name, filters, isDefault |
| `notificationLog` | Alert/activity notifications | userId, channel, status, sentAt |
| `syncLogs` | Cron sync tracking & errors | type (markets, whales, stats, alert-prices, leaderboard-whales, market-holders), status, startedAt, itemCount, error |

**Phase 01 Enhancement:**
- Added `yesTokenId` (optional) - Opinion.Trade token ID for YES outcome
- Added `noTokenId` (optional) - Opinion.Trade token ID for NO outcome
- Updated `markets.upsertMarket()` mutation to accept and store token IDs
- Updated `scheduling.ts` market sync to extract and store token IDs from API responses

**Phase 02 Alert Price Sync:**
- Added `"alert-prices"` sync log type for tracking token price updates
- New functions: `triggerAlertPriceSync()`, `fetchAlertMarketPrices()`, `processAlertPriceResults()`
- Fetches token prices only for markets with active price alerts
- Batched token requests (10 tokens/batch, 100ms delays) to respect rate limits

**Indexes:** 25 indexes across tables for performance optimization.

### `packages/config/` - Shared Configuration

TypeScript and build configurations shared across packages.

### `packages/env/` - Environment Variables

Environment variable schemas and validation.

---

## Documentation

```
docs/
├── README.md                  # Getting started & quick reference (270 lines)
├── codebase-summary.md        # This file - codebase structure
├── system-architecture.md     # System design, data flow, integrations
├── code-standards.md          # Naming conventions, patterns, TypeScript
├── design-guidelines.md       # UI/UX standards, colors, components (347 lines)
│
├── wireframes/                # 8 UI mockups
│   ├── 01-landing.png
│   ├── 02-login.png
│   ├── 03-dashboard.png
│   ├── 04-screener.png
│   ├── 05-whale-tracker.png
│   ├── 06-activity-feed.png
│   ├── 07-alerts.png
│   └── 08-subscription.png
│
└── assets/
    ├── logo.png               # OpinionScope logo
    └── colors.json            # Design system colors
```

---

## Plans & Research

```
plans/
├── 260116-1247-mvp-implementation/    # Main MVP implementation plan
│   ├── plan.md                        # Overview & phase tracker
│   ├── phase-01-project-setup.md      # Completed
│   ├── phase-02-database-schema.md    # Completed
│   ├── phase-03-auth-integration.md
│   ├── phase-04-data-sync.md
│   ├── phase-05-market-screener.md
│   ├── phase-06-whale-tracker.md
│   ├── phase-07-activity-feed.md
│   ├── phase-08-alert-system.md
│   ├── phase-09-subscription-payments.md
│   └── phase-10-landing-page.md
│
├── reports/
│   ├── researcher-260116-1247-convex-patterns.md
│   ├── researcher-260116-1247-opinion-trade-api.md
│   ├── researcher-260116-1247-polar-payments.md
│   ├── researcher-260116-1249-inngest-workflows.md
│   └── ui-ux-designer-260116-1332-design-guidelines-wireframes.md
│
└── templates/
    ├── bug-fix-template.md
    ├── feature-implementation-template.md
    ├── refactor-template.md
    └── template-usage-guide.md
```

---

## Configuration Files

| File | Purpose |
|------|---------|
| `turbo.json` | Turborepo task pipeline & caching |
| `bts.jsonc` | Better-T-Stack initialization config |
| `tsconfig.json` | Root TypeScript configuration |
| `.repomixignore` | Files excluded from Repomix packing |
| `.gitignore` | Git ignore rules |
| `.claude/rules/` | Claude AI agent development rules |

---

## Statistics

- **Total Files:** 65
- **Total Tokens:** ~178K
- **Total Characters:** ~501K
- **Main Languages:** TypeScript, React, CSS
- **Package Manager:** Bun

**Largest Files:**
1. `release-manifest.json` - 77.2% (manifest data)
2. `OpinionScope_PRD.md` - 7% (PRD document)
3. `apps/web/src/components/ui/dropdown-menu.tsx` - 1.2% (UI component)

---

## Important Files Quick Reference

### Backend
- **Schema Definition:** `packages/backend/convex/schema.ts`
- **User Operations:** `packages/backend/convex/users.ts`
- **Market Queries:** `packages/backend/convex/markets.ts`
- **Whale Tracking:** `packages/backend/convex/whales.ts`
- **Alerts:** `packages/backend/convex/alerts.ts`

### Frontend
- **Root Layout:** `apps/web/src/app/layout.tsx`
- **Auth Middleware:** `apps/web/src/middleware.ts`
- **Global Styles:** `apps/web/src/index.css`
- **UI Components:** `apps/web/src/components/ui/`

### Configuration
- **Turborepo Config:** `turbo.json`
- **TypeScript Config:** `tsconfig.json`
- **Clerk Integration:** `packages/backend/convex/auth.config.ts`

---

## External Dependencies

### Core Runtime
- Next.js 16, React 19, TypeScript 5+
- Convex SDK, Clerk SDK, Polar SDK
- TailwindCSS 4, shadcn/ui
- `@convex-dev/action-retrier` (v0.3.0) for retry logic in Phase 2-3 cron jobs

### Development
- Turborepo, Bun package manager
- TSC for type checking

### Status (Scheduling Module Refactor Complete)
- **Scheduling Module Refactoring:** Complete - monolithic 1,406-line scheduling.ts split into 13 focused modules
  - Modular structure with 5 domain modules (marketSync, alertPriceSync, whaleSync, leaderboardSync, marketHoldersSync)
  - Shared utilities module with types, constants, helpers, and validators
  - Backward compatibility preserved via barrel export (scheduling.ts re-exports)
  - Code reduction: 21.9% (307 lines removed via modularization)
  - All internal.scheduling.* API paths and cron jobs unaffected
- **Phase 01 - Global Leaderboard Sync:** Complete with daily whale discovery
  - Cron: `sync-leaderboard-whales` (daily at 4 AM UTC)
  - Fetches top 100 traders from Opinion.Trade global leaderboard (public API)
  - Extracts whale addresses and performance stats from leaderboard
  - Upserts discovered whales to `whales` table (no duplicates via address)
  - Logs sync progress in `syncLogs` table (type: `"leaderboard-whales"`)
  - Error tracking: Failures logged with detailed error messages for debugging
- **Phase 02 - Market Holders Sync:** Complete with 6-hourly whale discovery
  - Cron: `sync-market-holders` (every 6 hours)
  - Fetches top 100 holders per side (YES/NO) for each active opinion_trade market
  - Rate limiting: 5 markets/batch, 100ms between sides, 1s between batches
  - Aggregates holder data across markets (combines profits if holder in multiple markets)
  - Tracks new whale discovery count in `syncLogs` (type: `"market-holders"`)
  - Upserts holders to `whales` table with `totalPnl` field from market holdings
- **Phase 04 - Frontend Proxy API:** Complete with on-demand market refresh
  - Route: `GET /api/markets/refresh` (Next.js API handler)
  - Authentication: Clerk JWT via `auth()` helper
  - Rate limiting: Per-user 30-second cooldown (in-memory Map)
  - Direct Opinion.Trade API fetch (limit=50)
  - Response pass-through with error handling (401, 429, 502, 500)
  - Frontend Integration: Refresh button on Market Screener with toast notifications
  - User-facing features: Spinning icon, "Refreshing..." state, rate limit feedback
- **Phase 03 - Data Sync & Cron Jobs:** Complete with scheduled alert price sync & chaining
  - 6 cron jobs deployed with Convex scheduler integration
  - sync-markets: 15min interval (optimized for cost)
  - sync-alert-prices: 2min interval, chains checkPriceAlerts via scheduler
  - checkPriceAlerts: Evaluates all active price alerts with guaranteed fresh prices
  - sync-whale-trades, compute-whale-stats, cleanup-old-activity active
  - Error tracking via `syncLogs` table with type discrimination
- **Phase 02 - Token Price Fetching:** Complete with scheduled alert-price sync
  - Batched token requests (10 tokens/batch, 100ms delay, ~6 reqs/sec)
  - Integrated with cron chaining for reliable alert evaluation
- **Phase 05 - Market Screener:** Complete with URL-synced filters, pagination, sorting, CSV export, refresh button
- **Phase 06 - Whale Tracker:** Complete with leaderboard, profiles, follow system, tier-gated access
- **Phase 07 - Activity Feed:** Complete with tiered delivery, Pro+ filters, error boundary, live updates
- **Phase 08 - Alert System:** Complete with price alerts & webhooks

---

**Last Updated:** January 20, 2026 (Scheduling Module Refactor)
**Structure Version:** 1.9 (Modular Scheduling Architecture)
