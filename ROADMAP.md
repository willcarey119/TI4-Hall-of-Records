# ROADMAP — TI4 Hall of Records

Phased delivery plan. Each phase has a goal, a set of deliverables, the test surface that proves it works, and an explicit acceptance bar. We do not start phase N+1 until phase N's acceptance bar is met.

> **Current position (2026-05-05):** **V1.2 wireframe kit shipped.** Editorial newspaper-aesthetic redesign live.
> App is live at https://ti4-hall-of-records-da562.web.app (Firebase project: `ti4-hall-of-records-da562`).
> 786 tests passing. Next: **V1.3a — wire up what's built**, starting with round scrubber filtering.
> See `CLAUDE.md` for the full status table and working conventions.

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

### Phase 5b — UX & Legibility Improvements ✅ COMPLETE (458 tests, 2026-04-28)

- ✅ `A–`/`A+` font scale toggle in `FrozenHeader`, persisted in `localStorage`, sets `--font-scale` CSS variable
- ✅ Font floor raised from 7px → 9px across all sections
- ✅ Tech section reorder — Final Inventories now above Research Order
- ✅ Strategy card secondary tracking fixed — `MARK_SECONDARY` correctly resolved to active card
- ✅ Tech round labels — `deriveRoundBoundaries` wired through to TechSection

### Phase 5c — Consolidation & Cleanup ✅ COMPLETE (463 tests, 2026-04-28)

- ✅ `FactionDot` extracted to `src/shared/`
- ✅ `TechPip` + `TECH_COLOR_VAR` extracted to `src/shared/`
- ✅ `useScrollSpy` hook extracted from `ScrollBody` to `src/shared/hooks/`
- ✅ `formatDate`/`formatDuration` deduplicated — `GamePreview` now uses shared formatters
- ✅ Dead code removed (`src/features/game-replay/`, backward-compat re-exports)
- ✅ All consumer files updated to use shared barrel imports

### Phase 5d — New Analytics Views ✅ COMPLETE (493 tests, 2026-04-28)

- ✅ Round-by-round score table in RecapSection (below standings strip)
- ✅ Speaker order win correlation in MetaDashboard Stats
- ✅ Scoring pace SVG chart in MetaDashboard (winner VP trajectory, normalized to game duration)
- ✅ Relic performance stats in MetaDashboard Stats (per-relic gain/play counts, faction breakdown)
- ✅ `/agenda` route — "The Senate Almanac" standalone page with cross-game agenda pass rate analytics
- ✅ Tech research opening paths in MetaDashboard Techs (top techs per research position, per faction)

---

## V1.0 — Release Milestone ✅ SHIPPED (2026-04-28)

**What shipped:**

| Capability | Detail |
|---|---|
| Game ingestion | Upload any TI Assistant JSON export; parser handles all 7 VP sources, all faction types |
| Single-game detail | 7 sections: Recap, VP Race, Timeline, Dashboard, Planets, Tech, Agenda |
| Meta-Dashboard | Cross-game analytics: Factions, Strategy, Techs, Stats, Scoring Pace tabs |
| Agenda route | `/agenda` — cross-game Senate Almanac with pass rate analytics |
| Data | 7 real playgroup games ingested and live |
| Tests | 493 passing, `src/lib/**` ≥ 90% coverage |
| Infrastructure | Firebase Hosting + Firestore, lazy-loaded bundles, font scale toggle |

**Known limitations entering V1.1:**
- Some game data files may have incomplete final state (truncated action logs, unrecorded winners) — analytics built on these games may be incorrect
- The `/agenda` route is a first pass; full cross-game agenda analytics (vote tallies, VP impact, faction voting patterns) are scoped for V1.1
- No structured human validation has been performed against known ground truth

---

## V1.1 — Data Integrity, Human Validation & Agenda ✅ SHIPPED 2026-04-29

**Goal:** Ensure the data underneath the app is trustworthy, confirm what's working and what isn't through structured human review, fix confirmed bugs, and ship a complete Agenda analytics experience.

**Delivered:** 691 tests. All 6 walkthrough bugs fixed (B1–B6). Typography pass complete. VP Race chart rebuilt on round-based data. Agenda tab full scope (A1–A8, cross-game pass rates, vote tallies, VP impact, faction voting patterns, timing, riders). Per-section UX polish (Mecatol Rex widget, Scoring Pace chart, Tech clarity, Relics merge, GameCard phase callout, Frequent Pairings removed). Multi-file upload. Tier-C tech debt (main.tsx guard, env var assertions, skipAgenda test).

