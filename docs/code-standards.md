# OpinionScope Code Standards

Development standards, naming conventions, file organization, and TypeScript patterns for consistent, maintainable code.

---

## File & Directory Naming

### Naming Conventions

**Kebab-case for Files:**
- Self-documenting names (long names are encouraged)
- Descriptive purpose visible to LLM tools
- Examples: `market-screener.tsx`, `use-convex-query.ts`, `format-currency.ts`

**PascalCase for Directories:**
- Feature directories: `src/components/features/MarketScreener/`
- Utility directories: `src/lib/hooks/`, `src/lib/utils/`

**camelCase for Exports:**
- Function exports: `export function formatCurrency() { }`
- Variable exports: `export const authConfig = { }`
- React components: `export function MarketScreener() { }`

### File Organization by Type

**React Components:**
```
FileName.tsx (not FileName.component.tsx)
- PascalCase filename
- Default export if single component
- Named exports for sub-components
```

**Landing Page Components** (Phase 10):
```
landing/
├── hero-section.tsx - Hero with CTA buttons
├── features-grid.tsx - Feature showcase cards
├── how-it-works.tsx - Usage steps
├── pricing-preview.tsx - Tier pricing
├── testimonials.tsx - User testimonials
├── faq-section.tsx - FAQ accordion
├── cta-section.tsx - Conversion CTA
└── footer.tsx - Footer links
- Use "use client" for interactive components
- Prefer shadcn/ui Card, Button for consistency
- Use lucide-react icons for visuals
```

**Utilities/Hooks:**
```
use-something.ts (hooks)
format-something.ts (formatters)
validate-something.ts (validators)
constants.ts (constants)
- camelCase export functions
- Type exports use PascalCase
```

**Convex Functions:**
```
convex/
├── users.ts          (user queries/mutations)
├── markets.ts        (market queries)
├── whales.ts         (whale queries)
├── schema.ts         (database schema)
└── auth.config.ts    (auth configuration)
```

---

## TypeScript Patterns

### Type Definitions

**Type Naming:**
```typescript
// Use PascalCase for types
type User = {
  id: string;
  email: string;
  tier: "free" | "pro" | "pro_plus";
  createdAt: Date;
};

// Use 'I' prefix for interfaces (optional but consistent)
interface UserPreferences {
  emailNotifications: boolean;
  darkMode: boolean;
}

// Use 'T' prefix for generic type parameters
type AsyncResult<T> = { data: T } | { error: Error };
```

**Enum Naming:**
```typescript
// PascalCase, singular for value
enum TierLevel {
  Free = "free",
  Pro = "pro",
  ProPlus = "pro_plus"
}

// Better: Use const union
type Tier = "free" | "pro" | "pro_plus";
```

### Function Signatures

**Query/Mutation Functions (Convex):**
```typescript
// Convex query pattern
export const listMarkets = query({
  args: {
    category: v.optional(v.string()),
    minVolume: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new ConvexError("Unauthorized");

    return await ctx.db
      .query("markets")
      .filter(q => q.gte(q.field("volume"), args.minVolume ?? 0))
      .collect();
  }
});

// Convex mutation pattern
export const createAlert = mutation({
  args: {
    marketId: v.id("markets"),
    condition: v.object({
      operator: v.union(v.literal("gt"), v.literal("lt")),
      value: v.number()
    })
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new ConvexError("Unauthorized");

    const newAlertId = await ctx.db.insert("alerts", {
      userId: user.subject as Id<"users">,
      type: "price",
      marketId: args.marketId,
      condition: args.condition,
      isActive: true,
      triggerCount: 0,
      createdAt: Date.now()
    });

    return newAlertId;
  }
});
```

**React Hook Functions:**
```typescript
// useQuery pattern
export function useConvexQuery<T>(
  query: QueryReference<T>,
  args?: Record<string, unknown>
): T | undefined {
  return useQuery(query, args ?? {});
}

// useState pattern for forms
const [email, setEmail] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Null/Undefined Handling

**Prefer Optional Fields:**
```typescript
// Good: Clear optional field
type Market = {
  id: string;
  title: string;
  description?: string;  // Clearly optional
  imageUrl?: string;
};

// Avoid: Using null for missing
type Market = {
  description: string | null;  // Use undefined instead
};
```

**Optional Chaining & Nullish Coalescing:**
```typescript
// Good: Modern operators
const avatar = user?.avatarUrl ?? defaultAvatar;
const notifs = user?.notifications?.length ?? 0;

