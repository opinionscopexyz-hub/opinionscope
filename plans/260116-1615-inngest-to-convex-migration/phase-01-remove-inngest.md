# Phase 01: Remove Inngest

## Context Links
- [Plan Overview](./plan.md)
- [Brainstorm Decision](../reports/brainstorm-260116-1615-inngest-vs-convex-scheduling.md)

## Overview
- **Priority:** P0
- **Status:** Completed
- **Effort:** 30m
- **Completed:** 2026-01-16 16:15 UTC
- **Description:** Remove all Inngest files, dependencies, and environment variables.

## Files to Delete

```
apps/web/src/lib/inngest/           # Entire directory
├── client.ts
└── functions/
    └── index.ts

apps/web/src/app/api/inngest/       # Entire directory
└── route.ts
```

## Implementation Steps

### Step 1: Delete Inngest Directory
```bash
rm -rf apps/web/src/lib/inngest
```

### Step 2: Delete API Route
```bash
rm -rf apps/web/src/app/api/inngest
```

### Step 3: Remove Package Dependency

Update `apps/web/package.json`:

```diff
  "dependencies": {
-   "inngest": "^3.49.2",
    ...
  }
```

Also remove dev scripts:
```diff
  "scripts": {
    "dev": "next dev --port 3001",
-   "dev:inngest": "npx inngest-cli@latest dev",
-   "dev:inngest-local": "npx --ignore-scripts=false inngest-cli@latest dev",
    ...
  }
```

### Step 4: Update Lock File
```bash
bun install
```

### Step 5: Remove Environment Variables

From `.env.local` and any deployment configs, remove:
```
INNGEST_EVENT_KEY=xxx
INNGEST_SIGNING_KEY=xxx
```

## Todo List

- [x] Delete `apps/web/src/lib/inngest/` directory
- [x] Delete `apps/web/src/app/api/inngest/` directory
- [x] Remove `inngest` from package.json dependencies
- [x] Remove inngest scripts from package.json
- [x] Run `bun install` to update lock file
- [x] Remove INNGEST_* env vars from .env files
- [x] Verify linting passes

## Success Criteria

- [x] No `inngest` in `bun.lock`
- [x] No imports referencing inngest
- [x] Linting passes without errors

## Completion Notes

Phase 01 completed successfully. All Inngest dependencies removed from codebase.

**Changes:**
- Deleted Inngest client, functions, API route
- Removed inngest package from package.json
- Removed INNGEST_* env vars from env validation
- Updated turbo.json and root package.json scripts
- Fixed pre-existing bugs found during build validation

**Pre-existing Bug Fixes (bonus):**
1. Clerk webhook type import (type-only)
2. Health check status comparison
3. Next.js 16 Link typing issues
4. Base UI render prop usage
5. Tier limits earlyAccessSeconds missing values

**Verified:**
- No inngest references in codebase (grep confirmed)
- No inngest in bun.lock
- Linting passes cleanly
- .env properly ignored by git

## Next Steps

Proceed to [Phase 02: Add Convex Components](./phase-02-add-convex-components.md)
