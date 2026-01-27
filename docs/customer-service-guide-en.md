# OpinionScope - Customer Service Guide

> **Version:** 1.1 | **Last Updated:** January 2026
> **Website:** https://opinionscope.xyz
> **Support Email:** support@opinionscope.xyz

---

## 1. What is OpinionScope?

OpinionScope is a **prediction market analytics platform** that helps users track top traders from the Opinion.Trade leaderboard (called "whales").

**Think of it like this:** Instead of guessing which markets to trade, users can see what the most profitable traders on Opinion.Trade are buying and selling.

### Who Uses OpinionScope?

- Prediction market traders who want an edge
- Investors researching market sentiment
- Anyone interested in following Opinion.Trade top performers

---

## 2. Main Features

### 🐋 Whale Tracker (Main Feature)
Track top traders from Opinion.Trade leaderboard. Users can see:
- Trader positions and portfolio (limit: 100 items)
- Win rate percentages
- Recent trade history (limit: 100 items)
- Performance over time (24h, 7d, 30d, All-time)
- Points ranking

**500+ whales** from Opinion.Trade leaderboard are tracked.

### 🔍 Market Screener (Coming Soon)
Search and filter prediction markets by:
- Price range
- Trading volume
- Category (Politics, Sports, Crypto, etc.)

> **Status:** In development - launching soon!

### 📊 Activity Feed
Watch whale trades with **15-minute delay** (due to Opinion.Trade API limitations):
- Recent whale trades (limit: 200 items)
- Trade details: market, position, amount
- Sortable by time

### 📈 Performance Analytics
Track how whales perform over different time periods:
- 24 hours, 7 days, 30 days, All-time
- Win rate tracking
- Profit/Loss analysis
- Points ranking

> **Note:** Subscription plans (Pro/Pro+) with real-time feed, alerts, and export features are planned for future release.

---

## 3. User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                            │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
    │  STEP 1  │────▶│    STEP 2    │────▶│   STEP 3    │────▶│  STEP 4  │
    │ Connect  │     │   Browse     │     │   View      │     │  Track   │
    │  Wallet  │     │   Whales     │     │   Profile   │     │  Feed    │
    └──────────┘     └──────────────┘     └─────────────┘     └──────────┘
         │                  │                   │                   │
         ▼                  ▼                   ▼                   ▼
    ┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
    │ Use your │     │ Sort by      │     │ See trades, │     │ Monitor  │
    │ crypto   │     │ volume, P&L, │     │ positions,  │     │ whale    │
    │ wallet   │     │ points       │     │ win rate    │     │ activity │
    └──────────┘     └──────────────┘     └─────────────┘     └──────────┘
