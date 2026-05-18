# Front-End Foundation Review — Design Spec

**Date:** 2026-05-18
**Status:** Approved (brainstorm), pending user spec review → implementation plan
**Type:** Top-down review (process + diagnosis + blueprint). Not feature work.
**Supersedes for the duration:** the active ROADMAP.md sequence is *paused* while this review runs. ROADMAP itself is retained and unmodified until the reshape note (Deliverable 5) is acted on in a later cycle.

---

## 1. Problem Statement

TI4 Hall of Records is a solid, working V1.3b product whose editorial (newspaper/almanac) aesthetic is **correct** but whose front-end rests on **no systematic foundation**. There is no researched type scale, spacing system, responsive model, or reusable component contract — so every section re-litigates sizing (the "font-sizing fight" the owner has fought the entire development journey), drift is structural, density defeats fast scanning (the #1 felt symptom), mobile breaks concretely (frozen headers stay persistent on mobile — a legibility killer), and some features are weak at the interaction level (the #2 symptom).

The existing `CODE_REVIEW_2026-05-05.md` *diagnosed* a "legibility loop" and it still did not get fixed — evidence that a findings document with no enforced target foundation does not break the loop in this project. This review must not repeat that.

The roadmap is paused to:

1. **Diagnose** the front-end top-down against *established, citable* web-design / data-dashboard / typographic / responsive / accessibility practice — explicitly **not** reinventing the wheel.
2. **Produce an approved, implementable Target Foundation Blueprint**: a design system + a plug-and-play feature-module architecture with an enforced per-feature code ceiling.

The Firebase/Firestore + `src/adapters/` data layer is **frozen** — a constraint to respect, not a subject. Remediation *execution* becomes the reshaped roadmap in later spec→plan→implement cycles.

---

## 2. Scope & Boundaries

### In scope
- Front-end **visual/UX design philosophy** (the spine): type, spacing, density, scannability, responsive behavior, feature-level interaction quality.
- Front-end **architecture rethink**: plug-and-play feature-module pattern, enforced per-feature code ceiling, design-token enforcement so drift becomes structurally hard.
- A **research canon** of established, citable practice from which all recommendations are derived.

### Frozen — constraints, not subjects
- Firebase/Firestore + `src/adapters/` data layer. No platform migration. The adapter pattern is respected as-is (the code review confirmed it is clean — no Firestore import outside `src/adapters/`).
- The newspaper/almanac **aesthetic direction stays.** This review fixes the *system beneath* it, not the vibe.
- Parser / `src/lib/` logic and its TDD discipline — out of scope except where a finding genuinely traces back to it.

### Explicitly deferred (downstream cycles, not this spec)
- *Execution* of the remediation. This review ends at an approved blueprint + a high-level remediation sequence; turning that into code is later cycles via the reshaped roadmap.
- The paused ROADMAP V1.3b/c feature work (player attribution, sharing/social cards, DS/TE audit, CSV export, Lighthouse) resumes only after the foundation lands.

### Confirmed dependencies / assumptions (validate at review start)
- **Cowork** — owner has confirmed access. Used for the felt-evidence walkthrough.
- **Claude-in-Chrome connector** — must be *connected* at review time (can be flaky). Used for measured evidence (computed styles, responsive reproduction, console/network).
- **Fallback (works regardless):** if either browser instrument is unavailable at start, the static audit (subagents reading rendering code + existing `lighthouse-*.json` + the a11y commit) is the floor. A self-guided narrated walkthrough script substitutes for Cowork. The review does not silently degrade — instrument availability is checked and the chosen mode is recorded.

---

## 3. Method

A hybrid: **research-first**, then **evidence-anchored dual-track**.

### Stage 0 — Research Canon (runs first)
Compile a curated, *citable* best-practice digest organized into five banks:
- (a) Modular type-scale & spacing systems
- (b) Data-dashboard / data-visualization scannability & comprehension
- (c) Responsive & sticky-element patterns
- (d) WCAG AA / accessibility
- (e) Plug-and-play front-end feature-module architecture & code-size governance

Each bank ends in **extracted heuristics** — the concrete rules the app will be held to. Every source is tagged **T1/T2/T3** (formal standard/official docs · recognized named practitioner · community-corroboration-only); no heuristic may rest solely on T3. Stage 0 also takes an **owner-seeded Inspirations Register** as input (concrete exemplar products — #1 the old-school Nate Silver–era FiveThirtyEight as the product-thesis sibling, plus Our World in Data, Reuters Graphics, The Pudding — clustered and tied to banks, with a binding archival-sourcing rule for old-538); Banks A/B/C must reference it. Stage 0 does not close until an **independent verifier** subagent re-opens every heuristic's cited sources and the owner adjudicates every flagged/contested/T3-only heuristic. No ad-hoc invention, no unvetted citation. This is the "don't reinvent the wheel" stage.

### Stage 1 — Evidence-Anchored Dual-Track Audit
Run against the Stage 0 heuristics.

**Design track — three evidence sources:**
1. **Measured** — Claude-in-Chrome inspects the live app at https://ti4-hall-of-records-da562.web.app: computed type sizes per section (actual rendered px, not what CSS claims), responsive behavior at mobile/tablet/desktop widths, the frozen-header-on-mobile failure reproduced, console/network.
2. **Felt** — Cowork-guided walkthrough using a per-screen script authored from the Stage 0 heuristics. Owner reactions captured as evidence, prompted against heuristics ("does this scan in 2 seconds? where do your eyes go first?").
3. **Static** — subagents read the rendering code across all sections; fold in the existing `lighthouse-{home,meta,game,agenda}.json` and the `a23e486` a11y commit (existing evidence, not redone).

Output: a **Findings Ledger** — each finding tagged with the heuristic it violates and the specific screen / file / measurement that proves it.

**Architecture track:**
Map the front-end module graph; identify god-files, tangled boundaries, design-token bypass (e.g. the `PlanetControlSlideshow` hardcoded hex finding), per-feature line counts; design the plug-and-play feature-module pattern + an enforced code-ceiling CI gate.

### Stage 2 — Convergence → Target Foundation Blueprint
The two tracks merge into one approved, implementable blueprint (Section 4). Every rule carries *why* (Stage 0 source) + *where* (Stage 1 evidence).

---

## 4. The Target Foundation Blueprint (contents)

The central artifact Stage 2 produces. Four parts.

### 4.1 — Design System Spec
**Scope is set by Stage 0 research ∩ this app's actual needs — NOT by the font fight.** Typography is one output among several, sized to whatever weight the evidence gives it, no more privileged than the others. The spec **opens with a "why these categories, why this depth" rationale** traced to Stage 0 and the audit, so the scope decision itself is evidence-driven and reviewable. Typography receiving deep treatment must be *earned* by evidence, identically to every other category.

Candidate categories (Stage 0 + audit decide which are load-bearing here and at what depth):
- Type scale & register rules (replaces ad-hoc `--font-*` tokens that drifted 7→9→14px across phases; the code review's mono-vs-sans finding becomes a system rule)
- Spacing / rhythm / density model (explicit "scan-fast analytics surface" targets, not broadsheet defaults)
- Color & semantic tokens (state, faction, data encoding; the hardcoded-hex finding lives here; faction color is core to a faction-first app)
- Data-visualization system (slope/line/heatmap/treemap/histogram family is a major surface; comprehension rules likely matter as much as type)
- Responsive model & sticky-element contract (the persistent-header failure becomes structurally impossible, not patched)
- Interaction & state patterns (loading / empty / error / hover / scrub — the #2 "weak feature-level UI/UX" symptom)
- Component contracts (cross-cutting; binds the above; each shared primitive gets one purpose, props-as-interface, what it may/may not control — consumers cannot re-litigate type/spacing locally)
- Motion / iconography / content-voice — **only if** Stage 0 + app-needs prove them load-bearing; otherwise explicitly scoped out, not silently dropped.

### 4.2 — Front-End Architecture Spec
The plug-and-play feature-module pattern: what a "feature" is; its folder/boundary shape; how it consumes `src/lib/` + the frozen adapter; the **enforced per-feature code ceiling** (a concrete number + the CI/lint gate that fails the build when exceeded); the token-enforcement gate (no hardcoded hex — the `PlanetControlSlideshow` finding becomes a lint rule).

### 4.3 — Conformance Map
Every Stage 1 finding → which blueprint rule resolves it → severity. The bridge from "what's wrong" to "what we're building," and the proof the blueprint covers the diagnosed pain rather than being generic. No orphan findings; no uncited rules.

### 4.4 — Remediation Sequence (high-level only)
An ordered outline of how the codebase migrates onto the foundation — strangler-style, section by section, tests staying green — *without* writing the implementation plan. This is what reshapes ROADMAP.md downstream.

---

## 5. Deliverables (in order produced)

1. **Research Canon digest** — five banks, tier-tagged sources, extracted heuristics. (Stage 0)
   - Supporting Stage 0 artifacts: **Inspirations Register** (owner-seeded, Stage 0 input) and **Source Adjudication Ledger** (independent verifier checks + owner rulings; gates the Stage 0 commit).
2. **Cowork walkthrough script** — per-screen prompts derived from the heuristics. (input to Stage 1 felt-evidence)
3. **Findings Ledger** — every finding tagged: heuristic violated · evidence (measurement/screen/file) · severity. (Stage 1)
4. **Target Foundation Blueprint** — the four-part artifact from Section 4. (Stage 2)
5. **Roadmap reshape note** — the proposed diff to ROADMAP.md: a *Foundation Remediation* section prepended ahead of V1.3b; paused feature work explicitly repositioned as "resumes after foundation lands." The note is the deliverable; rewriting ROADMAP.md happens when acted on, not now.

All deliverables land under `docs/superpowers/` (specs/findings as appropriate); exact filenames set by the implementation plan.

---

## 6. Acceptance Criteria (when *this review* is done)

- Every Stage 0 bank ends in concrete, cited heuristics — zero ad-hoc rules; every source carries a T1/T2/T3 tier tag; no heuristic rests solely on T3.
- The independent verifier checked every heuristic, and every `⚠ adjudicate`/contested heuristic has a recorded owner ruling before the Stage 0 commit.
- The Inspirations Register is owner-seeded and referenced by Banks A/B/C; any research-proposed exemplar has an owner ruling.
- Every blueprint rule traces to a source (Stage 0) **and** evidence (Stage 1) — the conformance map has no orphan findings and no uncited rules; no rule rests solely on an owner-downgraded heuristic.
- The design-system scope carries its "why these categories, why this depth" rationale (the §4.1 discipline) — it is not anchored to the loudest symptom.
- Both browser instruments' availability confirmed at start, or the documented fallback invoked and the chosen mode recorded — the review does not silently degrade.
- Owner approves the blueprint.
- Execution is **not** in this review's acceptance — it is downstream.

---

## 7. Non-Goals

- Not changing the data layer, the adapter pattern, or the hosting platform.
- Not changing the newspaper/almanac aesthetic direction.
- Not executing remediation or rewriting ROADMAP.md (only proposing the reshape).
- Not a parser / `src/lib/` audit (in scope only where a finding traces back there).
- Not a generic design system — every rule must be earned by this app's evidence.

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| Browser instruments unavailable/flaky at review time | Static-audit floor + narrated-walkthrough fallback; mode recorded, no silent degradation |
| Design system pigeonholed onto typography | §4.1 "why these categories, why this depth" rationale gate; typography depth must be evidence-earned |
| Another diagnosis that doesn't stick (the CODE_REVIEW_2026-05-05 outcome) | Deliverable is an *enforced* blueprint (CI/lint gates), not findings alone; conformance map proves coverage |
| Scope creep into feature work or re-platforming | Frozen constraints in §2; non-goals in §7; deferral boundary explicit |
| Research canon becomes generic, disconnected from app | Stage 1 anchors every heuristic to a real screen/file/measurement before it enters the blueprint; owner-seeded Inspirations Register keeps the target concrete |
| Subagent cites a weak/wrong/hallucinated source or mis-tiers it | Source-Tier Rubric + independent-verifier re-check of every cited source (Task 3.5) + owner adjudication of every flagged heuristic before Stage 0 commits |
