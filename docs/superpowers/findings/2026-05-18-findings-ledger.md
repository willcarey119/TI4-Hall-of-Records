# Findings Ledger — TI4 Hall of Records Front-End Review

**Date:** 2026-05-18
**Stage:** Stage 1 (static + measured + architecture + felt evidence consolidated)
**Status:** Merged — Task 6 Cowork walkthrough integrated (2026-05-18).
**Canon:** `docs/superpowers/research/2026-05-18-research-canon.md`
**Evidence sources merged:**
- Task 5: `2026-05-18-evidence-measured.md` (M1–M5)
- Task 7: `2026-05-18-evidence-static.md` (PS-*, GD-*, MD-*, AG-*, HM-*, SH-*, CC-*)
- Task 8: `2026-05-18-evidence-architecture.md` (god-file and boundary findings)
- Task 6: `2026-05-18-evidence-felt.md` (Cowork-guided walkthrough, F-F01..F-F51)

---

## Ledger

| F-nn | Heuristic(s) H-* | Evidence (file:line / measurement / prior-source) | Track | Severity |
|---|---|---|---|---|
| F-01 | H-A11Y01 | Auth button `var(--ink-3)` on `var(--paper)` = `oklch(0.52 0.01 60)` on `oklch(0.97 0.012 80)`; all 4 Lighthouse post-fix reports flag `color-contrast: FAIL, 1 item`; fix in a23e486 moved from `--ink-4`→`--ink-3` but contrast not independently verified; `app/src/shared/AppHeader.tsx:77,84`; prior-confirmed PS-1/SH-1 | design | critical |
| F-02 | H-TY02 | Measured: **14 SVG `<text>` elements rendered at 7px**, 6 at 9px on game-detail page (M2); static: `VpRaceSection.tsx:59,76,87` axis/VICTORY/round labels `fontSize={7}`; `ScoringPaceSection.tsx:111,128,147` Y-axis/X-axis/legend `fontSize={7}`; all below 12px absolute floor; prior-confirmed CR-2/GD-1/2/3/MD-1/2/3; felt F-F16 (VP Race SVG viewBox 0 0 400 200 renders at 1184×592 so 7px CSS → ~27px effective height, above floor — triangulation-tension: re-measure effective vs nominal in Stage 2; static M2 finding stands), felt F-F28 (same SVG-scaling pattern in Tech section) | design | critical |
| F-03 | H-TY02, H-TY10 | Measured: `localStorage['ti4-font-scale']=0` default resolves `--font-scale: 0.85`; body `<p>` and nav text render at **11.9px** — 14px floor × 0.85 = ~11.9px; the default scale step ships every scaled surface ~15% below its own stated floor before the user touches anything (M1) | design | critical |
| F-04 | H-TY02 | `DistributionCard.tsx:67,107` HeatmapGrid legend rank badge labels and cell rank numerals at `fontSize: 9`; cells `height: 22`; below 12px absolute floor; MD-8/MD-9 | design | major |
| F-05 | H-TY02 | `StrategyCardSection.tsx:153` PickRateHeatmap cell label `fontSize: 9`; below 14px floor (12px absolute floor); prior-confirmed PS-4/MD-4 | design | major |
| F-06 | H-A11Y07 | `GameDetailPage.tsx:47,69` loading/error state branches each render a full `<main>` element inside App shell's `<main>` (`App.tsx:49`); `MetaDashboardPage.tsx:65-88` MetaFrozenHeader `<header>` landmark conflicts with global `AppHeader` `<header>`; prior-confirmed PS-2/GD-9/MD-6/AG-1; felt F-F05 (`mainCount === 2` on `/`; critical) + felt F-F50 (`mainCount === 2` on `/compare/:a/:b`; critical); **scope correction from felt:** `/agenda` landmark-one-main RESOLVED (F-F43) and `/games/:id` passes (F-F12) — remaining failure routes are `/` and `/compare/:a/:b` | design | major |
| F-07 | H-A11Y04 | `FactionDot.tsx:9-24` bare `<span>` with background color only; no `aria-label`, `title`, or `aria-hidden`; used standalone (color-only) in `VpRaceSection.tsx:288`, `PlanetControlSlideshow.tsx:211`, and other call sites; faction identity conveyed through color alone; prior-confirmed PS-3/GD-17/SH-5 | design | major |
| F-08 | H-A11Y08, H-A11Y04, H-TY02 | `StrategyCardSection.tsx:151-158` PickRateHeatmap cells expose data only via hover `title` attribute (not accessible on touch or screen reader; does not satisfy SC 4.1.2); numeric label present but at `fontSize: 9` (below floor); prior-confirmed PS-4/MD-4/MD-5 | design | major |
| F-09 | H-RS03, H-RS11 | Measured: stacked header chrome (masthead + site nav + section nav + round scrubber) occupies **~290 of 730px ≈ ~40%** of desktop viewport before any game content (M4); felt F-F06: scroll-container starts at y=305 in 617px viewport → **49.4% of viewport is chrome before any content renders** at desktop 1268px — script's H-RS03 budget is ~8%, this is ~6× over; owner: "With how much real estate the frozen header takes up (especially when at mobile phone widths) it all just gets gross and kind of a meh reading experience"; H-RS11 (harmful below ~8:1 mobile) and H-RS03 (≤48–56px/~7–8% vh) are violated at desktop; mobile exact figure remains unmeasured; `app/src/features/game-detail/FrozenHeader.tsx` | design | critical |
| F-10 | H-A11Y01 | `HomePage.tsx` still fails `color-contrast: FAIL` in Lighthouse post-fix — `textDecoration: none` was removed (a23e486) but a contrast issue on another element persists; different element from F-01 (home score 90 post-fix, color-contrast count unchanged); HM-1 | design | major |
| F-11 | NONE | `PlanetControlSlideshow.tsx:33,41` and `ComparePage.tsx:204` — `setState` called synchronously inside `useEffect` (3 instances); causes cascading double-render; prior-confirmed CR-1/GD-8. **NO-HEURISTIC:** canon contains no heuristic for React lifecycle anti-patterns (setState-in-useEffect); canon gap is a missing H-REACT or H-PERF bank covering component correctness / performance anti-patterns. | arch | major |
| F-12 | H-ARCH02, H-ARCH01 | `AppHeader.tsx` (shared layer) imports `features/upload/UploadPage` directly at line 5 — bypasses feature barrel AND violates shared→features upward import; `AppHeader` has taken on two responsibilities: navigation chrome and upload drawer; Task 8 god-files §5 | arch | major |
| F-13 | H-RS06 | `AgendaPage.tsx:85-159` outer App `<main>` has `overflow: hidden` (`App.tsx:49` sets `minHeight: 0, overflow: 'hidden'`) — `position: sticky` within sub-components silently degrades to `position: relative`; AG-1; **canon note (felt F-F09):** nothing on the game-detail page uses `position: sticky` — chrome is structural-outside-scroller; sticky-breakage canary is N/A for the game-detail FrozenHeader; this finding still applies for any component that DOES try sticky positioning | design | minor |
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
| F-29 | H-IA10 | Recap section shows 10 "+ N more" truncation indicators, each hiding 2–6 items; owner: "We cut off the names of the objectives scored by faction instead of just having a better design for when the page is shrinking horizontally." Claude probe: truncation chosen over responsive reflow. Evidence: felt F-F13 + owner verbatim | design | major |
| F-30 | H-IA12 | VP Race chart is 1184×592 px rendered inside an inner scroll container ~312 px tall — chart is 2× the container height; owner: "I can't see the top and bottom of the chart at once in any view." Evidence: felt F-F17 + owner verbatim | design | critical |
| F-31 | H-IA07, H-IA11 | Timeline section scrollHeight 11,995 px in 360 px container (~33 viewport-heights of scrolling); no `aria-expanded`, `<details>`, or accordion DOM present; owner: "Being able to expand by Round would be a huge benefit just to the overall page size, but there's so much better UI/UX that can be done here." Evidence: felt F-F20 + owner verbatim | design | major |
| F-32 | H-DV01 | Dashboard "Player Dossiers" section: upper-left occupied by masthead editorial chrome instead of key per-faction stat (F-F21); widest element 1216 px vs 1184 px viewport — 32 px horizontal overflow; faction panels alternate 658 px / 333–358 px heights in a single horizontal row, not a card grid (F-F24); owner: "Just ugly… not card-based, just keeps stretching horizontally forever, and feels out of line with the rest of the design." Evidence: felt F-F21 (major) + felt F-F24 (major) | design | major |
| F-33 | H-DV03 | `/meta` Factions tab has 37 unique brand-color hues onscreen at once — well over the 7-hue comfort ceiling defined by H-DV03; owner: "overall lack of consistency across this page as things have been done in pockets of improvements." Evidence: felt F-F33 (major) | design | major |
| F-34 | H-IA07 | `/meta` scrollHeight 10,219 px / clientHeight 524 px → 19.5× scroll multiples across all tabs; owner: "We have some spaces where the page doesn't use up all the available space, and others where it uses it up too liberally." Evidence: felt F-F34 (major) + owner verbatim | design | major |
| F-35 | H-IA07, H-IA08 | `/agenda` scrollHeight 33,334 px / clientHeight 631 px → 52.8× scroll multiples (deepest in the app); missing agenda law text requires encyclopedic knowledge of agendas to parse; faction voting patterns are unparseable; Resolution Record connection to bar graphs is misaligned; owner: "The faction voting patterns is totally useless due to impossibility of parsing." + "We also don't have the actual text represented here at all, which makes an encyclopedic knowledge of the agendas required to parse this page." Evidence: felt F-F46 (critical) + owner verbatim | design | critical |
| F-36 | H-A11Y09 | FrozenHeader section-nav: 7 buttons each 34 px tall (above 24 px floor) but **adjacent buttons sit at 0–1 px gaps** — RECAP ends x=168, VP RACE starts x=169; TIMELINE-DASHBOARD gap 0 px at x=338; spacing-circle (24 px) test fails on every adjacent pair; round scrubber chips 32×24 px at height minimum with 2 px gaps; Evidence: felt F-F07 (major) | design | major |
| F-37 | H-A11Y10 | FrozenHeader section-nav: focused RECAP button computed `outline-style: none`, `box-shadow: none`; browser default focus outline suppressed, no replacement; keyboard-tab verification by owner still recommended; Evidence: felt F-F08 (major probable) | design | major |
| F-38 | H-A11Y06 | Game-detail Agenda section: voting UI rendered as `<div>` bars, not `<table>` element; `th-scope` test is moot but screen readers cannot navigate voting data as a data table; Evidence: felt F-F30 (minor) | design | minor |
| F-39 | H-DV05 | PickRateHeatmap on `/meta` Strategy tab does not render as a colored heatmap — only 2 colored cells detected; pick rate conveyed via text/numbers in a 9×33 grid; H-DV05 sequential-palette test is N/A — heat encoding is structurally absent; this is the absence of visual encoding, not a palette choice failure; Evidence: felt F-F35 (info / canon update) | design | info |
| F-40 | H-DV09 | Tech section treemap: 34 SVGs (small multiples — good architecture) but **186 of 205 `<rect>` elements have shorter dim < 24 px**, some as small as 2.8×10.4 px; labels in those cells almost certainly unreadable or clipped; owner: "lack of consistency across this page" (cross-block); Evidence: felt F-F39 (major) | design | major |
| F-41 | H-TY08 | Prose line-length violations: (1) `/` welcome blurb ~85 chars/line at 658 px container — ~5 chars over 80-char ceiling, well above 45–75 sweet spot (F-F02, minor instance); (2) `/agenda` longest prose line ~110 chars — over WCAG 1.4.8 80-char ceiling and well above 45–75 sweet spot (F-F44, major instance; owner: "This tab just feels incomplete… needs an overhaul from top to bottom in my opinion"); Evidence: felt F-F02 (minor) + felt F-F44 (major) | design | major |

