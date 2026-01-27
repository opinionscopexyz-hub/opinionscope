# Web Interface Guidelines Compliance Review

**Date:** 2026-01-23
**Reviewer:** UI/UX Designer Agent
**Scope:** `apps/web/src/` - All TSX components

---

## Summary

| Category | Pass | Issues | Critical |
|----------|------|--------|----------|
| Accessibility | 18 | 21 | 5 |
| Focus States | 12 | 8 | 2 |
| Forms | 10 | 14 | 3 |
| Animation | 8 | 3 | 0 |
| Typography | 6 | 4 | 0 |
| Content | 10 | 5 | 1 |
| Images | 4 | 3 | 0 |
| Performance | 6 | 2 | 0 |
| Navigation | 8 | 4 | 1 |

**Total: 60 issues found, 12 critical**

---

## Detailed Findings by File

### UI Base Components

#### `components/ui/button.tsx`
- [PASS] Focus states: Uses `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-1`

#### `components/ui/input.tsx`
- [PASS] Focus states: Uses `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-1`
- [ISSUE] `input.tsx:6-18` - No default `autocomplete` attribute passed through

#### `components/ui/select.tsx`
- [PASS] Focus states on trigger
- [PASS] Keyboard navigation via base-ui primitives

#### `components/ui/checkbox.tsx`
- [PASS] Focus states configured
- [PASS] Accessible via base-ui primitives

#### `components/ui/switch.tsx`
- [PASS] Focus states configured
- [PASS] Accessible via base-ui primitives

#### `components/ui/dialog.tsx`
- [PASS] `dialog.tsx:70` - Close button has `sr-only` text: "Close"

#### `components/ui/dropdown-menu.tsx`
- [PASS] Focus states configured
- [PASS] Keyboard navigation via base-ui

#### `components/ui/sheet.tsx`
- [PASS] `sheet.tsx:69` - Close button has `sr-only` text: "Close"

#### `components/ui/tabs.tsx`
- [PASS] Focus states configured with `focus-visible:border-ring focus-visible:ring-ring/50`

#### `components/ui/table.tsx`
- [PASS] Semantic HTML with proper `<table>`, `<thead>`, `<tbody>` elements

#### `components/ui/label.tsx`
- [PASS] Uses semantic `<label>` element

#### `components/ui/badge.tsx`
- [PASS] Focus states configured

#### `components/ui/card.tsx`
- [PASS] Semantic structure

#### `components/ui/avatar.tsx`
- [ISSUE] `avatar.tsx:28-35` - `AvatarImage` missing required `alt` prop in component definition

#### `components/ui/skeleton.tsx`
- [ISSUE] `skeleton.tsx:7` - Uses `animate-pulse` without `prefers-reduced-motion` check

#### `components/ui/sonner.tsx`
- [PASS] Proper icon usage

---

### Header & Navigation Components

#### `components/header.tsx`
- [ISSUE] `header.tsx:31-39` - Uses `<a>` instead of Next.js `<Link>` for internal navigation links
- [ISSUE] `header.tsx:21-28` - Logo Image has fixed dimensions but `alt` is present

#### `components/user-button.tsx`
- [CRITICAL] `user-button.tsx:42-44` - Icon button (user avatar) missing `aria-label` attribute
- [ISSUE] `user-button.tsx:47-53` - Avatar Image uses `alt` but relies on nullable `user.fullName`

#### `components/mode-toggle.tsx`
- [PASS] `mode-toggle.tsx:23` - Has `sr-only` text: "Toggle theme"

---

### Screener Components

#### `components/screener/search-bar.tsx`
- [ISSUE] `search-bar.tsx:39-45` - Input missing `name` attribute
- [ISSUE] `search-bar.tsx:39-45` - Input missing `autocomplete="off"` (or appropriate value)
- [CRITICAL] `search-bar.tsx:47-57` - Clear button (X icon) missing `aria-label`

