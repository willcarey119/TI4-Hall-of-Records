# Findings Ledger — TI4 Hall of Records Front-End Review

**Date:** 2026-05-18
**Stage:** Stage 1 (static + measured + architecture evidence consolidated)
**Status:** Partial — felt-evidence section pending Task 6 Cowork walkthrough.
**Canon:** `docs/superpowers/research/2026-05-18-research-canon.md`
**Evidence sources merged:**
- Task 5: `2026-05-18-evidence-measured.md` (M1–M5)
- Task 7: `2026-05-18-evidence-static.md` (PS-*, GD-*, MD-*, AG-*, HM-*, SH-*, CC-*)
- Task 8: `2026-05-18-evidence-architecture.md` (god-file and boundary findings)

---

## Ledger

| F-nn | Heuristic(s) H-* | Evidence (file:line / measurement / prior-source) | Track | Severity |
|---|---|---|---|---|
| F-01 | H-A11Y01 | Auth button `var(--ink-3)` on `var(--paper)` = `oklch(0.52 0.01 60)` on `oklch(0.97 0.012 80)`; all 4 Lighthouse post-fix reports flag `color-contrast: FAIL, 1 item`; fix in a23e486 moved from `--ink-4`→`--ink-3` but contrast not independently verified; `app/src/shared/AppHeader.tsx:77,84`; prior-confirmed PS-1/SH-1 | design | critical |
| F-02 | H-TY02 | Measured: **14 SVG `<text>` elements rendered at 7px**, 6 at 9px on game-detail page (M2); static: `VpRaceSection.tsx:59,76,87` axis/VICTORY/round labels `fontSize={7}`; `ScoringPaceSection.tsx:111,128,147` Y-axis/X-axis/legend `fontSize={7}`; all below 12px absolute floor; prior-confirmed CR-2/GD-1/2/3/MD-1/2/3 | design | critical |
| F-03 | H-TY02, H-TY10 | Measured: `localStorage['ti4-font-scale']=0` default resolves `--font-scale: 0.85`; body `<p>` and nav text render at **11.9px** — 14px floor × 0.85 = ~11.9px; the default scale step ships every scaled surface ~15% below its own stated floor before the user touches anything (M1) | design | critical |
| F-04 | H-TY02 | `DistributionCard.tsx:67,107` HeatmapGrid legend rank badge labels and cell rank numerals at `fontSize: 9`; cells `height: 22`; below 12px absolute floor; MD-8/MD-9 | design | major |
| F-05 | H-TY02 | `StrategyCardSection.tsx:153` PickRateHeatmap cell label `fontSize: 9`; below 14px floor (12px absolute floor); prior-confirmed PS-4/MD-4 | design | major |
| F-06 | H-A11Y07 | `GameDetailPage.tsx:47,69` loading/error state branches each render a full `<main>` element inside App shell's `<main>` (`App.tsx:49`); Lighthouse confirms `landmark-one-main: FAIL` on `/game`; `MetaDashboardPage.tsx:65-88` MetaFrozenHeader `<header>` landmark conflicts with global `AppHeader` `<header>` — `/meta` also fails; `AgendaPage.tsx:85-159` outer `<main>` has `overflow: hidden` which may obscure landmark from axe tree walk — `/agenda` also fails; prior-confirmed PS-2/GD-9/MD-6/AG-1 | design | major |
| F-07 | H-A11Y04 | `FactionDot.tsx:9-24` bare `<span>` with background color only; no `aria-label`, `title`, or `aria-hidden`; used standalone (color-only) in `VpRaceSection.tsx:288`, `PlanetControlSlideshow.tsx:211`, and other call sites; faction identity conveyed through color alone; prior-confirmed PS-3/GD-17/SH-5 | design | major |
| F-08 | H-A11Y08, H-A11Y04, H-TY02 | `StrategyCardSection.tsx:151-158` PickRateHeatmap cells expose data only via hover `title` attribute (not accessible on touch or screen reader; does not satisfy SC 4.1.2); numeric label present but at `fontSize: 9` (below floor); prior-confirmed PS-4/MD-4/MD-5 | design | major |
| F-09 | H-RS03, H-RS11 | Measured: stacked header chrome (masthead + site nav + section nav + round scrubber) occupies **~290 of 730px ≈ ~40%** of desktop viewport before any game content; H-RS11 (harmful below ~8:1 mobile) and H-RS03 (≤48–56px/~7–8% vh) will be violated far worse on mobile — owner's "frozen header eats mobile" symptom structurally consistent; mobile exact figure deferred to Task 6 (M4); `app/src/features/game-detail/FrozenHeader.tsx` | design | major |
| F-10 | H-A11Y01 | `HomePage.tsx` still fails `color-contrast: FAIL` in Lighthouse post-fix — `textDecoration: none` was removed (a23e486) but a contrast issue on another element persists; different element from F-01 (home score 90 post-fix, color-contrast count unchanged); HM-1 | design | major |
| F-11 | NONE | `PlanetControlSlideshow.tsx:33,41` and `ComparePage.tsx:204` — `setState` called synchronously inside `useEffect` (3 instances); causes cascading double-render; prior-confirmed CR-1/GD-8. **NO-HEURISTIC:** canon contains no heuristic for React lifecycle anti-patterns (setState-in-useEffect); canon gap is a missing H-REACT or H-PERF bank covering component correctness / performance anti-patterns. | arch | major |
| F-12 | H-ARCH02, H-ARCH01 | `AppHeader.tsx` (shared layer) imports `features/upload/UploadPage` directly at line 5 — bypasses feature barrel AND violates shared→features upward import; `AppHeader` has taken on two responsibilities: navigation chrome and upload drawer; Task 8 god-files §5 | arch | major |
| F-13 | H-RS06 | `AgendaPage.tsx:85-159` outer App `<main>` has `overflow: hidden` (`App.tsx:49` sets `minHeight: 0, overflow: 'hidden'`) — `position: sticky` within sub-components silently degrades to `position: relative`; AG-1 | design | minor |
| F-14 | H-RS05 | No `prefers-reduced-motion` guard at any layer (CSS, JS, or Tailwind config); `PlanetControlSlideshow.tsx:280,312` `transition: 'background 0.3s'`; `DropZone.tsx:48` and `GamePreview.tsx:70` Tailwind `transition-colors`; `FrozenHeader.tsx:10` `scrollIntoView({ behavior: 'smooth' })`; prior-confirmed PS-5/GD-7/GD-15/CC-3 | design | minor |
| F-15 | H-ARCH07 | Hardcoded hex cluster in `PlanetControlSlideshow.tsx:189-190,277-278,308-309` — `#1a6e2e`/`#d6f0dc`/`#8a1a1a`/`#f5d6d6` for gain/loss badge and row backgrounds (8+ values); bypass `--moss`, `--accent` tokens; prior-confirmed CR-3/GD-4/5/6 | arch | minor |
| F-16 | H-ARCH07 | `AgendaSection.tsx:9-10` `VOTE_FOR_BG = '#2a6e3a'` and `VOTE_AGAINST_BG = '#a02020'` hardcoded; `AgendaSection.tsx:78-80` law badge `#f5ead0`/`#8a6020`; `AgendaSection.tsx:351-353` rider bet badge `#d8eaf8`/`#9ac0e8`/`#2a5a8c` — 12+ hardcoded hex in one component; same semantic pair duplicated independently in `PoliticalBarChart.tsx:5-6`; GD-10/11/12/AG-2 | arch | minor |
| F-17 | H-ARCH07 | `FactionSnapshotCards.tsx:16-22` VP source color map with 7 hardcoded hex values (`imperial: '#b06020'`, `sft: '#1a8c8c'`, etc.); `MecatolWidget.tsx:205,210-212` badge colors `#fbeaea`/`#dceeff`/`#2a5a9a`/`#99bfe8`; `StatsSection.tsx:284,295,312` `#e67e22` for "Contested away"; `AgendaSection.tsx` and `PoliticalBarChart.tsx` background tints `#e8f0ff`/`#d8f0dc`/`#f5d8d8`; GD-13/14/MD-7/AG-3 | arch | minor |
| F-18 | H-ARCH07 | `StrategyCardSection.tsx:33-34` `TIER_TEXT[2]` and `TIER_TEXT[3]` use `'#fff'` hardcoded; `CategoryBreakdown.tsx:55-56` `#fff` hardcoded inline in colored bar-segment labels; MD-10/SH-4 | arch | minor |
| F-19 | H-ARCH06, H-ARCH03 | `lib/parser/gameReducer.ts` 953 LOC — single switch handles all 20+ action types; all action handling in one monolith; exceeds 300-line ceiling by 3×; Task 8 §1 | arch | minor |
| F-20 | H-ARCH04, H-ARCH06 | `features/meta-dashboard/StatsSection.tsx` 656 LOC — exports 4 symbols: `buildGameLengthHistogram()`, `buildFinalVpHistogram()`, `buildWinsByFaction()`, and `StatsSection` (React component); data transformation logic belongs in `lib/`; Task 8 §2 | arch | minor |
| F-21 | H-ARCH06, H-ARCH03 | `lib/aggregator/buildGameStats.ts` 611 LOC — exports 15+ TypeScript interfaces plus a single 580-line function; interfaces should move to adjacent `types.ts`; Task 8 §3 | arch | minor |
| F-22 | H-ARCH06, H-ARCH07 | `features/game-detail/AgendaSection.tsx` 583 LOC — ~500 lines of JSX with 12+ hardcoded hex literals; Task 8 §4 | arch | minor |
| F-23 | H-ARCH01 | No top-level `lib/index.ts` barrel — features import deep into `lib/` sub-paths directly (`../../lib/parser/types`, `../../lib/factions/factionBrandColors`, `../../lib/aggregator/deriveRoundBoundaries`); `lib/` internals exposed to direct deep imports across all feature files; Task 8 barrel audit | arch | minor |
| F-24 | H-RS08 | `AppHeader.tsx:107-130` nav has no `aria-label` distinguishing it from the page-level nav in `FrozenHeader`; when two nav landmarks exist, both must have unique labels per ARIA Landmark best practice; SH-3 | design | minor |
| F-25 | H-TY04 [informational-basis] | Systematic monospace overuse: faction names (`VpRaceSection.tsx:280`), VP source labels (`FactionSnapshotCards.tsx`), agenda text labels, planet names (`PlanetControlSlideshow.tsx:274`) all `IBM Plex Mono`; masthead subtitle (`AppHeader.tsx:58-66`) `IBM Plex Mono` on decorative running text; all site nav labels (`AppHeader.tsx:114-130`) `IBM Plex Mono`; VP Race kicker, legend faction names, running VP labels (`VpRaceSection.tsx:114,118,127`) `IBM Plex Mono`; only numeric columns and round labels warrant mono; prior-confirmed CR-4/GD-16/SH-2/SH-6/CC-2 | design | minor |
| F-26 | H-ARCH07, H-TY10 | Per-section kicker pattern copy-pasted raw across `AgendaSection.tsx`, `VpRaceSection.tsx`, `StrategyCardSection.tsx`, `FactionSection.tsx` — `{ fontFamily: "'IBM Plex Mono'", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--ink-4)', paddingBottom: 3, marginBottom: 6 }` inline object; `Kicker` shared component exists but not used consistently; CC-1 | arch | minor |
| F-27 | H-TY09 | `AgendaPage.tsx:104` definition text `<p>` with `font-caption` uses `lineHeight: 1.5` correctly; `<strong>` children use inline color tokens; AG-4 | design | info |
| F-28 | H-TY10 | Measured: `h1/h2` = **32.3px** on desktop — display headings correctly sized; scale's top end is healthy; failure is concentrated at floor + density end; positive control measurement (M3) | design | info |

