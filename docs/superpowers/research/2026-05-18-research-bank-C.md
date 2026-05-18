# Research Bank C — Responsive & Sticky-Element Patterns (H-RS)

_Scope: breakpoint strategy, fluid type/space, sticky/fixed-element budgets, collapse/disclosure patterns for nav-heavy chrome, touch-target minimums, reflow at 320 px, scroll behavior, when sticky helps vs harms._

---

## Sources

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

---

## Extracted Heuristics

- **H-RS01** — All vertical-scroll content must reflow without two-dimensional scrolling at a viewport width equivalent to 320 CSS pixels (= 1280 px browser window at 400% zoom), with no loss of information or functionality, except for inherently two-dimensional content such as data tables and maps. [S1]

- **H-RS02** — Interactive touch targets must be either (a) at least 24 × 24 CSS pixels in size, or (b) spaced so that a 24 CSS px diameter circle centered on each undersized target does not intersect any other target or circle, per WCAG 2.5.8 Level AA; the Level AAA enhanced criterion (WCAG 2.5.5) raises this floor to 44 × 44 CSS pixels, which aligns with Apple HIG and Material Design guidelines. [S2] [S3]

- **H-RS03** — A sticky header on a 375 px-wide / ~667 px-tall mobile viewport (iPhone SE / standard reference) should occupy no more than ~7–8% of viewport height (approximately 48–56 px); NN/g documents a 13:1 content-to-chrome ratio as "reasonable" and a 2:1 ratio as harmful, which at 667 px yields a ~48 px ceiling before the ratio degrades past acceptable. [S7]

- **H-RS04** — When a sticky header must animate (e.g., partially-persistent show/hide on scroll direction change), use a 300–400 ms duration and require the user to scroll more than a few pixels in the triggering direction before activating, to prevent accidental triggering during micro-adjustments. [S7]

- **H-RS05** — Any scroll-triggered animation or non-essential motion attached to a sticky element (parallax, header shrink transitions, slide-in effects) must be wrapped in `@media (prefers-reduced-motion: no-preference)` or suppressed via `@media (prefers-reduced-motion: reduce)`, satisfying WCAG 2.3.3 Level AAA; `scroll-behavior: smooth` must also be conditional on this query. [S4] [S5] [S9]

- **H-RS06** — `position: sticky` silently degrades to `position: relative` if an ancestor element has `overflow: hidden`, `scroll`, `auto`, or `overlay` — any nav bar or scrubber that appears stuck must be audited for overflow-containing ancestors in the component tree; the sticky element also always creates a new stacking context regardless of `z-index`. [S6]

- **H-RS07** — Sticky elements require `will-change: transform` to be promoted to their own compositor layer, preventing the browser from performing expensive full-layer repaints on every scroll frame (at 60 fps this is critical on low-powered mobile devices). [S6]

- **H-RS08** — A collapsed/hamburger navigation on mobile must use a `<button>` with `aria-expanded="false|true"` toggled by JavaScript, `aria-controls` pointing to the nav container's `id`, and `aria-current="page"` on the active link; the `role="menu"` pattern is explicitly wrong for site navigation — use the W3C Disclosure Navigation pattern instead, which only requires Tab, Space/Enter, and Escape keyboard interactions. [S8]

- **H-RS09** — Fluid font sizing via `clamp(min, preferred, max)` must include `em`/`rem` anchors in the preferred value (e.g., `17px + 0.24vw`) rather than a bare `vw` value alone, so that browser zoom (WCAG 1.4.4) continues to scale text; the maximum must not exceed 2.5× the minimum to guarantee WCAG 1.4.4 Resize Text compliance across the full zoom range. [S1] [S5]

- **H-RS10** — On iOS devices with notches or Dynamic Island, any `position: fixed` or `position: sticky` element at the top or bottom of the viewport must add `padding: env(safe-area-inset-top)` / `padding-bottom: max(16px, env(safe-area-inset-bottom))` — activated only when `viewport-fit=cover` is set in the viewport meta tag — to prevent interactive chrome from being obscured by hardware UI features. [S10]

- **H-RS11** — Sticky navigation that persists across an entire long-scroll view is beneficial when users need frequent cross-section access (nav, search, utility); it is net-harmful when users stay within a single content category per session or when the header height reduces content-to-chrome ratio below approximately 8:1 on mobile, at which point a partially-persistent (hide-on-scroll-down, reveal-on-scroll-up) or static-with-anchor pattern should be preferred. [S7]

- **H-RS12** — Horizontal scrolling is prohibited by WCAG 1.4.10 for text content at 320 CSS px viewport width; exceptions exist only for content where two-dimensional layout is essential to meaning (e.g., the Faction × Strategy heatmap or the VP Race chart), and each such exception is scoped narrowly — it does not cascade to surrounding UI elements or the page shell. [S1]

---

## Proposed Inspirations

- **[INSP:OurWorldInData-Grapher]** — ourworldindata.org chart embeds (the "Grapher" component) demonstrate a nav-chrome-free chart shell that collapses controls into a compact toolbar below the chart title at narrow widths, keeping the data area dominant; usable as an exemplar of low-chrome analytical views on mobile. (Note: OWID's redesign blog post confirms mobile optimization is in active development — validate against current live behavior before citing in design.)

- **[INSP:NNg-NewYorker]** — The New Yorker's sticky header as documented in the NN/g study (13:1 content-to-chrome ratio on iPhone 11 Pro) is a concrete real-world reference point for an acceptable mobile sticky header budget.

---

## Notes / Concerns

1. **No formal standard for sticky-header viewport-height percentage.** The 10–15% figure circulating in practitioner blogs (T3 sources omitted per rubric) is not sourced to any formal specification or named practitioner paper. The 13:1 ratio from NN/g [S7] is the strongest citable anchor; H-RS03 derives the px ceiling from that ratio rather than relying on the uncited percentage claims.

2. **WCAG 2.3.3 is Level AAA, not AA.** H-RS05 correctly flags this. The project should still implement it (it costs nothing and the vestibular harm is real), but it cannot be cited as a mandatory compliance floor at the AA level the way 1.4.10 and 2.5.8 are.

3. **`safe-area-inset-*` concrete pixel values vary by device generation and are not in the spec.** H-RS10 cites the mechanism, not a specific pixel number. At time of writing, iPhone 15 Pro Dynamic Island insets are ~59 px top / ~34 px bottom in portrait — but these are device-reported values, not authored constants, and the `env()` function handles them correctly at runtime without hard-coding.

4. **OurWorldInData responsive nav details were not publicly documented** in the fetched redesign article (mobile optimization listed as forthcoming). The [INSP:OurWorldInData-Grapher] proposal is based on direct observation of live behavior, not a citable document — it is flagged as a proposed inspiration for the owner to confirm, not a source backing any heuristic.

5. **`will-change: transform` caveat.** While recommended by MDN [S6], overuse of `will-change` on many elements simultaneously can increase GPU memory pressure on mobile. Apply it only to the sticky header element(s), not to scroll containers or other elements.
