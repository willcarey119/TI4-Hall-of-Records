# Research Bank D — WCAG AA / Accessibility (H-A11Y)

## Sources

S1. WCAG 2.1 SC 1.4.3 Contrast (Minimum) — Understanding Doc — https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html — (T1) — Defines 4.5:1 for normal text, 3:1 for large text (≥18pt or ≥14pt bold), with exceptions for inactive components, incidental/decorative text, and logotypes.

S2. WCAG 2.1 SC 1.4.11 Non-text Contrast — Understanding Doc — https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html — (T1) — Requires 3:1 contrast for UI component visual indicators (borders, focus rings, control affordances) and meaningful graphical objects against adjacent colors.

S3. WCAG 2.1 SC 1.4.1 Use of Color — Understanding Doc — https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html — (T1) — Prohibits color as the sole means of conveying information; requires a supplementary visual channel (text label, pattern, shape, or luminance difference ≥3:1).

S4. WCAG 2.1 SC 1.4.10 Reflow — Understanding Doc — https://www.w3.org/WAI/WCAG21/Understanding/reflow.html — (T1) — Content must reflow at 320 CSS px width (equivalent to 1280px viewport at 400% zoom) without horizontal scrolling; true 2D-layout content (data tables, complex charts) is explicitly excepted.

S5. WCAG 2.1 SC 1.3.1 Info and Relationships — Understanding Doc — https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html — (T1) — Semantic relationships (heading hierarchy, table scope, landmark regions) must be programmatically determinable, not conveyed through visual styling alone.

S6. WCAG 2.1 SC 4.1.2 Name, Role, Value — Understanding Doc — https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html — (T1) — Custom UI components built from non-semantic HTML must expose role, accessible name, and state/value via ARIA attributes; omitting `role` from a `<div>` or `<span>` used as a control is an explicit named failure.

S7. WCAG 2.2 SC 2.5.8 Target Size (Minimum) — Understanding Doc — https://www.w3.org/WAI/WCAG21/Understanding/target-size-minimum.html — (T1) — Touch/pointer targets must be at least 24×24 CSS px, or separated such that a 24 px diameter circle centered on each target does not overlap adjacent targets; inline text links are excepted.

S8. WCAG 2.1 SC 2.4.7 Focus Visible — Understanding Doc — https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html — (T1) — Every keyboard-operable control must have a visible focus indicator in at least one mode of operation; browser-default outlines satisfy the criterion unless the author has suppressed or overridden them.

---

## Extracted Heuristics

- **H-A11Y01** Normal body text (< 18 pt / < 14 pt bold) must achieve a contrast ratio of at least 4.5:1 against its background, measured without rounding (e.g. 4.499:1 fails). [S1]

- **H-A11Y02** Large-scale text (≥ 18 pt regular or ≥ 14 pt bold) must achieve a contrast ratio of at least 3:1 against its background; the `--font-subhead` and `--font-body` tokens used at large sizes must be verified to hit this threshold with their `--ink-3` and `--ink-4` pairings on `--paper`. [S1]

- **H-A11Y03** Every interactive UI component's visual boundary or affordance (button border, input outline, dropdown indicator, nav link underline) must achieve at least 3:1 contrast against the adjacent background, and focus-state indicators must meet the same 3:1 threshold in both focused and unfocused-state comparison. [S2]

- **H-A11Y04** Color must not be the sole channel conveying data meaning: every heatmap cell, faction dot, chart series, or status badge that uses color to distinguish values must pair that color with a text label, pattern, numeric value, or distinct shape visible to a color-blind or monochrome user. [S3]

- **H-A11Y05** All primary content must reflow to a single-column layout at 320 CSS px viewport width without requiring horizontal scrolling; the `PickRateHeatmap` grid and any fixed-width chart are excepted as true 2D-layout content, but surrounding headings, FilterBar controls, and section navigation must reflow independently. [S4]

- **H-A11Y06** Every `<table>` with more than one header row or column must carry `scope="col"` or `scope="row"` on every `<th>`, and every data `<td>` in a complex table must be associable to its headers; absence of `scope` in a multi-row/column table is a named WCAG failure. [S5]

- **H-A11Y07** Each page must expose exactly one `<main>` landmark, a `<nav>` for site navigation, and optionally named `<section>`/`<aside>` regions so that assistive-technology users can skip to content areas without reading all preceding markup. [S5]

- **H-A11Y08** Every custom interactive widget constructed from non-semantic elements (`<div>`, `<span>`) must carry an explicit `role` (e.g. `role="dialog"`, `role="listbox"`) plus `aria-label` or `aria-labelledby` for its accessible name, and must reflect dynamic state (e.g. `aria-expanded`, `aria-selected`) programmatically. [S6]

- **H-A11Y09** Every pointer/touch target (nav buttons, filter selects, round-scrubber controls, heatmap cells with interactive `title` tooltips triggered on click) must be at least 24×24 CSS px, or surrounded by spacing such that a 24 px diameter circle centered on the target does not intersect an adjacent target. [S7]

