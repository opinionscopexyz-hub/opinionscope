# Convex Best Practices Research Report
**OpinionScope Platform**
**Date:** 2026-01-16
**Scope:** Real-time subscriptions, query optimization, auth integration, schema design, pagination

---

## Executive Summary

OpinionScope requires Convex patterns for three core use cases: (1) real-time activity feed with low-latency delivery, (2) complex market screener queries with subscription-tier restrictions, (3) Clerk auth + tier-based access control. This report synthesizes patterns from Convex documentation and industry best practices.

**Critical Finding:** Index design is foundational—compound indexes matching query constraints minimize result sets and enable efficient subscriptions. Tier-based delivery (Pro+: instant, Pro: 30s, Free: 15min) requires separate query paths, not filtering.

---

## 1. Real-Time Subscriptions for Activity Feeds

### Pattern: Incremental Subscription Tracking

Convex tracks query dependencies automatically. WebSocket connections push updates when underlying data changes. For OpinionScope's tiered feed:

**Implementation Strategy:**
- Create separate query functions per subscription tier
- `getWhaleActivityFeed()` for Pro+ (real-time)
- `getWhaleActivityFeedDelayed(delayMinutes: 15)` for Free tier
- Use indexes on `(timestamp, tier)` to filter efficiently

**Key Insight:** Don't filter delays in code—create tier-specific queries. Convex re-runs the entire subscription when any indexed document changes, so fewer documents in the query result = faster updates.

### Indexes for Activity Feeds
```
whaleActivity table:
- by_timestamp: [timestamp] DESC (primary subscription)
- by_whale_timestamp: [whaleId, timestamp] DESC (filter by followed whales)
- by_tier_timestamp: [whaleId, userTier, timestamp] DESC (tier-aware)
```

### WebSocket Connection Considerations
- Convex maintains persistent WebSocket per client
- Sync worker re-runs queries on data changes
- Subscription automatically unsubscribed when React component unmounts
- Max ~50,000 concurrent connections on standard deployment

---

## 2. Complex Query Optimization for Market Screener

### Pattern: Multi-Stage Filtering

The market screener requires filters on: category, price range, volume, liquidity, days-to-resolution. Index strategy:

**Primary Index Strategy:**
```
markets table:
- by_category_volume: [category, volume] DESC
- by_category_price: [category, yesPrice] ASC
- by_volume_endDate: [volume, endDate] DESC
- by_price_volume: [yesPrice, volume] DESC
```

**Query Execution (Optimized):**
1. Use `.withIndex()` to narrow by primary index (e.g., category)
2. Chain `.where()` for secondary filters (price, liquidity)
3. Avoid `.filter()` in code—use `withIndex` conditions
4. Apply pagination with `.paginate()` **after** all filters

**Key Insight:** Don't use `.filter()` after `.collect()`. Filtering in code defeats index optimization. Compound indexes ordered by query frequency achieve 10-100x faster results.

### Advanced: Custom Expression Parser

For user-defined filters like "YES < 20% AND volume > $1M":
- Parse expression to index constraints at query time
- Convert to: `category === 'crypto' && market.yesPrice < 0.2 && market.volume > 1000000`
- Use `.where()` to apply parsed conditions
- Fall back to TypeScript code for complex expressions (OR gates, parentheses)

**Performance Tip:** Tier-gate custom expressions (Pro+ only) to avoid query complexity on free users.

---

## 3. Clerk Integration + Subscription Tier Access Control

### Pattern: Auth + Tier-Based Authorization

**Setup:**
1. JWT template in Clerk dashboard includes tier claim
2. Convex verifies JWT signature via Clerk public key
3. Access user tier in functions: `const userId = ctx.auth.getUserIdentity()`
4. Query user tier from users table: `db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", userId.tokenIdentifier)).unique()`

**Authorization Pattern:**
```typescript
// Query: List user's 50 followed whales (Pro max), 20 (Free max)
const followLimit = userTier === 'pro_plus' ? 10000 : (userTier === 'pro' ? 20 : 3);
const whaleIds = user.followedWhales.slice(0, followLimit);
```

**Key Insight:** Cache user tier in Convex users table (synced via Clerk webhooks). Querying every function call is wasteful.

### Security Pattern: Enforce Authorization Early
```typescript
export const query = internalQuery({
  args: { ...args },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Check tier for feature access
    const user = await db.query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", identity.tokenIdentifier))
      .unique();

    if (user.tier === 'free' && args.requiresPro) {
      throw new Error("Feature requires Pro tier");
    }

    // Execute query
  }
});
```

---

## 4. Schema Design Recommendations

### Denormalization for Subscriptions

**Whale Profile Denormalization:**
Store denormalized stats on whales table to avoid joins in subscriptions:
- `winRate`, `totalVolume`, `totalPnl` (denormalized from trades)
- Update via batch mutations every 1 hour
- Subscribe to whale stats without querying 1000s of trades

**User Tier Caching:**
Sync Clerk subscription tier to users table via webhooks:
- Polar webhook → Inngest → Update `users.tier` + `tierExpiresAt`
- Query checks `tierExpiresAt` to detect expired trials

