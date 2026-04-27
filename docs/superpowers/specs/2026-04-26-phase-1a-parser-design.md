# Phase 1a — Parser Layer Design

**Date:** 2026-04-26
**Status:** Approved
**Supersedes:** Phase 1 in ROADMAP.md (which is split into 1a Parser + 1b UI/Firestore)

---

## Scope

Phase 1a delivers a **pure TypeScript parsing layer** that converts raw TI Assistant JSON exports into a fully-typed `ParsedGame` object. No React, no Firebase, no I/O. Every function in `src/lib/` is a pure function or a deterministic reducer; all state lives inside the reducer, never outside it.

Phase 1b (Upload UI + Firestore adapter) is a separate sub-project that consumes the `ParsedGame` contract Phase 1a defines.

### In scope
- Schema correction (fix `RawLogEntry` to match actual TI Assistant export format)
- Complete `ParsedGame` type definition with all tracked event arrays
- Objective dictionary covering all known objectives + point values
- Single-pass stateful reducer (`gameReducer.ts`) that emits all event arrays in one pass
- Top-level `parseGame()` function composing the above
- Data-discovery script (`scripts/discover-data.ts`)
- TDD throughout — every parser function has a failing test before production code
- ≥ 90 % line coverage on `src/lib/**`

### Out of scope (Phase 1b)
- Upload UI / Dropzone component
- Firestore adapter (`saveGame`, `listGames`, `loadGame`)
- Firebase project provisioning
- The gating test (exact `finalScores` match against real exports) — deferred to Phase 1 combined acceptance after Phase 1b lands

---

## Architecture Decision: Single-Pass Stateful Reducer (Approach B)

**Chosen:** Approach B — one reducer function that walks the sorted `actionLog` once and builds all event arrays simultaneously.

**Rejected:** Approach A (independent functional extractors per event type) — each extractor re-scans the full log. This approach cannot handle events where correct output depends on game state accumulated from earlier events (e.g., Seed of an Empire VP depends on which faction currently leads the score; Imperial Rider VP depends on the Imperial agenda outcome that was resolved in the same pass).

**Key insight:** The full-pass stateful approach is strictly more powerful, and because it lives in a single file with well-defined input/output types, it remains fully testable. Tests supply a hand-crafted `RawLogEntry[]` array and assert on the output shape — no mocking required.

---

## File Structure

```
app/src/lib/parser/
  types.ts           — All TypeScript interfaces for ParsedGame and its sub-types
  objectives.ts      — Static dictionary: objective name → { stage, points }
  gameReducer.ts     — Single-pass reducer: RawLogEntry[] → ReducerOutput
  parseGame.ts       — Top-level: TI4ExportData → ParsedGame (calls reducer, derives IDs)

app/src/lib/parser/__tests__/
  objectives.test.ts
  gameReducer.test.ts
  parseGame.test.ts

app/scripts/
  discover-data.ts   — Walks game-data/*.json, emits unique actions/objectives/techs/playerNames
```

Test files live next to source (or under `__tests__/` — both are acceptable; use `__tests__/` for the parser since the directory will otherwise have many files).

---

## Schema (corrected after Task 0 discovery)

**Reversal:** An earlier draft of this spec claimed `ti4_schema.ts`'s `ActionLogEntry` was wrong. After running the discover-data script against the six real exports, the original schema is **correct**. Real entries are wrapped, not flat.

### Top-level export shape

```ts
{
  data: {
    factions: Array<{ id: string; playerName: string; color: string }>;
    speaker: number;                    // mapPosition index
    options: Record<string, unknown>;   // includes 'victory-points', expansions
  };
  timers: {
    game: number;
    [factionId: string]: number;        // also includes lastUpdate
  };
  actionLog: Array<{
    timestampMillis: number;            // Unix ms when logged
    data: { action: string; event: Record<string, unknown>; timestamp: number };
    gameSeconds?: number;               // seconds into the game
  }>;
}
```

