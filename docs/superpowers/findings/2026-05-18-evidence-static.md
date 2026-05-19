# Static Design Evidence — TI4 Hall of Records

**Date:** 2026-05-18
**Auditor:** Claude Sonnet 4.6 (read-only pass; no app code modified)
**Research canon:** `docs/superpowers/research/2026-05-18-research-canon.md`
**Scope:** `app/src/features/{game-detail,meta-dashboard,agenda,home,compare}/` + `app/src/shared/`

---

## Lighthouse Scores (post-a23e486 deploy, 2026-05-07)

| Route | Perf | A11y | BP | SEO |
|---|---|---|---|---|
| `/` (home) | 71 | 90 | 100 | 82 |
| `/meta` | 64 | 88 | 100 | 82 |
| `/games/:id` | 68 | 89 | 100 | 82 |
| `/agenda` | 65 | 94 | 100 | 82 |

**All 4 routes still fail:** `color-contrast`, `layout-shifts`, `unused-javascript`, `meta-description`, `robots-txt`, `cache-insight`, `render-blocking-insight`
**`/meta`, `/game`, `/agenda` additionally fail:** `mainthread-work-breakdown`, `landmark-one-main`
**`/meta` additionally fails:** `select-name`
**`/agenda` additionally fails:** `td-has-header`

---

## Already-fixed (do not re-raise)

Commit `a23e486` (2026-05-07) changed 8 files:
- `app/firebase.json` — Cache-Control immutable header for hashed assets
- `app/index.html` — non-blocking font preload + `<meta name="description">` + `robots.txt` ref
- `app/public/robots.txt` — added
- `app/src/App.tsx` — `<div>` wrapping `<Routes>` replaced with `<main>` (landmark for `/` route)
- `app/src/features/agenda/FactionVotingPanel.tsx` — `scope="col"/"row"` added to `<th>` elements
- `app/src/features/home/HomePage.tsx` — `textDecoration: none` removed from inline links
- `app/src/shared/AppHeader.tsx` — auth buttons changed from `var(--ink-4)` to `var(--ink-3)`
- `app/src/shared/FilterBar.tsx` — `aria-label={dropdownLabel}` added to `<select>`

Note: `meta-description` and `robots-txt` still show as Lighthouse FAILS post-deploy — these appear to be pre-cached audit snapshots taken before the deploy propagated, or the Lighthouse run used the old build. The fixes ARE in the codebase. Treat them as addressed in code but not confirmed clean in audit.

---

## Prior-confirmed (CODE_REVIEW_2026-05-05)

These issues were documented in `CODE_REVIEW_2026-05-05.md` with file:line evidence. Citing as prior-confirmed — re-verified below.

| # | Issue | Location | Status |
|---|---|---|---|
| CR-1 | `setState` in `useEffect` — 3 instances | `PlanetControlSlideshow.tsx:33,41` + `ComparePage.tsx:204` | Still present (unfixed) |
| CR-2 | VP Race labels at `fontSize={7}` below stated floor | `VpRaceSection.tsx:59,76,87` | Still present (unfixed) |
| CR-3 | Hardcoded hex in `PlanetControlSlideshow` gain/loss badge + row colors | `PlanetControlSlideshow.tsx:189-190,277-278,289,308-309,320` | Still present (unfixed) |
| CR-4 | `IBM Plex Mono` used for all labels (not just tabular/code) | Pervasive across all feature sections | Still present (unfixed) |
| CR-5 | `StatCard` sparkline variant unimplemented | `shared/StatCard.tsx` | Not verified this pass — out of scope |

---

## Pre-seeded findings — confirmation

### PS-1: Auth button contrast still failing post-fix
**CONFIRMED.** `app/src/shared/AppHeader.tsx:77,84` — auth buttons use `style={monoMicro({ color: 'var(--ink-3)' })}`. `var(--ink-3)` is defined in `index.css:13` as `oklch(0.52 0.01 60)`. On `var(--paper)` (`oklch(0.97 0.012 80)`) this is a mid-gray on warm white. All 4 post-fix Lighthouse reports still flag `color-contrast: FAIL, 1 item`. The fix in a23e486 moved from `--ink-4` to `--ink-3` but the rendered contrast ratio has not been independently measured — Lighthouse axe-core 4.11.4 disagrees with the intent. H-A11Y01 · **critical**

