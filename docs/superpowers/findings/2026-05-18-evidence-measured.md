# Stage 1 — Measured Evidence (Task 5, Claude-in-Chrome)

**Date:** 2026-05-18 · **Target:** https://ti4-hall-of-records-da562.web.app (live) · **Tab:** connector tab 2091518318
**Method:** `getComputedStyle` / DOM measurement via the Chrome connector — objective rendered values, not code inference.

## Instrument limitations (recorded, not hidden — spec §2 "no silent degradation")
- **L1 — mobile viewport not reproducible this session.** `resize_window(390×844)` resized the OS window but the page `innerWidth` stayed **1670** (viewport did not follow). The true 390px frozen-header %-of-viewport could NOT be measured via the connector. → That measurement is **deferred to Task 6 (Cowork, real screen)** and is already pinned in code by Task 7 static evidence (`FrozenHeader.tsx`). Desktop proportions ARE measured below.
- **L2 — WCAG contrast not computable in-page.** Design tokens are authored in `oklch()`; no oklch→sRGB converter available in the page context, so a valid contrast ratio could not be computed client-side. Auth/nav contrast remains as **Lighthouse-flagged (Task 7 PS-1)**, not measured here. (A naive RGB parse produced a bogus 1.05 — discarded, not reported as a finding.)

## Measured findings

- **M1 · `--font-scale` default = 0.85 → the floor undercuts itself · H-TY02, H-TY10 · CRITICAL.**
  `localStorage['ti4-font-scale'] = 0` (the default/untouched step) resolves `--font-scale: 0.85`. Measured rendered sizes with this default: body `<p>` = **11.9px** (game page) and nav/header text (GAMES, ARCHIVIST→, A–/A+) = **11.9px** (home). The project's stated 14px floor × 0.85 = ~11.9px. **The type system's own default scale step ships every scaled surface ~15% below its own stated floor before the user touches anything.** This is the measured root mechanism of the "legibility loop" — not individual sloppy values, a systemic multiplier.

- **M2 · Chart SVG text renders at 7px / 9px · H-DV (axis/label legibility), H-TY · CRITICAL.**
  Game detail page: **14 `<svg> text` elements computed at 7px**, 6 at 9px. SVG `fontSize` is an attribute (not subject to `--font-scale`), so 7px is the true on-screen size — below the 12px absolute floor and the 14px design floor. Objectively corroborates Task 7 static (`VpRaceSection.tsx` / `ScoringPaceSection.tsx` `fontSize={7}`, 6 SVG text elements). The most information-dense marks on the hero charts are the least legible.

- **M3 · Display headings are correctly sized (the one healthy register) · H-TY10 · INFO.**
  `h1/h2` = **32.3px**. Noted as the positive control: the scale's top end is fine; the failure is concentrated at the small/data end. Useful contrast for the §4.1 type-scale spec — the problem is floor + density, not the whole scale.

- **M4 · Header chrome consumes ~40% of the *desktop* viewport before content · H-RS03, H-RS11 · MAJOR.**
  Layout shell is a `position:fixed` full-viewport container (height == 100% of viewport). The stacked header chrome (masthead "TI4 · Hall of Records" + GAMES/LEAGUE/AGENDA + RECAP/VP RACE/…/AGENDA section nav + R1–R6 round scrubber) occupies roughly the top **~290 of 730 px ≈ ~40%** of the desktop viewport before any game content. Content-to-chrome ratio is already poor at desktop; H-RS11 (sticky harmful below ~8:1 mobile) and H-RS03 (mobile sticky ≤~8% vh) will be violated far worse on a phone — the owner's reported "frozen header eats mobile" symptom is structurally consistent with this measured desktop baseline. (Mobile exact figure: see L1 → Task 6.)

- **M5 · Tokens authored in `oklch()` · H-A11Y03/04 (for Stage 2) · INFO.**
  Sampled text `oklch(0.52 0.01 60)` on paper `oklch(0.97 0.012 80)`. Recorded so the §4.1 color spec and any contrast remediation use oklch-aware tooling, and so the contrast audit (Task 7 PS-1 / Lighthouse) is resolved with correct math, not sRGB approximations.

## Summary
- 5 measured findings: 2 CRITICAL (M1 default-scale-undercuts-floor, M2 7px chart text), 1 MAJOR (M4 chrome ~40% desktop), 2 INFO (M3 healthy headings, M5 oklch tokens).
- M1 is the highest-value catch of the measured track: it is invisible to static code review (the code says `14px`; the *running default* says `11.9px`) — exactly why the spec mandated a measured track.
- Deferred by instrument limits: mobile frozen-header % (→ Task 6), oklch contrast ratios (→ Lighthouse/Task 7, Stage 2 with oklch tooling).
