# Stage 1 — Felt Evidence (Task 6, Cowork-guided walkthrough)

**Date:** 2026-05-18 · **Mode:** Cowork guided · **Script:** `docs/superpowers/specs/2026-05-18-cowork-walkthrough-script.md`
**Status:** SCAFFOLD — to be filled during the walkthrough. Ledger (`2026-05-18-findings-ledger.md`) is not final until these merge.

**How to fill:** one row per heuristic probe, pre-numbered F-F01…F-F42 with its block + heuristic fixed. Fill only **Reaction** (owner verbatim) and **Severity** (critical|major|minor|info). Do not renumber or change H-* IDs. The 2-sec-scan + open-capture per block go in the context section below the table. F-09 (mobile frozen-header %) MUST get a real measured number in F-F04/F-F05's reaction.

## Felt findings table

| F-F# | H-* | Block (screen) | Owner verbatim reaction | Severity |
|---|---|---|---|---|
| F-F01 | H-DV01 | B1 Home | | |
| F-F02 | H-TY08 | B1 Home | | |
| F-F03 | H-A11Y04 | B1 Home | | |
| F-F04 | H-RS03 | B1 Home (mobile resize — measure %) | | |
| F-F05 | H-RS03 | B2 FrozenHeader+Scrubber (mobile % — fills F-09) | | |
| F-F06 | H-A11Y09 | B2 FrozenHeader+Scrubber | | |
| F-F07 | H-A11Y10 | B2 FrozenHeader+Scrubber | | |
| F-F08 | H-RS06 | B2 FrozenHeader+Scrubber | | |
| F-F09 | H-DV12 | B3 Recap | | |
| F-F10 | H-TY03 | B3 Recap | | |
| F-F11 | H-A11Y07 | B3 Recap | | |
| F-F12 | H-DV04 | B4 VP Race | | |
| F-F13 | H-DV11 | B4 VP Race | | |
| F-F14 | H-TY02 | B4 VP Race | | |
| F-F15 | H-DV02 | B5 Timeline | | |
| F-F16 | H-A11Y04 | B5 Timeline | | |
| F-F17 | H-DV01 | B6 Dashboard | | |
| F-F18 | H-TY10 | B6 Dashboard | | |
| F-F19 | H-DV13 | B6 Dashboard | | |
| F-F20 | H-RS01 | B7 Planets | | |
| F-F21 | H-TY03 | B7 Planets | | |
| F-F22 | H-DV06 | B8 Tech | | |
| F-F23 | H-TY02 | B8 Tech | | |
| F-F24 | H-DV04 | B9 Agenda (game) | | |
| F-F25 | H-A11Y06 | B9 Agenda (game) | | |
| F-F26 | H-DV01 | B10 Meta·Factions | | |
| F-F27 | H-A11Y04 | B10 Meta·Factions | | |
| F-F28 | H-DV03 | B10 Meta·Factions | | |
| F-F29 | H-DV05 | B11 Meta·Strategy/Heatmap | | |
| F-F30 | H-DV07 | B11 Meta·Strategy/Heatmap | | |
| F-F31 | H-A11Y09 | B11 Meta·Strategy/Heatmap | | |
| F-F32 | H-TY02 | B11 Meta·Strategy/Heatmap | | |
| F-F33 | H-DV09 | B12 Meta·Techs | | |
| F-F34 | H-DV02 | B12 Meta·Techs | | |
| F-F35 | H-DV14 | B13 Meta·Stats | | |
| F-F36 | H-TY03 | B13 Meta·Stats | | |
| F-F37 | H-A11Y07 | B14 Senate Almanac | | |
| F-F38 | H-TY08 | B14 Senate Almanac | | |
| F-F39 | H-A11Y06 | B14 Senate Almanac | | |
| F-F40 | H-DV06 | B15 Compare | | |
| F-F41 | H-DV08 | B15 Compare | | |
| F-F42 | H-RS12 | B15 Compare | | |

## Per-block context (2-sec scan + open capture)

> Fill the two lines per block. These are context, not discrete findings — they sharpen severity calls and surface things the probes missed.

- **B1 Home** — 2-sec scan: ____ · Open: ____
- **B2 FrozenHeader+Scrubber** — 2-sec scan: ____ · Open: ____
- **B3 Recap** — 2-sec scan: ____ · Open: ____
- **B4 VP Race** — 2-sec scan: ____ · Open: ____
- **B5 Timeline** — 2-sec scan: ____ · Open: ____
- **B6 Dashboard** — 2-sec scan: ____ · Open: ____
- **B7 Planets** — 2-sec scan: ____ · Open: ____
- **B8 Tech** — 2-sec scan: ____ · Open: ____
- **B9 Agenda (game)** — 2-sec scan: ____ · Open: ____
- **B10 Meta·Factions** — 2-sec scan: ____ · Open: ____
- **B11 Meta·Strategy/Heatmap** — 2-sec scan: ____ · Open: ____
- **B12 Meta·Techs** — 2-sec scan: ____ · Open: ____
- **B13 Meta·Stats** — 2-sec scan: ____ · Open: ____
- **B14 Senate Almanac** — 2-sec scan: ____ · Open: ____
- **B15 Compare** — 2-sec scan: ____ · Open: ____

## Wrap-up synthesis (fill after all blocks)

1. **Most surprising find:** ____
2. **Most effortful moment:** ____
3. **Screens that felt genuinely solid:** ____

---
*Merge note (for the controller, not the walkthrough): on completion, F-F01–F-F42 fold into `2026-05-18-findings-ledger.md`; dedupe against existing F-nn where a felt finding corroborates a measured/static one (add as an evidence cell, don't double-count); net-new felt-only findings get new F-nn rows. Then Task 12 conformance map runs on the merged set.*
