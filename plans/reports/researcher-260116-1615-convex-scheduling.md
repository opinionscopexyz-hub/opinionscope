# Research Report: Convex Native Scheduling & Workflow Components

**Research Date:** 2026-01-16
**Research Window:** Latest Convex documentation (Feb 2025 cutoff + live web search)
**Focus:** Migration from Inngest to Convex native solutions

---

## Executive Summary

Convex provides three complementary native solutions for background job scheduling:

1. **`cronJobs`** (built-in): Simple recurring schedules (5-min market sync, 1-min whale trades, hourly stats)
2. **`@convex-dev/workflow`** (package): Durable multi-step processes with state persistence & auto-retry
3. **`@convex-dev/action-retrier`** (package): Wraps external API calls with exponential backoff

**Key Finding:** Unlike Inngest, Convex scheduling is transactional—scheduled mutations are atomic with the mutation that created them. Actions (external calls) execute at-most-once without automatic retries, requiring manual retry logic or action-retrier wrapper.

**Recommendation:** For your use cases:
- **Market sync (5-min):** Use `crons.interval(minutes: 5)` → internal mutation calling action
- **Whale trades (1-min):** Use `crons.interval(minutes: 1)` + `@convex-dev/action-retrier`
- **Stats (hourly):** Use `crons.hourly()` with computed aggregation mutation
- **Daily cleanup:** Use `crons.daily()` with database cleanup mutation

---

## Research Methodology

**Sources Consulted:** 13 authoritative sources
**Content Type:** Official Convex docs + GitHub repositories + Stack Convex articles
**Search Terms:** cronJobs API, workflow durable execution, action-retrier retry patterns, scheduler guarantees, background jobs, rate limiting

---

## Key Findings

### 1. Convex cronJobs (Built-in)

#### Overview
Native cron job support without external packages. Defined in `convex/crons.ts` using `cronJobs()` handler.

#### API Methods

| Method | Example | Notes |
|--------|---------|-------|
| `interval()` | `crons.interval("market-sync", { seconds: 300 })` | 5-minute precision, second-level support |
| `cron()` | `crons.cron("stats", "0 * * * *")` | Standard cron syntax, UTC times, use Crontab Guru |
| `daily()` | `crons.daily("cleanup", { hourUTC: 2, minuteUTC: 0 })` | 2:00 AM UTC format |
| `hourly()` | `crons.hourly("whale-check", { minuteUTC: 0 })` | On the hour format |
| `weekly()` | `crons.weekly("report", { day: "monday", hourUTC: 9 })` | Day + time format |
| `monthly()` | `crons.monthly("billing", { day: 1, hourUTC: 0 })` | Day of month + time |

#### Execution Guarantees & Limitations

**Concurrency:**
- At most ONE execution per cron job at any moment
- No parallel runs of same job (built-in serialization)

**Failure Handling:**
- Long-running functions cause subsequent executions to skip
- Skipped runs logged in dashboard
- Follows standard error handling: retries on Convex errors, fails on dev errors

**Cold Start:**
- Initial execution happens at deployment time
- Subsequent runs follow schedule

#### Best Practice: Crons with Actions

```typescript
// ✓ Recommended pattern: synchronous mutation calls scheduled action
export const crons = cronJobs(internal, [
  {
    schedule: "interval(minutes: 5)",
    fn: internal.scheduling.syncMarkets,
  },
]);

export const syncMarkets = internalMutation({
  handler: async (ctx) => {
    // 1. Update state in DB
    await ctx.db.insert("syncLog", { status: "running", startedAt: Date.now() });

    // 2. Schedule external action (best effort)
    await ctx.scheduler.runAfter(0, internal.api.fetchMarketData);
  },
});

export const fetchMarketData = internalAction({
  handler: async (ctx) => {
    const response = await fetch("https://api.example.com/markets");
    // Update markets via internal mutation
    return response.json();
  },
});
```

---

### 2. Convex Scheduler (`ctx.scheduler`)

#### Core Methods

**`runAfter(milliseconds, fn, args)`**
- Delays execution by N milliseconds
- Stored in database (survives restarts)
- Returns scheduled function ID

**`runAt(timestamp, fn, args)`**
- Executes at specific timestamp (Date.now() + offset)
- Precise timing for future dates

