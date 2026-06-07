# JachaiX Design System & UI/UX Improvements

**Version:** 1.0  
**Date:** 2026-06-07  
**Purpose:** Beautiful, modern design enhancements for JachaiX built with Next.js + Tailwind CSS  
**Target Implementation:** Stitch.AI or equivalent visual design system

---

## 🎨 Design Philosophy

**Goal:** Create a **trust-centric, accessible, beautiful** interface that feels:
- **Authoritative** — inspires confidence in fact-checking results
- **Inclusive** — works seamlessly for Bangla, English, and Banglish users
- **Fast** — minimal visual clutter, high signal-to-noise ratio
- **Modern** — contemporary UI patterns with subtle animations
- **Regional** — respectful of South Asian design sensibilities

---

## 📐 Color Palette

### Primary Colors
| Color | Hex | Use |
|---|---|---|
| **Trust Blue** | `#0F5FBC` | Primary CTA, verdict containers, headers |
| **Success Green** | `#10A760` | True/Verified verdict label |
| **Warning Amber** | `#F59E0B` | Uncertain/Mixed verdict label |
| **Danger Red** | `#EF4444` | False/Misleading verdict label |
| **Info Cyan** | `#06B6D4` | Information badges, secondary CTAs |

### Neutral Colors
| Color | Hex | Use |
|---|---|---|
| **Dark Slate** | `#0F172A` | Text, headers (primary) |
| **Gray 600** | `#4B5563` | Body text, secondary content |
| **Gray 200** | `#E5E7EB` | Borders, dividers |
| **Off White** | `#F9FAFB` | Backgrounds, cards |
| **White** | `#FFFFFF` | Card backgrounds, content areas |

### Semantic Variants
```
Verdict States:
  - TRUE     → Success Green (#10A760) + Subtle green glow
  - FALSE    → Danger Red (#EF4444) + Subtle red glow
  - MIXED    → Warning Amber (#F59E0B) + Subtle orange glow
  - UNKNOWN  → Gray 400 (#9CA3AF) + No glow
```

---

## 🔤 Typography System

### Font Stack (Recommended)
```css
/* Sans Serif (UI, body text) */
font-family: 'Inter', 'Segoe UI', 'Noto Sans Bengali', system-ui, sans-serif;

/* For Bengali script enhancement */
font-family: 'Noto Sans Bengali', 'Segoe UI', system-ui, sans-serif;

/* Monospace (Code, timestamps, IDs) */
font-family: 'Fira Code', 'JetBrains Mono', monospace;
```

### Type Scale
| Role | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|
| H1 (Page Title) | 36px | 700 | 1.2 | -0.5px |
| H2 (Section Title) | 28px | 700 | 1.3 | -0.25px |
| H3 (Subsection) | 20px | 600 | 1.4 | 0px |
| Body Large | 16px | 400 | 1.6 | 0px |
| Body Regular | 14px | 400 | 1.6 | 0px |
| Body Small | 12px | 400 | 1.5 | 0.25px |
| Caption | 11px | 500 | 1.4 | 0.5px |

---

## 📦 Component Library

### 1. **Verdict Card** (Core)
**Purpose:** Display final fact-check verdict prominently

```
┌─────────────────────────────────────────┐
│ ✓ VERDICT: TRUE                         │  ← Verdict badge with icon
│                                         │
│ Confidence: 94%  │ Trust: Very High     │  ← Metadata row
│                                         │
│ This claim aligns with verified news   │  ← Explanation (2-3 lines)
│ sources from 2026.                      │
│                                         │
│ [View Sources]  [Share]  [Flag Issue]  │  ← Actions
└─────────────────────────────────────────┘
```

**Styling:**
- Background: White with colored left border (4px)
- Border color: Green/Red/Amber depending on verdict
- Subtle shadow: `0 2px 8px rgba(0,0,0,0.08)`
- Rounded corners: `12px`
- Padding: `24px`
- Icon: 20px, colored, centered vertically with badge

### 2. **Claim Input Card** (Scan Page)
**Purpose:** Accept text, image, or PDF claims with beautiful UX

