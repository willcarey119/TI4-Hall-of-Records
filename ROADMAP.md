# ROADMAP — TI4 Hall of Records

Phased delivery plan. Each phase has a goal, a set of deliverables, the test surface that proves it works, and an explicit acceptance bar. We do not start phase N+1 until phase N's acceptance bar is met.

> **Current position (2026-04-28):** Phase 0 ✅ · Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ · Phase 4 ✅ · Phase 5a ✅ · Phase 5b–5d 🔲 in progress
> App is live at https://ti4-hall-of-records-da562.web.app (Firebase project: `ti4-hall-of-records-da562`).
> 456 tests passing. Next: Phase 5b (UX/legibility improvements).
> See `CLAUDE.md` for the full status table.

The Master Guidance Document defines four phases (Ingestion → Single-Game Replay → Meta-Dashboard → Polish). This roadmap **prepends a Phase 0** for project scaffolding, which is currently missing, and breaks each phase into concrete TDD-sized tickets.

---

## Phase 0 — Scaffolding ✅ COMPLETE

**Goal:** A repo that boots, type-checks, lints, and runs a passing test suite. No features yet.

**Location:** All app code lives under `D:\_TI4 App\app\`. The six game JSON exports move into `app/game-data/`. Top-level docs (`SKILLS.md`, `ROADMAP.md`, `Master Guidance Document.md`, `Development Guidelines.md`) stay at `D:\_TI4 App\`.

**Deliverables:**
1. `git init` at `D:\_TI4 App\` + `.gitignore` (node_modules, `.env*`, `dist`, `coverage`)
2. Vite + React + TypeScript scaffold inside `app/` via `npm create vite@latest app -- --template react-ts`
3. Tailwind CSS configured with a "Deep Space" theme stub in `app/tailwind.config.ts`
4. Vitest + React Testing Library wired in, with one trivial passing test (`app/src/smoke.test.ts`)
5. ESLint + Prettier with a config matching SKILLS.md (`no-explicit-any: error`)
6. Folder structure from SKILLS.md §5 created under `app/src/` with placeholder `index.ts` files
7. `app/src/schema/ti4_schema.ts` copied from the existing schema doc at the root (verbatim)
8. `package.json` scripts: `dev`, `build`, `test`, `test:watch`, `typecheck`, `lint`
9. Move the six JSON exports from `D:\_TI4 App\` into `D:\_TI4 App\app\game-data\`
10. `app/README.md` with setup instructions; root `README.md` linking to the app

**Acceptance:** From `D:\_TI4 App\app\`, `npm install && npm run typecheck && npm run lint && npm test && npm run build` all succeed on a clean clone.

---

## Phase 1 — Ingestion Engine ✅ COMPLETE

**Goal:** Pure parsing layer that converts a `TI4ExportData` blob into a clean, typed `ParsedGame` object. Plus an upload UI that runs the parser and persists to Firestore.

### 1.1 — Objective dictionary (`src/lib/parser/objectives.ts`)
Static lookup table of all known objectives → `{ stage: "I" | "II" | "secret" | "support" | "agenda" | "relic"; points: number }`.

- **Test first:** `getObjectivePoints("Lead from the Front")` returns `1`; `"Become a Martyr"` returns `1`; `"Construct Massive Cities"` returns `2` (Stage II); unknown objective returns `null` and is logged.
- **Source data:** mine all unique `event.objective` strings across the seven JSON files in this folder; cross-reference with the official TI4 + PoK + Codex objective lists.
- **Includes:** Discordant Stars / Thunder's Edge content if it appears in the sample data.

### 1.2 — `extractVPEvents(actionLog)` (`src/lib/parser/gameParser.ts`)
The function from the user's "Immediate Task" prompt.

- **Test first:** Mock `actionLog` with mixed `SCORE_OBJECTIVE`, `UNSCORE_OBJECTIVE`, `CLAIM_PLANET` events. Assert returned array contains only VP events, in chronological order, each shaped `{ faction, objective, points, gameTime }`.
- **Negative tests:** empty log; reverse-chronological log (real exports are reversed — must sort by `gameTime` ascending); unknown objective name (skip, don't crash); `UNSCORE_OBJECTIVE` cancels the matching `SCORE_OBJECTIVE`.

### 1.3 — `extractPlanetEvents(actionLog)`
Returns `{ faction, planet, prevOwner | null, gameTime, type: "claim" | "unclaim" }[]`. Special-cases Mecatol Rex and Legendary planets via a static list.

### 1.4 — `extractTechEvents(actionLog)`
`ADD_TECH` / `REMOVE_TECH` / `CHOOSE_STARTING_TECH` → unified `{ faction, tech, gameTime, type }[]`.

### 1.5 — Non-objective VP sources (`src/lib/parser/vpSources.ts`)
Phase 1 acceptance is **blocked on full VP coverage**. Each source is its own subticket with its own tests:

- **1.5a — Custodians token.** First player to take the Custodians token from Mecatol Rex earns 1 VP. In TI Assistant exports this surfaces as the first `CLAIM_PLANET` event on `Mecatol Rex` after game start.
- **1.5b — Imperial point.** The Imperial strategy card primary grants 1 VP when its holder controls Mecatol Rex. Currently visible as `SCORE_OBJECTIVE` with objective `"Imperial Point"` (verify against real data during 1.1 dictionary mining).
- **1.5c — Support for the Throne.** Promissory note granting 1 VP to the holder. Surfaces via `PLAY_PROMISSORY_NOTE` with name `"Support for the Throne"`.
- **1.5d — Relic VPs.** Shard of the Throne (1 VP while held) and Crown of Emphidia (1 VP when played). `GAIN_RELIC` / `PLAY_RELIC` events.
- **1.5e — Agenda VP shifts.** `RESOLVE_AGENDA` for Mutiny, Seed of an Empire, Classified Document Leaks, Crown of Thalnos, Political Censure, etc.
- **1.5f — Riders.** `PLAY_RIDER` for any rider that grants VP on outcome (e.g., Imperial Rider).
- **1.5g — Reversals.** `UNSCORE_OBJECTIVE` is mandatory; corresponding undo handlers for any of the above.

Each subticket: dictionary entry + extractor + AAA tests including the negation case.

### 1.6 — `parseGame(raw: TI4ExportData): ParsedGame`
Top-level parser composing all extractors. Output schema is the contract for Firestore.

```ts
interface ParsedGame {
  gameId: string;            // hash of (firstTimestamp + factions.map(f => f.id).sort().join())
  playedAt: number;          // earliest timestampMillis
  durationSeconds: number;   // from timers.game
  factions: FactionSetup[];  // includes raw playerName (anonymized in UI by default — see Phase 3)
  options: GameOptions;
  vpEvents: VpEvent[];       // unified across ALL sources from 1.2 + 1.5
  planetEvents: PlanetEvent[];
  techEvents: TechEvent[];
  finalScores: Record<string, number>;  // keyed on faction id
  winner: string | null;     // faction id, or null if no faction reached victory-points
}
```

### 1.7 — Upload UI (`src/features/upload/`)
Dropzone → `parseGame` → preview → "Save to Firestore" button. Validation surfaces parser warnings (unknown objectives, etc.) before save.

### 1.8 — Firestore adapter (`src/adapters/firestore.ts`)
`saveGame`, `listGames`, `loadGame`. No SDK leakage outside this file. Auth: anonymous sign-in + Firestore rules with an allowlist of writer UIDs (recommended pattern from open question #4).

**Phase 1 acceptance (full VP coverage required):**
- All six game JSON files parse without throwing.
- Each parsed game's `finalScores` matches the actual game outcome **exactly** for every faction — verified across all six exports. This is the gating test: if a faction's computed VP doesn't match the recorded ending, a VP source is missing or miscounted.
- All VP sources in 1.2 + 1.5 covered with tests.
- Upload → Firestore → reload round-trips cleanly.
- Parser layer ≥ 90% coverage.

---

## Phase 2 — Single-Game Replay ✅ COMPLETE

**Goal:** Pick a saved game, see the story.

**Visual direction:** newspaper / almanac editorial. The design handoff at [`design_handoff_ti4_tracker/`](design_handoff_ti4_tracker/) is the blueprint. Ten screens × four variations are explored there; Phase 2 picks the variations that matter most for the single-game replay.

**Implementation order suggested by the handoff:** tokens + type system → primitives (`Mast`, `Kicker`, `Headline`, `Deck`, `Label`, `Rule`, `FactionDot`, `FactionChip`, `SketchFrame`) → hero (Screen 7A VP Race slope chart) → end-game recap (Screen 10A) → always-visible chrome (round/initiative/dashboard).

**What's done:**
- ✅ Design tokens + Google Fonts loaded (`wireframes.css`, Newsreader / IBM Plex Sans / IBM Plex Mono / Caveat)
- ✅ Shared primitives: `Mast`, `Kicker`, `Label`, `Rule`, `FactionChip`
- ✅ Always-visible chrome: `FrozenHeader` (7-button nav), `ScrollBody` (IntersectionObserver, 7 sections)
- ✅ `GameContext` + `useGame` hook; `GameDetailPage` with loading/error states
- ✅ Tech section: `buildTechSummary`, `lookupTechColor` (tech color dictionary), `TechSection` component
- ✅ Agenda section: `buildAgendaSummary`, `lookupAgenda` (62-entry agenda dictionary), `AgendaSection` component
- ✅ VP Race: `buildVpTimeline`, `VpRaceSection` slope chart
- ✅ Timeline: `buildTimelineFeed`, `TimelineSection` chronological event feed
- ✅ Dashboard: `DashboardSection` faction dossier
- ✅ Planets: `PlanetsSection` planet control ledger
- ✅ Recap: `buildRecapSummary`, `RecapSection` "The Galactic Chronicle" newspaper front page (masthead, headline, deck, 3-col grid, standings strip)

### 2.1 — VP Race chart (HERO — Screen 7A)
Editorial slope chart: rounds on x-axis (or `gameTime` formatted h:mm:ss), cumulative VP on y-axis, one line per faction. Leader line highlighted in `--accent` (faded vermillion), 10/12/14-VP win-line drawn with `--rule`. Two-column body with editorial drop cap explaining the story. Animate the path on round change (1.2 s cubic-bezier).

- **Test first:** `buildVpTimeline(vpEvents, factions)` returns one series per faction with running totals and a leading `(0, 0)` data point.

### 2.2 — Round & phase tracker (Screen 1)
Driven by `phaseSnapshots[]` from the parser. Variation TBD — broadsheet (1A) is the default; the timeline strip (1C) doubles as a scrubber for replaying past states.

### 2.3 — Action timeline (Screens 4 + 5)
Scrolling chronological feed. Filterable by event type and faction. Major events (Mecatol claim, agenda resolution, final-VP scoring) styled with the editorial kicker treatment. Combat events get the two-column ledger (Screen 4A); agenda resolutions get the senate broadsheet (Screen 5A) including the vote tally drawn from `agendaResolutions[i].votes`.

### 2.4 — Player Dashboard (Screen 3)
One-faction-at-a-time dossier. Default is Screen 3A (broadsheet "DOSSIER No. NN"). Surfaces final score, currencies-via-`techEvents`/planet count, tech list, planet ownership at end of game.

### 2.5 — Planet Control Ledger (Screen 6)
Static map prototype: list of planets grouped by current owner, with hover history. Mecatol Rex and Legendaries pinned at top with "changed hands N times" badges. Hex-grid variation (6B) is a stretch goal.

### 2.6 — Game header / masthead
Editorial masthead: date, duration, expansions, faction lineup, final scores, winner. Drives the End-Game Recap (Screen 10A) for the shareable view.

**Phase 2 acceptance:** A user can pick any uploaded game and reconstruct what happened without opening the raw JSON. The VP Race chart and at least one variation of every other Phase 2 screen ships at mid-fi (matching the wireframes); hi-fi pass is Phase 4.

---

## Phase 3 — Meta-Dashboard (Faction-First) ✅ COMPLETE

**Goal:** Cross-game insights for the playgroup, organized around **factions** as the primary axis. Players change every game and are anonymized by default; first-name stats are a best-effort sidecar.

> **Pivot from original Master Guidance:** The Master Guidance Document still describes a player-first alias resolution engine (merging "Tim L"/"Tim"/"Yssaril - Tim" into a canonical Tim profile). That model is retired. Factions are the alignment axis. Player-name handling becomes Phase 3.5 (best-effort first-name aggregation), not the centerpiece.

**Visual direction:** continue the newspaper / almanac aesthetic from Phase 2. Cross-game stats lend themselves naturally to the Senate Almanac (Screen 5D), Bounty cards (Screen 8B), and Density heatmap (Screen 8D) treatments from the design handoff.

### 3.1 — Faction analytics (primary)
- Pick rate, win rate, average final VP, average score-time, most-frequent secondary objective scored.
- Win rate split by expansion (Base / PoK / Discordant Stars / Thunder's Edge).
- Faction-vs-faction head-to-head when both appeared in the same game.

### 3.2 — Strategy card trends
Most picked strategy cards per round, by faction; correlation between strategy choice and win rate.

### 3.3 — Tech trends
Most researched techs overall and by faction; fastest-to-tech-X records; tech tree depth distribution.

### 3.4 — Game-level stats
Average game length, average winning VP, "kingmaker" patterns (who scored last before game-end), Mecatol Rex turnover frequency.

### 3.5 — Best-effort player attribution (sidecar, optional)
- UI lists every distinct `playerName` string across games. User can flag a name as "anonymized" (default) or assign a canonical first name.
- Where a first name is assigned, surface secondary stats: games played under that name, win rate, favorite faction. Always presented as best-effort with a count of contributing games.
- No automatic alias merging. No player-keyed Firestore collection — first-name stats are a derived view computed at read time from tagged faction-game records.
- Names default to anonymized; the UI shows faction colors and first names only when explicitly opted in.

**Phase 3 acceptance:** All six game exports visible in aggregate; the user can answer "what's the highest-win-rate Discordant Stars faction" in two clicks. Player names are anonymized by default everywhere; first-name attribution is opt-in per name.

**What's done (390 tests at completion):**
- ✅ `/meta` route — lazy-loaded `MetaDashboard` with Factions, Strategy, Techs, Stats tabs
- ✅ Factions tab: pick rate, win rate, avg final VP, avg score time per faction
- ✅ Strategy tab: most-picked strategy cards per round, faction correlations
- ✅ Techs tab: most-researched techs overall and by faction
- ✅ Stats tab: game-level aggregate stats (avg game length, avg winning VP, etc.)
- ✅ `ErrorBoundary` wrapping MetaDashboard; loading/error states

---

## Phase 4 — Polish & Deploy ✅ COMPLETE

**Visual direction:** newspaper / almanac editorial broadsheet. See [`design_handoff_ti4_tracker/README.md`](design_handoff_ti4_tracker/README.md) for the full handoff. The earlier "Deep Space" dark-theme placeholder is retired.

**What was delivered:**

**Phase 4a — Robustness + Deploy (commit `054cea7`):**
- `ErrorBoundary` shared component wrapping `<Routes>` in `App.tsx`
- MetaDashboard loading/error states (was silently showing empty sections)
- Firebase Hosting config in `firebase.json` with SPA rewrite
- App deployed to https://ti4-hall-of-records-da562.web.app

**Phase 4b — Bundle splitting (commit `054cea7`):**
- `React.lazy` route splitting — main bundle 719 kB → 235 kB (67% reduction)
- Firebase SDK in its own lazy chunk (only loads on `/meta` route)

**Phase 4c — Hero screens hi-fi:**
- VP Race: SVG circles at each VP point (r=1.5 interior, r=3 terminal), drop cap editorial prose, improved headline ("takes the throne.")
- RecapSection "The Galactic Chronicle" — header strip, masthead, kicker, headline, deck, 3-col grid, standings strip; wired as first section with Recap nav tab; `buildRecapSummary` pure function

**Phase 4d — Faction brand colors:**
- `src/lib/factions/factionBrandColors.ts` — 39-key Record (25 standard + Mahact alias + 13 DS), `getFactionBrandColor(factionId, fallback)` helper
- CSS `--f-*` custom properties on `:root` in `index.css`
- `FactionChip` and RecapSection winner swatch use brand color with game-token color as fallback

**Deferred (intentional):**
- Iconography pass — not planned
- Animations — not planned
- Lighthouse ≥ 90 — not yet measured
- README screenshots pass — not planned
- Vercel deploy — using Firebase Hosting instead

---

## Phase 5 — Improvements, Cleanup & New Views

**Goal:** Fix confirmed bugs surfaced after deploy, improve legibility and UX, consolidate shared code, and add new analytics views.

### Phase 5a — Critical Bug Fixes ✅ COMPLETE (456 tests, 2026-04-28)

All four bugs confirmed from live-app review:

- ✅ `getVictoryPointThreshold` helper — reads `options['victory-points']` (real TI Assistant export key) with `victoryPoints` camelCase fallback. Fixes VP line position, recap prose, and dashboard winner detection for non-default VP thresholds.
- ✅ VP chart terminal points — every faction series now has ≥ 2 points; 0-VP factions render as a flat line instead of being invisible.
- ✅ Dashboard objective chips — removed broken `SOURCE_LABEL` map; chips now display actual objective names ("Diversify Research", "Custodians Token").
- ✅ Planet inventory seeding — `buildPlanetSummary` and `buildDashboardSummary` now seed `finalOwner` with `startingPlanets` before walking events; home-system planets appear in faction totals.

### Phase 5b — UX & Legibility Improvements 🔲

- **Font size controls** — `A–`/`A+` toggle in `FrozenHeader` nav, adjusts `--font-scale` CSS variable (default `1`), persisted in `localStorage`. All text that currently uses `px` font sizes should use `calc(Npx * var(--font-scale))`.
- **Default font size improvements** — audit and improve default sizes for legibility before shipping the font scale feature.
- **Tech section reorder** — move "Final Inventories" above "Research Order" (currently Research Order renders first).
- **Strategy card secondary tracking fix** — `MARK_SECONDARY` events require `state.activeStrategyCard` set by `SELECT_ACTION`; if that state is missing, secondary events get empty card names. Investigate parser state machine and fix.
- **Tech round labels** — tech events currently show `round: 0` (displayed as "—") because `deriveRoundBoundaries` returns `[]`. Implement round boundary derivation from `phaseSnapshots` and pass to `TechSection`.

### Phase 5c — Consolidation & Cleanup 🔲

Driven by a comprehensive code review of the full app:

- Extract `FactionDot` (the colored circle used in standings strip and legend) to `src/shared/` — currently duplicated across components.
- Extract tech color constants (`COLOR_VAR` map) from `TechSection` to `src/shared/` — used or could be used in multiple places.
- Fix `formatters` usage in `GamePreview` — uses raw date formatting instead of `formatDate` from `src/shared/formatters`.
- Extract `useScrollSpy` hook from `ScrollBody` to `src/shared/hooks/` — reusable scroll intersection observer.
- Delete `src/features/game-replay/` if it exists and is unused (leftover from early scaffolding).
- Decide on `gameTime` field usage — audit whether `VpPoint.timestamp` vs `VpPoint.gameTimeSeconds` is consistently used.
- Update `CLAUDE.md` status table — fix stale "6-button / 6 sections" reference (now 7 sections with Recap tab).

### Phase 5d — New Analytics Views 🔲

New views planned based on post-deploy feedback:

- **Scoring pace curve** — in MetaDashboard, overlay normalized scoring pace across multiple games; shows "typical" VP trajectory vs outlier games.
- **Dedicated `/agenda` route** — expand the Agenda breakdown beyond the current game-detail section into a full cross-game page: which agendas pass/fail most often, VP impact by agenda, vote distribution heatmap.
- **Speaker order correlation** — does going first / last as speaker correlate with win rate? Show in MetaDashboard Stats tab.
- **Relic performance** — track Shard of the Throne, Crown of Emphidia, and other relic VP sources across games.
- **Tech path analysis** — "most common tech unlock order by faction" and "fastest tech researched" views.
- **Round-by-round score snapshots** — extend RecapSection standings strip to show VP at each round boundary, not just final scores.

---

## Cross-cutting backlog (parallel to phases)

Items we'll pull in opportunistically:

- Real-data discovery script (run during Phase 1.1): walk every JSON in `app/game-data/` and emit (a) every unique `action`, (b) every unique `event.objective`, (c) every unique `tech` name, (d) every unique `playerName`. Catches schema drift and seeds the dictionaries.
- Discordant Stars / Thunder's Edge content audit: confirm all faction IDs, objectives, and techs from these expansions are in our dictionaries.
- CSV export of parsed games for ad-hoc analysis outside the app.

---

## Decisions (resolved 2026-04-26)

1. **Repo location:** scaffold under `D:\_TI4 App\app\`. Sample JSONs move to `app/game-data/`.
2. **Phase 1 VP scope:** full VP coverage required — no shipping Phase 1 with only `SCORE_OBJECTIVE`. Each non-objective VP source (Custodians, Imperial point, Support for the Throne, relics, agendas, riders) gets its own subticket and tests under §1.5.
3. **Firestore:** provision a new Firebase project. Phase 0 scaffolding will stub the SDK config behind env vars; the actual project creation is a manual step in the Firebase Console (Phase 1.7/1.8).
4. **Auth:** anonymous sign-in + Firestore rules with an allowlist of writer UIDs. Reads are open to anyone with the URL.
5. **Player names:** anonymized by default. Players change every game, so factions are the primary alignment axis. First-name attribution is opt-in best-effort (Phase 3.5), not a centerpiece. The original Master Guidance "alias resolution engine" is retired — see Phase 3 pivot.