#### Transactional Guarantees

| Scenario | Mutation | Action |
|----------|----------|--------|
| Scheduled if succeeds | ✓ Guaranteed | ✓ Best effort |
| Atomic with caller | ✓ Yes | ✗ No |
| Auto-retry on error | ✓ Yes | ✗ No (at-most-once) |
| Use case | Reliable workflows | Side effects only |

**Critical:** Use mutations for reliable scheduling chains. Use actions only when side effects are acceptable.

#### Pattern: Reliable Retry Loop

```typescript
// For actions that must succeed, wrap in mutation retry logic
export const reliableExternalCall = internalMutation({
  args: { url: v.string(), maxRetries: v.number() },
  handler: async (ctx, args) => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= args.maxRetries; attempt++) {
      try {
        return await ctx.scheduler.runAfter(
          0,
          internal.api.fetchWithBackoff,
          { url: args.url, attempt }
        );
      } catch (e) {
        lastError = e as Error;
        const delay = Math.pow(2, attempt) * 1000; // exponential backoff
        await ctx.scheduler.runAfter(delay, internal.api.retry, { ...args, attempt });
      }
    }
    throw lastError;
  },
});
```

---

### 3. @convex-dev/workflow Package

#### Overview
Durable execution framework for **multi-step workflows** that survive server restarts. Builds on Workpool component.

#### Installation & Setup

```bash
npm install @convex-dev/workflow
```

```typescript
// convex/convex.config.ts
import workflow from "@convex-dev/workflow/convex.config.js";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(workflow);
export default app;
```

```typescript
// convex/index.ts
import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "./_generated/api";

export const workflow = new WorkflowManager(components.workflow);
```

#### Core Concepts

**Durability:** Survives server crashes, maintains state across steps
**Determinism Requirement:** Workflow orchestration must be deterministic; delegate actual work to queries/mutations/actions
**Step Recording:** Each step output recorded; resumption skips completed steps

#### Workflow Definition Pattern

```typescript
export const myWorkflow = internalConvexFunction(
  {
    args: { marketId: v.id("markets") },
  },
  async (ctx, args) => {
    // Step 1: Fetch market
    const market = await step.runQuery(internal.markets.getById, { id: args.marketId });

    // Step 2: Call external API (parallel example)
    const [prices, trades] = await Promise.all([
      step.runAction(internal.api.getPrices, { market: market._id }),
      step.runAction(internal.api.getTrades, { market: market._id }),
    ]);

    // Step 3: Update database
    await step.runMutation(internal.markets.update, {
      id: market._id,
      prices,
      trades,
    });

    // Step 4: Schedule follow-up (optional delay)
    await step.sleepUntil(Date.now() + 60000); // 1 minute delay
  }
);
```

#### Retry Configuration

**Global defaults:**
```typescript
const workflow = new WorkflowManager(components.workflow, {
  workpoolOptions: {
    defaultRetryBehavior: {
      maxAttempts: 3,
      initialBackoffMs: 100,
      base: 2, // 100ms, 200ms, 400ms
    },
  },
});
```

**Per-step override:**
```typescript
await step.runAction(internal.api.fetch, args, {
  retry: false, // disable retry for this step
});

// or custom per-step
await step.runAction(internal.api.fetch, args, {
  retry: { maxAttempts: 5, initialBackoffMs: 500 },
});
```

#### Data Limits

⚠️ **Critical:** Steps can only transfer max **1 MiB** total data between workflow and external functions. Workaround: store results in DB, pass IDs.

#### Completion Callbacks

```typescript
const workflowId = await workflow.start(ctx, internal.myWorkflow, args, {
  onComplete: internal.handleCompletion,
  context: { user: "admin" }, // pass context to callback
});

export const handleCompletion = internalMutation({
  args: {
    id: workflowRunIdValidator,
    result: workflowResultValidator,
  },
  handler: async (ctx, args) => {
    if (args.result.type === "success") {
      console.log("Workflow completed");
    } else if (args.result.type === "failure") {
      console.log("Workflow failed:", args.result.error);
    } else if (args.result.type === "canceled") {
      console.log("Workflow canceled");
    }
  },
});
```

#### Use Case: NOT Recommended for Simple Crons

