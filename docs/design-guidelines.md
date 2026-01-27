# OpinionScope Design Guidelines

## Design Philosophy

**"Bloomberg Terminal meets Linear"** - Professional data density with modern SaaS aesthetics.

**Core Principles:**
1. **Data First** - Numbers, percentages, and metrics take visual priority
2. **Scanability** - Users should extract insights in seconds, not minutes
3. **Real-time Feedback** - Every change feels instant and responsive
4. **Progressive Disclosure** - Show tier-locked features with clear upgrade paths
5. **Accessibility** - WCAG 2.1 AA minimum; avoid red/green only for status

---

## Color System

### Emerald Analytics Palette

Professional analytics color scheme with emerald brand identity.

### Dark Theme (Primary)

```css
/* Background Layers - Deep emerald-tinted darks */
--bg-base: #0f1412;        /* Emerald-tinted black */
--bg-elevated: #161d1a;    /* Cards, panels */
--bg-surface: #1e2724;     /* Inputs, hover states */
--bg-overlay: #2a3632;     /* Dropdowns, modals */

/* Text Hierarchy */
--text-primary: #ecf5f1;   /* Soft white with emerald tint */
--text-secondary: #94a69e; /* Muted emerald-gray */
--text-muted: #6b7d75;     /* Labels, captions */
--text-disabled: #4a5852;  /* Disabled states */

/* Brand Accent - Emerald */
--accent-primary: #10b981; /* emerald-500 - CTAs, links */
--accent-hover: #34d399;   /* emerald-400 - Hover states */
--accent-muted: #065f46;   /* emerald-800 - Subtle accents */

/* Semantic Colors */
--success: #22c55e;        /* green-500 - Positive/gains */
--success-muted: #166534;  /* green-800 - Success backgrounds */
--danger: #ef4444;         /* red-500 - Negative/losses */
--danger-muted: #991b1b;   /* red-800 - Danger backgrounds */
--warning: #f59e0b;        /* amber-500 - Alerts */
--info: #06b6d4;           /* cyan-500 - Information */

/* Analytics Chart Colors (CVD-friendly, emerald-anchored) */
--chart-1: #10b981;        /* emerald-500 - Primary */
--chart-2: #14b8a6;        /* teal-500 */
--chart-3: #0ea5e9;        /* sky-500 */
--chart-4: #a78bfa;        /* violet-400 */
--chart-5: #84cc16;        /* lime-500 */

/* Borders */
--border-subtle: #1e2724;
--border-default: #2a3632;
--border-strong: #3a4a44;
```

### Light Theme

```css
/* Background Layers */
--bg-base: #f8faf9;        /* Soft emerald-tinted white */
--bg-elevated: #ffffff;    /* Cards */
--bg-surface: #ecf5f1;     /* Inputs */
--text-primary: #0f1412;   /* Near-black with emerald tint */
--text-secondary: #4a5852; /* Muted for body */

/* Brand Accent - Emerald */
--accent-primary: #059669; /* emerald-600 - Slightly darker for light bg */
--accent-hover: #10b981;   /* emerald-500 */
```

---

## Typography

### Font Stack

```css
/* Primary - UI Text */
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;

/* Monospace - Numbers, Code, Prices */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

**Google Fonts Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### Type Scale

| Name | Size | Weight | Line Height | Use Case |
|------|------|--------|-------------|----------|
| display | 48px | 700 | 1.1 | Hero headlines |
| h1 | 32px | 700 | 1.2 | Page titles |
| h2 | 24px | 600 | 1.3 | Section headers |
| h3 | 20px | 600 | 1.4 | Card titles |
| h4 | 16px | 600 | 1.5 | Subsections |
| body | 14px | 400 | 1.6 | Default text |
| small | 12px | 400 | 1.5 | Labels, captions |
| tiny | 11px | 500 | 1.4 | Badges, tags |

### Number Display Rules

- **Prices/Percentages:** Always use `font-mono`, `tabular-nums`
- **Large Numbers:** Format with commas (1,234,567)
- **Percentages:** Always include sign (+12.5% / -8.3%)
- **Currency:** Use $ prefix, 2 decimal places for cents
- **Win Rate:** Display as percentage with 1 decimal (67.2%)

---

## Spacing System

Base unit: `4px`

| Token | Value | Use Case |
|-------|-------|----------|
| space-1 | 4px | Tight spacing, icon gaps |
| space-2 | 8px | Inline elements |
| space-3 | 12px | Form inputs, small cards |
| space-4 | 16px | Standard padding |
| space-5 | 20px | Section gaps |
| space-6 | 24px | Card padding |
| space-8 | 32px | Large gaps |
| space-10 | 40px | Section separators |
| space-12 | 48px | Page margins |
| space-16 | 64px | Hero spacing |

---

## Grid System

**Container Widths:**
- `max-w-screen-sm`: 640px
- `max-w-screen-md`: 768px
- `max-w-screen-lg`: 1024px
- `max-w-screen-xl`: 1280px
- `max-w-screen-2xl`: 1536px

**Responsive Breakpoints:**
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Wide screens */
```

