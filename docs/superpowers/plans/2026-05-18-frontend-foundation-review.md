# Front-End Foundation Review — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the research-grounded top-down front-end review and produce the five approved deliverables, ending at an owner-approved Target Foundation Blueprint (no remediation execution).

**Architecture:** Research-first (Stage 0 canon) → evidence-anchored dual-track audit (Stage 1: measured via Claude-in-Chrome, felt via Cowork, static via subagents + existing Lighthouse/a11y; plus a parallel architecture track) → convergence (Stage 2 blueprint + roadmap reshape note). Every blueprint rule must cite a Stage 0 source AND a Stage 1 evidence item.

**Tech Stack:** Documents under `docs/superpowers/`. Tools: WebSearch / context7 (research), Claude-in-Chrome connector (measured), Cowork (felt), Explore/general-purpose subagents (static + architecture), Grep (verification of citation completeness).

**Source spec:** [`docs/superpowers/specs/2026-05-18-frontend-foundation-review-design.md`](../specs/2026-05-18-frontend-foundation-review-design.md)

**Commit discipline:** Subagents stage only. Controller requests explicit owner free-text authorization to commit at each Stage boundary (owner standing rule: no commits without approval). Push convention: `git push origin main:master`.

**Heuristic ID convention:** `H-<bank><nn>` where bank ∈ {TY, DV, RS, A11Y, ARCH}. Example `H-TY03`. Every heuristic, finding, and blueprint rule references these IDs so the conformance map can be verified mechanically with Grep.

**Source-Tier Rubric:** every source cited in the canon is tagged **T1** / **T2** / **T3**. **T1** = formal specs/standards (W3C, WCAG, ECMA), official framework/library docs, canonical field authorities. **T2** = recognized practitioner references with named authorship and a track record. **T3** = community/blog/forum — permitted as *corroboration only*, never the sole support for a heuristic. A heuristic's strength = the highest tier among its supporting sources. Any heuristic whose only support is T3 is auto-flagged `⚠ adjudicate` and goes to the owner in Task 3.5.

**Inspirations Register:** `docs/superpowers/research/2026-05-18-inspirations-register.md` is an owner-seeded Stage 0 input (Task 0.5). Banks A/B/C MUST read it; a heuristic an inspiration concretely exemplifies references it inline as `[INSP:<name>]`. Task 10's design-system rationale may cite an inspiration alongside `H-*`/`F-*`.

---

## File Structure

| Path | Responsibility | Produced by |
|---|---|---|
| `docs/superpowers/findings/2026-05-18-review-preflight.md` | Instrument availability + chosen evidence mode | Task 0 |
| `docs/superpowers/research/2026-05-18-inspirations-register.md` | Owner-seeded exemplars + why; clustered, tied to heuristics | Task 0.5 |
| `docs/superpowers/research/2026-05-18-research-canon.md` | Stage 0 digest: 5 banks, tiered sources, `H-*` heuristics | Tasks 1–3 |
| `docs/superpowers/findings/2026-05-18-source-adjudication-ledger.md` | Independent verifier's per-heuristic source check + owner rulings | Task 3.5 |
| `docs/superpowers/specs/2026-05-18-cowork-walkthrough-script.md` | Deliverable 2: per-screen prompts keyed to `H-*` | Task 4 |
| `docs/superpowers/findings/2026-05-18-evidence-measured.md` | Claude-in-Chrome measurements | Task 5 |
| `docs/superpowers/findings/2026-05-18-evidence-felt.md` | Cowork/narrated walkthrough reactions | Task 6 |
| `docs/superpowers/findings/2026-05-18-evidence-static.md` | Rendering-code read + Lighthouse/a11y fold-in | Task 7 |
| `docs/superpowers/findings/2026-05-18-evidence-architecture.md` | Module graph, god-files, token bypass, per-feature LOC | Task 8 |
| `docs/superpowers/findings/2026-05-18-findings-ledger.md` | Deliverable 3: all findings tagged `H-*` · evidence · severity | Task 9 |
| `docs/superpowers/specs/2026-05-18-target-foundation-blueprint.md` | Deliverable 4: §4.1–4.4 of the spec | Tasks 10–13 |
| `docs/superpowers/specs/2026-05-18-roadmap-reshape-note.md` | Deliverable 5: proposed ROADMAP.md diff | Task 14 |

