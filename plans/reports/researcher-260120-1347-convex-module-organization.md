# Research Report: Convex Module Organization & Re-export Patterns

**Date:** 2026-01-20 | **Focus:** Splitting large Convex files and re-exporting internal functions

---

## Executive Summary

Re-exporting `internalMutation`/`internalAction` from subdirectories **should theoretically work** in Convex. The "Type instantiation is excessively deep" error is **likely a TypeScript type generation issue**, not a fundamental Convex limitation. The error occurs when complex type chains are created during code generation.

**Recommendation:** Use **helper functions pattern** instead of re-exports for internal logic sharing. This avoids the type generation complexity entirely.

---

## Key Findings

### 1. Convex Module Organization Support

✅ **Subdirectories are fully supported:**
- Convex automatically reflects directory structure in API paths
- Example: `convex/foo/myQueries.ts` → `api.foo.myQueries.listMessages`
- This pattern works for regular queries/mutations/actions

✅ **Internal functions follow same structure:**
- Search results confirm: `internal.myFolder.myMigrationsFile.*` pattern is valid
- Directory organization is built into Convex's auto-generated API system

---

### 2. The Re-export Question: Direct vs. Indirect

**Direct approach (what you're attempting):**
```typescript
// convex/scheduling.ts
export { syncDomain } from "./scheduling/sync-domain"
export { cleanupStats } from "./scheduling/cleanup-stats"
```

**Problem identified:** Convex's type generation system appears to create deep type chains when following re-export paths, causing TypeScript's type instantiation limit to be exceeded.

**Why:** Convex generates type definitions for the `internal` object based on actual function definitions. Re-exporting adds layers of indirection that can inflate the type graph complexity.

---

### 3. Best Practice: Helper Functions Pattern

Convex's official best practices **strongly recommend** a different approach:

**Recommended architecture:**
```
convex/
├── model/
│   ├── scheduling-domain.ts      # Helper functions (plain TypeScript)
│   ├── scheduling-cleanup.ts     # Helper functions
│   └── scheduling-stats.ts       # Helper functions
└── scheduling.ts                 # Public API (thin wrapper)
```

**Key principle:** "Most logic should be written as plain TypeScript functions, with the `query`, `mutation`, and `action` wrapper functions being a thin wrapper around one or more helper function."

**Advantages:**
- No re-export type complexity
- Cleaner separation (logic vs. decorators)
- Easier to test
- Better code reusability
- No "Type instantiation" errors

---

### 4. Why "Type Instantiation is Excessively Deep" Occurs

Based on Convex community issues found:

- **Root cause:** Using internal functions with `ctx.runQuery(internal.router.*.*)` creates deeply nested type references
- **Convex-specific issue:** When re-exporting internal functions, the type generator can't simplify the type chain
- **Solution in other cases:** Convert internal functions to plain helper functions instead
- **Type assertion workaround:** Use explicit type assertions to break the type chain (last resort)

---

### 5. Code Bundling - No Limitation Found

Convex uses **esbuild for bundling** and explicitly supports both ESM (import/export) and CommonJS syntax. No specific limitations found regarding re-exports during bundling. The type error is compile-time only, not runtime.

---

## What Works vs. What Doesn't

| Pattern | Status | Notes |
|---------|--------|-------|
| Subdirectories for functions | ✅ Works | `convex/scheduling/sync.ts` → `internal.scheduling.sync.*` |
| Helper functions in subdirs | ✅ Works | Plain TypeScript, no decorators |
| Re-exporting public mutations | ⚠️ May cause type issues | If calling via `ctx.runMutation()` |
| Re-exporting internal functions | ⚠️ **Causes type errors** | Deep type instantiation problem |
| Direct internal function definitions | ✅ Works | Define in target file, no re-export needed |

---

## Recommended Solution Path

**Option A: Direct Definition (No Re-export)**
```typescript
// convex/scheduling/sync-domain.ts
import { internalMutation } from "../_generated/server"

export const syncDomain = internalMutation({...})
export const syncMarkets = internalMutation({...})

// Then in parent: convex/scheduling.ts
// Re-export if needed for external use
export * from "./scheduling/sync-domain"
```

✅ **Pros:** No type generation issues, clean structure
⚠️ **Con:** API path changes to `internal.scheduling.syncDomain.*`

**Option B: Helper Functions (RECOMMENDED)**
```typescript
// convex/model/scheduling-domain.ts
export async function syncDomain(ctx, args) { /* logic */ }
export async function syncMarkets(ctx, args) { /* logic */ }

// convex/scheduling.ts
import { internalMutation } from "./_generated/server"
import * as schedulingDomain from "./model/scheduling-domain"

export const syncDomain = internalMutation(async (ctx, args) => {
  return schedulingDomain.syncDomain(ctx, args)
})
```

✅ **Pros:**
- No type errors
- Clean internal API paths preserved
- Best practice alignment
- Easier to test

**Option C: Split Files (No Re-export)**
```typescript
// convex/scheduling-sync.ts
export const syncDomain = internalMutation({...})

// convex/scheduling-cleanup.ts
export const cleanup = internalMutation({...})
```

✅ **Pros:** Avoids type issues entirely
⚠️ **Con:** API paths become `internal.schedulingSync.*` instead of `internal.scheduling.*`

---

## Why Your Current Approach Fails

When Convex's type generator encounters:
```typescript
// convex/scheduling.ts
export { syncDomain } from "./scheduling/sync-domain"
```

It tries to:
1. Scan the re-export target
2. Include full type definition chain
3. Generate combined type for `internal.scheduling.syncDomain`
4. This creates deeply nested generics → TypeScript limit exceeded

The type generator wasn't designed for type resolution through re-export chains.

---

## Unresolved Questions

1. **Exact TypeScript version threshold:** At what `typeRoots` depth does the error trigger? (Minor issue)
2. **Convex type generation internals:** Does Convex have a `tsconfig` optimization for deep types? Not documented.
3. **Performance impact:** If re-exports worked, would there be runtime overhead? Likely no, but not confirmed in docs.

---

## Sources

- [Internal Functions | Convex Developer Hub](https://docs.convex.dev/functions/internal-functions)
- [Best Practices | Convex Developer Hub](https://docs.convex.dev/understanding/best-practices/)
- [Bundling | Convex Developer Hub](https://docs.convex.dev/functions/bundling)
- [Convex Community - Type instantiation error](https://discord-questions.convex.dev/m/1375010574618071091)
- [Convex Community - Type instantiation with monorepo](https://github.com/get-convex/convex-js/issues/53)
- [Module: server | Convex Developer Hub](https://docs.convex.dev/api/modules/server)