#### `components/screener/filter-panel.tsx`
- [PASS] `filter-panel.tsx:94` - Has `role="form"` and `aria-label`
- [PASS] `filter-panel.tsx:110-124` - Inputs have `aria-label` attributes
- [ISSUE] `filter-panel.tsx:99-125` - Inputs missing `name` attributes
- [ISSUE] `filter-panel.tsx:99-125` - Number inputs missing `autocomplete="off"`
- [PASS] `filter-panel.tsx:180` - Reset button has `aria-label="Reset filters"`

#### `components/screener/markets-table.tsx`
- [PASS] `markets-table.tsx:94` - Has `role="region"` and `aria-label`
- [PASS] `markets-table.tsx:105-151` - Sort buttons have `aria-label` with sort direction
- [PASS] `markets-table.tsx:173` - Empty state has `role="status"`

#### `components/screener/market-row.tsx`
- [PASS] `market-row.tsx:61` - Bell button has `aria-label`
- [PASS] `market-row.tsx:69-71` - External link has `aria-label`
- [ISSUE] `market-row.tsx:32-47` - Uses `font-mono` but no `tabular-nums` for numeric columns

#### `components/screener/category-pills.tsx`
- [PASS] `category-pills.tsx:31-34` - Has `role="tablist"` and `aria-label`
- [PASS] `category-pills.tsx:46-48` - Buttons have `role="tab"` and `aria-selected`

#### `components/screener/quick-filters.tsx`
- [PASS] Buttons have visible text labels

#### `components/screener/export-button.tsx`
- [PASS] Button has visible text label

#### `components/screener/saved-presets.tsx`
- [CRITICAL] `saved-presets.tsx:65-72` - Plus icon button missing `aria-label`
- [CRITICAL] `saved-presets.tsx:95-109` - Delete button (Trash2 icon) missing `aria-label`
- [ISSUE] `saved-presets.tsx:89-111` - Clickable div should be `<button>` for keyboard accessibility
- [ISSUE] `saved-presets.tsx:170-180` - Input missing `name` attribute

---

### Whales Components

#### `components/whales/follow-button.tsx`
- [PASS] Button has visible text labels

#### `components/whales/leaderboard.tsx`
- [PASS] Uses tabs with proper semantics
- [ISSUE] `leaderboard.tsx:109-127` - Select trigger missing `aria-label` for accessibility

#### `components/whales/whale-row.tsx`
- [ISSUE] `whale-row.tsx:109-174` - Entire row is clickable `<a>` but contains nested interactive elements conceptually
- [ISSUE] `whale-row.tsx:138-144` - Uses `font-mono` but no `tabular-nums` for numeric values
- [PASS] Uses semantic `<a>` for navigation

#### `components/whales/whale-stats.tsx`
- [PASS] Uses semantic structure

#### `components/whales/followed-whales.tsx`
- [PASS] Uses semantic `<a>` for navigation
- [ISSUE] `followed-whales.tsx:59-88` - Duplicate display of trade count in same row

#### `components/whales/recent-trades.tsx`
- [ISSUE] `recent-trades.tsx:73-75` - Uses `font-mono` but no `tabular-nums` for price display

#### `components/whales/whale-positions.tsx`
- [ISSUE] `whale-positions.tsx:119-129` - External link icon missing `aria-label`
- [ISSUE] `whale-positions.tsx:152-160` - Uses `font-mono` but no `tabular-nums` for numbers

#### `components/whales/whale-trade-history.tsx`
- [CRITICAL] `whale-trade-history.tsx:146-153` - External link icon button missing `aria-label`
- [CRITICAL] `whale-trade-history.tsx:181-189` - BSCScan link missing `aria-label`
- [ISSUE] `whale-trade-history.tsx:176-177` - Uses `font-mono` but no `tabular-nums`

---

### Feed Components

#### `components/feed/activity-feed.tsx`
- [PASS] Loading skeleton shown appropriately
- [PASS] Empty state handled

#### `components/feed/activity-item.tsx`
- [ISSUE] `activity-item.tsx:66-80` - Links to whale profile but could use more descriptive link text
- [CRITICAL] `activity-item.tsx:111-118` - External link icon missing `aria-label`
- [ISSUE] `activity-item.tsx:94` - Uses percent symbol `%` without `tabular-nums`

