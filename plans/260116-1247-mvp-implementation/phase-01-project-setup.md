# Phase 01: Project Setup

## Context Links
- [Plan Overview](./plan.md)
- [Inngest Research](../reports/researcher-260116-1249-inngest-workflows.md)
- [Convex Patterns](../reports/researcher-260116-1247-convex-patterns.md)

## Overview
- **Priority:** P0
- **Status:** ✅ Complete
- **Effort:** 4h
- **Description:** Configure environment variables, install dependencies, and establish project conventions.
- **Note:** Inngest was removed in favor of Convex Native scheduling (cronJobs + action-retrier).

## Key Insights
- Better-T-Stack scaffold already includes: Next.js 16, Convex, Clerk, Tailwind v4, shadcn/ui
- Inngest requires minimal setup: single API route + SDK
- Polar and Opinion.Trade API keys needed before data sync
- Monorepo structure: `apps/web`, `packages/backend`, `packages/env`

## Requirements

### Functional
- FR-SETUP-1: Configure all environment variables for dev/prod
- FR-SETUP-2: Install Inngest, Polar SDK, and API client dependencies
- FR-SETUP-3: Create Inngest serve endpoint
- FR-SETUP-4: Set up Opinion.Trade API wrapper

### Non-Functional
- NFR-SETUP-1: Type-safe environment variables via t3-env
- NFR-SETUP-2: Centralized config in `packages/env`

## Architecture

```
opinion-scope/
├── apps/web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   └── inngest/route.ts    # Inngest serve endpoint
│   │   └── lib/
│   │       └── opinion-trade-client.ts # API wrapper
├── packages/backend/
│   └── convex/
└── packages/env/
    └── src/
        ├── server.ts  # Server env (add Opinion.Trade, Polar, Inngest keys)
        └── web.ts     # Client env
```

## Related Code Files

### Modify
- `packages/env/src/server.ts` - Add new env vars
- `apps/web/package.json` - Add dependencies
- `packages/backend/package.json` - Add Inngest

### Create
- `apps/web/src/app/api/inngest/route.ts` - Inngest serve endpoint
- `apps/web/src/lib/inngest/client.ts` - Inngest client singleton
- `apps/web/src/lib/inngest/functions/index.ts` - Function registry
- `apps/web/src/lib/opinion-trade/client.ts` - API wrapper
- `apps/web/src/lib/opinion-trade/types.ts` - TypeScript types

## Implementation Steps

### Step 1: Update Environment Variables
Update `packages/env/src/server.ts`:
```typescript
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    CORS_ORIGIN: z.url().optional(),

    // Opinion.Trade API
    OPINION_TRADE_API_KEY: z.string().min(1),
    OPINION_TRADE_BASE_URL: z.string().url().default("https://proxy.opinion.trade:8443/openapi"),

    // Polar
    POLAR_ACCESS_TOKEN: z.string().min(1),
    POLAR_WEBHOOK_SECRET: z.string().min(1),
    POLAR_ORGANIZATION_ID: z.string().min(1),

    // Inngest
    INNGEST_EVENT_KEY: z.string().min(1),
    INNGEST_SIGNING_KEY: z.string().optional(),

    // Clerk (for server-side)
    CLERK_SECRET_KEY: z.string().min(1),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
```

### Step 2: Install Dependencies
```bash
# Root
bun add inngest @polar-sh/sdk

# apps/web
cd apps/web
bun add inngest @polar-sh/sdk resend

# packages/backend
cd packages/backend
bun add inngest
```

### Step 3: Create Inngest Client
Create `apps/web/src/lib/inngest/client.ts`:
```typescript
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "opinion-scope",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
```

### Step 4: Create Inngest Serve Endpoint
Create `apps/web/src/app/api/inngest/route.ts`:
```typescript
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { functions } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
```

### Step 5: Create Function Registry
Create `apps/web/src/lib/inngest/functions/index.ts`:
```typescript
// Export all Inngest functions
export const functions = [
  // Will be populated in Phase 04
];
```