---

## Felt findings (Task 6 — Cowork, merged)

Task 6 Cowork walkthrough output is fully integrated above. Summary of how felt rows were handled:

**Corroborations applied (4):**
1. **F-09 ← F-F06** (frozen-header 49.4% viewport): bumped from major → **critical**; felt provides the quantified desktop measurement that was deferred from M4.
2. **F-06 ← F-F05 + F-F50** (`<main>` duplication scope correction): scope narrowed to `/` and `/compare/:a/:b`; `/agenda` RESOLVED (F-F43) and `/game` passes (F-F12); severity stays major.
3. **F-02 ← F-F16 + F-F28** (SVG effective font size): felt found effective rendered height above 12 px due to viewBox scaling; static M2 (7px nominal) still stands; flag added: `triangulation-tension: re-measure effective vs nominal in Stage 2`.
4. **F-40 ← F-F39** (treemap rects <24px): no existing H-DV09 finding existed; added as net-new F-40 (see §Net-new findings above).

**Net-new felt-only findings (13):**
F-29 through F-41 — see ledger rows above.

**Resolved findings (per felt evidence):**
- `/agenda` `landmark-one-main` RESOLVED (F-F43) — previously flagged in F-06 scope.
- `/agenda` `td-has-header` RESOLVED (F-F45) — was in Excluded section.

