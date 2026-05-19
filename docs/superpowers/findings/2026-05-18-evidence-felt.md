# 2026-05-18 — Evidence (Felt) — TI4 Hall of Records UX Walkthrough

> **Task 6 completed output** — mode: Cowork-guided; phone-width measurement (H-RS03) approximated from desktop chrome ratios per the note below. This file replaces the scaffold; all 51 rows are the authoritative Cowork output.

**App:** https://ti4-hall-of-records-da562.web.app
**Session mode:** Cowork-driven (Claude navigated, owner reacted live). Phone-width measurement (H-RS03) approximated from desktop chrome ratios — extension hit Chrome window-width minimum.

> **Note on F-F numbering:** The walkthrough script said `F-F##` IDs are fixed by the scaffold. The session was run without filesystem access to the scaffold, so the IDs below are sequential (F-F01 → F-F##). Renumber against the actual scaffold when pasting in; preserve the H-* IDs and Block numbers as-is.

---

## Evidence table

| ID    | H-ID      | Block | Owner verbatim reaction (and Claude tech-probe note where relevant) | Severity |
|-------|-----------|-------|----------------------------------------------------------------------|----------|
| F-F01 | H-DV01    | Block 1 | "the homepage of the Games Tab is overall fine from my POV. It's the more lightweight of all the pages." Claude probe: upper-left occupied by prose welcome blurb, not a key data number. | info |
| F-F02 | H-TY08    | Block 1 | (No verbatim — see F-F01.) Claude probe: welcome blurb renders ~85 chars/line at 658 px container width — ~5 chars over the 80-char ceiling, well over the 45–75 sweet spot. | minor |
| F-F03 | H-A11Y04  | Block 1 | (No verbatim — see F-F01.) Claude probe: game cards label factions with text names (e.g., "Barony of Letnev ✦12") and a ✦ winner glyph; color is not the sole identifier. | info |
| F-F04 | H-RS03    | Block 1 | (No verbatim — see F-F01.) Claude probe: zero sticky/fixed top chrome on `/`; phone-width measurement unobtainable here (no chrome to measure). | info |
| F-F05 | H-A11Y07  | Block 1 | (Out-of-scope bonus.) Claude probe: `document.querySelectorAll('main').length === 2` on `/`. Two `<main>` landmarks on the home page — same shape as the canon's other-route flag. | critical |
| F-F06 | H-RS03    | Block 2 | "With how much real estate the frozen header takes up (especially when at mobile phone widths) it all just gets gross and kind of a meh reading experience." Claude probe: scroll-container starts at y=305 in a 617 px viewport → **49.4% of viewport is chrome before any content renders** at desktop 1268 px. Script's budget is ~8%. ~6× over. This is the F-09 deliverable. | critical |
| F-F07 | H-A11Y09  | Block 2 | (No keyboard test from owner this session.) Claude probe: 7 section-nav buttons each 34 px tall (above 24 px floor) but **adjacent buttons sit at 0–1 px gaps** — RECAP ends x=168, VP RACE starts x=169; TIMELINE-DASHBOARD touch at x=338. Spacing-circle (24 px) test fails on every adjacent pair. Round scrubber chips 32×24 at the height minimum with 2 px gaps. | major |
| F-F08 | H-A11Y10  | Block 2 | (Owner did not perform keyboard Tab test this session — recommended follow-up.) Claude probe: focused RECAP button computed `outline-style: none`, `box-shadow: none`. Browser default focus outline suppressed and no obvious replacement; `:focus-visible` not perfectly simulatable via JS. | major (probable) |
| F-F09 | H-RS06    | Block 2 | (No verbatim — see F-F06.) Claude probe: **nothing on the page is `position: sticky`.** Chrome stays visible by being structurally outside an inner scroll container. Sticky-breakage canary not applicable. Also: script assumes round scrubber sits below FrozenHeader; actual order is scrubber (y=224) ABOVE section nav (y=270). | info (canon clarification needed) |
| F-F10 | H-DV12    | Block 3 | "We cut off the names of the objectives scored by faction instead of just having a better design for when the page is shrinking horizontally." Claude probe: faction final-score callouts large (27.2 px IBM Plex Mono), readable with VP context. Stat callouts themselves pass. | info |
| F-F11 | H-TY03    | Block 3 | (No verbatim — owner complaint was truncation, not column alignment.) Claude probe: scores use IBM Plex Mono so digit widths align inherently without explicit `tabular-nums`. | info |
| F-F12 | H-A11Y07  | Block 3 | (No verbatim.) Claude probe: 1 `<main>` landmark on `/games/:id`. Passes. | info |
| F-F13 | (bonus)   | Block 3 | "We cut off the names of the objectives scored by faction instead of just having a better design for when the page is shrinking horizontally." Claude probe: **10 "+ N more" truncation indicators on Recap, hiding 2–6 items each.** Truncation chosen over responsive reflow. | major |
| F-F14 | H-DV04    | Block 4 | "I hate almost everything about this chart. It's the most legible thing in here, but to the point that I can't see the top and bottom of the chart at once in any view." Claude probe: VP Race uses a separate legend below chart (6 factions); no direct line-terminal labels. With 6 series the script prefers direct labeling — borderline acceptable, light cross-referencing cost. | minor |
| F-F15 | H-DV11    | Block 4 | (No specific verbatim.) Claude probe: not deeply inspected. Recommended follow-up: verify gridline weight subordinate to data lines, single bolded VP=0 baseline. | unverified |
| F-F16 | H-TY02    | Block 4 | (No specific verbatim.) Claude probe: SVG viewBox is 0 0 400 200, rendered at 1184×592; 7 px CSS font renders at ~27 px effective height. Above 12 px floor. | info |
| F-F17 | (bonus)   | Block 4 | "I can't see the top and bottom of the chart at once in any view." Claude probe: chart is 1184×592 px in an inner scroll container ~312 px tall — **chart is 2× the container height**. User must scroll within the inner scroller to see the full chart. | critical |
| F-F18 | H-DV02    | Block 5 | (No specific verbatim — see F-F19.) Claude probe: not deeply inspected. Recommended follow-up: audit event-row borders/background fills for chartjunk. | unverified |
| F-F19 | H-A11Y04  | Block 5 | "Just a long section." (Timeline) Claude probe: each event row uses a ◆ glyph plus text type label (e.g., "Stage I · Round 1") — secondary visual channels beyond color present. | info |
| F-F20 | (bonus)   | Block 5 | "Being able to expand by Round would be a huge benefit just to the overall page size, but there's so much better UI/UX that can be done here." Claude probe: timeline scrollHeight 11,995 px in 360 px container — **~33 viewport-heights of scrolling**. No `aria-expanded`, `<details>`, or accordion DOM present — collapse-by-round mechanism is absent. | major |
| F-F21 | H-DV01    | Block 6 | "Just ugly… not card-based, just keeps stretching horizontally forever, and feels out of line with the rest of the design." Claude probe: upper-left of Dashboard is the masthead "FINAL EDITION / The Galactic Chronicle / THE FINAL TALLY · ROUND 6" — editorial chrome, not a key per-faction stat. | major |
| F-F22 | H-TY10    | Block 6 | (No specific verbatim — see F-F21.) Claude probe: size hierarchy not measured in detail. Recommended follow-up. | unverified |
| F-F23 | H-DV13    | Block 6 | (No specific verbatim.) Claude probe: faction color dominance not visually inspected. Recommended follow-up. | unverified |
| F-F24 | (bonus)   | Block 6 | "isn't card-based, just keeps stretching horizontally forever." Claude probe: widest element 1216 px vs 1184 px viewport — 32 px horizontal overflow. Faction panels alternate 658 px / 333–358 px heights in a single horizontal row, not a card grid. | major |
| F-F25 | H-RS01    | Block 7 | (No specific verbatim.) Claude probe: at desktop 1268 px, `bodyHorizScroll: false`, no internal horizontal scrollers. 320 px narrow-width test unobtainable via extension (Chrome window minimum). | info (desktop) / unverified (narrow) |
| F-F26 | H-TY03    | Block 7 | (No specific verbatim.) Claude probe: no `<table>` elements in Planets section; tabular alignment N/A. | info |
| F-F27 | H-DV06    | Block 8 | (No specific verbatim.) Claude probe: Tech section uses 1 large 1184×592 SVG (single overlay chart) — for the question "how does each faction's tech path differ?" small multiples would be preferred. Chart-form vs question mismatch. | minor |
| F-F28 | H-TY02    | Block 8 | (No specific verbatim.) Claude probe: same SVG-scaling pattern as VP Race; effective font sizes above 12 px floor. | info |
| F-F29 | H-DV04    | Block 9 | (No specific verbatim.) Claude probe: 119 direct faction-name labels next to voting bars on Agenda section. Direct labeling present. | info |
| F-F30 | H-A11Y06  | Block 9 | (No specific verbatim.) Claude probe: no `<table>` element — agenda voting rendered as `<div>` bars. `th-scope` test moot, but div-based "table" lacks semantic table markup; screen readers cannot navigate as a data table. | minor |
| F-F31 | H-DV01    | Block 10 | "I've put a lot of polish into this page already so it's got some improvements to it, but it still feels endlessly long and the navigation is subpar to get around quickly within a section." | major |
| F-F32 | H-A11Y04  | Block 10 | (See F-F31 / F-F33.) Claude probe: faction text labels alongside color dots present; color is not sole identifier. | info |
| F-F33 | H-DV03    | Block 10 | "overall lack of consistency across this page as things have been done in pockets of improvements." Claude probe: 37 unique brand-color hues onscreen at once — well over the 7-hue comfort ceiling. | major |
| F-F34 | (bonus)   | Block 10 | "We have some spaces where the page doesn't use up all the available space, and others where it uses it up too liberally." Claude probe: `/meta` scrollHeight 10,219 px / clientHeight 524 px → 19.5× scroll multiples across all tabs. | major |
| F-F35 | H-DV05    | Block 11 | (Cross-block reaction in F-F31.) Claude probe: **PickRateHeatmap does not render as a colored heatmap** — only 2 colored cells detected; pickrate conveyed via text/numbers in a 9×33 grid. Script's H-DV05 (sequential palette test) is N/A — heat encoding is absent. Canon should be updated. | info (canon update) |
| F-F36 | H-DV07    | Block 11 | (No specific verbatim.) Claude probe: row/column sort order not directly inspected. Recommended follow-up. | unverified |
| F-F37 | H-A11Y09  | Block 11 | (No specific verbatim.) N/A — no colored heatmap cells exist as tap targets. | info |
| F-F38 | H-TY02    | Block 11 | (No specific verbatim.) Claude probe: no cell numeric labels in a colored heatmap to measure. Canon's 9 px risk did not surface here because the encoding shape is different. | info |
| F-F39 | H-DV09    | Block 12 | "lack of consistency across this page" (cross-block, F-F31). Claude probe: **34 SVGs (small multiples — good architecture) but 186 of 205 `<rect>` elements have shorter dim < 24 px**; some as small as 2.8×10.4. Labels in those cells almost certainly unreadable or clipped. | major |
| F-F40 | H-DV02    | Block 12 | (No specific verbatim.) Claude probe: not deeply inspected for chartjunk. Recommended follow-up. | unverified |
| F-F41 | H-DV14    | Block 13 | (Cross-block reaction in F-F31.) Claude probe: 34 mini-charts ~56×14 px with 5–7 bins each. With 8 games in dataset, √8 ≈ 2.8 → 3 bins is target. 5–7 bins over-fragments distributions. | minor |
| F-F42 | H-TY03    | Block 13 | (No specific verbatim.) Claude probe: not deeply inspected for column digit alignment on Stats tab. Recommended follow-up. | unverified |
| F-F43 | H-A11Y07  | Block 14 | (See F-F44.) Claude probe: 1 `<main>` landmark on `/agenda`. Canon's previously-flagged `landmark-one-main: FAIL` post-fix appears **resolved**. | info |
| F-F44 | H-TY08    | Block 14 | "This tab just feels incomplete… needs an overhaul from top to bottom in my opinion." Claude probe: longest prose line ~110 characters — over WCAG 1.4.8 80-char ceiling and well above 45–75 sweet spot. | major |
| F-F45 | H-A11Y06  | Block 14 | (See F-F44.) Claude probe: 1 `<table>`, 41 `<th>` elements **all with `scope` attribute**, 256 `<td>` elements, 0 `td-has-header` failures. Canon's flagged failure on this route **resolved**. | info |
| F-F46 | (bonus)   | Block 14 | "The faction voting patterns is totally useless due to impossibility of parsing." Plus: "We also don't have the actual text represented here at all, which makes an encyclopedic knowledge of the agendas required to parse this page." Plus: "Resolution Record is halfway to helpful, but it still feels like the connection to the bar graphs for each one and the 'Passes N/N' [is misaligned]." Claude probe: `/agenda` scrollHeight 33,334 px / clientHeight 631 px → **52.8× scroll multiples (deepest in the app)**. | critical |
| F-F47 | H-DV06    | Block 15 | "This page is also pretty solid, but just light on insights." Claude probe: 2 paired SVGs at identical 312×120 dimensions — true small multiples at consistent scale. | info |
| F-F48 | H-DV08    | Block 15 | (No specific verbatim.) Claude probe: slope/ranked-change chart appropriateness not directly inspected. Recommended follow-up. | unverified |
| F-F49 | H-RS12    | Block 15 | (No specific verbatim.) Claude probe: `bodyHorizScroll: false` at desktop 1268 px. 375 px narrow-width test unobtainable via extension. | info (desktop) / unverified (narrow) |
| F-F50 | H-A11Y07  | Block 15 | (Out-of-scope bonus, mirrors F-F05.) Claude probe: `mainCount === 2` on `/compare/:a/:b`. Same `<main>` duplication bug as `/`. | critical |
| F-F51 | (bonus)   | Block 15 | "I don't hate anything about this page besides the overall kind of meh attitude about the way information is given." Claude probe: scrollMultiples 2.6× — by far the most contained page on the app. | info |

---

## Wrap-up — owner synthesis

**Most surprising find.** "I forgot how much the pops of color that I had recently added to the /meta page kind of helped with legibility. The true 'newspaper' vibe is maybe getting in the way a bit of a 'modern' UI."

**Most effortful moment.** "Extracting information everywhere still feels like a little bit of a chore."

**Screens that felt genuinely solid.** "The Comparison VP charts side by side kind of felt good. The Mecatol Tracker is also pretty solid. I do have ideas for improvements, but it's one of the better pieces so far. The Round Tracker is also pretty good, even if it fails the same overall UI pieces as the rest of the app."

---

## Triage priority list for V1.3b (derived from criticals + majors)

1. **Frozen-header chrome budget (F-F06, F-09)** — 49% of desktop viewport eaten before content; almost certainly worse at phone width. Highest-leverage single fix.
2. **`<main>` landmark duplication (F-F05, F-F50)** — present on `/` and `/compare/:a/:b`. Easy a11y fix; same root cause.
3. **Recap truncation pattern (F-F13)** — "+ N more" hides 2–6 items per instance, 10 instances. Replace with responsive reflow.
4. **VP Race chart oversize (F-F17)** — 2× the inner scroll-container height. Constrain or make resizable.
5. **Timeline collapse-by-round (F-F20)** — 33× scroll multiples + no fold mechanism. Add accordion-by-round.
6. **Dashboard horizontal stretch / style incoherence (F-F21, F-F24)** — break "Player Dossiers" into a card grid matching the rest of the design language; eliminate 32 px overflow.
7. **/meta consistency pass (F-F31, F-F33, F-F34)** — 19.5× scroll multiples per tab, 37 colors at once, polish in pockets. Standardize the elements that already work.
8. **/agenda overhaul (F-F44, F-F46)** — 52.8× scroll multiples, missing law text, useless voting matrix, partial resolution record. Biggest-scope rework.
9. **Tap-target spacing on FrozenHeader section nav (F-F07)** — 0–1 px gaps fail the 24 px spacing-circle test for touch.
10. **Tech treemap micro-cells (F-F39)** — 186/205 rects below 24 px shorter-dim. Suppress labels or replace with tooltips below the threshold.
11. **Focus ring on section nav (F-F08)** — owner keyboard-tab verification still needed; computed style suggests no visible ring.
12. **Stats over-binning (F-F41)** — 5–7 bins on an 8-game dataset; reduce to ~3.
13. **VP Race direct labels (F-F14)** — minor cross-reference cost; could elevate from legend to terminal labels.
14. **Tech section chart form (F-F27)** — single overlay where small multiples better fit the question.
15. **Game-detail Agenda semantic markup (F-F30)** — `<div>` bars should be a real `<table>` for screen-reader navigation.

---

## Canon update suggestions (for the next round of the script)

- `/meta` tabs now include a **PACE** tab not listed in the original Block 10–13 enumeration.
- Game-detail header order: **round scrubber sits ABOVE section nav**, not below as currently described in Block 2.
- Game-detail page chrome uses **structural-outside-the-scroller architecture, not `position: sticky`**. H-RS06 (sticky-breakage canary) does not apply.
- PickRateHeatmap on `/meta` Strategy tab **does not currently use heat coloring** — pickrate is conveyed via text/numbers. H-DV05's sequential-palette test is moot. Either rename the component reference or update the H-DV05 expectation.
- `landmark-one-main: FAIL` and `td-has-header: FAIL` on `/agenda` both appear **resolved** as of this session. The same `landmark-one-main` bug surfaced on `/` and `/compare/:a/:b` — those routes are the remaining locations.