// Avoid: Traditional ternary chains
const avatar = user && user.avatarUrl ? user.avatarUrl : defaultAvatar;
```

---

## Convex Patterns

### Schema Definition

**Validators:**
```typescript
// Create reusable validators for common types
const tierValidator = v.union(
  v.literal("free"),
  v.literal("pro"),
  v.literal("pro_plus")
);

const alertConditionValidator = v.object({
  operator: v.union(v.literal("gt"), v.literal("lt"), v.literal("eq")),
  value: v.number()
});

// Use in schema
defineTable({
  tier: tierValidator,
  condition: alertConditionValidator
})
```

**Indexes:**
```typescript
// Name indexes descriptively
defineTable({
  clerkId: v.string(),
  email: v.string(),
  tier: v.string()
})
  .index("by_clerkId", ["clerkId"])      // Primary lookup
  .index("by_email", ["email"])          // Email search
  .index("by_tier", ["tier"])            // Filtering by tier
```

**Index Naming Convention:**
- Single field: `by_{fieldName}`
- Multi-field: `by_{field1}_{field2}`
- Sorted queries: `by_{field}_asc` or `by_{field}_desc`

### Query Authorization

**Always Check User Identity:**
```typescript
export const getUserData = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // 1. Get authenticated user
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new ConvexError("Not authenticated", { code: 401 });

    // 2. Verify ownership (prevent data leak)
    if (user.subject !== args.userId) {
      throw new ConvexError("Forbidden", { code: 403 });
    }

    // 3. Check tier for feature access
    const userData = await ctx.db.get(args.userId);
    if (userData.tier === "free") {
      // Return limited data
    }

    return userData;
  }
});
```

### Mutation Error Handling

**Use ConvexError for Client-facing Errors:**
```typescript
export const updateAlert = mutation({
  args: { alertId: v.id("alerts"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new ConvexError("Not authenticated");

    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new ConvexError("Alert not found", { code: 404 });

    if (alert.userId !== (user.subject as Id<"users">)) {
      throw new ConvexError("Forbidden", { code: 403 });
    }

    // Update
    await ctx.db.patch(args.alertId, { isActive: args.isActive });
    return await ctx.db.get(args.alertId);
  }
});
```

---

## React/Next.js Patterns

### Component Structure

**File Organization:**
```
src/components/
├── ui/                          # shadcn/ui + primitives
│   ├── button.tsx
│   ├── card.tsx
│   └── table.tsx
│
├── layout/                      # Layout-level components
│   ├── navbar.tsx               # Top navigation
│   ├── sidebar.tsx              # Side navigation
│   └── footer.tsx               # Footer
│
├── features/                    # Feature-specific components
│   ├── market-screener/
│   │   ├── index.tsx            # Export barrel
│   │   ├── screener-filters.tsx
│   │   ├── screener-table.tsx
│   │   └── screener-utils.ts
│   │
│   └── whale-tracker/
│       ├── index.tsx
│       ├── whale-list.tsx
│       └── whale-stats.tsx
│
└── common/                      # Reusable components
    ├── loading-spinner.tsx
    ├── empty-state.tsx
    └── error-boundary.tsx
```

**Component Naming:**
```typescript
// Good: Descriptive, matches file
export function MarketScreener() {
  return <div>...</div>;
}

// Avoid: Generic or shortened
function Screen() { }  // Too generic
function MkrScr() { }  // Unclear abbreviation
```

### Props Typing

**Define Props Interface:**
```typescript
interface MarketScreenerProps {
  initialCategory?: string;
  minVolume?: number;
  onMarketSelect?: (marketId: string) => void;
}

export function MarketScreener({
  initialCategory = "all",
  minVolume = 0,
  onMarketSelect
}: MarketScreenerProps) {
  // Implementation
}
```

**Optional Props:**
```typescript
// Good: Optional with defaults
interface AlertFormProps {
  marketId?: string;        // Optional
  onSubmit: (data: Alert) => void;  // Required
  isLoading?: boolean;
}

// Use default values
function AlertForm({ marketId, onSubmit, isLoading = false }: AlertFormProps) {
  // ...
}
```

### Hooks Usage

**useQuery for Data:**
```typescript
function MarketScreener() {
  // Use Convex query hook
  const markets = useQuery(
    api.markets.listMarkets,
    { category: "crypto", minVolume: 1000 }
  );

  if (markets === undefined) return <LoadingSpinner />;

  return (
    <div>
      {markets.map(market => (
        <MarketCard key={market._id} market={market} />
      ))}
    </div>
  );
}
```

**useMutation for Updates:**
```typescript
function UpdateAlertButton({ alertId }: { alertId: string }) {
  const updateAlert = useMutation(api.alerts.updateAlert);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      await updateAlert({ alertId, isActive: false });
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return <button onClick={handleUpdate} disabled={isLoading}>Update</button>;
}
```

### Styling

**Use Tailwind Classnames:**
```typescript
export function Card({ title, children }: Props) {
  return (
    <div className="bg-elevated rounded-lg border border-subtle p-6">
      <h3 className="text-lg font-semibold text-primary mb-4">{title}</h3>
      <div className="text-secondary">{children}</div>
    </div>
  );
}
```

**CSS Variables (Design System):**
```css
/* in index.css */
:root {
  --bg-base: #09090b;
  --bg-elevated: #18181b;
  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --accent-primary: #3b82f6;
}

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors;
  }
}
```

---

## Error Handling

### Try-Catch Pattern

**Server-side (Convex):**
```typescript
export const mutation = mutation({
  handler: async (ctx, args) => {
    try {
      const result = await someAsyncOperation();
      return result;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;  // Re-throw known errors
      }
      console.error("Unexpected error:", error);
      throw new ConvexError("Internal server error", { code: 500 });
    }
  }
});
```

**Client-side (React):**
```typescript
function UpdateButton() {
  const updateAlert = useMutation(api.alerts.updateAlert);

  const handleUpdate = async () => {
    try {
      await updateAlert({ /* args */ });
      // Success - show toast
    } catch (error) {
      const message = error instanceof ConvexError
        ? error.message
        : "An error occurred";
      console.error(message);
      // Show error toast to user
    }
  };

  return <button onClick={handleUpdate}>Update</button>;
}
```

---

## Naming Conventions Summary

| Item | Pattern | Example |
|------|---------|---------|
| **Files (Components)** | PascalCase | `MarketScreener.tsx` |
| **Files (Utils/Hooks)** | kebab-case | `use-convex-query.ts` |
| **Directories** | PascalCase | `components/MarketScreener/` |
| **Functions** | camelCase | `formatCurrency()` |
| **React Components** | PascalCase | `function MarketScreener()` |
| **Types** | PascalCase | `type Market = {}` |
| **Interfaces** | PascalCase | `interface UserProps {}` |
| **Constants** | UPPER_SNAKE_CASE | `const MAX_ALERTS = 100;` |
| **Enums** | PascalCase | `enum Tier {}` |
| **Private Functions** | prefix `_` | `function _calculateTotal()` |
| **Boolean vars** | prefix `is/has` | `isLoading`, `hasError` |
| **Convex Tables** | camelCase | `users`, `whaleActivity` |

---

## Code Comments

### Comment When Not Obvious

**Good Comments:**
```typescript
// Tiered visibility: ProPlus sees immediately, Pro after 30s, Free after 15min
const visibleToProPlusAt = Date.now();
const visibleToProAt = Date.now() + 30 * 1000;
const visibleToFreeAt = Date.now() + 15 * 60 * 1000;

