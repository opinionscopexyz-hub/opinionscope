# Phase 02: Add Convex Components

## Context Links
- [Plan Overview](./plan.md)
- [Convex Scheduling Research](../reports/researcher-260116-1615-convex-scheduling.md)

## Overview
- **Priority:** P0
- **Status:** ✅ Completed
- **Effort:** 1h
- **Description:** Install and configure @convex-dev/action-retrier for reliable external API calls.

## Packages to Install

| Package | Purpose | Version |
|---------|---------|---------|
| `@convex-dev/action-retrier` | Retry external API calls with backoff | Latest |

**Note:** Built-in `cronJobs` requires no additional package.

## Implementation Steps

### Step 1: Install Action Retrier

```bash
cd packages/backend
bun add @convex-dev/action-retrier
```

### Step 2: Update convex.config.ts

```typescript
// packages/backend/convex/convex.config.ts
import { defineApp } from "convex/server";
import actionRetrier from "@convex-dev/action-retrier/convex.config";

const app = defineApp();
app.use(actionRetrier);

export default app;
```

### Step 3: Create Retrier Instance

Create `packages/backend/convex/lib/retrier.ts`:

```typescript
import { ActionRetrier } from "@convex-dev/action-retrier";
import { components } from "../_generated/api";

// Configure retrier with defaults matching Inngest behavior
export const retrier = new ActionRetrier(components.actionRetrier, {
  initialBackoffMs: 500,    // Start with 500ms delay
  base: 2,                  // Double each retry: 500ms, 1s, 2s, 4s
  maxFailures: 4,           // Retry up to 4 times
});
```

### Step 4: Deploy to Generate Types

```bash
cd packages/backend
bun run dev
# Wait for types to generate, then stop
```

## Related Code Files

### Create
- `packages/backend/convex/lib/retrier.ts` - Retrier instance

### Modify
- `packages/backend/convex/convex.config.ts` - Add action-retrier component
- `packages/backend/package.json` - Add dependency

## Todo List

- [x] Install `@convex-dev/action-retrier` in backend package
- [x] Update `convex.config.ts` to use action-retrier
- [x] Create `lib/retrier.ts` with configured instance
- [x] Run `bun run dev` to generate types
- [x] Verify no TypeScript errors

## Success Criteria

- [x] `@convex-dev/action-retrier` in package.json
- [x] `convex.config.ts` imports action-retrier
- [x] Types generated successfully
- [x] `retrier` instance exported from lib

## Review Notes

**Completed:** 2026-01-16 17:09

**Changes:**
- Added `@convex-dev/action-retrier@^0.3.0` dependency
- Configured action-retrier component in convex.config.ts
- Created retrier instance with exponential backoff config
- Fixed type-only import in auth.ts (pre-existing bug)
- Build, typecheck, lint all passing

**Quality Assessment:** 9/10
- Clean implementation following Convex patterns
- Appropriate retry configuration
- Good documentation in code
- No security issues
- Minor: Could add unit tests for retrier config (future work)

## Next Steps

Proceed to [Phase 03: Implement Cron Jobs](./phase-03-implement-crons.md)
