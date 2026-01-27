# OpinionScope Documentation

Welcome to the OpinionScope developer documentation. This guide covers project setup, architecture, development workflow, and technical standards.

## Quick Links

- **[System Architecture](./system-architecture.md)** - System design, data flow, integrations
- **[Codebase Summary](./codebase-summary.md)** - Project structure and key files
- **[Code Standards](./code-standards.md)** - Naming, patterns, TypeScript guidelines (includes Phase 03 cron patterns)
- **[Deployment Guide](./deployment-guide.md)** - Production deployment & environment setup
- **[Design Guidelines](./design-guidelines.md)** - UI/UX, colors, components

---

## Project Overview

**OpinionScope** is a prediction market intelligence platform providing real-time market screening, whale activity tracking, and algorithmic alerts for traders.

**Key Features:**
- **Market Screener** - Filter 1000+ markets by price, volume, category
- **Whale Tracker** - Monitor top whale wallets and their trades in real-time
- **Activity Feed** - Tiered-delivery activity feed (real-time for Pro+, 30s delay for Pro, 15min for Free)
- **Smart Alerts** - Price/volume/whale alerts with multi-channel notifications (Phase 08)
- **Subscriptions** - Free/Pro/Pro+ tiers with tier-locked features (Phase 09)
- **Pricing Page** - Monthly/annual billing options with feature comparison (Phase 09)
- **Billing Portal** - Manage subscription via Polar customer portal (Phase 09)

**Data Source:** Opinion.Trade API (primary), with support for Polymarket, Kalshi

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js | 16 |
| | React | 19 |
| | Tailwind CSS | 4 |
| | shadcn/ui | Latest |
| **Backend** | Convex | Cloud |
| | TypeScript | 5+ |
| **Authentication** | Clerk | Cloud |
| **Payments** | Polar | Cloud (Phase 09) |
| **Email** | Resend | Cloud (Phase 09) |
| **Background Jobs** | Convex Cron (Phase 03) | Cloud |
| **Job Retries** | @convex-dev/action-retrier | v0.3.0 |
| **Package Manager** | Bun | Latest |
| **Monorepo** | Turborepo | Latest |

---

## Environment Setup

### Required External Accounts

Before starting development, create accounts for:

1. **Convex** - https://convex.dev (real-time backend + cron jobs)
2. **Clerk** - https://clerk.com (authentication)
3. **Polar** - https://polar.sh (payments & analytics)
4. **Opinion.Trade API** - Contact support (apply early, 1-2 weeks approval)

### Windows Development Setup