```

### Step-by-Step:

1. **Connect Wallet** → Sign in with your crypto wallet (MetaMask, etc.)
2. **Browse Whales** → View Opinion.Trade leaderboard top performers
3. **View Profile** → Check whale's trades (100), positions (100), and stats
4. **Track Feed** → Monitor recent whale activity (200 items, 15-min delay)

---

## 4. Current Limits & Future Plans

### Current Features (Free for All Users)

```
┌────────────────────────────────┬─────────────────────────────┐
│           FEATURE              │           LIMIT             │
├────────────────────────────────┼─────────────────────────────┤
│ Whale Leaderboard              │  Full access (500+ whales)  │
│ Whale Trades History           │  100 items per whale        │
│ Whale Positions                │  100 items per whale        │
│ Activity Feed                  │  200 items (15-min delay)   │
│ Market Screener                │  Full access                │
│ Performance Stats              │  Full access                │
└────────────────────────────────┴─────────────────────────────┘
```

### Why 15-Minute Feed Delay?
The activity feed has a 15-minute delay due to **Opinion.Trade API rate limits**. This is not a paid restriction - it's a technical limitation.

### Coming Soon
- **Market Screener** - Filter markets by price, volume, category (in development)
- **Smart Alerts** - Get notified for price triggers, whale activity (in planning)

### Future Features (Planned)
Subscription plans with additional features are planned for future release:
- Real-time activity feed
- CSV data export
- Advanced filters

---

## 5. Common Support Scenarios

### Account Issues

**Q: "I can't log in to my account"**
> Guide user to:
> 1. Make sure you're using the same wallet you used to sign up
> 2. Check wallet is unlocked and connected to correct network
> 3. Clear browser cache and cookies
> 4. Try a different browser
> 5. If still failing, escalate to technical support

**Q: "I forgot my password"**
> OpinionScope uses **wallet authentication only** - there is no password. Users sign in by connecting their crypto wallet (MetaMask, etc.). As long as they have access to their wallet, they can sign in.

**Q: "How do I change my wallet?"**
> Currently, wallet addresses cannot be changed as they serve as the account identifier. Contact support for special cases.

**Q: "How do I delete my account?"**
> Contact support@opinionscope.xyz with your wallet address. Account deletion takes 24-48 hours.

### Feature Questions

**Q: "Why is my feed delayed by 15 minutes?"**
> The 15-minute delay is due to **Opinion.Trade API rate limits** - not a paid restriction. This applies to all users equally. Real-time feeds are planned for future subscription tiers.

**Q: "How are whales identified?"**
> Whales are top performers from the **Opinion.Trade leaderboard**. Rankings are based on:
> - Total trading volume
> - Win rate percentage
> - Profit/Loss (P&L)
> - Points earned
> All data comes directly from Opinion.Trade.

**Q: "Why can I only see 100 trades/positions?"**
> Current limits per whale:
> - Trades history: 100 items
> - Open positions: 100 items
> - Activity feed: 200 items total
> These are API-based limits that may increase in future updates.

**Q: "What markets do you track?"**
> Currently: Opinion.Trade markets only
> Coming soon: Polymarket, Kalshi, and other prediction markets

**Q: "When will alerts/subscriptions be available?"**
> Subscription plans with alerts, real-time feed, and export features are **planned for future release**. No specific date announced yet.

**Q: "When will the Market Screener be available?"**
> Market Screener is currently **in development** and will launch soon. It will allow filtering markets by price, volume, and category.

**Q: "Is the service free?"**
> Yes! OpinionScope is currently **completely free** for all users. Paid subscription tiers may be introduced in the future for premium features.

**Q: "How often is whale data updated?"**
> Whale data is synced periodically from Opinion.Trade. The activity feed has a 15-minute delay due to API limits. Leaderboard rankings are updated regularly.

**Q: "Can I see a whale's full trading history?"**
> Currently, you can view the most recent 100 trades and 100 positions per whale. Full history may be available in future updates.

**Q: "What wallets are supported for login?"**
> We support most popular crypto wallets including MetaMask, WalletConnect, Coinbase Wallet, and others. Any EVM-compatible wallet should work.

**Q: "Is my wallet safe when I connect?"**
> Yes. We only request a signature to verify ownership - we never ask for private keys or seed phrases, and we cannot access your funds.

---

## 6. Troubleshooting Guide

### Data Not Loading
1. Refresh the page
2. Check internet connection
3. Clear browser cache
4. Try incognito/private mode
5. If persistent, report to tech support

### Wallet Connection Issues
1. Ensure wallet extension is installed (MetaMask, etc.)
2. Check wallet is unlocked
3. Verify correct network is selected
4. Try disconnecting and reconnecting wallet
5. Try a different browser or clear extension cache

### Whale Data Shows "Stale"
This indicates data hasn't been synced recently from Opinion.Trade. The system automatically refreshes data periodically. Stale data is still accurate as of the last sync time.

### Feed Not Updating
Remember: Activity feed has a **15-minute delay** by design (API limitation). If data seems outdated beyond 15 minutes:
1. Refresh the page
2. Check Opinion.Trade status
3. Report to tech support if issue persists

---

## 7. Security & Privacy

### Key Points to Reassure Customers:

- **Payment Security:** Handled by Stripe (industry standard). We never store card numbers.
- **Data Encryption:** All data encrypted in transit and at rest
- **No Data Selling:** We do not sell user data to third parties
- **GDPR Compliant:** Users can request data deletion at any time

---

## 8. Escalation Paths

| Issue Type | First Response | Escalate To |
|------------|----------------|-------------|
| Wallet Connection | Self-service guide | support@opinionscope.xyz |
| Account Deletion | Collect wallet address | support@opinionscope.xyz |
| Technical Bug | Troubleshooting | Technical team |
| Feature Request | Acknowledge & log | Product team |
| Security Concern | Immediate escalation | Security team |
| Data Accuracy | Check Opinion.Trade | Technical team |

---

## 9. Quick Reference

### Important Links
- **Website:** https://opinionscope.xyz
- **Pricing:** https://opinionscope.xyz/pricing
- **Terms:** https://opinionscope.xyz/terms
- **Privacy:** https://opinionscope.xyz/privacy
- **Support:** support@opinionscope.xyz

### Response Templates

**Welcome Message:**
> "Thank you for contacting OpinionScope support! How can I help you today?"

**Resolution Closing:**
> "Is there anything else I can help you with? We're always here if you have more questions!"

**Escalation Message:**
> "I'll escalate this to our specialized team. You'll receive a response within 24 hours."

---

*Document maintained by OpinionScope Team*