Workflows add overhead (state persistence, determinism constraints). Use for **multi-step, long-duration processes** (hours/days), not 1-minute polling.

---

### 4. @convex-dev/action-retrier Package

#### Overview
Purpose-built wrapper for external API calls with exponential backoff. Lighter than workflows for simple "call external API with retries" pattern.

#### Installation & Setup

```bash
npm install @convex-dev/action-retrier
```

```typescript
// convex/convex.config.ts
import actionRetrier from "@convex-dev/action-retrier/convex.config.js";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(actionRetrier);
export default app;
```

```typescript
// convex/index.ts
import { ActionRetrier } from "@convex-dev/action-retrier";
import { components } from "./_generated/api";

export const retrier = new ActionRetrier(components.actionRetrier);
```

#### Retry Configuration

Default: `initialBackoffMs: 250`, `base: 2`, `maxFailures: 4`

```typescript
// Custom global
const retrier = new ActionRetrier(components.actionRetrier, {
  initialBackoffMs: 1000,  // start with 1 second
  base: 3,                 // 1s, 3s, 9s, 27s...
  maxFailures: 5,          // retry 5 times
});

// Override per-call
await retrier.run(ctx, internal.api.fetchWhales, args, {
  initialBackoffMs: 500,
  base: 2,
  maxFailures: 6,
});
```

#### Core API

**Start a run:**
```typescript
const runId = await retrier.run(ctx, internal.api.fetchData, { url: "..." });
```

**Check status:**
```typescript
const status = await retrier.status(ctx, runId);
if (status.type === "completed") {
  console.log(status.result);
} else if (status.type === "failed") {
  console.log(status.error);
}
```

**Cancel:**
```typescript
await retrier.cancel(ctx, runId);
```

**Cleanup (auto after 7 days, manual cleanup):**
```typescript
await retrier.cleanup(ctx, runId);
```

#### Completion Callback Pattern

Guarantees exactly-once callback execution on completion:

```typescript
// Start with callback
await retrier.run(ctx, internal.api.fetchMarkets, args, {
  onComplete: internal.handleFetchComplete,
});

// Callback fires once (success/fail/cancel)
export const handleFetchComplete = internalMutation({
  args: {
    id: runIdValidator,
    result: runResultValidator,
  },
  handler: async (ctx, args) => {
    if (args.result.type === "success") {
      await ctx.db.insert("syncLog", {
        status: "completed",
        result: args.result.returnValue,
      });
    } else {
      await ctx.db.insert("syncLog", {
        status: "failed",
        error: args.result.error,
      });
    }
  },
});
```

#### Example: Whale Trade Sync

```typescript
// Whale trade sync scheduled every 1 minute
export const crons = cronJobs(internal, [
  {
    schedule: "interval(minutes: 1)",
    fn: internal.scheduling.syncWhales,
  },
]);

// Mutation triggered by cron
export const syncWhales = internalMutation({
  handler: async (ctx) => {
    const runId = await retrier.run(
      ctx,
      internal.api.fetchWhaleActivity,
      { limit: 100 },
      {
        initialBackoffMs: 250,
        base: 2,
        maxFailures: 3,
        onComplete: internal.handleWhaleSyncComplete,
      }
    );

    return { runId };
  },
});

// External API call
export const fetchWhaleActivity = internalAction({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const response = await fetch("https://blockchain-api.example.com/whales", {
      headers: { "Authorization": `Bearer ${process.env.API_KEY}` },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  },
});

// Callback
export const handleWhaleSyncComplete = internalMutation({
  args: { id: runIdValidator, result: runResultValidator },
  handler: async (ctx, args) => {
    if (args.result.type === "success") {
      const whales = args.result.returnValue;
      for (const whale of whales) {
        await ctx.db.patch(
          whale._id,
          { lastActivity: Date.now(), ...whale.update }
        );
      }
    }
  },
});
```

---

### 5. Best Practices for Convex Background Jobs

#### Actions vs Mutations Comparison

| Aspect | Mutation | Action |
|--------|----------|--------|
| External calls | ✗ Not allowed | ✓ Allowed |
| Database writes | ✓ Transactional | ✗ Only via mutation callback |
| Retry behavior | ✓ Auto-retry | ✗ Manual or via retrier |
| Scheduling guarantee | ✓ Atomic | ✗ Best effort |
| Durability | ✓ High | ✗ Standard |
| Typical use | State management, workflow | External APIs, I/O |