### PS-2: `landmark-one-main` persists on `/game` and `/agenda`
**CONFIRMED.** `app/src/App.tsx:49` wraps `<Routes>` in `<main>` — this provides one `<main>` for the shell. However, `app/src/features/game-detail/GameDetailPage.tsx:47,69` renders its loading and error states inside additional `<main>` elements (lines 47–60 and 64–95), creating duplicate `<main>` landmarks when the game loads and the outer shell `<main>` is also present. Similarly the agenda and game post-fix Lighthouse reports show `landmark-one-main: FAIL`. H-A11Y07 · **major**

### PS-3: `FactionDot` standalone has no accessible name
**CONFIRMED.** `app/src/shared/FactionDot.tsx:9-24` — bare `<span>` with background color only, no `aria-label`, no `title`, no `aria-hidden`. Used standalone (color-only) in `VpRaceSection.tsx:288`, `PlanetControlSlideshow.tsx:211`, and other call sites where no visible faction text accompanies it. Conveys faction identity through color only. H-A11Y04 · **major**

### PS-4: `PickRateHeatmap` cells use hover-only `title` + 9px label font
**CONFIRMED.** `app/src/features/meta-dashboard/StrategyCardSection.tsx:151-158` — cells render `title={tipText}` (hover-only, not accessible on touch or screen reader) and `fontSize: 9` hardcoded below the 14px floor (H-TY02). The 5-tier color scale provides some non-color channel via numeric percentage labels, partially satisfying H-A11Y04, but the `title` attribute alone does not satisfy SC 4.1.2 Name/Role/Value for interactive-intent elements. H-TY02 + H-A11Y04 + H-A11Y08 · **major**

### PS-5: No `prefers-reduced-motion` guard anywhere
**CONFIRMED.** `grep prefers-reduced-motion app/src/` returned zero results. Transitions present at:
- `app/src/features/game-detail/PlanetControlSlideshow.tsx:280` — `transition: 'background 0.3s'` (planet gain row)
- `app/src/features/game-detail/PlanetControlSlideshow.tsx:312` — `transition: 'background 0.3s'` (planet lost row)
- `app/src/features/upload/DropZone.tsx:48` — Tailwind `transition-colors`
- `app/src/features/upload/GamePreview.tsx:70` — Tailwind `transition-colors`
Also: `app/src/features/game-detail/FrozenHeader.tsx:10` uses `scrollIntoView({ behavior: 'smooth' })` with no reduced-motion guard.
H-RS05 · **minor** (WCAG 2.3.3 is Level AAA; vestibular harm is real; cost of fix is near-zero)

---

## Feature-area findings

### FEATURE: game-detail

**GD-1** `app/src/features/game-detail/VpRaceSection.tsx:59` · H-TY02 · SVG VP axis labels use `fontSize={7}` — 7px is half the 14px floor and below even the emergency 12px absolute floor · **critical**

**GD-2** `app/src/features/game-detail/VpRaceSection.tsx:76` · H-TY02 · VICTORY line label uses `fontSize={7}` — same breach as GD-1 · **critical**

**GD-3** `app/src/features/game-detail/VpRaceSection.tsx:87` · H-TY02 · X-axis round labels (R1, R2 …) use `fontSize={7}` — three SVG text nodes in SlopeChart below floor · **critical**

**GD-4** `app/src/features/game-detail/PlanetControlSlideshow.tsx:189-190` · H-ARCH07 · Hardcoded `#1a6e2e` / `#d6f0dc` / `#8a1a1a` / `#f5d6d6` for gain/loss badge — bypass design tokens `--moss`, `--accent` · **minor**

**GD-5** `app/src/features/game-detail/PlanetControlSlideshow.tsx:277-278` · H-ARCH07 · Planet row `background: '#d6f0dc'`, `color: '#1a6e2e'` inline — same hardcoded palette repeated in render loop · **minor**

