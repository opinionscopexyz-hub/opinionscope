# UI/UX Design Report: OpinionScope Design Guidelines & Wireframes

**Date:** 2026-01-16
**Agent:** ui-ux-designer
**Task:** Create comprehensive design guidelines and wireframes for OpinionScope

---

## Summary

Created complete design system and 8 interactive HTML wireframes for OpinionScope, a prediction market intelligence platform targeting traders.

## Deliverables

### 1. Design Guidelines
**File:** `D:\works\cv\opinion-scope\docs\design-guidelines.md`

Key decisions:
- **Theme:** Dark-first (Bloomberg Terminal aesthetic) with Linear-style modern SaaS polish
- **Colors:** Zinc-based neutral palette, blue accent, green/red for semantic (with CVD-friendly alternatives)
- **Typography:** Inter for UI, JetBrains Mono for numbers/prices (tabular-nums)
- **Spacing:** 4px base unit system
- **Components:** Data tables, cards, tier badges, locked feature indicators

### 2. Wireframes (8 pages)
**Location:** `D:\works\cv\opinion-scope\docs\wireframes/`

| Page | File | Key Features |
|------|------|--------------|
| Landing | `landing.html` | Hero, features grid, pricing preview, social proof |
| Dashboard | `dashboard.html` | Stats cards, trending markets table, quick actions, activity sidebar |
| Screener | `screener.html` | Search, category pills, filters, data table with pagination |
| Whale Tracker | `whales.html` | Leaderboard with medals, profile detail panel, tier-locked rows |
| Activity Feed | `activity.html` | Real-time feed, delay banner, filter controls |
| Alerts | `alerts.html` | Create alert form, active alerts list, usage counter |
| Pricing | `pricing.html` | 3-tier comparison, feature table, FAQ |
| Settings | `settings.html` | Profile, subscription, notification prefs, integrations |

## Design Patterns Applied

### Data-Heavy UI
- Monospace fonts for all numerical data
- Right-aligned numbers for easy scanning
- Color-coded price changes (+green, -red)
- Compact table rows with hover states

### Tier-Gated Features
- Lock icons with blur overlay for locked content
- "Pro" badges on premium features
- Usage counters (e.g., "2/3 alerts used")
- Upgrade CTAs in context

### Real-time Feedback
- Green pulse indicators for live data
- "15 min delay" badges for free tier
- Slide-in animations for new items
- "3 new trades" notification button

### Responsive Approach
- Mobile-first with progressive disclosure
- Hidden columns on small screens
- Collapsible sidebar navigation
- Touch-friendly targets (44px min)

## Technical Stack Used

- **Tailwind CSS v4** (via CDN for wireframes)
- **Google Fonts:** Inter, JetBrains Mono
- **Icons:** Inline SVG (Lucide-style)
- **No JavaScript dependencies** (static HTML wireframes)

## Design Inspirations Referenced

- Bloomberg Terminal: Data density, color accessibility
- TradingView: Dark theme, chart colors
- Linear: Modern SaaS aesthetic, high contrast
- Polymarket: Prediction market UX patterns

## File Structure

```
docs/
├── design-guidelines.md          # 280 lines
└── wireframes/
    ├── landing.html              # Public landing page
    ├── dashboard.html            # Main dashboard (authenticated)
    ├── screener.html             # Market screener with filters
    ├── whales.html               # Whale tracker + profile panel
    ├── activity.html             # Live activity feed
    ├── alerts.html               # Alert management
    ├── pricing.html              # Pricing comparison
    └── settings.html             # User settings
```

## Recommendations for Implementation

1. **Component Library:** Extract common patterns (sidebar, header, table rows) into shadcn/ui components
2. **Real-time:** Use Convex subscriptions for activity feed and price updates
3. **Skeleton States:** Add loading skeletons matching the wireframe structure
4. **Accessibility:** Implement focus management for modals and slide-in panels
5. **Mobile:** Consider bottom navigation for mobile app version

## Unresolved Questions

1. Should we show whale avatars as emojis or allow custom images?
2. What loading state to show when filtering large market datasets?
3. How to handle notification sounds for real-time alerts?