---

## Felt evidence (Task 6 — PENDING Cowork walkthrough)

Reserved — felt-evidence findings (F-Fnn) appended after the Cowork-guided walkthrough; ledger is not final until then.

---

## No-heuristic findings

| Finding | Summary | Canon gap — what heuristic is missing |
|---|---|---|
| **F-11** (NONE) | `setState` called synchronously inside `useEffect` in 3 component files, causing cascading double-render (`PlanetControlSlideshow.tsx:33,41`, `ComparePage.tsx:204`) | Canon has no heuristic covering React lifecycle correctness or component-level performance anti-patterns. A missing **H-REACT** (or H-PERF) bank would cover: setState-in-useEffect, stale closure captures, unguarded effect dependencies, and memo/callback overuse. These are T1-sourceable from the React docs and the rules-of-hooks ESLint plugin specification. |

---

## Excluded (already fixed — commit a23e486)

The following Task 7 "Already-fixed" items are confirmed in code and excluded from findings:
- `firebase.json` Cache-Control immutable header for hashed assets
- `index.html` non-blocking font preload + `<meta name="description">` + robots.txt ref
- `public/robots.txt` added
- `App.tsx` `<div>` wrapper around `<Routes>` replaced with `<main>` (partial fix — duplicates persist; see F-06)
- `FactionVotingPanel.tsx` `scope="col"/"row"` added to `<th>` (partial — `/agenda` `td-has-header` still fails for a different table; tracked separately in Lighthouse audit)
- `HomePage.tsx` `textDecoration: none` removed from inline links (F-10 tracks the remaining contrast failure on that route)
- `AppHeader.tsx` auth buttons changed from `--ink-4` to `--ink-3` (contrast fix incomplete — F-01)
- `FilterBar.tsx` `aria-label={dropdownLabel}` added to `<select>` on `/meta`; `/game` route `select-name` may still be flagged for a second unlabeled `<select>`