### Index Redundancy Avoidance
- **DON'T:** Create `by_foo`, `by_foo_and_bar`, `by_foo_bar_and_baz` (3 indexes)
- **DO:** Create only `by_foo_and_bar_and_baz` (compound indexes handle all use cases)
- Exception: Single-field indexes for common queries (e.g., `by_userId` for user-scoped queries)

---

## 5. Pagination + Performance

### Pattern: Cursor-Based Pagination with Filters

**Standard Approach:**
```typescript
const { page, isDone, cursor } = await db.query("markets")
  .withIndex("by_category_volume", q => q.eq("category", "crypto").gte("volume", 100000))
  .order("desc")
  .paginate({ numItems: 50, cursor: userCursor });
```

**Complex Pagination (Multiple Cursors):**
For "paginated markets per followed whale":
- Use `getPage()` helper from convex-helpers
- Track separate cursor per whale
- Supports bidirectional scrolling

**Performance Consideration:**
- Page size: 50-100 items (balance UX responsiveness vs. bandwidth)
- Unsubscribe from off-screen pages to free browser memory
- Avoid loading all results into memory

---

## 6. Real-Time + Tier-Based Delivery Architecture

### Signal Delivery Timeline

```
T+0s   Whale trade detected (Inngest webhook from blockchain)
T+0s   → Pro+ users: WebSocket subscription delivers instantly
T+30s  → Pro users: Trigger second tier notification
T+15m  → Free users: Appear in paginated feed (no real-time push)
```

### Implementation:
- **Pro+:** Subscribe to `getWhaleActivityRealTime()` (updates every 100ms)
- **Pro:** Subscribe to `getWhaleActivityDelayed(30)` (filtered at 30s mark)
- **Free:** Query `getWhaleActivityDelayed(900)` on demand (no WebSocket)

**Cost Optimization:** Separate subscriptions reduce database load—Free users don't trigger query re-runs.

---

## 7. Index Strategy Summary

### OpinionScope Critical Indexes

| Table | Index | Purpose | Priority |
|-------|-------|---------|----------|
| markets | `by_category_volume` | Screener primary filter | P0 |
| markets | `by_price_volume` | Price-based screening | P0 |
| markets | `by_endDate_volume` | Time-to-resolution filter | P1 |
| whales | `by_winRate` | Leaderboard sorting | P0 |
| whales | `by_lastActiveAt` | Recent whale activity | P1 |
| whaleActivity | `by_timestamp_desc` | Feed subscription | P0 |
| whaleActivity | `by_whaleId_timestamp` | Whale-specific feeds | P1 |
| users | `by_clerkId` | Auth lookup | P0 |
| users | `by_tier` | Tier-based queries | P1 |
| alerts | `by_userId` | User alert retrieval | P1 |

**Limit:** Max 32 indexes per table. Prioritize indexes matching your query frequency distribution.

---

## 8. Performance Targets vs. Convex Capabilities

| Requirement | Target | Convex Capability | Notes |
|-------------|--------|-------------------|-------|
| Real-time feed latency | < 500ms | ✅ Achievable | Depends on index efficiency |
| Search/filter response | < 1s | ✅ Achievable | With proper indexes |
| API response (p95) | < 200ms | ✅ Achievable | Avoid full table scans |
| 10,000 concurrent users | Yes | ✅ Supported | ~50k WebSocket connections |
| Data accuracy (99.99%) | Yes | ✅ Achievable | Use transactions for critical updates |

---

## 9. Common Pitfalls & Mitigations

| Pitfall | Impact | Mitigation |
|---------|--------|-----------|
| Using `.filter()` instead of `.withIndex()` | 10-100x slower | Always filter in index first |
| Over-indexing (>20 indexes) | Write performance degradation | Consolidate to compound indexes |
| Subscribing entire tables | High memory, latency | Use `.withIndex()` to narrow scope |
| Forgetting tier checks in queries | Security hole | Always verify `user.tier` early |
| Caching tier in browser/local state | Stale auth decisions | Sync via Clerk webhooks + refetch on mutation |
| Pagination without filters | Out of memory errors | Always filter before paginating |

---

## 10. Unresolved Questions

1. **Whale detection latency:** Is Inngest webhook from blockchain fast enough for Pro+ "instant" delivery? Need latency SLA test.
2. **Polymarket API rate limits:** What's the throughput limit? Does bulk import need batching?
3. **Screener expression parser:** Should support ORs and parentheses? Complexity vs. UX tradeoff unclear.
4. **Historical data retention:** 2-year retention on whaleActivity table—scalability impact at 100M+ trades?
5. **Search full-text:** Should market titles support full-text search? Requires separate search index.

---

## Sources

- [Convex Indexes & Query Performance](https://docs.convex.dev/database/reading-data/indexes/indexes-and-query-perf)
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/)
- [Convex Query Scaling Patterns](https://stack.convex.dev/queries-that-scale)
- [Pagination Patterns](https://stack.convex.dev/pagination)
- [Clerk Integration](https://docs.convex.dev/auth/clerk)
- [Real-Time Database Guide](https://stack.convex.dev/real-time-database)