```
┌─────────────────────────────────────────┐
│ 📋 Check a Claim                        │
│                                         │
│ ┌─ TAB: Text  Image  PDF  Screenshot ─┐ │
│ │                                     │ │
│ │ Enter your claim (Bangla, English  │ │ ← Multilingual placeholder
│ │ or Banglish)                       │ │
│ │                                    │ │
│ │  _________________________________  │ │
│ │ |                                 | │ │
│ │ |  Paste or type claim here...    | │ │ ← Textarea with live char count
│ │ |                                 | │ │
│ │ │_________________________________│ │ │
│ │                                     │ │
│ │ 🌐 Language: [Auto-detect ▼]       │ │ ← Language selector
│ │                                     │ │
│ │                [Check Claim →]      │ │ ← Primary CTA
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Styling:**
- Tab styling: Underline active indicator (3px, Trust Blue)
- Textarea: Subtle focus ring (2px, Trust Blue, blurred)
- CTA button: Full gradient or solid Trust Blue, white text, rounded `8px`
- Character count: Gray 400, right-aligned in textarea
- Language selector: Minimal dropdown, no default styling

### 3. **Evidence Source Card**
**Purpose:** Display retrieved evidence with transparency and credibility

```
┌──────────────────────────────────────────┐
│ 📰 BBC Bangla  ★★★★★ (Highly Trusted)  │
│ https://bbc.com/bengali/news/...       │
│                                         │
│ "Minister confirms new education       │
│  policy implementation date June 15"    │  ← Snippet (2-3 lines)
│                                         │
│ Published: Jun 5, 2026  │  Snippet ID   │
│ Relevance: 94%         │  2a1b3c...    │  ← Metadata row
│                                         │
│ [Read Full Article →]                  │
└──────────────────────────────────────────┘
```

**Styling:**
- Top left: Source logo (24x24) or initials avatar
- Trusted badge: Inline, with star icon and trust label
- Snippet: Italicized, gray color, line-clamp: 3
- Border: Light gray, left border colored by trust level
- Hover: Subtle lift (shadow increase), cursor pointer

### 4. **Confidence Gauge**
**Purpose:** Visual representation of confidence score

```
Confidence: 89%

┌────────────────────────────────────┐
│████████████████████░░░░░░░░░░░░░│
└────────────────────────────────────┘
           ↑
        89% mark
```

**Styling:**
- Background: Light gray `#E5E7EB`
- Fill: Gradient from Success Green to Amber based on percentage
- Height: `8px`
- Rounded: Full (pill shape)
- Underneath: `{confidence}%` + trust label (`Very High`, `Medium`, `Low`)

### 5. **Admin Moderation Card**
**Purpose:** Quick human review queue for edge cases

```
┌─────────────────────────────────────┐
│ 🚨 PENDING REVIEW                   │  ← Status badge
│ ID: claim_2026_0605_001             │
│                                     │
│ Claim: "Water shortages in Dhaka"  │  ← Truncated claim
│ Verdict: MIXED (64% confidence)    │  ← Weak verdict
│                                     │
│ Sources Found: 3  │  Disagreement: 2│  ← Quick metrics
│                                     │
│ [Review]  [Publish]  [Discard]     │  ← Quick actions
└─────────────────────────────────────┘
```

**Styling:**
- Yellow warning background (Amber at 10% opacity)
- Inline badges for metadata
- Icons: 16px, inline with text
- Action buttons: Small pill buttons, horizontal layout

---

## 🖼️ Page Layouts

### **1. Scan Page (Main Entry)**
```
┌───────────────────────────────────────────────────────────────┐
│                    JACHAIX FACT-CHECK                          │  ← Hero
│              Verify Claims. Build Trust.                       │
└───────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ [Claim Input Card - Tabbed]                                     │  ← Primary
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 📊 Quick Stats                                                  │
│ • 12,450 claims checked  • 94% accuracy  • 15 languages        │
│                                                                 │
│ 🔥 Trending Claims (Carousel)                                  │
│ [Card] [Card] [Card] [Card] →                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🤝 How It Works                                                 │
│                                                                 │
│  1️⃣  Submit Claim   2️⃣  AI Analysis   3️⃣  Evidence   4️⃣  Verdict
│                                                                 │
│  [Description]      [Description]     [Description] [Desc...]  │
└─────────────────────────────────────────────────────────────────┘
```

