# Architecture Evidence — Front-End Foundation Review

**Date:** 2026-05-18
**Scope:** `app/src/` excluding `adapters/` (frozen, out of scope).
**Method:** Glob + Grep + Read; no app code modified.

---

## Module dependency sketch

```
App.tsx
  └─ shared/AppHeader           ← nav, upload drawer, command palette
       ├─ adapters/AuthContext   (upward boundary violation — shared reaching into adapters)
       ├─ shared/index           (fine)
       └─ features/upload/UploadPage  ← CROSS-LAYER REACH-IN (shared → features)
  └─ shared/ErrorBoundary
  └─ adapters/AuthContext
  └─ features/* (lazy, via React.lazy)

features/*
  ├─ ../../shared          (via barrel index.ts — OK)
  ├─ ../../lib/**          (many deep bypasses, see below)
  └─ ../../adapters/AuthContext   (agenda, meta-dashboard pages)
  NO cross-feature imports detected (features do not import sibling features)

shared/
  ├─ adapters/AuthContext  (AppHeader.tsx — upward import)
  └─ features/upload/UploadPage  (AppHeader.tsx — layer violation)

lib/
  └─ self-contained; no React, no adapter imports (clean)

adapters/
  ├─ lib/parser/types (fine — downward)
  └─ self-contained otherwise
```