// Prevent SQL injection by using parameterized queries
const result = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
```

**Avoid Obvious Comments:**
```typescript
// Bad: Obvious from code
const user = await ctx.db.get(userId);  // Get user by ID
count++;  // Increment count

// Good: Explain why
// Fetch user to check if they have Pro tier for feature access
const user = await ctx.db.get(userId);

// Increment to track trigger count for analytics
count++;
```

### JSDoc for Public APIs

```typescript
/**
 * Formats a number as currency with proper thousand separators and decimals.
 * @param value - The number to format
 * @param currency - ISO 4217 currency code (default: USD)
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(value);
}
```

---

## File Size Guidelines

**Keep files under 200 lines:**
- Easier to understand and maintain
- Better for LLM context windows
- Promotes modular code organization

**If file exceeds 200 lines, consider:**
- Extracting hooks to separate file
- Moving utility functions to `lib/`
- Breaking large components into sub-components
- Creating separate modules for business logic

**Exceptions:**
- Configuration files (tsconfig.json, etc.)
- Auto-generated files
- Large schema definitions (acceptable in schema.ts)

---

## Pre-commit Checklist

Before committing code:

- [ ] TypeScript compiles without errors (`bun run check-types`)
- [ ] No `any` types without `// @ts-ignore` comment
- [ ] File names follow kebab-case (utils) or PascalCase (components)
- [ ] No hardcoded secrets or API keys
- [ ] Comments explain non-obvious logic
- [ ] Error handling uses try-catch or error boundaries
- [ ] Props interfaces defined for components
- [ ] Tests added for new features (if applicable)

---

## Convex-Specific Standards

**Schema Requirements:**
- All tables have `createdAt` and `updatedAt` timestamps
- All user-specific data references `userId`
- Denormalized stats include update timestamps
- Primary indexes match common query patterns

**Function Requirements:**
- All functions check `ctx.auth.getUserIdentity()`
- Private data filtered by user ownership
- ConvexError thrown with appropriate code
- No mutations without authorization check

---

## Convex Cron Jobs & Scheduling (Phase 03)

### File Organization

**Crons Structure:**
```
convex/
├── crons.ts           # Cron job definitions only
├── scheduling.ts      # All job handlers (mutations/actions)
└── lib/
    └── retrier.ts     # Action-retrier integration
```

### Cron Job Definition Pattern

**`crons.ts` - Register jobs:**
```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Descriptive name: job-purpose
crons.interval("sync-markets", { minutes: 5 }, internal.scheduling.triggerMarketSync);
crons.interval("sync-whale-trades", { minutes: 1 }, internal.scheduling.triggerWhaleSync);
crons.hourly("compute-whale-stats", { minuteUTC: 0 }, internal.scheduling.computeWhaleStats);
crons.daily("cleanup-old-activity", { hourUTC: 3, minuteUTC: 0 }, internal.scheduling.cleanupOldActivity);

export default crons;
```

**Naming Convention:**
- Job names: kebab-case (e.g., `sync-markets`, `cleanup-old-activity`)
- Always descriptive purpose
- Keep under 30 characters

### Scheduling Handler Pattern

**`scheduling.ts` - Implement handlers:**
```typescript
// 1. Mutation: Entry point (logs sync start)
export const triggerMarketSync = internalMutation({
  args: {},
  handler: async (ctx) => {
    const syncId = await ctx.db.insert("syncLogs", {
      type: "markets",
      status: "running",
      startedAt: Date.now(),
    });
    // Schedule action with retries
    await retrier.run(ctx, internal.scheduling.fetchMarketData, { syncId });
    return { syncId };
  }
});

// 2. Action: External API calls (with retries)
export const fetchMarketData = internalAction({
  args: { syncId: v.id("syncLogs") },
  handler: async (ctx, args) => {
    const apiKey = validateApiKey();
    const response = await fetch("https://api.example.com/markets", {
      headers: { "X-API-KEY": apiKey }
    });
    // Process and return to mutation
    await ctx.runMutation(internal.scheduling.processResults, { /* args */ });
  }
});