### **2. Results Page**
```
┌────────────────────────────────────────────────┐
│  ← Back to Scan                                │  ← Navigation
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Original Claim:                                │  ← Claim context
│ "Prime Minister visits India on June 12"       │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ [VERDICT CARD - Large, centered]               │  ← Main result
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ 📈 Analysis Breakdown                          │  ← Tabs
│  Results  Sources  Details  Audit Log          │
│                                                 │
│ ✓ Matches verified sources (3/3 agree)         │  ← Findings
│ • Source 1: BBC Bangla (94% match)             │
│ • Source 2: Reuters (91% match)                │
│ • Source 3: AP News (88% match)                │
│                                                 │
│ ⚠ Timeline shift: Claim says "June 12" but     │
│   verified sources say "June 15"               │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ [Share Verdict] [Flag Issue] [Request Review]  │  ← Actions
└────────────────────────────────────────────────┘
```

### **3. Facts Hub (Public Directory)**
```
┌────────────────────────────────────────────────┐
│ 📚 Fact-Check Hub                              │  ← Title
│ Curated, published fact-checks                 │
│                                                 │
│ Search: [Search by keyword...]                 │  ← Search
│                                                 │
│ Filters: ✓ Verified  ✓ Mixed  ✓ False         │  ← Filter pills
│          Language: [Bangla ▼] Date: [Recent ▼]│
└────────────────────────────────────────────────┘

[GRID LAYOUT - 3 columns]
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Featured      │  │ Fact Card     │  │ Fact Card     │
│ Fact Card     │  │               │  │               │
│ (Larger)      │  │ Title         │  │ Title         │
└──────────────┘  └──────────────┘  └──────────────┘
```

### **4. Admin Dashboard**
```
┌────────────────────────────────────────────────┐
│ 📊 Admin Dashboard                             │  ← Title
│ System Health · Moderation Queue · Settings    │  ← Tabs
└────────────────────────────────────────────────┘

[TOP METRICS ROW]
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ✓ Processed  │  │ 🚨 Pending   │  │ ⚙️ Services  │
│ 12,450       │  │ 23 in queue  │  │ 7/7 online   │
└──────────────┘  └──────────────┘  └──────────────┘

[MODERATION QUEUE - List of cards]
┌────────────────────────────────────────────────┐
│ [Moderation Card] [Moderation Card] ...        │
└────────────────────────────────────────────────┘

[ANALYTICS - Charts]
┌────────────────────────────────────────────────┐
│ Claims per day (line chart)  │  Verdicts breakdown (pie) │
└────────────────────────────────────────────────┘
```

---

## 🎬 Animations & Interactions

### Loading States
- **Skeleton Loading**: Pulsing gray placeholders matching card shape (opacity 0.6 → 0.8)
- **Progress Indicator**: Animated progress bar (0% → 100%) with phase labels:
  ```
  [Processing] → [Retrieving Evidence] → [Analyzing] → [Generating Verdict]
  ```
- **Loading Spinner**: Circular spinner with rotating gradient (Trust Blue → Cyan)

### Transitions
| Element | Animation | Duration | Easing |
|---|---|---|---|
| Card hover | Lift + shadow increase | 200ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Tab switch | Fade + slide | 150ms | `ease-out` |
| Verdict reveal | Slide-up + fade-in | 400ms | `ease-out` |
| Confidence gauge fill | Linear fill | 800ms | `linear` |
| Source card expand | Height expansion | 250ms | `ease-out` |

### Interactive Feedback
- **Buttons**: 
  - Default: `Trust Blue`
  - Hover: Darker shade (10% darker) + lift (2px)
  - Active: Shadow inset + slight shrink
  - Disabled: Gray 300, cursor not-allowed
- **Inputs**:
  - Focus: 2px border in Trust Blue + subtle glow
  - Error: 2px border in Danger Red
  - Success: 2px border in Success Green
- **Links**: Underline on hover, color to Trust Blue

---

## 📱 Responsive Design

### Breakpoints
| Breakpoint | Width | Use |
|---|---|---|
| Mobile | 320px - 640px | Small phones, compact view |
| Tablet | 641px - 1024px | iPad, medium devices |
| Desktop | 1025px+ | Full features, multi-column |

