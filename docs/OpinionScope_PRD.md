# OpinionScope
## Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** January 2025  
**Author:** Product Team  
**Status:** Draft

---

# Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [User Requirements Document](#3-user-requirements-document)
4. [Product Requirements](#4-product-requirements)
5. [Feature Specifications](#5-feature-specifications)
6. [Technical Architecture](#6-technical-architecture)
7. [Subscription Model](#7-subscription-model)
8. [Success Metrics](#8-success-metrics)
9. [Roadmap](#9-roadmap)
10. [Risks & Mitigations](#10-risks--mitigations)
11. [Appendix](#11-appendix)

---

# 1. Executive Summary

## 1.1 Product Vision

**OpinionScope** is a market intelligence platform for prediction market traders, combining a powerful market screener with real-time whale tracking capabilities. Our mission is to democratize access to trading signals and market intelligence that was previously only available to sophisticated traders.

## 1.2 Value Proposition

> "Bloomberg Terminal for Prediction Markets" - Professional-grade tools at accessible prices.

| For | Who | OpinionScope Provides |
|-----|-----|----------------------|
| Casual Traders | Want to find opportunities quickly | Easy-to-use screener with preset filters |
| Serious Traders | Need edge over the market | Real-time whale tracking & copy-trade signals |
| Quantitative Traders | Require data for analysis | API access & historical data exports |

## 1.3 Key Differentiators

1. **Real-time Whale Tracking** - See what top traders are buying/selling as it happens
2. **Smart Screener** - Custom filter expressions like stock screeners
3. **Tiered Signal Delivery** - Premium users get signals before free users
4. **Cross-platform Alerts** - Telegram, Discord, Email, Push notifications

---

# 2. Problem Statement

## 2.1 Market Context

Prediction markets (Polymarket, Kalshi, Manifold) have grown significantly, with billions in trading volume. However, retail traders lack:

- **Discovery tools** - Hard to find opportunities among thousands of markets
- **Whale intelligence** - No visibility into what successful traders are doing
- **Alert systems** - Manual monitoring is time-consuming
- **Data export** - Limited ability to analyze markets programmatically

## 2.2 User Pain Points

### Pain Point 1: Information Asymmetry
> "By the time I see a whale's trade on Twitter, the price has already moved 10%"

Sophisticated traders have better tools and faster access to information. Retail traders are always behind.

### Pain Point 2: Discovery Overload
> "There are 500+ markets on Polymarket. How do I find the ones worth trading?"

No efficient way to filter and screen markets by multiple criteria simultaneously.

### Pain Point 3: Manual Monitoring
> "I spend 2 hours daily just checking prices and whale wallets"

Traders waste time on repetitive monitoring tasks that could be automated.

### Pain Point 4: Lack of Track Record
> "I don't know which 'alpha' accounts on Twitter actually have good track records"

No verified performance data for traders sharing calls on social media.

## 2.3 Opportunity Size

| Metric | Estimate |
|--------|----------|
| Polymarket Monthly Volume | $500M+ |
| Active Traders (estimated) | 50,000+ |
| Addressable Market (TAM) | $50M ARR |
| Serviceable Market (SAM) | $10M ARR |
| Initial Target (SOM) | $1M ARR |

---

# 3. User Requirements Document

## 3.1 User Personas

### Persona 1: "Alex the Active Trader"

| Attribute | Description |
|-----------|-------------|
| **Demographics** | 28 years old, Software Engineer, $120k salary |
| **Trading Experience** | 2 years in prediction markets |
| **Weekly Time Spent** | 10-15 hours trading/researching |
| **Current Tools** | Polymarket UI, Twitter, Spreadsheets |
| **Monthly Trading Volume** | $5,000 - $20,000 |
| **Pain Points** | Misses opportunities, spends too much time monitoring |
| **Goals** | Increase win rate, reduce time spent on research |
| **Willingness to Pay** | $20-50/month for significant edge |

**User Story:**
> "As an active trader, I want to receive instant alerts when top traders make large bets, so that I can evaluate and potentially follow their trades before prices move significantly."

### Persona 2: "Sarah the Strategic Investor"

| Attribute | Description |
|-----------|-------------|
| **Demographics** | 35 years old, Financial Analyst, $150k salary |
| **Trading Experience** | 5 years in various markets, 1 year in predictions |
| **Weekly Time Spent** | 3-5 hours (limited time) |
| **Current Tools** | Bloomberg (work), Basic Polymarket UI |
| **Monthly Trading Volume** | $10,000 - $50,000 |
| **Pain Points** | Limited time, needs efficient filtering |
| **Goals** | Find high-conviction plays quickly |
| **Willingness to Pay** | $50-100/month for time savings |

**User Story:**
> "As a busy professional, I want to quickly filter markets by my criteria (high volume, expiring soon, undervalued), so that I can make decisions in minutes rather than hours."

### Persona 3: "Mike the Market Maker"

| Attribute | Description |
|-----------|-------------|
| **Demographics** | 32 years old, Quant Trader at small fund |
| **Trading Experience** | 8 years professional trading |
| **Weekly Time Spent** | 40+ hours (full-time) |
| **Current Tools** | Custom scripts, APIs, databases |
| **Monthly Trading Volume** | $100,000+ |
| **Pain Points** | Needs programmatic access, historical data |
| **Goals** | Build systematic strategies, backtesting |
| **Willingness to Pay** | $200-500/month for API + data |

**User Story:**
> "As a quantitative trader, I want API access to historical whale performance data, so that I can build models to identify which whales to follow algorithmically."

### Persona 4: "Jenny the Newcomer"

| Attribute | Description |
|-----------|-------------|
| **Demographics** | 24 years old, Marketing Coordinator |
| **Trading Experience** | New to prediction markets |
| **Weekly Time Spent** | 2-3 hours exploring |
| **Current Tools** | Just the Polymarket app |
| **Monthly Trading Volume** | $100 - $500 |
| **Pain Points** | Doesn't know where to start, afraid of losing |
| **Goals** | Learn from successful traders, small wins |
| **Willingness to Pay** | $0-10/month (price sensitive) |

**User Story:**
> "As a beginner, I want to see what experienced traders are buying with their track records, so that I can learn and make more informed decisions."

---

## 3.2 Functional Requirements

### FR-1: Market Screener

| ID | Requirement | Priority | Persona |
|----|-------------|----------|---------|
| FR-1.1 | System shall allow users to search markets by keyword | Must Have | All |
| FR-1.2 | System shall filter markets by category (Crypto, Politics, Sports, etc.) | Must Have | All |
| FR-1.3 | System shall filter markets by price range (YES price min/max) | Must Have | Alex, Sarah |
| FR-1.4 | System shall filter markets by volume (min/max) | Must Have | Alex, Sarah |
| FR-1.5 | System shall filter markets by time to resolution | Must Have | Sarah |
| FR-1.6 | System shall filter markets by liquidity depth | Should Have | Mike |
| FR-1.7 | System shall support custom filter expressions (e.g., "YES < 20% AND volume > $1M") | Should Have | Alex, Mike |
| FR-1.8 | System shall allow users to save filter presets | Should Have | Alex, Sarah |
| FR-1.9 | System shall display 24h price change for each market | Must Have | All |
| FR-1.10 | System shall sort results by multiple criteria | Must Have | All |

### FR-2: Whale Tracker

| ID | Requirement | Priority | Persona |
|----|-------------|----------|---------|
| FR-2.1 | System shall display leaderboard of top traders by win rate | Must Have | All |
| FR-2.2 | System shall show whale's total volume traded | Must Have | All |
| FR-2.3 | System shall show whale's P&L (profit/loss) | Must Have | Alex, Sarah |
| FR-2.4 | System shall show whale's recent trade history | Must Have | Alex, Sarah |
| FR-2.5 | System shall show whale's win/loss streak | Should Have | All |
| FR-2.6 | System shall allow users to follow specific whales | Must Have | All |
| FR-2.7 | System shall show whale's performance over different time periods | Should Have | Mike |
| FR-2.8 | System shall verify whale addresses on-chain | Must Have | All |

### FR-3: Live Activity Feed

| ID | Requirement | Priority | Persona |
|----|-------------|----------|---------|
| FR-3.1 | System shall display real-time feed of whale trades | Must Have | Alex |
| FR-3.2 | System shall show trade details (market, amount, price, direction) | Must Have | All |
| FR-3.3 | System shall update feed without page refresh | Must Have | Alex |
| FR-3.4 | System shall filter feed by followed whales only | Should Have | Alex |
| FR-3.5 | System shall filter feed by minimum trade size | Should Have | Sarah |
| FR-3.6 | System shall show time elapsed since trade | Must Have | All |

### FR-4: Alert System

| ID | Requirement | Priority | Persona |
|----|-------------|----------|---------|
| FR-4.1 | System shall allow users to set price alerts on markets | Must Have | All |
| FR-4.2 | System shall allow users to set whale activity alerts | Must Have | Alex |
| FR-4.3 | System shall send alerts via email | Must Have | All |
| FR-4.4 | System shall send alerts via Telegram | Should Have | Alex |
| FR-4.5 | System shall send alerts via Discord webhook | Should Have | Alex |
| FR-4.6 | System shall send push notifications (web/mobile) | Should Have | All |
| FR-4.7 | System shall allow alert on new markets matching saved screener | Could Have | Sarah |
| FR-4.8 | Free users shall be limited to 3 alerts | Must Have | - |

### FR-5: Data Export

| ID | Requirement | Priority | Persona |
|----|-------------|----------|---------|
| FR-5.1 | System shall export filtered market list to CSV | Must Have | Sarah, Mike |
| FR-5.2 | System shall export whale trade history to CSV | Should Have | Mike |
| FR-5.3 | System shall provide REST API for programmatic access | Should Have | Mike |
| FR-5.4 | System shall provide WebSocket feed for real-time data | Could Have | Mike |
| FR-5.5 | Free users shall have limited export (blurred/limited rows) | Must Have | - |

### FR-6: User Account

| ID | Requirement | Priority | Persona |
|----|-------------|----------|---------|
| FR-6.1 | System shall allow registration via email | Must Have | All |
| FR-6.2 | System shall allow registration via Google OAuth | Must Have | All |
| FR-6.3 | System shall allow registration via crypto wallet (SIWE) | Could Have | Alex |
| FR-6.4 | System shall display user's subscription tier | Must Have | All |
| FR-6.5 | System shall allow users to manage notification preferences | Must Have | All |
| FR-6.6 | System shall allow users to connect Telegram for alerts | Should Have | Alex |

### FR-7: Subscription & Billing

| ID | Requirement | Priority | Persona |
|----|-------------|----------|---------|
| FR-7.1 | System shall offer Free, Pro, and Pro+ subscription tiers | Must Have | - |
| FR-7.2 | System shall process payments via credit card | Must Have | - |
| FR-7.3 | System shall offer monthly and annual billing | Must Have | - |
| FR-7.4 | System shall allow users to upgrade/downgrade tiers | Must Have | - |
| FR-7.5 | System shall handle subscription cancellation | Must Have | - |
| FR-7.6 | System shall provide invoices/receipts | Must Have | - |

---

## 3.3 Non-Functional Requirements

### NFR-1: Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1.1 | Page load time | < 2 seconds |
| NFR-1.2 | Real-time feed latency | < 500ms |
| NFR-1.3 | Search/filter response time | < 1 second |
| NFR-1.4 | API response time | < 200ms (p95) |
| NFR-1.5 | Concurrent users supported | 10,000+ |

### NFR-2: Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-2.1 | System uptime | 99.9% |
| NFR-2.2 | Data accuracy (whale trades) | 99.99% |
| NFR-2.3 | Alert delivery rate | 99.5% |
| NFR-2.4 | Data backup frequency | Every 1 hour |

### NFR-3: Security

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-3.1 | All data transmission encrypted | TLS 1.3 |
| NFR-3.2 | User passwords hashed | bcrypt/argon2 |
| NFR-3.3 | API authentication | JWT + API keys |
| NFR-3.4 | PCI compliance for payments | Via Polar/Stripe |
| NFR-3.5 | Rate limiting | 100 req/min free, 1000 req/min paid |

### NFR-4: Scalability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-4.1 | Database read scaling | Horizontal |
| NFR-4.2 | Real-time connections | 50,000+ concurrent |
| NFR-4.3 | Market data points | 100,000+ markets |
| NFR-4.4 | Historical data retention | 2+ years |

### NFR-5: Usability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-5.1 | Mobile responsive | Yes |
| NFR-5.2 | Accessibility (WCAG) | Level AA |
| NFR-5.3 | Supported browsers | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| NFR-5.4 | Time to first value (new user) | < 5 minutes |

---

# 4. Product Requirements

## 4.1 Product Scope

### In Scope (v1.0)

- Market screener with filters and search
- Whale leaderboard and profiles
- Real-time activity feed
- Basic alert system (price + whale activity)
- CSV export
- Free, Pro, Pro+ subscription tiers
- Web application (responsive)

### Out of Scope (v1.0)

- Native mobile apps (iOS/Android)
- Trading execution (we don't place trades)
- Portfolio tracking
- Backtesting engine
- Social features (comments, sharing)
- Multi-language support

### Future Considerations (v2.0+)

- Native mobile apps
- Portfolio tracking & P&L
- Backtesting with historical data
- Copy-trade automation (via connected wallet)
- AI-powered signals
- Community features

---

## 4.2 User Flows

### Flow 1: New User Onboarding

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEW USER ONBOARDING                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Landing Page                                                 │
│     │                                                            │
│     ▼                                                            │
│  2. Click "Get Started Free"                                    │
│     │                                                            │
│     ▼                                                            │
│  3. Sign Up (Email or Google)                                   │
│     │  └─► Clerk handles auth                                   │
│     ▼                                                            │
│  4. Welcome Modal                                                │
│     │  • Brief product tour (3 steps)                           │
│     │  • Choose interests (categories)                          │
│     ▼                                                            │
│  5. Main Dashboard                                               │
│     │  • Pre-filled with interesting markets                    │
│     │  • Highlighted whale activity                             │
│     ▼                                                            │
│  6. First Alert Prompt                                          │
│     │  "Set your first alert on a market you're watching"       │
│     ▼                                                            │
│  7. Engaged User                                                 │
│     │                                                            │
│     ▼                                                            │
│  8. Upgrade Prompt (after seeing value)                         │
│     "Upgrade to Pro for real-time whale alerts"                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 2: Market Discovery

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKET DISCOVERY FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User lands on Screener tab                                  │
│     │                                                            │
│     ▼                                                            │
│  2. Sees default view (all markets, sorted by volume)           │
│     │                                                            │
│     ├──► Option A: Use quick category filters                   │
│     │    • Click "Crypto" → Filtered results                    │
│     │                                                            │
│     ├──► Option B: Use advanced filters                         │
│     │    • Click "Filters" → Panel opens                        │
│     │    • Set: YES < 25%, Volume > $1M, Days < 30              │
│     │    • Click "Apply"                                        │
│     │                                                            │
│     ├──► Option C: Use saved preset                             │
│     │    • Click "High Volume Underdog" preset                  │
│     │    • Filters auto-applied                                 │
│     │                                                            │
│     └──► Option D: Custom expression                            │
│          • Type: "YES < 15% AND volume > $500k"                 │
│          • Press Enter                                          │
│     │                                                            │
│     ▼                                                            │
│  3. View filtered results                                        │
│     │                                                            │
│     ├──► Click market row → View details (future)              │
│     ├──► Click alert icon → Set price alert                    │
│     └──► Click export → Download CSV                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 3: Whale Following

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHALE FOLLOWING FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User views Whale Tracker tab                                │
│     │                                                            │
│     ▼                                                            │
│  2. Sees leaderboard sorted by win rate                         │
│     │  • Top 3 highlighted (gold, silver, bronze)               │
│     │                                                            │
│     ▼                                                            │
│  3. Clicks on whale row (e.g., "CryptoOracle")                  │
│     │                                                            │
│     ▼                                                            │
│  4. Detail panel slides in                                       │
│     │  • Stats: Win rate, Volume, P&L, Streak                   │
│     │  • Recent trades list                                     │
│     │  • "Follow" button                                        │
│     │                                                            │
│     ▼                                                            │
│  5. User clicks "Follow"                                         │
│     │                                                            │
│     ├──► If Free tier:                                          │
│     │    • Whale added to followed list                         │
│     │    • Trades appear in feed (15 min delay)                │
│     │    • Prompt: "Upgrade to see trades in real-time"        │
│     │                                                            │
│     └──► If Pro/Pro+ tier:                                      │
│          • Whale added to followed list                         │
│          • Set notification preferences                         │
│          • Trades appear instantly in feed                      │
│          • Push/Telegram alerts enabled                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 4: Subscription Upgrade

```
┌─────────────────────────────────────────────────────────────────┐
│                    UPGRADE FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Trigger Points:                                                 │
│  • Click "Upgrade" button                                       │
│  • Try to use Pro feature (soft paywall)                        │
│  • 4th alert attempt (hard limit)                               │
│  • Export CSV (blurred data prompt)                             │
│     │                                                            │
│     ▼                                                            │
│  1. Pricing Modal Opens                                          │
│     │  • Shows Free vs Pro vs Pro+ comparison                   │
│     │  • Highlights: "You're missing: [feature they tried]"     │
│     │  • Toggle: Monthly / Annual (Annual highlighted)          │
│     │                                                            │
│     ▼                                                            │
│  2. User selects plan                                            │
│     │                                                            │
│     ▼                                                            │
│  3. Redirect to Polar Checkout                                   │
│     │  • Pre-filled email from Clerk                            │
│     │  • Card entry (Stripe-powered)                            │
│     │                                                            │
│     ▼                                                            │
│  4. Payment Success                                              │
│     │                                                            │
│     ▼                                                            │
│  5. Webhook fires → Inngest processes                           │
│     │  • Update user tier in Convex                             │
│     │  • Send welcome email                                     │
│     │                                                            │
│     ▼                                                            │
│  6. Redirect back to app                                         │
│     │  • Success toast: "Welcome to Pro! 🎉"                    │
│     │  • Features unlocked immediately                          │
│     │  • Confetti animation (optional)                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# 5. Feature Specifications

## 5.1 Market Screener

### 5.1.1 Overview

The Market Screener is the primary tool for discovering prediction markets across multiple platforms. It provides powerful filtering capabilities similar to stock screeners.

### 5.1.2 UI Components

| Component | Description | Behavior |
|-----------|-------------|----------|
| Search Bar | Keyword search input | Instant search, debounced 300ms |
| Category Pills | Horizontal scrollable category filters | Single select, "All" default |
| Filter Panel | Expandable advanced filters | Toggle visibility |
| Filter Inputs | Min/max inputs for each criterion | Numeric validation |
| Custom Expression Input | Free-text filter expression | Parse on Enter/Apply |
| Preset Sidebar | Saved filter presets | Click to apply |
| Results Table | Paginated market list | Sortable columns |
| Export Button | CSV download trigger | Tier-gated |

### 5.1.3 Data Fields

| Field | Type | Source | Update Frequency |
|-------|------|--------|------------------|
| Market Title | String | External API | On sync (5 min) |
| Category | Enum | External API + Manual tagging | On sync |
| YES Price | Decimal (0-1) | External API | Real-time |
| NO Price | Decimal (0-1) | Calculated (1 - YES) | Real-time |
| 24h Change | Decimal (%) | Calculated | Every 1 min |
| Volume (Total) | Integer ($) | External API | On sync |
| Volume (24h) | Integer ($) | External API | On sync |
| Liquidity | Integer ($) | External API | On sync |
| End Date | DateTime | External API | On sync |
| Days Remaining | Integer | Calculated | Real-time |
| Platform | Enum | External API | Static |

### 5.1.4 Filter Logic

**Basic Filters (AND logic):**
```
result = markets.filter(m => 
  (category === 'All' || m.category === category) &&
  (minVolume === null || m.volume >= minVolume) &&
  (maxVolume === null || m.volume <= maxVolume) &&
  (minPrice === null || m.yesPrice >= minPrice) &&
  (maxPrice === null || m.yesPrice <= maxPrice) &&
  (maxDays === null || m.daysRemaining <= maxDays)
)
```

**Custom Expression Parser:**
```
Supported operators: <, >, <=, >=, =, !=
Supported fields: YES, NO, volume, liquidity, days, change
Supported connectors: AND, OR
Supported grouping: ( )

Examples:
- "YES < 20%"
- "YES < 20% AND volume > $1M"
- "volume > $500k AND days < 30"
- "(YES < 15% OR YES > 85%) AND volume > $1M"
```

### 5.1.5 Tier Restrictions

| Feature | Free | Pro | Pro+ |
|---------|------|-----|------|
| Basic filters | ✅ | ✅ | ✅ |
| Custom expressions | ❌ | ✅ | ✅ |
| Saved presets | 1 | 10 | Unlimited |
| Export CSV | 10 rows (blurred) | 100 rows/day | Unlimited |
| Sort by all columns | ❌ | ✅ | ✅ |

---

## 5.2 Whale Tracker

### 5.2.1 Overview

The Whale Tracker identifies and monitors high-performing traders ("whales") across prediction markets, providing verified performance metrics and trade history.

### 5.2.2 Whale Identification Criteria

A wallet is classified as a "whale" if it meets ANY of the following:

| Criterion | Threshold |
|-----------|-----------|
| Total Volume (All-time) | > $100,000 |
| Win Rate (min 20 trades) | > 60% |
| Single Trade Size | > $10,000 |
| Monthly Active Volume | > $50,000 |

### 5.2.3 Leaderboard Data

| Field | Type | Calculation |
|-------|------|-------------|
| Rank | Integer | By win rate (min 20 trades) |
| Address | String | Wallet address (truncated) |
| Nickname | String | User-submitted or auto-generated |
| Avatar | Emoji/Image | User-submitted or auto-assigned |
| Win Rate | Decimal (%) | Wins / Total Resolved Positions |
| Total Volume | Integer ($) | Sum of all trade amounts |
| P&L | Integer ($) | Realized profit/loss |
| Trades | Integer | Count of trades |
| Win Streak | Integer | Consecutive wins |
| Last Active | DateTime | Most recent trade |

### 5.2.4 Whale Profile Detail

**Stats Section:**
- Win Rate (large display)
- Total Volume
- All-time P&L
- Current Win Streak
- Avg Trade Size
- Favorite Categories (pie chart)
- Performance Over Time (line chart) [Pro+ only]

**Recent Trades Section:**
- Last 10-20 trades
- Fields: Market, Direction, Amount, Entry Price, Current Price, Status
- Status: Open, Won, Lost

**Follow Button:**
- Toggle follow/unfollow
- Count of followers
- Notification settings (Pro+)

### 5.2.5 Tier Restrictions

| Feature | Free | Pro | Pro+ |
|---------|------|-----|------|
| View leaderboard | Top 10 | Top 50 | All |
| View whale profile | Basic stats only | Full profile | Full + charts |
| View recent trades | Last 3 | Last 10 | Last 50 |
| Follow whales | 3 max | 20 max | Unlimited |
| Performance charts | ❌ | ❌ | ✅ |

---

## 5.3 Live Activity Feed

### 5.3.1 Overview

Real-time feed of whale trades as they happen on-chain. The core "alpha" feature of OpinionScope.

### 5.3.2 Feed Entry Data

| Field | Type | Description |
|-------|------|-------------|
| Timestamp | DateTime | When trade was detected |
| Whale | Object | Reference to whale profile |
| Action | Enum | BUY or SELL |
| Market | Object | Reference to market |
| Amount | Integer ($) | Trade size in USD |
| Price | Decimal | Entry price (YES %) |
| Platform | Enum | Polymarket, Kalshi, etc. |

### 5.3.3 Feed Behavior

| Aspect | Description |
|--------|-------------|
| Update Method | WebSocket subscription (Convex) |
| Max Items Displayed | 50 (older items paginated) |
| Animation | New items fade in from top |
| Filtering | By followed whales, by min amount |
| Grouping | None (chronological) |

### 5.3.4 Tiered Delivery

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIGNAL DELIVERY TIMELINE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  T+0s        Whale trade detected on-chain                      │
│  │                                                               │
│  T+0s        Pro+ users notified (WebSocket + Push)             │
│  │           └─► "CryptoOracle just bought $50k on BTC $150k"   │
│  │                                                               │
│  T+30s       Pro users notified                                 │
│  │           └─► Same notification                              │
│  │                                                               │
│  T+15min     Free users see in feed                             │
│  │           └─► No push notification                           │
│  │           └─► Badge: "15 minutes ago"                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3.5 Tier Restrictions

| Feature | Free | Pro | Pro+ |
|---------|------|-----|------|
| Feed access | ✅ | ✅ | ✅ |
| Feed delay | 15 minutes | Real-time | Real-time |
| Push notifications | ❌ | ✅ | ✅ |
| Early access | - | - | +30 seconds |
| Filter by followed | ❌ | ✅ | ✅ |
| Filter by amount | ❌ | ✅ | ✅ |

---

## 5.4 Alert System

### 5.4.1 Alert Types

| Type | Description | Trigger |
|------|-------------|---------|
| Price Alert | Market reaches target price | YES price crosses threshold |
| Whale Alert | Followed whale makes trade | Any trade by followed whale |
| Volume Alert | Market volume spikes | 24h volume > threshold |
| New Market Alert | Market matches saved screener | New market + filter match |

### 5.4.2 Notification Channels

| Channel | Implementation | Tier Requirement |
|---------|----------------|------------------|
| In-app | Convex subscription | Free |
| Email | Inngest → SendGrid/Resend | Free |
| Push (Web) | Web Push API | Pro |
| Telegram | Telegram Bot API | Pro |
| Discord | Discord Webhook | Pro |

### 5.4.3 Alert Limits

| Tier | Total Alerts | Channels |
|------|--------------|----------|
| Free | 3 | In-app, Email |
| Pro | 50 | All |
| Pro+ | Unlimited | All |

---

## 5.5 Data Export

### 5.5.1 CSV Export Fields

**Markets Export:**
```csv
title,category,yes_price,no_price,volume,liquidity,end_date,days_remaining,24h_change,platform,url
```

**Whale Trades Export (Pro+):**
```csv
timestamp,whale_address,whale_nickname,action,market_title,amount_usd,entry_price,platform
```

### 5.5.2 API Endpoints (Enterprise)

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/v1/markets | GET | List markets with filters |
| /api/v1/markets/:id | GET | Single market detail |
| /api/v1/whales | GET | List whales |
| /api/v1/whales/:address | GET | Whale profile + trades |
| /api/v1/activity | GET | Recent whale activity |
| /api/v1/ws/activity | WebSocket | Real-time activity stream |

---

# 6. Technical Architecture

## 6.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPINIONSCOPE ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                        ┌─────────────┐                          │
│                        │   Vercel    │                          │
│                        │  (Next.js)  │                          │
│                        └──────┬──────┘                          │
│                               │                                  │
│         ┌─────────────────────┼─────────────────────┐           │
│         │                     │                     │           │
│         ▼                     ▼                     ▼           │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐     │
│  │   Clerk     │      │   Convex    │      │   Polar     │     │
│  │             │      │             │      │             │     │
│  │ • Auth      │      │ • Database  │      │ • Payments  │     │
│  │ • Users     │◄────►│ • Real-time │◄────►│ • Subs      │     │
│  │ • Sessions  │      │ • Functions │      │ • Webhooks  │     │
│  └─────────────┘      └──────┬──────┘      └─────────────┘     │
│                              │                                   │
│                       ┌──────┴──────┐                           │
│                       │   Inngest   │                           │
│                       │             │                           │
│                       │ • Cron jobs │                           │
│                       │ • Workflows │                           │
│                       │ • Queues    │                           │
│                       └──────┬──────┘                           │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ Polymarket  │     │   Kalshi    │     │  Blockchain │       │
│  │    API      │     │    API      │     │    RPCs     │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 6.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 (App Router) | React framework, SSR, API routes |
| UI Components | Tailwind CSS + Shadcn/UI | Styling and component library |
| State Management | Tanstack Query + Convex React | Server state + real-time |
| Authentication | Clerk | User auth, sessions, OAuth |
| Database | Convex | Real-time database + functions |
| Background Jobs | Inngest | Scheduled tasks, workflows |
| Payments | Polar | Subscriptions, billing |
| Email | Resend | Transactional emails |
| Notifications | Telegram Bot API, Discord Webhooks | Alert delivery |
| Hosting | Vercel | Frontend + API hosting |
| Monitoring | Vercel Analytics + Sentry | Performance + errors |

## 6.3 Data Flow

### 6.3.1 Market Data Sync

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKET DATA SYNC FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐                                                │
│  │   Inngest   │ Cron: Every 5 minutes                         │
│  │   Trigger   │                                                │
│  └──────┬──────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  Fetch      │     │  Fetch      │     │  Fetch      │       │
│  │ Polymarket  │     │  Kalshi     │     │  Others     │       │
│  │    API      │     │   API       │     │             │       │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘       │
│         │                   │                   │               │
│         └─────────────┬─────┴───────────────────┘               │
│                       │                                          │
│                       ▼                                          │
│              ┌─────────────────┐                                │
│              │   Transform &   │                                │
│              │   Normalize     │                                │
│              └────────┬────────┘                                │
│                       │                                          │
│                       ▼                                          │
│              ┌─────────────────┐                                │
│              │  Convex Bulk    │                                │
│              │  Upsert         │                                │
│              └────────┬────────┘                                │
│                       │                                          │
│                       ▼                                          │
│              ┌─────────────────┐                                │
│              │  Check Alert    │                                │
│              │  Triggers       │                                │
│              └─────────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3.2 Whale Activity Detection

```
┌─────────────────────────────────────────────────────────────────┐
│                 WHALE ACTIVITY DETECTION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option A: Blockchain Indexing (Preferred)                      │
│  ─────────────────────────────────────────                      │
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  Polygon    │────►│  Index      │────►│  Detect     │       │
│  │  RPC Node   │     │  Contract   │     │  Whale      │       │
│  │             │     │  Events     │     │  Trades     │       │
│  └─────────────┘     └─────────────┘     └──────┬──────┘       │
│                                                  │               │
│                                                  ▼               │
│                                          ┌─────────────┐        │
│                                          │  Inngest    │        │
│                                          │  Event      │        │
│                                          └──────┬──────┘        │
│                                                 │                │
│                                                 ▼                │
│                                   ┌─────────────────────┐       │
│                                   │  Tiered             │       │
│                                   │  Notification       │       │
│                                   │  Workflow           │       │
│                                   └─────────────────────┘       │
│                                                                  │
│  Option B: API Polling (Fallback)                               │
│  ────────────────────────────────                               │
│                                                                  │
│  ┌─────────────┐                                                │
│  │   Inngest   │ Cron: Every 30 seconds                        │
│  │   Trigger   │                                                │
│  └──────┬──────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │  Fetch Recent   │────►│  Compare with   │                   │
│  │  Trades API     │     │  Last Known     │                   │
│  └─────────────────┘     └────────┬────────┘                   │
│                                   │                             │
│                                   ▼                             │
│                          ┌─────────────────┐                   │
│                          │  New Trades?    │                   │
│                          │  Emit Event     │                   │
│                          └─────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 6.4 Database Schema (Convex)

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============ USERS ============
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    tier: v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("pro_plus"),
      v.literal("enterprise")
    ),
    tierExpiresAt: v.optional(v.number()),
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
    telegramChatId: v.optional(v.string()),
    discordWebhook: v.optional(v.string()),
    notificationPreferences: v.object({
      email: v.boolean(),
      push: v.boolean(),
      telegram: v.boolean(),
      discord: v.boolean(),
    }),
    followedWhales: v.array(v.id("whales")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_tier", ["tier"]),

  // ============ WHALES ============
  whales: defineTable({
    address: v.string(),
    nickname: v.optional(v.string()),
    avatar: v.optional(v.string()),
    isVerified: v.boolean(),
    winRate: v.number(),
    totalVolume: v.number(),
    totalPnl: v.number(),
    tradeCount: v.number(),
    winStreak: v.number(),
    lastActiveAt: v.number(),
    favoriteCategories: v.array(v.string()),
    platforms: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_address", ["address"])
    .index("by_win_rate", ["winRate"])
    .index("by_volume", ["totalVolume"])
    .index("by_last_active", ["lastActiveAt"]),

  // ============ MARKETS ============
  markets: defineTable({
    externalId: v.string(),
    platform: v.union(
      v.literal("polymarket"),
      v.literal("kalshi"),
      v.literal("manifold"),
      v.literal("other")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    yesPrice: v.number(),
    volume: v.number(),
    volume24h: v.number(),
    liquidity: v.number(),
    endDate: v.number(),
    resolvedAt: v.optional(v.number()),
    outcome: v.optional(v.union(v.literal("yes"), v.literal("no"))),
    url: v.string(),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_external", ["platform", "externalId"])
    .index("by_category", ["category"])
    .index("by_volume", ["volume"])
    .index("by_end_date", ["endDate"]),

  // ============ WHALE ACTIVITY ============
  whaleActivity: defineTable({
    whaleId: v.id("whales"),
    marketId: v.id("markets"),
    action: v.union(v.literal("BUY"), v.literal("SELL")),
    amount: v.number(),
    price: v.number(),
    platform: v.string(),
    txHash: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_whale", ["whaleId", "timestamp"])
    .index("by_market", ["marketId", "timestamp"])
    .index("by_timestamp", ["timestamp"]),

  // ============ ALERTS ============
  alerts: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("price"),
      v.literal("whale"),
      v.literal("volume"),
      v.literal("new_market")
    ),
    marketId: v.optional(v.id("markets")),
    whaleId: v.optional(v.id("whales")),
    condition: v.object({
      operator: v.union(
        v.literal("gt"),
        v.literal("lt"),
        v.literal("eq"),
        v.literal("gte"),
        v.literal("lte")
      ),
      value: v.number(),
    }),
    isActive: v.boolean(),
    lastTriggeredAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_market", ["marketId"])
    .index("by_whale", ["whaleId"]),

  // ============ SAVED PRESETS ============
  savedPresets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    filterExpression: v.string(),
    filters: v.object({
      category: v.optional(v.string()),
      minVolume: v.optional(v.number()),
      maxVolume: v.optional(v.number()),
      minPrice: v.optional(v.number()),
      maxPrice: v.optional(v.number()),
      maxDays: v.optional(v.number()),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // ============ NOTIFICATION LOG ============
  notificationLog: defineTable({
    userId: v.id("users"),
    alertId: v.optional(v.id("alerts")),
    type: v.string(),
    channel: v.union(
      v.literal("email"),
      v.literal("push"),
      v.literal("telegram"),
      v.literal("discord"),
      v.literal("in_app")
    ),
    status: v.union(
      v.literal("sent"),
      v.literal("failed"),
      v.literal("pending")
    ),
    content: v.string(),
    sentAt: v.number(),
    errorMessage: v.optional(v.string()),
  })
    .index("by_user", ["userId", "sentAt"])
    .index("by_status", ["status"]),
});
```

---

# 7. Subscription Model

## 7.1 Tier Comparison

| Feature | Free | Pro ($29/mo) | Pro+ ($79/mo) |
|---------|------|--------------|---------------|
| **Market Screener** | | | |
| Basic filters | ✅ | ✅ | ✅ |
| Custom filter expressions | ❌ | ✅ | ✅ |
| Saved presets | 1 | 10 | Unlimited |
| CSV Export | 10 rows (blurred) | 100 rows/day | Unlimited |
| **Whale Tracker** | | | |
| Leaderboard access | Top 10 | Top 50 | All |
| Whale profiles | Basic stats | Full profile | Full + charts |
| Recent trades visible | 3 | 10 | 50 |
| Follow whales | 3 | 20 | Unlimited |
| Performance charts | ❌ | ❌ | ✅ |
| **Live Activity** | | | |
| Feed access | ✅ | ✅ | ✅ |
| Feed delay | 15 minutes | Real-time | Real-time |
| Early access | - | - | +30 seconds |
| Filter by amount | ❌ | ✅ | ✅ |
| **Alerts** | | | |
| Total alerts | 3 | 50 | Unlimited |
| Channels | In-app, Email | All | All |
| Whale activity alerts | ❌ | ✅ | ✅ |
| **Support** | | | |
| Support | Community | Email | Priority |

## 7.2 Pricing Strategy

### Monthly Pricing
- **Pro:** $29/month
- **Pro+:** $79/month

### Annual Pricing (2 months free)
- **Pro:** $290/year ($24.17/month effective)
- **Pro+:** $790/year ($65.83/month effective)

### Enterprise
- Custom pricing starting at $500/month
- API access, SLA, dedicated support

## 7.3 Free Trial Strategy

- No free trial for Pro (value is clear immediately)
- 7-day free trial for Pro+ (to experience early access value)
- Trial requires credit card (reduces abuse)

## 7.4 Upgrade Triggers

| Trigger Point | Action |
|---------------|--------|
| 4th alert attempt | Hard block + upgrade modal |
| CSV export click | Blurred preview + upgrade modal |
| Follow 4th whale | Soft prompt + upgrade modal |
| Custom filter attempt | Feature locked + upgrade modal |
| Real-time feed upsell | Banner: "See this 15 minutes earlier" |
| Whale profile detail | Partial blur + upgrade modal |

---

# 8. Success Metrics

## 8.1 North Star Metric

**Weekly Active Screener Users (WASU)**

Definition: Users who apply at least one filter or follow one whale per week.

Target: 10,000 WASU by end of Year 1.

## 8.2 Key Performance Indicators

### Acquisition

| Metric | Definition | Target (Month 6) |
|--------|------------|------------------|
| Total Signups | New accounts created | 50,000 |
| Signup Conversion | Visitors → Signups | 5% |
| Activation Rate | Signups → First filter applied | 60% |

### Engagement

| Metric | Definition | Target |
|--------|------------|--------|
| DAU/MAU | Daily/Monthly active ratio | 25% |
| Avg Session Duration | Time spent per session | 8 minutes |
| Alerts Created per User | Avg alerts for active users | 2.5 |
| Whales Followed per User | Avg follows for active users | 3 |

### Monetization

| Metric | Definition | Target (Month 6) |
|--------|------------|------------------|
| Free → Pro Conversion | % of free users upgrading | 5% |
| Pro → Pro+ Upgrade | % of Pro users upgrading | 15% |
| Monthly Recurring Revenue | Total subscription revenue | $50,000 |
| Average Revenue Per User | MRR / Paid Users | $35 |
| Lifetime Value (LTV) | Avg revenue per user lifetime | $300 |

### Retention

| Metric | Definition | Target |
|--------|------------|--------|
| Day 1 Retention | Return next day | 40% |
| Day 7 Retention | Return within 7 days | 25% |
| Day 30 Retention | Return within 30 days | 15% |
| Monthly Churn (Pro) | % Pro users cancelling | < 5% |
| Monthly Churn (Pro+) | % Pro+ users cancelling | < 3% |

## 8.3 Quality Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Data Accuracy | Whale trade detection accuracy | 99.9% |
| Alert Delivery Rate | Alerts successfully delivered | 99.5% |
| System Uptime | Platform availability | 99.9% |
| Page Load Time | P95 load time | < 2s |
| API Latency | P95 response time | < 200ms |

---

# 9. Roadmap

## 9.1 Phase 1: MVP (Months 1-2)

**Goal:** Launch core product, validate market fit

| Feature | Priority | Status |
|---------|----------|--------|
| Market Screener (basic filters) | P0 | Planned |
| Whale Leaderboard | P0 | Planned |
| Live Activity Feed (delayed for free) | P0 | Planned |
| User Auth (Clerk) | P0 | Planned |
| Basic Alerts (3 free) | P1 | Planned |
| Subscription (Polar) | P0 | Planned |
| Landing Page | P0 | Planned |

**Success Criteria:**
- 1,000 signups
- 50 paid subscribers
- < 3 critical bugs

## 9.2 Phase 2: Growth (Months 3-4)

**Goal:** Expand features, drive conversions

| Feature | Priority | Status |
|---------|----------|--------|
| Custom filter expressions | P1 | Planned |
| Saved presets | P1 | Planned |
| Telegram notifications | P1 | Planned |
| Discord webhook alerts | P2 | Planned |
| CSV export | P1 | Planned |
| Whale profile details | P1 | Planned |
| Referral program | P2 | Planned |

**Success Criteria:**
- 10,000 signups
- 500 paid subscribers
- $15,000 MRR

## 9.3 Phase 3: Expansion (Months 5-6)

**Goal:** Pro+ features, retention focus

| Feature | Priority | Status |
|---------|----------|--------|
| Performance charts (Pro+) | P1 | Planned |
| Early access signals (Pro+) | P0 | Planned |
| Whale performance history | P1 | Planned |
| New market alerts | P2 | Planned |
| Mobile responsive improvements | P1 | Planned |
| API access (Enterprise) | P2 | Planned |

**Success Criteria:**
- 25,000 signups
- 1,500 paid subscribers
- $50,000 MRR

## 9.4 Phase 4: Scale (Months 7-12)

**Goal:** Platform expansion, enterprise

| Feature | Priority | Status |
|---------|----------|--------|
| Native mobile apps | P2 | Planned |
| Portfolio tracking | P2 | Planned |
| Backtesting engine | P3 | Planned |
| Copy-trade automation | P3 | Planned |
| Additional platforms (Kalshi, Manifold) | P1 | Planned |
| Enterprise dashboard | P2 | Planned |
| Public API | P2 | Planned |

**Success Criteria:**
- 100,000 signups
- 5,000 paid subscribers
- $150,000 MRR

---

# 10. Risks & Mitigations

## 10.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| External API rate limits | High | High | Implement caching, request batching, multiple API keys |
| Blockchain data delays | Medium | High | Use multiple RPC providers, implement fallback polling |
| Real-time scale issues | Medium | High | Convex handles scaling; monitor and optimize queries |
| Data accuracy errors | Medium | Critical | Multi-source verification, anomaly detection alerts |

## 10.2 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Polymarket API changes | Medium | High | Abstract data layer, diversify platforms early |
| Competition (Polymarket builds similar) | Medium | High | Focus on UX, build brand loyalty, move fast |
| Low conversion rates | Medium | High | A/B test paywalls, optimize onboarding, add value |
| Regulatory issues | Low | Critical | Legal review, no trading execution, just information |

## 10.3 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Whale gaming the system | Low | Medium | Reputation system, minimum trade requirements |
| Alert spam complaints | Medium | Low | Smart batching, daily limits, easy unsubscribe |
| Support overload | Medium | Medium | Self-serve docs, community Discord, tiered support |

---

# 11. Appendix

## 11.1 Glossary

| Term | Definition |
|------|------------|
| Whale | High-volume or high-win-rate trader |
| YES Price | Probability price for "Yes" outcome (0-100%) |
| Win Rate | Percentage of resolved positions that were profitable |
| P&L | Profit and Loss (total gains minus losses) |
| Liquidity | Available capital in market order books |
| Resolution | When a market outcome is determined |

## 11.2 Competitive Analysis

| Competitor | Strengths | Weaknesses | Our Advantage |
|------------|-----------|------------|---------------|
| Polymarket (native) | Official data | No screener, no whale tracking | Full feature set |
| PolyWatcher | Whale tracking | Limited features, poor UX | Better UX, more features |
| Twitter/X | Social signals | Unverified, noisy | Verified performance data |
| Custom scripts | Flexible | Requires coding | No-code solution |

## 11.3 References

- Polymarket API Documentation
- Kalshi API Documentation
- Convex Documentation
- Clerk Documentation
- Polar Documentation
- Inngest Documentation

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | Product Team | Initial draft |

---

*This document is confidential and intended for internal use only.*