// 3. Mutation: Process results (update DB)
export const processResults = internalMutation({
  args: { /* results */ },
  handler: async (ctx, args) => {
    // Upsert/update database records
    // Log final status in syncLogs
    await ctx.db.patch(args.syncId, {
      status: "completed",
      endedAt: Date.now(),
      itemCount: args.count
    });
  }
});
```

### API Response Validation

**Type Guard Pattern:**
```typescript
// Define validation shape
interface ApiMarket {
  marketId: string | number;
  title?: string;
  volume?: number;
}

// Type guard function
function isValidMarket(obj: unknown): obj is ApiMarket {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "marketId" in obj &&
    (typeof (obj as { marketId: unknown }).marketId === "string" ||
     typeof (obj as { marketId: unknown }).marketId === "number")
  );
}

// Usage
const validMarkets = data.filter(isValidMarket);
const invalidCount = data.length - validMarkets.length;
console.warn(`Skipped ${invalidCount} invalid records`);
```

### Error Handling in Cron Jobs

**Retry Pattern (via action-retrier):**
```typescript
import { retrier } from "./lib/retrier";

// Automatic exponential backoff
await retrier.run(ctx, internal.scheduling.fetchData, { syncId });
// Retries: 3 attempts with delays 1s → 2s → 4s
```

**Sync Log Error Tracking:**
```typescript
// Track failures for monitoring
await ctx.db.patch(syncId, {
  status: "failed",
  endedAt: Date.now(),
  error: `Processed: 5, Errors: 2, Skipped: 1`,
});
```

### Rate Limiting in Cron Jobs

**Batch Processing with Delay:**
```typescript
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1000;

