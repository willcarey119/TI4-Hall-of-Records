# Roadmap Reshape Note — Foundation Remediation Proposal

**Date:** 2026-05-18
**Status:** PROPOSAL — not yet applied to ROADMAP.md
**Prepared by:** Stage 2 convergence (Target Foundation Blueprint §4.4)
**Governs:** ROADMAP.md §V1.3b and forward

---

## Purpose

This note proposes a structural edit to ROADMAP.md. It is a deliverable of the front-end foundation review (spec §5, Deliverable 5); it is **not** the edit itself. The actual ROADMAP.md change happens in a later cycle when the owner acts on this proposal. Nothing in the live codebase or ROADMAP.md is modified by this note.

---

## §2 Hybrid-Aesthetic Amendment (governs remediation)

All phases of Foundation Remediation execute under the §2 amendment recorded in Stage 1 Decision 1 (HYBRID): the newspaper/almanac **identity** is frozen; **legibility execution** (semantic color-coding, density control, progressive disclosure) is an explicitly sanctioned design axis within that identity. Reviewers and implementers may not reject color-coding, disclosure controls, or density changes as "un-newspaper." The masthead, editorial voice, serif display, and almanac framing are non-negotiable boundaries.

---

## Proposed ROADMAP.md Structure

### NEW: Foundation Remediation (prepend ahead of V1.3b)

**Goal:** Migrate the front-end onto the approved Target Foundation Blueprint before any additional feature work. This is a structural remediation, not a feature phase — it makes the next feature phase possible without re-litigating the same design/architecture failures.

**Invariant for the whole sequence:** Tests stay green. Each phase ends with `npm run typecheck && npm run lint && npm test && npm run build` passing. The strangler rule: the new foundation is introduced alongside existing code; sections migrate onto it one at a time; old code is deleted only after its section is green on the new system. The parser/`lib/` TDD discipline and the frozen adapter are untouched throughout.

#### Foundation Phase 0 — De-risk + scaffold (no user-visible change)

**Goal:** Establish the enforcement infrastructure and perform the two early de-risking steps before any visible changes land.

Key items:
- **F-11 code-correctness fix** (`setState`-in-`useEffect` in `PlanetControlSlideshow` and `ComparePage`) — sequenced first as a low-risk correctness cleanup, independent of the design foundation, so it does not confound later render-behavior verification.
- **F-02 effective-vs-nominal SVG size re-measure** — re-measure effective rendered size of SVG `<text>` elements (nominal `fontSize` × viewBox scale factor) before any typography rule executes; settles the triangulation tension so DS-TY3 has a measured basis before any px change is made.
- Stand up the token file (DS-CO1 semantic-token source of truth) and all CI enforcement gates — `max-lines:300` (AR-5), boundary lint (AR-6), token lint (AR-7), one-component-per-file (AR-8) — in **report-only / warn mode** first, so the baseline is visible without breaking the build; gates flip to error per-area as each area migrates.
- Create the `lib/index.ts` barrel (AR-2) and the `shared/UploadDrawer` extraction path for the one boundary violation (AR-3 / F-12).

#### Foundation Phase 1 — Structural: frozen-header chrome budget + responsive contract

**Goal:** Migrate the game-detail header chrome onto the DS-RS1/DS-RS2 chrome-budget contract. This is the owner's single loudest pain (F-09 critical, chrome ≈40–49% of viewport). High-pain, structurally contained to the chrome, relatively low-risk to isolate. Establishes the chrome-budget contract the rest of the app inherits.

#### Foundation Phase 2 — IA / page-length cluster

**Goal:** Migrate the worst information-architecture offenders in pain order: /agenda (F-35, 52.8× scroll depth, critical), VP Race chart-to-container (F-30, critical), Timeline (F-31, 33×), /meta (F-34, 19.5×) onto DS-IA1..DS-IA6 (page-length budget, table of contents, progressive disclosure, reflow-over-truncation, chart-to-container constraint). This is where the HYBRID-sanctioned modern moves (progressive disclosure, density control) do the heavy lifting within the frozen identity.

#### Foundation Phase 3 — Typography + color systematization, section by section

**Goal:** Roll DS-TY1/2/3 (absolute type floor, scale-multiplier constraint, measured-effective SVG sizing) and DS-CO1/2/3 (semantic-token source of truth, verified contrast pairings, non-color channel pairing) across sections one at a time. Token-lint (AR-7) flips from warn to error per-section as each is cleaned. F-03 (default-scale floor breach at 11.9px body) and F-01 (auth-button contrast, measured and confirmed) land here.

#### Foundation Phase 4 — Component-contract + architecture cleanup

**Goal:** Migrate shared primitives onto DS-CC1/CC2 (Kicker single-source, props-as-interface), split the god-files flagged by the `max-lines:300` CI gate (`gameReducer.ts` 953 LOC, `StatsSection.tsx` 656 LOC with AR-4 transform extraction, `buildGameStats.ts` 611 LOC, `AgendaSection.tsx` 583 LOC), flip remaining CI gates from warn to error. Lower pain, higher mechanical risk — done last, behind green tests.

#### Foundation Phase 5 — Long-tail: motion guard, focus states, spacing, chart encoding

**Goal:** DS-MO1 (`prefers-reduced-motion` guard), DS-ST1 (visible focus indicators, no naked `outline:none`), DS-SP1/SP2 (4px base grid + 24px touch-target floor), DS-DV3/DV4 (heatmap encoding honesty, treemap label suppression floor). Individually small; batched at the end behind the now-enforced foundation.

---

## V1.3b and V1.3c Resume Only After Foundation Remediation Lands

**V1.3b** (Player Attribution — opt-in first-name tagging, `/players` route; Sharing / social cards — `/share/:gameId` Open Graph route) and **V1.3c** (Discordant Stars / Thunder's Edge content audit; CSV export; Lighthouse / Core Web Vitals audit) are **paused** for the duration of Foundation Remediation. They resume, in this order, only after Foundation Remediation is complete and all CI gates are green.

The rationale: feature work built on an unresolved foundation re-litigates the same drift the remediation is designed to eliminate. Shipping Player Attribution on top of unsystematized tokens and god-files means the next code review will find the same findings again. The "diagnosis that didn't stick" failure mode (spec §8) requires that the foundation land before feature work resumes.

**Repositioning in ROADMAP.md:** V1.3b and V1.3c shift from their current positions (immediately after V1.3a) to immediately after the Foundation Remediation section, in the same order, with the text: "Resumes after Foundation Remediation lands."

---

## How to Apply

When the owner acts on this proposal, the ROADMAP.md edit is:

1. Insert a new **"Foundation Remediation"** section immediately before the current V1.3b block, structured as the five phases above (Phase 0 through Phase 5), with the invariant and the §2 HYBRID amendment note at the top.
2. Prepend "Resumes after Foundation Remediation lands." to the V1.3b section heading.
3. Prepend "Resumes after Foundation Remediation lands." to the V1.3c section heading.
4. Update the `> Current position` banner at the top of ROADMAP.md to reflect Foundation Remediation as the active phase.

This edit is one atomic ROADMAP.md commit; it does not touch any app code. The blueprint and this note are the backing documentation for that commit.
