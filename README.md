# opinion-scope

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Convex, and more.

## Features

- **Landing Page** - Multi-section marketing site with hero, features, pricing, testimonials, FAQ
- **Market Screener** - Filter thousands of prediction markets by price, volume, category
- **Whale Tracker** - Follow top traders with verified track records
- **Real-Time Feed** - Watch whale trades with tiered visibility (Pro+ real-time, Pro 30s delay, Free 15m delay)
- **Smart Alerts** - Price triggers, whale activity, volume thresholds (email, push, Telegram, Discord)
- **Subscriptions** - Free/Pro/Pro+ tiers with Polar payments integration
- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework with App Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Convex** - Reactive backend-as-a-service platform with cron jobs
- **Authentication** - Clerk OAuth & JWT validation
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Convex Setup

This project uses Convex as a backend. You'll need to set up Convex before running the app:

```bash
bun run dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Copy environment variables from `packages/backend/.env.local` to `apps/*/.env`.

### Clerk Authentication Setup

- Follow the guide: [Convex + Clerk](https://docs.convex.dev/auth/clerk)
- Set `CLERK_JWT_ISSUER_DOMAIN` in Convex Dashboard
- Set `CLERK_PUBLISHABLE_KEY` in `apps/*/.env`

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Your app will connect to the Convex cloud backend automatically.

## Project Structure

```
opinion-scope/
├── apps/
│   ├── web/                          # Frontend application (Next.js)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx          # Landing page (Phase 10)
│   │   │   │   ├── layout.tsx        # Root layout with SEO metadata
│   │   │   │   ├── dashboard/        # Protected dashboard routes
│   │   │   │   └── (auth)/           # Auth pages
│   │   │   └── components/
│   │   │       ├── landing/          # 8 landing page components
│   │   │       ├── features/         # Feature components (screener, whales, feed, alerts)
│   │   │       └── ui/               # shadcn/ui primitives
├── packages/
│   ├── backend/                      # Convex backend functions and schema
│   │   ├── convex/
│   │   │   ├── schema.ts            # Database schema (8 tables)
│   │   │   ├── crons.ts             # Cron job definitions
│   │   │   ├── scheduling.ts        # Cron handlers
│   │   │   ├── markets.ts           # Market queries
│   │   │   ├── whales.ts            # Whale queries
│   │   │   └── auth.config.ts       # JWT verification
│   │   └── .env.local               # Convex environment variables
└── docs/                             # Project documentation
    ├── system-architecture.md        # System design & data flow
    ├── code-standards.md             # Code conventions & patterns
    ├── design-guidelines.md          # UI/UX design standards
    └── deployment-guide.md           # Deployment instructions
```

## Landing Page (Phase 10)

The landing page showcases OpinionScope to potential users with 8 strategic sections:

1. **Hero Section** - Headline, subheadline, dual CTAs (Get Started Free / View Demo), social proof stats
2. **Features Grid** - 6 feature cards (Screener, Whale Tracker, Feed, Alerts, Analytics, Export)
3. **How It Works** - Step-by-step usage walkthrough
4. **Pricing Preview** - Free/Pro/Pro+ tier cards with feature comparison
5. **Testimonials** - User testimonials and social proof
6. **FAQ Section** - Frequently asked questions accordion
7. **CTA Section** - Final conversion call-to-action
8. **Footer** - Links, branding, copyright

**SEO Metadata:**
- `metadataBase`: https://opinionscope.xyz
- OG tags for social sharing
- Twitter card support
- Keyword targeting: prediction markets, whale tracking, market screener

**Key Components:**
- Responsive design (mobile-first)
- Gradient accents and geometric decorations
- Dynamic Clerk integration (shows "Go to Dashboard" if signed in)
- Lucide React icons throughout
- shadcn/ui Card, Button components

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:setup`: Setup and configure your Convex project
- `bun run check-types`: Check TypeScript types across all apps
