# Research Canon — Front-End Foundation Review

**Date:** 2026-05-18
**Status:** Assembled (Task 3). Banks filled from `research-bank-{A..E}.md` scratch files. Gated by Task 3.5 adjudication before Stage 0 commit.

## Heuristic ID convention
`H-<bank><nn>` where bank ∈ {TY, DV, RS, A11Y, ARCH}. Example `H-TY03`. Every heuristic, finding, and blueprint rule references these IDs so the conformance map can be verified mechanically with Grep.

## Source-Tier Rubric
Every source tagged **(T1)** / **(T2)** / **(T3)**. **T1** = formal specs/standards (W3C, WCAG, ECMA), official framework/library docs, canonical field authorities. **T2** = recognized practitioner references with named authorship and a track record. **T3** = community/blog/forum — corroboration only, never sole support for a heuristic. A heuristic's strength = the highest tier among its supporting sources. Any heuristic supported only by T3 carries ` ⚠ adjudicate` and goes to the owner at Task 3.5.

## Inspirations binding
Banks A/B/C reference `2026-05-18-inspirations-register.md` exemplars inline as `[INSP:<name>]`. The old-538 archival-sourcing rule (register) is binding here: a current-`fivethirtyeight.com` citation does NOT support an old-538 heuristic.

---

## Master Heuristic Index

| ID | Bank | Heuristic (short, <=12 words) | Source tier(s) | Flags |
|---|---|---|---|---|
| H-TY01 | TY | Body/label text must hit 4.5:1 contrast (3:1 large) | T1 | |
| H-TY02 | TY | Chart labels minimum 14px; 12px absolute floor | T2 | [INSP:OurWorldInData] |
| H-TY03 | TY | Data columns must use tabular-nums lining-nums | T1+T2 | [INSP:FiveThirtyEight-OldSchool] |
| H-TY04 | TY | Monospace reserved for code and fixed-column alignment | T2 | |
| H-TY05 | TY | Type scale ratio ≤1.25 for data-dense dashboards | T2 | [INSP:FiveThirtyEight-OldSchool] informational |
| H-TY06 | TY | Line height ≥1.4× at 14px or below | T1+T2 | informational(superseded-by-H-TY09) |
| H-TY07 | TY | All spacing derives from 4px base grid | T2 | informational |
| H-TY08 | TY | Prose lines must not exceed 80 characters | T1+T2 | |
| H-TY09 | TY | Paragraph body text needs 1.5× line-spacing | T1 | |
| H-TY10 | TY | Data surface type scale: 12/14/16–18/20–24px, four steps | T1+T2 | [INSP:OurWorldInData] |
| H-DV01 | DV | Most critical number goes upper-left of dashboard panel | T1 | [INSP:FiveThirtyEight-OldSchool] |
| H-DV02 | DV | Maximize data-ink ratio; erase non-essential marks | T1 | |
| H-DV03 | DV | Categorical palettes: maximum 5–7 distinct hues per chart | T1+T2 | informational |
| H-DV04 | DV | Prefer direct labeling over legends for ≤6 series | T1 | [INSP:FiveThirtyEight-OldSchool] |
| H-DV05 | DV | Heatmaps encoding rank use sequential/diverging palette | T1+T2 | informational |
| H-DV06 | DV | Use small multiples when question is "how does each differ" | T1 | |
| H-DV07 | DV | Sort heatmap rows/columns by meaningful quantity, not alpha | T1 | |
| H-DV08 | DV | Slope chart for ranked change between exactly two states | T1 | informational |
| H-DV09 | DV | Suppress treemap labels when shorter dimension <20–24px | T1 | informational |
| H-DV10 | DV | Dense annotations not penalized if semantically meaningful | T2 | [INSP:ReutersGraphics] |
| H-DV11 | DV | Gridlines subordinate to data marks; bolded zero baseline only | T1 | [INSP:FiveThirtyEight-OldSchool] |
| H-DV12 | DV | Stat callout must be legible without surrounding prose | T1+T2 | [INSP:ReutersGraphics] informational |
| H-DV13 | DV | Brand colors must have perceptually equal weight across factions | T2 | informational |
| H-DV14 | DV | Histogram bin count: √n heuristic, target 5–15 bins | T1 | informational |
| H-RS01 | RS | Content reflows without 2D scrolling at 320 CSS px | T1 | |
| H-RS02 | RS | Touch targets ≥24×24px or spacing-circle fallback (AA); 44×44 AAA | T1 | |
| H-RS03 | RS | Mobile sticky header ≤48–56px / ~7–8% viewport height | T2 | |
| H-RS04 | RS | Sticky header animation: 300–400ms, multi-px scroll threshold | T2 | |
| H-RS05 | RS | Scroll-triggered motion wrapped in prefers-reduced-motion | T1 | |
| H-RS06 | RS | Audit sticky elements for overflow-containing ancestors | T1 | |
| H-RS07 | RS | Sticky elements need will-change: transform for compositor layer | T1 | corrected |
| H-RS08 | RS | Mobile nav uses aria-expanded + Disclosure pattern, not role=menu | T1 | |
| H-RS09 | RS | Fluid font clamp() must include em/rem anchor, not bare vw | T1 | informational |
| H-RS10 | RS | Fixed/sticky elements need env(safe-area-inset-*) on notched devices | T1 | |
| H-RS11 | RS | Sticky nav harmful when content-to-chrome ratio falls below ~8:1 mobile | T2 | |
| H-RS12 | RS | Horizontal scroll prohibited at 320px except true 2D content | T1 | |
| H-A11Y01 | A11Y | Normal text must achieve ≥4.5:1 contrast, no rounding | T1 | |
| H-A11Y02 | A11Y | Large-scale text (≥18pt / ≥14pt bold) must hit ≥3:1 contrast | T1 | |
| H-A11Y03 | A11Y | UI component boundaries and focus states need ≥3:1 contrast | T1 | |
| H-A11Y04 | A11Y | Color must not be sole channel for data meaning | T1 | |
| H-A11Y05 | A11Y | Primary content reflows single-column at 320px; 2D charts excepted | T1 | |
| H-A11Y06 | A11Y | Multi-header tables need scope="col/row" on every <th> | T1 | informational |
| H-A11Y07 | A11Y | Each page: one <main>, one <nav>, named section/aside regions | T1 | cite-fixed |
| H-A11Y08 | A11Y | Custom widgets need explicit role, aria-label, and dynamic state | T1 | |
| H-A11Y09 | A11Y | Every touch target ≥24×24px or 24px spacing-circle separation | T1 | cite-fixed |
| H-A11Y10 | A11Y | Keyboard controls must display visible focus indicator | T1 | |
| H-ARCH01 | ARCH | Features expose only barrel index.ts; deep imports are lint errors | T1+T2 | |
| H-ARCH02 | ARCH | Features must not import sibling features; flow strictly downward | T2 | |
| H-ARCH03 | ARCH | All feature files colocated; move up only when two features share | T2 | |
| H-ARCH04 | ARCH | .tsx files export exactly one React component, nothing else | T3 | informational |
| H-ARCH05 | ARCH | Context/reducer in dedicated file; hooks expose context, not useContext | T2+T3 | |
| H-ARCH06 | ARCH | Per-file line count enforced by ESLint max-lines at 200–300 | T1 | informational(number) |
| H-ARCH07 | ARCH | Raw hex/px values banned in component files via lint rule | T1 | ⚠ informational |
| H-ARCH08 | ARCH | Barrel exports are explicit named re-exports, never export * | T2 | |
| H-ARCH09 | ARCH | Boundary rules declared once in ESLint config, checked in CI | T2 | |
| H-IA01 | IA | Reflow at 320 CSS px; no horizontal scroll for non-2D content | T1 | |
| H-IA02 | IA | Skip-navigation mechanism required on every route | T1 | |
| H-IA03 | IA | At least two navigation paths to any analytics section | T1 | |
| H-IA04 | IA | Section headings must describe topic or purpose | T1 | |
| H-IA05 | IA | Primary analytics answer reachable without deep scroll | T2 | |
| H-IA06 | IA | Above-fold content must actively signal what lies below | T2 | |
| H-IA07 | IA | Long pages warrant table-of-contents jump-link at top | T2 | informational(number) |
| H-IA08 | IA | Section labels must carry information scent to predict content | T2 | |
| H-IA09 | IA | Truncation threshold: show 6–10 items before hiding rest | T2 | |
| H-IA10 | IA | Truncation for optional depth, not routinely needed content | T2 | |
| H-IA11 | IA | Accordions only when independently navigable, mutually exclusive | T2 | |
| H-IA12 | IA | Chart must not exceed scroll-container height by more than ~1× | T1+T2 | informational(number) |
| H-IA13 | IA | Continuous-scroll pages display position indicator or anchor | T2 | informational(number) |
| H-IA14 | IA | Show More/Load More must communicate running totals | T2 | |