**Prerequisites:**
- Node.js 18+ (or Bun)
- Bun 1.0+ - [Install Bun](https://bun.sh)
- Git

**Steps:**

1. Clone repository:
```bash
git clone <repo-url>
cd opinion-scope
```

2. Install dependencies:
```bash
bun install
```

3. Initialize Convex:
```bash
bun run dev:setup
```
Follow prompts to create/connect Convex project.

4. Set up environment variables:

Create `.env.local` in `apps/web/`:
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<from-clerk-dashboard>
CLERK_SECRET_KEY=<from-clerk-dashboard>

# Convex
NEXT_PUBLIC_CONVEX_URL=<from-convex-dashboard>

# Polar (Phase 09)
NEXT_PUBLIC_POLAR_ORG_ID=<from-polar-dashboard>
POLAR_ACCESS_TOKEN=<from-polar-settings>
POLAR_WEBHOOK_SECRET=<from-polar-webhooks>
POLAR_PRO_MONTHLY_ID=<product-id>
POLAR_PRO_ANNUAL_ID=<product-id>
POLAR_PRO_PLUS_MONTHLY_ID=<product-id>
POLAR_PRO_PLUS_ANNUAL_ID=<product-id>

# Resend Email (Phase 09)
RESEND_API_KEY=<from-resend-dashboard>
RESEND_FROM_EMAIL=hello@opinionscope.xyz

# Opinion.Trade
OPINION_TRADE_API_KEY=<request-from-support>
```

Create `.env.local` in `packages/backend/`:
```env
# Clerk JWT configuration (from Convex Dashboard → Settings → Auth)
CLERK_JWT_ISSUER_DOMAIN=https://<clerk-domain>.clerk.accounts.dev

# Polar (Phase 09)
POLAR_WEBHOOK_SECRET=<from-polar-webhooks>
POLAR_PRO_MONTHLY_ID=<product-id>
POLAR_PRO_ANNUAL_ID=<product-id>
POLAR_PRO_PLUS_MONTHLY_ID=<product-id>
POLAR_PRO_PLUS_ANNUAL_ID=<product-id>

# Resend Email (Phase 09)
RESEND_API_KEY=<from-resend-dashboard>
RESEND_FROM_EMAIL=hello@opinionscope.xyz

# Opinion.Trade API
OPINION_TRADE_API_KEY=<request-from-support>
```

5. Start development servers:
```bash
bun run dev
```

Servers start at:
- Web app: http://localhost:3001
- Convex: Background sync

---

## Development Commands

```bash
# Start all dev servers
bun run dev

# Start web app only
bun run dev:web

# Setup/reinitialize Convex
bun run dev:setup

# Type check across monorepo
bun run check-types

# Build all apps
bun run build

# Lint
bun run lint

# Tests (if configured)
bun run test
```

---

## Project Structure

```
opinion-scope/
├── apps/
│   └── web/                    # Next.js 16 frontend
│       ├── src/
│       │   ├── app/            # App router pages
│       │   ├── components/      # React components
│       │   ├── lib/            # Utilities, hooks
│       │   └── middleware.ts    # Auth middleware
│       ├── public/             # Static assets
│       └── package.json
│
├── packages/
│   ├── backend/                # Convex backend
│   │   ├── convex/
│   │   │   ├── schema.ts       # Database schema (8 tables, Phase 03)
│   │   │   ├── users.ts        # User queries/mutations
│   │   │   ├── markets.ts      # Market queries
│   │   │   ├── whales.ts       # Whale queries
│   │   │   ├── whaleActivity.ts
│   │   │   ├── alerts.ts       # Alert queries/mutations
│   │   │   ├── savedPresets.ts # Screener presets
│   │   │   ├── crons.ts        # Cron job definitions (Phase 03)
│   │   │   ├── scheduling.ts   # Cron job handlers (Phase 03)
│   │   │   ├── auth.config.ts  # Clerk integration
│   │   │   └── convex.config.ts
│   │   └── package.json
│   │
│   ├── config/                 # Shared configuration
│   ├── env/                    # Environment schemas
│   └── ui/                     # Shared UI library (if needed)
│
├── docs/                       # Documentation
│   ├── README.md              # This file
│   ├── system-architecture.md
│   ├── codebase-summary.md
│   ├── code-standards.md
│   ├── design-guidelines.md
│   ├── wireframes/            # UI wireframes (8 screens)
│   └── assets/                # Design assets, logo
│
└── plans/                      # Implementation plans
    └── 260116-1247-mvp-implementation/
```

---

## Key Architectural Patterns

### Authentication Flow
1. User logs in via Clerk
2. Clerk JWT token validated in Convex
3. Convex queries use authenticated user context
4. Subscription status loaded from Polar

### Real-time Data (Phase 03)
- **sync-whale-trades:** Every 1 minute (batch 5 whales with 1s delay)
- **sync-markets:** Every 5 minutes (Opinion.Trade API)
- **compute-whale-stats:** Hourly (aggregate trade data)
- **cleanup-old-activity:** Daily at 3 AM UTC (90-day retention)
- Clients subscribe to Convex queries for live updates
- All syncs tracked in `syncLogs` table for monitoring

### Tiered Feature Access
- **Free:** Market screener (basic), activity feed (15min delay)
- **Pro:** Whale alerts, 30s activity delay, 100 saved presets
- **Pro+:** Real-time activity, unlimited alerts, whale analysis

---

## Common Tasks

### Add New Alert Type

1. Update `schema.ts` - Add type to `alerts.type` union
2. Update `alerts.ts` - Add check function
3. Add Convex cron job handler (Phase 2-3)
4. Update UI component in `apps/web`

### Create New Market Filter

1. Add filter to `SavedPreset.filters` in schema
2. Create query in `markets.ts`
3. Build filter UI component
4. Connect to screener page

### Add Notification Channel

1. Update `notificationLog.channel` in schema
2. Create handler in Convex cron job (Phase 2-3)
3. Update user preferences UI

---

## Debugging

### View Convex Functions
```bash
bun run dev:setup  # Opens dashboard
```

### Check Real-time Subscriptions
Use Convex Dashboard > Overview tab to see active connections

### Convex Cron Jobs (Phase 03)
View job status in Convex Dashboard > Functions tab. Query syncLogs:
```bash
convex query syncLogs.list --sort startedAt:desc --limit 10
```

### Clerk Logs
Visit Clerk Dashboard > Logs for authentication issues

---

## Performance Targets

- **Page Load:** < 2s (Lighthouse)
- **Real-time Latency:** < 500ms (Whale activity)
- **API Response:** < 200ms (Convex)
- **Uptime:** 99.9%

---

## Deployment

See **[Deployment Guide](./deployment-guide.md)** for:
- Environment variable setup (all phases, including Phase 09)
- Polar webhook configuration & verification
- Resend email service setup
- Convex Cloud deployment steps
- Cron job verification & monitoring
- Troubleshooting production issues
- SyncLogs monitoring queries

---

## Support & Resources

- **Convex Docs:** https://docs.convex.dev
- **Next.js Docs:** https://nextjs.org/docs
- **Clerk Docs:** https://clerk.com/docs
- **Polar Docs:** https://polar.sh/docs

---

**Last Updated:** January 19, 2026 (Phase 09)
**Version:** 1.3 (Subscription Payments)