---

## Task 0: Pre-flight — confirm instruments, set evidence mode

**Files:**
- Create: `docs/superpowers/findings/2026-05-18-review-preflight.md`

- [ ] **Step 1: Define the acceptance check**

The review may not silently degrade (spec §6). Acceptance: the preflight doc states, for each of the three instruments, AVAILABLE or UNAVAILABLE + the resulting mode, with no instrument left "unknown".

- [ ] **Step 2: Probe Claude-in-Chrome**

Use ToolSearch `select:mcp__Claude_in_Chrome__list_connected_browsers`, then call it. Record: connected? which browser? Then attempt `mcp__Claude_in_Chrome__navigate` to `https://ti4-hall-of-records-da562.web.app` and a screenshot. Record success/failure.

- [ ] **Step 3: Probe Cowork**

Confirm Cowork access with the owner (owner pre-confirmed in brainstorm; re-confirm it is reachable now). Record AVAILABLE/UNAVAILABLE.

- [ ] **Step 4: Write the preflight doc**

Record a 3-row table (Instrument | Status | Mode-if-unavailable). Decision rules:
- Claude-in-Chrome UNAVAILABLE → measured evidence falls back to static-only; note the gap explicitly in Task 5.
- Cowork UNAVAILABLE → Task 6 uses the self-guided narrated walkthrough script instead.
- Static audit is always available (floor).

- [ ] **Step 5: Verify**

Run: `Grep pattern="UNAVAILABLE|AVAILABLE" path="docs/superpowers/findings/2026-05-18-review-preflight.md" output_mode=count`
Expected: count ≥ 3 (every instrument has an explicit status). If any instrument is missing a status line, fix before proceeding.

- [ ] **Step 6: Stage**

`git add docs/superpowers/findings/2026-05-18-review-preflight.md` (no commit yet — Stage 0 boundary handles it).

---

## Task 0.5: Inspirations Register (owner-seeded Stage 0 input)

**Files:**
- Create: `docs/superpowers/research/2026-05-18-inspirations-register.md`

- [ ] **Step 1: Acceptance check** — the register exists, every owner seed has a *what* + *why* + a cluster tag + at least one heuristic-bank it bears on (TY/DV/RS/A11Y/ARCH), and any non-owner addition is marked `proposed — awaiting owner ruling`.