for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);

  if (i > 0) {
    await delay(BATCH_DELAY_MS);  // Delay between batches
  }

  // Process batch...
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### SyncLogs Table Schema

**Tracks all cron executions:**
```typescript
syncLogs: defineTable({
  type: v.union(
    v.literal("markets"),
    v.literal("whales"),
    v.literal("stats"),
    v.literal("alert-prices"),
    v.literal("leaderboard-whales")
  ),
  status: v.union(
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed")
  ),
  startedAt: v.number(),           // Unix timestamp
  endedAt: v.optional(v.number()),
  itemCount: v.optional(v.number()),
  error: v.optional(v.string()),
})
  .index("by_type", ["type"])
  .index("by_startedAt", ["startedAt"])
```

---

## Polar Webhook Handler Patterns (Phase 09)

### HTTP Endpoint Setup

**`http.ts` - Register webhook routes:**
```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/webhooks/polar",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    // Verify signature → parse → validate → process
    // Return JSON response with status code
  }),
});

export default http;
```

### Webhook Signature Verification

**Pattern: HMAC-SHA256 constant-time comparison:**
```typescript
async function verifyPolarSignature(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false;

  // Polar uses "sha256=<hex_digest>" format
  const parts = signature.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") return false;

  const providedDigest = parts[1];

  // Use Web Crypto API for HMAC
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(body)
  );

  const computedDigest = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison prevents timing attacks
  if (providedDigest.length !== computedDigest.length) return false;

  let result = 0;
  for (let i = 0; i < providedDigest.length; i++) {
    result |= providedDigest.charCodeAt(i) ^ computedDigest.charCodeAt(i);
  }

  return result === 0;
}
```

### Subscription Email Template Pattern

**Template structure in `lib/subscriptionEmails.ts`:**
```typescript
type SubscriptionTier = "pro" | "pro_plus";
type EmailType = "welcome" | "canceled" | "expired";

export function buildSubscriptionEmailContent(
  tier: SubscriptionTier,
  type: EmailType
): { subject: string; html: string } {
  // Route to specific builder function
  if (type === "welcome") return buildWelcomeEmail(tierName, tier);
  if (type === "canceled") return buildCanceledEmail(tierName);
  return buildExpiredEmail(tierName);
}

// Each builder returns { subject, html } object
function buildWelcomeEmail(tierName: string, tier: SubscriptionTier) {
  return {
    subject: `Welcome to OpinionScope ${tierName}!`,
    html: /* email HTML template */
  };
}
```

### Product ID Configuration Pattern

**Map product IDs to tiers (environment-driven):**
```typescript
function getSubscriptionTier(productId: string): "pro" | "pro_plus" | null {
  const proMonthly = process.env.POLAR_PRO_MONTHLY_ID;
  const proAnnual = process.env.POLAR_PRO_ANNUAL_ID;
  const proPlusMonthly = process.env.POLAR_PRO_PLUS_MONTHLY_ID;
  const proPlusAnnual = process.env.POLAR_PRO_PLUS_ANNUAL_ID;

  if (productId === proMonthly || productId === proAnnual) {
    return "pro";
  }
  if (productId === proPlusMonthly || productId === proPlusAnnual) {
    return "pro_plus";
  }
  return null;
}
```

**Why:** Prevents hardcoding tier mappings, allows flexible pricing changes.

### Subscription Cancellation Flow

**Pattern: Set expiration, don't guess tier:**
```typescript
async function handleSubscriptionCanceled(ctx, data): Promise<void> {
  const { customer_email, current_period_end } = data;

  // Calculate expiration from webhook (handles renewal timing)
  const tierExpiresAt = current_period_end
    ? new Date(current_period_end).getTime()
    : Date.now() + 24 * 60 * 60 * 1000;

  // Mark subscription canceled (sets expiration, keeps current tier)
  const result = await ctx.runMutation(
    internal.subscriptions.markSubscriptionCanceled,
    { email: customer_email, tierExpiresAt }
  );

  // Send email only if result found and was paid tier
  if (result.success && result.tier && result.tier !== "free") {
    await ctx.runAction(internal.subscriptions.sendSubscriptionEmail, {
      to: customer_email,
      tier: result.tier,
      type: "canceled",
    });
  }
}
```

**Key Pattern:** Webhook sets expiration timestamp, separate cron job (future) handles actual downgrade to prevent race conditions.

---

**Last Updated:** January 19, 2026 (Phase 10)
**Version:** 1.3 (Landing Page Components)
