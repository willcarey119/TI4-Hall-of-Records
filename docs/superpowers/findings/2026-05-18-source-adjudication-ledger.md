# Source Adjudication Ledger — Consolidated (Task 3.5)

**Date:** 2026-05-18
**Status:** Awaiting OWNER ADJUDICATION (Task 3.5 Step 4 — blocking gate). No Stage 0 commit until rulings recorded + explicit commit authorization.

**Verifiers:** two independent subagents (authored no bank), opus. Per-heuristic detail:
- Banks A/B/C → `2026-05-18-source-adjudication-ledger-ABC.md` (36 rows)
- Banks D/E → `2026-05-18-source-adjudication-ledger-DE.md` (19 rows)

## Summary
- **Verified:** 55 / 55 (no skips — Grep-confirmed 36 + 19).
- **CLEAR:** 37 — usable as blueprint-binding.
- **⚠ adjudicate:** 18 — owner ruling required (worklist below).

## ⚠ Worklist — 18 items grouped by problem type, with recommended disposition

**Recommended disposition legend:** `DOWNGRADE` = keep as `(informational — not blueprint-binding)` (idea may still inform design but cannot be the sole resolver of a finding in Task 12). `CORRECT` = fix the heuristic/citation to match what the source actually says. `RE-SOURCE` = keep only if a real T1/T2 source is found; else cut. `CUT` = remove. `FIX-CITATION` = mechanical URL/source correction, rule stands.

### Group 1 — Rule plausible but citation does not support it (recommend DOWNGRADE)
| Heuristic | Verifier reason | Rec |
|---|---|---|
| H-TY07 | sole source is a fonts article, no 4px-grid content | DOWNGRADE |
| H-DV03 | 5–7 hue max not stated by cited sources (S2 stub, S6 silent) | DOWNGRADE |
| H-DV05 | sequential-for-rank not substantiated by cited sources | DOWNGRADE |
| H-DV08 | slope-chart-for-two-states rule not on cited pages | DOWNGRADE |
| H-DV12 | S8 is about annotation density, not standalone-stat legibility | DOWNGRADE |
| H-DV13 | equal-weight faction-color rule not stated by sole source | DOWNGRADE |
| H-RS09 | clamp() em-anchor / 2.5× rule not in cited sources | DOWNGRADE |
| H-A11Y06 | `scope` is a *sufficient technique*, not a normative MUST | DOWNGRADE (rule still good practice) |

### Group 2 — Threshold is the bank's own inference, not cited (recommend DOWNGRADE; keep number as a *default to validate in Stage 1*)
| Heuristic | Verifier reason | Rec |
|---|---|---|
| H-TY05 | ≤1.25 type-scale cap is inference | DOWNGRADE |
| H-DV09 | 20–24px treemap label floor is canon's own calc | DOWNGRADE |
| H-DV14 | √n + 5–15 bins no T1/T2 backing (pre-flagged, confirmed) | DOWNGRADE |
| H-ARCH06 | `max-lines` mechanism is T1-solid, but "200–300" specific ceiling is inference (source says 100–500) | KEEP mechanism, DOWNGRADE the specific number → Task 11 sets the ceiling from real LOC data anyway |