**Scope guardrail:** V1.1 contains only (a) data fixes, (b) bug fixes confirmed by human validation, (c) UI/UX improvements identified in the walkthrough, and (d) the Agenda tab full scope. Any request that adds new analytics views or features beyond the Agenda tab belongs in V1.2+.

### Step 1 — Data triage (human + code)

Audit all 7 game files in `app/game-data/`. For each file, determine:
- Does the parser produce a non-null `winner`?
- Do `finalScores` match the actual game outcome (cross-reference offline knowledge)?
- Is the action log complete, or does it appear truncated before game-end?
- Are there any parser warnings surfaced in the upload UI?

Produce a triage table: one row per game file, columns for the above questions. This is the ground truth document for all subsequent work.

### Step 2 — Surgical data fixes

For each game file identified as incomplete in Step 1:
- Make the minimum edit to bring the file to a valid, complete state
- This may mean: manually appending a final `SCORE_OBJECTIVE` event, setting a winner explicitly, or reconstructing the last round from memory
- **The original TI Assistant export URLs have expired and cannot be refreshed** — all fixes must be made directly to the JSON files in `app/game-data/`
- Re-upload fixed files through the normal upload flow; confirm the integration test suite passes against the corrected files

### Step 3 — Human validation walkthrough

Structured screen-by-screen review of the live app against now-trustworthy ground truth. For each view:
- Does it render without error?
- Do the numbers match what actually happened in the game?
- Are there any layout, legibility, or interaction issues?

Output: a written bug list and UX improvement list, prioritized by severity.

### Step 4 — Bug fixes

Fix all issues confirmed in Step 3, in priority order. No new features in this step.

Acceptance: every confirmed bug from Step 3 is resolved and verified against the live app.

### Step 5 — Agenda tab full scope

The `/agenda` route currently shows agenda names with pass rate bars. The full V1.1 Agenda scope adds:

- **Vote tallies** — for each agenda resolution, show per-faction vote counts (For vs Against) and rider plays
- **VP impact** — which agendas resulted in VP changes; net VP swing per outcome
- **Faction voting patterns** — how each faction votes across all appearances of each agenda (when data is available)
- **Agenda timing** — which round each agenda tends to appear; does early vs late agenda timing correlate with game length?
- **Riders** — track which riders were played on which agendas; outcomes

This is the one new-feature deliverable in V1.1.

### Step 6 — UI/UX polish

Improvements identified in Step 3, plus any cross-cutting legibility work. Examples of the kinds of things that would land here (not a fixed list — the walkthrough drives this):
- Mobile/narrow viewport improvements
- Loading state polish
- Empty state handling (e.g. sections with no data for a given game)
- Typography and spacing tweaks

**V1.1 acceptance:** All 7 game files parse correctly with accurate winners and final scores. Every confirmed bug from the validation walkthrough is fixed. The `/agenda` route delivers full vote/VP/faction analytics. No regressions in the test suite.

---

## V1.2 Addendum — Guidance & Explainer Pass ✅ COMPLETE (2026-05-04)

**Goal:** Comprehensive in-app guidance so no stat, chart, or section is opaque to a new or returning player.

**What was done:**
- Upgraded `Tooltip` component from HTML `title` attribute to a proper CSS hover popover (styled, max-width 260px, shows above the `?` icon)
- Added `Tooltip` to every labeled stat box or metric across all sections: StatsSection (headline grid, Mecatol Rex, VP diversity / HHI, Comeback, Stage II, Speaker Order), FactionSection (table column headers, Senate Power, Support for the Throne), StrategyCardSection (follow rate, Most Picked, Draft Position), meta TechSection (column headers, Winner Possession, ★ trend, Research Openings), RecapSection (Margin, Length, round-scores table)
- Added sub-section prose blurbs for: Mecatol Rex (StatsSection + MecatolWidget), action types, VP source abbreviation key, Speaker Order, Senate Power, Support for the Throne, Research Openings
- Added AgendaSection: LAW / DIR / Elect definitions paragraph + Net Beneficiaries description
- Added DashboardSection: visual tech pip key legend (Propulsion / Warfare / Cybernetic / Biotic)
- Expanded HomePage welcome blurb to describe all three routes (game detail, League Stats, Senate Almanac)
- All existing `SectionDesc` components already in place across all 13 sections — no content changes needed there

**Scope:** UI/UX text additions only. No logic changes. All existing tests pass unchanged.

---

## V1.2 Addendum — Card-Based UI Redesign ✅ COMPLETE (2026-05-05)

