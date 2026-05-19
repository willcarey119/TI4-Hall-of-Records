# Research Bank IA — Information Architecture & Page-Length Governance (H-IA)

Generated 2026-05-18. Fills the gap left by the five-bank canon (A–E): no prior bank
addresses page-length budgets, progressive disclosure, truncation vs. reflow, in-page
navigation, or chart sizing relative to its scroll container.

---

## Sources

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

---

## Extracted Heuristics

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

---

## Proposed Inspirations

**[INSP:OurWorldInData]** — Full-screen chart expansion button as an alternative to making every chart fill the viewport: Our World in Data's 2023 redesign added a dedicated full-screen button as the primary mechanism for deep chart inspection, keeping embedded chart heights compact while giving power users an escape hatch. Relevant to H-IA12. See: https://ourworldindata.org/redesigning-our-interactive-data-visualizations

**[INSP:ReutersGraphics]** — Scroll-triggered progressive reveal as a substitute for up-front wall-of-charts: Reuters Graphics uses scroll position to reveal chart elements sequentially, reducing perceived page length and directing attention to one data point at a time rather than overwhelming users with a full chart grid. Relevant to H-IA05, H-IA06, H-IA13.

---

## Notes / Concerns

1. **H-IA12 carries a ⚠ adjudicate flag.** The "≤ 2× container" chart-sizing heuristic is the most actionable rule for the measured problem (charts rendered 2× their scroll-container), but no T1 or T2 source states this exact ratio. It is derived by extension from WCAG 1.4.10's two-dimensional-scroll prohibition and NNg's attention-decay research. It should be treated as a validated engineering target, not a normative gate, until usability testing confirms it.

2. **Page-length budgets: no T1/T2 source gives a viewport-count ceiling.** The "≥3 viewport-heights warrants a TOC" threshold in H-IA07 and H-IA13 is reasoned from NNg attention-decay data but not stated numerically in any source. The measured values (Timeline ~33×, /meta ~19.5×, /agenda ~52.8×) are far enough beyond any plausible budget that the direction of the finding (these pages are too long) is secure even without a precise threshold. The exact "acceptable" number should be validated via user observation.

3. **Baymard truncation research (S12) is e-commerce-specific.** The 6–10 item threshold was derived from filter facet testing on product listing pages. The principle (users mistake truncated lists for complete lists; never truncate just 1 item) generalizes cleanly to analytics lists; the specific threshold is a reasonable starting point but should be validated for analytics contexts.

4. **FiveThirtyEight archival sourcing not found.** The [INSP:FiveThirtyEight-OldSchool] inspiration was investigated; no archived design documentation articulating explicit IA principles from the Nate Silver era was locatable in the open web. The inspiration is therefore referenced only in passing (answer-first framing) and not cited in any heuristic.

5. **S13 (GoodData/Kocián) is T3.** It corroborates the separate-dashboard-over-unbounded-scroll pattern but is not the sole support for any heuristic. H-IA13 is jointly supported by S5 and S10 (both T2).

OWNER (2026-05-18): accepted recommended disposition — H-IA07/12/13 principle binding, number informational; other 11 CLEAR.