### Group 3 — Source actively contradicts or wrong rule cited (recommend CORRECT — do NOT keep as-is)
| Heuristic | Verifier reason | Rec |
|---|---|---|
| H-TY06 | cited S6 says **1.2×** line-height — contradicts the heuristic's 1.4× claim | CORRECT: re-source against WCAG 1.4.8 / a real type authority, or restate to the supported value |
| H-A11Y07 | "exactly one `<main>`/one `<nav>`" is not in SC 1.3.1 (it's an ARIA/HTML-AAM rule) | CORRECT: re-cite to ARIA landmark guidance; rule itself is valid |
| H-RS07 | MDN never says sticky *requires* `will-change:transform` | CORRECT: restate as optional perf hint, not a requirement |
| H-ARCH07 | cited T1 (`no-restricted-imports`) is the WRONG rule (bans paths, not style literals); only on-point source is T3 partial → **tier tag dishonest** | CORRECT/RE-SOURCE: blueprint §4.2 token-enforcement must find a correct mechanism (Bank E notes list candidates); downgrade until then |

### Group 4 — Mechanically fixable (recommend FIX-CITATION, rule stands)
| Heuristic | Verifier reason | Rec |
|---|---|---|
| H-A11Y09 | cited WCAG 2.1 URL 404s; correct content verified at the WCAG **2.2** path | FIX-CITATION (trivial; not really a judgement call) |

### Group 5 — Rubric violation (recommend CUT or RE-SOURCE)
| Heuristic | Verifier reason | Rec |
|---|---|---|
| H-ARCH04 | sole source is a T3 personal blog (rubric forbids T3-only) and only partially on-point | RE-SOURCE (React docs may support "one component per .tsx") or CUT |

## Structural concerns (owner should weigh — bigger than individual rows)

1. **Bank B is materially weaker than its tier tags.** S2 (`scholars.unh.edu` — a bibliographic metadata stub for Ware) and S3 (an Amazon product page for Few) are non-substantive URLs standing behind **8 of 14 H-DV heuristics**. The H-DV ⚠ cluster largely traces to this. Options: (a) accept the DOWNGRADEs above and let Stage 1 evidence + the *valid* H-DV sources carry the dataviz blueprint; (b) commission a targeted Bank-B re-source micro-task before Stage 0 closes; (c) accept as-is with the downgrades. **Recommend (a)** — the CLEAR H-DV items (e.g. H-DV01/02/04/11) plus Stage 1 measured evidence are enough; a re-source pass is better spent in Stage 2 if a downgraded rule turns out load-bearing.

2. **Bank D framing.** Three cited criteria are WCAG **Level A** (SC 1.4.1, 1.3.1, 4.1.2), not AA. No heuristic falsely *asserts* AA, but the bank is titled "WCAG AA". Recommend a one-line canon note: "includes foundational Level-A criteria; AA is the conformance target, not the floor of every cited SC." No heuristic cut needed.

3. **[INSP:FiveThirtyEight-OldSchool] verdict.** H-DV04 & H-DV11 = **validly** old-538-sourced (via the reverse-engineered Dataquest/matplotlib style artifact; live `fivethirtyeight.com` confirmed avoided — it 301s to abcnews). H-TY03, H-TY05, H-DV01 = INSP tag is **directional only** (Wayback unreachable this session; canon already labels them so). These are `[INSP]` signals, not `[S<n>]` sources — they do not gate any heuristic's source-validity. Recommend: accept directional 538 tags as inspiration signal; if Stage 2 leans on a 538-specific rule, archival re-sourcing is required at that point.

## Proposed inspirations — also need owner ruling (Task 3.5 Step 4)
From Banks A/B/C `Proposed inspirations` (6 total): `[INSP:ONS-DataViz]` (A), `[INSP:Datawrapper]` (A), `[INSP:ONS-DataViz]` + `[INSP:Datawrapper-Blog]` (B, overlaps A), `[INSP:OurWorldInData-Grapher]` (C — refinement of existing seed), `[INSP:NNg-NewYorker]` (C). Recommend: accept ONS-DataViz + Datawrapper (both T1/T2-grade dataviz authorities, on-thesis); treat OWID-Grapher as a sub-note of the existing OWID seed; owner rules on NNg-NewYorker.

---

## OWNER RULINGS (filled at the gate — Task 3.5 Step 4)

OWNER (2026-05-18): Accept recommended dispositions for all 18 ⚠ (12 downgrade-to-informational incl. H-ARCH06 number-only; 4 correct/re-cite — H-TY06 superseded-by-H-TY09, H-RS07 reworded, H-A11Y07 re-cite-or-info, H-ARCH07 info+Stage2-flag; H-A11Y09 cite-fixed to WCAG22; H-ARCH04 re-source-or-info). Accept Bank-B downgrades & proceed (no re-source micro-task). Accept inspiration recs: ONS-DataViz + Datawrapper promoted; OWID-Grapher folded into OWID; 538 directional tags accepted as inspiration signal (archival re-source only if a Stage 2 rule leans on a 538-specific behavior); NNg-NewYorker parked.

## Stage 0 close-out (Task 3.5 Step 6 — after rulings)
- Apply rulings to `2026-05-18-research-canon.md` (downgrades tagged `(informational — not blueprint-binding)`; corrections; citation fixes).
- Then request explicit free-text commit authorization.