---

## Bank A — Type Scale & Spacing (H-TY)

### Sources

S1. **Understanding Success Criterion 1.4.3: Contrast (Minimum)** — https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html — (T1) — W3C/WAI official explanatory document for WCAG 2.1 SC 1.4.3; defines the large-text pixel threshold (≈18.66px regular / ≈24px) that triggers the relaxed 3:1 ratio vs the standard 4.5:1.

S2. **Understanding Success Criterion 1.4.8: Visual Presentation** — https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html — (T1) — W3C/WAI official explanatory document for WCAG 2.1 SC 1.4.8 (Level AAA); specifies the ≤80-character line-width limit and the 1.5× line-spacing minimum for blocks of text.

S3. **Elements of Typographic Style Applied to the Web, §2.1.2** — http://webtypography.net/2.1.2 — (T2) — Richard Rutter's canonical web adaptation of Bringhurst's *Elements of Typographic Style*; the definitive practitioner reference for measure (45–75 characters, ideal 66) in single-column text.

S4. **"Which fonts to use for your charts and tables" — Datawrapper Blog** — https://www.datawrapper.de/blog/fonts-for-data-visualization — (T2) — Lisa Charlotte Muth (September 12, 2022); peer-recognized data-viz practitioner reference covering tabular vs proportional numbers, sans-serif primacy for labels, and a 14px default / 12px floor.

S5. **"Choosing Fonts for Your Data Visualization" — Nightingale (DVS Journal)** — https://nightingaledvs.com/choosing-fonts-for-your-data-visualization/ — (T2) — Tiffany France, Data Visualization Society journal (June 8, 2020); register-based typographic system taxonomy for data viz (five named systems); authoritative on tabular numbers and sans-serif for labels vs serif for reading.

S6. **ONS Data Visualisation Service Manual — Typography** — https://service-manual.ons.gov.uk/data-visualisation/build-specifications/typography — (T1) — Office for National Statistics (UK government); specifies a 14px minimum for chart elements (12px exception for small multiples), full element-by-element size table, and line-height values (16.8px at 14px = 1.2×).

S7. **font-variant-numeric — MDN Web Docs** — https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric — (T1) — Mozilla Developer Network; official CSS property reference for `tabular-nums` (OpenType `tnum`) and `lining-nums` (OpenType `lnum`); baseline widely-available since January 2020.

S8. **"Ask me anything: What minimum font-size for a high-density data web app?" — Stéphanie Walter** — https://stephaniewalter.design/blog/what-minimum-font-size-for-a-high-density-data-web-app-do-you-suggest/ — (T2) — Stéphanie Walter, UX Researcher & Designer; practitioner synthesis of font-size guidance for high-density B2B/data apps; emphasizes font-choice dependency, progressive disclosure alternative, and the 200% resize requirement.

### Extracted Heuristics

- **H-TY01** Body and label text on any data surface must achieve a contrast ratio of at least 4.5:1 against its background at regular weight, or 3:1 when the text is ≥18.66px regular (≈14pt) or ≥18px bold. [S1] (see also H-A11Y01, H-A11Y02)

- **H-TY02** No chart annotation, axis label, legend item, or data callout may be set below 14px; where small-multiple layouts demand compression, 12px is the absolute floor, and no element on a data surface should be set below 12px under any circumstance. [S4][S6] [INSP:OurWorldInData]

- **H-TY03** Data labels, axis ticks, table cell numbers, and any value that may sit in a vertical column must use `font-variant-numeric: tabular-nums lining-nums` (CSS OpenType `tnum lnum`) so that digit widths are uniform and columns align without letter-spacing hacks. [S5][S7] [INSP:FiveThirtyEight-OldSchool]

- **H-TY04** Monospace type is reserved for code, terminal output, and values whose character-by-character horizontal alignment is load-bearing (e.g. hex IDs, score differentials in a fixed column); all prose labels, faction names, stat annotations, and UI chrome use the project's sans-serif family. [S4][S5]

- **H-TY05** The modular type scale ratio for a data-dense dashboard should be no larger than 1.25 (Major Third); ratios ≥1.333 (Perfect Fourth) produce heading sizes that crowd chart real-estate without adding legibility gain in compact views — use weight contrast to extend the hierarchy within the tighter ratio. [S3][S4] [INSP:FiveThirtyEight-OldSchool] — (informational — not blueprint-binding)

- **H-TY06** Line height for body and label text at 14px or below must be set to at least 1.4× the font size (e.g. 14px × 1.4 = 20px); tighter values at small sizes cause ascenders and descenders to collide visually and reduce word-shape recognition. [S6][S8] — (informational — cited source states 1.2×, contradicting this 1.4× claim; the WCAG-supported line-spacing rule is H-TY09 [SC 1.4.8, 1.5× for text blocks]; treat H-TY09 as binding for line-spacing)

- **H-TY07** All spacing values (padding, gap, margin) on data surfaces must derive from a 4px base grid (multiples: 4, 8, 12, 16, 24, 32); the 4px grain is preferred over 8px-only for data-dense interfaces because it allows half-steps (e.g. 4px inner cell padding, 8px between stat blocks) without breaking the rhythm. [S4] — (informational — not blueprint-binding)

- **H-TY08** Prose reading passages (section introductions, tooltips, contextual notes) must not exceed 80 characters per line; the sweet spot for single-column reading is 45–75 characters (ideal 66), and the WCAG 1.4.8 AAA specification caps line width at 80 glyphs. [S2][S3]

- **H-TY09** Paragraph or section-level body text must have a line-spacing of at least 1.5× the font size (WCAG 1.4.8 AAA "space-and-a-half") and paragraph spacing of at least 1.5× the line-height; compact UI label spacing may use 1.2–1.4× but only for single-line, non-paragraph contexts. [S2][S6]

- **H-TY10** For a data surface where the primary text register is labels and stat values (not prose), a base size of 14px with a scale floor of 12px and a display cap of 20–24px covers all typographic needs without requiring more than four steps in the scale (12 / 14 / 16–18 / 20–24). [S4][S6][S8] [INSP:OurWorldInData]

#### Notes

1. **[INSP:FiveThirtyEight-OldSchool] sourcing constraint.** The Wayback Machine blocked direct fetch during this session (`web.archive.org` refused connection). H-TY03 and H-TY05 tag this inspiration based on well-documented secondary descriptions of old-538 typography practice (Decima Mono for annotations, Atlas Grotesk Bold for labels, sans-serif primacy). The owner should treat these tags as directional, not source-verified. If a Wayback fetch becomes available in a later session, S4/S5 alone already support the heuristics independently.

2. **No T3-only heuristics.** All ten heuristics are supported by at least one T1 or T2 source. Zero ⚠ adjudicate flags.

3. **H-TY05 (scale ratio cap at 1.25)** is supported by practitioner inference from S3 and S4 rather than a formal study. The underlying logic (smaller ratio = less heading bloat in constrained viewports) is reproducible by calculation. If the owner wants a stronger citation for this specific claim, a dedicated search for A/B or perceptual research on ratio choice in dashboard contexts would be the next step.