---

## No-heuristic findings

| Finding | Summary | Canon gap — what heuristic is missing |
|---|---|---|
| **F-11** (NONE) | `setState` called synchronously inside `useEffect` in 3 component files, causing cascading double-render | Canon has no heuristic covering React lifecycle correctness or component-level performance anti-patterns. A missing **H-REACT** (or H-PERF) bank would cover: setState-in-useEffect, stale closure captures, unguarded effect dependencies, and memo/callback overuse. |

**F-11 retained NO-HEURISTIC by owner ruling (code-correctness, out of design-canon scope).**

**Canon gap resolved:** F-29, F-30, F-31, F-34, F-35 have been remapped to H-IA heuristics following integration of Bank IA (H-IA01–H-IA14) into the canon (canon now 69 heuristics).

---

## Felt — unverified follow-ups (not findings)

These felt rows were marked `unverified` during the walkthrough; they require a follow-up inspection before becoming findings. They are recorded here for Stage 2 targeting.

| F-F# | H-* | What still needs checking |
|---|---|---|
| F-F15 | H-DV11 | Verify gridline weight is subordinate to VP Race data lines; confirm single bolded VP=0 baseline |
| F-F18 | H-DV02 | Audit Timeline event-row borders/background fills for chartjunk (data-ink ratio) |
| F-F22 | H-TY10 | Measure Dashboard type-size hierarchy in detail |
| F-F23 | H-DV13 | Visually inspect Dashboard faction color dominance / perceptual weight balance |
| F-F36 | H-DV07 | Inspect PickRateHeatmap row/column sort order — is sort by meaningful quantity or alpha? |
| F-F40 | H-DV02 | Audit Tech treemap small-multiples for chartjunk / data-ink ratio |
| F-F42 | H-TY03 | Inspect Stats tab for column digit alignment (tabular-nums) |
| F-F48 | H-DV08 | Assess slope/ranked-change chart appropriateness on Compare page |