Note: `factions`, `speaker`, `options` live under `top.data.*` — `timers` and `actionLog` are at the top level.

### Internal `RawLogEntry` (parser-internal, normalized by `parseGame`)

```ts
export interface RawLogEntry {
  action: string;
  event: Record<string, unknown>;
  timestamp: number;     // taken from data.timestamp or timestampMillis
  gameTime?: number;     // taken from gameSeconds
}
```

`parseGame` extracts and normalizes from the wrapped structure into this flat `RawLogEntry`. The reducer never sees the wrapper.

`actionLog` in real exports is **reverse-chronological** — `parseGame` sorts ascending by `timestamp` before reducing.

### Faction setup — adjusted to match real data

Real faction objects have only `{ id, playerName, color }`. `mapPosition` is derived from array index. `startingTechs` and `startingPlanets` are not present in exports — the parser initializes them as empty arrays. (A future faction-profile dictionary could populate them, but Phase 1a tracks ownership via CLAIM_PLANET events from any starting state.)

---

## Types (`src/lib/parser/types.ts`)

### Top-level

```ts
interface ParsedGame {
  // Identity
  gameId: string;                         // hash(firstTimestamp + sorted faction IDs)
  playedAt: number;                       // earliest timestamp in log (Unix ms)
  durationSeconds: number;               // from timers.game

  // Setup
  factions: FactionSetup[];
  options: GameOptions;                   // re-exported from ti4_schema.ts
  initialSpeaker: string;                // faction ID (resolved from speaker: mapPosition index)
  rounds: RoundState[];                  // derived from ADVANCE_PHASE snapshots

  // Event arrays (all sorted ascending by timestamp)
  vpEvents: VpEvent[];
  planetEvents: PlanetEvent[];
  techEvents: TechEvent[];
  agendaResolutions: AgendaResolution[];
  strategyCardEvents: StrategyCardEvent[];
  actionCardEvents: ActionCardEvent[];
  componentEvents: ComponentEvent[];
  relicEvents: RelicEvent[];
  leaderEvents: LeaderEvent[];
  objectiveReveals: ObjectiveReveal[];
  speakerEvents: SpeakerEvent[];
  attachmentEvents: AttachmentEvent[];
  allianceEvents: AllianceEvent[];
  promissoryNoteEvents: PromissoryNoteEvent[];
  expeditionEvents: ExpeditionEvent[];
  secondaryEvents: SecondaryEvent[];
  actionEvents: ActionEvent[];           // catch-all for significant actions not covered above

  // Aggregates
  finalScores: Record<string, number>;   // keyed on faction ID
  winner: string | null;                 // faction ID, or null

  // Diagnostics
  timers: GameTimers;
  warnings: string[];                    // unknown objectives, unrecognised actions, etc.
}
```

### Sub-types

