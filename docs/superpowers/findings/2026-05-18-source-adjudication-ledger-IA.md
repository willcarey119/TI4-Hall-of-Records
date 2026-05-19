# Source Adjudication Ledger — Bank IA (independent verifier)

Independent re-verification of `2026-05-18-research-bank-IA.md`. Every cited source URL was fetched fresh; bank reasoning was not trusted. 14 heuristics, 13 sources (S1–S13).

| Heuristic | Cited sources | Reachable? | Supports? (Y/partial/N) | Tier honest? | Class | Verifier note |
|---|---|---|---|---|---|---|
| H-IA01 | S1 | Y | Y | Y | CLEAR | W3C Understanding 1.4.10 confirms 320 CSS px vertical-scroll threshold, two-dimensional-scroll prohibition, Level AA, and exceptions for data tables/maps/video/code. Matches heuristic as worded. |
| H-IA02 | S2 | Y | Y | Y | CLEAR | W3C Understanding 2.4.1, Level A, requires a mechanism to bypass repeated blocks; explicitly lists skip links, ARIA landmarks, and heading elements as sufficient techniques. |
| H-IA03 | S3 | Y | Y | Y | CLEAR | W3C Understanding 2.4.5, Level AA: "More than one way is available to locate a web page within a set." Heuristic's "≥2 navigation paths" is faithful; process-step exception noted in source not contradicted. |
| H-IA04 | S4 | Y | Y | Y | CLEAR | W3C Understanding 2.4.6, Level AA: "Headings and labels describe topic or purpose." Directly supports heuristic. |
| H-IA05 | S5, S6 | Y | Y | Y | CLEAR | S5 (Nielsen, 57,453 fixations) states exactly 80.3% above-fold viewing time; S6 (Schade) corroborates engagement asymmetry. Numeric claim matches source verbatim. Both T2 (named NNg authors). |
| H-IA06 | S6, S10 | Y | Y | Y | CLEAR | S6 states above-fold content drives scroll decisions ("what is visible... encourages us to scroll"; "false floor"); S10 corroborates upfront overview signaling. Supports heuristic as worded. |
| H-IA07 | S10 | Y | partial | Y | ⚠ adjudicate | S10 supports TOC-at-top for long-form content and cautions against short pages — the *principle* is solid and T2. But the specific "~3 viewport-heights" trigger threshold is NOT in S10; it is bank inference (bank Notes §2 admits this). Threshold is bank inference, principle sourced. |
| H-IA08 | S11 | Y | Y | Y | CLEAR | S11 (Budiu, information scent) confirms link label is the primary scent signal and that poor scent causes users to abandon/overlook content. Directly supports heuristic. |
| H-IA09 | S12 | Y | Y | Y | CLEAR | Baymard/Holst states "at least 6 ... lower limit" and "up to 10 before truncating"; both bounds in the heuristic (show ≥6, ≤10) are stated verbatim in source, plus the never-truncate-1 rule. T2 honest (recognized research firm, named author). |
| H-IA10 | S8, S9, S12 | Y | Y | Y | CLEAR | S9 (progressive disclosure) and S8 (accordions) support truncation only for supplementary depth; S12 supports the mistake-for-complete-list harm. Convergent T2 support for heuristic as worded. |
| H-IA11 | S8, S9 | Y | Y | Y | CLEAR | S8 explicitly lists avoidance criteria: comprehensive-content-access, deep hierarchy, continuous reading flow, and cross-section comparison. S9 supports the interdependent-info caution. Matches heuristic precisely. |
| H-IA12 | S1, S7 | Y | partial | Y | ⚠ adjudicate | Pre-flagged by bank. Confirmed: neither S1 (reflow, no chart-container ratio) nor S7 (pagination alternatives) states any ~2× chart-to-container bound. The 2× ratio is pure engineering inference extended from WCAG 1.4.10 + attention decay. No T1/T2 states a defensible numeric bound; principle (over-tall charts impede comprehension) is reasoned, not sourced. |
| H-IA13 | S5, S10, S13 | Y | partial | Y (S13 honestly T3) | ⚠ adjudicate | S5/S10 (T2) support orientation cues / TOC for long content generally, and S13 honestly tagged T3 (GoodData/Kocián — verified author is Václav Kocián, corroborating only). But the specific "~3 viewport-heights" trigger is bank inference (bank Notes §2 admits); no cited source states a viewport-count threshold. Threshold is bank inference, principle sourced. |
| H-IA14 | S7 | Y | Y | Y | CLEAR | S7 (Moran, NNg) recommends displaying running totals ("Viewing 40 of 333"; Lululemon "how many products... out of the total") and warns blind loading deters users. Directly supports heuristic. T2 honest. |

## Summary

- **Total verified:** 14 / 14 (no skips). All 13 sources (S1–S13) fetched fresh; all reachable; none hallucinated, none redirected to unrelated content.
- **CLEAR:** 11 (H-IA01, H-IA02, H-IA03, H-IA04, H-IA05, H-IA06, H-IA08, H-IA09, H-IA10, H-IA11, H-IA14)
- **⚠ adjudicate:** 3
  - **H-IA07** — "~3 viewport-heights warrants a TOC" trigger is bank inference; S10 supports the TOC principle for long-form content but states no viewport-count threshold. Principle sourced, threshold not.
  - **H-IA12** — pre-flagged; confirmed no cited (or any T1/T2) source states the ~2× chart-to-container ratio. Pure engineering inference from WCAG 1.4.10 + NNg attention decay. Validate via usability testing before treating as a hard gate.
  - **H-IA13** — "~3 viewport-heights" trigger is bank inference (same as H-IA07); the orientation-cue principle is T2-sourced (S5, S10). S13 is honestly labeled T3 and is non-sole.
- **Hallucinated / unreachable sources:** None. All 13 URLs resolved to the exact articles claimed.
- **Misrepresented / tier-inflated sources:** None. All numeric claims spot-checked against source text matched verbatim (S5 = 80.3%, S6 = 84%, S12 = 6 lower / 10 upper bounds). S13's T3 tag is honest and the bank correctly avoids using it as sole support. NNg/Baymard T2 tags are legitimate (named authors / recognized research firm, articles exist and state the claims).

**Verifier conclusion:** The bank is well-sourced. The only weaknesses are the two reasoned-not-stated viewport-count thresholds (H-IA07, H-IA13) and the pre-flagged chart-ratio inference (H-IA12) — all three are inferences layered on legitimately sourced principles, and the bank itself discloses each in its Notes/Concerns. No dishonest tier tags, no fabricated or unreachable sources.

## OWNER RULINGS

OWNER (2026-05-18): Accept recommended — H-IA07/H-IA12/H-IA13 principle binding, specific number informational; 11 CLEAR confirmed.