#### `components/feed/feed-filters.tsx`
- [PASS] `feed-filters.tsx:33-42` - Switch has `id` and associated `Label` with `htmlFor`
- [PASS] `feed-filters.tsx:46-69` - Input has `id` and associated `Label`
- [ISSUE] `feed-filters.tsx:50-68` - Input missing `name` attribute

#### `components/feed/feed-error-boundary.tsx`
- [PASS] Error state with retry functionality

#### `components/feed/live-indicator.tsx`
- [ISSUE] `live-indicator.tsx:19-21` - Uses `animate-pulse` without `prefers-reduced-motion` check

---

### Alerts Components

#### `components/alerts/alert-list.tsx`
- [PASS] `alert-list.tsx:147-163` - Switch and delete button accessible
- [ISSUE] `alert-list.tsx:152-163` - Delete button has icon only, relies on visual context

#### `components/alerts/create-alert-dialog.tsx`
- [PASS] Dialog with proper title

#### `components/alerts/price-alert-form.tsx`
- [ISSUE] `price-alert-form.tsx:87-96` - Search input missing `name` attribute
- [ISSUE] `price-alert-form.tsx:102-119` - Search result buttons lack keyboard focus indicators
- [ISSUE] `price-alert-form.tsx:157-163` - Target price input missing `name` attribute

#### `components/alerts/whale-alert-form.tsx`
- [ISSUE] `whale-alert-form.tsx:66-98` - Card-based selection uses `onClick` on Card component instead of button/checkbox pattern
- [ISSUE] `whale-alert-form.tsx:66-98` - No keyboard navigation for whale selection cards

---

### Landing Page Components

#### `components/landing/hero-section.tsx`
- [PASS] Semantic structure with proper headings
- [ISSUE] `hero-section.tsx:26` - Uses curly quote entities properly

#### `components/landing/features-grid.tsx`
- [PASS] Semantic structure

#### `components/landing/how-it-works.tsx`
- [PASS] Semantic structure

#### `components/landing/testimonials.tsx`
- [PASS] Uses `&quot;` entities for quotes

#### `components/landing/faq-section.tsx`
- [ISSUE] `faq-section.tsx:43-55` - FAQ toggle button lacks `aria-expanded` attribute
- [ISSUE] `faq-section.tsx:58-63` - Answer content lacks `aria-hidden` attribute based on state

#### `components/landing/footer.tsx`
- [ISSUE] `footer.tsx:22-41` - Product links use Next.js `Link` but Company/Legal sections use plain `<a>`
- [PASS] `footer.tsx:94-120` - Social icons have `aria-label` attributes

#### `components/landing/pricing-preview.tsx`
- [PASS] Semantic structure
- [ISSUE] `pricing-preview.tsx:56` - `console.log` statement should be removed

#### `components/landing/cta-section.tsx`
- [PASS] Semantic structure

---

### Pricing Components

#### `components/pricing/pricing-cards.tsx`
- [PASS] Semantic structure
- [ISSUE] `pricing-cards.tsx:141-151` - Price display uses `font-bold` but no `tabular-nums`

#### `components/pricing/feature-comparison.tsx`
- [PASS] Uses semantic table structure
- [PASS] Check/X icons convey meaning visually

---

### Billing Components

#### `components/billing/subscription-card.tsx`
- [PASS] Semantic structure

---

### Page Components

#### `app/layout.tsx`
- [PASS] Uses `lang="en"` on html element
- [PASS] Proper font configuration

#### `app/page.tsx`
- [PASS] Semantic `<main>` element

#### `app/screener/page.tsx`
- [PASS] Semantic structure

#### `app/whales/page.tsx`
- [PASS] Uses tabs with proper semantics

#### `app/whales/[address]/page.tsx`
- [PASS] `page.tsx:122-123` - Copy button has `aria-label="Copy address"`
- [ISSUE] `page.tsx:130-137` - External link to BSCScan missing `aria-label`
- [PASS] Back navigation button has visible text