```ts
interface FactionSetup {
  factionId: string;
  playerName: string;             // raw string from export; anonymized in UI, never in parser
  color: string;
  mapPosition: number;
  startingTechs: string[];
  startingPlanets: string[];
}

interface GameTimers {
  game: number;                   // total game seconds
  factions: Record<string, number>;    // seconds per faction ID
  secondaries: Record<string, number>; // seconds for secondary activations
  agendas: {
    first: number;
    second: number;
  };
}

interface RoundState {
  round: number;
  phase: string;                  // "strategy" | "action" | "status" | "agenda"
  speaker: string;                // faction ID
  strategyCards: Record<string, string>; // faction ID → strategy card name
}

interface VpEvent {
  faction: string;
  objective: string;
  points: number;                 // negative for UNSCORE
  timestamp: number;
  gameTime?: number;
  source: VpSource;
}

type VpSource =
  | 'score_objective'
  | 'custodians'
  | 'support_for_throne'
  | 'imperial_point'
  | 'relic'
  | 'agenda'
  | 'rider'
  | 'legendary_planet'   // Discordant Stars legendary planet VP (e.g. Styx)
  | 'manual';

interface PlanetEvent {
  faction: string;
  planet: string;
  prevOwner: string | null;
  timestamp: number;
  gameTime?: number;
  type: 'claim' | 'unclaim';
}

interface TechEvent {
  faction: string;
  tech: string;
  timestamp: number;
  gameTime?: number;
  type: 'research' | 'remove' | 'starting';
}

interface AgendaResolution {
  agenda: string;
  outcome: string;
  round: number;
  timestamp: number;
  votes: AgendaVote[];
  riders: AgendaRider[];
}

interface AgendaVote {
  faction: string;
  outcome: string;
  votes: number;
}

interface AgendaRider {
  faction: string;
  rider: string;
  outcome: string;
}

interface StrategyCardEvent {
  faction: string;
  card: string;
  timestamp: number;
  gameTime?: number;
  type: 'pick' | 'play_primary' | 'play_secondary' | 'pass_secondary';
}

interface ActionCardEvent {
  faction: string;
  card: string;
  timestamp: number;
  gameTime?: number;
  type: 'play' | 'discard';
  target?: string;               // faction targeted, if applicable
}

interface ComponentEvent {
  faction: string;
  component: string;             // ability or component action name
  timestamp: number;
  gameTime?: number;
}

interface RelicEvent {
  faction: string;
  relic: string;
  timestamp: number;
  gameTime?: number;
  type: 'gain' | 'play' | 'purge';
}

interface LeaderEvent {
  faction: string;
  leader: string;
  timestamp: number;
  gameTime?: number;
  type: 'unlock' | 'play' | 'exhaust' | 'purge';
}

interface ObjectiveReveal {
  objective: string;
  stage: 'I' | 'II';
  round: number;
  timestamp: number;
}

interface SpeakerEvent {
  prevSpeaker: string;
  newSpeaker: string;
  timestamp: number;
  gameTime?: number;
}

interface AttachmentEvent {
  faction: string | null;        // null if attachment placed on unowned planet
  planet: string;
  attachment: string;
  timestamp: number;
  gameTime?: number;
  type: 'attach' | 'detach';
}

interface AllianceEvent {
  faction1: string;
  faction2: string;
  timestamp: number;
  gameTime?: number;
  type: 'form' | 'break';
}

interface PromissoryNoteEvent {
  fromFaction: string;
  toFaction: string;
  note: string;
  timestamp: number;
  gameTime?: number;
  type: 'play' | 'return';
}

interface ExpeditionEvent {
  faction: string;
  planet: string;
  timestamp: number;
  gameTime?: number;
}

interface SecondaryEvent {
  faction: string;
  strategyCard: string;
  timestamp: number;
  gameTime?: number;
  type: 'follow' | 'abstain';
}

interface ActionEvent {
  faction: string;
  action: string;                // raw action string for unclassified actions
  timestamp: number;
  gameTime?: number;
}
```

---

## Objective Dictionary (`src/lib/parser/objectives.ts`)

Static lookup table keyed on objective name string (exact match, case-sensitive, matching real export strings).

```ts
type ObjectiveStage = 'I' | 'II' | 'secret' | 'support' | 'imperial' | 'agenda' | 'relic' | 'legendary' | 'other';

interface ObjectiveDefinition {
  stage: ObjectiveStage;
  points: number;
}

function getObjectivePoints(name: string): ObjectiveDefinition | null
```

