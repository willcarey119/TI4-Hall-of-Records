# CLAUDE.md — TI4 Hall of Records

AI session context. Read this before touching any file in this repo.

---

## What This Project Is

A web app that parses TI Assistant JSON exports from Twilight Imperium 4 games, stores the cleaned data in Firestore, and visualizes it as a single-game replay dashboard and cross-game meta-analytics dashboard. Built for a private playgroup.

**Stack:** React + TypeScript + Vite · Tailwind CSS · Vitest + React Testing Library · Firebase Firestore · Vercel

---

## Current Status

**V1.0 shipped 2026-04-28.** All phases 0–5d complete and live. 493 tests passing.

| Phase | Status |
|---|---|
| Phase 0 — Scaffolding | ✅ Complete |
| Phase 1a — Parser layer | ✅ Complete — all 7 exports parse cleanly, ≥ 90% coverage |
| Phase 1b — Upload UI + Firestore adapter | ✅ Complete — DropZone → parse → preview → save round-trip working |
| Phase 2a — Nav shell + shared primitives | ✅ Complete — Router, FrozenHeader (7-button), ScrollBody (7 sections), Mast/Kicker/Label/Rule/FactionChip |
| Phase 2 — All 7 game-detail sections | ✅ Complete — Recap, VP Race, Timeline, Dashboard, Planets, Tech, Agenda |
| Phase 3 — Meta-Dashboard | ✅ Complete — `/meta` route with Factions, Strategy, Techs, Stats; 390 tests |
| Phase 4 — Polish & Deploy | ✅ Complete — hero screens hi-fi, faction brand colors, bundle splitting, Firebase Hosting deploy |
| Phase 5a — Critical bug fixes | ✅ Complete — VP threshold key, chart terminal points, dashboard names, planet seeding; 456 tests |
| Phase 5b — UX & legibility | ✅ Complete — A–/A+ font scale toggle, font floor 7px→9px, tech section reorder, strategy card fix, round labels; 458 tests |
| Phase 5c — Consolidation | ✅ Complete — FactionDot/TechPip shared, useScrollSpy extracted, formatters deduped, dead code removed; 463 tests |
| Phase 5d — New analytics views | ✅ Complete — round scores table, speaker stats, scoring pace SVG, relic stats, /agenda route, tech paths; 493 tests |
| **V1.0** | ✅ **Shipped 2026-04-28** — full game detail + meta dashboard + agenda route live |
| **V1.1** | ✅ **Shipped 2026-04-29** — 691 tests; all 6 bugs fixed; Agenda full scope; Mecatol widget; Scoring Pace rebuilt; typography pass; multi-file upload |

**Next up:** V1.2+. See ROADMAP.md §V1.2+ for the backlog.

**V1.2+ scope guardrail:** New analytics views, player attribution, CSV export, and all features beyond V1.1 go to the V1.2+ backlog in ROADMAP.md.

