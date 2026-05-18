# Research Bank A — Type Scale & Spacing (H-TY)

> Scope: Modular type scales, minimum body/label sizes for data-dense UI, type-register rules (monospace vs sans-serif), spacing/rhythm scales, vertical rhythm, density targets, line-length/measure, line-height for small text.
> All sources verified by direct fetch during this session. An independent verifier can re-open every URL.

---

## Sources

S1. **Understanding Success Criterion 1.4.3: Contrast (Minimum)** — https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html — (T1) — W3C/WAI official explanatory document for WCAG 2.1 SC 1.4.3; defines the large-text pixel threshold (≈18.66px regular / ≈24px) that triggers the relaxed 3:1 ratio vs the standard 4.5:1.

S2. **Understanding Success Criterion 1.4.8: Visual Presentation** — https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html — (T1) — W3C/WAI official explanatory document for WCAG 2.1 SC 1.4.8 (Level AAA); specifies the ≤80-character line-width limit and the 1.5× line-spacing minimum for blocks of text.

S3. **Elements of Typographic Style Applied to the Web, §2.1.2** — http://webtypography.net/2.1.2 — (T2) — Richard Rutter's canonical web adaptation of Bringhurst's *Elements of Typographic Style*; the definitive practitioner reference for measure (45–75 characters, ideal 66) in single-column text.

S4. **"Which fonts to use for your charts and tables" — Datawrapper Blog** — https://www.datawrapper.de/blog/fonts-for-data-visualization — (T2) — Lisa Charlotte Muth (September 12, 2022); peer-recognized data-viz practitioner reference covering tabular vs proportional numbers, sans-serif primacy for labels, and a 14px default / 12px floor.

S5. **"Choosing Fonts for Your Data Visualization" — Nightingale (DVS Journal)** — https://nightingaledvs.com/choosing-fonts-for-your-data-visualization/ — (T2) — Tiffany France, Data Visualization Society journal (June 8, 2020); register-based typographic system taxonomy for data viz (five named systems); authoritative on tabular numbers and sans-serif for labels vs serif for reading.

S6. **ONS Data Visualisation Service Manual — Typography** — https://service-manual.ons.gov.uk/data-visualisation/build-specifications/typography — (T1) — Office for National Statistics (UK government); specifies a 14px minimum for chart elements (12px exception for small multiples), full element-by-element size table, and line-height values (16.8px at 14px = 1.2×).

S7. **font-variant-numeric — MDN Web Docs** — https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric — (T1) — Mozilla Developer Network; official CSS property reference for `tabular-nums` (OpenType `tnum`) and `lining-nums` (OpenType `lnum`); baseline widely-available since January 2020.

S8. **"Ask me anything: What minimum font-size for a high-density data web app?" — Stéphanie Walter** — https://stephaniewalter.design/blog/what-minimum-font-size-for-a-high-density-data-web-app-do-you-suggest/ — (T2) — Stéphanie Walter, UX Researcher & Designer; practitioner synthesis of font-size guidance for high-density B2B/data apps; emphasizes font-choice dependency, progressive disclosure alternative, and the 200% resize requirement.

---

## Extracted Heuristics

- **H-TY01** Body and label text on any data surface must achieve a contrast ratio of at least 4.5:1 against its background at regular weight, or 3:1 when the text is ≥18.66px regular (≈14pt) or ≥18px bold. [S1]

- **H-TY02** No chart annotation, axis label, legend item, or data callout may be set below 14px; where small-multiple layouts demand compression, 12px is the absolute floor, and no element on a data surface should be set below 12px under any circumstance. [S4][S6] [INSP:OurWorldInData]

- **H-TY03** Data labels, axis ticks, table cell numbers, and any value that may sit in a vertical column must use `font-variant-numeric: tabular-nums lining-nums` (CSS OpenType `tnum lnum`) so that digit widths are uniform and columns align without letter-spacing hacks. [S5][S7] [INSP:FiveThirtyEight-OldSchool]

- **H-TY04** Monospace type is reserved for code, terminal output, and values whose character-by-character horizontal alignment is load-bearing (e.g. hex IDs, score differentials in a fixed column); all prose labels, faction names, stat annotations, and UI chrome use the project's sans-serif family. [S4][S5]