Returns `null` for unknown objectives and appends a warning. The dictionary must cover:
- All 10 Stage I public objectives (base + PoK)
- All 10 Stage II public objectives (base + PoK)
- All secret objectives (base + PoK + Codex)
- Support for the Throne (1 VP)
- Imperial Point (1 VP)
- Custodians Token (1 VP)
- Relic-based objectives (Shard, Crown of Emphidia)
- Agenda objectives (Seed of an Empire, Classified Document Leaks, Political Censure, etc.)
- Discordant Stars / Thunder's Edge objectives if they appear in the real data (determined by discover-data script)
- **Legendary planet VPs (Discordant Stars):** Styx (1 VP while controlled) and any other Discordant Stars legendary planets that grant VP. These are added proactively because they will not appear in the current six game exports. The action type in TI Assistant exports is expected to be `SCORE_OBJECTIVE` with the planet name as the objective string — confirm against live data when a game with Styx is uploaded. Until confirmed, the dictionary entry exists but the action handler notes the uncertainty.

**Source data:** Run `scripts/discover-data.ts` over all six game JSONs to extract every unique `event.objective` string, then cross-reference against the official TI4 + PoK + Codex objective lists.

---

## Reducer (`src/lib/parser/gameReducer.ts`)

```ts
interface ReducerState {
  // All event arrays being built
  vpEvents: VpEvent[];
  planetEvents: PlanetEvent[];
  // ... all other event arrays

  // Live game state needed for stateful decisions
  currentScores: Record<string, number>;
  currentOwners: Record<string, string>;  // planet → faction
  currentRelics: Record<string, string>;  // relic → faction
  currentRound: number;
  currentPhase: string;
  currentSpeaker: string;
  revealedObjectives: string[];

  warnings: string[];
}

type ReducerAction = RawLogEntry; // one entry at a time

function gameReducer(state: ReducerState, entry: RawLogEntry): ReducerState
```

The reducer is a pure function: `(state, entry) => newState`. It is tested by passing hand-crafted `RawLogEntry` arrays through `[initial_state, ...entries].reduce(gameReducer)` and asserting on the final state shape.

**Stateful cases that require reducer approach (not extractors):**
- `SEED_OF_AN_EMPIRE` agenda — VP goes to the faction currently in the lead (read `currentScores`)
- `IMPERIAL_RIDER` — VP target depends on who controls Mecatol Rex at resolution time (read `currentOwners`)
- `SHARD_OF_THE_THRONE` — VP follows relic ownership (read `currentRelics`); lost on purge

---

## Top-Level Parser (`src/lib/parser/parseGame.ts`)

```ts
function parseGame(raw: TI4ExportData): ParsedGame
```

Responsibilities:
1. Sort `raw.actionLog` ascending by `timestamp`
2. Resolve `initialSpeaker` from `raw.speaker` (mapPosition index → faction ID via `raw.factions`)
3. Run the full sorted log through `gameReducer` via `reduce()`
4. Derive `gameId` = stable hash of (firstTimestamp + sorted faction IDs)
5. Derive `finalScores` from the terminal `currentScores` in reducer state
6. Derive `winner` = faction with highest score if ≥ victory-point threshold, else `null`
7. Extract `timers` from `raw.timers`
8. Return `ParsedGame`

`parseGame` is deliberately thin. All event extraction logic lives in `gameReducer.ts`; `parseGame.ts` is orchestration only.

---

## Data Discovery Script (`scripts/discover-data.ts`)

Node.js script (ts-node or tsx). Reads all `*.json` from `app/game-data/`, walks every `actionLog` entry, and emits to stdout:

- **Unique `action` values** — seeds the reducer's action-type switch
- **Unique `event.objective` values** — seeds the objective dictionary
- **Unique tech names** — seeds a future tech dictionary
- **Unique `playerName` values** — sanity check only (never keyed in parser output)
- **Unique agenda names** — seeds agenda resolution logic
- **Unknown objectives** (after comparing against dictionary) — flags coverage gaps

Run once during Phase 1a task execution; output is inspected by the developer to fill in dictionaries.

---

## VP Sources

All VP sources must be covered. Each has a corresponding `VpSource` tag on the emitted `VpEvent`.

