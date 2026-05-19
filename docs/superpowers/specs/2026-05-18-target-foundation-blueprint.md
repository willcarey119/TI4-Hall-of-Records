---
title: "Target Foundation Blueprint — TI4 Hall of Records Front-End"
date: 2026-05-18
status: "Stage 2 complete — pending owner approval"
reads-as-one-artifact-with:
  - ../research/2026-05-18-research-canon.md
  - ../findings/2026-05-18-findings-ledger.md
  - ../findings/2026-05-18-inspirations-register.md
  - ../findings/2026-05-18-stage1-decisions.md
---

# Target Foundation Blueprint — TI4 Hall of Records Front-End

**Date:** 2026-05-18
**Stage:** Stage 2 (convergence). Produced from the Stage 0 canon ∩ Stage 1 evidence.
**Status:** Draft for owner approval. Execution is downstream (reshaped ROADMAP).
**Inputs:** `2026-05-18-frontend-foundation-review-design.md` §4 · `2026-05-18-research-canon.md` (69 heuristics) · `2026-05-18-findings-ledger.md` (F-01..F-41) · `2026-05-18-inspirations-register.md` · `2026-05-18-stage1-decisions.md` · `2026-05-18-evidence-architecture.md`

---

## Scope reminder (read before any rule)

1. **Data layer is frozen.** Firebase/Firestore + `src/adapters/` and the parser/`src/lib/` TDD discipline are constraints, not subjects. No rule here re-platforms or re-shapes data flow.
2. **Newspaper/almanac identity is frozen; legibility execution is a sanctioned design axis.** Per spec §2's 2026-05-18 amendment and Stage 1 Decision 1 (HYBRID): mastheads, editorial voice, serif display, almanac framing stay. Color-coding, density control, and progressive disclosure are sanctioned *system elements*, not aesthetic violations.
3. **This is a blueprint, not an implementation.** §4.4 is a high-level strangler outline only — no file-level steps. Turning this into code is a downstream spec→plan→implement cycle.
4. **Every rule cites why + where.** Each rule ends with `[why: H-*]` (Stage 0 source) + `[where: F-*]` (Stage 1 evidence) and optional `[INSP:Name]`. No rule sole-rests on an `(informational)` heuristic; no rule is an orphan (every rule resolves ≥1 finding — proven in §4.3).

---

# §4.1 — Design System Spec

## STEP 1 — Why these categories, why this depth (anti-pigeonhole gate)

This gate is written *before* any category rule. Each candidate category gets an explicit verdict: **load-bearing here? (yes/no)** · **driven by which H-\*/F-\*** · **depth (deep / light / scoped-out)**. Typography is held to the same evidence bar as every other category — it is **not** privileged by the historical "font fight." The single largest evidence cluster is information architecture / page-length (H-IA), which receives the deepest treatment, by evidence, not by symptom volume.

### Candidate category verdicts