---

## Component Patterns

### Data Tables

```html
<!-- Table Structure -->
<table class="w-full text-sm">
  <thead class="text-xs text-muted uppercase bg-elevated border-b border-subtle">
    <tr>
      <th class="px-4 py-3 text-left">Market</th>
      <th class="px-4 py-3 text-right font-mono">Price</th>
      <th class="px-4 py-3 text-right font-mono">24h</th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-b border-subtle hover:bg-surface transition-colors">
      <td class="px-4 py-3">Market Title</td>
      <td class="px-4 py-3 text-right font-mono">$0.42</td>
      <td class="px-4 py-3 text-right font-mono text-success">+5.2%</td>
    </tr>
  </tbody>
</table>
```

### Cards

```html
<div class="bg-elevated rounded-lg border border-subtle p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold">Card Title</h3>
    <span class="text-muted text-sm">Subtitle</span>
  </div>
  <!-- Content -->
</div>
```

### Tier Badges

```html
<!-- Free -->
<span class="px-2 py-1 text-xs font-medium bg-zinc-700 text-zinc-300 rounded">Free</span>

<!-- Pro -->
<span class="px-2 py-1 text-xs font-medium bg-blue-900 text-blue-300 rounded">Pro</span>

<!-- Pro+ -->
<span class="px-2 py-1 text-xs font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded">Pro+</span>
```

### Locked Feature Indicator

```html
<div class="relative">
  <div class="blur-sm pointer-events-none"><!-- Locked content --></div>
  <div class="absolute inset-0 flex items-center justify-center bg-base/60">
    <div class="flex items-center gap-2 text-muted">
      <svg class="w-4 h-4"><!-- Lock icon --></svg>
      <span class="text-sm">Upgrade to Pro</span>
    </div>
  </div>
</div>
```

### Price Change Indicators

```html
<!-- Positive -->
<span class="font-mono text-success">+12.5%</span>

<!-- Negative -->
<span class="font-mono text-danger">-8.3%</span>

<!-- Neutral -->
<span class="font-mono text-muted">0.0%</span>
```

---

## Animation Guidelines

### Transitions

```css
/* Default transition */
transition: all 150ms ease;

/* Hover states */
transition: background-color 150ms ease, border-color 150ms ease;

/* Content changes */
transition: opacity 200ms ease;
```

### Loading States

- **Skeleton:** Use `animate-pulse` with `bg-surface` color
- **Spinner:** 16px for inline, 24px for sections, 32px for pages
- **Real-time data:** Subtle `animate-pulse` on update, 500ms duration

### Micro-interactions

- **Button press:** `scale-95` on active
- **Card hover:** `border-color` transition, subtle `shadow-lg`
- **Row select:** `bg-surface` transition
- **New item:** Slide in from top with `opacity` fade

---

## Iconography

**Library:** Lucide Icons (https://lucide.dev)

**Sizes:**
- `16px` - Inline, table actions
- `20px` - Buttons, navigation
- `24px` - Feature icons, empty states
- `32px` - Large callouts

**Common Icons:**
- Whale/Fish: `fish` icon for whale tracker
- Alert: `bell` for notifications
- Lock: `lock` for tier-gated features
- Chart: `trending-up`, `trending-down`, `minus` for price changes
- Filter: `sliders-horizontal` for screener
- Export: `download` for CSV
- External: `external-link` for market links

---

## Accessibility

### Color Contrast

- Text on backgrounds: minimum 4.5:1 ratio
- Large text (18px+): minimum 3:1 ratio
- Interactive elements: 3:1 against adjacent colors

### Focus States

```css
.focus-ring {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```

### Screen Reader

- Use `sr-only` class for visually hidden labels
- Include `aria-label` on icon-only buttons
- Use semantic HTML (`<table>`, `<nav>`, `<main>`)

---

## Responsive Behavior

### Mobile (< 768px)

- Stack horizontal layouts vertically
- Hide secondary columns in tables
- Use bottom sheet for filters
- Collapsible navigation to hamburger
- Touch targets: minimum 44x44px

### Tablet (768px - 1024px)

- 2-column layouts where applicable
- Sidebar collapses to icons
- Tables show 4-5 columns max

### Desktop (> 1024px)

- Full sidebar navigation
- Multi-panel layouts
- Data tables with all columns
- Hover states active

---

## Tier-Gated UI Patterns

### Soft Lock (Teaser)

Show preview with blur overlay and upgrade CTA.

### Hard Lock (Feature Gate)

Replace content with upgrade prompt entirely.

### Usage Limit

Show counter (e.g., "2/3 alerts used") with upgrade link when approaching limit.

### Time Delay

Show "Available in Pro tier" badge with countdown for delayed features.