4. **`font-variant-numeric` font-support caveat.** H-TY03 requires that the chosen typeface supports the `tnum` and `lnum` OpenType features. IBM Plex Sans (already in the project's design handoff) supports both; this should be verified against Newsreader (the serif family in the handoff) before applying H-TY03 to any prose-weight numeric.

5. **Stéphanie Walter (S8) on progressive disclosure.** Her core practical recommendation — that reducing font size is a band-aid for an information-architecture problem — is directionally important for the TI4 app. It is not formalized as a heuristic here because it is a design-process principle, not a testable screen-level rule. Owner may wish to carry it into the design review as a framing note.

---

## Bank B — Data-Dashboard & Data-Viz Comprehension (H-DV)

### Sources

**S1.** Edward Tufte, *The Visual Display of Quantitative Information* (2nd ed., Graphics Press, 2001) — https://www.edwardtufte.com/book/the-visual-display-of-quantitative-information/ — **(T1)** — Canonical authority on data-ink ratio, chartjunk elimination, small multiples, and graphical integrity; cited across the entire visualization field.

**S2.** Colin Ware, *Information Visualization: Perception for Design* (4th ed., Morgan Kaufmann, 2020) — https://scholars.unh.edu/ccom/140/ — **(T1)** — Ground-truth reference on vision science applied to visualization; defines preattentive attributes, color hue limits, and channel effectiveness hierarchy.

**S3.** Stephen Few, *Information Dashboard Design: Displaying Data for At-a-Glance Monitoring* (2nd ed., Analytics Press, 2013) — https://www.amazon.com/Information-Dashboard-Design-At-Glance/dp/1938377001 — **(T1)** — Practitioner-canonical text on dashboard layout, legend elimination, direct labeling, visual hierarchy, and "at-a-glance" monitoring design; workshop materials at perceptualedge.com.

**S4.** Nielsen Norman Group — "F-Shaped Pattern of Reading on the Web: Misunderstood, But Still Relevant" (2017) + "Text Scanning Patterns: Eyetracking Evidence" (2017) — https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/ and https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/ — **(T1)** — Eye-tracking corpus (thousands of users) establishing reading-order priors for screen layout; directly applicable to dashboard panel placement.

**S5.** UK Office for National Statistics (ONS), *Data Visualisation Service Manual: Chart Elements & Chart Typography* — https://service-manual.ons.gov.uk/data-visualisation/build-specifications/chart-elements — **(T1)** — Government-standard specification covering gridlines, legend vs. direct-label policy, axis rules, and WCAG-aligned contrast requirements for charts.

**S6.** Datawrapper, "A Detailed Guide to Colors in Data-Vis Style Guides" (Lisa Charlotte Muth, 2022) — https://www.datawrapper.de/blog/colors-for-data-vis-style-guides — **(T2)** — Practitioner synthesis with named authorship; covers categorical palette size, brand-color conflicts, accessibility testing, and the 12-color trap.

**S7.** Dataquest, "How to Generate FiveThirtyEight Graphs in Python" (with Matplotlib style documentation) — https://www.dataquest.io/blog/making-538-plots/ ; cross-referenced against the Matplotlib `fivethirtyeight` style sheet — https://matplotlib.org/stable/gallery/style_sheets/fivethirtyeight.html — **(T2)** — Systematic deconstruction of the Nate Silver-era 538 chart system (grey canvas, inline labels, bolded baseline, enlarged tick fonts, colorblind palette) with code-level specification.

**S8.** Layla McCay et al. (IEEE TVCG), "Striking a Balance: Reader Takeaways and Preferences when Integrating Text and Charts" — https://arxiv.org/abs/2208.01780 — **(T2)** — Empirical study (IEEE Transactions on Visualization and Computer Graphics) on how annotation density, placement, and content type affect reader comprehension and stated preference; finding that heavily-annotated charts are not penalized.

### Extracted Heuristics

**H-DV01** Place the single most critical number or status indicator in the upper-left quadrant of any dashboard panel, because eye-tracking shows the first horizontal sweep and the left-side vertical scan receive the heaviest fixation density — anything placed lower-right is at high risk of being skipped entirely. [S4] [INSP:FiveThirtyEight-OldSchool]

**H-DV02** Maximize the data-ink ratio: erase every mark — gridline, border, tick, background fill — that can be removed without losing information, reserving ink exclusively for the quantitative data itself. [S1]

**H-DV03** Limit categorical color palettes to a maximum of five to seven distinct hues per chart; beyond that threshold, short-term memory cannot simultaneously hold the hue-to-category mappings needed for rapid lookup, converting an at-a-glance chart into a decode-the-legend exercise. [S2] [S6] — (informational — not blueprint-binding)

**H-DV04** Prefer direct labeling over legends for line charts, slope charts, and any chart with six or fewer series: place the category name at or near the terminal point of each line in the matching hue, eliminating the cross-reference scan that legends impose. [S3] [S5] [INSP:FiveThirtyEight-OldSchool]

**H-DV05** In a heatmap encoding rank or intensity, use a sequential (single-hue lightness-ramping) or diverging palette — not a categorical/qualitative palette — because only sequential encoding lets the viewer preattentively rank cells without consulting a legend; use hue variation only when the encoded variable is purely nominal. [S2] [S6] — (informational — not blueprint-binding)

**H-DV06** Apply small multiples (the same chart form repeated at consistent scale across categories) rather than overlaying all series in one chart whenever the primary question is "how does each entity differ from the others" rather than "how do all entities move together" — small multiples shift reader effort from decoding the chart mechanics to reading the data. [S1] [S3]

**H-DV07** For a heatmap with categorical axes (e.g., faction × strategy card), sort rows and columns by a meaningful quantity (e.g., descending pick rate or win rate) rather than alphabetically, so the highest-value cells cluster in the upper-left where F-pattern attention concentrates. [S1] [S4]

**H-DV08** A slope chart (two-endpoint line) is appropriate for showing ranked change between exactly two states (e.g., rounds, game phases); prefer it over a full line chart when intermediate variability is noise rather than signal, and over a grouped bar chart when the reader's primary question is "which entity rose or fell the most." [S1] [S3] — (informational — not blueprint-binding)

**H-DV09** For treemap label legibility, suppress text in any cell whose shorter dimension falls below approximately 20–24 px (the minimum for a 12pt sans-serif to render without clipping); either omit the label or replace it with a tooltip, since a partially-visible label is worse for comprehension than no label at all. [S3] [S5] — (informational — not blueprint-binding)

**H-DV10** Annotations placed directly on a chart (title-level callout, inline data label, annotated peak) are not penalized by readers for density — heavily-annotated charts are preferred over sparse ones when the annotations are semantically meaningful — but placement matters: information best interpreted as "context for the whole" belongs in the title or subtitle, while information tied to a specific data point belongs adjacent to that mark. [S8] [INSP:ReutersGraphics]

**H-DV11** Gridlines should be subordinate to data marks: render them at reduced opacity or a lighter grey (ONS specifies #D9D9D9 at 1px for secondary gridlines, with a single bolded zero baseline at 1.5px), and always layer them beneath data marks — gridlines that overprint data increase visual noise without adding information. [S5] [INSP:FiveThirtyEight-OldSchool]

**H-DV12** For editorial prose+stat integration (a stat callout embedded in narrative text), the statistic must be independently legible as a standalone number before the prose context is read; this means the number, its unit, and the comparison baseline (vs. what?) must all be visible without reading the surrounding sentence. [S3] [S8] [INSP:ReutersGraphics] — (informational — not blueprint-binding)

**H-DV13** When a faction (or other entity) uses a fixed brand color that cannot be changed, assign that color only when the faction is the subject of the chart; for multi-faction comparative charts, verify that all faction hues maintain perceptually equal visual weight (no one hue appears to "pop" more than others due to luminosity differences) — adjust saturation or lightness rather than swapping hues. [S6] — (informational — not blueprint-binding)

**H-DV14** For histogram bin count, apply the square root rule (bins ≈ √n) as a starting heuristic for small datasets (n < 100 games), then verify that the chosen bin count reveals the distribution shape without masking bimodality; target 5–15 bins for typical playgroup-sized datasets (n ≈ 7–50 games). [S3] — (informational — not blueprint-binding)

#### Notes

1. **FiveThirtyEight sourcing constraint honored.** The [INSP:FiveThirtyEight-OldSchool] tag is used only via practitioner reverse-engineering of the old 538 style (Dataquest article + Matplotlib style sheet), not via the current fivethirtyeight.com (which now redirects to ABC News and no longer represents the Silver-era design). The 2020 forecast article URL confirmed this — it 301-redirects to abcnews.com/politics.

2. **Ware hue-limit number.** The "5–7 hue" rule in H-DV03 is consistent with what appears in practitioner reconstructions of Ware's work (flylib.com extract cites "nine in short-term memory" for hues but recommends five for rapid comprehension). A direct page citation from the 4th edition print would be stronger — an independent verifier should confirm the exact page in *Information Visualization: Perception for Design* (4th ed.) Ch. 4.

3. **"2-second" comprehension benchmark.** No published empirical study with a specific "answer within 2 seconds" threshold for dashboard comprehension was located. S3 (Few) uses the phrase "at a glance" but does not quantify it. H-DV01 is anchored to gaze-density (S4) rather than a time benchmark, which is the honest framing. Avoid quoting "2 seconds" as a citable number in downstream design documents.

4. **Reuters Graphics.** No first-party Reuters Graphics design-principle documentation was locatable as a public URL. [INSP:ReutersGraphics] is used in H-DV10 and H-DV12 to point at the *product* as exemplar, not as a citable source; both heuristics carry at least one T1/T2 source.

5. **Treemap px threshold (H-DV09).** The 20–24 px floor is derived from combining the ONS 12pt minimum font rule (S5) with typical screen DPI assumptions (96 dpi → ~16 px/pt, 12pt ≈ 16px plus padding). It is a calculated inference, not a direct citation. An independent verifier should treat this as a reasonable engineering estimate; the underlying 12pt minimum is T1-sourced.

---

## Bank C — Responsive & Sticky-Element Patterns (H-RS)

### Sources

S1. **Understanding Success Criterion 1.4.10: Reflow** — https://www.w3.org/WAI/WCAG21/Understanding/reflow.html — (T1) — W3C normative understanding document; defines the 320 CSS px / 400% zoom threshold and the two-dimensional scrolling prohibition at Level AA.

S2. **Understanding Success Criterion 2.5.8: Target Size (Minimum)** — https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html — (T1) — W3C normative understanding document for WCAG 2.2; specifies 24 × 24 CSS px minimum with spacing-circle fallback.

S3. **Understanding Success Criterion 2.5.5: Target Size (Enhanced)** — https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html — (T1) — W3C Level AAA criterion; specifies 44 × 44 CSS px for touch targets to accommodate coarse-pointer users.

S4. **Understanding Success Criterion 2.3.3: Animation from Interactions** — https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html — (T1) — W3C understanding doc; defines "non-essential motion" that must be disableable; covers parallax, scroll-triggered decoration, sticky header transitions.

S5. **`prefers-reduced-motion` CSS media feature — MDN Web Docs** — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion — (T1) — MDN reference; documents the `reduce` / `no-preference` values, platform OS paths, and baseline browser support (widely available since January 2020).

S6. **`position` — MDN Web Docs** — https://developer.mozilla.org/en-US/docs/Web/CSS/position — (T1) — MDN reference; documents `position: sticky` mechanics, containing-block / overflow gotcha, and performance/accessibility repaint concerns.

S7. **Sticky Headers: 5 Ways to Make Them Better — Nielsen Norman Group** — https://www.nngroup.com/articles/sticky-headers/ — (T2) — NN/g practitioner research article; includes content-to-chrome ratio examples (13:1 reasonable, 2:1 harmful), animation timing (300–400 ms), tap target floor (1 cm × 1 cm), and partially-persistent header guidance.

S8. **Example Disclosure Navigation Menu — WAI-ARIA Authoring Practices Guide** — https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/ — (T1) — W3C normative ARIA pattern; specifies `aria-expanded`, `aria-controls`, `aria-current`, keyboard interactions (Tab, Space/Enter, Escape), and explicit note that `role="menu"` is incorrect for site nav.

S9. **CSS Technique C39: Using `prefers-reduced-motion` to prevent motion — WAI** — https://www.w3.org/WAI/WCAG21/Techniques/css/C39 — (T1) — W3C sufficient technique for WCAG 2.3.3; provides the canonical media-query pattern for disabling scroll-triggered animation and transition motion.

S10. **`env()` — MDN Web Docs** — https://developer.mozilla.org/en-US/docs/Web/CSS/env — (T1) — MDN reference; documents `safe-area-inset-*` environment variables, their use with `viewport-fit=cover`, and the requirement that values return `0` on unobstructed rectangular viewports.

### Extracted Heuristics

- **H-RS01** — All vertical-scroll content must reflow without two-dimensional scrolling at a viewport width equivalent to 320 CSS pixels (= 1280 px browser window at 400% zoom), with no loss of information or functionality, except for inherently two-dimensional content such as data tables and maps. [S1] (see also H-A11Y05)

- **H-RS02** — Interactive touch targets must be either (a) at least 24 × 24 CSS pixels in size, or (b) spaced so that a 24 CSS px diameter circle centered on each undersized target does not intersect any other target or circle, per WCAG 2.5.8 Level AA; the Level AAA enhanced criterion (WCAG 2.5.5) raises this floor to 44 × 44 CSS pixels, which aligns with Apple HIG and Material Design guidelines. [S2] [S3] (see also H-A11Y09)

- **H-RS03** — A sticky header on a 375 px-wide / ~667 px-tall mobile viewport (iPhone SE / standard reference) should occupy no more than ~7–8% of viewport height (approximately 48–56 px); NN/g documents a 13:1 content-to-chrome ratio as "reasonable" and a 2:1 ratio as harmful, which at 667 px yields a ~48 px ceiling before the ratio degrades past acceptable. [S7]

- **H-RS04** — When a sticky header must animate (e.g., partially-persistent show/hide on scroll direction change), use a 300–400 ms duration and require the user to scroll more than a few pixels in the triggering direction before activating, to prevent accidental triggering during micro-adjustments. [S7]

- **H-RS05** — Any scroll-triggered animation or non-essential motion attached to a sticky element (parallax, header shrink transitions, slide-in effects) must be wrapped in `@media (prefers-reduced-motion: no-preference)` or suppressed via `@media (prefers-reduced-motion: reduce)`, satisfying WCAG 2.3.3 Level AAA; `scroll-behavior: smooth` must also be conditional on this query. [S4] [S5] [S9]

- **H-RS06** — `position: sticky` silently degrades to `position: relative` if an ancestor element has `overflow: hidden`, `scroll`, `auto`, or `overlay` — any nav bar or scrubber that appears stuck must be audited for overflow-containing ancestors in the component tree; the sticky element also always creates a new stacking context regardless of `z-index`. [S6]

- **H-RS07** Sticky elements MAY use will-change:transform as an optional compositor-promotion performance hint — it is NOT required. [S6]

- **H-RS08** — A collapsed/hamburger navigation on mobile must use a `<button>` with `aria-expanded="false|true"` toggled by JavaScript, `aria-controls` pointing to the nav container's `id`, and `aria-current="page"` on the active link; the `role="menu"` pattern is explicitly wrong for site navigation — use the W3C Disclosure Navigation pattern instead, which only requires Tab, Space/Enter, and Escape keyboard interactions. [S8]

- **H-RS09** — Fluid font sizing via `clamp(min, preferred, max)` must include `em`/`rem` anchors in the preferred value (e.g., `17px + 0.24vw`) rather than a bare `vw` value alone, so that browser zoom (WCAG 1.4.4) continues to scale text; the maximum must not exceed 2.5× the minimum to guarantee WCAG 1.4.4 Resize Text compliance across the full zoom range. [S1] [S5] — (informational — not blueprint-binding)

- **H-RS10** — On iOS devices with notches or Dynamic Island, any `position: fixed` or `position: sticky` element at the top or bottom of the viewport must add `padding: env(safe-area-inset-top)` / `padding-bottom: max(16px, env(safe-area-inset-bottom))` — activated only when `viewport-fit=cover` is set in the viewport meta tag — to prevent interactive chrome from being obscured by hardware UI features. [S10]

- **H-RS11** — Sticky navigation that persists across an entire long-scroll view is beneficial when users need frequent cross-section access (nav, search, utility); it is net-harmful when users stay within a single content category per session or when the header height reduces content-to-chrome ratio below approximately 8:1 on mobile, at which point a partially-persistent (hide-on-scroll-down, reveal-on-scroll-up) or static-with-anchor pattern should be preferred. [S7]

- **H-RS12** — Horizontal scrolling is prohibited by WCAG 1.4.10 for text content at 320 CSS px viewport width; exceptions exist only for content where two-dimensional layout is essential to meaning (e.g., the Faction × Strategy heatmap or the VP Race chart), and each such exception is scoped narrowly — it does not cascade to surrounding UI elements or the page shell. [S1]

#### Notes

1. **No formal standard for sticky-header viewport-height percentage.** The 10–15% figure circulating in practitioner blogs (T3 sources omitted per rubric) is not sourced to any formal specification or named practitioner paper. The 13:1 ratio from NN/g [S7] is the strongest citable anchor; H-RS03 derives the px ceiling from that ratio rather than relying on the uncited percentage claims.

2. **WCAG 2.3.3 is Level AAA, not AA.** H-RS05 correctly flags this. The project should still implement it (it costs nothing and the vestibular harm is real), but it cannot be cited as a mandatory compliance floor at the AA level the way 1.4.10 and 2.5.8 are.

3. **`safe-area-inset-*` concrete pixel values vary by device generation and are not in the spec.** H-RS10 cites the mechanism, not a specific pixel number. At time of writing, iPhone 15 Pro Dynamic Island insets are ~59 px top / ~34 px bottom in portrait — but these are device-reported values, not authored constants, and the `env()` function handles them correctly at runtime without hard-coding.

4. **OurWorldInData responsive nav details were not publicly documented** in the fetched redesign article (mobile optimization listed as forthcoming). The [INSP:OurWorldInData-Grapher] proposal is based on direct observation of live behavior, not a citable document — it is flagged as a proposed inspiration for the owner to confirm, not a source backing any heuristic.

5. **`will-change: transform` caveat.** While recommended by MDN [S6], overuse of `will-change` on many elements simultaneously can increase GPU memory pressure on mobile. Apply it only to the sticky header element(s), not to scroll containers or other elements.

---

## Bank D — WCAG AA / Accessibility (H-A11Y)

### Sources

S1. WCAG 2.1 SC 1.4.3 Contrast (Minimum) — Understanding Doc — https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html — (T1) — Defines 4.5:1 for normal text, 3:1 for large text (≥18pt or ≥14pt bold), with exceptions for inactive components, incidental/decorative text, and logotypes.

S2. WCAG 2.1 SC 1.4.11 Non-text Contrast — Understanding Doc — https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html — (T1) — Requires 3:1 contrast for UI component visual indicators (borders, focus rings, control affordances) and meaningful graphical objects against adjacent colors.

S3. WCAG 2.1 SC 1.4.1 Use of Color — Understanding Doc — https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html — (T1) — Prohibits color as the sole means of conveying information; requires a supplementary visual channel (text label, pattern, shape, or luminance difference ≥3:1).

S4. WCAG 2.1 SC 1.4.10 Reflow — Understanding Doc — https://www.w3.org/WAI/WCAG21/Understanding/reflow.html — (T1) — Content must reflow at 320 CSS px width (equivalent to 1280px viewport at 400% zoom) without horizontal scrolling; true 2D-layout content (data tables, complex charts) is explicitly excepted.

S5. WCAG 2.1 SC 1.3.1 Info and Relationships — Understanding Doc — https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html — (T1) — Semantic relationships (heading hierarchy, table scope, landmark regions) must be programmatically determinable, not conveyed through visual styling alone.

S6. WCAG 2.1 SC 4.1.2 Name, Role, Value — Understanding Doc — https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html — (T1) — Custom UI components built from non-semantic HTML must expose role, accessible name, and state/value via ARIA attributes; omitting `role` from a `<div>` or `<span>` used as a control is an explicit named failure.

S7. WCAG 2.2 SC 2.5.8 Target Size (Minimum) — Understanding Doc — https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html — (T1) — Touch/pointer targets must be at least 24×24 CSS px, or separated such that a 24 px diameter circle centered on each target does not overlap adjacent targets; inline text links are excepted.

S8. WCAG 2.1 SC 2.4.7 Focus Visible — Understanding Doc — https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html — (T1) — Every keyboard-operable control must have a visible focus indicator in at least one mode of operation; browser-default outlines satisfy the criterion unless the author has suppressed or overridden them.

S9. **ARIA Authoring Practices Guide — Landmark Regions** — https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/ — (T1) — W3C WAI APG normative guidance on landmark regions; specifies that each page should have one `main` landmark, discusses navigation landmarks (each should have a unique label if more than one), and covers `section`/`aside` as landmarks when given accessible names.

### Extracted Heuristics

- **H-A11Y01** Normal body text (< 18 pt / < 14 pt bold) must achieve a contrast ratio of at least 4.5:1 against its background, measured without rounding (e.g. 4.499:1 fails). [S1] (see also H-TY01)

- **H-A11Y02** Large-scale text (≥ 18 pt regular or ≥ 14 pt bold) must achieve a contrast ratio of at least 3:1 against its background; the `--font-subhead` and `--font-body` tokens used at large sizes must be verified to hit this threshold with their `--ink-3` and `--ink-4` pairings on `--paper`. [S1] (see also H-TY01)

- **H-A11Y03** Every interactive UI component's visual boundary or affordance (button border, input outline, dropdown indicator, nav link underline) must achieve at least 3:1 contrast against the adjacent background, and focus-state indicators must meet the same 3:1 threshold in both focused and unfocused-state comparison. [S2]

- **H-A11Y04** Color must not be the sole channel conveying data meaning: every heatmap cell, faction dot, chart series, or status badge that uses color to distinguish values must pair that color with a text label, pattern, numeric value, or distinct shape visible to a color-blind or monochrome user. [S3]

- **H-A11Y05** All primary content must reflow to a single-column layout at 320 CSS px viewport width without requiring horizontal scrolling; the `PickRateHeatmap` grid and any fixed-width chart are excepted as true 2D-layout content, but surrounding headings, FilterBar controls, and section navigation must reflow independently. [S4] (see also H-RS01)

- **H-A11Y06** Every `<table>` with more than one header row or column must carry `scope="col"` or `scope="row"` on every `<th>`, and every data `<td>` in a complex table must be associable to its headers; absence of `scope` in a multi-row/column table is a named WCAG failure. [S5] — (informational — not blueprint-binding)

- **H-A11Y07** Each page must expose exactly one `<main>` landmark, a `<nav>` for site navigation, and optionally named `<section>`/`<aside>` regions so that assistive-technology users can skip to content areas without reading all preceding markup. [S9]

- **H-A11Y08** Every custom interactive widget constructed from non-semantic elements (`<div>`, `<span>`) must carry an explicit `role` (e.g. `role="dialog"`, `role="listbox"`) plus `aria-label` or `aria-labelledby` for its accessible name, and must reflect dynamic state (e.g. `aria-expanded`, `aria-selected`) programmatically. [S6]

- **H-A11Y09** Every pointer/touch target (nav buttons, filter selects, round-scrubber controls, heatmap cells with interactive `title` tooltips triggered on click) must be at least 24×24 CSS px, or surrounded by spacing such that a 24 px diameter circle centered on the target does not intersect an adjacent target. [S7] (see also H-RS02)

- **H-A11Y10** Every keyboard-operable control must display a visible focus indicator; author CSS that sets `outline: none` or `outline: 0` without providing a replacement focus style is a direct failure of SC 2.4.7, and any such suppression must be audited across the design system's inline-style-driven components. [S8]

#### Notes

Adjudication note: bank titled "WCAG AA" but SC 1.4.1, 1.3.1, 4.1.2 are Level A; AA is the conformance target, not the floor of every cited SC.

1. **Auth button contrast is still open.** The Lighthouse `color-contrast` audit flags the same `<button>` node (the Archivist/Sign-out button in `AppHeader`) across all four routes in the post-fix reports. The commit message claims ≥ 4.5:1 for `var(--ink-3)`, but the axe-core audit disagrees. The actual rendered contrast of `var(--ink-3)` on `var(--paper)` must be measured with a color contrast tool before this can be called closed.

2. **`landmark-one-main` persists on /game and /agenda.** The `<main>` wrapper was added in `App.tsx` at the Routes level, but both `/game` and `/agenda` still fail `landmark-one-main` post-fix. The most likely cause is that the inner page components render their own structural `<div>` trees that suppress or duplicate the landmark, or the fix wasn't rebuilt/redeployed before the audits ran. This needs a live re-audit.

3. **FactionDot has no accessible name.** `FactionDot` renders a bare `<span>` with a background color and no `aria-label`, `title`, or `aria-hidden`. In `FactionChip`, the dot is correctly `aria-hidden="true"` because the faction name text accompanies it. But `FactionDot` used standalone (e.g. in `CategoryBreakdown`, `LeaderboardPodium`, `EntityCard`) conveys faction identity solely through color, violating H-A11Y04. The fix pattern is `aria-label={factionId}` on the dot, or ensuring a visible text sibling is always present.

4. **Heatmap cells expose data only via `title` tooltip (hover-only).** The `PickRateHeatmap` grid uses `title={tipText}` for data disclosure. `title` is not exposed on touch devices, is not read by most screen readers as a primary label, and the cell's visual content is color tier + a small numeric label. The numeric label (`cellLabels`) does provide a non-color channel (H-A11Y04 partially satisfied), but the label is rendered at `font-size: 9px` — below the 11px effective floor established in V1.1 — and may fail H-A11Y01 at that size. The `title` attribute alone does not satisfy SC 4.1.2 `Name, Role, Value` for an interactive-intent element.

5. **`prefers-reduced-motion` is entirely absent.** The app has CSS `transition` properties in `PlanetControlSlideshow.tsx` and Tailwind `transition-colors` in `DropZone` and `GamePreview`. No `@media (prefers-reduced-motion: reduce)` guard exists anywhere in the codebase. SC 2.3.3 is Level AAA so this is not a strict AA failure, but the WCAG Understanding doc explicitly recommends honoring the OS preference as a best practice; the absence is worth flagging for the design system.

6. **Target size for heatmap cells.** Each `PickRateHeatmap` cell is `height: 24` with a computed width that depends on column count (8 strategy cards, total grid ~320–400px). At 8 columns in a ~320px container, cells may be as narrow as ~26px, just clearing the 24px minimum — but only if the container is not smaller. At 320px reflow width this margin collapses. Flag for measurement.

7. **Source tier balance.** All 8 sources are T1 (W3C). No T2 or T3 sources were needed or used for this bank; the WCAG specifications are the definitive standard.

#### Already-addressed (from Lighthouse audit a23e486 + post-fix Lighthouse reports)

- **`landmark-one-main` (partial) — regression-guard [H-A11Y07]:** `App.tsx` `<div>` wrapping `<Routes>` replaced with `<main>`; Lighthouse score on `/` improved. However, `/game`, `/meta`, and `/agenda` routes still flagged `landmark-one-main: FAIL` in post-fix audits (scores 89, 88, 94) — fix may not have propagated, or the inner page structure introduces a second nesting issue. Requires re-verification.

- **`select-name` on FilterBar — regression-guard [H-A11Y08]:** `aria-label={dropdownLabel}` added to the `<select>` in `FilterBar.tsx`; `/meta` `select-name` failure cleared. `/game` route `select-name` still flagged in post-fix report — a second `<select>` elsewhere may remain unlabeled.

- **Auth button contrast — regression-guard [H-A11Y01]:** `AppHeader.tsx` auth buttons changed from `var(--ink-4)` to `var(--ink-3)` targeting ≥ 4.5:1; Lighthouse still flags the same button node in all four post-fix reports (`color-contrast: FAIL, 1 item`). The fix may not have achieved the threshold, or the computed color differs from design-token intent.

- **`link-in-text-block` on HomePage — regression-guard [H-A11Y04]:** `textDecoration: none` removed from inline `<a>` tags; links should now render with browser-default underline, providing the required non-color visual cue.

- **`FactionVotingPanel` table `scope` — regression-guard [H-A11Y06]:** `scope="col"` and `scope="row"` added to `<th>` elements; however `/agenda` post-fix report still flags `td-has-header: FAIL, 1 item` for a large table — this may be a different table in the same route that was not updated.

- **Font preload non-blocking — (performance/a11y boundary):** `rel=preload` with `noscript` fallback added to `index.html` to prevent FOIT (Flash of Invisible Text), which, while primarily a performance concern, is a WCAG 1.4.3-adjacent issue (invisible text fails contrast).

---

## Bank E — Feature-Module Architecture & Code-Size Governance (H-ARCH)

### Sources

S1. **Feature-Sliced Design — Reference: Layers** — https://feature-sliced.design/docs/reference/layers — (T2) — Canonical FSD methodology spec: 7-layer hierarchy, unidirectional dependency rule ("a module can only import slices located on layers strictly below"), isolation rule, `@x` cross-entity notation.

S2. **Feature-Sliced Design — Reference: Public API** — https://feature-sliced.design/docs/reference/public-api — (T2) — Defines slice public API contract: explicit re-exports only (no wildcard `export *`), internal paths off-limits to consumers; rationale: "the rest of the application must be protected from structural changes to the slice."

S3. **Steiger — Universal file-structure & architecture linter (feature-sliced/steiger)** — https://github.com/feature-sliced/steiger — (T2) — Standalone CLI linter for FSD; built-in rules: `fsd/no-cross-imports`, `fsd/no-higher-level-imports`, `fsd/public-api` (requires index.ts per slice), `fsd/no-public-api-sidestep` (blocks deep imports); integrates into CI as `npx steiger ./src`.

S4. **ESLint — `max-lines` rule** — https://eslint.org/docs/latest/rules/max-lines — (T1) — Official ESLint built-in: enforces a per-file line ceiling; options `max` (default 300), `skipBlankLines`, `skipComments`; rationale: "large files tend to do a lot of things and can make it hard following what's going"; industry guidance 100–500 lines.

S5. **ESLint — `no-restricted-imports` rule** — https://github.com/eslint/eslint/blob/main/docs/src/rules/no-restricted-imports.md — (T1) — Official ESLint built-in: bans named imports or glob path patterns with custom error messages; `patterns` array with `group` + `importNamePattern` supports cross-feature deep-import prevention without a third-party plugin.

S6. **Kent C. Dodds — "Colocation"** — https://kentcdodds.com/blog/colocation — (T2) — Named practitioner principle: "place code as close to where it's relevant as possible"; colocate tests, styles, hooks, and utilities with the component they serve; move up the tree only when genuinely shared.

S7. **Jeremy Richardson — "Optimizing HMR in React with Vite: One Component Export Per File"** — https://jeremyrichardson.dev/blog/optimizing-hot-module-replacement-hmr-in-react-with-vite-the-importance-of-one-component-export-per-file — (T3) — Documents the Vite/React Fast Refresh constraint: a `.tsx` file exporting non-component symbols (hooks, constants) degrades to a full page reload; solution is one component per `.tsx` file with hooks in `.ts` files; cites `eslint-plugin-react-refresh` for enforcement.

S8. **`eslint-plugin-boundaries` (javierbrea)** — https://github.com/javierbrea/eslint-plugin-boundaries — (T2) — Maintained ESLint plugin; define element types by path pattern, declare allowed dependency graph via `boundaries/dependencies` rule with `default: disallow` + explicit allow list; works without monorepo tooling; real-time lint errors on cross-boundary imports.

### Extracted Heuristics

- **H-ARCH01** A feature module exposes only the symbols listed in its `index.ts` barrel; any import that bypasses the barrel to reach an internal path (`features/foo/model/store.ts`) is a lint error enforced by `no-restricted-imports` patterns or Steiger's `fsd/no-public-api-sidestep` rule. [S2, S3, S5]

- **H-ARCH02** Feature modules must not import from sibling feature modules at the same architectural layer; allowed dependencies flow strictly downward (features → entities → shared), enforced at lint time via `eslint-plugin-boundaries` or Steiger's `fsd/no-cross-imports` rule. [S1, S3, S8]

- **H-ARCH03** Every file that is part of a feature module — component, hook, test, style, type declaration — lives inside that feature's directory (colocation); a file moves to a higher shared layer only when two or more distinct features actually consume it. [S6]

- **H-ARCH04** A `.tsx` file must export exactly one React component and nothing else (no hooks, constants, or utility exports alongside a component); hooks and constants go in separate `.ts` files to preserve Vite Fast Refresh hot-module-replacement without full page reloads. [S7] — (informational — project convention, not standards-backed)

- **H-ARCH05** Each feature's context/reducer provider is defined in a dedicated `*Context.tsx` file alongside custom hooks (`use*.ts`) that expose the context value; components import the hooks, never `useContext` directly, keeping context wiring colocated but separable from view files. [S6, S7] — and supported by the React docs pattern: [https://react.dev/learn/scaling-up-with-reducer-and-context]

- **H-ARCH06** Per-file line count is enforced by ESLint's `max-lines` rule (recommended ceiling 200–300 lines with `skipBlankLines: true, skipComments: true`); exceeding the ceiling is a lint error that fails CI, structurally preventing god-files without manual code-review discipline. [S4] — (mechanism binding; specific 200–300 ceiling informational — Task 11 sets the number from real LOC data)

- **H-ARCH07** Raw hex color literals (e.g. `#3B82F6`) and raw pixel values used as design decisions must not appear in component files; they are banned via a custom ESLint rule or `no-restricted-syntax` AST selector targeting string/numeric literals in style props, with a message directing authors to the design-token file (`tokens.css` / Tailwind config). [S5] — (informational — cited rule mis-tiered: no-restricted-imports bans paths not style literals; the "ban raw hex/px in components" intent is retained as a Stage 2 §4.2 requirement to be met via a correct mechanism per Bank E Notes, not the cited rule)

- **H-ARCH08** Barrel exports (`index.ts`) at the feature root are the only stable cross-feature import surface; the barrel lists explicit named re-exports (never `export * from`), so the public API is self-documenting and rename-safe. [S2, S3]

- **H-ARCH09** Architectural boundary rules (which feature types may import which) are declared once in a project-level ESLint config (via `eslint-plugin-boundaries` element definitions or Steiger's `steiger.config.ts`) rather than repeated in per-directory `tsconfig` paths hacks, so the rule set is the single source of truth checked in CI. [S3, S8]

#### Notes

### Realistic per-file / per-feature LOC ceiling enforcement mechanisms

Three viable mechanisms exist for this project (ESLint + Vite + TS, no monorepo):

1. **ESLint `max-lines` (T1 — recommended):** Zero additional dependencies; configure `"max-lines": ["error", { "max": 250, "skipBlankLines": true, "skipComments": true }]` in `eslint.config.ts`. Fails `npm run lint` (and therefore CI) on overage. Can be overridden per-file with `/* eslint-disable max-lines */` which is self-documenting. This is the lowest-friction option for this stack.

2. **Steiger CLI (T2 — additive):** Run `npx steiger ./src` as a separate CI step. Enforces FSD structural rules (layer names, public API presence, cross-imports) that `max-lines` doesn't cover. Not a replacement for `max-lines` — the two are complementary. Adds a new config file (`steiger.config.ts`) but no ESLint changes.

3. **Custom CI script (ad-hoc):** A short Node/PowerShell script that counts lines per file and exits non-zero above a threshold, added as a CI check. More flexible (can apply different ceilings per directory) but requires maintenance and is invisible to the editor. Prefer `max-lines` for editor integration.

**Recommended for this project:** Start with ESLint `max-lines` at 250 lines (strict enough to prevent god-files; permissive enough to not split small utility files artificially), plus Steiger for architectural boundary enforcement. Add `eslint-plugin-boundaries` if/when Steiger's CLI-only model is inconvenient for editor inline feedback.

### Concerns

- **H-ARCH07 is T3-corroborated only** for the specific "ban raw hex in JSX" enforcement pattern. The underlying tools (`no-restricted-syntax`, custom ESLint rules) are T1, but no official style guide or widely-cited practitioner source mandates this specific configuration — mark for adjudication before treating it as a hard rule.

- **Steiger is FSD-specific:** Teams not adopting the full FSD layer naming convention cannot use Steiger out of the box; `eslint-plugin-boundaries` is the more portable alternative for projects with a simpler feature-folder structure.

- **`max-lines` does not enforce per-feature aggregate size** — only per-file. A feature that splits one 500-line file into five 100-line files satisfies the rule while still being a large feature. If per-feature ceiling governance is desired, it requires a custom CI script or directory-size check.

- **One component per `.tsx` file (H-ARCH04):** Vite's `eslint-plugin-react-refresh` enforces this as a warning by default; elevate to `"error"` in `eslint.config.ts` to make it a hard gate.

---

## Bank IA — Information Architecture & Page-Length Governance (H-IA)

### Sources

S1. **Understanding SC 1.4.10: Reflow** — https://www.w3.org/WAI/WCAG21/Understanding/reflow.html — (T1) — W3C/WAI normative understanding document; specifies the 320 CSS px threshold and two-dimensional-scroll prohibition (WCAG 2.1 Level AA).

S2. **Understanding SC 2.4.1: Bypass Blocks** — https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html — (T1) — W3C/WAI normative understanding document; requires a skip-navigation mechanism on every page with repeated blocks (WCAG 2.1 Level A).

S3. **Understanding SC 2.4.5: Multiple Ways** — https://www.w3.org/WAI/WCAG21/Understanding/multiple-ways.html — (T1) — W3C/WAI normative understanding document; requires ≥2 navigation paths to locate any page in a set (WCAG 2.1 Level AA).

S4. **Understanding SC 2.4.6: Headings and Labels** — https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html — (T1) — W3C/WAI normative understanding document; requires that headings and labels describe topic or purpose (WCAG 2.1 Level AA).

S5. **"Scrolling and Attention" — Nielsen (NNg, March 2010)** — https://www.nngroup.com/articles/scrolling-and-attention-original-research/ — (T2) — Jakob Nielsen eye-tracking study (57,453 fixations): 80.3% of attention lands above the fold; engagement decreases progressively and "eventually peters out" with depth.

S6. **"The Fold Manifesto: Why the Page Fold Still Matters" — Schade (NNg, February 2015)** — https://www.nngroup.com/articles/page-fold-manifesto/ — (T2) — Nielsen Norman Group; reports 84% average difference in user engagement above vs. below the fold; establishes that compelling above-fold content is the prerequisite for any scrolling below.

S7. **"Alternatives to Pagination on Product-Listing Pages" — Moran (NNg, March 2022)** — https://www.nngroup.com/articles/alternatives-pagination-listing-pages/ — (T2) — Nielsen Norman Group; compares pagination, infinite scroll, and "Show More"; recommends Show More for small-to-medium sets; prohibits "scroll for 15 minutes before reaching the footer"; requires displaying running totals ("Viewing 40 of 333").

S8. **"Accordions on Desktop: When and How to Use" — Wang (NNg, 2023)** — https://www.nngroup.com/articles/accordions-on-desktop/ — (T2) — Nielsen Norman Group; defines when accordions are appropriate vs. harmful; avoidance criteria include: comprehensive content access required, deep hierarchies, continuous reading flow.

S9. **"Progressive Disclosure" — Nielsen (NNg, 2006)** — https://www.nngroup.com/articles/progressive-disclosure/ — (T2) — Jakob Nielsen canonical definition; core criteria: split features correctly between initial and secondary levels; cautions against deferring interdependent information.

S10. **"In-Page Links for Content Navigation" — Wang (NNg, October 2023)** — https://www.nngroup.com/articles/in-page-links-content-navigation/ — (T2) — Nielsen Norman Group; recommends table-of-contents jump links at the page top for long-form content; cautions against using them on short pages; notes users form a mental model from the TOC before diving in.

S11. **"Information Scent: How Users Decide Where to Go Next" — Budiu (NNg, February 2020)** — https://www.nngroup.com/articles/information-scent/ — (T2) — Nielsen Norman Group; defines information scent; primary factor is the link/section label itself; poor scent causes users to overlook content regardless of relevance.

S12. **"6 Guidelines for Truncation Design" — Holst (Baymard Institute, May 2014)** — https://baymard.com/blog/truncation-design — (T2) — Baymard Institute (recognized usability research firm); empirical threshold: display up to 10 items before truncating; never truncate when only 1 item is hidden; users mistake truncated lists for the complete list, causing abandonment.

S13. **"Six Principles of Dashboards' Information Architecture" — Kocián (GoodData, January 2023)** — https://www.gooddata.ai/blog/six-principles-of-dashboard-information-architecture/ — (T3) — Principal UX practitioner at GoodData; corroborating source only; six IA principles: structure, navigation, hierarchy, grouping, labeling, filtering; recommends separate drill-through dashboards rather than unbounded single-page scroll.

### Extracted Heuristics

**H-IA01 — Reflow at 320 CSS pixels (no horizontal scroll):** Any content panel that is not a data table, map, video, or code block must reflow to a single scroll axis when the viewport is equivalent to 320 CSS px wide (i.e., a 1280 px desktop viewport at 400% zoom), with no loss of information or functionality. [S1]

**H-IA02 — Skip-navigation mechanism on every route:** Every page that repeats a navigation block across routes (global nav, section tabs, sticky headers) must provide a keyboard-operable bypass — a skip link, ARIA landmark, or heading-level jump point — so keyboard users can reach the primary content without tabbing through 10+ repeated controls. [S2]

**H-IA03 — At least two navigation paths to any analytics section:** When an analytics app presents more than one distinct page or route, users must be able to reach each page via at least two distinct mechanisms (e.g., top nav + in-page jump links, or nav + command palette search), so users who do not perceive or use the primary nav can still locate content. [S3]

**H-IA04 — Section headings must describe topic or purpose:** Every major section of a long analytics page (e.g., "VP Race," "Timeline," "Agenda") must be labelled with a descriptive heading that tells users what they will find — not a generic label like "Section 2" — so both sighted scanners and screen-reader users can navigate by heading to skip irrelevant sections. [S4]

**H-IA05 — The primary analytics answer must be reachable without deep scroll:** On any analytics view, the single most-critical answer (e.g., final standings, headline win-rate) must appear above or within the first viewport-height; Nielsen eye-tracking shows 80.3% of user attention lands above the fold, and engagement decreases progressively thereafter — a critical answer buried at ≥3 viewport-heights deep will be missed by a significant share of users. [S5][S6]

**H-IA06 — Above-fold content must actively signal what lies below:** On long analytics pages, the first viewport must contain a visible affordance (section titles, a table of contents, or a section nav) that communicates what content exists below, because user willingness to scroll is conditional on whether top-of-page content sets expectations; without that signal, users treat the visible area as the whole page. [S6][S10]

**H-IA07 — Long pages warrant a table-of-contents jump-link block at the top:** Any analytics page whose content exceeds approximately 3 viewport-heights should include a table of contents with in-page anchor links positioned at the page top, allowing users to form a mental model and skip directly to the section they need; jump links on short pages add unnecessary length and should be avoided. [S10] — (informational — specific number is a Stage-2 default to validate; principle binding)

**H-IA08 — Section labels must carry information scent strong enough to predict content:** Navigation labels and section headings must be self-explanatory in isolation — "Faction Stats," "Strategy Cards," "Agenda Outcomes" rather than "Stats," "Cards," "Other" — because information scent research shows the label itself is the primary signal users use to decide whether to navigate or scroll to a section. [S11]

**H-IA09 — Truncation threshold: show at least 6, at most 10 items before hiding the rest:** When a list of analytics items (e.g., faction breakdown rows, tech entries, vote tallies) must be truncated, show between 6 and 10 items before a "show more" control; showing fewer than 6 causes users to mistake the truncated set for the complete list and draws incorrect conclusions; hiding a single item wastes the interaction cost of the control. [S12]

**H-IA10 — Truncation is for optional depth, not for content users routinely need:** Truncation ("+N more", collapsed accordion, hidden rows) is appropriate only when the hidden content is supplementary detail that most users will not need; if the task requires access to most or all of the content — e.g., comparing all factions across a stat — truncation is an antipattern and the correct fix is reflow (responsive columns, pagination, or a dedicated drillthrough view). [S8][S9][S12]

**H-IA11 — Use accordions only when sections are independently navigable and mutually exclusive in typical use:** Accordions are appropriate for analytics long-pages only when a user needs one or two sections at a time and sections do not need to be compared side-by-side; avoid accordions when (a) most users need all content, (b) comparing across sections is a core task, or (c) sections form a continuous narrative — in those cases, full-page tabs or separate routes are the correct pattern. [S8][S9]

**H-IA12 — A chart must not exceed its visible scroll-container height by more than approximately 1× (i.e., total rendered height ≤ ~2× the container):** A chart rendered taller than ~2× the scroll-container height cannot be grasped as a unit; users must repeatedly scroll up and back to correlate data across the axis, increasing cognitive load; the correct remedies are (a) reducing the number of series, (b) splitting into multiple charts, (c) adding a fixed-height container with an internal scroll that is clearly signposted, or (d) linking to a dedicated full-screen view. [S1][S7] ⚠ adjudicate — the 2× ratio is a reasoned engineering target derived from reflow/viewport principles; no T1/T2 source states this exact ratio for chart containers. Validate against usability testing before treating as a hard gate. — (informational — specific number is a Stage-2 default to validate; principle binding)

**H-IA13 — Continuous-scroll pages must display a running position indicator or section anchor:** On analytics pages that require scrolling past ~3 viewport-heights, users need persistent orientation cues (sticky section label, progress indicator, or highlighted TOC entry) so they can identify where they are without scrolling back to the top; without these, users lose their position in the page hierarchy. [S5][S10][S13] — (informational — specific number is a Stage-2 default to validate; principle binding)

**H-IA14 — Show More / Load More must communicate running totals:** Any "Show More" or paginated-load control on an analytics list must display the count of items currently visible and the total available (e.g., "Showing 5 of 18 entries") so users can set expectations about remaining depth; controls that show only "Show more" without counts force users to click blindly to assess depth. [S7]

#### Notes

1. **H-IA12 carries a ⚠ adjudicate flag.** The "≤ 2× container" chart-sizing heuristic is the most actionable rule for the measured problem (charts rendered 2× their scroll-container), but no T1 or T2 source states this exact ratio. It is derived by extension from WCAG 1.4.10's two-dimensional-scroll prohibition and NNg's attention-decay research. It should be treated as a validated engineering target, not a normative gate, until usability testing confirms it.

2. **Page-length budgets: no T1/T2 source gives a viewport-count ceiling.** The "≥3 viewport-heights warrants a TOC" threshold in H-IA07 and H-IA13 is reasoned from NNg attention-decay data but not stated numerically in any source. The measured values (Timeline ~33×, /meta ~19.5×, /agenda ~52.8×) are far enough beyond any plausible budget that the direction of the finding (these pages are too long) is secure even without a precise threshold. The exact "acceptable" number should be validated via user observation.

3. **Baymard truncation research (S12) is e-commerce-specific.** The 6–10 item threshold was derived from filter facet testing on product listing pages. The principle (users mistake truncated lists for complete lists; never truncate just 1 item) generalizes cleanly to analytics lists; the specific threshold is a reasonable starting point but should be validated for analytics contexts.

4. **FiveThirtyEight archival sourcing not found.** The [INSP:FiveThirtyEight-OldSchool] inspiration was investigated; no archived design documentation articulating explicit IA principles from the Nate Silver era was locatable in the open web. The inspiration is therefore referenced only in passing (answer-first framing) and not cited in any heuristic.

5. **S13 (GoodData/Kocián) is T3.** It corroborates the separate-dashboard-over-unbounded-scroll pattern but is not the sole support for any heuristic. H-IA13 is jointly supported by S5 and S10 (both T2).

OWNER (2026-05-18): accepted recommended disposition — H-IA07/12/13 principle binding, number informational; other 11 CLEAR.

---

## Cross-bank conflicts

No numeric or rule-level contradictions between banks were found. Three pairs of heuristics state substantially the same rule from different banks (retained with cross-references per assembly rule 5):

- **H-TY01 vs H-A11Y01 / H-A11Y02** — Both state the 4.5:1 / 3:1 contrast thresholds. H-TY01 is framed as a typography surface rule; H-A11Y01/02 are framed as WCAG conformance requirements. No contradiction — the thresholds are identical. Both retained. Cross-references added to each.
- **H-RS01 vs H-A11Y05** — Both state the 320 CSS px reflow requirement. H-RS01 is framed in responsive-layout terms; H-A11Y05 is framed as a WCAG 1.4.10 AA requirement. No contradiction — same underlying standard. Both retained. Cross-references added to each.
- **H-RS02 vs H-A11Y09** — Both state the 24×24 CSS px touch target minimum. H-RS02 (Bank C) also carries the 44×44 AAA enhancement; H-A11Y09 (Bank D) states only the AA minimum. No contradiction — H-RS02 is a superset. Both retained. Cross-references added to each.

---

## Stage 1 evidence corrections (factual, from Task 6 walkthrough)

Recorded 2026-05-18. These are factual corrections from the Cowork-guided walkthrough. They do NOT alter heuristic text, heuristic IDs, or the Master Heuristic Index row count (still 55).

### H-RS06 — Sticky-breakage canary is N/A for this app's game-detail chrome

The `FrozenHeader` on `/games/:id` **does not use `position: sticky`**. The frozen header chrome remains visible because it is **structurally outside an inner scroll container** — the inner `<ScrollBody>` scrolls while the `FrozenHeader` sits above it in normal flow. The sticky-breakage scenario H-RS06 describes (sticky silently degrades to relative inside an overflow-containing ancestor) is architecturally moot for the game-detail page header.

H-RS06 stays in the canon — it remains applicable if any future component introduces `position: sticky` inside a scrolling ancestor. **Status for this app: `(N/A to game-detail FrozenHeader per Stage 1)`.**

Additional fact: the round scrubber sits **ABOVE** the section nav (y=224 scrubber, y=270 section nav), not below it as the walkthrough script assumed.

### H-DV05 — PickRateHeatmap has no heat encoding; sequential-palette test is moot

The `PickRateHeatmap` component on the `/meta` Strategy tab **does not currently render as a colored heatmap**. Only 2 colored cells were detected; pick rate is conveyed via text/numbers in a 9×33 grid, not via a sequential or diverging color palette. H-DV05's test ("does the heatmap use a sequential/diverging palette?") does not apply to this component because the encoding is structurally absent.

H-DV05 stays in the canon — it applies to any heatmap that does use color encoding. **Status for this component: `(Stage 1: PickRateHeatmap has no heat encoding — see ledger F-39)`.**

The real finding is the **absence of visual encoding** (a data-ink / comprehension failure), not a palette choice failure. This is recorded in ledger finding F-39 (H-DV05, design, info).

### App-fact notes (not heuristic changes)

These are structural facts about the app that the walkthrough script had wrong or incomplete. They do not change any heuristic.

1. **`/meta` has a PACE tab** not listed in the original Block 10–13 screen enumeration. Any audit script for the meta dashboard must include PACE as a 4th tab (alongside Factions, Strategy, Techs, Stats).

2. **Game-detail header order:** round scrubber is ABOVE section nav in DOM render order and in screen coordinates (scrubber y≈224, section nav y≈270). The walkthrough script had it reversed (scrubber below section nav).

3. **`/agenda` `landmark-one-main` and `td-has-header` are RESOLVED** as of the Task 6 session (felt F-F43 and F-F45 confirm). The remaining `<main>` duplication bug is on `/` (home page) and `/compare/:a/:b` — NOT on `/agenda` or `/games/:id`.

---

## Proposed inspirations (awaiting owner ruling at Task 3.5)

### From Bank A

- **[INSP:ONS-DataViz]** The ONS Data Visualisation Service Manual (S6) is a government-published, public practitioner spec with a complete element-by-element size table and explicit minima grounded in public accessibility law. It exemplifies the "coherent type system across heterogeneous chart types" goal better than most blog references. Candidate for promotion to a named inspiration for the H-TY register.

- **[INSP:Datawrapper]** The Datawrapper Blog (Lisa Charlotte Muth, S4) is the clearest published practitioner authority on font selection for data visualization. Its 14px default / 12px floor recommendation is the most-cited specific pixel value in the field. Candidate for a named inspiration alongside [INSP:OurWorldInData].

### From Bank B

- **[INSP:ONS-DataViz]** — The ONS Data Visualisation Service Manual (https://service-manual.ons.gov.uk/data-visualisation) is a government-issued, publicly auditable design system for charts with explicit pixel specs (gridline weights, legend icon sizes, label casing rules). Strong candidate for a T1 inspiration anchor for the TI4 design system — particularly its "direct label preferred, legend fallback" rule and the absolute prohibition on chart borders.

- **[INSP:Datawrapper-Blog]** — Datawrapper's editorial blog (Lisa Charlotte Muth) consistently bridges perception science and practitioner reality with named, traceable authorship. Not a canonical authority, but useful for T2-tier support on color palette decisions.

### From Bank C

- **[INSP:OurWorldInData-Grapher]** — ourworldindata.org chart embeds (the "Grapher" component) demonstrate a nav-chrome-free chart shell that collapses controls into a compact toolbar below the chart title at narrow widths, keeping the data area dominant; usable as an exemplar of low-chrome analytical views on mobile. (Note: OWID's redesign blog post confirms mobile optimization is in active development — validate against current live behavior before citing in design.)

- **[INSP:NNg-NewYorker]** — The New Yorker's sticky header as documented in the NN/g study (13:1 content-to-chrome ratio on iPhone 11 Pro) is a concrete real-world reference point for an acceptable mobile sticky header budget.