- **H-A11Y10** Every keyboard-operable control must display a visible focus indicator; author CSS that sets `outline: none` or `outline: 0` without providing a replacement focus style is a direct failure of SC 2.4.7, and any such suppression must be audited across the design system's inline-style-driven components. [S8]

---

## Already-addressed (from Lighthouse audit a23e486 + post-fix Lighthouse reports)

- **`landmark-one-main` (partial) — regression-guard [H-A11Y07]:** `App.tsx` `<div>` wrapping `<Routes>` replaced with `<main>`; Lighthouse score on `/` improved. However, `/game`, `/meta`, and `/agenda` routes still flagged `landmark-one-main: FAIL` in post-fix audits (scores 89, 88, 94) — fix may not have propagated, or the inner page structure introduces a second nesting issue. Requires re-verification.

- **`select-name` on FilterBar — regression-guard [H-A11Y08]:** `aria-label={dropdownLabel}` added to the `<select>` in `FilterBar.tsx`; `/meta` `select-name` failure cleared. `/game` route `select-name` still flagged in post-fix report — a second `<select>` elsewhere may remain unlabeled.

- **Auth button contrast — regression-guard [H-A11Y01]:** `AppHeader.tsx` auth buttons changed from `var(--ink-4)` to `var(--ink-3)` targeting ≥ 4.5:1; Lighthouse still flags the same button node in all four post-fix reports (`color-contrast: FAIL, 1 item`). The fix may not have achieved the threshold, or the computed color differs from design-token intent.

- **`link-in-text-block` on HomePage — regression-guard [H-A11Y04]:** `textDecoration: none` removed from inline `<a>` tags; links should now render with browser-default underline, providing the required non-color visual cue.

- **`FactionVotingPanel` table `scope` — regression-guard [H-A11Y06]:** `scope="col"` and `scope="row"` added to `<th>` elements; however `/agenda` post-fix report still flags `td-has-header: FAIL, 1 item` for a large table — this may be a different table in the same route that was not updated.

- **Font preload non-blocking — (performance/a11y boundary):** `rel=preload` with `noscript` fallback added to `index.html` to prevent FOIT (Flash of Invisible Text), which, while primarily a performance concern, is a WCAG 1.4.3-adjacent issue (invisible text fails contrast).

---

## Notes / concerns

1. **Auth button contrast is still open.** The Lighthouse `color-contrast` audit flags the same `<button>` node (the Archivist/Sign-out button in `AppHeader`) across all four routes in the post-fix reports. The commit message claims ≥ 4.5:1 for `var(--ink-3)`, but the axe-core audit disagrees. The actual rendered contrast of `var(--ink-3)` on `var(--paper)` must be measured with a color contrast tool before this can be called closed.

2. **`landmark-one-main` persists on /game and /agenda.** The `<main>` wrapper was added in `App.tsx` at the Routes level, but both `/game` and `/agenda` still fail `landmark-one-main` post-fix. The most likely cause is that the inner page components render their own structural `<div>` trees that suppress or duplicate the landmark, or the fix wasn't rebuilt/redeployed before the audits ran. This needs a live re-audit.

3. **FactionDot has no accessible name.** `FactionDot` renders a bare `<span>` with a background color and no `aria-label`, `title`, or `aria-hidden`. In `FactionChip`, the dot is correctly `aria-hidden="true"` because the faction name text accompanies it. But `FactionDot` used standalone (e.g. in `CategoryBreakdown`, `LeaderboardPodium`, `EntityCard`) conveys faction identity solely through color, violating H-A11Y04. The fix pattern is `aria-label={factionId}` on the dot, or ensuring a visible text sibling is always present.

4. **Heatmap cells expose data only via `title` tooltip (hover-only).** The `PickRateHeatmap` grid uses `title={tipText}` for data disclosure. `title` is not exposed on touch devices, is not read by most screen readers as a primary label, and the cell's visual content is color tier + a small numeric label. The numeric label (`cellLabels`) does provide a non-color channel (H-A11Y04 partially satisfied), but the label is rendered at `font-size: 9px` — below the 11px effective floor established in V1.1 — and may fail H-A11Y01 at that size. The `title` attribute alone does not satisfy SC 4.1.2 `Name, Role, Value` for an interactive-intent element.

5. **`prefers-reduced-motion` is entirely absent.** The app has CSS `transition` properties in `PlanetControlSlideshow.tsx` and Tailwind `transition-colors` in `DropZone` and `GamePreview`. No `@media (prefers-reduced-motion: reduce)` guard exists anywhere in the codebase. SC 2.3.3 is Level AAA so this is not a strict AA failure, but the WCAG Understanding doc explicitly recommends honoring the OS preference as a best practice; the absence is worth flagging for the design system.

6. **Target size for heatmap cells.** Each `PickRateHeatmap` cell is `height: 24` with a computed width that depends on column count (8 strategy cards, total grid ~320–400px). At 8 columns in a ~320px container, cells may be as narrow as ~26px, just clearing the 24px minimum — but only if the container is not smaller. At 320px reflow width this margin collapses. Flag for measurement.

7. **Source tier balance.** All 8 sources are T1 (W3C). No T2 or T3 sources were needed or used for this bank; the WCAG specifications are the definitive standard.
