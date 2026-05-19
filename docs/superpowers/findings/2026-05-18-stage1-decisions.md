# Stage 1 → Stage 2 Decisions (owner, 2026-05-18)

Two foundational decisions taken at the Stage 1 gate, after felt evidence merged (ledger = 41 findings). Both gate Stage 2.

## Decision 1 — Aesthetic constraint: HYBRID (constraint amended)
**Ruling:** Keep the newspaper/almanac **identity**; **sanction modern legibility moves** within it (color-coding, density control, progressive disclosure as system elements, not exceptions). Scoped evolution, not a reskin.
**Trigger:** owner's Task 6 wrap-up synthesis, verbatim: *"I forgot how much the pops of color that I had recently added to the /meta page kind of helped with legibility. The true 'newspaper' vibe is maybe getting in the way a bit of a 'modern' UI."*
**Effect:** spec §2 amended (the "aesthetic stays" frozen bullet rewritten). Stage 2 §4.1 must treat the editorial-vs-modern legibility execution as an explicit design axis, with the kept identity as the boundary. The review's original "aesthetic is not on trial" framing is now "the *identity* is not on trial; its legibility execution is."

## Decision 2 — IA canon gap: ADD H-IA BANK NOW (full rigor)
**Ruling:** Run a mini Stage-0-style pass to add an Information-Architecture heuristic bank (`H-IA*`) with tiered sources + independent verification + owner adjudication of any ⚠, BEFORE Stage 2 drafting.
**Trigger:** 6 ledger findings (F-11, F-29, F-30, F-31, F-34, F-35 — scroll-depth 19×–53× viewport, truncation-over-reflow, chart-vs-container oversize, page-length) map to NO existing heuristic. The canon's 5 banks (TY/DV/RS/A11Y/ARCH) cannot express information-architecture / page-length-budget / progressive-disclosure, which Stage 1 exposed as the single largest convergent failure cluster.
**Effect:** new addendum tasks (Task 2F research bank → Task 3.5b independent verifier → owner adjudication → fold into canon as `H-IA*`, index grows 55→55+N → re-map the 6 NO-HEURISTIC findings to H-IA IDs). Same rigor contract as Stage 0 (tier rubric, zero-uncited, ⚠→owner).

## Honesty note carried into Stage 2
F-02 (nominal `fontSize={7}` SVG chart text) has a **triangulation tension**: felt found SVG `viewBox` scaling renders it at ~27px effective height. Static M2 (nominal 7px) stands recorded but is NOT settled. Stage 2 must re-measure effective-vs-nominal before any blueprint rule rests on it. F-03 (`--font-scale: 0.85` → 11.9px body) is unaffected and remains hard.
