# Research Bank B — Data-Dashboard & Data-Viz Comprehension (H-DV)

> Scope: scannability, chart-type comprehension (slope/line, heatmap, treemap, histogram), small-multiples vs. overlay, categorical color encoding, axis/label/legend legibility minimums, data-ink and decluttering, direct labeling vs. legends, prose+stat integration in editorial dataviz.
>
> Source-tier key: (T1) = canonical authority / formal spec; (T2) = recognized practitioner with named authorship + track record; (T3) = community/blog — corroboration only.

---

## Sources

**S1.** Edward Tufte, *The Visual Display of Quantitative Information* (2nd ed., Graphics Press, 2001) — https://www.edwardtufte.com/book/the-visual-display-of-quantitative-information/ — **(T1)** — Canonical authority on data-ink ratio, chartjunk elimination, small multiples, and graphical integrity; cited across the entire visualization field.

**S2.** Colin Ware, *Information Visualization: Perception for Design* (4th ed., Morgan Kaufmann, 2020) — https://scholars.unh.edu/ccom/140/ — **(T1)** — Ground-truth reference on vision science applied to visualization; defines preattentive attributes, color hue limits, and channel effectiveness hierarchy.

**S3.** Stephen Few, *Information Dashboard Design: Displaying Data for At-a-Glance Monitoring* (2nd ed., Analytics Press, 2013) — https://www.amazon.com/Information-Dashboard-Design-At-Glance/dp/1938377001 — **(T1)** — Practitioner-canonical text on dashboard layout, legend elimination, direct labeling, visual hierarchy, and "at-a-glance" monitoring design; workshop materials at perceptualedge.com.

**S4.** Nielsen Norman Group — "F-Shaped Pattern of Reading on the Web: Misunderstood, But Still Relevant" (2017) + "Text Scanning Patterns: Eyetracking Evidence" (2017) — https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/ and https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/ — **(T1)** — Eye-tracking corpus (thousands of users) establishing reading-order priors for screen layout; directly applicable to dashboard panel placement.

**S5.** UK Office for National Statistics (ONS), *Data Visualisation Service Manual: Chart Elements & Chart Typography* — https://service-manual.ons.gov.uk/data-visualisation/build-specifications/chart-elements — **(T1)** — Government-standard specification covering gridlines, legend vs. direct-label policy, axis rules, and WCAG-aligned contrast requirements for charts.

**S6.** Datawrapper, "A Detailed Guide to Colors in Data-Vis Style Guides" (Lisa Charlotte Muth, 2022) — https://www.datawrapper.de/blog/colors-for-data-vis-style-guides — **(T2)** — Practitioner synthesis with named authorship; covers categorical palette size, brand-color conflicts, accessibility testing, and the 12-color trap.

**S7.** Dataquest, "How to Generate FiveThirtyEight Graphs in Python" (with Matplotlib style documentation) — https://www.dataquest.io/blog/making-538-plots/ ; cross-referenced against the Matplotlib `fivethirtyeight` style sheet — https://matplotlib.org/stable/gallery/style_sheets/fivethirtyeight.html — **(T2)** — Systematic deconstruction of the Nate Silver-era 538 chart system (grey canvas, inline labels, bolded baseline, enlarged tick fonts, colorblind palette) with code-level specification.

**S8.** Layla McCay et al. (IEEE TVCG), "Striking a Balance: Reader Takeaways and Preferences when Integrating Text and Charts" — https://arxiv.org/abs/2208.01780 — **(T2)** — Empirical study (IEEE Transactions on Visualization and Computer Graphics) on how annotation density, placement, and content type affect reader comprehension and stated preference; finding that heavily-annotated charts are not penalized.

---

## Extracted Heuristics

**H-DV01** Place the single most critical number or status indicator in the upper-left quadrant of any dashboard panel, because eye-tracking shows the first horizontal sweep and the left-side vertical scan receive the heaviest fixation density — anything placed lower-right is at high risk of being skipped entirely. [S4] [INSP:FiveThirtyEight-OldSchool]

**H-DV02** Maximize the data-ink ratio: erase every mark — gridline, border, tick, background fill — that can be removed without losing information, reserving ink exclusively for the quantitative data itself. [S1]

**H-DV03** Limit categorical color palettes to a maximum of five to seven distinct hues per chart; beyond that threshold, short-term memory cannot simultaneously hold the hue-to-category mappings needed for rapid lookup, converting an at-a-glance chart into a decode-the-legend exercise. [S2] [S6]

**H-DV04** Prefer direct labeling over legends for line charts, slope charts, and any chart with six or fewer series: place the category name at or near the terminal point of each line in the matching hue, eliminating the cross-reference scan that legends impose. [S3] [S5] [INSP:FiveThirtyEight-OldSchool]

**H-DV05** In a heatmap encoding rank or intensity, use a sequential (single-hue lightness-ramping) or diverging palette — not a categorical/qualitative palette — because only sequential encoding lets the viewer preattentively rank cells without consulting a legend; use hue variation only when the encoded variable is purely nominal. [S2] [S6]

**H-DV06** Apply small multiples (the same chart form repeated at consistent scale across categories) rather than overlaying all series in one chart whenever the primary question is "how does each entity differ from the others" rather than "how do all entities move together" — small multiples shift reader effort from decoding the chart mechanics to reading the data. [S1] [S3]