---

## Summary

| Metric | Count |
|---|---|
| **Total findings (F-01 → F-28)** | **28** |
| Critical | 3 |
| Major | 9 |
| Minor | 14 |
| Info | 2 |
| **By track — design** | **17** |
| **By track — arch** | **11** |
| Findings whose ONLY heuristic is informational (`[informational-basis]`) | 1 (F-25, H-TY04 only) |
| No-heuristic findings (`NONE`) | 1 (F-11) |

**Canon gap implied by F-11:** The H-ARCH bank covers module structure but not React lifecycle/component correctness. An H-REACT bank (or H-PERF sub-section) would cover this class of finding and is T1-sourceable from React docs + rules-of-hooks.

---

## Grep verification (pre-write self-check)

Self-verified before write:
- Pattern `^\| F-[0-9]` → **28 rows** (F-01 through F-28).
- Pattern `^\| F-[0-9].*\| (H-(TY|DV|RS|A11Y|ARCH)[0-9]|NONE)` → **28 rows** (every finding row carries a heuristic cell or explicit NONE).
- Equal: **Y**

---

## Top 5 critical findings

1. **F-01** Auth button contrast unresolved post-fix — `AppHeader.tsx:77,84`, all 4 Lighthouse routes still fail `color-contrast`.
2. **F-02** SVG chart text renders at 7px / 9px on game-detail and meta pages — 14+ text elements below the 12px absolute floor; most information-dense marks are least legible.
3. **F-03** Default font scale (`--font-scale: 0.85`) ships every scaled surface ~15% below the 14px floor before the user touches anything — the entire legibility system undercuts itself at its default state; invisible to static review, caught only by measurement (M1).
4. **F-06** Duplicate `<main>` landmark on `/game`, `/meta`, and `/agenda` — `GameDetailPage.tsx:47,69` loading/error branches each render a second `<main>`; three routes fail Lighthouse `landmark-one-main`.
5. **F-09** Frozen header chrome consumes ~40% of desktop viewport (~290/730px) before any game content; H-RS11/H-RS03 mobile violations expected to be far worse (mobile measurement deferred to Task 6).
