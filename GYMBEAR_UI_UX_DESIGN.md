# GymBear — UI/UX Design System

> Complete reference for GymBear's visual language, interaction patterns, component library, animation system, and UX flows. Every design decision documented with the reasoning behind it.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Glassmorphism & Surface System](#5-glassmorphism--surface-system)
6. [Glow & Atmosphere Effects](#6-glow--atmosphere-effects)
7. [Animation System](#7-animation-system)
8. [Component Library](#8-component-library)
9. [Page-by-Page UX Flows](#9-page-by-page-ux-flows)
10. [Navigation System](#10-navigation-system)
11. [Bruno — The Animated Mascot](#11-bruno--the-animated-mascot)
12. [Theme System](#12-theme-system)
13. [Mobile & PWA UX](#13-mobile--pwa-ux)
14. [Micro-interactions & Haptics](#14-micro-interactions--haptics)
15. [Accessibility Considerations](#15-accessibility-considerations)

---

## 1. Design Philosophy

GymBear's design language is built on three core pillars:

### Dark Athletic Aesthetic
The gym environment is inherently dark, focused, and intense. GymBear mirrors this — near-black backgrounds, high-contrast accent colours, and glowing UI elements that feel like indicators on a machine. Nothing is pastel, soft, or "app-like" in the generic sense.

### Emotional Feedback Loop
Every meaningful user action must produce a visible, physical reaction — a glow, a bounce, a haptic pulse. The UI is a coach, not a clipboard. Bruno embodies this: he reacts to every milestone, rest period, and achievement. The app feels alive.

### Minimum Friction Principle
In a gym, the user has a barbell in their hands and sweat in their eyes. Every interaction is designed for **one-tap execution with zero cognitive load**. This drives every layout decision: primary CTA is always thumb-reachable, stepper arrows are large enough to tap without looking, and the rest timer appears without user action.

---

## 2. Color System

### Base Palette (Tailwind Theme Extension)

The full background depth stack creates a sense of three-dimensional space:

| Token | Hex | Role |
|---|---|---|
| `bear-void` | `#090912` | App root background — the deepest layer |
| `bear-abyss` | `#0D0D1A` | Second-layer background for content areas |
| `bear-deep` | `#12122A` | Inset panels and dropdown backgrounds |
| `bear-surface` | `#1A1A3E` | Card and panel surfaces |
| `bear-rim` | `#252560` | Borders, dividers, faint outlines |
| `bear-muted` | `#3A3A7A` | Scrollbars, inactive states, placeholders |
| `bear-text` | `#C8C8F0` | Body text, secondary labels |
| `bear-bright` | `#E8E8FF` | Headings, high-emphasis text |

This eight-step depth stack ensures that every UI layer has a distinct visual z-level without relying on drop shadows alone.

### Accent Palette

| Token | Hex | Glow Color | Semantic Role |
|---|---|---|---|
| `ember` | `#FF3D5A` | `rgba(255,61,90,0.35)` | Danger, PR achievements, primary CTAs, active nav |
| `plasma` | `#7B5EFF` | `rgba(123,94,255,0.35)` | AI features, coach mode, planning tools |
| `neon` | `#00F5C4` | `rgba(0,245,196,0.25)` | Success, completion, positive form coach score |
| `gold` | `#FFD700` | `rgba(255,215,0,0.45)` | Bruno XP, achievements, personal records |
| `iron` | Scale `#F0F0FF` → `#3838A8` | — | Neutral UI elements, iron/steel metaphor |

### Why These Specific Colours
- **Ember** (`#FF3D5A`) — high-urgency red with a slight magenta shift. Pure red `#FF0000` is too aggressive and bleeds on OLED. This variant is energetic without being alarming.
- **Plasma** (`#7B5EFF`) — AI/tech purple. Signals "this is AI-powered" without being corporate blue.
- **Neon** (`#00F5C4`) — teal-green rather than pure green, which reads as "success" without triggering "health app" associations.
- **Gold** (`#FFD700`) — classic achievement gold; universally understood as "reward" across gaming and fitness culture.

### Dark Mode Only
GymBear is intentionally dark-mode only. Reasons:
1. Gym environments often have low ambient light.
2. OLED battery savings on modern mobile hardware.
3. The glassmorphism and glow effects require dark backgrounds to render correctly — they are invisible on light surfaces.

---

## 3. Typography

### Font Stack

| Role | Family | Weights | Use Cases |
|---|---|---|---|
| Display / Headings | **Bebas Neue** | 400 (regular only) | Page headings, stat numbers, section titles |
| Body / UI Text | **Space Grotesk** | 300, 400, 500, 600, 700 | Labels, descriptions, buttons, body copy |
| Monospace / Data | **JetBrains Mono** | 400, 700 | Rep counts, weights, timers, numeric data |

### Why These Fonts
- **Bebas Neue** — condensed uppercase display font. Widely used in sports and gym branding. The tight letter-spacing at large sizes creates boldness without width.
- **Space Grotesk** — geometric sans-serif with personality. More character than Inter or Roboto; feels designed rather than default. Excellent legibility at 12-16px.
- **JetBrains Mono** — fixed-width digits ensure rep/weight numbers don't jump positions when values change. Provides a "data readout" feel appropriate for performance tracking.

### CSS Variables
```css
--font-display: 'Bebas Neue', sans-serif;
--font-body:    'Space Grotesk', sans-serif;
--font-mono:    'JetBrains Mono', monospace;
```

### Type Scale

| Usage | Size | Font | Weight | Color |
|---|---|---|---|---|
| Page titles | `text-3xl` / `text-4xl` | Bebas Neue | 400 | `bear-bright` |
| Section headings | `text-xl` / `text-2xl` | Bebas Neue | 400 | `bear-bright` |
| Card titles | `text-base` / `text-lg` | Space Grotesk | 600 | `bear-bright` |
| Body / descriptions | `text-sm` | Space Grotesk | 400 | `bear-text` |
| Captions / metadata | `text-xs` | Space Grotesk | 400 | `bear-muted` |
| Rep / weight display | `text-2xl` / `text-3xl` | JetBrains Mono | 700 | `bear-bright` |
| Timers | `text-4xl` / `text-5xl` | JetBrains Mono | 700 | color-coded |
| Nav labels | `text-[9px]` | Bebas Neue | 400 | `ember` (active) |

### Letter Spacing
Bebas Neue headings use `tracking-wider` (`letter-spacing: 0.04em`) to improve legibility at large sizes. All-caps text in the nav uses `tracking-widest`.

### Font Loading
All four fonts are loaded via Google Fonts in `index.html` with `<link rel="preconnect">` for performance. `display=swap` ensures text renders immediately in fallback fonts during load.

---

## 4. Spacing & Layout

### Base Unit
Tailwind's default 4px base unit (`1 = 4px`). Common spacing values:
- `gap-2` (8px) — tight grouping within cards
- `gap-4` (16px) — standard card padding
- `gap-6` (24px) — section separation
- `px-4` / `px-6` — page horizontal padding

### Minimum Tap Targets
All interactive elements meet the 44×44px minimum tap target:
```js
minHeight: { tap: '44px' },
minWidth:  { tap: '44px' },
```
Stepper buttons, nav items, and sheet close buttons all use `min-h-tap min-w-tap` to ensure reliable tapping in sweaty gym conditions.

### Page Layout Pattern
Every page follows the same structure:
```
<div class="min-h-screen mesh-bg">
  <div class="max-w-lg mx-auto px-4 pt-safe-top pb-32">
    {/* content — pb-32 accounts for BottomNav height */}
  </div>
  <BottomNav />
</div>
```
`max-w-lg` (512px) constrains content width for comfortable reading on large phones and tablets. Pages never stretch to full viewport width.

### Bottom Nav Clearance
`pb-32` (128px) on all page containers prevents content from being obscured by the fixed BottomNav (68px height + safe area inset + breathing room).

### Safe Areas
iPhone Dynamic Island and notch are handled via CSS environment variables:
```css
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
.safe-top    { padding-top:    env(safe-area-inset-top); }
```
The BottomNav uses `max(env(safe-area-inset-bottom), 8px)` as bottom padding.

---

## 5. Glassmorphism & Surface System

### The `.glass` Utility Class
```css
.glass {
  background: rgba(18, 18, 42, 0.72);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid rgba(123, 94, 255, 0.18);
  border-radius: 20px;
}
```

**Design rationale:**
- `rgba(18, 18, 42, 0.72)` — semi-transparent surface using `bear-deep` as base. 72% opacity allows background mesh gradient to bleed through.
- `backdrop-filter: blur(20px) saturate(1.4)` — frosted glass effect. 20px blur is the minimum that looks smooth without hiding content underneath. `saturate(1.4)` enriches colours behind the card.
- `border: 1px solid rgba(123,94,255,0.18)` — subtle plasma-coloured border makes cards read as "floating" rather than painted on.
- `border-radius: 20px` — generous rounding matches iOS/Android modern UI conventions and avoids sharp corners that feel dated.

### Where `.glass` Is Used
- BottomNav container
- All bottom sheets (FormCoachOverlay, CustomExerciseSheet, SavedPlansSheet, BodyLogSheet)
- Home dashboard cards
- CoachCard and ChallengeCard
- SessionComplete stats cards
- Exercise rows in PlanBuilder

### Surface Layering Without `.glass`
For surfaces that don't need backdrop-filter (e.g. exercise list items, set rows):
```
bg-bear-surface/50   — slightly transparent base
border border-bear-rim/30  — faint border
rounded-xl           — 12px radius (softer than card-level 20px)
```

### Mesh Background
```css
.mesh-bg {
  background:
    radial-gradient(ellipse 80% 60% at 20% 10%,  rgba(123,94,255,0.14) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 80% 80%,  rgba(255,61,90,0.10)  0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 50% 50%,  rgba(0,245,196,0.06)  0%, transparent 70%),
    #090912;
}
```
Three overlapping radial gradients (plasma top-left, ember bottom-right, neon centre) simulate a dynamic ambient lighting environment. All pages use `mesh-bg` as their root background.

### Noise Grain Overlay
A subtle SVG-based fractal noise texture is applied via `body::before`:
```css
body::before {
  opacity: 0.04;
  background-image: url("data:image/svg+xml,...feTurbulence...");
  pointer-events: none;
  z-index: 9999;
}
```
At 4% opacity, the grain adds analogue texture without being perceptible to the casual eye — it subconsciously removes the "too clean" feel of pure digital backgrounds.

---

## 6. Glow & Atmosphere Effects

### Glow Utility Classes
```css
.glow-ember  { box-shadow: 0 0 24px rgba(255,61,90,0.40),   0 0 60px rgba(255,61,90,0.12); }
.glow-plasma { box-shadow: 0 0 24px rgba(123,94,255,0.40),  0 0 60px rgba(123,94,255,0.12); }
.glow-neon   { box-shadow: 0 0 24px rgba(0,245,196,0.40),   0 0 60px rgba(0,245,196,0.12); }
.glow-gold   { box-shadow: 0 0 20px rgba(255,215,0,0.45); }
```

Two-layer glow: a tight `24px` inner glow for the "bulb" effect, and a wide `60px` outer glow for ambient color spill. Used on:
- Active nav item indicator pill (ember)
- FormCoachOverlay ScoreRing when score is high (neon)
- PR achievement badge (gold)
- AI plan/coach elements (plasma)
- Active set row (ember)

### PR Shimmer Animation
Gold shimmer sweeps across PR achievement cards:
```css
@keyframes goldShimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.pr-shimmer {
  background: linear-gradient(90deg, rgba(255,215,0,0.05) 25%, rgba(255,215,0,0.12) 50%, rgba(255,215,0,0.05) 75%);
  background-size: 200% 100%;
  animation: goldShimmer 2s infinite;
}
```

### Skeleton Loader Shimmer
Content placeholder animation for loading states:
```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #12122A 25%, #1A1A3E 50%, #12122A 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 12px;
}
```
Used in Home plan card and quote display while AI data loads.

### Streak Pulse Ring
The active streak counter has a pulsing ring that animates outward, conveying "live" status:
```css
@keyframes streakPing {
  0%   { transform: scale(1);   opacity: 0.6; }
  100% { transform: scale(1.8); opacity: 0;   }
}
.streak-ping::before {
  border: 2px solid #FF3D5A;
  animation: streakPing 1.4s ease-out infinite;
}
```

---

## 7. Animation System

All motion is powered by **Framer Motion 11**.

### Motion Principles
1. **Spring physics, not easing curves** — all transitions use `type: 'spring'` with tuned `stiffness` and `damping`. Springs feel physical and natural; cubic easing feels mechanical.
2. **Stagger on lists** — list items animate in with `delay: index * 0.06` creating a cascade that suggests depth and organization.
3. **Exit animations always** — `AnimatePresence` wraps all conditional renders. Nothing disappears instantly; exits use `opacity: 0` + `y: 8` or `scale: 0.95`.
4. **Layout IDs for shared transitions** — the nav active indicator uses `layoutId="navIndicator"` so it slides between tabs as if physically constrained.

### Standard Spring Presets

| Spring | stiffness | damping | Use |
|---|---|---|---|
| Snappy | 500 | 35 | Nav indicator, button presses |
| Medium | 300 | 20 | Card entries, list items |
| Soft | 80 | 12 | Bruno body spring physics |
| Bouncy | 400 | 15 | Bruno head bob, icon tap bounce |

### Page Transitions
Every page wraps its root `motion.div` with:
```tsx
initial={{ opacity: 0, y: 16 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -8 }}
transition={{ type: 'spring', stiffness: 300, damping: 28 }}
```
`AnimatePresence mode="wait"` at the router level ensures the exiting page fully exits before the entering page begins its animation.

### Button / Interactive Tap Feedback
All interactive elements use:
```tsx
whileTap={{ scale: 0.85 }}
```
This provides immediate physical feedback — the element "depresses" like a physical button. The 0.85 scale is noticeable but not jarring.

### Number Change Animations
In the Workout page, weight and rep displays use `AnimatePresence` with vertical slide:
```tsx
<AnimatePresence mode="popLayout">
  <motion.span
    key={value}
    initial={{ y: -12, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 12, opacity: 0 }}
  />
</AnimatePresence>
```
Numbers slide up when increasing, slide down when decreasing (implied — same animation direction is used). The key prop forces re-mount on value change.

### Sheet Entry/Exit
Bottom sheets slide up from below:
```tsx
initial={{ y: '100%' }}
animate={{ y: 0 }}
exit={{ y: '100%' }}
transition={{ type: 'spring', stiffness: 300, damping: 30 }}
```

### Confetti
`Confetti.tsx` triggers on PR achievement — CSS keyframe bursts from the center of the screen. Uses multiple `div` elements with randomized rotation, distance, and timing to simulate particle burst.

---

## 8. Component Library

### BottomNav
**File:** `src/components/BottomNav.tsx`

5-tab fixed navigation bar at the bottom of every page.

**Visual spec:**
- Container: `.glass` with `height: 68px`, plasma glow `box-shadow: 0 0 24px rgba(123,94,255,0.20), 0 0 60px rgba(123,94,255,0.08)`
- Each tab: `flex-1`, minimum 44px touch target
- Inactive icon: `strokeWidth: 1.75`, color `bear-muted`
- Active icon: `strokeWidth: 2.5`, color `ember`
- Label: `text-[9px]` Bebas Neue, `tracking-wider`, color `ember`, only visible when active
- Active indicator: 32×4px pill, `bg-ember`, `glow-ember`, uses Framer Motion `layoutId="navIndicator"` for smooth slide between tabs

**Interactions:**
- Icon bounces up 4px on activation (`animate={{ y: [0, -4, 0] }}`)
- Label fades in from 4px below on activation
- `whileTap={{ scale: 0.85 }}` on each button
- Staggered mount animation (`delay: idx * 0.06`)

**Tabs:** Home / Workout / Progress / Wardrobe / More (Settings)

---

### Bruno
**File:** `src/components/Bruno.tsx`

Fully custom SVG animated bear mascot — 11 animation states, 9 accessories.

*(Full detail in Section 11)*

---

### CoachCard
**File:** `src/components/CoachCard.tsx`

Swipeable AI coaching insight card.

**Visual spec:**
- Container: `.glass` with left border accent in insight type color (warning = ember, encouragement = neon, suggestion = plasma, milestone = gold)
- Icon badge: colored circle with type-matched lucide icon
- Title: Space Grotesk 600, `bear-bright`
- Body: Space Grotesk 400, `bear-text`, `text-sm`
- Dismiss affordance: `"Swipe to dismiss"` hint in `bear-muted`
- Stack peek: if 2+ insights, a second card silhouette peeks 8px below with `scale: 0.96` and `opacity: 0.5`

**Interactions:**
- `drag="x"`, `dragConstraints={{ left: -200, right: 0 }}`
- `onDragEnd`: if `offset.x < -100`, triggers dismissal
- Dismissal: `animate={{ x: -300, opacity: 0 }}` → `dismissInsight(id)` in store

---

### FormCoachOverlay
**File:** `src/components/FormCoachOverlay.tsx`

Camera-based form analysis overlay. 80dvh bottom sheet.

**Visual spec:**
- Sheet entry: spring slide-up from `y: '100%'`
- Video feed: `<video>` mirrored via `transform: scaleX(-1)`, fills available width, `aspect-ratio: 4/3`
- Canvas overlay: absolute positioned over video, same dimensions
- ScoreRing: 120×120px SVG, circumference-based progress ring
  - Score ≥ 80: neon stroke + `.glow-neon`
  - Score ≥ 50: plasma stroke
  - Score < 50: ember stroke + `.glow-ember`
- Rep counter badge: top-left, gold background, JetBrains Mono bold
- Feedback pill: bottom of video, glass background, exercise tip text

---

### RestTimer
**File:** `src/components/RestTimer.tsx`

Circular SVG countdown timer.

**Visual spec:**
- 160px diameter SVG circle
- Stroke color transitions: neon (>50% time remaining) → plasma (25–50%) → ember (<25%)
- `stroke-dasharray` + `stroke-dashoffset` animated via Framer Motion
- Center: JetBrains Mono bold, `text-3xl`, remaining seconds
- Background track: `bear-surface/50` circle stroke

---

### CustomExerciseSheet
**File:** `src/components/CustomExerciseSheet.tsx`

Bottom sheet for creating custom exercises.

**Fields:**
- Exercise name text input
- Muscle group chips (6 groups) — toggle-style, active = plasma bg
- Equipment chips — active = ember bg
- Sets/reps steppers with +/- buttons
- Compound/isolation toggle: spring-animated sliding dot (iOS-style)
- Tips textarea with character counter
- Save button: gradient `from-plasma to-ember`

---

### SavedPlansSheet
**File:** `src/components/SavedPlansSheet.tsx`

Bottom sheet listing saved AI and custom workout plans.

**Interactions:**
- Swipe left on a plan row to reveal delete (ember) — uses `drag="x"`, threshold `-80px`
- Tap to apply plan for today via `setPlan()`
- AI plans show plasma badge; custom plans show ember badge

---

### BodyLogSheet
**File:** `src/components/BodyLogSheet.tsx`

Body composition logging bottom sheet.

**Fields:** Body weight (kg), Body fat % (optional), and optional measurements (chest, waist, hips, arms, thighs) — each with number stepper.

---

### A2HSPrompt
**File:** `src/components/A2HSPrompt.tsx`

Add-to-Home-Screen install nudge. Appears after the user's second session. Slides in from the bottom, dismissable via close button or "No thanks" tap.

---

## 9. Page-by-Page UX Flows

### Onboarding (6 steps)
**Route:** `/`

Full-screen wizard. Each step occupies the full viewport with a centered card. Steps slide horizontally via `AnimatePresence` with `key={step}`.

**Step progress indicator:** Row of 6 dots at the top. Active dot = ember, filled. Completed = neon, smaller. Remaining = `bear-muted/30`.

| Step | Content | Validation |
|---|---|---|
| 1 — Goal | 4 large cards: Strength / Hypertrophy / Endurance / General Fitness. Icon + description. Selecting one highlights with ember border + glow. | 1 selection required |
| 2 — Gym Days | 7 day chips (Mon–Sun). Multi-select. Active = ember bg. Default prefilled: Mon/Wed/Fri. | ≥ 1 day required |
| 3 — Duration | 3 radio buttons: 30 / 45 / 60 min. Large pill-style buttons. | Always valid |
| 4 — Machine Increments | 3 steppers for chest/lat/leg increments. Each shows equipment icon. Tap +/- to adjust. | Always valid |
| 5 — PIN | Two numeric inputs (PIN + confirm). Inline error message on mismatch. PINs 4–6 digits, numeric only. | PIN match required |
| 6 — Bruno Intro | Animated Bruno floating via `animate={{ y: [0, -10, 0] }}` infinite. Accessory preview chips. XP level unlock teaser. "Let's Go" CTA. | Always valid |

**Navigation:** Back/Next chevron buttons fixed at bottom. "Let's Go" on step 6 calls `handleFinish()`.

---

### Home Dashboard
**Route:** `/home`

The daily re-entry screen. Single scroll, no tabs.

**Layout top to bottom:**
1. **Header strip** — GymBear logo, date, streak badge with pulse ring animation
2. **Bruno** — 200px centered, current animation state (`pre-workout` or `rest-day`)
3. **Motivational quote** — italic, `bear-muted`, skeleton while loading, sourced from Worker
4. **Stats row** — 3 mini cards: Weekly Volume (kg), Monthly Sessions, Current Streak
5. **Volume sparkline** — 7-bar Recharts `BarChart` using last 7 sessions, ember bars
6. **Plan card** — `.glass` card with today's workout. Expandable (tap "View Plan") to show exercise list with muscle group badges. "Start Workout" CTA.
7. **CoachCard** — conditionally rendered if `activeInsights.length > 0`
8. **ChallengeCard** — daily community challenge

**Plan card loading state:** 3 `.skeleton` rows with shimmer animation while AI fetches plan.

---

### Workout
**Route:** `/workout`

Active session screen. Designed for eyes-half-on-phone usage.

**Layout:**
1. **Top bar** — back button, exercise name in Bebas Neue, elapsed timer (JetBrains Mono)
2. **Exercise navigator** — `< Prev | ExerciseName | Next >` with muscle group badge
3. **SetRow list** — one row per planned set:
   - Pending: gray `bear-surface/50` background, `--:--` weight/rep display
   - Active: `.glass border-ember` with ember glow
   - Completed: `bg-neon/10 border-neon/30`
   - Each row: set number, weight stepper (−/+), rep stepper (−/+), complete button
4. **RestTimer** — appears below set list when rest is active
5. **Finish Workout** button — fixed at bottom, gradient `from-neon to-plasma`
6. **Note** — collapsible textarea for session notes (note icon in header)

**Weight/rep steppers:** JetBrains Mono display, `text-2xl`. Arrows are `48×48px` with `whileTap={{ scale: 0.85 }}`. Long-press accelerates increment (TODO: optional enhancement).

**Rest timer trigger:** Automatic after set completion, no tap required.

---

### Session Complete
**Route:** `/session-complete`

Post-workout dopamine screen.

**Layout:**
1. **Bruno** in `session-complete` or `pr-achieved` animation state
2. **Confetti burst** if any PRs detected
3. **Stats grid:** Total Sets · Total Volume · Duration · XP Earned (gold shimmer)
4. **PR list:** Each PR shown as gold shimmer card with weight, reps, exercise name
5. **Share button:** `navigator.share()` Web Share API — native OS share sheet
6. **Done button:** returns to Home

---

### History
**Route:** `/history`

Reverse-chronological session log.

**Cards expand/collapse** via `AnimatePresence` with `initial={{ height: 0 }}` / `animate={{ height: 'auto' }}`. Each card:
- Collapsed: date, duration, exercise count, volume total
- Expanded: per-exercise breakdown with all sets, weights, and reps in JetBrains Mono

---

### Progress
**Route:** `/progress`

Three-tab chart view. Tab switcher is a pill-style segment control.

**Strength tab:** `ComposedChart` (Area + Line) — total volume or per-exercise over time. Exercise selector dropdown.

**Body tab:** Line chart — body weight and body fat % dual-axis from `useBodyStore`.

**Habits tab:** `RadarChart` — muscle group frequency. PR table sorted by date.

---

### Plan Builder
**Route:** `/plan-builder`

Drag-to-reorder custom workout plan builder.

**Layout:**
1. **Plan name input** at top
2. **Sortable exercise list** — each row draggable by gripper icon (left edge). Collapsible sets/reps/rest controls.
3. **+ Add Exercise** button — opens `ExercisePicker` bottom sheet
4. **Saved Plans** button — opens `SavedPlansSheet`
5. **Use This Plan Today** CTA — full-width ember gradient button

**Drag handle:** 3-dot grip icon, `cursor: grab`. `useSortable` provides transform + transition CSS. Visual drag indicator: `opacity: 0.4` on dragged item.

---

### Wardrobe
**Route:** `/wardrobe`

Bruno customisation hub.

**Layout:**
1. **Bruno** (large, centre) with active accessory
2. **Level badge** + **XP progress bar** (plasma fill, animated width on mount)
3. **Accessory grid** — 3-column grid. Unlocked = tappable, full color. Locked = grayscale, lock icon overlay, shows unlock level requirement.
4. Tapping unlocked accessory calls `setActiveAccessory(id)` and immediately updates Bruno's render.

---

### Settings
**Route:** `/settings`

Full profile management. Sectioned list with section headers in Bebas Neue.

**Sections:**
1. **Training Profile** — goal, gym days, duration, machine increments (each opens a modal on tap)
2. **Coaching** — AI Insights toggle, Push Notifications enable/disable
3. **Appearance** — Theme selector (Ember / Ghost) — swaps CSS custom properties via `document.documentElement.setAttribute('data-theme', ...)`
4. **Challenges** — Ghost Race toggle, Community Challenges toggle
5. **Security** — Set/Change PIN, Clear All Data (destructive, confirmation modal)
6. **Data** — Export JSON button

**`ToggleSwitch` sub-component:** CSS `useSpring({ x })` sliding dot — 0px (off) to 20px (on). Background transitions ember/dim. Used throughout Settings.

---

## 10. Navigation System

### Route Map

| Route | Page | Protected (PIN) |
|---|---|---|
| `/` | Onboarding | No |
| `/pin` | PinLock | No |
| `/home` | Home | Yes (if PIN set) |
| `/workout` | Workout | Yes |
| `/session-complete` | SessionComplete | Yes |
| `/history` | History | Yes |
| `/progress` | Progress | Yes |
| `/library` | ExerciseLibrary | Yes |
| `/plan-builder` | PlanBuilder | Yes |
| `/settings` | Settings | Yes |
| `/wardrobe` | Wardrobe | Yes |

### BottomNav Tab Mapping
```
Home → /home
Workout → /workout  
Progress → /progress
Wardrobe → /wardrobe
More → /settings
```

`/history`, `/library`, and `/plan-builder` are accessed from within pages (Home plan card, Settings, ExerciseLibrary links) — they are secondary pages not present in the bottom nav.

### Page-Level Code Splitting
Every page is `React.lazy()` wrapped. The router is wrapped in `<Suspense>`:
- Loading state: centered bear emoji + spinning ring (no skeleton for routing — fast enough)
- Prevents initial bundle from including Recharts (560KB) or dnd-kit until needed

---

## 11. Bruno — The Animated Mascot

### SVG Architecture
Bruno is a pure inline SVG decomposed into named `<motion.g>` transform groups:

```
<svg viewBox="0 0 200 280">
  <motion.g className="bodyCtrl">        ← whole body rotation/translation
    <motion.g className="headCtrl">      ← head bob
      {/* bear head, ears, face */}
    </motion.g>
    <motion.g className="lArmCtrl">     ← left arm (shoulder pivot)
      <motion.g className="lForearmCtrl"> ← left forearm
    <motion.g className="rArmCtrl">     ← right arm
      <motion.g className="rForearmCtrl"> ← right forearm
    <motion.g className="torsoCtrl">    ← torso
    <motion.g className="lLegCtrl">     ← left leg
    <motion.g className="rLegCtrl">     ← right leg
  </motion.g>
  {/* Active accessory overlay */}
</svg>
```

Each `Ctrl` is a `useSpring(initial, config)` value that drives a `motion.g` via `style={{ rotate: bodyCtrl }}` or `style={{ y: headCtrl }}`.

### Spring Configuration
```tsx
// Body — slow, weighty
useSpring(0, { stiffness: 80, damping: 12 })

// Arms — snappy
useSpring(0, { stiffness: 200, damping: 15 })

// Head — medium
useSpring(0, { stiffness: 150, damping: 18 })
```

### Animation States

| State | Trigger | What Moves |
|---|---|---|
| `idle` | Default | Gentle head bob, slight body sway |
| `pre-workout` | Gym day, before starting | Anticipatory bounce, arms slightly raised |
| `rest-day` | Non-gym day | Slow body droop, arms hang, head tilted |
| `pr-achieved` | New personal record | Victory arms pump up, body leans back |
| `session-complete` | After finishing workout | Arms fully overhead, body swaying |
| `ghost_race` | Ghost Race challenge | Lateral body oscillation with arm pumps |
| `champion` | Challenge won | Arms overhead, triumphant lean |
| `thinking` | AI plan loading | Head tilt right, right arm raised to chin |
| `camera` | Form Coach opened | Right arm extended 65° (pointing at camera) |
| `tired` | Long session / deload | Body lean forward, drooping arms |
| `pumped` | Set completed | Continuous bicep curl (repeat: Infinity) |

### Accessories
Each accessory is an SVG element group rendered when `useGymBearStore().bruno.activeAccessory` matches its ID:

| ID | Visual | Special Animation |
|---|---|---|
| `ghost_trail` | Translucent ellipses trailing left | Staggered opacity fade `[0.6, 0, 0.6]` |
| `trophy_belt` | Gold belt around torso | Gentle gold shimmer |
| `form_coach_glasses` | Neon-framed glasses on face | Neon glow circles pulse |
| `challenge_crown` | Crown on head | Bob with head, slight sparkle |
| `grind_headphones` | Headphones over ears | — |
| `fire_fists` | Red flame glow around hands | Scale pulse `[1, 1.15, 1]` |
| `crown` | Gold crown on head | Gold glow |
| `galaxy_shorts` | Star-pattern shorts | Subtle star twinkle via opacity |
| `champion_belt` | Championship belt | Gold shimmer |

### Unlock System
Accessories are defined with `unlockLevel` thresholds. In `Wardrobe.tsx`:
- `bruno.level >= accessory.unlockLevel` → tappable, full color
- Otherwise → grayscale CSS filter, lock overlay, "Level X" label

XP thresholds for levels are defined in `useGymBearStore`:
- Level 1: 0 XP (default)
- Level 2: 200 XP
- Level 3: 500 XP
- Level 4: 1000 XP
- Level 5: 2000 XP

---

## 12. Theme System

GymBear supports 3 themes switchable at runtime via `Settings.tsx`.

### Implementation
```tsx
// Applying a theme
document.documentElement.setAttribute('data-theme', 'ember')
```

CSS attribute selectors in `theme.css` override CSS custom properties:

### Default Theme
```css
:root {
  --accent-primary:   #FF3D5A;   /* ember */
  --accent-secondary: #7B5EFF;   /* plasma */
  --bg-void:          #090912;
  --bg-abyss:         #0D0D1A;
  --bg-surface:       #1A1A3E;
}
```

### Ember Theme `[data-theme="ember"]`
Warm orange-red shift — background takes on a slight brown warmth:
```css
--accent-primary:   #FF6B35;   /* orange-ember */
--accent-secondary: #FF3D5A;
--bg-void:          #0F0908;
--bg-abyss:         #1A0E0A;
--bg-surface:       #2A1A12;
```

### Ghost Theme `[data-theme="ghost"]`
Cold blue-grey — all warmth removed, ultra dark:
```css
--accent-primary:   #9898E8;   /* cool lavender */
--accent-secondary: #6868C8;
--bg-void:          #040406;
--bg-abyss:         #080810;
--bg-surface:       #10101C;
```

---

## 13. Mobile & PWA UX

### Viewport Configuration
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```
`viewport-fit=cover` extends content into iPhone notch/Dynamic Island area. Status bar area is handled by `env(safe-area-inset-top)`.

### Apple PWA Meta Tags
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="GymBear" />
```
`black-translucent` status bar style makes the status text (time, battery) appear white over the app's dark background, with no separate status bar area.

### Tap Highlight Removal
```css
* { -webkit-tap-highlight-color: transparent; }
```
Removes the default blue flash on tap on iOS/Android — essential for the app to feel native.

### Scrollbar Styling
```css
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #3A3A7A; border-radius: 99px; }
```
3px scrollbar is almost invisible but provides scroll position feedback.

### A2HS (Add to Home Screen) Prompt
`A2HSPrompt.tsx` listens for the `beforeinstallprompt` event and shows a custom bottom sheet after the user's second session. Custom prompt is used instead of the browser default because:
- Browser default appears too early (before value is demonstrated)
- Custom prompt matches the app's visual language
- Allows delaying until the user has invested in the app

### Service Worker Caching Strategy
Generated by `vite-plugin-pwa` (Workbox):
- **App shell** (HTML, JS bundles, CSS): `CacheFirst` — fast repeat loads, static assets never change without a version bump
- **Google Fonts**: `StaleWhileRevalidate` — fonts rarely change; serve cached instantly, update in background
- **API responses** (`/api/*`): `NetworkFirst` with 3s timeout, falls back to cached response — ensures fresh data when online, usable when offline
- **Images / icons**: `StaleWhileRevalidate`

---

## 14. Micro-interactions & Haptics

### Haptic Feedback Library
`src/lib/haptics.ts` wraps the Web Vibration API:

| Method | Pattern | Use |
|---|---|---|
| `haptics.light()` | `[10]` | Stepper taps, chip selections |
| `haptics.medium()` | `[25]` | Set completion, form navigation |
| `haptics.heavy()` | `[50]` | Sheet open/close |
| `haptics.success()` | `[10, 50, 10]` | Session complete, PR achieved |
| `haptics.warning()` | `[50, 30, 50]` | Rest timer warning |
| `haptics.pr()` | `[20, 40, 20, 40, 80]` | New personal record celebration |

All methods silently no-op if `navigator.vibrate` is unavailable (iOS Safari, desktop).

### Screen Wake Lock
`useWakeLock(isWorkoutActive)` hook requests `navigator.wakeLock.request('screen')` when a workout is active. This prevents the screen from sleeping during rest periods — critical because users set down the phone between sets and need to see the rest timer.

Wake lock is automatically released when:
- The workout finishes (`isWorkoutActive → false`)
- The page becomes hidden (device lock button, app switch)
- The hook cleans up

### Form Feedback
Every form field change includes:
1. Visual state change (border color, background opacity)
2. Haptic feedback on chip selection
3. Disabled button state with opacity until validation passes

### Notification Permission UX
Push permission is requested only from the Settings page (user-initiated) — never on app load. State is shown as:
- Default: "Enable Notifications" button
- Granted + subscribed: green badge with "Notifications On"
- Denied: "Blocked in browser settings" with link to browser permission docs

---

## 15. Accessibility Considerations

### Touch Targets
All interactive elements meet WCAG 2.1 AA minimum 44×44px touch target size via Tailwind `min-h-tap min-w-tap` utilities.

### Color Contrast
- `bear-bright` (#E8E8FF) on `bear-void` (#090912): contrast ratio ~16:1 (exceeds AAA 7:1)
- `bear-text` (#C8C8F0) on `bear-surface` (#1A1A3E): contrast ratio ~8.5:1 (exceeds AA 4.5:1)
- `ember` (#FF3D5A) on `bear-void`: contrast ratio ~5.2:1 (passes AA for large text)
- `neon` (#00F5C4) on `bear-void`: contrast ratio ~9.4:1 (exceeds AA)

### Motion Sensitivity
The app uses spring animations throughout. For users with `prefers-reduced-motion` enabled, animations should be reduced — this is a future enhancement (not yet implemented). Bruno loop animations (`pumped`, `ghost_race`) would be the primary targets for reduction.

### Focus States
Native browser focus rings are not overridden. Interactive elements receive default focus outlines for keyboard navigation.

### Semantic HTML
- `<nav>` for `BottomNav`
- `<button>` for all interactive controls (not `<div onClick>`)
- `<input type="number">` for steppers with proper `min`/`max`/`step` attributes
- `<label>` associated with all form inputs

---

*Last updated: March 20, 2026 — design system v2.0, all themes implemented, full animation library active.*