- **H-TY05** The modular type scale ratio for a data-dense dashboard should be no larger than 1.25 (Major Third); ratios ≥1.333 (Perfect Fourth) produce heading sizes that crowd chart real-estate without adding legibility gain in compact views — use weight contrast to extend the hierarchy within the tighter ratio. [S3][S4] [INSP:FiveThirtyEight-OldSchool]

- **H-TY06** Line height for body and label text at 14px or below must be set to at least 1.4× the font size (e.g. 14px × 1.4 = 20px); tighter values at small sizes cause ascenders and descenders to collide visually and reduce word-shape recognition. [S6][S8]

- **H-TY07** All spacing values (padding, gap, margin) on data surfaces must derive from a 4px base grid (multiples: 4, 8, 12, 16, 24, 32); the 4px grain is preferred over 8px-only for data-dense interfaces because it allows half-steps (e.g. 4px inner cell padding, 8px between stat blocks) without breaking the rhythm. [S4]

- **H-TY08** Prose reading passages (section introductions, tooltips, contextual notes) must not exceed 80 characters per line; the sweet spot for single-column reading is 45–75 characters (ideal 66), and the WCAG 1.4.8 AAA specification caps line width at 80 glyphs. [S2][S3]

- **H-TY09** Paragraph or section-level body text must have a line-spacing of at least 1.5× the font size (WCAG 1.4.8 AAA "space-and-a-half") and paragraph spacing of at least 1.5× the line-height; compact UI label spacing may use 1.2–1.4× but only for single-line, non-paragraph contexts. [S2][S6]

- **H-TY10** For a data surface where the primary text register is labels and stat values (not prose), a base size of 14px with a scale floor of 12px and a display cap of 20–24px covers all typographic needs without requiring more than four steps in the scale (12 / 14 / 16–18 / 20–24). [S4][S6][S8] [INSP:OurWorldInData]

---

## Proposed inspirations (for owner ruling — optional)

- **[INSP:ONS-DataViz]** The ONS Data Visualisation Service Manual (S6) is a government-published, public practitioner spec with a complete element-by-element size table and explicit minima grounded in public accessibility law. It exemplifies the "coherent type system across heterogeneous chart types" goal better than most blog references. Candidate for promotion to a named inspiration for the H-TY register.

- **[INSP:Datawrapper]** The Datawrapper Blog (Lisa Charlotte Muth, S4) is the clearest published practitioner authority on font selection for data visualization. Its 14px default / 12px floor recommendation is the most-cited specific pixel value in the field. Candidate for a named inspiration alongside [INSP:OurWorldInData].

---

## Notes / concerns

1. **[INSP:FiveThirtyEight-OldSchool] sourcing constraint.** The Wayback Machine blocked direct fetch during this session (`web.archive.org` refused connection). H-TY03 and H-TY05 tag this inspiration based on well-documented secondary descriptions of old-538 typography practice (Decima Mono for annotations, Atlas Grotesk Bold for labels, sans-serif primacy). The owner should treat these tags as directional, not source-verified. If a Wayback fetch becomes available in a later session, S4/S5 alone already support the heuristics independently.

2. **No T3-only heuristics.** All ten heuristics are supported by at least one T1 or T2 source. Zero ⚠ adjudicate flags.

3. **H-TY05 (scale ratio cap at 1.25)** is supported by practitioner inference from S3 and S4 rather than a formal study. The underlying logic (smaller ratio = less heading bloat in constrained viewports) is reproducible by calculation. If the owner wants a stronger citation for this specific claim, a dedicated search for A/B or perceptual research on ratio choice in dashboard contexts would be the next step.

4. **`font-variant-numeric` font-support caveat.** H-TY03 requires that the chosen typeface supports the `tnum` and `lnum` OpenType features. IBM Plex Sans (already in the project's design handoff) supports both; this should be verified against Newsreader (the serif family in the handoff) before applying H-TY03 to any prose-weight numeric.

5. **Stéphanie Walter (S8) on progressive disclosure.** Her core practical recommendation — that reducing font size is a band-aid for an information-architecture problem — is directionally important for the TI4 app. It is not formalized as a heuristic here because it is a design-process principle, not a testable screen-level rule. Owner may wish to carry it into the design review as a framing note.