**H-DV07** For a heatmap with categorical axes (e.g., faction × strategy card), sort rows and columns by a meaningful quantity (e.g., descending pick rate or win rate) rather than alphabetically, so the highest-value cells cluster in the upper-left where F-pattern attention concentrates. [S1] [S4]

**H-DV08** A slope chart (two-endpoint line) is appropriate for showing ranked change between exactly two states (e.g., rounds, game phases); prefer it over a full line chart when intermediate variability is noise rather than signal, and over a grouped bar chart when the reader's primary question is "which entity rose or fell the most." [S1] [S3]

**H-DV09** For treemap label legibility, suppress text in any cell whose shorter dimension falls below approximately 20–24 px (the minimum for a 12pt sans-serif to render without clipping); either omit the label or replace it with a tooltip, since a partially-visible label is worse for comprehension than no label at all. [S3] [S5]

**H-DV10** Annotations placed directly on a chart (title-level callout, inline data label, annotated peak) are not penalized by readers for density — heavily-annotated charts are preferred over sparse ones when the annotations are semantically meaningful — but placement matters: information best interpreted as "context for the whole" belongs in the title or subtitle, while information tied to a specific data point belongs adjacent to that mark. [S8] [INSP:ReutersGraphics]

**H-DV11** Gridlines should be subordinate to data marks: render them at reduced opacity or a lighter grey (ONS specifies #D9D9D9 at 1px for secondary gridlines, with a single bolded zero baseline at 1.5px), and always layer them beneath data marks — gridlines that overprint data increase visual noise without adding information. [S5] [INSP:FiveThirtyEight-OldSchool]

**H-DV12** For editorial prose+stat integration (a stat callout embedded in narrative text), the statistic must be independently legible as a standalone number before the prose context is read; this means the number, its unit, and the comparison baseline (vs. what?) must all be visible without reading the surrounding sentence. [S3] [S8] [INSP:ReutersGraphics]

**H-DV13** When a faction (or other entity) uses a fixed brand color that cannot be changed, assign that color only when the faction is the subject of the chart; for multi-faction comparative charts, verify that all faction hues maintain perceptually equal visual weight (no one hue appears to "pop" more than others due to luminosity differences) — adjust saturation or lightness rather than swapping hues. [S6]

**H-DV14** For histogram bin count, apply the square root rule (bins ≈ √n) as a starting heuristic for small datasets (n < 100 games), then verify that the chosen bin count reveals the distribution shape without masking bimodality; target 5–15 bins for typical playgroup-sized datasets (n ≈ 7–50 games). [S3] ⚠ adjudicate — the specific rule is derived from practitioner synthesis; the underlying Sturges/square-root formulas are textbook statistics, but the 5–15 range here is from T3-tier sources applied to a specific domain.

---

## Proposed Inspirations

- **[INSP:ONS-DataViz]** — The ONS Data Visualisation Service Manual (https://service-manual.ons.gov.uk/data-visualisation) is a government-issued, publicly auditable design system for charts with explicit pixel specs (gridline weights, legend icon sizes, label casing rules). Strong candidate for a T1 inspiration anchor for the TI4 design system — particularly its "direct label preferred, legend fallback" rule and the absolute prohibition on chart borders.

- **[INSP:Datawrapper-Blog]** — Datawrapper's editorial blog (Lisa Charlotte Muth) consistently bridges perception science and practitioner reality with named, traceable authorship. Not a canonical authority, but useful for T2-tier support on color palette decisions.

---

## Notes / Concerns

1. **FiveThirtyEight sourcing constraint honored.** The [INSP:FiveThirtyEight-OldSchool] tag is used only via practitioner reverse-engineering of the old 538 style (Dataquest article + Matplotlib style sheet), not via the current fivethirtyeight.com (which now redirects to ABC News and no longer represents the Silver-era design). The 2020 forecast article URL confirmed this — it 301-redirects to abcnews.com/politics.

2. **Ware hue-limit number.** The "5–7 hue" rule in H-DV03 is consistent with what appears in practitioner reconstructions of Ware's work (flylib.com extract cites "nine in short-term memory" for hues but recommends five for rapid comprehension). A direct page citation from the 4th edition print would be stronger — an independent verifier should confirm the exact page in *Information Visualization: Perception for Design* (4th ed.) Ch. 4.

3. **"2-second" comprehension benchmark.** No published empirical study with a specific "answer within 2 seconds" threshold for dashboard comprehension was located. S3 (Few) uses the phrase "at a glance" but does not quantify it. H-DV01 is anchored to gaze-density (S4) rather than a time benchmark, which is the honest framing. Avoid quoting "2 seconds" as a citable number in downstream design documents.

4. **Reuters Graphics.** No first-party Reuters Graphics design-principle documentation was locatable as a public URL. [INSP:ReutersGraphics] is used in H-DV10 and H-DV12 to point at the *product* as exemplar, not as a citable source; both heuristics carry at least one T1/T2 source.

5. **Treemap px threshold (H-DV09).** The 20–24 px floor is derived from combining the ONS 12pt minimum font rule (S5) with typical screen DPI assumptions (96 dpi → ~16 px/pt, 12pt ≈ 16px plus padding). It is a calculated inference, not a direct citation. An independent verifier should treat this as a reasonable engineering estimate; the underlying 12pt minimum is T1-sourced.