#### Pattern: Reliable External Call Chain

```typescript
// ✓ Recommended: Mutation schedules action reliably
export const syncMarketData = internalMutation({
  handler: async (ctx) => {
    // 1. Atomically record that sync started
    const syncId = await ctx.db.insert("syncs", {
      status: "in_progress",
      startedAt: Date.now(),
    });

    // 2. Schedule action via scheduler (atomic with above)
    const retryRunId = await retrier.run(
      ctx,
      internal.api.callExternalMarketAPI,
      { syncId },
      { maxFailures: 3, onComplete: internal.recordSyncResult }
    );
  },
});
```

#### Rate Limiting Pattern

For high-frequency syncs (1-min whale trades), prevent overwhelming external API:

```typescript
// Use Convex Rate Limiter component
import { RateLimiter } from "@convex-dev/rate-limiter";

export const whaleSync = internalMutation({
  handler: async (ctx) => {
    const limiter = new RateLimiter(ctx, {
      key: "whale-api",
      rate: 60, // 60 requests
      period: 60000, // per minute
      sharding: true, // scale horizontally
    });

    const allowed = await limiter.take(1);
    if (!allowed) {
      console.log("Rate limited, skipping this run");
      return;
    }

    // Proceed with API call
    await retrier.run(ctx, internal.api.fetchWhales, {});
  },
});
```

#### Timeout Monitoring Pattern

For long-running syncs, add safety net:

```typescript
export const syncWithTimeout = internalMutation({
  handler: async (ctx) => {
    const syncId = await ctx.db.insert("syncs", {
      status: "running",
      startedAt: Date.now(),
    });

    // Start sync
    await retrier.run(ctx, internal.api.doSync, { syncId });

    // Schedule timeout check (5 minutes)
    await ctx.scheduler.runAfter(
      300000,
      internal.checkSyncTimeout,
      { syncId }
    );
  },
});

export const checkSyncTimeout = internalMutation({
  args: { syncId: v.id("syncs") },
  handler: async (ctx, args) => {
    const sync = await ctx.db.get(args.syncId);
    if (sync.status === "running") {
      // Timeout occurred
      await ctx.db.patch(args.syncId, {
        status: "failed",
        failureReason: "timeout",
        endedAt: Date.now(),
      });
    }
  },
});
```

---

## Comparative Analysis

### Inngest → Convex Migration Path

| Aspect | Inngest | Convex Native | Migration |
|--------|---------|-----------------|-----------|
| **Simple crons** | `client.sendEvent()` | `cronJobs()` | Direct replacement |
| **Durable steps** | `step.run()` | `@convex-dev/workflow` | Similar API, workpool-based |
| **Retry wrapper** | Built-in | `@convex-dev/action-retrier` | Drop-in for external calls |
| **Rate limiting** | Optional addon | `@convex-dev/rate-limiter` | Use together |
| **Scheduling guarantee** | Per-tenant | Transactional at DB level | Stronger guarantees |
| **Operational overhead** | External service | Zero (built-in) | Lower costs |

### Solution Selection Matrix

```
Need recurring schedule (5min, hourly)?
  → Use cronJobs (simplest, no package)

Need multi-step durable workflow?
  → Use @convex-dev/workflow (hours-days duration)

Need to reliably call external API?
  → Use @convex-dev/action-retrier (lightweight)

Need complex job state tracking?
  → Use background job table pattern + scheduler
```

---

## Implementation Recommendations

### Quick Start Guide: Your Three Use Cases

#### 1. Market Data Sync (Every 5 Minutes)