**Goal:** Replace tabular standings, raw lists, and old chart sections with a consistent card-based layout across the full app — editorial newspaper aesthetic, data dense but readable.

**What was done:**

*Game Detail — Recap section:*
- New `FactionSnapshotCards` component: one card per faction showing VP source breakdown (Obj/Cust/Imp/SFT/Relic/Agd), tech category summary (pip counts by color), and planet count
- Round-by-round VP scores aligned to the same CSS grid as the cards (`36px + repeat(N, 1fr)`) so columns match exactly
- Replaced old standings strip + HTML `<table>` with this unified component

*Game Detail — Planets section:*
- `FactionTerritoryCard` grid replaces flat `FactionInventory` list
- New `PlanetControlSlideshow` component: round-by-round planet holdings, auto-advancing with pause/play control; gained (green) / lost (red) highlights per round

*Game Detail — Tech section:*
- Research Order rebuilt as per-faction cards with numbered sequential tech picks; starting techs dimmed

*Game Detail — Agenda section:*
- Full card-per-agenda layout with `TypeBadge` (Law/Dir/Elect), `OutcomeBadge`, proportional vote bars per faction, VP beneficiary strip, rider tracking

*Game Detail — Mecatol Rex widget (PlanetsSection):*
- Full rewrite: summary stats header (Turnovers / Final Holder / First Claimed), round-by-round control strip with event badges (First / Taken / Held), narrative change log

*Meta Dashboard — StatsSection:*
- Comeback → 2 stat cards; Stage II → 2 cards with progress bar; Objective Timing → card grid per round; Hero Activations → card per hero; Relics → card per relic with VP/No VP badge; Agenda Analysis → card per agenda; Speaker Order → 3 cards

*Meta Dashboard — FactionSection:*
- Senate Power Index: ranked faction cards with winningVoteRate bar; SFT received strip

*Meta Dashboard — TechSection:*
- Winner Tech Possession: card per tech, ★ border for ≥67% win rate, avg research round; Research Openings: card per faction showing 1st/2nd/3rd picks

*Meta Dashboard — PlayerSection:*
- `PlayerCard` grid sorted by games played; top win-rate gets accent border

*Agenda tab (PoliticalBarChart):*
- Unified political bar: For% from left, Against% from right, 50% hairline; filter chips (All / Usually Passes / Usually Fails / Contested); close-race label fallback; elect-row faction chips

**New aggregator:** `buildTerritoryByRound(planetEvents, factions, roundBoundaries)` — reconstructs per-faction planet holdings at end of each round with gained/lost diffs.

**Tests:** 719 passing. No logic regressions.

---

## V1.2 Addendum — Wireframe Kit Rollout ✅ COMPLETE (2026-05-05)

**Goal:** Apply the new design handoff (`design_handoff_ti4_tracker/`) wireframe kit to the live app — fixing legibility (font floor too small) and rolling out 9 component sections.

**What was done:**

*Foundation:*
- Raised CSS font tokens to 14px floor: `--font-micro` 11→14, `--font-sm` 13→16, `--font-body` 15→18, `--font-subhead` 17→20, `--font-display-sm` 22→26, `--font-display-md` 28→32, `--font-display-lg` 32→38
- Added `.card-fill` container-query utility for cards that should expand type to fill space before collapsing padding

*Page chrome (§01):*
- `SubSectionNav` — sticky scroll-spy nav using IntersectionObserver
- `CommandPalette` — Ctrl+K quick-jump to games by faction name
- Compact "HoR" masthead on Meta dashboard (replaces tall masthead)
- Round scrubber strip in game-detail `FrozenHeader` (display-only stub; section filtering deferred to V1.3)

*New shared components (in `app/src/shared/`):*
- `EntityCard` — newsprint / tabular / player / chip variants for faction display
- `StatCard` — anchor / delta / rank / stack / hero / rate / quote / sparkline variants (replaces inline stat divs)
- `LeaderboardPodium` — top-3 strip with 1st-2nd-3rd left-to-right ordering above the existing faction table
- `ComparisonBlock` — `DivergingComparison` (head-to-head bars) + `MultiEntityComparison` (3+ column table)
- `TrendCard` — `MultiLineChart` (overlay) + `SmallMultiples` (per-entity sparklines on shared y-scale)
- `DistributionCard` — `BarHistogram` + `HeatmapGrid` (oklch intensity)
- `CategoryBreakdown` — `StackedRowBreakdown` + `Treemap` (no donut per design preference)
- `FilterBar` — segmented control + dropdown (wired to FactionSection card/table toggle)
- `EmptyState` ("The presses await ink.") + `LoadingSkeleton` + `ErrorState` ("Stop the press") replace bare loading/error strings