**GD-6** `app/src/features/game-detail/PlanetControlSlideshow.tsx:308-309` · H-ARCH07 · Lost-planet row `background: '#f5d6d6'`, `color: '#8a1a1a'` — six unique hardcoded hex values in one component · **minor**

**GD-7** `app/src/features/game-detail/PlanetControlSlideshow.tsx:280,312` · H-RS05 · `transition: 'background 0.3s'` used on planet rows with no `prefers-reduced-motion` guard (confirmed PS-5) · **minor**

**GD-8** `app/src/features/game-detail/PlanetControlSlideshow.tsx:33,41` · (prior-confirmed CR-1) · `setState` called synchronously inside `useEffect` — causes cascading double-render; 2 lint errors · **major**

**GD-9** `app/src/features/game-detail/GameDetailPage.tsx:47` and `:69` · H-A11Y07 · Loading/error state branches each render a full `<main>` element inside the App shell's `<main>` (App.tsx:49), producing duplicate landmark regions; Lighthouse confirms `landmark-one-main: FAIL` on `/game` · **major**

**GD-10** `app/src/features/game-detail/AgendaSection.tsx:9-10` · H-ARCH07 · `VOTE_FOR_BG = '#2a6e3a'` and `VOTE_AGAINST_BG = '#a02020'` hardcoded — same semantic as `--moss` and `--accent` but not using tokens · **minor**

**GD-11** `app/src/features/game-detail/AgendaSection.tsx:78-80` · H-ARCH07 · Law badge colors `#f5ead0` / `#8a6020` hardcoded — no equivalent design token; three distinct semantic states defined in hex · **minor**

**GD-12** `app/src/features/game-detail/AgendaSection.tsx:351-353` · H-ARCH07 · Rider bet badge `#d8eaf8` / `#9ac0e8` / `#2a5a8c` all hardcoded — `var(--cool)` token exists for the hue but the tint variants are bespoke · **minor**

**GD-13** `app/src/features/game-detail/FactionSnapshotCards.tsx:16-22` · H-ARCH07 · VP source color map (`imperial: '#b06020'`, `sft: '#1a8c8c'`, `agenda: '#7a4a2a'`, `rider: '#2a5a8c'`, etc.) — 7 hardcoded hex values for VP source categories not in design tokens · **minor**

**GD-14** `app/src/features/game-detail/MecatolWidget.tsx:205,210-212` · H-ARCH07 · Badge colors `#fbeaea` / `#dceeff` / `#2a5a9a` / `#99bfe8` hardcoded for "First" and "Taken" states · **minor**

**GD-15** `app/src/features/game-detail/FrozenHeader.tsx:10` (scrollToSection) · H-RS05 · `scrollIntoView({ behavior: 'smooth' })` with no reduced-motion guard — scroll animation fires unconditionally · **minor**

**GD-16** `app/src/features/game-detail/VpRaceSection.tsx:114,118,127` · H-TY04 · `IBM Plex Mono` used for kicker, legend faction names, and running VP labels — monospace is wrong register for these non-tabular running labels; contributes to the "cramped" legibility loop · **minor** [informational-basis: H-TY04 is T2]

**GD-17** `app/src/shared/FactionDot.tsx:9` · H-A11Y04 · No `aria-label`, `title`, or `aria-hidden` on standalone `FactionDot` — confirmed PS-3 · **major**

---

### FEATURE: meta-dashboard

**MD-1** `app/src/features/meta-dashboard/ScoringPaceSection.tsx:111` · H-TY02 · SVG Y-axis labels at `fontSize={7}` — below absolute 12px floor · **critical**

**MD-2** `app/src/features/meta-dashboard/ScoringPaceSection.tsx:128` · H-TY02 · SVG X-axis labels at `fontSize={7}` · **critical**

**MD-3** `app/src/features/meta-dashboard/ScoringPaceSection.tsx:147` · H-TY02 · Legend / annotation text at `fontSize={7}` · **critical**