**Cross-feature reach-ins (one feature importing another feature's internals):**
- **1 found**: `shared/AppHeader.tsx:5` imports `features/upload/UploadPage` directly by path — bypasses the `upload/index.ts` barrel AND violates the layer rule (shared should not import features).

**Deep lib imports bypassing barrels:**
Many feature files import directly from internal `lib/` sub-paths (e.g. `../../lib/parser/types`, `../../lib/aggregator/deriveRoundBoundaries`, `../../lib/factions/factionBrandColors`) rather than going through a `lib/` barrel. The `lib/aggregator/index.ts` barrel exists and is used sometimes, but most imports go direct. No `lib/` top-level barrel exists. This is a widespread H-ARCH01 violation across `features/`.

**Barrel audit:**
- `shared/index.ts` — explicit named re-exports only. No `export *`. Clean (H-ARCH08 satisfied for shared).
- `features/*/index.ts` — all minimal (1–3 lines), explicit named exports. Clean for feature public API.
- `lib/aggregator/index.ts` — explicit named re-exports. Clean.
- **No top-level `lib/index.ts` barrel** — features reach into internal `lib/` paths directly (H-ARCH01 violation pattern).

---

## LOC distribution

**Total files measured:** 196 (`.ts` + `.tsx` including tests)

| Statistic | LOC |
|---|---|
| Median | 74 |
| P75 | 138 |
| Max | 1068 |

**Per-feature aggregate LOC (all files including tests):**

| Feature | Aggregate LOC | Notes |
|---|---|---|
| game-detail | 4,298 | Largest feature by far; 11+ section files + FrozenHeader |
| meta-dashboard | 2,469 | 7 section components + context + charts test |
| agenda | 1,595 | 6 components + AgendaPrimitives |
| upload | 766 | 4 components + 3 test files |
| home | 701 | 2 components + tests |
| compare | 682 | 2 pages + tests |
| not-found | 102 | Trivial |
| player-attribution | 94 | Hook only |

---

## Ranked files table

| # | file | LOC | role | concern |
|---|---|---|---|---|
| 1 | lib/parser/__tests__/gameReducer.test.ts | 1068 | test | Acceptable for a reducer test; not production code |
| 2 | lib/parser/gameReducer.ts | 953 | core reducer | God-file: single switch handles all 20+ action types; multiple exported interfaces + state + two functions |
| 3 | features/meta-dashboard/StatsSection.tsx | 656 | UI section | God-file: exports 3 helper functions + 1 component; raw hex inline |
| 4 | lib/aggregator/buildGameStats.ts | 611 | aggregator | Mixed responsibilities: 15+ exported interfaces + one 580-line function |
| 5 | features/game-detail/AgendaSection.tsx | 583 | UI section | God-file: ~500 lines of JSX with hardcoded hex colors throughout |
| 6 | features/game-detail/FactionSnapshotCards.tsx | 496 | UI section | Large component; hardcoded hex color map at top |
| 7 | lib/parser/__tests__/parseGame.test.ts | 479 | test | Acceptable test file size |
| 8 | features/agenda/PoliticalBarChart.tsx | 409 | chart | Hardcoded hex constants at file top; no token use |
| 9 | features/game-detail/MecatolWidget.tsx | 362 | widget | Hardcoded hex inline |
| 10 | lib/aggregator/buildGameStats.test.ts | 358 | test | Test size follows source god-file |
| 11 | features/game-detail/TechSection.tsx | 342 | UI section | Moderate; acceptable |
| 12 | lib/parser/agendas.ts | 336 | parser data | Large lookup table (agendas catalog); structural not logic |
| 13 | features/compare/ComparePage.tsx | 327 | page | Multiple concerns: chart + data fetch + layout |
| 14 | features/game-detail/PlanetControlSlideshow.tsx | 321 | UI section | Hardcoded hex cluster (8+ values inline in style props) |
| 15 | features/meta-dashboard/StrategyCardSection.tsx | 308 | UI section | Moderate; OK |
| 16 | features/game-detail/VpRaceSection.tsx | 283 | UI section | Moderate |
| 17 | features/game-detail/RecapSection.tsx | 273 | UI section | Moderate |
| 18 | lib/aggregator/buildFactionStats.test.ts | 271 | test | Acceptable |
| 19 | lib/aggregator/buildAgendaCrossGame.test.ts | 250 | test | Acceptable |
| 20 | features/upload/UploadPage.tsx | 249 | page | Moderate; near ceiling |

---

## God-files & tangled boundaries

### 1. `lib/parser/gameReducer.ts` — 953 LOC [H-ARCH06]

Single file responsible for: exported `ReducerState` interface (with ~20 sub-fields), `createInitialState()`, and `gameReducer()` — a 800-line switch that handles every action type in the game. As the parser grows to support new action types, this file grows with it. No sub-module extraction; no barrel. Exceeds a 300-line ceiling by 3×. Splitting by action-type group (e.g. `reducer/vpActions.ts`, `reducer/techActions.ts`) would bring each file under 200 lines.

**Tags: H-ARCH06** (per-file ceiling), **H-ARCH03** (colocation principle violated — all action handling in one monolith rather than colocated with action type).

### 2. `features/meta-dashboard/StatsSection.tsx` — 656 LOC [H-ARCH04, H-ARCH06, H-ARCH07]

A `.tsx` file that exports **four symbols**: `buildGameLengthHistogram()`, `buildFinalVpHistogram()`, `buildWinsByFaction()`, and `StatsSection` (the React component). The three helper functions are data transformation logic that belongs in `lib/`. They are also exported from the component file, making them reachable by deep imports. Raw hex `#e67e22` appears 3× inline in JSX style props.

**Tags: H-ARCH04** (tsx exports multiple symbols including non-components), **H-ARCH06** (2× ceiling), **H-ARCH07** (hardcoded hex in component).

### 3. `lib/aggregator/buildGameStats.ts` — 611 LOC [H-ARCH06]

Exports 15+ TypeScript interfaces (`MecatolStat`, `ActionTypeBreakdown`, `HeroActivation`, `RelicStat`, `AgendaStat`, `VpSourceStat`, `ComingFromBehindStat`, `ObjectiveTimingStat`, `VpDiversityStat`, `ImperialMecatolStats`, `Stage2Stat`, `ThresholdSegment`, `GameStatsSummary`) followed by a single 580-line `buildGameStats()` function. The interface definitions alone are ~100 lines; all 15 could move to a `types.ts` adjacent file. The function handles too many statistical concerns in sequence.

**Tags: H-ARCH06** (2× ceiling), **H-ARCH03** (interfaces not in types file).

### 4. `features/game-detail/AgendaSection.tsx` — 583 LOC [H-ARCH06, H-ARCH07]

One component with ~500 lines of JSX. Contains 12+ hardcoded hex literals inline in style objects (including constants `VOTE_FOR_BG`, `VOTE_AGAINST_BG` defined at file top and scattered throughout, plus ad hoc hex strings in JSX props). No design token use for these semantic colors. Duplicates the same `VOTE_FOR_BG`/`VOTE_AGAINST_BG` constants that appear independently in `features/agenda/PoliticalBarChart.tsx` — two files own the same semantic concept.

**Tags: H-ARCH06** (2× ceiling), **H-ARCH07** (hardcoded hex density — 12+ values), **H-ARCH03** (shared color semantics not lifted to a token).

### 5. `shared/AppHeader.tsx` — 174 LOC [H-ARCH02, H-ARCH01]

`shared/` must not import from `features/`. Line 5: `import { UploadPage } from '../features/upload/UploadPage'` — direct deep import bypassing the feature barrel AND violating the layer rule (shared → features is an upward import). `AppHeader` has also taken on the upload drawer concern, giving it two responsibilities: navigation chrome and upload workflow hosting.

**Tags: H-ARCH02** (shared imports a feature module), **H-ARCH01** (bypasses feature barrel).

### 6. `features/game-detail/PlanetControlSlideshow.tsx` — 321 LOC [H-ARCH07]

Eight hardcoded hex values scattered across inline style props (semantic colors for "gained", "lost", positive/negative net change). These are the same semantic green/red palette as `AgendaSection.tsx` but defined independently. No shared token.

**Tags: H-ARCH07** (hardcoded hex cluster), **H-ARCH03** (semantic colors not colocated in a shared token).

### 7. `features/agenda/PoliticalBarChart.tsx` — 409 LOC [H-ARCH07]

`VOTE_FOR` and `VOTE_AGAINST` hex constants defined at file top, duplicating the same semantic pair in `AgendaSection.tsx`. Also uses 3 additional hardcoded hex backgrounds in inline styles.

**Tags: H-ARCH07** (hardcoded hex), **H-ARCH03** (duplicated semantic colors — violation of single-source-of-truth).

### 8. `features/game-detail/FactionSnapshotCards.tsx` — 496 LOC [H-ARCH06, H-ARCH07]

VP source color map defined as a file-level constant object with 7 hardcoded hex values (e.g. `imperial: '#b06020'`, `sft: '#1a8c8c'`). These VP source semantic colors are not in the design token system.

**Tags: H-ARCH06** (nearing ceiling at 496 LOC), **H-ARCH07** (hardcoded hex color map).

---

## Notes (plug-and-play feature-module target)

1. **No cross-feature imports between feature directories** — the isolation between `features/game-detail/`, `features/meta-dashboard/`, `features/agenda/`, etc. is clean. No feature reaches into a sibling. This is the biggest architectural positive.

2. **`lib/` has no top-level barrel** — features import deep into `lib/` sub-paths directly (`../../lib/parser/types`, `../../lib/factions/factionBrandColors`, etc.). A `lib/index.ts` barrel would make the `lib → features` surface explicit and lint-enforceable (H-ARCH01).

3. **`shared/AppHeader.tsx` is the single layer-rule violator** — it imports from `features/upload/UploadPage` (upward). The fix is to extract an `UploadDrawer` component into `shared/` that accepts the upload content via a render prop or children, or to move the upload drawer concern into a route-level wrapper in `App.tsx`.

4. **LOC ceiling recommendation from data** — P75 is 138 LOC; the god-files start at 300+. A ceiling of **300 lines** (H-ARCH06's upper bound) would flag `gameReducer.ts` (953), `buildGameStats.ts` (611), `StatsSection.tsx` (656), `AgendaSection.tsx` (583), `FactionSnapshotCards.tsx` (496), `PoliticalBarChart.tsx` (409), `ComparePage.tsx` (327), `PlanetControlSlideshow.tsx` (321), and `StrategyCardSection.tsx` (308) — 9 production files, all valid refactor targets. A ceiling of **250 lines** adds `UploadPage.tsx` (249 near-miss). Recommend starting at 300.

5. **Hardcoded hex is isolated to feature files and `lib/factions/factionBrandColors.ts`** — `shared/` components and `lib/` logic files are clean. The faction brand color file is the legitimate canonical source; its hex values are correct there. The problem is feature components duplicating semantic color decisions (vote-for green, vote-against red, gain/loss colors) as independent hex literals rather than CSS custom properties.

6. **`StatsSection.tsx` exports data-transform functions alongside a React component** — violates H-ARCH04. Those three functions (`buildGameLengthHistogram`, `buildFinalVpHistogram`, `buildWinsByFaction`) belong in `lib/` and should be extracted before any further work on the stats section. They are also the reason `StatsSection.tsx` has 656 LOC.

7. **`gameReducer.ts` is the highest-leverage refactor target** — at 953 lines with a single switch statement, it is the file most likely to cause merge conflicts and cognitive overload as new actions are added. Splitting by action-type group is a clean, testable decomposition path (each sub-reducer can be independently tested).

8. **Barrel hygiene is good at the feature level** — all `features/*/index.ts` files use explicit named re-exports and are tiny (1–3 lines). The weak point is the absence of a `lib/` top-level barrel, leaving `lib/` internals exposed to direct deep imports from features.