```typescript
// convex/crons.ts
export const crons = cronJobs(internal, [
  {
    schedule: "interval(minutes: 5)",
    fn: internal.scheduling.syncMarkets,
  },
]);

// convex/scheduling.ts
export const syncMarkets = internalMutation({
  handler: async (ctx) => {
    const syncId = await ctx.db.insert("market_syncs", {
      status: "running",
      startedAt: Date.now(),
    });

    await retrier.run(
      ctx,
      internal.api.fetchMarketData,
      { syncId },
      {
        initialBackoffMs: 500,
        maxFailures: 3,
        onComplete: internal.recordMarketSyncResult,
      }
    );
  },
});

export const fetchMarketData = internalAction({
  args: { syncId: v.id("market_syncs") },
  handler: async (ctx, args) => {
    const response = await fetch("https://markets-api.example.com/list", {
      headers: { "X-API-Key": process.env.MARKETS_API_KEY },
    });

    if (!response.ok) {
      throw new Error(`Markets API: ${response.status}`);
    }

    return await response.json();
  },
});

export const recordMarketSyncResult = internalMutation({
  args: { id: runIdValidator, result: runResultValidator },
  handler: async (ctx, args) => {
    const syncId = args.id; // from retrier run

    if (args.result.type === "success") {
      const markets = args.result.returnValue;

      for (const market of markets) {
        await ctx.db.patch(
          market._id,
          {
            yesPrice: market.priceYes,
            noPrice: market.priceNo,
            volume: market.volume24h,
            updatedAt: Date.now(),
          }
        );
      }

      await ctx.db.patch(syncId, {
        status: "completed",
        endedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(syncId, {
        status: "failed",
        error: args.result.error,
        endedAt: Date.now(),
      });
    }
  },
});
```

#### 2. Whale Trade Sync (Every 1 Minute)

```typescript
// convex/crons.ts
export const crons = cronJobs(internal, [
  {
    schedule: "interval(minutes: 1)",
    fn: internal.scheduling.syncWhales,
  },
]);

// convex/scheduling.ts
export const syncWhales = internalMutation({
  handler: async (ctx) => {
    // Check rate limit first
    const limiter = new RateLimiter(ctx, {
      key: "whale-api-calls",
      rate: 60, // 60 calls max
      period: 60000, // per minute
    });

    if (!(await limiter.take(1))) {
      console.log("Whale sync rate limited, skipping");
      return;
    }

    const syncId = await ctx.db.insert("whale_syncs", {
      status: "running",
      startedAt: Date.now(),
    });

    await retrier.run(
      ctx,
      internal.api.fetchWhaleActivity,
      { syncId },
      {
        initialBackoffMs: 250,
        base: 2,
        maxFailures: 3,
      }
    );

    // Timeout safety: if still running after 45 seconds, mark failed
    await ctx.scheduler.runAfter(
      45000,
      internal.scheduling.checkWhaleTimeout,
      { syncId }
    );
  },
});

export const fetchWhaleActivity = internalAction({
  args: { syncId: v.id("whale_syncs") },
  handler: async (ctx, args) => {
    const response = await fetch("https://blockchain.api.com/whale-trades", {
      headers: { "Authorization": `Bearer ${process.env.BLOCKCHAIN_API_KEY}` },
    });

    if (!response.ok) {
      throw new Error(`Blockchain API: ${response.status}`);
    }

    return await response.json();
  },
});

export const checkWhaleTimeout = internalMutation({
  args: { syncId: v.id("whale_syncs") },
  handler: async (ctx, args) => {
    const sync = await ctx.db.get(args.syncId);
    if (sync && sync.status === "running") {
      await ctx.db.patch(args.syncId, {
        status: "failed",
        error: "timeout after 45s",
        endedAt: Date.now(),
      });
    }
  },
});
```

#### 3. Hourly Stats Computation

```typescript
// convex/crons.ts
export const crons = cronJobs(internal, [
  {
    schedule: "hourly",
    fn: internal.scheduling.computeStats,
  },
]);

// convex/scheduling.ts
export const computeStats = internalMutation({
  handler: async (ctx) => {
    // Fetch all markets
    const markets = await ctx.db.query("markets").collect();

    // Compute aggregates (no external API call needed)
    const stats = {
      totalMarkets: markets.length,
      activeMarkets: markets.filter((m) => !m.resolvedAt).length,
      totalVolume: markets.reduce((sum, m) => sum + m.volume, 0),
      avgPrice: markets.reduce((sum, m) => sum + m.yesPrice, 0) / markets.length,
      computedAt: Date.now(),
    };

    // Store in stats table
    await ctx.db.insert("market_stats", stats);

    // Optional: Clean up old stats (older than 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const oldStats = await ctx.db
      .query("market_stats")
      .filter((s) => s.computedAt < thirtyDaysAgo)
      .collect();

    for (const stat of oldStats) {
      await ctx.db.delete(stat._id);
    }
  },
});
```