All app code lives under `D:\_TI4 App\app\`.

**Source of truth for the plan:** [`ROADMAP.md`](ROADMAP.md) — this supersedes the `Master Guidance Document.md`, which is deprecated.

**Source of truth for how we work:** [`SKILLS.md`](SKILLS.md)

**Source of truth for visual design:** [`design_handoff_ti4_tracker/`](design_handoff_ti4_tracker/) — newspaper / almanac editorial direction. Read its `README.md` before touching styling, fonts, or component layout.

---

## Decisions That Were Changed — Read Before Suggesting Anything

These are the most common ways an AI session goes wrong on this project:

| What you might suggest | What we actually decided | Why |
|---|---|---|
| A `players` Firestore collection with canonical player IDs | **Retired.** Factions are the primary alignment axis. | Players change every game; factions are consistent. |
| An alias resolution engine that merges "Tim L" / "Tim" / "Yssaril - Tim" | **Retired.** Phase 3.5 is opt-in best-effort first-name attribution, not canonical merging. | The original design was over-engineered for the data. |
| Keying aggregate stats on `playerName` | **Banned.** Key on `factionId` only. | See above. |
| Shipping Phase 1 with only `SCORE_OBJECTIVE` VP tracking | **Not acceptable.** All VP sources (§1.5a–g in ROADMAP) required before Phase 1 ships. | Partial VP = wrong final scores = useless parser. |
| Importing the Firestore SDK in a React component | **Banned.** All Firestore calls go through `src/adapters/firestore.ts` only. | Adapter pattern keeps tests clean. |
| `any` types outside the schema boundary | **Banned.** `tsconfig.json` has `"strict": true` + `"noUncheckedIndexedAccess": true`. | See SKILLS.md §3. |
| A "Deep Space" dark-theme look (the original Phase 4 plan) | **Retired.** Visual direction is now **newspaper / almanac editorial broadsheet** — see `design_handoff_ti4_tracker/`. | Replaces the placeholder dark theme with a defined design language. The Tailwind tokens currently in `app/tailwind.config.ts` are stale — they will be replaced with the design's CSS custom properties (`--paper`, `--ink`, `--accent`, etc.) during Phase 1b/2 styling work. |
| Setting up a custom dark color palette in `tailwind.config.ts` for Phase 1b UI | **Wrong direction.** Use the design tokens from `design_handoff_ti4_tracker/wireframes.css` (warm newsprint, oklch ink colors, vermillion accent). Load Newsreader + IBM Plex Sans + IBM Plex Mono + Caveat from Google Fonts. | See design handoff `README.md`. |
| Designing a `RoundState[]` field as one entry per round | **Wrong shape.** Field is `phaseSnapshots: PhaseSnapshot[]` — one entry per phase transition (4× per round). Renamed during Phase 1a code-review follow-up. | The reducer pushes a snapshot on every `ADVANCE_PHASE`; treating it as per-round caused off-by-one assumptions. |
| `AgendaEntry` as a flat interface with all optional fields | **Wrong shape.** `AgendaEntry` is a **discriminated union** on `elect`: when `elect === null` the entry has required `forEffect` + `againstEffect`; when `elect !== null` it has required `effect`. TypeScript enforces which fields are present. | All-optional interfaces shift invariants to runtime checks; the discriminated union catches misuse at compile time. |
| `buildAgendaSummary(agendaResolutions, factions, lookupAgenda)` | **Wrong signature.** Function is `buildAgendaSummary(agendaResolutions, vpEvents)` — 2 params only. `factions` was removed (YAGNI; net beneficiaries come from `vpEvents` with `source: 'agenda'`). `lookupAgenda` is imported internally, not injected. | Simpler call site, fewer moving parts, no unused parameter. |
| Reading round numbers from `PhaseSnapshot` timestamps | **Not possible.** `PhaseSnapshot` has **no timestamp field**. `deriveRoundBoundaries()` exists as an extension point but returns `[]` today; tech timeline entries default to `round: 0` (displayed as "—"). | `ADVANCE_PHASE` events carry no timestamp in the parsed output; round derivation would require a separate approach. |

---

## TDD Is Not Optional

All parser logic under `src/lib/` must be written test-first (Red → Green → Refactor). No exceptions.

- Write the failing test first. Run it. Confirm it fails for the right reason.
- Write the minimum code to make it pass.
- Refactor with the green bar protecting you.

Coverage gate: `src/lib/**` must stay ≥ 90%. UI components use React Testing Library (behavior, not implementation).

Every parser function requires at least one **negative test** (empty log, unknown action, reversed events, missing optional fields).

---

## Architecture in One Sentence per Layer

- **`src/lib/`** — Pure TypeScript. No React, no I/O, no side effects. This is where TDD happens.
- **`src/adapters/`** — I/O boundary. Only file allowed to import the Firestore SDK.
- **`src/features/`** — React UI organized by user-facing feature. Consumes `lib/` results; never iterates `actionLog` directly.
- **`src/shared/`** — Cross-feature UI primitives only.
- **`src/schema/`** — TypeScript interfaces from `ti-assistant TI4 Schema Definitions.ts` (source of truth for raw data shape).

---

## Phase 0 Acceptance Bar (what "done" looks like before writing features)

From `D:\_TI4 App\app\`:
```
npm install && npm run typecheck && npm run lint && npm test && npm run build
```
All must succeed on a clean install. See ROADMAP §Phase 0 for full deliverables list.

---

## Key Data Shape Notes

- Real exports are **wrapped**: top-level `{ data: { factions, speaker, options }, timers, actionLog }`. `factions`/`speaker`/`options` live under `top.data.*`.
- Real `actionLog` entries are wrapped: `{ timestampMillis, data: { action, event, timestamp }, gameSeconds? }`. The original `ti-assistant TI4 Schema Definitions.ts` schema was correct on this; an early Phase 1a draft incorrectly tried to "flatten" it.
- `parseGame()` in `app/src/lib/parser/parseGame.ts` normalizes the wrapped raw shape into a flat internal `RawLogEntry` before the reducer sees it. The reducer never deals with the wrapper.
- `actionLog` is **reverse-chronological**. `parseGame` sorts ascending by `timestamp` before reducing.
- `event` is `Record<string, unknown>` in the parser — narrowed with `typeof` guards in each switch case. Never `any`.
- `factionId` in real exports is the full faction NAME with spaces and apostrophes (e.g. `"Vaden Banking Clans"`, `"L'tokk Khrask"`), not a slug.
- Faction objects carry `{ factionId, playerName, color, mapPosition, startingTechs, startingPlanets }` — `mapPosition` is derived from array index; `startingTechs`/`startingPlanets` are populated from `SETUP`/`ADVANCE_PHASE` events during parsing.
- `techEvents: TechEvent[]` — type is `'research' | 'starting' | 'remove' | 'purge'`. The distinction between actively researched (`'research'`) and faction-starting tech (`'starting'`) matters for display — only `'research'` events appear in the "Research Order" timeline.
- `agendaResolutions: AgendaResolution[]` — each entry has `agenda` (name string), `outcome`, `round`, `votes[]`, `riders[]`. Outcome is `'For'`/`'Against'` for law/directive agendas, or the elected item name for elect-type agendas.
- `vpEvents: VpEvent[]` — entries with `source: 'agenda'` are the source for the Agenda section's Net Beneficiaries strip. Net beneficiary calculation ignores `factions`; use `vpEvents` directly.
- `AgendaEntry` in `src/lib/parser/agendas.ts` is a **discriminated union** on `elect`: `elect === null` → `{ forEffect, againstEffect }`; `elect !== null` → `{ effect }`. Always narrow with `entry.elect === null` before accessing effect text fields.
- See `app/src/lib/parser/SCHEMA.md` if it exists, otherwise the "Schema Findings" section at the top of `docs/superpowers/plans/2026-04-26-phase-1a-parser.md` is the canonical inventory of real action names + payload shapes.

---

## Game Data

Seven real game exports from the playgroup live at `app/game-data/`. These are the actual dataset — not throw-away fixtures:
- `1.11.25 Twilight Imperium Game.json`
- `1.19.25 TI Assistant JSON Game Data.json`
- `LjnqDB_data (2).json`
- `TIAssistant_Game Data.json`
- `nHg8Hw_data.json`
- `nMhFhJ_data (1).json`
- `PgyXRx_data.json`

These are the test fixtures for Phase 1 acceptance. The gating test: every parsed game's `finalScores` must match the actual game outcome for every faction. The integration test in `parseGame.integration.test.ts` walks the directory automatically — adding a new export requires no test changes.

---

## Working Conventions

- **One failing test before any production logic.** If you're about to write a function in `src/lib/`, write the test file first.
- **Test files live next to source files.** `gameParser.ts` ↔ `gameParser.test.ts`
- **Design docs** save to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` before implementation begins.
- **Definition of Done** is in SKILLS.md §9. Check every item before calling a task complete.
- **Player names are anonymized by default** everywhere in the UI. Faction colors and IDs are the display primitive.
- **V1.1 scope guardrail:** If the user requests something beyond a bug fix, UI/UX improvement, or the Agenda tab, recognize it as V1.2+ scope. Log it in ROADMAP.md §V1.2+ Backlog and confirm with the user rather than implementing it in V1.1.
