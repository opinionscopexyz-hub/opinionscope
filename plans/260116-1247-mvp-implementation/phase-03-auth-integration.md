# Phase 03: Auth Integration

## Context Links
- [Plan Overview](./plan.md)
- [Convex Patterns Research](../reports/researcher-260116-1247-convex-patterns.md)
- [Phase 02: Database Schema](./phase-02-database-schema.md)

## Overview
- **Priority:** P0
- **Status:** ✓ Complete
- **Effort:** 4h
- **Description:** Configure Clerk authentication with Convex, implement user sync, and set up tier-based authorization.

## Key Insights

From Convex research:
- Cache user tier in Convex users table (synced via Clerk webhooks)
- Enforce authorization early in query handlers
- JWT template in Clerk dashboard must include custom claims

Existing scaffold:
- Clerk already integrated with ConvexProviderWithClerk
- Auth config exists at `packages/backend/convex/auth.config.ts`
- Middleware exists at `apps/web/src/middleware.ts`

## Requirements

### Functional
- FR-AUTH-1: Create Convex user on first sign-in
- FR-AUTH-2: Sync Clerk user data changes via webhooks
- FR-AUTH-3: Expose current user with tier to frontend
- FR-AUTH-4: Protect authenticated routes

### Non-Functional
- NFR-AUTH-1: Auth check < 50ms
- NFR-AUTH-2: Graceful handling of missing users

## Architecture

```
User Sign-in Flow:
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Clerk   │───►│ JWT     │───►│ Convex  │───►│ User    │
│ Sign-in │    │ Token   │    │ Auth    │    │ Created │
└─────────┘    └─────────┘    └─────────┘    └─────────┘

Webhook Flow (user updates):
┌─────────┐    ┌─────────┐    ┌─────────┐
│ Clerk   │───►│ Webhook │───►│ Convex  │
│ Event   │    │ Handler │    │ Upsert  │
└─────────┘    └─────────┘    └─────────┘
```

## Related Code Files

### Modify
- `apps/web/src/middleware.ts` - Update protected routes
- `apps/web/src/components/header.tsx` - Add user menu

### Create
- `apps/web/src/app/api/webhooks/clerk/route.ts` - Clerk webhook handler
- `packages/backend/convex/users.ts` - Add sync mutations (extend from Phase 02)
- `packages/backend/convex/lib/auth.ts` - Auth helper utilities
- `apps/web/src/hooks/use-current-user.ts` - Client hook for user data
- `apps/web/src/components/user-button.tsx` - User dropdown

## Implementation Steps

### Step 1: Configure Clerk JWT Template

In Clerk Dashboard > JWT Templates:
1. Create template named "convex"
2. Add claims:
```json
{
  "email": "{{user.primary_email_address}}",
  "name": "{{user.full_name}}",
  "avatar": "{{user.image_url}}"
}
```

### Step 2: Create Auth Helper

Create `packages/backend/convex/lib/auth.ts`:

```typescript
import { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

export type AuthenticatedUser = Doc<"users">;

export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<AuthenticatedUser | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
    .unique();

  return user;
}

export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(ctx);
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export async function requireTier(
  ctx: QueryCtx | MutationCtx,
  minTier: "free" | "pro" | "pro_plus"
): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx);

  const tierOrder = { free: 0, pro: 1, pro_plus: 2 };
  if (tierOrder[user.tier] < tierOrder[minTier]) {
    throw new Error(`This feature requires ${minTier} tier or higher`);
  }

  return user;
}

export function isTierExpired(user: AuthenticatedUser): boolean {
  if (!user.tierExpiresAt) return false;
  return Date.now() > user.tierExpiresAt;
}

export function getEffectiveTier(user: AuthenticatedUser): "free" | "pro" | "pro_plus" {
  if (user.tier !== "free" && isTierExpired(user)) {
    return "free";
  }
  return user.tier;
}
```

### Step 3: Add User Sync Mutations

Extend `packages/backend/convex/users.ts`:

```typescript
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthenticatedUser } from "./lib/auth";

// ... existing code from Phase 02 ...

// Called from Clerk webhook
export const syncFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    deleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (args.deleted) {
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      return;
    }

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      tier: "free",
      notificationPreferences: {
        email: true,
        push: false,
        telegram: false,
        discord: false,
      },
      followedWhaleIds: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get current user for client
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await getAuthenticatedUser(ctx);
  },
});

// Update notification preferences
export const updateNotificationPreferences = mutation({
  args: {
    email: v.optional(v.boolean()),
    push: v.optional(v.boolean()),
    telegram: v.optional(v.boolean()),
    discord: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const currentPrefs = user.notificationPreferences;
    await ctx.db.patch(user._id, {
      notificationPreferences: {
        email: args.email ?? currentPrefs.email,
        push: args.push ?? currentPrefs.push,
        telegram: args.telegram ?? currentPrefs.telegram,
        discord: args.discord ?? currentPrefs.discord,
      },
      updatedAt: Date.now(),
    });
  },
});
```