**MD-4** `app/src/features/meta-dashboard/StrategyCardSection.tsx:153` · H-TY02 · `PickRateHeatmap` cell label `fontSize: 9` — below 14px floor (12px absolute floor for small-multiple contexts) · **major** (confirmed PS-4)

**MD-5** `app/src/features/meta-dashboard/StrategyCardSection.tsx:147-158` · H-A11Y08 · `PickRateHeatmap` cells expose data only via hover `title` attribute — not accessible on touch; does not satisfy SC 4.1.2 for interactive intent · **major** (confirmed PS-4)

**MD-6** `app/src/features/meta-dashboard/MetaDashboardPage.tsx:65-88` · H-A11Y07 · `MetaFrozenHeader` uses `<header>` inside a `<div>`, not within the page `<main>` — the outer App `<main>` wraps all routes but /meta's Lighthouse report still fails `landmark-one-main`; likely the inner `<header>` landmark conflicts with the global site `<header>` rendered in `AppHeader.tsx` · **major**

**MD-7** `app/src/features/meta-dashboard/StatsSection.tsx:284,295,312` · H-ARCH07 · `#e67e22` hardcoded for "Contested away" Mecatol state — no design token maps to this amber-orange semantic · **minor**

**MD-8** `app/src/shared/DistributionCard.tsx:67` · H-TY02 · HeatmapGrid legend rank badge labels at `fontSize: 9` — below floor; same badge rendered at line `:107` · **major**

**MD-9** `app/src/shared/DistributionCard.tsx:105-113` · H-TY02 · HeatmapGrid cell rank numerals at `fontSize: 9` — cells are `height: 22`, label is 9px mono — below H-TY02 12px absolute floor · **major**

**MD-10** `app/src/features/meta-dashboard/StrategyCardSection.tsx:33-34` (TIER_TEXT) · H-ARCH07 · `TIER_TEXT[2]` and `TIER_TEXT[3]` use `'#fff'` — hardcoded white on the orange/vermillion tiers instead of a token · **minor**

---

### FEATURE: agenda

**AG-1** `app/src/features/agenda/AgendaPage.tsx:85-159` · H-A11Y07 · `/agenda` route wraps content in a plain `<div style={{ height: '100%', overflowY: 'auto' }}>` with no `<main>` element inside — relies on App.tsx outer `<main>`, which is correct for a single-route app, but Lighthouse still flags `landmark-one-main: FAIL` on `/agenda`. Root cause: the outer `<main>` has `overflow: hidden` (`App.tsx:49` sets `minHeight: 0, overflow: 'hidden'`) which means `position:sticky` within sub-components may silently degrade (H-RS06), and the landmark may be obscured from axe's tree walk · **major**

**AG-2** `app/src/features/agenda/PoliticalBarChart.tsx:5-6` · H-ARCH07 · `VOTE_FOR = '#2a6e3a'` and `VOTE_AGAINST = '#a02020'` hardcoded — duplicated from `AgendaSection.tsx` constants; same semantic, two separate definitions, neither using tokens · **minor**

**AG-3** `app/src/features/agenda/PoliticalBarChart.tsx:120,140,160` · H-ARCH07 · Background tints `#e8f0ff` / `#d8f0dc` / `#f5d8d8` hardcoded for elect/for/against vote bands · **minor**

**AG-4** `app/src/features/agenda/AgendaPage.tsx:104` · H-TY09 · Definition text (`p` tag with `font-caption`) uses `lineHeight: 1.5` correctly, but `<strong>` children use inline color tokens — low severity; observe only · **info**

---

### FEATURE: home

**HM-1** `app/src/features/home/HomePage.tsx` · H-A11Y01 · `/` (home) still fails `color-contrast: FAIL` in Lighthouse post-fix — `textDecoration: none` was removed (a23e486) but a contrast issue on another element persists. The a11y score dropped from 90 to the same 90 (home improved) but `color-contrast` failure item count remains 1. Could be a different element; needs live axe measurement · **major**

---

### SHARED

**SH-1** `app/src/shared/AppHeader.tsx:77,84` · H-A11Y01 · Auth buttons `var(--ink-3)` on `var(--paper)` = `oklch(0.52 0.01 60)` on `oklch(0.97 0.012 80)` — computed contrast not independently verified; all 4 Lighthouse reports flag `color-contrast: FAIL, 1 item` post-fix (confirmed PS-1) · **critical**