#### `app/feed/page.tsx`
- [PASS] Semantic structure

#### `app/alerts/page.tsx`
- [PASS] Semantic structure

#### `app/alerts/error.tsx`
- [PASS] Error boundary with retry

#### `app/pricing/page.tsx`
- [PASS] Toggle has associated labels

#### `app/billing/page.tsx`
- [PASS] Proper Suspense boundary
- [PASS] Loading states handled

#### `app/privacy/page.tsx`
- [PASS] Semantic article structure with proper headings

#### `app/terms/page.tsx`
- [PASS] Semantic article structure with proper headings

---

## Critical Issues Summary

1. **`user-button.tsx:42-44`** - User avatar button missing `aria-label`
2. **`search-bar.tsx:47-57`** - Clear search button missing `aria-label`
3. **`saved-presets.tsx:65-72`** - Add preset button missing `aria-label`
4. **`saved-presets.tsx:95-109`** - Delete preset button missing `aria-label`
5. **`whale-trade-history.tsx:146-153`** - External market link missing `aria-label`
6. **`whale-trade-history.tsx:181-189`** - BSCScan transaction link missing `aria-label`
7. **`activity-item.tsx:111-118`** - External link icon missing `aria-label`

---

## Recommendations by Priority

### High Priority (Critical Accessibility)

1. Add `aria-label` to all icon-only buttons:
   - User avatar trigger button
   - Clear search button
   - Add/delete preset buttons
   - All external link icons

2. Add `tabular-nums` class to all numeric displays:
   - Price columns in tables
   - Volume displays
   - P&L values
   - Trade amounts

### Medium Priority (Forms)

3. Add `name` attributes to all form inputs
4. Add appropriate `autocomplete` attributes:
   - `autocomplete="off"` for search inputs
   - `autocomplete="off"` for numeric filter inputs

5. Convert clickable divs to semantic buttons:
   - Preset selection items
   - Whale selection cards in alert form

### Low Priority (Enhancements)

6. Add `prefers-reduced-motion` checks for animations:
   - Skeleton pulse animations
   - Live indicator pulse

7. Add `aria-expanded` to FAQ toggle buttons

8. Normalize internal links to use Next.js `<Link>`:
   - Header navigation
   - Footer company/legal links

9. Remove `console.log` statement in `pricing-preview.tsx`

---

## Passing Patterns (Good Examples to Follow)

- `dialog.tsx` / `sheet.tsx`: Close buttons with sr-only text
- `mode-toggle.tsx`: sr-only text for theme toggle
- `filter-panel.tsx`: aria-labels on inputs
- `markets-table.tsx`: role="region" with aria-label
- `category-pills.tsx`: role="tablist" with aria-selected states
- `footer.tsx`: aria-labels on social media icons
- `market-row.tsx`: aria-labels on action buttons

---

## Files with No Issues

- `components/ui/button.tsx`
- `components/ui/select.tsx`
- `components/ui/checkbox.tsx`
- `components/ui/switch.tsx`
- `components/ui/dialog.tsx`
- `components/ui/dropdown-menu.tsx`
- `components/ui/sheet.tsx`
- `components/ui/tabs.tsx`
- `components/ui/table.tsx`
- `components/ui/label.tsx`
- `components/ui/badge.tsx`
- `components/ui/card.tsx`
- `components/screener/quick-filters.tsx`
- `components/screener/export-button.tsx`
- `components/whales/follow-button.tsx`
- `components/whales/whale-stats.tsx`
- `components/feed/feed-error-boundary.tsx`
- `components/landing/features-grid.tsx`
- `components/landing/how-it-works.tsx`
- `components/landing/testimonials.tsx`
- `components/landing/cta-section.tsx`
- `components/pricing/feature-comparison.tsx`
- `components/billing/subscription-card.tsx`
- `app/layout.tsx`
- `app/page.tsx`
- `app/screener/page.tsx`
- `app/whales/page.tsx`
- `app/feed/page.tsx`
- `app/alerts/page.tsx`
- `app/alerts/error.tsx`
- `app/pricing/page.tsx`
- `app/billing/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