*Match cards (§05):* `GameCard` extended with `tile` / `ladder` / `storyline` variants on top of existing `row`. Latest game on the home page renders as `storyline` (PHOTO FINISH / CONTESTED / BLOWOUT tag derived from VP spread).

*Polish pass:*
- Body text legibility: `--ink-3` → `--ink-2` across StatCard / LeaderboardPodium / SubSectionNav / FilterBar / EntityCard
- Mecatol Rex / Action Type Breakdown / VP Source Breakdown sections wrapped in editorial cards with `<Kicker>` headers and `<StatCard>` for numerics
- FactionSection sparklines moved inside the EntityCard border; faction headlines sized down to handle long names ("Naaz-Rokha Alliance", "Universities of Jol-Nar")
- Removed duplicate section nav row on Meta dashboard

**Tests:** 786 passing. No logic regressions; 76 new tests added across the new components.

**Build fix:** Removed unused `React` value imports from 9 shared files (modern JSX transform); fixed `GameCard` → `FactionChip` `score` prop to satisfy `exactOptionalPropertyTypes: true`.

---

## V1.3 — Wire-up, Player Attribution & Polish (next)

Sequenced into three sub-phases. Each sub-phase is independently shippable.

### V1.3a — Wire up what's built (quick wins)

Components shipped in V1.2 that are exported but not yet consumed by any page. Each item is small (~1 session).

1. **Round scrubber filtering** — `FrozenHeader` already renders the R1…RN strip. Wire `scrubRound` into a `RoundContext` so game-detail sections (Timeline, Dashboard, Planets, Tech) clip their content to events ≤ scrubRound. Null = no filter (default).
2. **Game Comparison route** — new `/compare/:gameA/:gameB` route using the already-built `DivergingComparison` (head-to-head metrics: VP, agendas won, planets held, techs researched) and `MultiLineChart` (overlaid VP race). Picker UI in home/meta to pick the two games.
3. **TrendCard / DistributionCard / CategoryBreakdown placement** — find natural homes in existing meta/agenda sections:
   - `BarHistogram` → Stats section "Game length distribution" + "Final-VP distribution"
   - `HeatmapGrid` → Strategy section "Faction × Strategy card pick rate"
   - `Treemap` / `StackedRowBreakdown` → Stats section "Wins by faction" prevalence view
   - `MultiLineChart` → Scoring Pace section as the hero chart

### V1.3b — Medium features

4. **Player Attribution** — opt-in first-name tagging. Faction objects in each game get a `playerName` field (already parsed from the wrapped `top.data.factions`). Add a per-game UI to confirm/edit attributions, plus a new `/players` route with per-player win rates, favorite factions, head-to-head records. Uses `EntityCard variant="player"` (already built).
5. **Sharing / social cards** — `/share/:gameId` route with Open Graph meta tags. Server-side rendered card image (winner faction + VP score) for Discord/social embeds.

### V1.3c — Content & polish

6. **Discordant Stars / Thunder's Edge content audit** — needs a separate spec at `docs/superpowers/specs/2026-05-XX-ds-te-audit.md`. Two-step:
   - Discovery: walk every JSON in `app/game-data/`, emit unique faction IDs, tech names, objective names not present in our dictionaries
   - Audit: compare against published DS/TE content, fill gaps, write parser tests for any newly recognized actions
   This is data-correctness work, not UI — own phase.
7. **CSV export** — single button per game-detail page → downloads CSV of round-by-round VP per faction. Plus a "all games" export from the Home/Meta route. Uses native `Blob` + `URL.createObjectURL`, no library.
8. **Lighthouse / Core Web Vitals audit** — run Lighthouse on home, meta, game-detail, and agenda routes. Fix anything below 90 on Performance / Accessibility / Best Practices / SEO. Likely includes lazy-loading the Newsreader font, code-splitting heavy chart sections, and adding `loading="lazy"` to images.

---

## V1.2+ — Backlog beyond V1.3

Items confirmed out of scope for V1.3. When raised during V1.3 work, log here.

- **Notifications / live alerts** — push notifications when a new game is uploaded
- **Additional game files** — if new TI Assistant exports surface action types our parser doesn't recognize, the parser may need extension
- **Multi-pod / multi-tenant** — currently single-playgroup; cross-playgroup analytics out of scope
- **Mobile-first redesign** — wireframes §12 (mobile variants A/B/C) — full responsive pass after V1.3 lands

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