### Mobile Optimizations
- **Scan Card**: Single column, full-width inputs
- **Verdict Cards**: Stack vertically, increase padding for touch targets (48px min-height)
- **Source Cards**: Hide non-essential metadata, show on expand
- **Navigation**: Hamburger menu, bottom tab bar on mobile
- **Typography**: Slightly larger (16px base) for readability

### Tablet Optimizations
- **Layout**: 2-column where appropriate
- **Cards**: Medium padding, balanced spacing
- **Actions**: Button groups wrap if needed

---

## ♿ Accessibility

### Color Contrast
- **WCAG AAA Compliance** for all text on colored backgrounds
- Minimum contrast ratio: **7:1** for normal text, **4.5:1** for large text
- Verdict labels always include icon + text (not color-only)

### Interactive Elements
- **Focus Indicators**: Always visible (2px outline, Trust Blue)
- **Touch Targets**: Minimum 48×48px for buttons/links
- **Keyboard Navigation**: Full support (Tab, Arrow keys, Enter)
- **ARIA Labels**: All icons, buttons, and dynamic content labeled
- **Skip Links**: "Skip to main content" on every page

### Multilingual Support
- **Direction**: LTR for English, Banglish; RTL support for pure Bangla components
- **Font Stacks**: Include Noto Sans Bengali for proper rendering
- **Hyphenation**: Disabled for Bangla to avoid breaking words
- **Text Scaling**: Works up to 200% zoom without layout breaks

---

## 🎯 Component States

### Verdict Card States
```
DEFAULT    → Showing verified verdict with full details
LOADING    → Skeleton state during analysis (animated)
ERROR      → Shows error message with retry option
EMPTY      → "No claim found" state
EXPIRED    → Shows timestamp + "Re-check this claim" button
REPORTED   → Shows "Flagged for review" badge + info
```

### Input States
```
DEFAULT    → Empty textarea with placeholder
FOCUSED    → Blue border + expanded helper text
FILLED     → Content visible, clear button appears
LOADING    → Input disabled, processing spinner
ERROR      → Red border + error message below
SUCCESS    → Green checkmark, hint text
DISABLED   → Grayed out, cursor not-allowed
```

---

## 🌍 Language & Localization

### UI Text Strategy
- **Primary UI**: English + Bangla side-by-side (toggle)
- **Banglish Support**: Auto-detect and display transliterated labels
- **RTL Layout**: Optional RTL variant for pure Bangla interface
- **Date Formatting**: ISO 8601 (2026-06-05) + localized (৫ জুন, ২০২৬)
- **Numbers**: ASCII digits in English context, Bengali numerals (০-৯) in Bangla context

---

## 📚 Implementation Quick Start

### Tailwind CSS Configuration
```javascript
// tailwind.config.ts
export default {
  theme: {
    colors: {
      'trust-blue': '#0F5FBC',
      'success-green': '#10A760',
      'warning-amber': '#F59E0B',
      'danger-red': '#EF4444',
      'info-cyan': '#06B6D4',
      'dark-slate': '#0F172A',
      'gray-600': '#4B5563',
      'gray-200': '#E5E7EB',
      'off-white': '#F9FAFB',
    },
    borderRadius: {
      'sm': '8px',
      'md': '12px',
      'lg': '16px',
      'full': '9999px',
    },
    fontSize: {
      'h1': ['36px', { lineHeight: '1.2', letterSpacing: '-0.5px' }],
      'h2': ['28px', { lineHeight: '1.3', letterSpacing: '-0.25px' }],
      'h3': ['20px', { lineHeight: '1.4', letterSpacing: '0px' }],
      'body-lg': ['16px', { lineHeight: '1.6', letterSpacing: '0px' }],
      'body': ['14px', { lineHeight: '1.6', letterSpacing: '0px' }],
      'body-sm': ['12px', { lineHeight: '1.5', letterSpacing: '0.25px' }],
      'caption': ['11px', { lineHeight: '1.4', letterSpacing: '0.5px' }],
    },
  },
};
```

