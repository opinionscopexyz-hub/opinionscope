# Scout Report: Leaderboard Tier Limits

**Date:** 2026-01-20 22:51
**Task:** Find where tier limits are applied to leaderboard data

## Key Files

| File | Purpose |
|------|---------|
| `packages/backend/convex/lib/tierLimits.ts` | Tier limit constants |
| `packages/backend/convex/whales.ts` | Leaderboard query with tier enforcement |
| `apps/web/src/components/whales/leaderboard.tsx` | Frontend display with tier-based UI |

## Current Tier Limits for Leaderboard

```typescript
// tierLimits.ts
free: { leaderboardLimit: 10 }
pro: { leaderboardLimit: 50 }
pro_plus: { leaderboardLimit: Infinity }
```

## Where Limits Applied

### 1. Backend Query (PRIMARY)
**File:** `packages/backend/convex/whales.ts` → `getLeaderboard` (lines 9-109)

```typescript
// Get tier-based limit
const limits = getTierLimits(effectiveTier);
maxLimit = limits.leaderboardLimit === Infinity ? 1000 : limits.leaderboardLimit;

// Apply limit to query
const effectiveLimit = Math.min(limit, maxLimit);
```

Returns: `{ whales, isLimited: boolean, limit: number }`

### 2. Frontend Display (SECONDARY)
**File:** `apps/web/src/components/whales/leaderboard.tsx` (lines 87-161)

```typescript
const tierLimit = tier === "free" ? 10 : tier === "pro" ? 50 : Infinity;
const showUpgrade = tier !== "pro_plus" && whales.length >= tierLimit;

// Shows upgrade prompt when limit reached
{showUpgrade && (
  <Card>
    <Lock />
    <p>Free tier shows top 10. Upgrade to see more.</p>
    <a href="/pricing">Upgrade Now</a>
  </Card>
)}
```

## Data Sync (NOT LIMITED)
**File:** `packages/backend/convex/scheduling/leaderboardSync.ts`
- Syncs 100 entries per request from external API
- NO tier filtering at sync time - all data stored

## Fix Required

To show full leaderboard for free users:

1. **Backend:** Remove tier limit in `getLeaderboard` query OR set `leaderboardLimit: Infinity` for free tier
2. **Frontend:** Remove/adjust upgrade prompt logic

## Recommendation

Change in `tierLimits.ts`:
```typescript
free: { leaderboardLimit: Infinity }  // was: 10
```

This single change affects both backend query and frontend display since both read from same tier config.

## Unresolved Questions

1. Should anonymous (unauthenticated) users also see full leaderboard?
2. Keep upgrade prompt for other features or remove entirely from leaderboard component?
