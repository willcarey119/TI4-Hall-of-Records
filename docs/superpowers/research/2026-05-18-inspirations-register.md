# Inspirations Register — Front-End Foundation Review

**Date:** 2026-05-18
**Status:** Owner-seeded (Task 0.5). Locked except the `Proposed by research` section.
**Role:** Stage 0 input. Banks A/B/C MUST read this and reference an exemplar inline as `[INSP:<name>]` where it concretely demonstrates a heuristic. Task 10's design-system rationale may cite an inspiration alongside `H-*`/`F-*`.

**Discovery method (owner, reusable):** owner sourced these by browsing **Webby Award winners** and keeping the ones that *"looked close to what we're doing."* The research-proposes path (below) should reuse this filter — proximity to a faction-first, data-dense, editorial analytics surface — not a generic "good design" trawl.

---

## Owner Seeds (locked)

### INSP:FiveThirtyEight-OldSchool — #1 PRIMARY · Nate Silver–era 538 (≈2014–2022)
**What:** The original FiveThirtyEight as the owner knew it — model-driven sports & elections analytics with strong editorial narrative. **Largely shut down / gutted as known; the current `fivethirtyeight.com` (ABC/Disney era) is NOT this inspiration.**
**Why admired:** The closest conceptual sibling to this project. Team/faction-first analytics, probabilistic/model output made *legible and trustworthy to non-experts* through editorial prose, recurring stat surfaces that stayed consistent across very different sports/topics.
**Clusters:** product-thesis sibling · stat-legibility-for-non-experts · model+narrative fusion · recurring consistent stat surfaces
**Bears on banks:** DV, TY, ARCH
**Why it's #1:** It is not just a style reference — it is *what TI4 Hall of Records fundamentally is* (faction-first, model/stat-driven, editorial explanation for a non-expert playgroup). When a design question is contested, "what would old-538 do for a faction the way it did for a team?" is the highest-signal tiebreaker in this register.
**BINDING SOURCING RULE (on Banks A/B/C and the Task 3.5 verifier):** old-538 heuristics must be sourced from **archives (e.g. Wayback Machine snapshots 2016–2021), design retrospectives/post-mortems, or the owner's stated memory** — never the current live site. A citation pointing at the present-day fivethirtyeight.com does **not** support an old-538 heuristic and the independent verifier must mark any such citation `support=N`.

### INSP:OurWorldInData — ourworldindata.org
**What:** Public data-explorer / analytical publication. Scales from large multi-chart dashboards down to a single focused chart view.
**Why admired:** *Coherence at scale.* One design system holds up across wildly heterogeneous datasets and view types without ever feeling bolted-together. Big-dashboard → single-view transitions stay consistent.
**Clusters:** system coherence · component contracts · scale-invariant layout
**Bears on banks:** TY, DV, ARCH
**Why it matters here:** This is the direct antidote to the owner's #2 felt symptom (section-to-section inconsistency). It is the *positive proof* that a single enforced system can absorb heterogeneity — exactly the blueprint thesis. Treat as the primary coherence exemplar.

Sub-note: "Grapher" (its embeddable chart engine) is the concrete coherence mechanism referenced by H-RS proposals.

### INSP:ReutersGraphics — reuters.com/graphics
**What:** Editorial data-journalism graphics desk. Long-form pieces fusing statistics, custom visualization, and supporting prose.
**Why admired:** *Imaginative fusion of statistics + conveyance + prose.* The numbers, the chart, and the narrative are one composition, not a chart with a caption.
**Clusters:** editorial dataviz · prose+stat fusion · narrative sequencing
**Bears on banks:** DV, TY
**Why it matters here:** This is the kept newspaper/almanac vibe executed at the highest level. It is the *target* the retained aesthetic is aiming at — proof the editorial direction is right and a reference for what "great" looks like in that register. Primary editorial-dataviz exemplar.

### INSP:ThePudding — pudding.cool
**What:** Visual-essay studio; very wide range of bespoke interactive data stories.
**Why admired:** Breadth of technique and imaginative data presentation. Surfaced during the owner's Webby search.
**Clusters:** technique range · idea bank
**Bears on banks:** DV
**Why it matters here / guard rail:** Use as an **idea bank for individual technique inspiration ONLY**. Explicitly **NOT** a coherence model — its strength is per-story bespoke design, which is the *opposite* of the system-consistency goal. Banks must not cite it as support for any system/consistency heuristic; doing so would pull the blueprint toward the bespoke-per-screen trap this review exists to fix.

### INSP:ONS-DataViz — UK Office for National Statistics Data Visualisation Service Manual
**What:** Government-published, publicly auditable design system for charts with explicit pixel specs (gridline weights, legend icon sizes, label casing rules, element-by-element size table). Grounded in UK public accessibility law.
**Why admired:** Exemplifies the "coherent type system across heterogeneous chart types" goal better than most blog references. The most complete public practitioner spec combining accessibility compliance with concrete chart typography minima.
**Clusters:** system coherence · chart typography · direct-label preferred · public accessibility standard
**Bears on banks:** TY, DV
**Status: promoted by owner ruling 2026-05-18**

### INSP:Datawrapper — Datawrapper Blog (Lisa Charlotte Muth)
**What:** Datawrapper's editorial blog — the clearest published practitioner authority on font selection and color decisions for data visualization, with named authorship and traceable publication dates.
**Why admired:** Its 14px default / 12px floor recommendation is the most-cited specific pixel value in the field. Bridges perception science and practitioner reality at a T2 level of rigor.
**Clusters:** chart typography · color palette decisions · font selection for data viz
**Bears on banks:** TY, DV
**Status: promoted by owner ruling 2026-05-18**

---

## Cluster Index

| Cluster | Exemplars | Primary banks |
|---|---|---|
| Product-thesis sibling (highest-signal tiebreaker) | FiveThirtyEight-OldSchool | DV, TY, ARCH |
| Stat-legibility for non-experts | FiveThirtyEight-OldSchool | DV, TY |
| Model + narrative fusion | FiveThirtyEight-OldSchool, ReutersGraphics | DV |
| System coherence / scale-invariance | OurWorldInData | TY, ARCH |
| Component contracts | OurWorldInData | ARCH, TY |
| Editorial dataviz / prose+stat fusion | ReutersGraphics | DV, TY |
| Narrative sequencing | ReutersGraphics | DV |
| Technique range (idea bank, non-system) | ThePudding | DV |
| Chart typography / font minima | ONS-DataViz, Datawrapper | TY, DV |
| Color palette decisions | Datawrapper | DV |
| Public accessibility standard | ONS-DataViz | TY, DV |

---

## Proposed by research (awaiting owner ruling)

> Stage 0 Banks A/B/C may append candidate exemplars here ONLY — with a one-line *what*, *why*, cluster, and bank. They never edit the owner seeds above. The owner adjudicates every entry here at the Task 3.5 gate (keep / cut / promote to a locked seed). Until ruled, a `proposed` exemplar may be discussed in a bank but may not be the sole `[INSP]` support for a heuristic.

- **[INSP:NNg-NewYorker]** — The New Yorker's sticky header as documented in the NN/g study (13:1 content-to-chrome ratio on iPhone 11 Pro) is a concrete real-world reference point for an acceptable mobile sticky header budget. Cluster: responsive/sticky patterns. Banks: RS. — PARKED: not promoted (owner to rule at a later gate)