### Step 4: Create Clerk Webhook Handler

Create `apps/web/src/app/api/webhooks/clerk/route.ts`:

```typescript
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@opinion-scope/backend/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const email = email_addresses?.[0]?.email_address;
    if (!email) {
      return new Response("No email found", { status: 400 });
    }

    const name = [first_name, last_name].filter(Boolean).join(" ") || undefined;

    await convex.mutation(api.users.syncFromClerk, {
      clerkId: id,
      email,
      name,
      avatarUrl: image_url,
    });
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    if (id) {
      await convex.mutation(api.users.syncFromClerk, {
        clerkId: id,
        email: "",
        deleted: true,
      });
    }
  }

  return new Response("OK", { status: 200 });
}
```

### Step 5: Create Current User Hook

Create `apps/web/src/hooks/use-current-user.ts`:

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@opinion-scope/backend/convex/_generated/api";

export function useCurrentUser() {
  const user = useQuery(api.users.getCurrentUser);

  return {
    user,
    isLoading: user === undefined,
    isAuthenticated: user !== null && user !== undefined,
    tier: user?.tier ?? "free",
    isPro: user?.tier === "pro" || user?.tier === "pro_plus",
    isProPlus: user?.tier === "pro_plus",
  };
}
```

### Step 6: Create User Button Component

Create `apps/web/src/components/user-button.tsx`:

```typescript
"use client";

import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LogOut, Settings, CreditCard, User } from "lucide-react";
import Link from "next/link";

export function UserButton() {
  const { isSignedIn, user } = useUser();
  const { tier, isPro } = useCurrentUser();

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button variant="outline" size="sm">
          Sign In
        </Button>
      </SignInButton>
    );
  }

  const tierBadge = {
    free: null,
    pro: "Pro",
    pro_plus: "Pro+",
  }[tier];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.fullName ?? "User"}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <User className="h-4 w-4" />
          )}
          {tierBadge && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {tierBadge}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.fullName ?? "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/billing">
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <SignOutButton>
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </SignOutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Step 7: Update Header

Update `apps/web/src/components/header.tsx`:

```typescript
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { UserButton } from "./user-button";

export default function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-bold text-lg">
          OpinionScope
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/screener" className="text-sm text-muted-foreground hover:text-foreground">
            Screener
          </Link>
          <Link href="/whales" className="text-sm text-muted-foreground hover:text-foreground">
            Whales
          </Link>
          <Link href="/feed" className="text-sm text-muted-foreground hover:text-foreground">
            Feed
          </Link>
          <ModeToggle />
          <UserButton />
        </nav>
      </div>
    </header>
  );
}
```

### Step 8: Update Middleware

Update `apps/web/src/middleware.ts`:

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
  "/pricing",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### Step 9: Add Environment Variable

Add to `.env`:
```env
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

Configure webhook in Clerk Dashboard:
- URL: `https://your-domain.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`

## Todo List

- [x] Configure Clerk JWT template with "convex" claims
- [x] Create `packages/backend/convex/lib/auth.ts`
- [x] Extend `packages/backend/convex/users.ts` with sync mutations
- [x] Create `apps/web/src/app/api/webhooks/clerk/route.ts`
- [x] Create `apps/web/src/hooks/use-current-user.ts`
- [x] Create `apps/web/src/components/user-button.tsx`
- [x] Update `apps/web/src/components/header.tsx`
- [x] Update `apps/web/src/middleware.ts`
- [x] Add CLERK_WEBHOOK_SECRET to env
- [ ] Configure webhook in Clerk Dashboard (deployment step)
- [x] Test sign-up creates Convex user
- [x] Test webhook updates user data

## Success Criteria

- [x] New sign-ups create user in Convex
- [x] User data syncs via webhook
- [x] getCurrentUser returns user with tier
- [x] Protected routes redirect to sign-in
- [x] User menu shows tier badge
- [x] TypeScript compiles without errors

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Webhook secret mismatch | High | Low | Use Clerk dashboard to generate |
| Race condition on first login | Medium | Low | Check existing before insert |
| Token expiry not handled | Medium | Low | Convex SDK handles refresh |

## Security Considerations

- Validate webhook signatures with svix
- Never expose Clerk secret key to client
- Use internalMutation for webhook handlers
- Check tierExpiresAt for expired subscriptions

## Next Steps

After completing this phase:
1. Proceed to [Phase 04: Data Sync](./phase-04-data-sync.md)
2. User system ready for tier-gated features
