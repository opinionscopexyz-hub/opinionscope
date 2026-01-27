# Inngest for OpinionScope: Research Report

**Date:** 2026-01-16 | **Researcher:** claude-haiku-4-5 | **Duration:** ~30 min

---

## Executive Summary

Inngest is a durable execution platform perfectly suited for OpinionScope's background job requirements. Native cron support, event-driven workflows, built-in flow control (rate limiting, throttling), and seamless Next.js/Vercel integration eliminate infrastructure overhead. Minimal setup, maximum reliability.

---

## 1. Core Concepts & Features

### What is Inngest?

Event-driven durable execution platform for reliable background jobs, workflows, and scheduled tasks. Handles retries, observability, scaling automatically—zero queue/state management required.

**Key Properties:**
- Event & cron-triggered functions
- Built-in retry logic (configurable)
- Real-time traces, structured logging
- Multi-language (JS/TS, Python, Go)
- Automatic pause on 20 consecutive failures
- Free plan available

### Architecture

```
Your App (Next.js)
  ↓ (send events via Inngest SDK)
Inngest Platform
  ↓ (triggers functions via HTTP callback)
Your API Route (/api/inngest)
  ↓ (executes function logic)
Result (logged in dashboard)
```

No separate workers, queues, or deployments needed—functions live in your codebase.

---

## 2. Cron Jobs & Scheduled Functions

### Setup Pattern

```typescript
export default inngest.createFunction(
  { id: "sync-market-data" },
  { cron: "*/5 * * * *" }, // Every 5 minutes
  async ({ step }) => {
    const polyMarkets = await step.run("fetch-polymarket", () =>
      fetchPolymarketAPI()
    );
    // Process, upsert to Convex
  }
);
```

### Cron Syntax & Features

- Standard Unix cron format: `*/5 * * * *`
- **Timezone support:** `TZ=America/New_York 0 9 * * MON`
- **Max period:** 24 hours
- Dashboard shows next run times, previous logs
- Fails gracefully—no job loss

### For OpinionScope Use Cases

| Requirement | Inngest Solution |
|---|---|
| Market sync (5 min) | Cron `*/5 * * * *` |
| Whale data updates | Event + cron hybrid |
| Alert checks (1 min) | Fast cron, debounce |
| Webhook processing | Event handler |

---

## 3. Event-Driven Workflows

### Triggering Functions

**From your app:**
```typescript
inngest.send({ name: "whale.activity.detected", data: { ... } });
```

**Function definition:**
```typescript
inngest.createFunction(
  { id: "process-whale-trade" },
  { event: "whale.activity.detected" },
  async ({ event, step }) => {
    // Runs when event is sent
    // Automatic retries on failure
  }
);
```

### Event Fan-Out Pattern

One event → multiple functions. Perfect for alerts:
- Event: `whale.trade`
  - Triggers: notify Pro+ (instant)
  - Triggers: notify Pro (30s delay)
  - Triggers: store in feed (15min delay)

### Replay & Event Store

Events stored permanently; replay functions on production bugs without re-triggering.

---

## 4. Next.js Integration Approach

### Minimal Setup (10 mins)

```bash
npm install inngest
npx --ignore-scripts=false inngest-cli@latest dev
```

**Create `/api/inngest/route.ts`:**
```typescript
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import * as functions from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [functions.syncMarketData, functions.processWhaleTrade, ...],
});
```

**Dev server at `http://localhost:8288`:** Real-time function dashboard, test events, inspect runs.

### Deployment to Vercel

- Routes auto-deployed as Vercel functions
- SDK handles HTTP communication
- Dashboard accessible from anywhere
- No additional config needed

### Error Handling & Retries

Built-in retry logic; configurable backoff strategy. Functions auto-pause after 20 consecutive failures (prevents cost overruns).

---

## 5. Tiered Notification Delivery Pattern

### Implementation Strategy

Use **rate limiting** + **scheduled delays**:

```typescript
// Pro+ users: instant notification
inngest.createFunction(
  { id: "notify-proplus", rateLimit: { limit: 1, period: "1s" } },
  { event: "whale.trade" },
  async ({ event, step }) => {
    await step.run("send-webhook", () => sendPushNotification(event));
  }
);

// Pro users: 30 second delay
inngest.createFunction(
  { id: "notify-pro" },
  { event: "whale.trade" },
  async ({ event, step }) => {
    await step.sleep("delay", "30s");
    await step.run("send-email", () => sendEmailNotification(event));
  }
);

// Free users: 15 minute delay + feed only
inngest.createFunction(
  { id: "add-to-feed" },
  { event: "whale.trade" },
  async ({ event, step }) => {
    await step.sleep("delay", "900s"); // 15 minutes
    await step.run("store", () => addToActivityFeed(event));
  }
);
```

