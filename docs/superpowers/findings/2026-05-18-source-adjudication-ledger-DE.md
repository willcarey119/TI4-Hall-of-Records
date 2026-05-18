# Source Adjudication Ledger — Banks D/E (independent verifier)

Scope: every heuristic in H-A11Y01–10 (Bank D) and H-ARCH01–09 (Bank E). All cited URLs WebFetched fresh this session. No prior context trusted; bank reasoning re-checked adversarially.

| Heuristic | Cited sources | Reachable? | Supports? (Y/partial/N) | Tier honest? | Class | Verifier note |
|---|---|---|---|---|---|---|
| H-A11Y01 | S1 | Y | Y | Y | CLEAR | SC 1.4.3 (Level AA) explicitly states 4.5:1 for normal text. T1 honest (W3C). "No rounding" is a reasonable strictness gloss, not contradicted. |
| H-A11Y02 | S1 | Y | Y | Y | CLEAR | SC 1.4.3 states 3:1 for large text, defined as 18pt / 14pt bold. Matches heuristic wording. Level AA. T1 honest. |
| H-A11Y03 | S2 | Y | Y | Y | CLEAR | SC 1.4.11 Non-text Contrast (Level AA) requires 3:1 for UI component visual indicators incl. focus/borders/affordances. Directly supports. T1 honest. |
| H-A11Y04 | S3 | Y | Y | Y | CLEAR | SC 1.4.1 Use of Color prohibits color as sole channel; requires supplementary visual means. Supports as worded. NOTE: SC 1.4.1 is Level **A**, not AA — heuristic does not claim AA explicitly so no false-AA claim, but see AA/AAA flags. T1 honest. |
| H-A11Y05 | S4 | Y | Y | Y | CLEAR | SC 1.4.10 Reflow (Level AA): 320 CSS px, no 2D scroll, explicit 2D-content exception (tables/maps). Matches heuristic incl. chart-grid exception. T1 honest. |
| H-A11Y06 | S5 | Y | partial | Y | ⚠ adjudicate | SC 1.3.1 (Level **A**) covers table scope as a *sufficient technique*, not a normative MUST; "absence of scope is a named WCAG failure" overstates — scope is one of several techniques (id/headers also valid). Supports the relationship requirement but not the specific "scope on every th or it fails" wording. T1 honest. |
| H-A11Y07 | S5 | Y | partial | Y | ⚠ adjudicate | SC 1.3.1 covers landmark relationships generically but does NOT mandate "exactly one `<main>`, one `<nav>`". The one-main rule is an ARIA/HTML-AAM authoring constraint, not stated in 1.3.1. Source does not support the heuristic as worded (the numeric "exactly one" claim is uncited). T1 honest but off-target. |
| H-A11Y08 | S6 | Y | Y | Y | CLEAR | SC 4.1.2 Name, Role, Value requires custom components expose role/name/state programmatically; explicitly recommends ARIA role + state for custom controls. Supports as worded. Level A (not AA — see flags). T1 honest. |
| H-A11Y09 | S7 | N | Y (content) | Y | ⚠ adjudicate | Cited URL `w3.org/WAI/WCAG21/Understanding/target-size-minimum.html` returns **HTTP 404**. SC 2.5.8 is a WCAG **2.2** criterion; correct URL is the WCAG22 path (verified separately: 24×24, spacing-circle, Level AA — content is accurate). As-cited source is unreachable → not CLEAR until URL corrected to WCAG22. |
| H-A11Y10 | S8 | Y | Y | Y | CLEAR | SC 2.4.7 Focus Visible (Level AA) requires a visible keyboard focus indicator. Supports the heuristic incl. the outline:none-without-replacement framing. T1 honest. |
| H-ARCH01 | S2, S3, S5 | Y (all 3) | Y | Y | CLEAR | FSD Public API (S2, T2) + Steiger `fsd/no-public-api-sidestep` (S3, T2) + ESLint no-restricted-imports patterns (S5, T1) jointly support barrel-only access + lint enforcement. T1+T2 honest. |
| H-ARCH02 | S1, S3, S8 | Y (all 3) | Y | Y | CLEAR | FSD Layers (S1) unidirectional + isolation rule; Steiger `fsd/no-cross-imports` (S3); eslint-plugin-boundaries dependency graph (S8). All support no-sibling-import, downward flow. T2 honest. |
| H-ARCH03 | S6 | Y | Y | Y | CLEAR | Kent C. Dodds "Colocation" (T2, named practitioner): "place code as close to where it's relevant as possible"; move up only when shared. Directly supports. T2 honest. |
| H-ARCH04 | S7 | Y | partial | Y | ⚠ adjudicate | Jeremy Richardson blog confirmed **T3 personal blog** (bank tags it T3). Article recommends one component per file + mentions eslint-plugin-react-refresh, but per fetch does NOT explicitly state non-component exports force full reload nor "hooks in .ts files". Sole source is T3 → fails rubric (T3 never sole support). Tier honestly labeled T3 by bank. |
| H-ARCH05 | S6, S7, +react.dev | Y (all) | Y | Y | CLEAR | react.dev/learn/scaling-up-with-reducer-and-context (official T1) directly demonstrates context+reducer in dedicated file with custom hooks wrapping useContext; components import hooks not useContext. S6 (T2) supports colocation. T1-backed via the React docs URL → CLEAR despite S7 being T3. |
| H-ARCH06 | S4 | Y | partial | Y | ⚠ adjudicate | ESLint max-lines (T1) supports the *mechanism* and default 300 + skipBlankLines/skipComments. But page says recommendations range "100 to 500"; it does NOT endorse the heuristic's specific "200–300" ceiling. Mechanism CLEAR, the numeric threshold (200–300) is uncited bank inference. Tier honest. |
| H-ARCH07 | S5 (+Medium) | Y / Y | N | N | ⚠ adjudicate | Pre-flagged; confirmed & worsened. S5 is `no-restricted-imports` — bans IMPORT paths, NOT style-prop hex/px literals; wrong rule for this heuristic's mechanism (needs `no-restricted-syntax`/custom AST rule). Cited T1 does not support the heuristic. Medium corroboration is T3, covers only hex (not px), in RN StyleSheet context — partial + T3. No honest T1/T2 on-point support. Tier dishonest (T1 tag implies S5 backs it; it does not). |
| H-ARCH08 | S2, S3 | Y (both) | Y | Y | CLEAR | FSD Public API (S2, T2) explicitly labels `export *` "BAD CODE" and requires explicit named re-exports; Steiger (S3) enforces public-api. Supports as worded. T2 honest. |
| H-ARCH09 | S3, S8 | Y (both) | Y | Y | CLEAR | Steiger config (S3) + eslint-plugin-boundaries (S8) both declare boundary rules once in central config checked in CI. Supports as worded. T2 honest. |