- [ ] **Step 2: Record the owner seeds verbatim-faithful** (already provided):
  - **Our World in Data** (ourworldindata.org) — one coherent system holding across wildly heterogeneous data views; consistency at scale, big-dashboard→single-view. Clusters: *system coherence*, *component contracts*. Bears on: TY, DV, ARCH. (Direct antidote to the section-to-section drift symptom.)
  - **Reuters Graphics** (reuters.com/graphics) — imaginative fusion of statistics + conveyance + supporting prose; the editorial vibe at its highest level. Clusters: *editorial dataviz*, *prose+stat fusion*. Bears on: DV, TY. (The kept newspaper/almanac vibe's target.)
  - **The Pudding** (pudding.cool) — wide technique range; an *idea bank*, explicitly NOT a coherence model. Clusters: *technique range*. Bears on: DV. (Tagged non-system so it can't pull the blueprint toward bespoke-per-screen.)
  - **Sourcing-method note:** owner discovered these via *Webby Award winners, filtered to "looks close to what we're doing."* Record this as the discovery heuristic the research-proposes path should reuse.

- [ ] **Step 3:** Add an empty `## Proposed by research (awaiting owner ruling)` section. Stage 0 Banks A/B/C may append candidates here only; they never edit owner seeds. Owner adjudicates these at the Task 3.5 gate.

- [ ] **Step 4: Verify** — `Grep pattern="Bears on:" path="docs/superpowers/research/2026-05-18-inspirations-register.md" output_mode=count` ≥ 3 (every owner seed mapped to banks). Stage (no commit — Stage 0 boundary handles it).

---

## Task 1: Stage 0 — research canon skeleton

**Files:**
- Create: `docs/superpowers/research/2026-05-18-research-canon.md`

- [ ] **Step 1: Write the skeleton**

Create the file with: title, date, a "Heuristic ID convention" note (copy from this plan's header), and five empty bank sections with H2 headers exactly: `## Bank A — Type Scale & Spacing (H-TY)`, `## Bank B — Data-Dashboard & Data-Viz Comprehension (H-DV)`, `## Bank C — Responsive & Sticky-Element Patterns (H-RS)`, `## Bank D — WCAG AA / Accessibility (H-A11Y)`, `## Bank E — Feature-Module Architecture & Code-Size Governance (H-ARCH)`. Each section contains two subheads: `### Sources` and `### Extracted Heuristics`.

- [ ] **Step 2: Verify**

Run: `Grep pattern="^## Bank [A-E] —" path="docs/superpowers/research/2026-05-18-research-canon.md" output_mode=count`
Expected: 5.

---

## Tasks 2A–2E: Stage 0 — fill each research bank (parallelizable)

Each bank is an independent subagent dispatch. Dispatch 2A–2E together in one message (5 parallel `general-purpose` agents) since they share no state.

**Common subagent contract (applies to every 2x task):**
- Tools: WebSearch, WebFetch, and context7 (`resolve-library-id` → `query-docs`) for any library/framework specifics.
- Output: append to the named bank section of `docs/superpowers/research/2026-05-18-research-canon.md` ONLY (its own section — no cross-section writes, avoids merge conflict).
- `### Sources`: 4–8 named, datable, linkable sources, **each tagged `(T1)`/`(T2)`/`(T3)`** per the Source-Tier Rubric in the header. No `(T3)` source as the sole support for a heuristic.
- `### Extracted Heuristics`: numbered `H-<bank><nn>`, each one sentence, testable against a real screen, source cited inline as `[S<n>]` mapping to the Sources list. If every supporting `[S<n>]` for a heuristic is `(T3)`, append ` ⚠ adjudicate` to that line.
- **Banks A, B, C only:** also read `docs/superpowers/research/2026-05-18-inspirations-register.md`; where an owner inspiration concretely exemplifies a heuristic, reference it inline as `[INSP:<name>]`. May append candidate exemplars to the register's `## Proposed by research` section only.
- Hard rule: **zero uncited heuristics.** Every `H-*` line ends with at least one `[S<n>]`.

- [ ] **Task 2A — Bank A (Type & Spacing, H-TY):** modular type scales (ratio-based step systems), minimum body/label sizes for data UI, type-register rules (when monospace vs sans — directly addresses the mono-everywhere finding), spacing/rhythm scales, density targets for data-dense surfaces.

- [ ] **Task 2B — Bank B (Data-Dashboard & Data-Viz, H-DV):** scannability (F/Z patterns, visual hierarchy for "answer in 2 seconds"), chart comprehension (slope/line/heatmap/treemap/histogram — the app's actual chart family), small-multiples vs overlay, color encoding for categorical (faction) data, label/axis legibility minimums.

- [ ] **Task 2C — Bank C (Responsive & Sticky, H-RS):** breakpoint strategy, sticky/frozen-element budgets (max viewport % a sticky header may consume on mobile — directly addresses the persistent-frozen-header failure), collapse/disclosure patterns for nav-heavy chrome on small screens, touch-target minimums.

- [ ] **Task 2D — Bank D (WCAG AA, H-A11Y):** contrast ratios (text + non-text/UI), focus visibility, target size, reflow at 320px, prefers-reduced-motion, semantic landmarks. Subagent must also read the existing `app/lighthouse-{home,meta,game,agenda}.json` and the `a23e486` commit so heuristics are framed relative to work already done (don't re-prescribe what's fixed).

- [ ] **Task 2E — Bank E (Architecture & Code Governance, H-ARCH):** feature-module / vertical-slice front-end patterns, module boundary contracts, design-token enforcement (lint-level), file/feature size-ceiling practice and how teams enforce it in CI, props-as-interface / encapsulation principles. Use context7 for React/Vite/ESLint specifics.

- [ ] **Verification (after all five return):**

Run: `Grep pattern="^- ?\*?\*?H-(TY|DV|RS|A11Y|ARCH)[0-9]" path="docs/superpowers/research/2026-05-18-research-canon.md" output_mode=count`
Expected: ≥ 20 (≥ 4 heuristics/bank is the floor).
Run: `Grep pattern="H-(TY|DV|RS|A11Y|ARCH)[0-9].*\[S[0-9]" path="docs/superpowers/research/2026-05-18-research-canon.md" output_mode=count`
Expected: equal to the previous count (every heuristic carries an `[S<n>]` citation). If counts differ, the uncited heuristics must be fixed or removed before Stage 1.
Run: `Grep pattern="\((T1|T2|T3)\)" path="docs/superpowers/research/2026-05-18-research-canon.md" output_mode=count`
Expected: ≥ the total number of `### Sources` entries across all five banks (every source carries a tier tag). Untagged sources block entry to Stage 1.

---

## Task 3: Stage 0 — canon assembly & gate

**Files:**
- Modify: `docs/superpowers/research/2026-05-18-research-canon.md`

- [ ] **Step 1: Add the master heuristic index**

Prepend (after the skeleton note) a flat table: `| ID | Bank | Heuristic (short) | Source(s) |` listing every `H-*` so Stage 1/2 can reference one canonical list.

- [ ] **Step 2: Dedupe & conflict check**

Read all five banks. Where two banks state overlapping rules (e.g. a min-size both in TY and A11Y), keep one canonical heuristic and have the other reference it (`see H-TYnn`). Resolve any contradictions explicitly (state which wins and why).

- [ ] **Step 3: Verify the gate (spec §6: zero ad-hoc rules)**

Run: `Grep pattern="^\| H-" path="docs/superpowers/research/2026-05-18-research-canon.md" output_mode=count` and confirm the index row count equals the in-body heuristic count from Task 2 verification. Mismatch = an orphan heuristic; fix.

- [ ] **Step 4: Hand off to adjudication — NO Stage 0 commit yet**

Stage the canon. Do **not** present or commit Stage 0 until Task 3.5 (independent source adjudication) clears — counting citations is not vetting them. Proceed directly to Task 3.5.

---

## Task 3.5: Source vetting & adjudication gate (independent verifier + owner ruling)

**Files:**
- Create: `docs/superpowers/findings/2026-05-18-source-adjudication-ledger.md`

**Why this task exists:** the Grep gates in Tasks 2–3 prove citations *exist*, not that they are *honest*. A research subagent can confidently cite a real-looking source that does not actually support the claim, or mis-tier a blog as a standard. This is the "trust but verify agent claims" failure mode. The verifier here is a **fresh subagent that did not author any bank**.

- [ ] **Step 1: Dispatch the independent verifier subagent**

Dispatch one `general-purpose` subagent with: the assembled canon + the heuristic index. For each `H-*`: open every cited `[S<n>]` (WebFetch the actual source), and answer — (a) does the source genuinely support the heuristic as stated? (b) is the assigned tier honest per the rubric? (c) is the source real and reachable (not hallucinated)? Output a ledger row: `| H-* | source(s) | supports? Y/N/partial | tier-honest? Y/N | verifier note |`. It must NOT consult the authoring bank's reasoning — independent re-derivation only.

- [ ] **Step 2: Auto-classify each heuristic**

From the ledger: `CLEAR` (all sources support + tiers honest + ≥1 source is T1/T2) · `⚠ adjudicate` (already flagged T3-only, OR verifier found support=partial/N, OR tier dishonest, OR source unreachable). Every non-CLEAR heuristic gets a one-line statement of the specific problem.

- [ ] **Step 3: Verify the verifier did its job**

Run: `Grep pattern="^\| H-(TY|DV|RS|A11Y|ARCH)[0-9]" path="docs/superpowers/findings/2026-05-18-source-adjudication-ledger.md" output_mode=count`
Expected: equals the total heuristic count from Task 2 verification (every heuristic was checked — no silent skips).

- [ ] **Step 4: OWNER ADJUDICATION (human gate — blocking)**

Present the owner the full `⚠ adjudicate` set, each with: the heuristic, the problem, and options (keep as-is / downgrade to "weak — informational only" / strengthen with a better source / cut). Owner rules on each. Record the ruling inline in the ledger (`OWNER: <ruling> — <date>`). CLEAR heuristics are surfaced as a count, not individually walked, unless the owner asks.

- [ ] **Step 5: Apply rulings to the canon**

Edit `2026-05-18-research-canon.md`: cut/downgrade/strengthen per the owner rulings. A heuristic the owner downgraded is tagged `(informational — not blueprint-binding)` so Task 12's conformance map knows it cannot be the sole resolver of a finding.

- [ ] **Step 6: Stage 0 commit gate**

Stage all Stage 0 files (preflight, inspirations register, canon, adjudication ledger). Present the Stage 0 close-out (heuristic count, CLEAR vs adjudicated, what was cut/downgraded, any research-proposed inspirations awaiting your ruling). Request explicit free-text authorization to commit. On approval: `git add -A docs/superpowers && git commit -m "docs: stage 0 research canon + inspirations + adjudication for front-end foundation review"`.

---

## Task 4: Stage 1 — author the Cowork walkthrough script (Deliverable 2)

**Files:**
- Create: `docs/superpowers/specs/2026-05-18-cowork-walkthrough-script.md`

- [ ] **Step 1: Enumerate the screens**

List every route/section to walk: `/` (home + storyline card), `/games/:id` (Recap, VP Race, Timeline, Dashboard, Planets, Tech, Agenda — 7 sections + FrozenHeader + round scrubber), `/meta` (Factions, Strategy incl. PickRateHeatmap, Techs, Stats), `/agenda`, `/compare/:a/:b`. One walkthrough block per screen.

- [ ] **Step 2: Write per-screen prompt blocks keyed to heuristics**

For each screen, write: (a) a 2-second scan prompt ("look away, look back — what's the first number you find? time it"), (b) 2–4 targeted prompts each naming the `H-*` it probes (e.g. "H-RS02: on a phone width, how much of the screen is the frozen header eating?"), (c) an open "what felt off here?" capture. Only reference heuristic IDs that exist in the Task 3 index.

- [ ] **Step 3: Add the fallback header**

If Task 0 marked Cowork UNAVAILABLE, the script doubles as a self-guided narrated checklist — add a one-paragraph "how to run this solo while screen-sharing into a normal session" note at the top.

- [ ] **Step 4: Verify**

Run: `Grep pattern="H-(TY|DV|RS|A11Y)[0-9]" path="docs/superpowers/specs/2026-05-18-cowork-walkthrough-script.md" output_mode=count`
Expected: ≥ 10 (the felt walkthrough must probe a meaningful slice of heuristics, not be vibes-only).
Cross-check every referenced ID exists in the canon index (spot-check 5 IDs against Task 3 table).

---

## Tasks 5–8: Stage 1 — gather evidence (4 sources)

Tasks 5, 7, 8 are parallelizable (independent tools, independent files). Task 6 is human-in-the-loop and runs when the owner is available; it is **not** blocking for 5/7/8.

### Task 5: Measured evidence (Claude-in-Chrome)

**Files:** Create `docs/superpowers/findings/2026-05-18-evidence-measured.md`

- [ ] **Step 1:** If Task 0 marked Chrome UNAVAILABLE, write a single note "MEASURED EVIDENCE SKIPPED — instrument unavailable; static track (Task 7) carries this load" and skip to staging. Otherwise continue.
- [ ] **Step 2:** For each screen in Task 4's enumeration: navigate, screenshot at widths 375 / 768 / 1280 px (`mcp__Claude_in_Chrome__resize_window` + screenshot). Save observations.
- [ ] **Step 3:** Pull **computed** font sizes for the dense surfaces (VP Race axis labels, StatCard numerics, table headers, FrozenHeader) via `mcp__Claude_in_Chrome__javascript_tool` running `getComputedStyle`. Record actual rendered px vs the project's stated 14px floor.
- [ ] **Step 4:** Reproduce the frozen-header-on-mobile failure at 375px on `/games/:id`: record the sticky element's rendered height as a % of viewport. Tag against `H-RS*`.
- [ ] **Step 5:** Each observation line ends with the `H-*` it bears on and a severity guess (info/minor/major/critical).
- [ ] **Step 6: Verify** — `Grep pattern="H-(TY|DV|RS|A11Y)[0-9]" path=".../2026-05-18-evidence-measured.md" output_mode=count` ≥ 8 (or the SKIPPED note is present). Stage.

### Task 6: Felt evidence (Cowork-guided, human-in-the-loop)

**Files:** Create `docs/superpowers/findings/2026-05-18-evidence-felt.md`

- [ ] **Step 1:** Hand the Task 4 script to Cowork (or run narrated fallback per Task 0). Walk every screen with the owner.
- [ ] **Step 2:** Capture verbatim reactions + the 2-second-scan timing per screen. Tag each to the `H-*` its prompt named.
- [ ] **Step 3: Verify** — every screen in Task 4's enumeration has at least one captured reaction line. Stage.

### Task 7: Static evidence (subagents read rendering code)

**Files:** Create `docs/superpowers/findings/2026-05-18-evidence-static.md`

- [ ] **Step 1:** Dispatch parallel `Explore` subagents (one per feature area: game-detail, meta-dashboard, agenda, home, compare, shared) to read the rendering code and report: hardcoded hex/px (token bypass), sub-floor font sizes, mono used for non-tabular labels, per-section layout/spacing divergence. Prompt each subagent with the relevant `H-TY*`/`H-DV*` heuristics so reports are heuristic-anchored.
- [ ] **Step 2:** Fold in `app/lighthouse-*.json` (the four files) and the `a23e486` a11y commit — record what is ALREADY fixed so the ledger doesn't re-raise resolved items.
- [ ] **Step 3:** Each finding line: `file:line · H-* · observation · severity`.
- [ ] **Step 4: Verify** — `Grep pattern="\.tsx?:[0-9]" path=".../2026-05-18-evidence-static.md" output_mode=count` ≥ 15 (concrete file:line evidence, not generalities). Stage.

### Task 8: Architecture-track evidence (parallel subagent)

**Files:** Create `docs/superpowers/findings/2026-05-18-evidence-architecture.md`

- [ ] **Step 1:** Dispatch a `general-purpose` subagent to: build the front-end module dependency sketch (features → shared → lib → adapters), measure per-feature/per-file line counts (`Glob` + read), and identify god-files, tangled boundaries, cross-feature reach-ins, and token-bypass clusters. Anchor to `H-ARCH*`.
- [ ] **Step 2:** Produce a ranked "largest / most-tangled files" table with current LOC — this is the empirical input to the §4.2 code-ceiling number.
- [ ] **Step 3: Verify** — table present with ≥ 10 files and LOC numbers; every issue tagged `H-ARCH*`. Stage.

- [ ] **Stage 1 evidence commit gate (after 5–8; Task 6 may lag):** Present evidence summary to owner. Request explicit authorization to commit gathered evidence. On approval, commit. If Task 6 is not yet done, commit 5/7/8 and note Task 6 pending.

---

## Task 9: Stage 1 — assemble the Findings Ledger (Deliverable 3)

**Files:** Create `docs/superpowers/findings/2026-05-18-findings-ledger.md`

- [ ] **Step 1:** Merge evidence from Tasks 5–8 into one table: `| Finding ID (F-nn) | Heuristic (H-*) | Evidence (file:line / measurement / quote) | Track (design/arch) | Severity |`.
- [ ] **Step 2:** De-duplicate (same root issue seen by measured + felt + static = one finding, multiple evidence cells). Sort by severity.
- [ ] **Step 3: Verify (spec §6: no orphan findings):** `Grep pattern="^\| F-[0-9]" output_mode=count` gives the finding count. Confirm every row has a non-empty `H-*` cell — `Grep pattern="\| F-[0-9].*\| H-(TY|DV|RS|A11Y|ARCH)[0-9]" output_mode=count` must equal the finding count. Any finding not mapped to a heuristic is either mis-scoped or reveals a missing heuristic (add it to the canon + index, don't drop the finding).
- [ ] **Step 4:** Stage.

---

## Tasks 10–13: Stage 2 — the Target Foundation Blueprint (Deliverable 4)

**Files:** Create `docs/superpowers/specs/2026-05-18-target-foundation-blueprint.md` (built up across these tasks).

### Task 10: §4.1 Design System Spec — with the anti-pigeonhole gate FIRST

- [ ] **Step 1:** Before any category content, write the **"Why these categories, why this depth" rationale** section: for each candidate category in spec §4.1, state — load-bearing here? (yes/no) — driven by which Stage 0 banks + which ledger findings (cite `H-*` / `F-*`) — depth (deep/light/scoped-out). Typography deep-dive must be justified by ≥1 `F-*`, identically to every other category. This section is the §4.1 discipline gate; it is written and checked before category specs.
- [ ] **Step 2:** For each category marked load-bearing, write its spec: the rule(s), each citing `H-*` (why) + `F-*` (where), optionally `[INSP:<name>]` where an inspiration concretely exemplifies the target. A rule may NOT rest solely on a heuristic the owner downgraded to `(informational — not blueprint-binding)` in Task 3.5.
- [ ] **Step 3: Verify** — the rationale section exists and covers every spec §4.1 candidate category with an explicit yes/no + citation; no category silently dropped. `Grep pattern="scoped-out|load-bearing"` confirms each category has a verdict.

### Task 11: §4.2 Front-End Architecture Spec

- [ ] **Step 1:** Define the feature-module pattern: folder/boundary shape, how a feature consumes `lib/` + the frozen adapter, the props-as-interface contract for shared primitives.
- [ ] **Step 2:** Set the **per-feature code ceiling number** justified by the Task 8 LOC table (e.g. "Nth percentile of current well-bounded files; the 3 god-files exceed it by X"). Specify the enforcement: ESLint rule / CI check that fails the build past the ceiling.
- [ ] **Step 3:** Specify the token-enforcement lint rule (no raw hex/px outside the token file — the `PlanetControlSlideshow` finding becomes a rule).
- [ ] **Step 4: Verify** — the ceiling is a concrete number with a cited empirical basis (not "reasonable"); enforcement mechanism named.

### Task 12: §4.3 Conformance Map

- [ ] **Step 1:** Table: `| Finding (F-*) | Resolving rule (blueprint §) | Severity |` — one row per ledger finding.
- [ ] **Step 2: Verify (spec §6 hard gate):** every `F-*` from Task 9's ledger appears exactly once with a non-empty resolving-rule cell (no orphan findings); every blueprint rule introduced in Tasks 10–11 appears as a resolver for ≥1 finding (no uncited rules — a rule resolving nothing is generic and must be cut or justified). Cross-count with Grep against the ledger.

### Task 13: §4.4 Remediation Sequence (high-level only)

- [ ] **Step 1:** Ordered, strangler-style outline: which section migrates onto the foundation first (recommend: lowest-risk + highest-pain from the ledger), the "tests stay green" rule, the rough phase boundaries. **No task-level detail** — that is a downstream plan.
- [ ] **Step 2: Verify** — the sequence is an ordering of sections/phases, contains zero file-level steps (scope guard against doing remediation here).

---

## Task 14: Stage 2 — Roadmap Reshape Note (Deliverable 5) + final acceptance

**Files:** Create `docs/superpowers/specs/2026-05-18-roadmap-reshape-note.md`

- [ ] **Step 1:** Write the proposed ROADMAP.md diff *as a note* (not editing ROADMAP.md): a new "Foundation Remediation" section to be prepended ahead of V1.3b; V1.3b/c (player attribution, sharing, DS/TE audit, CSV, Lighthouse) explicitly repositioned as "resumes after foundation lands." State it is a proposal, applied only when acted on.
- [ ] **Step 2: Final acceptance check against spec §6** — walk each §6 bullet, tick it against an artifact:
  - every Stage 0 bank → cited heuristics (Task 3 gate) ✔
  - every blueprint rule → `H-*` source + `F-*` evidence; conformance map no orphans/uncited (Task 12 gate) ✔
  - §4.1 rationale present (Task 10 gate) ✔
  - instruments confirmed or fallback recorded (Task 0) ✔
  - execution NOT included (Task 13 scope guard) ✔
- [ ] **Step 3:** Assemble the blueprint doc front-matter linking §4.1–4.4 + ledger + canon so it reads as one approvable artifact.
- [ ] **Step 4: Stage 2 commit gate + owner approval** — present the full blueprint. Request (a) blueprint approval and (b) explicit free-text commit authorization. On approval: commit all Stage 2 docs + the originally-staged design spec together; `git push origin main:master` only if owner directs.
- [ ] **Step 5: Handoff** — the review is complete at owner blueprint approval. The remediation is a *new* brainstorm→spec→plan cycle seeded by Deliverables 4 + 5. State this explicitly; do not begin remediation.

---

## Self-Review

**1. Spec coverage:**
- §1 problem statement → framed in plan goal/architecture ✔
- §2 scope/frozen/deferred → Task 13 scope guard, Task 0 instrument handling, non-goals enforced in Task 14 acceptance ✔
- §2 dependencies/fallback → Task 0 ✔
- §3 Stage 0/1/2 → Tasks 1–3 / 4–9 / 10–14 ✔
- §4.1 anti-pigeonhole rationale gate → Task 10 Step 1 (explicitly first) ✔
- §4.2/4.3/4.4 → Tasks 11/12/13 ✔
- §5 five deliverables → Task 4 (D2), Task 9 (D3), Tasks 10–13 (D4), Task 14 (D5); D1 = Tasks 1–3 ✔
- §6 acceptance → Task 14 Step 2 explicit walk ✔
- §7 non-goals → Task 13 scope guard + Task 14 "do not begin remediation" ✔
- §8 risks → instrument fallback (Task 0), pigeonhole gate (Task 10), enforced-not-just-diagnosed (Tasks 11–12 CI/lint + conformance), scope creep (Task 13), generic-canon (every evidence task is heuristic-anchored) ✔

**2. Placeholder scan:** No "TBD/TODO/handle appropriately". The one intentionally-derived value (code-ceiling number) has an explicit derivation method + verification in Task 11, not a placeholder.

**3. Type/ID consistency:** Heuristic IDs `H-<bank><nn>` (banks TY/DV/RS/A11Y/ARCH) and finding IDs `F-nn` are defined once in the header and used consistently in Tasks 2–14. Conformance map (Task 12) cross-references both against their source tables via Grep counts.

**Gap found & fixed inline:** Deliverable 1 (Research Canon) was not called out as a numbered deliverable in any task title — added explicit note in self-review §5 mapping D1 → Tasks 1–3 and the canon file is in the File Structure table.

**Post-approval amendment (owner notes, 2026-05-18):** two gaps the owner caught after plan approval, fixed inline:
- *Source vetting* — citations were counted but not vetted. Added the Source-Tier Rubric (header), tier-tag requirement + `⚠ adjudicate` auto-flag (Task 2 contract + verification), and **Task 3.5** independent-verifier + owner-adjudication gate, which now owns the Stage 0 commit (Task 3 Step 4 no longer commits). Blueprint rules cannot rest solely on owner-downgraded heuristics (Task 10 Step 2, enforced at Task 12).
- *Inspirations* — no exemplar capture existed. Added **Task 0.5** owner-seeded Inspirations Register, wired into Banks A/B/C (`[INSP:<name>]`) and Task 10 rationale; research may only *propose* additions for owner ruling at Task 3.5. Type/ID consistency re-checked: `[INSP:<name>]`, `(T1|T2|T3)`, `⚠ adjudicate`, and `(informational — not blueprint-binding)` are defined once in the header/Task 3.5 and used consistently in Tasks 2, 10, 12.