### React Component Example
```typescript
// components/VerdictCard.tsx
import React from 'react';

type VerdictType = 'TRUE' | 'FALSE' | 'MIXED' | 'UNKNOWN';

interface VerdictCardProps {
  verdict: VerdictType;
  confidence: number;
  explanation: string;
  sources: number;
}

const verdictStyles: Record<VerdictType, { bg: string; text: string; icon: string }> = {
  TRUE: { bg: 'bg-green-50', text: 'text-green-800', icon: '✓' },
  FALSE: { bg: 'bg-red-50', text: 'text-red-800', icon: '✕' },
  MIXED: { bg: 'bg-amber-50', text: 'text-amber-800', icon: '◐' },
  UNKNOWN: { bg: 'bg-gray-50', text: 'text-gray-800', icon: '?' },
};

export const VerdictCard: React.FC<VerdictCardProps> = ({
  verdict,
  confidence,
  explanation,
  sources,
}) => {
  const style = verdictStyles[verdict];

  return (
    <div className={`${style.bg} border-l-4 border-trust-blue rounded-md p-6 shadow-md`}>
      <div className="flex items-center gap-3 mb-4">
        <span className={`${style.text} text-2xl`}>{style.icon}</span>
        <h2 className={`${style.text} text-h2`}>VERDICT: {verdict}</h2>
      </div>
      
      <div className="flex gap-4 mb-4 text-body-sm">
        <span>Confidence: {confidence}%</span>
        <span>Sources: {sources}</span>
      </div>
      
      <p className="text-body text-gray-600 mb-4">{explanation}</p>
      
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-trust-blue text-white rounded-md hover:bg-blue-700">
          View Sources
        </button>
        <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
          Share
        </button>
      </div>
    </div>
  );
};
```

---

## 🔄 Design System Maintenance

### Design Tokens (Auto-sync)
- All colors, fonts, spacing defined in `tailwind.config.ts`
- Component library components reference tokens only
- Breaking changes: Version bump + migration guide

### Component Variants
Each component should support:
- **Size**: `sm`, `md`, `lg` (where applicable)
- **State**: `default`, `loading`, `error`, `disabled`, `active`
- **Density**: `compact`, `default`, `comfortable`

### Testing Checklist
- [ ] Visual regression tests (Chromatic or Percy)
- [ ] Accessibility audit (axe DevTools, WAVE)
- [ ] Mobile responsiveness (320px, 768px, 1440px breakpoints)
- [ ] Dark mode support (optional future enhancement)
- [ ] Performance: LCP < 2.5s, CLS < 0.1

---

## 🚀 Stitch.AI Integration Workflow

1. **Export Design Tokens** → Copy Tailwind config into Stitch
2. **Component Library** → Design each component in Stitch canvas
3. **Variant Grid** → Create size/state variants for each
4. **Design QA** → Cross-check with accessibility & responsive guidelines
5. **Code Generation** → Use Stitch's React code export
6. **Manual Review** → Polish animations, adjust spacing, integrate Tailwind
7. **Storybook** → Document each component with examples
8. **Developer Handoff** → Link to Figma/Stitch, provide design specs

---

## 📋 Priority Implementation Order

### Phase 1 (MVP)
- [ ] Verdict Card component
- [ ] Claim Input Card (text tab)
- [ ] Confidence Gauge
- [ ] Scan page layout
- [ ] Color palette + typography

### Phase 2 (Core)
- [ ] Image/PDF upload UI
- [ ] Evidence Source Card
- [ ] Results page layout
- [ ] Loading states
- [ ] Mobile responsiveness

### Phase 3 (Polish)
- [ ] Facts Hub layout
- [ ] Admin dashboard
- [ ] Animations & transitions
- [ ] Dark mode (optional)
- [ ] Storybook documentation

### Phase 4 (Advanced)
- [ ] RTL support for pure Bangla
- [ ] Micro-interactions & easter eggs
- [ ] Accessibility audit & remediation
- [ ] Performance optimization

---

## 📞 Questions & Clarifications

**For Stitch.AI or design team:**
1. Should we create a dark mode variant?
2. Preferred primary accent: Trust Blue (#0F5FBC) or alternative?
3. Animation preferences: Subtle & minimal or more playful?
4. Is a custom icon set needed, or use existing icon libraries (Heroicons, Feather)?
5. Multilingual: Full RTL support or just translate UI text?

---

**End of Design Document**