#### 4. Daily Cleanup Job

```typescript
// convex/crons.ts
export const crons = cronJobs(internal, [
  {
    schedule: "daily",
    fn: internal.scheduling.dailyCleanup,
    config: { hourUTC: 2, minuteUTC: 0 }, // 2:00 AM UTC
  },
]);

// convex/scheduling.ts
export const dailyCleanup = internalMutation({
  handler: async (ctx) => {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;

    // Clean up old sync logs
    const oldSyncs = await ctx.db
      .query("market_syncs")
      .filter((s) => s.startedAt < twoDaysAgo)
      .collect();

    for (const sync of oldSyncs) {
      await ctx.db.delete(sync._id);
    }

    // Clean up failed retrier runs (cleanup manual trigger)
    const failedRuns = await ctx.db
      .query("retrier_runs")
      .filter((r) => r.status === "failed" && r.endedAt < twoDaysAgo)
      .collect();

    for (const run of failedRuns) {
      await retrier.cleanup(ctx, run.id);
    }

    console.log(`Cleanup: deleted ${oldSyncs.length} syncs, ${failedRuns.length} failed runs`);
  },
});
```

---

## Resources & References

### Official Documentation
- [Convex Cron Jobs](https://docs.convex.dev/scheduling/cron-jobs)
- [Convex API - Crons Class](https://docs.convex.dev/api/classes/server.Crons)
- [Convex Scheduled Functions](https://docs.convex.dev/scheduling/scheduled-functions)
- [Convex Workflows](https://docs.convex.dev/agents/workflows)
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/)

### Component Packages
- [@convex-dev/workflow on npm](https://www.npmjs.com/package/@convex-dev/workflow)
- [@convex-dev/action-retrier on npm](https://www.npmjs.com/package/@convex-dev/action-retrier)
- [@convex-dev/rate-limiter on npm](https://www.npmjs.com/package/@convex-dev/ratelimiter)

### GitHub Repositories
- [get-convex/workflow](https://github.com/get-convex/workflow)
- [get-convex/action-retrier](https://github.com/get-convex/action-retrier)
- [get-convex/rate-limiter](https://github.com/get-convex/rate-limiter)

### Stack Convex Articles
- [Background Job Management](https://stack.convex.dev/background-job-management)
- [Automatically Retry Actions](https://stack.convex.dev/retry-actions)
- [Rate Limiting at Application Layer](https://stack.convex.dev/rate-limiting)
- [Configure Cron Jobs at Runtime](https://stack.convex.dev/cron-jobs)
- [Durable Workflows & Strong Guarantees](https://stack.convex.dev/durable-workflows-and-strong-guarantees)

### Tutorials
- [Convex Tutorial: Calling External Services](https://docs.convex.dev/tutorial/actions)
- [Cron Jobs in Next.js with Convex](https://www.telerik.com/blogs/cron-jobs-nextjs-app-using-convex)
- [Throttling by Single-Flighting](https://stack.convex.dev/throttling-requests-by-single-flighting)

---

## Security Considerations

### API Key Management
- Store in `convex/.env.local` (not committed)
- Access in actions via `process.env.API_KEY`
- Rotate keys regularly for external services

### Rate Limiting
- Use `@convex-dev/rate-limiter` to prevent external API abuse
- Set per-service limits based on API tier
- Monitor burst patterns

### Error Handling
- Do NOT expose external API errors to clients
- Log failures for debugging
- Use `onComplete` callbacks to record state changes

### Data Validation
- Validate external API responses before DB insertion
- Use Zod validators for schema enforcement
- Sanitize text fields from external sources

---

## Common Pitfalls & Solutions

### Pitfall 1: Scheduling Actions Without Guarantees
**Problem:** Actions are at-most-once, so if the action succeeds but callback fails, state diverges.

**Solution:** Schedule from mutations only; mutations atomically schedule and update state together.

```typescript
// ✗ WRONG: Action scheduled from action
export const bad = action({
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.external); // May not run!
  },
});

// ✓ CORRECT: Action scheduled from mutation
export const good = internalMutation({
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.external); // Guaranteed if mutation commits
  },
});
```

### Pitfall 2: Exceeding 1 MiB Data Limit in Workflows
**Problem:** Workflow steps limited to 1 MiB total data transfer.

**Solution:** Store large results in DB, pass IDs through steps.

```typescript
// ✗ WRONG: Passing 10MB array through steps
const hugeData = await step.runQuery(internal.fetchHugeDataset, {});

// ✓ CORRECT: Store result, pass ID
const storageId = await step.runMutation(
  internal.storeDataset,
  { dataUrl: "s3://..." }
);
const data = await step.runQuery(internal.retrieveDataset, { storageId });
```

### Pitfall 3: Cron Runs Skipped Due to Long Duration
**Problem:** If sync takes >5 minutes and scheduled every 5 minutes, runs skip.

**Solution:** Increase interval or optimize function.

```typescript
// ✗ If sync takes 6 minutes:
schedule: "interval(minutes: 5)" // Will skip runs!

// ✓ Increase interval:
schedule: "interval(minutes: 10)"

// ✓ Or optimize function to complete faster
```

### Pitfall 4: Not Handling Retrier Status Checks
**Problem:** Started retrier run but don't check completion.

**Solution:** Use `onComplete` callback or poll status.

```typescript
// ✗ Fire and forget (may fail silently):
await retrier.run(ctx, internal.fetch, args);

// ✓ With callback:
await retrier.run(ctx, internal.fetch, args, {
  onComplete: internal.handleCompletion,
});

// ✓ Or track in DB:
const runId = await retrier.run(ctx, internal.fetch, args);
await ctx.db.insert("retrier_runs", { runId, status: "pending" });
```

---

## Appendices

### A. Glossary

**Action:** Convex function that can call external APIs; at-most-once execution, no auto-retry
**Cron:** Recurring scheduled task (e.g., every 5 minutes, daily at 2 AM)
**Durable Workflow:** Multi-step process that survives crashes and maintains state
**Exponential Backoff:** Retry delay doubles each attempt (100ms, 200ms, 400ms...)
**Idempotent:** Operation produces same result regardless of call count
**Mutation:** Convex function that reads/writes database; exactly-once with auto-retry
**Scheduler:** API to schedule functions at specific times or after delays
**Transactional:** Guaranteed to complete fully or not at all
**Workpool:** Component managing parallelism and queuing

### B. Decision Tree

```
┌─ Need recurring schedule?
│  ├─ Yes → Need complex multi-step workflow?
│  │        ├─ Yes → @convex-dev/workflow (durable)
│  │        └─ No → cronJobs (simple, built-in)
│  └─ No → Need to call external API?
│           ├─ Yes → Use action + @convex-dev/action-retrier
│           └─ No → Use scheduled mutation
└─ Need rate limiting?
   └─ Yes → Add @convex-dev/rate-limiter
```

### C. Convex Scheduling Feature Matrix

| Feature | cronJobs | Scheduler | Workflow | ActionRetrier |
|---------|----------|-----------|----------|---------------|
| Recurrence | ✓ | ✗ | ✗ | ✗ |
| Fixed schedule | ✓ | ✗ | ✗ | ✗ |
| One-time delay | ✗ | ✓ | ✗ | ✗ |
| Multi-step | ✗ | ✗ | ✓ | ✗ |
| Durable (crashes) | ✓ | ✓ | ✓ | ✓ |
| External API wrap | ✗ | ✗ | ✓ | ✓ |
| Auto-retry | ✓ | ✓ | ✓ | ✓ |
| Transactional | N/A | ✓ (mutations) | ✓ | ✗ (best effort) |

---

## Unresolved Questions

1. **Rate limit strategy for 1-minute syncs:** Should we use sharded rate limiter or request debouncing at cron level?
2. **Fallback behavior:** If all retries fail, should we alert or just log? Integration with monitoring system?
3. **Data freshness SLA:** What's acceptable staleness if a sync fails? Auto-escalate after N consecutive failures?
4. **Workflow vs Cron + Retrier trade-off:** For market price updates (stateless), is workflow overhead justified or is simple cron better?
5. **Cross-service coordination:** Do we need workflows to orchestrate multiple external API calls in order (market data → whale activity → stats)?