---

## Owner synthesis (Task 6 wrap-up)

Verbatim from the Cowork session wrap-up — recorded for owner decision; the aesthetic constraint (newspaper/almanac direction) is NOT changed by this note.

**Most surprising find.** "I forgot how much the pops of color that I had recently added to the /meta page kind of helped with legibility. The true 'newspaper' vibe is maybe getting in the way a bit of a 'modern' UI."

**Most effortful moment.** "Extracting information everywhere still feels like a little bit of a chore."

**Screens that felt genuinely solid.** "The Comparison VP charts side by side kind of felt good. The Mecatol Tracker is also pretty solid. I do have ideas for improvements, but it's one of the better pieces so far. The Round Tracker is also pretty good, even if it fails the same overall UI pieces as the rest of the app."

> **Escalation note:** The "newspaper vibe vs modern UI" quote is the owner's live reaction to the `/meta` color pops — this represents a potential aesthetic tension between the frozen newspaper/almanac direction and the lived UX value of color contrast. No action taken on the aesthetic constraint; recorded here for owner decision at V1.3b design review.

---

## Excluded (already fixed — commit a23e486)

The following Task 7 "Already-fixed" items are confirmed in code and excluded from findings:
- `firebase.json` Cache-Control immutable header for hashed assets
- `index.html` non-blocking font preload + `<meta name="description">` + robots.txt ref
- `public/robots.txt` added
- `App.tsx` `<div>` wrapper around `<Routes>` replaced with `<main>` (partial fix — duplicates persist on `/` and `/compare/:a/:b`; see F-06)
- `FactionVotingPanel.tsx` `scope="col"/"row"` added to `<th>` (partial — `/agenda` `td-has-header` now confirmed RESOLVED per felt F-F45)
- `HomePage.tsx` `textDecoration: none` removed from inline links (F-10 tracks the remaining contrast failure on that route)
- `AppHeader.tsx` auth buttons changed from `--ink-4` to `--ink-3` (contrast fix incomplete — F-01)
- `FilterBar.tsx` `aria-label={dropdownLabel}` added to `<select>` on `/meta`; `/game` route `select-name` may still be flagged for a second unlabeled `<select>`