**SH-2** `app/src/shared/AppHeader.tsx:58-66` · H-TY04 · Masthead subtitle "Twilight Imperium IV · Private League Archive" uses `IBM Plex Mono` — decorative running text, not tabular data; wrong typographic register (H-TY04) · **minor** [informational-basis: H-TY04 is T2]

**SH-3** `app/src/shared/AppHeader.tsx:107-130` · H-RS08 · `<nav>` has no `aria-label` distinguishing it from the page-level nav in `FrozenHeader`; when two nav landmarks exist, both must have unique labels per ARIA Landmark best practice · **minor**

**SH-4** `app/src/shared/CategoryBreakdown.tsx:55-56` · H-ARCH07 · Text color `#fff` hardcoded inline in colored bar-segment labels — fragile if bar background changes · **minor**

**SH-5** `app/src/shared/FactionDot.tsx:9-24` · H-A11Y04 · Standalone `FactionDot` no accessible name (confirmed PS-3) · **major**

**SH-6** `app/src/shared/AppHeader.tsx:114-130` · H-TY04 · All nav link labels (Games, League, Agenda) use `IBM Plex Mono` — site navigation labels are UI chrome, not tabular data; violates "monospace reserved for code / fixed-column alignment" · **minor** [informational-basis: H-TY04 is T2]

---

### CROSS-CUTTING: per-section layout divergence

**CC-1** Multiple files — H-ARCH07 + H-TY10 · Each feature section defines its own one-off mono kicker, inline spacing, and border colors: `AgendaSection.tsx`, `VpRaceSection.tsx`, `StrategyCardSection.tsx`, `FactionSection.tsx` each re-implement `{ fontFamily: "'IBM Plex Mono'", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--ink-4)', paddingBottom: 3, marginBottom: 6 }` inline as a raw object. The `Kicker` shared component exists but is not used consistently — sections drift typographically because the pattern is copy-pasted rather than composed · **minor**

**CC-2** Multiple files — H-TY04 · Systematic monospace overuse: faction names (`VpRaceSection.tsx:280`), VP source labels (`FactionSnapshotCards.tsx`), agenda text labels, planet names (`PlanetControlSlideshow.tsx:274`) all set in `IBM Plex Mono`. Only numeric columns and round labels (`R1, R2`) warrant mono; this is the highest-leverage legibility change available (prior-confirmed CR-4) · **minor** [informational-basis: H-TY04 is T2]

**CC-3** No `prefers-reduced-motion` guard at any layer (CSS, JS, or Tailwind config) — applies to every transition across all features (confirmed PS-5) · H-RS05 · **minor**

---

## Severity summary

| Severity | Count |
|---|---|
| critical | 7 |
| major | 11 |
| minor | 18 |
| info | 1 |
| **Total** | **37** |

---

## Pre-seeded items — final confirmation table

| # | Item | Confirmed? | File:Line |
|---|---|---|---|
| PS-1 | Auth button contrast still failing post-fix | **Y** | `app/src/shared/AppHeader.tsx:77,84` |
| PS-2 | `landmark-one-main` persists on /game and /agenda | **Y** | `app/src/features/game-detail/GameDetailPage.tsx:47,69` + `app/src/features/agenda/AgendaPage.tsx:85` + `app/src/App.tsx:49` |
| PS-3 | `FactionDot` standalone has no accessible name | **Y** | `app/src/shared/FactionDot.tsx:9` |
| PS-4 | `PickRateHeatmap` cells hover-only title + 9px label | **Y** | `app/src/features/meta-dashboard/StrategyCardSection.tsx:151-158` |
| PS-5 | No `prefers-reduced-motion` guard anywhere | **Y** | `app/src/features/game-detail/PlanetControlSlideshow.tsx:280,312` + `DropZone.tsx:48` + `GamePreview.tsx:70` + `FrozenHeader.tsx:10` |

All 5 pre-seeded items: **confirmed with file:line**.