### Step 6: Create Opinion.Trade API Client
Create `apps/web/src/lib/opinion-trade/types.ts`:
```typescript
export interface OpinionMarket {
  marketId: string;
  title: string;
  status: "active" | "resolved" | "cancelled";
  type: "binary" | "categorical";
  labels?: string[];
  volume: number;
  volume24h: number;
  volume7d: number;
  quoteToken: string;
  chainId: number;
  createdAt: string;
  cutoffAt: string;
  resolvedAt?: string;
}

export interface OpinionTrade {
  tradeId: string;
  marketId: string;
  walletAddress: string;
  side: "BUY" | "SELL";
  amount: number;
  price: number;
  timestamp: string;
  txHash?: string;
}

export interface OpinionPosition {
  marketId: string;
  walletAddress: string;
  outcome: string;
  shares: number;
  avgPrice: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}
```

Create `apps/web/src/lib/opinion-trade/client.ts`:
```typescript
import { env } from "@opinion-scope/env/server";
import type {
  OpinionMarket,
  OpinionTrade,
  OpinionPosition,
  PaginatedResponse,
} from "./types";

class OpinionTradeClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = env.OPINION_TRADE_BASE_URL;
    this.apiKey = env.OPINION_TRADE_API_KEY;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        apikey: this.apiKey,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Opinion.Trade API error: ${response.status}`);
    }

    return response.json();
  }

  async getMarkets(cursor?: string): Promise<PaginatedResponse<OpinionMarket>> {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    return this.fetch(`/market?${params}`);
  }

  async getMarket(marketId: string): Promise<OpinionMarket> {
    return this.fetch(`/market/${marketId}`);
  }

  async getUserTrades(walletAddress: string, cursor?: string): Promise<PaginatedResponse<OpinionTrade>> {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    return this.fetch(`/trade/user/${walletAddress}?${params}`);
  }

  async getUserPositions(walletAddress: string): Promise<OpinionPosition[]> {
    return this.fetch(`/position/${walletAddress}`);
  }

  async getLatestPrice(tokenId: string): Promise<{ price: number; orderbook: unknown }> {
    return this.fetch(`/token/latest-price?tokenId=${tokenId}`);
  }

  async getPriceHistory(tokenId: string, from?: string, to?: string): Promise<unknown[]> {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return this.fetch(`/token/price-history?tokenId=${tokenId}&${params}`);
  }
}

export const opinionTradeClient = new OpinionTradeClient();
```

### Step 7: Create .env.example
Create `apps/web/.env.example`:
```env
# Convex
NEXT_PUBLIC_CONVEX_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Opinion.Trade
OPINION_TRADE_API_KEY=
OPINION_TRADE_BASE_URL=https://proxy.opinion.trade:8443/openapi

# Polar
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_ORGANIZATION_ID=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
```

### Step 8: Update package.json Scripts
Add to `apps/web/package.json`:
```json
{
  "scripts": {
    "dev": "next dev --port 3001",
    "dev:inngest": "npx inngest-cli@latest dev",
    "build": "next build",
    "start": "next start"
  }
}
```

## Todo List

- [x] Update `packages/env/src/server.ts` with new env vars
- [x] Install Polar SDK dependencies
- [x] ~~Create Inngest client~~ (Removed - using Convex Native scheduling)
- [x] ~~Create Inngest serve endpoint~~ (Removed - using Convex cronJobs)
- [x] ~~Create function registry~~ (Replaced by `convex/scheduling.ts`)
- [x] Create Opinion.Trade types (in `convex/scheduling.ts`)
- [x] ~~Create Opinion.Trade client~~ (Integrated in scheduling actions)
- [x] Create `.env.example` file
- [x] ~~Update package.json with Inngest dev script~~ (Not needed)
- [ ] Apply for Opinion.Trade API key (external dependency)
- [ ] Set up Polar sandbox account (external dependency)
- [x] ~~Set up Inngest account~~ (Not needed)

## Success Criteria

- [x] `bun run dev` starts without errors
- [x] ~~`bun run dev:inngest`~~ (Removed - using Convex crons)
- [x] Environment variables validated by t3-env
- [x] Convex scheduling functions deployed
- [x] TypeScript compiles without errors

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Opinion.Trade API key delay | High | Medium | Build with mock data, apply early |
| Env var misconfiguration | Medium | Low | Use t3-env validation |
| Inngest connection issues | Low | Low | Fallback to local polling |

## Security Considerations

- Store all API keys in environment variables, never commit
- Use `.env.example` without actual values
- Validate all env vars at startup with t3-env
- Inngest signing key validates webhook authenticity

## Next Steps

After completing this phase:
1. Proceed to [Phase 02: Database Schema](./phase-02-database-schema.md)
2. Apply for Opinion.Trade API access if not done
3. Create Polar organization and products