| # | Candidate category | Load-bearing? | Driven by | Depth | Rationale |
|---|---|---|---|---|---|
| C1 | **Information architecture / page-length & progressive disclosure** | **YES** | H-IA05, H-IA07, H-IA09, H-IA10, H-IA11, H-IA12, H-IA14 / F-29 F-30 F-31 F-34 F-35 (incl. 2 critical) | **DEEP** | Largest convergent failure cluster in Stage 1 (Decision 2 added the H-IA bank for exactly this). Measured scroll multiples 19.5× (/meta), 33× (Timeline), **52.8× (/agenda)**; truncation-over-reflow; chart 2× its scroll container. This is the #1 felt symptom ("extracting information everywhere is a chore") rendered as measurements. Deepest treatment is evidence-earned. |
| C2 | **Type scale & register** | **YES** | H-TY02, H-TY03, H-TY04 [informational-basis — see note], H-TY10, H-TY08 / F-02 F-03 F-04 F-05 F-25 F-28 F-41 | **DEEP** | Real but **not exclusive** evidence. F-03 (`--font-scale: 0.85` → 11.9px body, every scaled surface ~15% below its own floor) is hard and uncontested. F-04/F-05 (9px heatmap labels) are hard. F-02 is **contested** (nominal 7px vs ~27px effective via viewBox scaling) — its rule is a re-measure gate, not a px fix. F-28 is a positive control (32.3px headings are healthy) → the scale's *top* is fine; depth is concentrated at the floor + register, not the display end. Depth earned, but bounded to floor/register/numeric-alignment — the scale ratio itself is `(informational)` and scoped to a validate-in-remediation default. |
| C3 | **Color & semantic tokens** | **YES** | H-A11Y01, H-A11Y04, H-DV03, H-DV13 [informational] / F-01 F-07 F-10 F-15 F-16 F-17 F-18 F-33 | **DEEP** | Two strands converge here: (a) hardcoded-hex drift (F-15..F-18 — 40+ literals across 5+ components, same semantic pairs duplicated independently) → token system + enforcement (enforcement lives in §4.2); (b) contrast + color-as-sole-channel failures (F-01 auth button critical, F-07 FactionDot, F-10 home) → semantic-token contract with verified pairings. F-33 (37 hues onscreen at once) makes the categorical-palette ceiling load-bearing. The HYBRID decision sanctions "pops of color for legibility" — this category is where that is systematized rather than ad-hoc. |
| C4 | **Data-visualization system** | **YES** | H-DV01, H-DV04, H-DV09, H-DV05 [informational], H-DV11 / F-30 F-32 F-39 F-40 | **DEEP** | The slope/line/heatmap/treemap/histogram family is a primary surface and Stage 1 found comprehension failures across it: F-32 (dashboard upper-left occupied by chrome not the key stat; horizontal-stretch non-grid), F-39 (PickRateHeatmap has *no* heat encoding — absence of visual encoding), F-40 (186/205 treemap rects < 24px, labels clipped). Comprehension rules matter as much as type here, exactly as spec §4.1 anticipated. [INSP:OurWorldInData] [INSP:ReutersGraphics] [INSP:FiveThirtyEight-OldSchool] |
| C5 | **Responsive model & sticky-element contract** | **YES** | H-RS03, H-RS11, H-RS01, H-RS06 (N/A-flagged), H-A11Y05 / F-09 F-13 | **DEEP** | F-09 is critical and owner-confirmed: measured chrome ≈40–49% of viewport (M4 static ~40%; felt F-F06 ~49.4%; spread unreconciled), both far exceed the ~8% budget; the rule binds on the direction — exact figure reconciled in remediation. The fix must be a structural contract (chrome-budget ceiling, reflow at 320px) so the persistent-header failure becomes structurally impossible, not patched. Stage 1 correction: H-RS06's sticky-breakage canary is **N/A** to the game-detail FrozenHeader (chrome is structurally-outside-scroller, not `position: sticky`) — the responsive contract must be framed around the *chrome budget*, not a sticky-degradation fix. F-13 keeps the sticky rule alive for any future `position: sticky` component. |
| C6 | **Editorial-identity ↔ modern-legibility axis** | **YES** | spec §2 amendment + Decision 1 (HYBRID); evidenced by F-25, F-33, and the IA cluster | **DEEP** | Per the §2 amendment this is an explicit design axis, not a vibe. It must *define the boundary*: what is fixed (masthead, serif display, editorial voice, almanac framing, kicker pattern) vs what modern moves are sanctioned within it (semantic color-coding for legibility per owner's "/meta pops of color helped"; density control; progressive disclosure). It also resolves F-25 (systematic monospace overuse — the "newspaper texture" applied where it costs legibility): mono is constrained to its load-bearing use, sans-serif is the default register. This category is the governing contract that the other categories execute within. |
| C7 | **Spacing / rhythm / density model** | **YES (scoped)** | H-TY07 [informational], H-A11Y09, H-RS02 / F-36 (+ supports C5/C1 density) | **LIGHT** | A "scan-fast analytics surface" density target, not broadsheet defaults. Earned narrowly: F-36 (section-nav buttons at 0–1px gaps — spacing-circle test fails on every adjacent pair) is a concrete spacing failure with a CLEAR H-A11Y09/H-RS02 binding. The 4px-grid base (H-TY07) is `(informational)` → it rides as a Stage-2 default validated in remediation, never as a sole-rest rule. Light depth: the density model is mostly *expressed through* C1 (progressive disclosure) and C5 (chrome budget); only the touch-target/gap contract needs its own rule. |
| C8 | **Interaction & state patterns** (loading / empty / error / focus) | **YES (scoped)** | H-A11Y10, H-A11Y08 / F-37 F-06 F-08 | **LIGHT** | The #2 felt symptom ("weak feature-level UI/UX"). Earned by concrete findings: F-37 (focused nav button has `outline: none` + no replacement — keyboard users get no focus indicator), F-06 (loading/error branches each render a full `<main>` → duplicate landmark), F-08 (heatmap data only via hover `title` — fails on touch + SR). Scoped to a focus-state contract + a state-rendering contract (loading/error must not duplicate landmarks); broader hover/scrub polish is downstream. |
| C9 | **Component contracts** (cross-cutting binder) | **YES** | H-ARCH01/02/08 (boundary, in §4.2) + props-as-interface principle / F-12 F-23 F-26 | **DEEP (in §4.2)** | Binds C1–C8: each shared primitive gets one purpose, props-as-interface, and an explicit "may not control type/spacing/color locally" clause so consumers cannot re-litigate the system. F-26 (Kicker pattern copy-pasted raw across 4 sections despite a shared `Kicker` existing) is the proof this is load-bearing. The *enforcement* mechanism (barrels, boundaries, token lint) lives in §4.2 to avoid duplication; the *contract principle* is stated here as rule DS-CC. |
| C10 | **Motion** | **YES (minimal)** | H-RS05 / F-14 | **LIGHT** | Earned only by F-14 (zero `prefers-reduced-motion` guard anywhere; `transition`/`scrollIntoView({behavior:'smooth'})` present). One rule: all motion gated behind the reduced-motion query. Not scoped out (it has a CLEAR T1 H-RS05 + a concrete F-14) but minimal — there is no motion *system* to design, only a guard to mandate. |
| C11 | **Iconography** | **NO** | — | **SCOPED-OUT** | No Stage 1 finding implicates an icon system. No H-* in the canon addresses iconography. Adding an icon system would be a generic-design-system move the review explicitly forbids (spec §7: "not a generic design system — every rule must be earned"). Explicitly scoped out, not silently dropped. Revisit only if a downstream cycle surfaces an icon finding. |
| C12 | **Content-voice / editorial tone** | **NO (as a system category)** | — | **SCOPED-OUT** | The editorial voice is *frozen identity* (handled as a boundary in C6, not designed here). The only content-shape finding, F-41 (prose line-length > 80 chars), is a measure/line-length rule and is resolved under C2 (typography, H-TY08) — not a voice system. There is no evidence basis for a content-voice *design system*; scoping it out keeps the blueprint earned, not generic. |

**Net:** **10 load-bearing** (C1–C10) · **2 scoped-out** (C11 iconography, C12 content-voice-as-system). Deep: C1, C2, C3, C4, C5, C6, C9. Light: C7, C8, C10.

**Note on H-TY04 [informational-basis] (F-25):** F-25's only heuristic is H-TY04, tagged `[informational-basis]` in the ledger. Per the citation bar, the monospace rule (DS-TY4) does **not** sole-rest on H-TY04: it is paired with the CLEAR HYBRID design-axis mandate (C6 / Decision 1 / spec §2 amendment — editorial texture must not be applied where it costs legibility) and the F-25 measurement (mono on masthead subtitle, all nav labels, faction names, legend names). H-TY04 *informs* it; the binding support is the §2-amendment axis + F-25 evidence.

---

## STEP 2 — Concrete rules per load-bearing category

Rule IDs: `DS-<area><n>`. Each line: rule · `[why: H-*]` · `[where: F-*]` · optional `[INSP:Name]`. Numbers are concrete where the canon/evidence supports a number; where a number is `(informational)` it is stated as **"Stage-2 default: N, validate in remediation."**

### C1 — Information Architecture / Page-Length & Progressive Disclosure (DEEP)

- **DS-IA1 — Page-length budget + table of contents.** Any analytics route whose content exceeds **Stage-2 default: 3 viewport-heights, validate in remediation** must (a) carry a table-of-contents / section-nav jump block at the top, and (b) keep the single most-critical answer within the first viewport-height. The current routes measured at 19.5×–52.8× viewport are categorically over any plausible budget; the direction is secure even though the exact ceiling is a validate-in-remediation default. `[why: H-IA05, H-IA07]` `[where: F-31, F-34, F-35]` `[INSP:OurWorldInData]`
- **DS-IA2 — Progressive disclosure replaces unbounded scroll.** Long sections (Timeline, /meta tabs, /agenda) must use round/section-level progressive disclosure (expand-by-round, collapsible groups) so default page height is bounded; disclosure controls must be independently navigable and not bury interdependent content. `[why: H-IA11, H-IA05]` `[where: F-31, F-34]`
- **DS-IA3 — Reflow over truncation.** When content overflows horizontally, the system reflows (responsive columns / wrap / dedicated drill view); truncation ("+N more") is permitted **only** for genuinely optional depth and must show **6–10 items before hiding the rest** (Stage-2 default within the cited 6–10 band) and never hide a single item. Recap's "+N more over objective names because the page is shrinking horizontally" is the banned pattern. `[why: H-IA09, H-IA10]` `[where: F-29]`
- **DS-IA4 — Show-More controls communicate running totals.** Any Show More / Load More / collapsed-count control must display "showing X of Y" so users can judge remaining depth before interacting. `[why: H-IA14]` `[where: F-29]`
- **DS-IA5 — Chart-to-container size contract.** A chart's rendered height must not exceed its visible scroll-container by more than **Stage-2 default: ~1× (total ≤ ~2× container), validate in remediation**; remedies are fewer series, split charts, a signposted fixed-height internal scroll, or a dedicated full view. The VP Race chart at 2× its inner scroller is the canonical violation. `[why: H-IA12]` `[where: F-30]`
- **DS-IA6 — Section labels carry information scent.** Every section/tab heading must be self-explanatory in isolation ("Faction Voting Patterns," not "Other"); /agenda's unparseable, unlabeled voting matrix is the violation. `[why: H-IA08]` `[where: F-35]`

### C2 — Type Scale & Register (DEEP, bounded to floor/register)

- **DS-TY1 — Absolute type floor on data surfaces.** No text on any data surface (chart annotation, axis label, legend, cell label, table number, body, nav) may render below **12px absolute floor**; 14px is the data-surface base. This is enforced *after* scaling — see DS-TY2. `[why: H-TY02, H-TY10]` `[where: F-04, F-05]` `[INSP:OurWorldInData]` `[INSP:Datawrapper]`
- **DS-TY2 — Scale multipliers may not breach the floor.** Any global scale multiplier (the `--font-scale` mechanism) must be constrained so that *base × min-multiplier ≥ 12px*. The shipped default that resolves `--font-scale: 0.85` → 11.9px body is a structural violation: the floor must hold at the *default and minimum* scale step, not only at 1.0. `[why: H-TY02, H-TY10]` `[where: F-03]`
- **DS-TY3 — Effective-size measurement governs SVG text (re-measure gate).** SVG `<text>` sizing is governed by *effective rendered size* (nominal `fontSize` × viewBox scale factor), not the nominal attribute. No px change may be made to F-02's SVG labels until effective-vs-nominal is re-measured in remediation; the rule is "measure effective size, then apply the 12px floor to the effective value." `[why: H-TY02]` `[where: F-02]`
- **DS-TY4 — Register discipline: sans-serif default, monospace load-bearing only.** Sans-serif is the default register for all prose labels, faction names, stat annotations, nav, and UI chrome. Monospace is reserved for numeric columns and fixed-column alignment where character alignment is load-bearing. Editorial serif/mono *texture* is identity (C6) but may not be applied where it costs scanning legibility (masthead subtitle, all nav labels, faction/legend names currently mono → move to sans). `[why: H-TY04 (informational-basis, paired with C6/Decision-1/§2-amendment) ]` `[where: F-25]` `[INSP:FiveThirtyEight-OldSchool]`
- **DS-TY5 — Tabular lining numerals for aligned values.** Any value that can sit in a vertical column (table cells, axis ticks, data labels) uses `font-variant-numeric: tabular-nums lining-nums`; verify the chosen face supports `tnum`/`lnum`. `[why: H-TY03]` `[where: F-25 (numeric columns are the legitimate mono/alignment case; F-02/F-04/F-05 data-label surfaces)]` `[INSP:FiveThirtyEight-OldSchool]`
- **DS-TY6 — Prose measure ceiling.** Prose passages (section intros, tooltips, contextual notes, agenda law text) must not exceed **80 characters per line**; target the 45–75 sweet spot. /agenda's ~110-char lines and the home blurb's ~85 are violations. `[why: H-TY08]` `[where: F-41]` `[INSP:ReutersGraphics]`
- **DS-TY7 — Display end is fixed-good; scale top is not a tuning surface.** The display/heading end of the scale (measured 32.3px headings) is a positive control and must not be reduced in the name of density; density is solved by C1 (progressive disclosure) and C5 (chrome budget), not by shrinking type. `[why: H-TY10]` `[where: F-28]`

### C3 — Color & Semantic Tokens (DEEP)

- **DS-CO1 — Single semantic-token source of truth.** All semantic colors (vote-for/against, gain/loss, VP-source, tier, law/rider badges) are defined once as design tokens (CSS custom properties / Tailwind theme). No component defines a semantic color as a literal. The duplicated `VOTE_FOR_BG`/`VOTE_AGAINST_BG` (owned independently by `AgendaSection` and `PoliticalBarChart`) collapse to one token. (Enforcement = §4.2 token-lint gate.) `[why: H-A11Y04 (color paired with a non-color channel), and binds the §4.2 H-ARCH07 token gate]` `[where: F-15, F-16, F-17, F-18]`
- **DS-CO2 — Verified contrast pairings.** Every text/background token pair used for body or labels must be verified ≥ 4.5:1 (≥ 3:1 for ≥18.66px regular / ≥14pt bold and for UI-component boundaries/focus). The auth-button `--ink-3` on `--paper` pairing must be *measured* and replaced if it fails (the a23e486 `--ink-4`→`--ink-3` move did not verifiably clear it). `[why: H-A11Y01]` `[where: F-01, F-10]`
- **DS-CO3 — Color is never the sole channel.** Any datum encoded by color (faction dot, heatmap cell, series, status badge) must pair color with a text label, numeric value, pattern, or shape. `FactionDot` used standalone must carry an accessible name (`aria-label={factionId}`) or a guaranteed visible text sibling. `[why: H-A11Y04]` `[where: F-07]`
- **DS-CO4 — Categorical palette ceiling.** No single chart/panel may present more than **Stage-2 default: 5–7 distinct categorical hues, validate in remediation** simultaneously; beyond that, switch to direct labeling, grouping, or small multiples. The /meta Factions tab's 37 simultaneous hues is the violation; this is also where the HYBRID-sanctioned "pops of color for legibility" are systematized (semantic, bounded — not 37 brand hues at once). `[why: H-DV03 (informational) — paired with F-33 measurement + C6 HYBRID axis; not sole-rest on the informational heuristic]` `[where: F-33]`
- **DS-CO5 — Brand-color perceptual-weight parity.** When multiple faction brand colors appear in one comparative chart, verify no hue dominates by luminance; adjust saturation/lightness, never swap the brand hue (faction identity is fixed). `[why: H-DV13 (informational) — paired with F-33 measurement + the faction-first product thesis]` `[where: F-33]` `[INSP:FiveThirtyEight-OldSchool]`

### C4 — Data-Visualization System (DEEP)

- **DS-DV1 — Critical-number placement.** Each dashboard panel places its single most-critical number/stat in the upper-left quadrant; editorial/masthead chrome may not occupy the upper-left of a data panel. The Player Dossiers dashboard (upper-left = masthead chrome, not the key per-faction stat) is the violation. `[why: H-DV01]` `[where: F-32]` `[INSP:FiveThirtyEight-OldSchool]`
- **DS-DV2 — Card-grid layout, not infinite horizontal stretch.** Multi-entity comparative panels (faction dossiers) use a consistent card grid at a fixed scale; panels may not stretch horizontally past the viewport or alternate wildly different heights in one row. `[why: H-DV01, H-DV06]` `[where: F-32]` `[INSP:OurWorldInData]`
- **DS-DV3 — Heatmaps must encode, or stop being heatmaps.** A component named/used as a heatmap must carry an actual sequential/diverging visual encoding (the PickRateHeatmap currently has *no* heat encoding — 2 colored cells in a 9×33 grid; the failure is the *absence* of encoding). Either restore a sequential encoding or render it as the table it actually is, labeled honestly. `[why: H-DV05 (informational) — paired with F-39 measurement (absence-of-encoding is a data-ink failure, independent of palette choice)]` `[where: F-39]`
- **DS-DV4 — Treemap label legibility floor.** Suppress (or move to tooltip) any treemap cell label whose shorter dimension falls below **Stage-2 default: ~20–24px, validate in remediation**; a clipped label is worse than none. 186/205 Tech-treemap rects are below this. `[why: H-DV09 (informational) — paired with F-40 measurement + the DS-TY1 12px floor it is derived from]` `[where: F-40]`
- **DS-DV5 — Direct labeling over legends for ≤6 series.** Line/slope charts with ≤6 series label series at their terminal point in the matching hue rather than via a separate legend (reduces the legend cross-reference scan; complements DS-CO4). `[why: H-DV04]` `[where: F-33 (legend/hue overload), F-30 (VP Race is the multi-series chart)]` `[INSP:FiveThirtyEight-OldSchool]`
- **DS-DV6 — Gridlines subordinate to data.** Gridlines render at reduced weight/opacity beneath data marks; at most one bolded zero/baseline. `[why: H-DV11]` `[where: F-30 (VP Race is the chart-centric surface where gridline subordination governs readability)]` `[INSP:FiveThirtyEight-OldSchool]`

### C5 — Responsive Model & Sticky-Element Contract (DEEP)

- **DS-RS1 — Header chrome budget.** Cumulative persistent chrome (masthead + site nav + section nav + scrubber) must not exceed **Stage-2 default: ~8% of viewport height on mobile / a hard ceiling validated in remediation**. Measured chrome ≈40–49% of viewport (M4 static ~40%; felt F-F06 ~49.4%; spread unreconciled), both far exceed the ~8% budget; the rule binds on the direction — exact figure reconciled in remediation. The contract is structural: chrome that exceeds the budget must collapse/condense (partially-persistent or condensed-on-scroll), not stack. `[why: H-RS03, H-RS11]` `[where: F-09]`
- **DS-RS2 — Reflow at 320 CSS px.** All non-2D content reflows to a single scroll axis at 320 CSS px with no information loss; charts/heatmaps/tables are the only excepted 2D content and the exception does not cascade to surrounding chrome (headings, FilterBar, section nav reflow independently). `[why: H-RS01, H-A11Y05]` `[where: F-09 (the chrome that fails the budget is also what must reflow first at 320px)]`
- **DS-RS3 — Sticky-positioning contract (forward-looking guard).** Any component that uses `position: sticky` must be audited for `overflow`-containing ancestors (sticky silently degrades to relative inside `overflow: hidden|auto|scroll`). Stage 1 correction: the game-detail FrozenHeader does **not** use `position: sticky` (chrome is structurally-outside-scroller — H-RS06 N/A there); this rule governs *future* sticky components and the `App.tsx` `overflow: hidden` interaction. `[why: H-RS06 (canon-retained, N/A-flagged for current chrome)]` `[where: F-13]`

### C6 — Editorial-Identity ↔ Modern-Legibility Axis (DEEP — governing contract)

- **DS-AX1 — Fixed identity (the boundary).** Frozen, not a tuning surface: masthead/kicker editorial chrome, serif display family for headings, the almanac framing, editorial voice. No legibility rule may delete these. (Per spec §2; Decision 1.) `[why: spec §2 amendment + Decision 1 (CLEAR owner ruling)]` `[where: F-25 (defines which texture is identity vs misapplied), F-33 (color is sanctioned, identity is not deleted)]`
- **DS-AX2 — Sanctioned modern moves within identity.** Three legibility affordances are *system elements*, not aesthetic violations: (a) **semantic color-coding** for legibility (owner: "/meta pops of color helped") — systematized via C3; (b) **density control** — via C5 chrome budget + C7; (c) **progressive disclosure** — via C1. Any of these is in-bounds by default; a reviewer may not reject them as "un-newspaper." `[why: spec §2 amendment + Decision 1 (CLEAR)]` `[where: F-09, F-29, F-31, F-33, F-34, F-35]`
- **DS-AX3 — Texture follows legibility, not the reverse.** Where editorial texture (mono running text, decorative density) and scanning legibility conflict on a *data surface*, legibility wins; the texture is retained where it is identity-bearing chrome (masthead) and removed where it is incidental (data labels, nav). This is the rule that makes DS-TY4 binding without sole-resting on the informational H-TY04. `[why: §2 amendment + Decision 1 (CLEAR), informed by H-TY04]` `[where: F-25]` `[INSP:ReutersGraphics]`

### C7 — Spacing / Rhythm / Density (LIGHT)

- **DS-SP1 — Base spacing grid.** All padding/gap/margin derive from a 4px base grid (4/8/12/16/24/32). **Stage-2 default: 4px grain, validate in remediation** (the 4px-vs-8px grain choice is informational; the grid *discipline* is the binding part, paired with the F-36 spacing failure). `[why: H-TY07 (informational) — paired with F-36 measurement + H-A11Y09 CLEAR]` `[where: F-36]`
- **DS-SP2 — Touch-target & separation floor.** Every interactive target is ≥ 24×24 CSS px, or separated so a 24px-diameter circle centered on each does not intersect a neighbor. Section-nav buttons at 0–1px gaps and 32×24 scrubber chips at 2px gaps both fail and must gain spacing. `[why: H-A11Y09, H-RS02]` `[where: F-36]`

### C8 — Interaction & State Patterns (LIGHT)

- **DS-ST1 — Visible focus indicator, no naked `outline:none`.** Every keyboard-operable control shows a visible focus indicator meeting ≥ 3:1; any `outline: none`/`0` without a replacement focus style is banned. The section-nav button's suppressed outline with no replacement is the violation. `[why: H-A11Y10]` `[where: F-37]`
- **DS-ST2 — State branches do not duplicate landmarks; repeated landmark roles carry unique names.** Loading/empty/error render branches must not emit their own `<main>`/`<header>` landmark inside the app shell's landmark; states render inside the existing landmark. The loading/error branches that each render a full `<main>` (duplicate landmark on `/` and `/compare/:a/:b`) are the violation. Additionally, when more than one landmark of the same role exists (e.g. two `<nav>`s — the `AppHeader` site nav and the `FrozenHeader` page nav), each must carry a unique accessible name (`aria-label`/`aria-labelledby`) so assistive technology can distinguish them. `[why: H-A11Y07, H-RS08]` `[where: F-06, F-24]`
- **DS-ST3 — Data must be reachable without hover.** Data disclosure may not depend solely on a hover `title` attribute (unavailable on touch; not a primary SR label; not Name/Role/Value for interactive-intent elements); provide a visible label or proper ARIA. `[why: H-A11Y08, H-A11Y04]` `[where: F-08]`
- **DS-ST4 — Tabular/matrix data uses real table semantics.** Tabular or matrix data (voting records, agenda tallies, stat grids) must use real table semantics (`<table>` with `<th scope=…>`) or an ARIA `role="table"/"grid"` with row/column headers — never `<div>` bars conveying tabular relationships. `[why: H-A11Y06, H-A11Y08]` `[where: F-38]`

### C9 — Component Contracts (DEEP — principle here, enforcement in §4.2)

- **DS-CC1 — One purpose, props-as-interface, no local re-litigation.** Every shared primitive has exactly one purpose and a props interface that is its entire contract; consumers pass data in and may **not** override type size, spacing, or semantic color locally. A shared primitive that exists (e.g. `Kicker`) is the only sanctioned way to render that pattern — copy-pasting its inline style object across sections is banned. `[why: H-ARCH01, H-ARCH08 (boundary, enforced in §4.2) + props-as-interface principle]` `[where: F-26]` `[INSP:OurWorldInData]`
- **DS-CC2 — Shared/feature boundary is one-directional.** A shared primitive may not import a feature; a feature consumes shared via its barrel and `lib/` via the `lib/` barrel (enforcement = §4.2). The `shared/AppHeader` → `features/upload/UploadPage` reach-in is the violation this binds. `[why: H-ARCH02, H-ARCH01]` `[where: F-12, F-23]`

### C10 — Motion (LIGHT/minimal)

- **DS-MO1 — All motion gated by `prefers-reduced-motion`.** Every transition, scroll-triggered animation, and `scroll-behavior: smooth` / `scrollIntoView({behavior:'smooth'})` is wrapped so it is suppressed under `@media (prefers-reduced-motion: reduce)`. There is no motion *system* to design — this is a single mandatory guard. `[why: H-RS05]` `[where: F-14]`

---

# §4.2 — Front-End Architecture Spec

## Feature-module pattern

- **AR-1 — A "feature" is a self-contained vertical slice.** A feature is a directory under `src/features/<name>/` owning its components, hooks (`use*.ts`), context (`*Context.tsx`), feature-local types, styles, and colocated tests. It is consumed only through its `index.ts` barrel of explicit named re-exports (never `export *`). Dependencies flow strictly downward: `features → shared → lib → adapters`. A feature never imports a sibling feature. `[why: H-ARCH01, H-ARCH02, H-ARCH03, H-ARCH08]` `[where: F-12, F-23]`
- **AR-2 — Features consume `lib/` and the FROZEN adapter through barrels only.** A feature imports `lib/` via a top-level `lib/index.ts` barrel (which must be created — none exists today; features deep-import `../../lib/parser/types` etc.) and the Firestore data via `src/adapters/` only (the adapter pattern is frozen and respected as-is — no Firestore import outside `adapters/`). Deep imports into `lib/` internals are lint errors. `[why: H-ARCH01]` `[where: F-23]`
- **AR-3 — Shared primitives are props-as-interface and one-directional.** A `shared/` primitive declares its entire contract as props, owns one purpose, and may not import a feature. The `shared/AppHeader` → `features/upload/UploadPage` upward reach-in must be removed (extract an `UploadDrawer` shell in `shared/` taking content via children/render-prop, or host the drawer at the `App.tsx` route level). `[why: H-ARCH02, H-ARCH01]` `[where: F-12]`
- **AR-4 — Lib-vs-feature boundary: feature `.tsx` exports only components.** Feature `.tsx` files export only React components; data-transform/aggregation logic lives in `lib/` or a feature-local non-component module — enforced as a lib-vs-feature boundary, not a stylistic rule. The data-transformation functions exported alongside a component (e.g. `StatsSection.tsx` exporting `buildGameLengthHistogram`/`buildFinalVpHistogram`/`buildWinsByFaction`) move to `lib/` or a feature-local non-component module. `[why: H-ARCH03 (T2, colocation/separation), H-ARCH01 (T1+T2, barrel/public-API), H-ARCH04 (supporting, informational)]` `[where: F-20 + the StatsSection-656 god-file evidence]`

## Per-file code ceiling = **300 lines**

- **AR-5 — `max-lines: 300` (`skipBlankLines: true`, `skipComments: true`), CI-failing.** ESLint's built-in `max-lines` rule is configured at **300** and a breach is a lint error that fails `npm run lint` and therefore CI. **Justification from the LOC distribution (`2026-05-18-evidence-architecture.md`):** median 74, P75 138 — the body of the codebase is far under 300, so 300 does not force artificial splits of small utility files; the god-files start at 300+. A 300 ceiling flags exactly the valid refactor targets: `gameReducer.ts` (953), `StatsSection.tsx` (656), `buildGameStats.ts` (611), `AgendaSection.tsx` (583), `FactionSnapshotCards.tsx` (496), `PoliticalBarChart.tsx` (409), `ComparePage.tsx` (327), `PlanetControlSlideshow.tsx` (321), `StrategyCardSection.tsx` (308) — 9 production files (test files like `gameReducer.test.ts` 1068 are acceptable and may carry a self-documenting per-file `eslint-disable max-lines`). 250 was considered but adds only a near-miss (`UploadPage.tsx` 249) for little gain; 300 is the evidence-supported number. The mechanism (ESLint `max-lines`, CI-failing) is the binding part of H-ARCH06; the specific 300 is set here from real LOC data per H-ARCH06's own informational-number caveat. `[why: H-ARCH06 (mechanism binding; number set from evidence)]` `[where: F-19, F-20, F-21, F-22]`

## Enforcement mechanisms (all CI-failing)

- **AR-6 — Boundary lint for the `shared → feature` reach-in and deep imports.** A boundary rule (`eslint-plugin-boundaries` or Steiger `fsd/no-cross-imports` + `fsd/no-public-api-sidestep`) declared once in the ESLint/Steiger config, checked in CI, forbidding: shared→feature imports, feature→sibling-feature imports, and any import that bypasses a feature or `lib/` barrel. `[why: H-ARCH01, H-ARCH02, H-ARCH09]` `[where: F-12, F-23]`
- **AR-7 — Token-enforcement lint banning raw hex/px outside token files.** A `no-restricted-syntax` AST-selector rule (the *correct* mechanism — H-ARCH07's cited `no-restricted-imports` is mis-tiered for this; raw-literal banning is done via `no-restricted-syntax` per Bank E Notes) bans raw hex color literals and raw px design values in component files, with an error message pointing to the token file. Legitimate canonical sources (`lib/factions/factionBrandColors.ts`, the token file itself) are exempt by path. This is the structural enforcement of DS-CO1. Its binding support is the CLEAR pairing of H-A11Y04 + the hard F-15..F-18 hardcoded-color measurements; H-ARCH07 was ruled `informational + Stage-2-flag` at the Stage-0 owner gate (OWNER RULINGS, source-adjudication) and is demoted to supporting only. Token-enforcement lint ships **warn-mode in Phase 0, promoted to CI-failing only after remediation validation**. (Owner CONFIRMED 2026-05-18: staggered hardening accepted — warn-mode in Phase 0, promoted to CI-failing only after remediation validation.) `[why: H-A11Y04 (CLEAR) + F-15..F-18 hard measurements; H-ARCH07 (supporting, informational — Stage-0-ruled)]` `[where: F-15, F-16, F-17, F-18]`
- **AR-8 — Lib-vs-feature boundary gate (CI-failing); one-component-per-file is warn-mode.** A CI-failing gate enforces the AR-4 *boundary* only: no non-component module exports from feature `.tsx` files (data-transform/aggregation logic must live in `lib/` or a feature-local non-component module), backed by the binding H-ARCH03/H-ARCH01. The *one-component-per-file* stylistic portion (`eslint-plugin-react-refresh`, already available via Vite) ships in **warn-mode / Stage-2 advisory ("validate in remediation")**, consistent with H-ARCH04's informational status — it is not elevated to a CI-failing error. `[why: H-ARCH03 (T2), H-ARCH01 (T1+T2); H-ARCH04 (supporting, informational — warn-mode only)]` `[where: F-20]`

> AR-5, AR-6, and the AR-4-boundary portion of AR-8 fail CI; AR-7 and the one-component-per-file portion of AR-8 ship warn-mode first and fail CI only after remediation validation (see AR-7/AR-8). The deliverable is an *enforced* foundation, not findings alone — this is the explicit countermeasure to the CODE_REVIEW_2026-05-05 "diagnosis that didn't stick" risk (spec §8).

---

# §4.3 — Conformance Map

One row per ledger finding F-01..F-41. Every finding appears exactly once with a non-empty resolving rule. F-11 routes to §4.4 (code-correctness, not a design rule). F-02's note is the re-measure-first caveat (not a definitive fix).

| F-## | Severity | Resolving rule (blueprint §ref) | Note |
|---|---|---|---|
| F-01 | critical | DS-CO2 (§4.1 C3) | Auth-button `--ink-3`/`--paper` pairing must be *measured* and replaced if < 4.5:1; the a23e486 token swap is not verifiably sufficient. |
| F-02 | critical | DS-TY3 (§4.1 C2) | **Re-measure caveat:** effective-vs-nominal SVG size must be re-measured in remediation *before* any px change; rule is "measure effective, apply 12px floor to effective value" — not a definitive 7px→Npx fix. |
| F-03 | critical | DS-TY2 (§4.1 C2) | Scale multiplier constrained so base × min-multiplier ≥ 12px; default `0.85`→11.9px is the structural violation. |
| F-04 | major | DS-TY1 (§4.1 C2) | 9px heatmap legend/cell numerals raised to ≥ 12px floor. |
| F-05 | major | DS-TY1 (§4.1 C2) | 9px PickRateHeatmap cell label raised to ≥ 12px (14px base) floor. |
| F-06 | major | DS-ST2 (§4.1 C8) | Loading/error branches render inside the existing landmark; no duplicate `<main>` on `/` or `/compare/:a/:b`. |
| F-07 | major | DS-CO3 (§4.1 C3) | Standalone `FactionDot` gains `aria-label={factionId}` or guaranteed text sibling — color not sole channel. |
| F-08 | major | DS-ST3 (§4.1 C8) | Heatmap data exposed via visible label / proper ARIA, not hover-`title` only. |
| F-09 | critical | DS-RS1 (§4.1 C5) | Header chrome budget; measured chrome ≈40–49% of viewport (M4 static ~40%; felt F-F06 ~49.4%; spread unreconciled), both far exceed the ~8% budget — rule binds on the direction, exact figure reconciled in remediation; chrome collapses/condenses, does not stack. |
| F-10 | major | DS-CO2 (§4.1 C3) | Remaining HomePage contrast failure resolved by verified-pairing rule. |
| F-11 | major | **§4.4 remediation (code-correctness, not a design rule)** | NO-HEURISTIC by owner ruling; setState-in-useEffect routed to the remediation sequence as a code-correctness fix, not given a §4.1/§4.2 design rule. |
| F-12 | major | AR-3 + AR-6 (§4.2) | `shared/AppHeader`→`features/upload` reach-in removed; boundary lint forbids shared→feature, CI-failing. |
| F-13 | minor | DS-RS3 (§4.1 C5) | Forward-looking sticky-positioning contract; current chrome is N/A (structurally-outside-scroller) — rule guards future `position: sticky` + the `App.tsx overflow:hidden` interaction. |
| F-14 | minor | DS-MO1 (§4.1 C10) | All motion gated by `prefers-reduced-motion`. |
| F-15 | minor | DS-CO1 + AR-7 (§4.1 C3 / §4.2) | Hex cluster → single semantic token; raw-hex lint (CI-failing) prevents recurrence. |
| F-16 | minor | DS-CO1 + AR-7 | Duplicated `VOTE_FOR_BG`/`VOTE_AGAINST_BG` collapse to one token; lint-enforced. |
| F-17 | minor | DS-CO1 + AR-7 | VP-source/badge hex maps → tokens; lint-enforced. |
| F-18 | minor | DS-CO1 + AR-7 | Inline `#fff` literals → token; lint-enforced. |
| F-19 | minor | AR-5 (§4.2) | `gameReducer.ts` 953 LOC flagged by `max-lines:300`, CI-failing. |
| F-20 | major | AR-4 + AR-5 + AR-8 (§4.2) | `StatsSection.tsx` data-transforms move to `lib/`/feature-local non-component module (lib-vs-feature boundary, CI-failing per AR-8); one-component-per-file ships warn-mode/Stage-2; 656 LOC flagged. |
| F-21 | minor | AR-5 (§4.2) | `buildGameStats.ts` 611 LOC flagged; interfaces move to adjacent `types.ts` (AR-1 colocation). |
| F-22 | minor | AR-5 + AR-7 (§4.2) | `AgendaSection.tsx` 583 LOC flagged; 12+ hex → tokens via lint. |
| F-23 | minor | AR-2 + AR-6 (§4.2) | Create `lib/index.ts` barrel; deep-import lint forbids `../../lib/...` bypass, CI-failing. |
| F-24 | minor | DS-ST2 (§4.1 C8) | Two `<nav>` landmarks (AppHeader site nav + FrozenHeader page nav) must carry unique accessible names (`aria-label`); the repeated-landmark-naming clause of DS-ST2 governs this. |
| F-25 | minor | DS-TY4 + DS-AX3 (§4.1 C2 / C6) | Mono→sans for nav/faction/legend/masthead-subtitle; DS-AX3 (CLEAR §2-amendment axis) is the binding support, H-TY04 informs only. |
| F-26 | minor | DS-CC1 (§4.1 C9) | Shared `Kicker` is the only sanctioned render path; copy-pasted inline kicker object banned (props-as-interface). |
| F-27 | info | DS-TY6 + DS-CO1 (§4.1 C2 / C3) | Definition-text line-height is already correct; `<strong>` inline color tokens normalized under the semantic-token rule. |
| F-28 | info | DS-TY7 (§4.1 C2) | Positive control — display end (32.3px) is fixed-good; rule forbids shrinking it for density. |
| F-29 | major | DS-IA3 + DS-IA4 (§4.1 C1) | Reflow over truncation; Show-More shows running totals. |
| F-30 | critical | DS-IA5 + DS-DV6 (§4.1 C1 / C4) | Chart-to-container ≤ ~2× (Stage-2 default, validate); VP Race split/constrained; gridlines subordinate. |
| F-31 | major | DS-IA1 + DS-IA2 (§4.1 C1) | Timeline gets page-length budget + TOC + progressive disclosure (expand-by-round). |
| F-32 | major | DS-DV1 + DS-DV2 (§4.1 C4) | Critical stat upper-left (not masthead chrome); card-grid, not infinite horizontal stretch. |
| F-33 | major | DS-CO4 + DS-CO5 (§4.1 C3) | Categorical-hue ceiling (Stage-2 default 5–7, validate); brand-weight parity; paired with F-33 measurement, not sole-rest on informational H-DV03/13. |
| F-34 | major | DS-IA1 + DS-IA2 (§4.1 C1) | /meta 19.5× scroll → page-length budget + TOC + progressive disclosure across tabs. |
| F-35 | critical | DS-IA1 + DS-IA2 + DS-IA6 + DS-TY6 (§4.1 C1 / C2) | /agenda 52.8×: budget+TOC+disclosure; scent-bearing labels for the voting matrix; law-text prose at ≤80-char measure. |
| F-36 | major | DS-SP2 (§4.1 C7) | Section-nav 0–1px gaps + scrubber 2px gaps fail the 24px spacing-circle; spacing added. |
| F-37 | major | DS-ST1 (§4.1 C8) | Suppressed `outline:none` with no replacement → visible ≥3:1 focus indicator. |
| F-38 | minor | DS-ST4 (§4.1 C8) | Voting UI as non-table `<div>` bars must use real table semantics (`<table>`/`<th scope>` or ARIA `role="table"/"grid"` with row/column headers), not div bars conveying tabular relationships. |
| F-39 | info | DS-DV3 (§4.1 C4) | PickRateHeatmap has no heat encoding (absence-of-encoding data-ink failure) — restore sequential encoding or render as an honestly-labeled table. |
| F-40 | major | DS-DV4 (§4.1 C4) | 186/205 treemap rects < ~24px — suppress/tooltip sub-floor labels (Stage-2 default, validate). |
| F-41 | major | DS-TY6 (§4.1 C2) | /agenda ~110-char + home ~85-char prose lines → ≤ 80-char measure ceiling. |

**Coverage proof:** 41 rows, F-01..F-41, each exactly once, each with a non-empty resolver. F-11 → §4.4 (code-correctness). F-02 → re-measure caveat.

**No-orphan-rule proof (every §4.1/§4.2 rule resolves ≥1 finding):**

- DS-IA1→F-31/34/35 · DS-IA2→F-31/34/35 · DS-IA3→F-29 · DS-IA4→F-29 · DS-IA5→F-30 · DS-IA6→F-35
- DS-TY1→F-04/05 · DS-TY2→F-03 · DS-TY3→F-02 · DS-TY4→F-25 · DS-TY5→F-25 (numeric-alignment surfaces; supports F-02/04/05 data labels) · DS-TY6→F-35/41 · DS-TY7→F-28
- DS-CO1→F-15/16/17/18 · DS-CO2→F-01/10 · DS-CO3→F-07 · DS-CO4→F-33 · DS-CO5→F-33
- DS-DV1→F-32 · DS-DV2→F-32 · DS-DV3→F-39 · DS-DV4→F-40 · DS-DV5→F-30/33 · DS-DV6→F-30
- DS-RS1→F-09 · DS-RS2→F-09 · DS-RS3→F-13
- DS-AX1→F-25/33 · DS-AX2→F-09/29/31/33/34/35 · DS-AX3→F-25
- DS-SP1→F-36 · DS-SP2→F-36 · DS-ST1→F-37 · DS-ST2→F-06/24 · DS-ST3→F-08 · DS-ST4→F-38
- DS-CC1→F-26 · DS-CC2→F-12/23 · DS-MO1→F-14
- AR-1→F-12/23 · AR-2→F-23 · AR-3→F-12 · AR-4→F-20 · AR-5→F-19/20/21/22 · AR-6→F-12/23 · AR-7→F-15/16/17/18/22 · AR-8→F-20

Every rule resolves ≥ 1 finding — no orphan/uncited rules.

---

# §4.4 — Remediation Sequence (high-level only)

Strangler-style migration onto the foundation. **No file-level steps** — that is a downstream spec→plan→implement cycle. Ordering principle: **lowest-risk × highest-pain from the ledger first**; the frozen-header chrome budget (F-09) and the IA/scroll cluster (F-30/31/34/35) are the highest-pain.

**Invariant for the whole sequence:** tests stay green. Each phase ends with `npm run typecheck && npm run lint && npm test && npm run build` passing. The strangler rule: the new foundation is introduced *alongside* the existing code; sections migrate onto it one at a time; old code is deleted only after its section is green on the new system. Parser/`lib/` TDD discipline and the frozen adapter are untouched throughout.

**Phase 0 — De-risk + scaffold (no user-visible change).**
- **F-02 effective-vs-nominal re-measure** (early de-risking step — *before* any typography rule executes; settles the F-02 triangulation tension so DS-TY3 has a measured basis).
- Stand up the token file (DS-CO1 source of truth) and the CI gates (AR-5 `max-lines:300`, AR-6 boundary lint, AR-7 token lint, AR-8 one-component-per-file) in **report-only / warn** mode first so the baseline is visible without breaking the build, then flip to error per-area as each area migrates.
- Create the `lib/index.ts` barrel (AR-2) and the `shared/UploadDrawer` extraction path for the one boundary violation (AR-3 / F-12).
- **F-11 (setState-in-useEffect)** — code-correctness fix; not a design rule. Sequenced here as a low-risk correctness cleanup in `PlanetControlSlideshow` and `ComparePage` (independent of the design foundation; do it early so it does not confound later render-behavior verification).

**Phase 1 — Highest-pain, structural: the frozen-header chrome budget + responsive contract.**
- Migrate the game-detail header chrome onto DS-RS1/DS-RS2 (F-09 critical, owner's single loudest pain). This is high-pain and structurally contained to the chrome, so it is also relatively low-risk to isolate. Establishes the chrome-budget contract the rest of the app inherits.

**Phase 2 — IA / page-length cluster (the largest finding cluster).**
- Migrate the worst offenders in pain order: /agenda (F-35, 52.8×, critical), VP Race chart-to-container (F-30, critical), Timeline (F-31, 33×), /meta (F-34, 19.5×) onto DS-IA1..DS-IA6 (page-length budget, TOC, progressive disclosure, reflow-over-truncation, chart-to-container). This is where DS-AX2's sanctioned modern moves (progressive disclosure, density control) do the heavy lifting within the frozen identity.

**Phase 3 — Typography + color systematization, section by section.**
- Roll DS-TY1/2/3 (floor + scale-multiplier constraint + measured-effective SVG), DS-CO1/2/3 (token source of truth + verified pairings + non-color channel) across sections one at a time, flipping AR-7 token-lint to error per-section as each is cleaned. F-03 (default-scale floor breach) and F-01 (auth-button contrast, measured) land here.

**Phase 4 — Component-contract + architecture cleanup.**
- Migrate shared primitives onto DS-CC1/CC2 (Kicker single-source, props-as-interface), split the god-files flagged by AR-5 (gameReducer, StatsSection w/ AR-4 transform extraction, buildGameStats, AgendaSection), flip remaining CI gates from warn to error. Lower pain, higher mechanical risk — done last, behind green tests.

**Phase 5 — Long-tail: motion guard, focus states, spacing, treemap/heatmap encoding.**
- DS-MO1 (prefers-reduced-motion), DS-ST1 (focus indicators), DS-SP1/SP2 (grid + touch targets), DS-DV3/DV4 (heatmap encoding honesty, treemap label floor). Individually small; batched at the end behind the now-enforced foundation.

**Roadmap reshape (deliverable note, not executed here):** this sequence becomes a *Foundation Remediation* section prepended ahead of V1.3b in ROADMAP.md; paused feature work (player attribution, sharing, DS/TE audit, CSV export, Lighthouse) is repositioned as "resumes after foundation lands." Rewriting ROADMAP.md happens when this note is acted on, not now.

---

## Self-check (run before returning)

- Every §4.1 candidate category (C1–C12) has an explicit verdict with depth label — 10 load-bearing, 2 scoped-out.
- Conformance map = 41 rows, F-01..F-41, each once, each with a non-empty resolver.
- No rule sole-rests on an `(informational)` heuristic: H-IA07/12 (DS-IA1/DS-IA5) paired with hard F-31/34/35/30 + CLEAR H-IA05/H-IA08; H-IA13 not relied on as a sole basis; H-ARCH06-number set from evidence (mechanism is CLEAR/binding); H-DV03/05/09/13 (DS-CO4/DV3/DV4/CO5) each paired with a hard F-measurement; H-TY07 (DS-SP1) paired with F-36 + CLEAR H-A11Y09; H-TY04 (DS-TY4) paired with the CLEAR §2-amendment axis (DS-AX3) + F-25; H-ARCH04/07 paired with F-20 / F-15..18 measurements.
- F-11 routed to §4.4 (code-correctness), not given a design rule. F-02 carries the re-measure-first caveat in its conformance note and DS-TY3.

---

# §5 — Acceptance Walk (spec §6)

Walk of every spec §6 bullet against the produced artifacts. Rows are honest: PASS = fully satisfied by an existing artifact; PARTIAL = satisfied in substance but with a noted gap or deferral; PENDING = cannot be assessed until an action outside this review occurs.

| # | §6 criterion (verbatim / abbreviated) | Status | Evidencing artifact and how it satisfies it |
|---|---|---|---|
| 1 | Every Stage 0 bank ends in concrete, cited heuristics — zero ad-hoc rules; every source carries a T1/T2/T3 tier tag; no heuristic rests solely on T3. | PASS | `2026-05-18-research-canon.md` Master Heuristic Index (69 heuristics, H-TY01..H-IA14 after Decision 2 addendum): every row carries explicit tier tags (T1, T2, T1+T2, etc.); canon construction rules state "no heuristic may rest solely on T3"; no T3-only heuristic is present in the final index. Blueprint §4.1 STEP 1 note on H-TY04 and §4.2 AR-7 note on H-ARCH07 explicitly document where informational heuristics are paired rather than sole-rested. |
| 2 | Independent verifier checked every heuristic; every `⚠ adjudicate`/contested heuristic has a recorded owner ruling before Stage 0 commit. | PASS | `2026-05-18-stage1-decisions.md` records the owner adjudication gate; the canon's per-heuristic `(informational)` and Stage-2-flag annotations record which heuristics received downgrade rulings (H-ARCH07, H-ARCH04, H-TY04, H-TY05, H-DV03, H-DV05, H-DV09, H-DV13, H-TY07 — all carrying explicit status flags in the canon). The blueprint's STEP 1 and §4.2 rule notes explicitly state which heuristics are informational, paired, or ruling-recorded, confirming the adjudication loop closed before blueprint drafting. |
| 3 | Inspirations Register is owner-seeded and referenced by Banks A/B/C; any research-proposed exemplar has an owner ruling. | PASS | `2026-05-18-inspirations-register.md` is the owner-seeded register (FiveThirtyEight-OldSchool, OurWorldInData, ReutersGraphics, The Pudding). Blueprint §4.1 rules cite `[INSP:OurWorldInData]`, `[INSP:FiveThirtyEight-OldSchool]`, `[INSP:ReutersGraphics]`, `[INSP:Datawrapper]` inline in DS-IA1, DS-TY1, DS-TY4, DS-TY5, DS-TY6, DS-DV1/2/5/6, DS-CC1. Canon intro states the archival-sourcing rule for old-538 is binding. Exemplars are owner-seeded; no research-proposed exemplar was introduced without owner confirmation. |
| 4 | Every blueprint rule traces to a source (Stage 0) AND evidence (Stage 1) — conformance map has no orphan findings and no uncited rules; no rule rests solely on an owner-downgraded heuristic. | PARTIAL | `§4.3 Conformance Map` (41 rows, F-01..F-41, each exactly once, each with a non-empty resolver): every finding has a resolving rule, proven by the coverage proof and no-orphan-rule proof at the bottom of §4.3. Every rule carries `[why: H-*]` + `[where: F-*]`. **PARTIAL because:** F-02's DS-TY3 rule carries a re-measure caveat — the effective-vs-nominal triangulation tension means the rule's concrete direction (measure first, then apply floor) is sound but the quantitative conclusion is deferred to remediation; DS-TY3 is not a definitive fix. This is explicitly recorded as a PARTIAL resolution in the conformance map note and in Stage 1 Decisions honesty note. All other rules are fully grounded. |
| 5 | Design-system scope carries its "why these categories, why this depth" rationale (§4.1 discipline) — not anchored to the loudest symptom. | PASS | Blueprint `§4.1 STEP 1 — Why these categories, why this depth (anti-pigeonhole gate)` contains the explicit candidate-category table (C1–C12) with per-category verdict (Load-bearing? / Driven by / Depth / Rationale). Typography (C2) is explicitly held to the same evidence bar as every other category; its depth is "bounded to floor/register/numeric-alignment — the scale ratio itself is `(informational)` and scoped to validate-in-remediation." The largest evidence cluster (C1, IA/page-length) received the deepest treatment by evidence-volume, not by symptom volume. C11 (iconography) and C12 (content-voice) are explicitly scoped out with written rationale. |
| 6 | Both browser instruments' availability confirmed at start, or documented fallback invoked and chosen mode recorded — review does not silently degrade. | PASS | `2026-05-18-findings-ledger.md` header records the evidence sources merged: Task 5 (`evidence-measured.md`, M1–M5 measurements via Claude-in-Chrome), Task 6 (`evidence-felt.md`, Cowork-guided walkthrough F-F01..F-F51), Task 7 (`evidence-static.md`), Task 8 (`evidence-architecture.md`). Measured evidence (computed type sizes, responsive reproduction, scroll-container dimensions) is present in the ledger (F-02 M2, F-03 M1, F-04–F-09 measured figures, F-28 M3, F-30 M4). Both instruments were available and used; no fallback-only degradation occurred. The instrument-availability check and evidence-mode are recorded in ledger preamble. |
| 7 | Owner approves the blueprint. | PENDING — owner gate | This acceptance walk is produced as the final Stage 2 artifact; blueprint approval is the next step. Cannot be self-assessed. |
| 8 | Execution is NOT in this review's acceptance — it is downstream. | PASS | Blueprint §4.4 is explicitly labeled "Remediation Sequence (high-level only)" and states "No file-level steps — that is a downstream spec→plan→implement cycle." F-11 in §4.4 is described as "sequenced here as a low-risk correctness cleanup" with no implementation detail. The roadmap reshape note (`2026-05-18-roadmap-reshape-note.md`) is explicitly a PROPOSAL, not a ROADMAP.md edit. No app code was modified in Stage 2. The blueprint scope reminder (§ at top) states "This is a blueprint, not an implementation." |

**Summary:** 6 PASS · 1 PARTIAL · 1 PENDING. The one PARTIAL (criterion 4) is F-02/DS-TY3's re-measure deferral — recorded honestly in the conformance map and ledger, not a coverage gap. The one PENDING (criterion 7) is the owner approval gate, which is the natural next step after this walk is delivered.