## AA/AAA flags

- **Bank D presents itself as "WCAG AA / Accessibility" but two cited criteria are Level A, not AA:**
  - **H-A11Y04 / S3 (SC 1.4.1 Use of Color)** is **Level A** (verified on page). Not an AA criterion. Heuristic text does not assert AA, but the bank header and the canon's Master Index frame Bank D as AA-level. Flag: do not cite SC 1.4.1 as an "AA conformance floor."
  - **H-A11Y06 & H-A11Y07 / S5 (SC 1.3.1 Info and Relationships)** is **Level A**, not AA.
  - **H-A11Y08 / S6 (SC 4.1.2 Name, Role, Value)** is **Level A**, not AA.
  - None of these is an AAA-presented-as-AA error (the more dangerous direction); they are A-presented-within-an-AA-bank. SC 1.4.3, 1.4.11, 1.4.10, 2.4.7, 2.5.8 are correctly AA. SC 2.5.8 (H-A11Y09) is correctly AA but cited via a 404 WCAG21 URL (it is a WCAG 2.2 criterion).
- No heuristic cites an AAA criterion while implying AA in Banks D/E.

## Summary

- **Total verified:** 19 (H-A11Y01–10 = 10; H-ARCH01–09 = 9). No skips.
- **CLEAR:** 13 — H-A11Y01, H-A11Y02, H-A11Y03, H-A11Y04, H-A11Y05, H-A11Y08, H-A11Y10, H-ARCH01, H-ARCH02, H-ARCH03, H-ARCH05, H-ARCH08, H-ARCH09.
- **⚠ adjudicate:** 6
  - **H-A11Y06** — SC 1.3.1 makes `scope` a sufficient technique, not a normative MUST; "absence of scope = named failure" overstates the source.
  - **H-A11Y07** — SC 1.3.1 does not mandate "exactly one `<main>` / one `<nav>`"; the numeric landmark claim is uncited.
  - **H-A11Y09** — cited URL 404s (WCAG21 path for a WCAG 2.2 criterion); correct content exists at the WCAG22 URL. Unreachable as cited.
  - **H-ARCH04** — sole source is a T3 personal blog (bank-acknowledged T3); rubric forbids T3-only. Also partial: blog does not state the full claim per fetch.
  - **H-ARCH06** — `max-lines` (T1) supports the mechanism but not the specific 200–300 ceiling (page says 100–500); numeric threshold uncited.
  - **H-ARCH07** — pre-flagged, confirmed worse: cited T1 (`no-restricted-imports`) is the wrong rule (bans imports, not style literals); only on-point source is T3 + partial (hex only, RN context). Tier dishonest.

### Hallucinated / unreachable sources
- **H-A11Y09 S7:** `https://www.w3.org/WAI/WCAG21/Understanding/target-size-minimum.html` → HTTP 404. SC 2.5.8 is WCAG 2.2; the working URL is `https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html` (content verified accurate). Citation path is wrong/unreachable, not the criterion itself.
- No fully hallucinated (nonexistent) sources found in Banks D/E. All other URLs resolved and matched their described content.

### Tier-honesty issue
- **H-ARCH07** is the only tier-dishonesty case: the canon's Master Index tags it T1 (and the heuristic cites S5 as the support), but S5 (`no-restricted-imports`) does not support the heuristic's hex/px-literal mechanism. Effective honest tier for this heuristic is T3 (Medium, partial). The canon's own Concerns section + Master Index ⚠ flag partially acknowledge this; verifier confirms the T1 tag is not earned.