| Source | Raw action(s) | Notes |
|--------|--------------|-------|
| Public / Secret objectives | `SCORE_OBJECTIVE`, `UNSCORE_OBJECTIVE` | Dictionary lookup for points |
| Support for the Throne | `SCORE_OBJECTIVE` with objective `"Support for the Throne"` | Already a `SCORE_OBJECTIVE` — no special case needed beyond dictionary entry |
| Imperial Point | `SCORE_OBJECTIVE` with objective `"Imperial Point"` | Same |
| Custodians Token | First `CLAIM_PLANET` on Mecatol Rex | Custom handler; 1 VP |
| Shard of the Throne | `GAIN_RELIC` (1 VP while held), `PLAY_RELIC` / purge (lose 1 VP) | Stateful; tracks relic ownership |
| Crown of Emphidia | `PLAY_RELIC` | 1 VP on play |
| Agenda VPs | `RESOLVE_AGENDA` for Mutiny, Seed of an Empire, Classified Document Leaks, Political Censure, Crown of Thalnos, etc. | Seed of an Empire requires `currentScores` |
| Imperial Rider | `PLAY_RIDER` with outcome matching Mecatol Rex controller | Requires `currentOwners` |
| Other riders | `PLAY_RIDER` | Non-VP riders emitted as `AgendaRider`, not `VpEvent` |
| Legendary planet VPs (DS) | `SCORE_OBJECTIVE` with planet name (expected) | Styx = 1 VP while controlled. Action type unconfirmed — no current game exports contain Styx. Dictionary entry added proactively; handler emits a `VpEvent` with `source: 'legendary_planet'` and logs a warning if action format differs. |

`UNSCORE_OBJECTIVE` emits a `VpEvent` with negative `points`. All VP reversal logic is handled in the reducer by emitting negated events rather than mutating prior events — this preserves the full VP timeline for the replay chart.

---

## Acceptance Bar (Phase 1a)

1. `npm run typecheck` passes with zero errors
2. `npm run lint` passes with zero errors
3. `npm test` passes — all tests green
4. Coverage: `src/lib/**` ≥ 90 % lines
5. All six game JSON files can be passed to `parseGame()` without throwing
6. `vpEvents` and `finalScores` are non-empty for all six games
7. `agendaResolutions` includes full vote data for games with agenda phase
8. Every VP source in the table above has at least one test (including the negation case)
9. `warnings[]` is non-empty when the game log contains an unrecognised objective

**Not in Phase 1a acceptance:** exact `finalScores` match against the actual recorded outcome (that gating test requires all VP sources confirmed against real data and runs in Phase 1 combined acceptance after Phase 1b).

---

## Open Questions (Resolved)

| Question | Resolution |
|---------|-----------|
| Component action cards tracked? | Yes — `componentEvents` array |
| Strategy Phase decisions tracked? | Yes — `strategyCardEvents` with `type: 'pick'` |
| Secondary follows/abstains tracked? | Yes — `secondaryEvents` |
| Alliances (Discordant Stars) tracked? | Yes — `allianceEvents` |
| Expeditions tracked? | Yes — `expeditionEvents` |
| Leader plays/exhausts tracked? | Yes — `leaderEvents` |
| Riders appear as VP or agenda sub-events? | Non-VP riders go into `AgendaRider[]` inside `AgendaResolution`; VP-granting riders emit a `VpEvent` |
| `gameTime` always present? | No — optional. Some entries omit it. `timestamp` is always present and is used as the sort key. |
| `speaker` field in raw export | `speaker: mapPosition` (integer index). Resolved to faction ID via `factions` array at parse time. |
| Styx / legendary planet VPs | Styx (Discordant Stars) grants 1 VP while controlled. Added proactively to dictionary (`stage: 'legendary'`, 1 VP). Expected action is `SCORE_OBJECTIVE` with objective `"Styx"` — to be confirmed against live data. Other DS legendary-planet VP sources should be audited when those games are available. |