### Flow Control Options

| Method | Use Case | Example |
|---|---|---|
| **Rate Limit** | Max N events per period | 3 alerts/user/day |
| **Throttle** | Delay execution when over limit | Smooth traffic spikes |
| **Debounce** | Deduplicate within window | Prevent email spam |
| **Concurrency** | Max simultaneous runs | 10 parallel notifications |

---

## 6. Deployment Considerations

### Vercel Integration

✓ Zero config needed
✓ Auto-scales
✓ Functions stored in repo
✓ Logs visible in dashboard
✓ Free tier available

### Environment Variables

```env
INNGEST_EVENT_KEY=<from-dashboard>
INNGEST_EVENT_API=https://inn.gs
```

Set in Vercel dashboard; Inngest SDK auto-configures.

### Monitoring & Observability

- Real-time execution traces
- Error stack traces with context
- Audit trail of all events
- Custom logging via `step.run()`
- Alerting on failures (paid tier)

### Cost Structure

- **Free:** 100k/month function runs
- **Pro:** Pay-per-run + higher limits
- **OpinionScope estimate (v1):** Well within free tier initially

---

## 7. Best Practices for This Use Case

### Pattern 1: Market Data Sync
```typescript
// Every 5 min, but skip if previous run hasn't completed
inngest.createFunction(
  {
    id: "sync-market-data",
    concurrency: { limit: 1 }, // Only one at a time
  },
  { cron: "*/5 * * * *" },
  async ({ step }) => {
    const markets = await step.run("fetch", () => fetchMarketsAPI());
    await step.run("upsert", () => upsertToConvex(markets));
  }
);
```

### Pattern 2: Whale Detection
```typescript
// Listen to blockchain events or API polls
inngest.createFunction(
  { id: "detect-whale-activity" },
  { event: "blockchain.trade" },
  async ({ event, step }) => {
    if (isWhaleAddress(event.data.trader)) {
      // Store activity
      await step.run("store", () => recordWhaleActivity(event));
      // Trigger tiered notifications
      await inngest.send({ name: "whale.activity", data: event });
    }
  }
);
```

### Pattern 3: Alert Processing
```typescript
// Batch + rate limit to prevent spam
inngest.createFunction(
  {
    id: "send-alert",
    rateLimit: { limit: 1, period: "1m", key: "event.data.userId" },
  },
  { event: "alert.triggered" },
  async ({ event, step }) => {
    const user = await step.run("fetch-user", () => getUser(event.data.userId));
    await step.run("send", () => sendViaChannel(user, event));
  }
);
```

### Key Principles

- **Idempotency:** Functions may retry; make ops safe
- **Error handling:** Retries auto; log errors explicitly
- **Step isolation:** Each `step.run()` isolated; safe to checkpoint
- **Scale naturally:** No config needed; auto-scales

---

## 8. Integration with Convex

**Clean handoff:**
- Inngest triggers on schedule/event
- Convex mutations called via `step.run()`
- Results stored in Convex database
- Real-time subscriptions update UI

**No special coordination needed.** Treat Convex as a normal API within step handlers.

---

## 9. Unresolved Questions & Gaps

1. **Webhook delays:** How to reliably detect whale activity in real-time? (Polling vs. blockchain indexing?) → Needs architectural decision
2. **Cost at scale:** 500k+ monthly alerts—need to estimate Inngest tier cost
3. **Concurrency limits:** Max concurrent notifications to avoid rate-limit resets at external services (SendGrid, etc.)
4. **Event retention:** How long should whale activity events be retained for replay?
5. **Analytics:** Should we track function execution metrics separately from app metrics?

---

## Sources

- [Inngest Documentation](https://www.inngest.com/docs)
- [Crons (Scheduled Functions) Guide](https://www.inngest.com/docs/guides/scheduled-functions)
- [Serverless Scheduled & Cron Jobs](https://www.inngest.com/uses/serverless-cron-jobs)
- [Next.js Quick Start](https://www.inngest.com/docs/getting-started/nextjs-quick-start)
- [Background Jobs Guide](https://www.inngest.com/docs/guides/background-jobs)
- [Rate Limiting Documentation](https://www.inngest.com/docs/guides/rate-limiting)
- [Flow Control Guide](https://www.inngest.com/docs/guides/flow-control)
- [Running Background Jobs in Next.js](https://www.inngest.com/blog/run-nextjs-functions-in-the-background)
- [Building Event-Driven Workflows with Next.js, tRPC, and Inngest](https://www.inngest.com/blog/nextjs-trpc-inngest)