---

## Summary

| Metric | Count |
|---|---|
| **Total findings (F-01 → F-41)** | **41** |
| Critical | 6 |
| Major | 17 |
| Minor | 15 |
| Info | 3 |
| **By track — design** | **29** |
| **By track — arch** | **12** |
| Findings whose ONLY heuristic is informational (`[informational-basis]`) | 1 (F-25, H-TY04 only) |
| No-heuristic findings (`NONE`) | 1 (F-11 only — retained by owner ruling, code-correctness out of design-canon scope) |
| Felt corroborations applied (no new F-nn) | 3 (F-09 bumped critical, F-06 scope corrected, F-02 triangulation noted) |
| Net-new felt-only findings (new F-nn) | 13 (F-29..F-41) |
| Unverified felt follow-ups (not findings) | 8 (F-F15, F-F18, F-F22, F-F23, F-F36, F-F40, F-F42, F-F48) |

**Critical findings breakdown (6):**
1. F-01 — Auth button contrast unresolved post-fix
2. F-02 — SVG chart text 7px nominal (triangulation-tension on effective size)
3. F-03 — Default font scale ships every surface ~15% below its own floor
4. F-09 — Frozen header consumes 49.4% of desktop viewport (owner-confirmed felt)
5. F-30 — VP Race chart 2× its scroll-container height (chart unconstrained in inner scroller)
6. F-35 — /agenda 52.8× scroll multiples + missing law text + unparseable voting matrix

**Canon gaps:** The H-ARCH bank covers module structure but not React lifecycle/component correctness (F-11 → missing H-REACT/H-PERF; retained NONE by owner ruling). Bank IA (H-IA01–H-IA14) has been integrated into the canon (2026-05-18); canon now 69 heuristics. F-29, F-30, F-31, F-34, F-35 remapped to H-IA heuristics — Information-Architecture gap resolved.

---

## Grep verification (pre-write self-check)

Self-verified before write (post-Task 6 merge):
- Pattern `^\| F-[0-9]` → **41 rows** (F-01 through F-41).
- Pattern `^\| F-[0-9].*\| (H-(TY|DV|RS|A11Y|ARCH)[0-9]|NONE)` → **41 rows** (every finding row carries a heuristic cell or explicit NONE).
- Pattern `^\| H-(TY|DV|RS|A11Y|ARCH)[0-9]` in canon → **55 rows** (unchanged).
- Equal: **Y**

Updated post-Bank IA integration (2026-05-18):
- Pattern `^\| H-(TY|DV|RS|A11Y|ARCH|IA)[0-9]` in canon → **69 rows** (14 H-IA rows added).
- F-29/F-30/F-31/F-34/F-35 remapped from NONE to H-IA heuristics; F-11 remains NONE.
- NONE count: **1** (F-11 only).

---

## Top 5 critical findings

1. **F-09** Frozen header chrome consumes 49.4% of desktop viewport (felt-confirmed); ~6× over the H-RS03 budget; mobile measurement still pending but structurally far worse.
2. **F-35** /agenda is the worst-performing page in the app: 52.8× scroll multiples, missing agenda text, unparseable voting matrix, misaligned resolution record.
3. **F-30** VP Race chart is 2× the height of its scroll container — the primary visualization on the chart-centric section cannot be seen without scrolling within an inner scroller.
4. **F-01** Auth button contrast unresolved post-fix — all 4 Lighthouse routes still fail `color-contrast`.
5. **F-03** Default font scale ships every scaled surface ~15% below the 14px floor before the user touches anything — invisible to static review, caught only by measurement.
