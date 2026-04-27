# CLAUDE.md — TI4 Hall of Records

AI session context. Read this before touching any file in this repo.

---

## What This Project Is

A web app that parses TI Assistant JSON exports from Twilight Imperium 4 games, stores the cleaned data in Firestore, and visualizes it as a single-game replay dashboard and cross-game meta-analytics dashboard. Built for a private playgroup.

**Stack:** React + TypeScript + Vite · Tailwind CSS · Vitest + React Testing Library · Firebase Firestore · Vercel

---

## Current Status

**Phase 0 (Scaffolding) is complete.** Phase 1 (Ingestion Engine) is next.

All app code lives under `D:\_TI4 App\app\`. Phase 0 scaffolding is **complete** — `app/` exists, all tooling is wired, and the six game exports are in `app/game-data/`.

**Source of truth for the plan:** [`ROADMAP.md`](ROADMAP.md) — this supersedes the `Master Guidance Document.md`, which is deprecated.

**Source of truth for how we work:** [`SKILLS.md`](SKILLS.md)

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

- `actionLog` in real TI Assistant exports is **reverse-chronological**. Always sort ascending by `gameTime` before reducing.
- `GameEventPayload.event` is `Record<string, any>` in the raw schema. Narrow it with discriminated union type guards at the parser boundary — never pass `any` downstream.
- `GameOptions` has more fields than the Master Guidance Document showed (`events`, `hide-*`, `secondary-victory-points`). The canonical interface is in `ti-assistant TI4 Schema Definitions.ts`.

---

## Game Data

Six real game exports from the playgroup live at the root (to move to `app/game-data/` in Phase 0). These are the actual dataset — not throw-away fixtures:
- `1.19.25 TI Assistant JSON Game Data.json`
- `LjnqDB_data (2).json`
- `TIAssistant_Game Data.json`
- `nHg8Hw_data.json`
- `nMhFhJ_data (1).json`
- `PgyXRx_data.json`

These are the test fixtures for Phase 1 acceptance. The gating test: every parsed game's `finalScores` must match the actual game outcome for every faction.

---

## Working Conventions

- **One failing test before any production logic.** If you're about to write a function in `src/lib/`, write the test file first.
- **Test files live next to source files.** `gameParser.ts` ↔ `gameParser.test.ts`
- **Design docs** save to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` before implementation begins.
- **Definition of Done** is in SKILLS.md §9. Check every item before calling a task complete.
- **Player names are anonymized by default** everywhere in the UI. Faction colors and IDs are the display primitive.
