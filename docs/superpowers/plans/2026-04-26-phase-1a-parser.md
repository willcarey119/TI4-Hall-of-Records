# Phase 1a — Parser Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure TypeScript parsing layer that converts TI Assistant JSON exports into a fully-typed `ParsedGame` object, covering all VP sources and every tracked event type.

**Architecture:** A single-pass stateful reducer (`gameReducer.ts`) walks the sorted action log once, accumulating all event arrays and live game state simultaneously. A thin top-level `parseGame()` seeds the initial state, runs the reducer, and assembles the final `ParsedGame`. All parser code is pure functions — no React, no I/O, no side effects.

**Tech Stack:** TypeScript ~6.0 · Vitest ^4 · tsx (script runner) · zero runtime dependencies in the parser layer

---

## Schema Findings (added after Task 0 — IMPORTANT, READ FIRST)

The discover-data script (Task 0) revealed the real TI Assistant export schema and corrected several assumptions in the original plan. **Implementers must apply these corrections in their respective tasks.**

### Top-level wrapped structure

```jsonc
{
  "data": {
    "factions": [{ "id": "Vaden Banking Clans", "playerName": "KP", "color": "Black" }, …],
    "speaker": 0,                    // mapPosition index, not faction id
    "options": { "victory-points": 12, "expansions": ["POK","CODEX ONE",…] }
  },
  "timers": { "game": 26979, "Vaden Banking Clans": 2737, …, "lastUpdate": … },
  "actionLog": [
    { "timestampMillis": 1737328465900,
      "data": { "action": "END_GAME", "event": {}, "timestamp": 1737328464818 },
      "gameSeconds": 26979 },
    …
  ]
}
```

`actionLog` is reverse-chronological. `parseGame` (Task 13) extracts and sorts.

### Faction objects in real data

Real factions only have `{ id, playerName, color }`. The `FactionSetup` interface keeps `mapPosition` (derived from array index), `startingTechs: []`, and `startingPlanets: []` for forward compatibility, but parsers must NOT expect those last two from the export.

### Real action names + payload shapes

Several action names in the original plan were guessed wrong. The real names and payload shapes are below. **When implementing Tasks 4–12, use these exact strings and field names.**

| Action | Real payload shape | Notes |
|--------|-------------------|-------|
| `SCORE_OBJECTIVE` | `{ faction, objective, key? }` | `key` is the giver of "Support for the Throne" (the faction granting the support) |
| `UNSCORE_OBJECTIVE` | `{ faction, objective, key? }` | Mirror of SCORE |
| `CLAIM_PLANET` | `{ faction, planet, prevOwner? }` | Custodians = first claim of `Mecatol Rex` |
| `UNCLAIM_PLANET` | `{ faction, planet }` | |
| `GAIN_RELIC` | `{ faction, relic }` | Shard of the Throne emits +1 VpEvent |
| `PLAY_RELIC` | `{ relic, tech? }` | **No `faction` field** — derive from `currentRelics[relic]`. Crown of Emphidia emits +1 VpEvent. |
| `LOSE_RELIC` | `{ faction, relic }` | (replaces planned `PURGE_RELIC`) Shard of the Throne emits -1 VpEvent |
| `RESOLVE_AGENDA` | `{ agenda, target }` | `target` is the outcome string. **No votes/riders array** — votes come from preceding `CAST_VOTES` events. |
| `REVEAL_AGENDA` | `{ agenda? }` | Marks start of voting cycle for an agenda |
| `REPEAL_AGENDA` | `{ agenda? }` | A passed law being repealed |
| `HIDE_AGENDA` | `{ agenda? }` | UNDO/cancellation pair |
| `CAST_VOTES` | `{ faction, votes, extraVotes, target }` | Aggregate between REVEAL_AGENDA and RESOLVE_AGENDA into the AgendaResolution |
| `START_VOTING` | `{}` | Phase marker |
| `SELECT_ELIGIBLE_OUTCOMES` | (varies) | Track only the agenda choice; ignore for VP |
| `SPEAKER_TIE_BREAK` | (varies) | Speaker breaks vote ties |
| `PLAY_RIDER` | `{ rider, faction, outcome }` | Imperial Rider VP — read `currentOwners['Mecatol Rex']` |
| `ASSIGN_STRATEGY_CARD` | `{ assignedTo, id, pickedBy }` | (replaces planned `PICK_STRATEGY_CARD`) `id` is card name; `assignedTo` is the recipient faction |
| `MARK_PRIMARY` | `{ faction, state }` | `state` ∈ `DONE`/`SKIPPED` (rare). Maps to StrategyCardEvent `play_primary` (DONE) or skipped variant. |
| `MARK_SECONDARY` | `{ faction, state }` | `state` `DONE` → `follow`; `SKIPPED` → `abstain`. (replaces planned `FOLLOW_SECONDARY`/`ABSTAIN_SECONDARY`) |
| `SET_SPEAKER` | `{ newSpeaker, prevSpeaker }` | (replaces planned `CHANGE_SPEAKER`) |
| `UPDATE_LEADER_STATE` | `{ leaderId, state, prevState }` | Single action covers all leader state changes. Map state values to LeaderEvent type: `readied` (after locked) → `'unlock'`; `exhausted` → `'exhaust'`; `purged` → `'purge'`; other transitions → `'play'`. |
| `ADD_ATTACHMENT` | `{ attachment, planet }` | **No `faction` field** — derive from `currentOwners[planet]` (may be `null`) |
| `GAIN_ALLIANCE` | `{ faction, fromFaction }` | (replaces planned `FORM_ALLIANCE`) |
| `COMMIT_TO_EXPEDITION` | `{ expedition, factionId }` | (replaces planned `EXPEDITION`) `expedition` ∈ `influence`/`resources`/`techSkip`/etc. — store as `planet` field of `ExpeditionEvent` (the type slot exists; expedition kind is the value) |
| `ADD_TECH`, `REMOVE_TECH`, `CHOOSE_STARTING_TECH`, `PURGE_TECH` | `{ faction, tech }` | `PURGE_TECH` was not in the original plan — emit as `TechEvent` with `type: 'remove'` and a warning, OR add a `'purge'` type variant. |
| `PLAY_PROMISSORY_NOTE` | `{ card, target }` | **No `fromFaction`/`note` fields** — `card` is the note name; `target` is the recipient faction; the giving faction is implicit (the current turn faction). |
| `PLAY_ACTION_CARD` | `{ card, target? }` | **No `faction` field** — use the current turn faction (track via END_TURN events) |
| `PLAY_COMPONENT` | `{ name, factionId }` | Field is `factionId` (not `faction`) and `name` (not `component`). |
| `REVEAL_OBJECTIVE` | `{ objective }` | **No `stage` field** — look up the stage from the objectives dictionary |
| `ADVANCE_PHASE` | `{ skipAgenda, factions: { [id]: { …faction snapshot… } } }` | **No explicit `round` or `phase` fields.** Track round/phase by counting ADVANCE_PHASE events sequentially: phases cycle Strategy → Action → Status → (Agenda) → Strategy (next round). |
| `END_TURN` | `{ prevFaction, selectedAction, secondaries }` | Use `prevFaction` to update `currentTurnFaction` for next `SELECT_ACTION` |
| `SELECT_ACTION` | `{ action }` | Track `currentTurnFaction` going INTO this action — set when SELECT_ACTION fires after END_TURN. The faction is whoever wasn't `prevFaction` last; in practice we track via END_TURN events. |
| `END_GAME` | `{}` | Marks game end |
| `UNPASS` | `{ faction? }` | Undo a pass — minor |
| `SWAP_MAP_TILES`, `SWAP_STRATEGY_CARDS` | (varies) | Setup adjustments — emit as `actionEvents` catch-all |
| `CHOOSE_SUB_FACTION` | `{ subFaction, factionId? }` | Discordant Stars sub-faction pick |
| `SELECT_SUB_AGENDA`, `SELECT_SUB_COMPONENT` | (varies) | Sub-selections — emit as `actionEvents` catch-all |
| `PLAY_ADJUDICATOR_BAAL` | (varies) | Discordant Stars specific — emit as `actionEvents` catch-all |

### Reducer state additions

The reducer needs a small additional piece of state to handle the implicit-faction events:

```ts
interface ReducerState {
  // … existing fields
  currentTurnFaction: string;              // updated by END_TURN.prevFaction
  pendingAgenda: string | null;            // set by REVEAL_AGENDA, cleared by RESOLVE_AGENDA
  pendingVotes: AgendaVote[];              // accumulates from CAST_VOTES, drained at RESOLVE_AGENDA
  pendingRiders: AgendaRider[];            // accumulates from PLAY_RIDER, drained at RESOLVE_AGENDA
}
```

`createInitialState` should add `currentTurnFaction: ''`, `pendingAgenda: null`, `pendingVotes: []`, `pendingRiders: []`.

### "Imperial Point" / "Custodians Token" not in objective list

The 60 real objective strings do NOT include "Imperial Point" or "Custodians Token". Conclusions:

- **Custodians Token** — handled by the first `CLAIM_PLANET` on `Mecatol Rex` (matches the spec design). No dictionary entry needed for it as an objective key, but `getObjectivePoints('Custodians Token')` still returns `{ stage: 'other', points: 1 }` for use in the `VpEvent.objective` field.
- **Imperial Point** — does not appear as a SCORE_OBJECTIVE objective name in any of the 6 exports. The Imperial primary VP may surface differently (possibly as a regular SCORE_OBJECTIVE with a normal Stage I/II objective name when scoring early via Imperial primary). Phase 1a will not emit a separate "Imperial Point" VpEvent. Re-investigate during Phase 1 combined acceptance if scores don't match.

---

## File Map

All paths relative to `D:\_TI4 App\app\`.

| File | Status | Responsibility |
|------|--------|----------------|
| `scripts/discover-data.ts` | Create | Walk game-data JSONs, emit unique actions / objectives / techs / agendas |
| `src/lib/parser/types.ts` | Create | All exported TypeScript interfaces — zero runtime code |
| `src/lib/parser/objectives.ts` | Create | `getObjectivePoints(name)` dictionary lookup |
| `src/lib/parser/gameReducer.ts` | Create | Single-pass stateful reducer + `createInitialState` |
| `src/lib/parser/parseGame.ts` | Create | Top-level orchestrator: `unknown → ParsedGame` |
| `src/lib/parser/__tests__/objectives.test.ts` | Create | Tests for objective dictionary |
| `src/lib/parser/__tests__/gameReducer.test.ts` | Create | Tests for reducer logic (grows across Tasks 3–12) |
| `src/lib/parser/__tests__/parseGame.test.ts` | Create | Tests for top-level parser |
| `src/lib/parser/__tests__/parseGame.integration.test.ts` | Create | Smoke test all 6 real game exports |
| `package.json` | Modify | Add `tsx` dev dep + `discover` script |
| `vitest.config.ts` | Modify | Raise coverage thresholds to 90 % (Task 14) |

---

## Task 0: Data Discovery Script

**Files:**
- Modify: `package.json`
- Create: `scripts/discover-data.ts`

- [ ] **Step 1: Add tsx and discover script to package.json**

In `package.json`, add `"tsx": "^4.0.0"` to `devDependencies` and add the `discover` script:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint src",
  "lint:fix": "eslint src --fix",
  "format": "prettier --write src",
  "typecheck": "tsc --noEmit",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "discover": "tsx scripts/discover-data.ts"
},
```

- [ ] **Step 2: Create scripts/discover-data.ts**

```ts
// scripts/discover-data.ts
// Run with: npm run discover
// Walks all game-data JSON exports and emits every unique action name,
// objective string, tech name, and agenda name to stdout.
// Use the output to seed and verify the objectives dictionary in Task 2.

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const GAME_DATA = join(process.cwd(), 'game-data');

const actions = new Set<string>();
const objectives = new Set<string>();
const techs = new Set<string>();
const agendas = new Set<string>();
const players = new Set<string>();

const files = readdirSync(GAME_DATA).filter((f) => f.endsWith('.json'));
console.log(`Reading ${files.length} files from ${GAME_DATA}\n`);

for (const file of files) {
  const data = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));

  if (Array.isArray(data.factions)) {
    for (const f of data.factions) {
      if (typeof f.playerName === 'string') players.add(f.playerName);
    }
  }

  if (Array.isArray(data.actionLog)) {
    for (const entry of data.actionLog) {
      if (typeof entry.action === 'string') actions.add(entry.action);
      if (typeof entry.event?.objective === 'string') objectives.add(entry.event.objective);
      if (typeof entry.event?.tech === 'string') techs.add(entry.event.tech);
      if (typeof entry.event?.agenda === 'string') agendas.add(entry.event.agenda);
    }
  }
}

const print = (title: string, set: Set<string>) => {
  console.log(`=== ${title} (${set.size}) ===`);
  [...set].sort().forEach((s) => console.log(`  ${s}`));
  console.log();
};

print('ACTIONS', actions);
print('OBJECTIVES', objectives);
print('TECHS', techs);
print('AGENDAS', agendas);
print('PLAYER NAMES', players);
```

- [ ] **Step 3: Install and run**

```bash
npm install
npm run discover
```

Expected: output lists several dozen actions, all objective name strings from real game data, tech names, agenda names. **Copy the OBJECTIVES section output to a scratch note — you will need it in Task 2.**

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json scripts/discover-data.ts
git commit -m "feat: add discover-data script and tsx dev dependency"
```

---

## Task 1: Types File

**Files:**
- Create: `src/lib/parser/types.ts`

- [ ] **Step 1: Create src/lib/parser/types.ts**

```ts
// src/lib/parser/types.ts
// All exported TypeScript interfaces for the ParsedGame output contract.
// Zero runtime code — pure type definitions.

export type VpSource =
  | 'score_objective'
  | 'custodians'
  | 'support_for_throne'
  | 'imperial_point'
  | 'relic'
  | 'agenda'
  | 'rider'
  | 'legendary_planet' // e.g. Styx (Discordant Stars)
  | 'manual';

export type ObjectiveStage =
  | 'I'
  | 'II'
  | 'secret'
  | 'support'
  | 'imperial'
  | 'agenda'
  | 'relic'
  | 'legendary'
  | 'other';

/** Corrected raw log entry shape. The ti4_schema.ts ActionLogEntry is wrong —
 *  actual TI Assistant exports use this flat structure. */
export interface RawLogEntry {
  action: string;
  event: Record<string, unknown>;
  timestamp: number;
  gameTime?: number;
}

export interface FactionSetup {
  factionId: string;
  playerName: string; // anonymized in UI; never keyed in aggregates
  color: string;
  mapPosition: number;
  startingTechs: string[];
  startingPlanets: string[];
}

export interface GameTimers {
  game: number;
  factions: Record<string, number>;
  secondaries: Record<string, number>;
  agendas: { first: number; second: number };
}

export interface RoundState {
  round: number;
  phase: string; // 'strategy' | 'action' | 'status' | 'agenda' — tighten after discover-data confirms values
  speaker: string; // faction ID
  strategyCards: Record<string, string>; // faction ID → card name
}

export interface VpEvent {
  faction: string;
  objective: string;
  points: number; // negative for UNSCORE / VP loss
  timestamp: number;
  gameTime?: number;
  source: VpSource;
}

export interface PlanetEvent {
  faction: string;
  planet: string;
  prevOwner: string | null;
  timestamp: number;
  gameTime?: number;
  type: 'claim' | 'unclaim';
}

export interface TechEvent {
  faction: string;
  tech: string;
  timestamp: number;
  gameTime?: number;
  type: 'research' | 'remove' | 'starting';
}

export interface AgendaVote {
  faction: string;
  outcome: string;
  votes: number;
}

export interface AgendaRider {
  faction: string;
  rider: string;
  outcome: string;
}

export interface AgendaResolution {
  agenda: string;
  outcome: string;
  round: number;
  timestamp: number;
  votes: AgendaVote[];
  riders: AgendaRider[];
}

export interface StrategyCardEvent {
  faction: string;
  card: string;
  timestamp: number;
  gameTime?: number;
  type: 'pick' | 'play_primary' | 'play_secondary' | 'pass_secondary';
}

export interface ActionCardEvent {
  faction: string;
  card: string;
  timestamp: number;
  gameTime?: number;
  type: 'play' | 'discard';
  target?: string;
}

export interface ComponentEvent {
  faction: string;
  component: string;
  timestamp: number;
  gameTime?: number;
}

export interface RelicEvent {
  faction: string;
  relic: string;
  timestamp: number;
  gameTime?: number;
  type: 'gain' | 'play' | 'purge';
}

export interface LeaderEvent {
  faction: string;
  leader: string;
  timestamp: number;
  gameTime?: number;
  type: 'unlock' | 'play' | 'exhaust' | 'purge';
}

export interface ObjectiveReveal {
  objective: string;
  stage: 'I' | 'II';
  round: number;
  timestamp: number;
}

export interface SpeakerEvent {
  prevSpeaker: string;
  newSpeaker: string;
  timestamp: number;
  gameTime?: number;
}

export interface AttachmentEvent {
  faction: string | null;
  planet: string;
  attachment: string;
  timestamp: number;
  gameTime?: number;
  type: 'attach' | 'detach';
}

export interface AllianceEvent {
  faction1: string;
  faction2: string;
  timestamp: number;
  gameTime?: number;
  type: 'form' | 'break';
}

export interface PromissoryNoteEvent {
  fromFaction: string;
  toFaction: string;
  note: string;
  timestamp: number;
  gameTime?: number;
  type: 'play' | 'return';
}

export interface ExpeditionEvent {
  faction: string;
  planet: string;
  timestamp: number;
  gameTime?: number;
}

export interface SecondaryEvent {
  faction: string;
  strategyCard: string;
  timestamp: number;
  gameTime?: number;
  type: 'follow' | 'abstain';
}

export interface ActionEvent {
  faction: string;
  action: string;
  timestamp: number;
  gameTime?: number;
}

export interface ParsedGame {
  // Identity
  gameId: string;
  playedAt: number;
  durationSeconds: number;
  // Setup
  factions: FactionSetup[];
  options: Record<string, unknown>;
  initialSpeaker: string;
  rounds: RoundState[];
  // Event arrays — all sorted ascending by timestamp
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
  actionEvents: ActionEvent[];
  // Aggregates
  finalScores: Record<string, number>;
  winner: string | null;
  // Diagnostics
  timers: GameTimers;
  warnings: string[];
}
```

- [ ] **Step 2: Verify it typechecks**

```bash
npm run typecheck
```

Expected: zero errors.

- [ ] **Step 3: Create the __tests__ directory**

```bash
mkdir -p src/lib/parser/__tests__
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/parser/types.ts
git commit -m "feat: add parser types.ts with ParsedGame and all sub-interfaces"
```

---

## Task 2: Objective Dictionary

**Files:**
- Create: `src/lib/parser/objectives.ts`
- Create: `src/lib/parser/__tests__/objectives.test.ts`

- [ ] **Step 1: Write the failing tests first**

```ts
// src/lib/parser/__tests__/objectives.test.ts
import { describe, it, expect } from 'vitest';
import { getObjectivePoints } from '../objectives';

describe('getObjectivePoints', () => {
  describe('Stage I public objectives', () => {
    it('returns 1 VP for "Lead from the Front"', () => {
      expect(getObjectivePoints('Lead from the Front')).toEqual({ stage: 'I', points: 1 });
    });
    it('returns 1 VP for "Expand Borders"', () => {
      expect(getObjectivePoints('Expand Borders')).toEqual({ stage: 'I', points: 1 });
    });
  });

  describe('Stage II public objectives', () => {
    it('returns 2 VP for "Construct Massive Cities"', () => {
      expect(getObjectivePoints('Construct Massive Cities')).toEqual({ stage: 'II', points: 2 });
    });
  });

  describe('secret objectives', () => {
    it('returns 1 VP for "Become a Martyr"', () => {
      expect(getObjectivePoints('Become a Martyr')).toEqual({ stage: 'secret', points: 1 });
    });
  });

  describe('special VP sources', () => {
    it('returns 1 VP for "Support for the Throne"', () => {
      expect(getObjectivePoints('Support for the Throne')).toEqual({ stage: 'support', points: 1 });
    });
    it('returns 1 VP for "Imperial Point"', () => {
      expect(getObjectivePoints('Imperial Point')).toEqual({ stage: 'imperial', points: 1 });
    });
    it('returns 1 VP for "Custodians Token"', () => {
      expect(getObjectivePoints('Custodians Token')).toEqual({ stage: 'other', points: 1 });
    });
    it('returns 1 VP for "Shard of the Throne"', () => {
      expect(getObjectivePoints('Shard of the Throne')).toEqual({ stage: 'relic', points: 1 });
    });
    it('returns 1 VP for "Crown of Emphidia"', () => {
      expect(getObjectivePoints('Crown of Emphidia')).toEqual({ stage: 'relic', points: 1 });
    });
    it('returns 1 VP for "Styx" (Discordant Stars legendary planet)', () => {
      expect(getObjectivePoints('Styx')).toEqual({ stage: 'legendary', points: 1 });
    });
  });

  describe('unknown objectives', () => {
    it('returns null for an unrecognised string', () => {
      expect(getObjectivePoints('This Objective Does Not Exist XYZ')).toBeNull();
    });
    it('is case-sensitive', () => {
      expect(getObjectivePoints('lead from the front')).toBeNull();
      expect(getObjectivePoints('LEAD FROM THE FRONT')).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- src/lib/parser/__tests__/objectives.test.ts
```

Expected: FAIL — `Cannot find module '../objectives'`.

- [ ] **Step 3: Implement objectives.ts**

The dictionary below is the **complete, classified list of every objective string discovered in the 6 real game exports** (Task 0), cross-referenced against the official TI4 + PoK wiki. Use it verbatim — do not guess additional entries.

```ts
// src/lib/parser/objectives.ts
import type { ObjectiveStage } from './types';

export interface ObjectiveDefinition {
  stage: ObjectiveStage;
  points: number;
}

/**
 * Static dictionary of objectives known to appear in TI Assistant exports.
 * Keys are EXACT strings as they appear in real game data (case-sensitive).
 * Built from the Task 0 discover-data output (60 unique objective strings)
 * cross-referenced with the official TI4 wiki classifications.
 */
const OBJECTIVES: Record<string, ObjectiveDefinition> = {
  // ── Stage I Public — Base TI4 (1 VP) ──────────────────────────────────
  'Corner the Market': { stage: 'I', points: 1 },
  'Develop Weaponry': { stage: 'I', points: 1 },
  'Diversify Research': { stage: 'I', points: 1 },
  'Erect a Monument': { stage: 'I', points: 1 },
  'Expand Borders': { stage: 'I', points: 1 },
  'Found Research Outposts': { stage: 'I', points: 1 },
  'Intimidate Council': { stage: 'I', points: 1 },
  'Lead from the Front': { stage: 'I', points: 1 },
  'Negotiate Trade Routes': { stage: 'I', points: 1 },
  'Sway the Council': { stage: 'I', points: 1 },

  // ── Stage I Public — PoK (1 VP) ───────────────────────────────────────
  'Amass Wealth': { stage: 'I', points: 1 },
  'Build Defenses': { stage: 'I', points: 1 },
  'Discover Lost Outposts': { stage: 'I', points: 1 },
  'Engineer a Marvel': { stage: 'I', points: 1 },
  'Populate the Outer Rim': { stage: 'I', points: 1 },
  'Push Boundaries': { stage: 'I', points: 1 },

  // ── Stage II Public — Base TI4 (2 VP) ─────────────────────────────────
  'Centralize Galactic Trade': { stage: 'II', points: 2 },
  'Conquer the Weak': { stage: 'II', points: 2 },
  'Form Galactic Brain Trust': { stage: 'II', points: 2 },
  'Found a Golden Age': { stage: 'II', points: 2 },
  'Master the Sciences': { stage: 'II', points: 2 },
  'Revolutionize Warfare': { stage: 'II', points: 2 },
  'Subdue the Galaxy': { stage: 'II', points: 2 },
  'Unify the Colonies': { stage: 'II', points: 2 },

  // ── Stage II Public — PoK (2 VP) ──────────────────────────────────────
  'Command an Armada': { stage: 'II', points: 2 },
  'Construct Massive Cities': { stage: 'II', points: 2 },
  'Rule Distant Lands': { stage: 'II', points: 2 },

  // ── Secret — Action Phase, Base TI4 (1 VP) ────────────────────────────
  'Destroy Their Greatest Ship': { stage: 'secret', points: 1 },
  'Make an Example of Their World': { stage: 'secret', points: 1 },
  'Spark a Rebellion': { stage: 'secret', points: 1 },
  'Turn Their Fleets to Dust': { stage: 'secret', points: 1 },
  'Unveil Flagship': { stage: 'secret', points: 1 },

  // ── Secret — Action Phase, PoK (1 VP) ─────────────────────────────────
  'Betray a Friend': { stage: 'secret', points: 1 },
  'Brave the Void': { stage: 'secret', points: 1 },
  'Demonstrate Your Power': { stage: 'secret', points: 1 },
  'Prove Endurance': { stage: 'secret', points: 1 },

  // ── Secret — Status Phase, Base TI4 (1 VP) ────────────────────────────
  'Adapt New Strategies': { stage: 'secret', points: 1 },
  'Control the Region': { stage: 'secret', points: 1 },
  'Cut Supply Lines': { stage: 'secret', points: 1 },
  'Establish a Perimeter': { stage: 'secret', points: 1 },
  'Form a Spy Network': { stage: 'secret', points: 1 },
  'Fuel the War Machine': { stage: 'secret', points: 1 },
  'Gather a Mighty Fleet': { stage: 'secret', points: 1 },
  'Learn the Secrets of the Cosmos': { stage: 'secret', points: 1 },
  'Master the Laws of Physics': { stage: 'secret', points: 1 },
  'Monopolize Production': { stage: 'secret', points: 1 },
  'Occupy the Seat of the Empire': { stage: 'secret', points: 1 },
  'Threaten Enemies': { stage: 'secret', points: 1 },

  // ── Secret — Status Phase, PoK (1 VP) ─────────────────────────────────
  'Destroy Heretical Works': { stage: 'secret', points: 1 },
  'Establish Hegemony': { stage: 'secret', points: 1 },
  'Foster Cohesion': { stage: 'secret', points: 1 },
  'Hoard Raw Materials': { stage: 'secret', points: 1 },
  'Mechanize the Military': { stage: 'secret', points: 1 },
  'Occupy the Fringe': { stage: 'secret', points: 1 },
  'Produce En Masse': { stage: 'secret', points: 1 },
  'Seize an Icon': { stage: 'secret', points: 1 },
  'Stake your Claim': { stage: 'secret', points: 1 },
  'Strengthen Bonds': { stage: 'secret', points: 1 },

  // ── Secret — Agenda Phase, PoK (1 VP) ─────────────────────────────────
  'Dictate Policy': { stage: 'secret', points: 1 },
  'Drive the Debate': { stage: 'secret', points: 1 },

  // ── Special VP Sources ────────────────────────────────────────────────
  'Support for the Throne': { stage: 'support', points: 1 },
  'Custodians Token': { stage: 'other', points: 1 },        // emitted by reducer for Mecatol first claim
  'Shard of the Throne': { stage: 'relic', points: 1 },     // emitted by reducer on GAIN_RELIC
  'Crown of Emphidia': { stage: 'relic', points: 1 },       // emitted by reducer on PLAY_RELIC
  'Imperial Rider': { stage: 'agenda', points: 1 },         // emitted by reducer on PLAY_RIDER

  // ── Discordant Stars (proactively added; not yet seen in 6 exports) ──
  'Styx': { stage: 'legendary', points: 1 },
};

/** Returns the definition for a known objective, or null if unrecognised.
 *  Caller is responsible for appending a warning when null is returned. */
export function getObjectivePoints(name: string): ObjectiveDefinition | null {
  return OBJECTIVES[name] ?? null;
}
```

**Update the test file** to also assert on a few additional confirmed entries. Add to `objectives.test.ts`:

```ts
  describe('additional real-data entries', () => {
    it('returns Stage I, 1 VP for "Sway the Council" (Base)', () => {
      expect(getObjectivePoints('Sway the Council')).toEqual({ stage: 'I', points: 1 });
    });
    it('returns Stage I, 1 VP for "Amass Wealth" (PoK)', () => {
      expect(getObjectivePoints('Amass Wealth')).toEqual({ stage: 'I', points: 1 });
    });
    it('returns secret, 1 VP for "Dictate Policy" (Agenda Phase secret, NOT Stage II)', () => {
      expect(getObjectivePoints('Dictate Policy')).toEqual({ stage: 'secret', points: 1 });
    });
    it('returns secret, 1 VP for "Establish Hegemony" (Status Phase secret, NOT Stage II)', () => {
      expect(getObjectivePoints('Establish Hegemony')).toEqual({ stage: 'secret', points: 1 });
    });
  });
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- src/lib/parser/__tests__/objectives.test.ts
```

Expected: all tests GREEN.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/parser/objectives.ts src/lib/parser/__tests__/objectives.test.ts
git commit -m "feat: add objective dictionary with getObjectivePoints"
```

---

## Task 3: Reducer Scaffold

**Files:**
- Create: `src/lib/parser/gameReducer.ts`
- Create: `src/lib/parser/__tests__/gameReducer.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/parser/__tests__/gameReducer.test.ts
import { describe, it, expect } from 'vitest';
import { createInitialState, gameReducer } from '../gameReducer';
import type { FactionSetup, RawLogEntry } from '../types';

// ── Test helpers ──────────────────────────────────────────────────────────
export function makeEntry(
  action: string,
  event: Record<string, unknown>,
  timestamp = 1000,
): RawLogEntry {
  return { action, event, timestamp };
}

export function makeFaction(factionId: string, startingPlanets: string[] = []): FactionSetup {
  return {
    factionId,
    playerName: 'Player',
    color: 'blue',
    mapPosition: 0,
    startingTechs: [],
    startingPlanets,
  };
}

export function reduce(
  entries: RawLogEntry[],
  factions: FactionSetup[] = [],
) {
  return entries.reduce(gameReducer, createInitialState(factions));
}

// ── Tests ─────────────────────────────────────────────────────────────────
describe('createInitialState', () => {
  it('initialises zero scores for each faction', () => {
    const state = createInitialState([makeFaction('barony'), makeFaction('arborec')]);
    expect(state.currentScores).toEqual({ barony: 0, arborec: 0 });
  });

  it('seeds currentOwners from startingPlanets', () => {
    const state = createInitialState([makeFaction('barony', ['Lazar', 'Sakulag'])]);
    expect(state.currentOwners['Lazar']).toBe('barony');
    expect(state.currentOwners['Sakulag']).toBe('barony');
  });

  it('starts with empty event arrays', () => {
    const state = createInitialState([]);
    expect(state.vpEvents).toHaveLength(0);
    expect(state.planetEvents).toHaveLength(0);
  });
});

describe('gameReducer — unknown action', () => {
  it('appends a warning and does not throw', () => {
    const result = reduce([makeEntry('COMPLETELY_UNKNOWN_XYZ', {})]);
    expect(result.warnings).toContain('Unknown action: COMPLETELY_UNKNOWN_XYZ');
  });

  it('does not emit any events for unknown action', () => {
    const result = reduce([makeEntry('COMPLETELY_UNKNOWN_XYZ', {})]);
    expect(result.vpEvents).toHaveLength(0);
    expect(result.planetEvents).toHaveLength(0);
  });

  it('handles empty log without error', () => {
    const result = reduce([]);
    expect(result.warnings).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- src/lib/parser/__tests__/gameReducer.test.ts
```

Expected: FAIL — `Cannot find module '../gameReducer'`.

- [ ] **Step 3: Create gameReducer.ts**

```ts
// src/lib/parser/gameReducer.ts
import type {
  RawLogEntry,
  FactionSetup,
  VpEvent,
  PlanetEvent,
  TechEvent,
  AgendaResolution,
  StrategyCardEvent,
  ActionCardEvent,
  ComponentEvent,
  RelicEvent,
  LeaderEvent,
  ObjectiveReveal,
  SpeakerEvent,
  AttachmentEvent,
  AllianceEvent,
  PromissoryNoteEvent,
  ExpeditionEvent,
  SecondaryEvent,
  ActionEvent,
  RoundState,
} from './types';

export interface ReducerState {
  // Event arrays
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
  actionEvents: ActionEvent[];
  rounds: RoundState[];
  // Live game state
  currentScores: Record<string, number>;
  currentOwners: Record<string, string>;   // planet → faction ID
  currentRelics: Record<string, string>;   // relic name → faction ID
  currentRound: number;
  currentPhase: string;
  currentSpeaker: string;
  revealedObjectives: string[];
  custodiansTaken: boolean;
  warnings: string[];
}

export function createInitialState(factions: FactionSetup[]): ReducerState {
  const currentScores: Record<string, number> = {};
  const currentOwners: Record<string, string> = {};
  for (const faction of factions) {
    currentScores[faction.factionId] = 0;
    for (const planet of faction.startingPlanets) {
      currentOwners[planet] = faction.factionId;
    }
  }
  return {
    vpEvents: [],
    planetEvents: [],
    techEvents: [],
    agendaResolutions: [],
    strategyCardEvents: [],
    actionCardEvents: [],
    componentEvents: [],
    relicEvents: [],
    leaderEvents: [],
    objectiveReveals: [],
    speakerEvents: [],
    attachmentEvents: [],
    allianceEvents: [],
    promissoryNoteEvents: [],
    expeditionEvents: [],
    secondaryEvents: [],
    actionEvents: [],
    rounds: [],
    currentScores,
    currentOwners,
    currentRelics: {},
    currentRound: 1,
    currentPhase: 'strategy',
    currentSpeaker: '',
    revealedObjectives: [],
    custodiansTaken: false,
    warnings: [],
  };
}

export function gameReducer(state: ReducerState, entry: RawLogEntry): ReducerState {
  switch (entry.action) {
    // Cases added in Tasks 4–12
    default:
      return {
        ...state,
        warnings: [...state.warnings, `Unknown action: ${entry.action}`],
      };
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- src/lib/parser/__tests__/gameReducer.test.ts
```

Expected: all GREEN.

- [ ] **Step 5: Commit**

```bash
git add src/lib/parser/gameReducer.ts src/lib/parser/__tests__/gameReducer.test.ts
git commit -m "feat: add reducer scaffold with createInitialState and unknown-action warning"
```

---

## Task 4: SCORE_OBJECTIVE + UNSCORE_OBJECTIVE

**Files:**
- Modify: `src/lib/parser/gameReducer.ts`
- Modify: `src/lib/parser/__tests__/gameReducer.test.ts`

- [ ] **Step 1: Append failing tests to gameReducer.test.ts**

Add the following `describe` block at the bottom of the existing test file (do not remove existing tests):

```ts
describe('gameReducer — SCORE_OBJECTIVE', () => {
  it('emits a VpEvent with correct fields', () => {
    const result = reduce([
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Imperial Point' }, 2000),
    ], [makeFaction('barony')]);
    expect(result.vpEvents).toHaveLength(1);
    const ev = result.vpEvents[0];
    expect(ev?.faction).toBe('barony');
    expect(ev?.objective).toBe('Imperial Point');
    expect(ev?.points).toBe(1);
    expect(ev?.source).toBe('score_objective');
    expect(ev?.timestamp).toBe(2000);
  });

  it('increments currentScores', () => {
    const result = reduce([
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Imperial Point' }),
    ], [makeFaction('barony')]);
    expect(result.currentScores['barony']).toBe(1);
  });

  it('appends a warning for an unknown objective and does not emit VpEvent', () => {
    const result = reduce([
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'UNKNOWN_OBJ_XYZ' }),
    ], [makeFaction('barony')]);
    expect(result.vpEvents).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes('UNKNOWN_OBJ_XYZ'))).toBe(true);
  });

  it('appends warning when faction or objective field is missing', () => {
    const result = reduce([makeEntry('SCORE_OBJECTIVE', {})]);
    expect(result.warnings.some((w) => w.includes('SCORE_OBJECTIVE'))).toBe(true);
  });
});

describe('gameReducer — UNSCORE_OBJECTIVE', () => {
  it('emits a VpEvent with negative points', () => {
    const result = reduce([
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Imperial Point' }),
      makeEntry('UNSCORE_OBJECTIVE', { faction: 'barony', objective: 'Imperial Point' }, 1500),
    ], [makeFaction('barony')]);
    expect(result.vpEvents).toHaveLength(2);
    expect(result.vpEvents[1]?.points).toBe(-1);
    expect(result.vpEvents[1]?.source).toBe('score_objective');
  });

  it('decrements currentScores', () => {
    const result = reduce([
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Imperial Point' }),
      makeEntry('UNSCORE_OBJECTIVE', { faction: 'barony', objective: 'Imperial Point' }),
    ], [makeFaction('barony')]);
    expect(result.currentScores['barony']).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests — verify the new tests fail**

```bash
npm test -- src/lib/parser/__tests__/gameReducer.test.ts
```

Expected: new SCORE/UNSCORE tests FAIL; existing scaffold tests still pass.

- [ ] **Step 3: Add cases to gameReducer.ts**

Add these imports at the top of gameReducer.ts (after existing imports):

```ts
import { getObjectivePoints } from './objectives';
```

Replace the `// Cases added in Tasks 4–12` comment inside the `switch` with:

```ts
    case 'SCORE_OBJECTIVE': {
      const factionRaw = entry.event['faction'];
      const objectiveRaw = entry.event['objective'];
      if (typeof factionRaw !== 'string' || typeof objectiveRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `SCORE_OBJECTIVE missing faction/objective at ${entry.timestamp}`] };
      }
      const faction = factionRaw;
      const objective = objectiveRaw;
      const def = getObjectivePoints(objective);
      if (def === null) {
        return { ...state, warnings: [...state.warnings, `Unknown objective: "${objective}" at ${entry.timestamp}`] };
      }
      const prevScore = state.currentScores[faction] ?? 0;
      return {
        ...state,
        vpEvents: [
          ...state.vpEvents,
          { faction, objective, points: def.points, timestamp: entry.timestamp, gameTime: entry.gameTime, source: 'score_objective' as const },
        ],
        currentScores: { ...state.currentScores, [faction]: prevScore + def.points },
      };
    }

    case 'UNSCORE_OBJECTIVE': {
      const factionRaw = entry.event['faction'];
      const objectiveRaw = entry.event['objective'];
      if (typeof factionRaw !== 'string' || typeof objectiveRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `UNSCORE_OBJECTIVE missing faction/objective at ${entry.timestamp}`] };
      }
      const faction = factionRaw;
      const objective = objectiveRaw;
      const def = getObjectivePoints(objective);
      if (def === null) {
        return { ...state, warnings: [...state.warnings, `Unknown objective (unscore): "${objective}" at ${entry.timestamp}`] };
      }
      const prevScore = state.currentScores[faction] ?? 0;
      return {
        ...state,
        vpEvents: [
          ...state.vpEvents,
          { faction, objective, points: -def.points, timestamp: entry.timestamp, gameTime: entry.gameTime, source: 'score_objective' as const },
        ],
        currentScores: { ...state.currentScores, [faction]: prevScore - def.points },
      };
    }

    // Cases added in Tasks 5–12
    default:
      return { ...state, warnings: [...state.warnings, `Unknown action: ${entry.action}`] };
```

- [ ] **Step 4: Run all tests — verify GREEN**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/parser/gameReducer.ts src/lib/parser/__tests__/gameReducer.test.ts
git commit -m "feat: handle SCORE_OBJECTIVE and UNSCORE_OBJECTIVE in reducer"
```

---

## Task 5: CLAIM_PLANET (Custodians VP + Planet Events)

**Files:**
- Modify: `src/lib/parser/gameReducer.ts`
- Modify: `src/lib/parser/__tests__/gameReducer.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('gameReducer — CLAIM_PLANET', () => {
  it('emits a PlanetEvent with correct fields', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'barony', planet: 'Mecatol Rex' }, 1000),
    ]);
    expect(result.planetEvents).toHaveLength(1);
    const ev = result.planetEvents[0];
    expect(ev?.faction).toBe('barony');
    expect(ev?.planet).toBe('Mecatol Rex');
    expect(ev?.type).toBe('claim');
    expect(ev?.prevOwner).toBeNull();
  });

  it('sets prevOwner when planet was previously owned', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'barony', planet: 'Mecatol Rex' }, 1000),
      makeEntry('CLAIM_PLANET', { faction: 'arborec', planet: 'Mecatol Rex' }, 2000),
    ]);
    expect(result.planetEvents[1]?.prevOwner).toBe('barony');
  });

  it('emits a Custodians VpEvent on first claim of Mecatol Rex', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'barony', planet: 'Mecatol Rex' }, 1000),
    ], [makeFaction('barony')]);
    const custVp = result.vpEvents.find((e) => e.source === 'custodians');
    expect(custVp).toBeDefined();
    expect(custVp?.faction).toBe('barony');
    expect(custVp?.points).toBe(1);
  });

  it('does NOT emit Custodians VP on second claim of Mecatol Rex', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'barony', planet: 'Mecatol Rex' }, 1000),
      makeEntry('CLAIM_PLANET', { faction: 'arborec', planet: 'Mecatol Rex' }, 2000),
    ], [makeFaction('barony'), makeFaction('arborec')]);
    const custVps = result.vpEvents.filter((e) => e.source === 'custodians');
    expect(custVps).toHaveLength(1);
  });

  it('does NOT emit Custodians VP for non-Mecatol planets', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'barony', planet: 'Jord' }, 1000),
    ]);
    expect(result.vpEvents.filter((e) => e.source === 'custodians')).toHaveLength(0);
  });

  it('updates currentOwners', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'barony', planet: 'Mecatol Rex' }),
    ]);
    expect(result.currentOwners['Mecatol Rex']).toBe('barony');
  });
});
```

- [ ] **Step 2: Run tests — verify new tests fail**

```bash
npm test -- src/lib/parser/__tests__/gameReducer.test.ts
```

- [ ] **Step 3: Add CLAIM_PLANET case to gameReducer.ts**

Inside the switch, before `// Cases added in Tasks 5–12`, add:

```ts
    case 'CLAIM_PLANET': {
      const factionRaw = entry.event['faction'];
      const planetRaw = entry.event['planet'];
      if (typeof factionRaw !== 'string' || typeof planetRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `CLAIM_PLANET missing faction/planet at ${entry.timestamp}`] };
      }
      const faction = factionRaw;
      const planet = planetRaw;
      const prevOwner = state.currentOwners[planet] ?? null;
      const planetEvent: PlanetEvent = {
        faction, planet, prevOwner, timestamp: entry.timestamp, gameTime: entry.gameTime, type: 'claim',
      };
      const newOwners = { ...state.currentOwners, [planet]: faction };
      // Custodians token: first CLAIM_PLANET on Mecatol Rex earns 1 VP
      const isCustodians = planet === 'Mecatol Rex' && !state.custodiansTaken;
      const prevScore = state.currentScores[faction] ?? 0;
      const custVpEvent: VpEvent | null = isCustodians
        ? { faction, objective: 'Custodians Token', points: 1, timestamp: entry.timestamp, gameTime: entry.gameTime, source: 'custodians' }
        : null;
      return {
        ...state,
        planetEvents: [...state.planetEvents, planetEvent],
        vpEvents: custVpEvent ? [...state.vpEvents, custVpEvent] : state.vpEvents,
        currentOwners: newOwners,
        currentScores: isCustodians ? { ...state.currentScores, [faction]: prevScore + 1 } : state.currentScores,
        custodiansTaken: state.custodiansTaken || isCustodians,
      };
    }
```

Also update the import at the top to include `PlanetEvent` and `VpEvent` (they are already in the import list from Task 3; verify they are present).

- [ ] **Step 4: Run all tests — GREEN**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/parser/gameReducer.ts src/lib/parser/__tests__/gameReducer.test.ts
git commit -m "feat: handle CLAIM_PLANET with Custodians VP and planet event tracking"
```

---

## Task 6: Relic Events

**Files:**
- Modify: `src/lib/parser/gameReducer.ts`
- Modify: `src/lib/parser/__tests__/gameReducer.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('gameReducer — relic events', () => {
  it('GAIN_RELIC emits a RelicEvent and tracks ownership', () => {
    const result = reduce([
      makeEntry('GAIN_RELIC', { faction: 'barony', relic: 'Shard of the Throne' }, 1000),
    ]);
    expect(result.relicEvents).toHaveLength(1);
    expect(result.relicEvents[0]?.type).toBe('gain');
    expect(result.currentRelics['Shard of the Throne']).toBe('barony');
  });

  it('GAIN_RELIC on "Shard of the Throne" emits +1 VpEvent', () => {
    const result = reduce([
      makeEntry('GAIN_RELIC', { faction: 'barony', relic: 'Shard of the Throne' }),
    ], [makeFaction('barony')]);
    const vp = result.vpEvents.find((e) => e.source === 'relic' && e.objective === 'Shard of the Throne');
    expect(vp?.points).toBe(1);
  });

  it('PLAY_RELIC on "Crown of Emphidia" emits +1 VpEvent', () => {
    const result = reduce([
      makeEntry('PLAY_RELIC', { faction: 'barony', relic: 'Crown of Emphidia' }),
    ], [makeFaction('barony')]);
    const vp = result.vpEvents.find((e) => e.source === 'relic' && e.objective === 'Crown of Emphidia');
    expect(vp?.points).toBe(1);
  });

  it('PURGE_RELIC on "Shard of the Throne" emits -1 VpEvent', () => {
    const result = reduce([
      makeEntry('GAIN_RELIC', { faction: 'barony', relic: 'Shard of the Throne' }),
      makeEntry('PURGE_RELIC', { faction: 'barony', relic: 'Shard of the Throne' }, 2000),
    ], [makeFaction('barony')]);
    const lossVp = result.vpEvents.find((e) => e.points === -1 && e.source === 'relic');
    expect(lossVp).toBeDefined();
  });

  it('GAIN_RELIC on non-VP relic does not emit VpEvent', () => {
    const result = reduce([
      makeEntry('GAIN_RELIC', { faction: 'barony', relic: 'Obsidian' }),
    ], [makeFaction('barony')]);
    expect(result.vpEvents).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests — new tests fail**

```bash
npm test -- src/lib/parser/__tests__/gameReducer.test.ts
```

- [ ] **Step 3: Add relic cases to gameReducer.ts**

```ts
    case 'GAIN_RELIC': {
      const factionRaw = entry.event['faction'];
      const relicRaw = entry.event['relic'];
      if (typeof factionRaw !== 'string' || typeof relicRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `GAIN_RELIC missing fields at ${entry.timestamp}`] };
      }
      const faction = factionRaw;
      const relic = relicRaw;
      const relicEvent: RelicEvent = { faction, relic, timestamp: entry.timestamp, gameTime: entry.gameTime, type: 'gain' };
      const newRelics = { ...state.currentRelics, [relic]: faction };
      // Shard of the Throne: +1 VP on gain
      const VP_ON_GAIN = ['Shard of the Throne'];
      const prevScore = state.currentScores[faction] ?? 0;
      const vpEvent: VpEvent | null = VP_ON_GAIN.includes(relic)
        ? { faction, objective: relic, points: 1, timestamp: entry.timestamp, gameTime: entry.gameTime, source: 'relic' }
        : null;
      return {
        ...state,
        relicEvents: [...state.relicEvents, relicEvent],
        vpEvents: vpEvent ? [...state.vpEvents, vpEvent] : state.vpEvents,
        currentRelics: newRelics,
        currentScores: vpEvent ? { ...state.currentScores, [faction]: prevScore + 1 } : state.currentScores,
      };
    }

    case 'PLAY_RELIC': {
      const factionRaw = entry.event['faction'];
      const relicRaw = entry.event['relic'];
      if (typeof factionRaw !== 'string' || typeof relicRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `PLAY_RELIC missing fields at ${entry.timestamp}`] };
      }
      const faction = factionRaw;
      const relic = relicRaw;
      const relicEvent: RelicEvent = { faction, relic, timestamp: entry.timestamp, gameTime: entry.gameTime, type: 'play' };
      // Crown of Emphidia: +1 VP on play
      const VP_ON_PLAY = ['Crown of Emphidia'];
      const prevScore = state.currentScores[faction] ?? 0;
      const vpEvent: VpEvent | null = VP_ON_PLAY.includes(relic)
        ? { faction, objective: relic, points: 1, timestamp: entry.timestamp, gameTime: entry.gameTime, source: 'relic' }
        : null;
      return {
        ...state,
        relicEvents: [...state.relicEvents, relicEvent],
        vpEvents: vpEvent ? [...state.vpEvents, vpEvent] : state.vpEvents,
        currentScores: vpEvent ? { ...state.currentScores, [faction]: prevScore + 1 } : state.currentScores,
      };
    }

    case 'PURGE_RELIC': {
      const factionRaw = entry.event['faction'];
      const relicRaw = entry.event['relic'];
      if (typeof factionRaw !== 'string' || typeof relicRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `PURGE_RELIC missing fields at ${entry.timestamp}`] };
      }
      const faction = factionRaw;
      const relic = relicRaw;
      const relicEvent: RelicEvent = { faction, relic, timestamp: entry.timestamp, gameTime: entry.gameTime, type: 'purge' };
      const newRelics = { ...state.currentRelics };
      delete newRelics[relic];
      // Shard of the Throne: -1 VP on purge (lose the VP)
      const VP_ON_PURGE_LOSS = ['Shard of the Throne'];
      const prevScore = state.currentScores[faction] ?? 0;
      const vpEvent: VpEvent | null = VP_ON_PURGE_LOSS.includes(relic)
        ? { faction, objective: relic, points: -1, timestamp: entry.timestamp, gameTime: entry.gameTime, source: 'relic' }
        : null;
      return {
        ...state,
        relicEvents: [...state.relicEvents, relicEvent],
        vpEvents: vpEvent ? [...state.vpEvents, vpEvent] : state.vpEvents,
        currentRelics: newRelics,
        currentScores: vpEvent ? { ...state.currentScores, [faction]: prevScore - 1 } : state.currentScores,
      };
    }
```

- [ ] **Step 4: Run all tests — GREEN**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/parser/gameReducer.ts src/lib/parser/__tests__/gameReducer.test.ts
git commit -m "feat: handle GAIN_RELIC, PLAY_RELIC, PURGE_RELIC with VP tracking"
```

---

## Task 7: Agenda Resolutions

**Files:**
- Modify: `src/lib/parser/gameReducer.ts`
- Modify: `src/lib/parser/__tests__/gameReducer.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('gameReducer — RESOLVE_AGENDA', () => {
  it('emits an AgendaResolution with votes and riders', () => {
    const result = reduce([
      makeEntry('RESOLVE_AGENDA', {
        agenda: 'Mutiny',
        outcome: 'For',
        votes: [{ faction: 'barony', outcome: 'For', votes: 8 }],
        riders: [],
      }, 1000),
    ]);
    expect(result.agendaResolutions).toHaveLength(1);
    const res = result.agendaResolutions[0];
    expect(res?.agenda).toBe('Mutiny');
    expect(res?.outcome).toBe('For');
    expect(res?.votes).toHaveLength(1);
  });

  it('emits VpEvents for "Mutiny" For outcome (+1 to all factions)', () => {
    const result = reduce([
      makeEntry('RESOLVE_AGENDA', {
        agenda: 'Mutiny',
        outcome: 'For',
        votes: [],
        riders: [],
        gainedVps: [{ faction: 'barony', points: 1 }, { faction: 'arborec', points: 1 }],
      }),
    ], [makeFaction('barony'), makeFaction('arborec')]);
    const agendaVps = result.vpEvents.filter((e) => e.source === 'agenda');
    expect(agendaVps.length).toBeGreaterThan(0);
  });

  it('emits a negative VpEvent for "Seed of an Empire" loser', () => {
    // Seed of an Empire: leading faction gains 1 VP, trailing faction loses 1 VP.
    // Reducer reads currentScores to determine who leads.
    const result = reduce([
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Imperial Point' }, 500),
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Imperial Point' }, 600),
      makeEntry('RESOLVE_AGENDA', {
        agenda: 'Seed of an Empire',
        outcome: 'Resolved',
        votes: [],
        riders: [],
      }, 1000),
    ], [makeFaction('barony'), makeFaction('arborec')]);
    // barony has 2 VP (highest), arborec has 0 (lowest)
    const loss = result.vpEvents.find((e) => e.source === 'agenda' && e.points < 0);
    expect(loss?.faction).toBe('arborec');
  });

  it('handles RESOLVE_AGENDA with missing agenda name gracefully', () => {
    const result = reduce([makeEntry('RESOLVE_AGENDA', {})]);
    expect(result.warnings.some((w) => w.includes('RESOLVE_AGENDA'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run — new tests fail**

```bash
npm test -- src/lib/parser/__tests__/gameReducer.test.ts
```

- [ ] **Step 3: Add RESOLVE_AGENDA case to gameReducer.ts**

```ts
    case 'RESOLVE_AGENDA': {
      const agendaRaw = entry.event['agenda'];
      const outcomeRaw = entry.event['outcome'];
      if (typeof agendaRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `RESOLVE_AGENDA missing agenda name at ${entry.timestamp}`] };
      }
      const agenda = agendaRaw;
      const outcome = typeof outcomeRaw === 'string' ? outcomeRaw : '';

      // Extract votes array
      const rawVotes = Array.isArray(entry.event['votes']) ? entry.event['votes'] : [];
      const votes = rawVotes.flatMap((v) => {
        if (typeof v !== 'object' || v === null) return [];
        const vObj = v as Record<string, unknown>;
        const vFaction = vObj['faction'];
        const vOutcome = vObj['outcome'];
        const vVotes = vObj['votes'];
        if (typeof vFaction !== 'string' || typeof vOutcome !== 'string' || typeof vVotes !== 'number') return [];
        return [{ faction: vFaction, outcome: vOutcome, votes: vVotes }];
      });

      // Extract riders array
      const rawRiders = Array.isArray(entry.event['riders']) ? entry.event['riders'] : [];
      const riders = rawRiders.flatMap((r) => {
        if (typeof r !== 'object' || r === null) return [];
        const rObj = r as Record<string, unknown>;
        const rFaction = rObj['faction'];
        const rRider = rObj['rider'];
        const rOutcome = rObj['outcome'];
        if (typeof rFaction !== 'string' || typeof rRider !== 'string' || typeof rOutcome !== 'string') return [];
        return [{ faction: rFaction, rider: rRider, outcome: rOutcome }];
      });

      const resolution = {
        agenda,
        outcome,
        round: state.currentRound,
        timestamp: entry.timestamp,
        votes,
        riders,
      };

      // VP-granting agendas — extend this list after reviewing discover-data output
      const newVpEvents: VpEvent[] = [];
      let newScores = { ...state.currentScores };

      // gainedVps field: some TI Assistant versions emit explicit VP deltas
      const rawGainedVps = Array.isArray(entry.event['gainedVps']) ? entry.event['gainedVps'] : [];
      for (const g of rawGainedVps) {
        if (typeof g !== 'object' || g === null) continue;
        const gObj = g as Record<string, unknown>;
        const gFaction = gObj['faction'];
        const gPoints = gObj['points'];
        if (typeof gFaction !== 'string' || typeof gPoints !== 'number') continue;
        newVpEvents.push({
          faction: gFaction, objective: agenda, points: gPoints,
          timestamp: entry.timestamp, gameTime: entry.gameTime, source: 'agenda',
        });
        newScores = { ...newScores, [gFaction]: (newScores[gFaction] ?? 0) + gPoints };
      }

      // Seed of an Empire: stateful — VP to leader, loss to trailer (when gainedVps absent)
      if (agenda === 'Seed of an Empire' && rawGainedVps.length === 0) {
        const scoreEntries = Object.entries(state.currentScores);
        const maxScore = Math.max(0, ...scoreEntries.map(([, s]) => s));
        const minScore = Math.min(Infinity, ...scoreEntries.map(([, s]) => s));
        for (const [f, score] of scoreEntries) {
          if (score === maxScore && maxScore > 0) {
            newVpEvents.push({ faction: f, objective: agenda, points: 1, timestamp: entry.timestamp, gameTime: entry.gameTime, source: 'agenda' });
            newScores = { ...newScores, [f]: (newScores[f] ?? 0) + 1 };
          } else if (score === minScore && minScore < maxScore) {
            newVpEvents.push({ faction: f, objective: agenda, points: -1, timestamp: entry.timestamp, gameTime: entry.gameTime, source: 'agenda' });
            newScores = { ...newScores, [f]: (newScores[f] ?? 0) - 1 };
          }
        }
      }

      return {
        ...state,
        agendaResolutions: [...state.agendaResolutions, resolution],
        vpEvents: [...state.vpEvents, ...newVpEvents],
        currentScores: newScores,
      };
    }
```

- [ ] **Step 4: Run all tests — GREEN**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/parser/gameReducer.ts src/lib/parser/__tests__/gameReducer.test.ts
git commit -m "feat: handle RESOLVE_AGENDA with votes, riders, and agenda VP sources"
```

---

## Task 8: Rider Events

**Files:**
- Modify: `src/lib/parser/gameReducer.ts`
- Modify: `src/lib/parser/__tests__/gameReducer.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('gameReducer — PLAY_RIDER', () => {
  it('emits a VpEvent for Imperial Rider when Mecatol controller matches outcome', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'barony', planet: 'Mecatol Rex' }, 500),
      makeEntry('PLAY_RIDER', { faction: 'arborec', rider: 'Imperial Rider', outcome: 'barony' }, 1000),
    ], [makeFaction('barony'), makeFaction('arborec')]);
    const vp = result.vpEvents.find((e) => e.source === 'rider');
    expect(vp?.faction).toBe('barony');
    expect(vp?.points).toBe(1);
  });

  it('does NOT emit VpEvent for non-VP rider', () => {
    const result = reduce([
      makeEntry('PLAY_RIDER', { faction: 'arborec', rider: 'Politics Rider', outcome: 'For' }),
    ]);
    expect(result.vpEvents.filter((e) => e.source === 'rider')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run — new tests fail**

```bash
npm test -- src/lib/parser/__tests__/gameReducer.test.ts
```

- [ ] **Step 3: Add PLAY_RIDER case**

```ts
    case 'PLAY_RIDER': {
      const factionRaw = entry.event['faction'];
      const riderRaw = entry.event['rider'];
      const outcomeRaw = entry.event['outcome'];
      if (typeof factionRaw !== 'string' || typeof riderRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `PLAY_RIDER missing fields at ${entry.timestamp}`] };
      }
      const faction = factionRaw;
      const rider = riderRaw;
      const outcome = typeof outcomeRaw === 'string' ? outcomeRaw : '';

      // Imperial Rider: the faction controlling Mecatol Rex at resolution time gains 1 VP
      const newVpEvents: VpEvent[] = [];
      let newScores = { ...state.currentScores };

      if (rider === 'Imperial Rider') {
        const mecatolOwner = state.currentOwners['Mecatol Rex'] ?? null;
        if (mecatolOwner !== null && mecatolOwner === outcome) {
          newVpEvents.push({
            faction: mecatolOwner, objective: 'Imperial Rider', points: 1,
            timestamp: entry.timestamp, gameTime: entry.gameTime, source: 'rider',
          });
          newScores = { ...newScores, [mecatolOwner]: (newScores[mecatolOwner] ?? 0) + 1 };
        }
      }

      return {
        ...state,
        vpEvents: [...state.vpEvents, ...newVpEvents],
        currentScores: newScores,
      };
    }
```

- [ ] **Step 4: Run all tests — GREEN**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/parser/gameReducer.ts src/lib/parser/__tests__/gameReducer.test.ts
git commit -m "feat: handle PLAY_RIDER with Imperial Rider VP"
```

---

## Task 9: Tech Events

**Files:**
- Modify: `src/lib/parser/gameReducer.ts`
- Modify: `src/lib/parser/__tests__/gameReducer.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('gameReducer — tech events', () => {
  it('ADD_TECH emits a TechEvent with type "research"', () => {
    const result = reduce([
      makeEntry('ADD_TECH', { faction: 'barony', tech: 'Neural Motivator' }),
    ]);
    expect(result.techEvents[0]).toMatchObject({ faction: 'barony', tech: 'Neural Motivator', type: 'research' });
  });

  it('REMOVE_TECH emits a TechEvent with type "remove"', () => {
    const result = reduce([
      makeEntry('REMOVE_TECH', { faction: 'barony', tech: 'Neural Motivator' }),
    ]);
    expect(result.techEvents[0]).toMatchObject({ type: 'remove' });
  });

  it('CHOOSE_STARTING_TECH emits a TechEvent with type "starting"', () => {
    const result = reduce([
      makeEntry('CHOOSE_STARTING_TECH', { faction: 'barony', tech: 'Sarween Tools' }),
    ]);
    expect(result.techEvents[0]).toMatchObject({ tech: 'Sarween Tools', type: 'starting' });
  });

  it('handles missing faction/tech gracefully', () => {
    const result = reduce([makeEntry('ADD_TECH', {})]);
    expect(result.warnings.some((w) => w.includes('ADD_TECH'))).toBe(true);
    expect(result.techEvents).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run — new tests fail**

```bash
npm test -- src/lib/parser/__tests__/gameReducer.test.ts
```

- [ ] **Step 3: Add tech cases to gameReducer.ts**

```ts
    case 'ADD_TECH':
    case 'REMOVE_TECH':
    case 'CHOOSE_STARTING_TECH': {
      const factionRaw = entry.event['faction'];
      const techRaw = entry.event['tech'];
      if (typeof factionRaw !== 'string' || typeof techRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `${entry.action} missing faction/tech at ${entry.timestamp}`] };
      }
      const typeMap: Record<string, TechEvent['type']> = {
        ADD_TECH: 'research',
        REMOVE_TECH: 'remove',
        CHOOSE_STARTING_TECH: 'starting',
      };
      const techType = typeMap[entry.action] ?? 'research';
      return {
        ...state,
        techEvents: [
          ...state.techEvents,
          { faction: factionRaw, tech: techRaw, timestamp: entry.timestamp, gameTime: entry.gameTime, type: techType },
        ],
      };
    }
```

- [ ] **Step 4: Run all tests — GREEN**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/parser/gameReducer.ts src/lib/parser/__tests__/gameReducer.test.ts
git commit -m "feat: handle ADD_TECH, REMOVE_TECH, CHOOSE_STARTING_TECH"
```

---

## Task 10: Strategy Card + Secondary Events

**Files:**
- Modify: `src/lib/parser/gameReducer.ts`
- Modify: `src/lib/parser/__tests__/gameReducer.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('gameReducer — strategy and secondary events', () => {
  it('PICK_STRATEGY_CARD emits a StrategyCardEvent with type "pick"', () => {
    const result = reduce([
      makeEntry('PICK_STRATEGY_CARD', { faction: 'barony', card: 'Warfare' }),
    ]);
    expect(result.strategyCardEvents[0]).toMatchObject({ faction: 'barony', card: 'Warfare', type: 'pick' });
  });

  it('FOLLOW_SECONDARY emits a SecondaryEvent with type "follow"', () => {
    // Verify action name against discover-data output; may be SECONDARY_FOLLOW or similar
    const result = reduce([
      makeEntry('FOLLOW_SECONDARY', { faction: 'arborec', strategyCard: 'Warfare' }),
    ]);
    expect(result.secondaryEvents[0]).toMatchObject({ faction: 'arborec', strategyCard: 'Warfare', type: 'follow' });
  });

  it('ABSTAIN_SECONDARY emits a SecondaryEvent with type "abstain"', () => {
    const result = reduce([
      makeEntry('ABSTAIN_SECONDARY', { faction: 'arborec', strategyCard: 'Warfare' }),
    ]);
    expect(result.secondaryEvents[0]).toMatchObject({ type: 'abstain' });
  });
});
```

**Note:** Verify the exact action names (`FOLLOW_SECONDARY`, `ABSTAIN_SECONDARY`) against your Task 0 discover-data output. The actual action strings in the game data may differ (e.g. `SECONDARY_FOLLOW`). Update the test and case accordingly.

- [ ] **Step 2: Run — new tests fail**

```bash
npm test -- src/lib/parser/__tests__/gameReducer.test.ts
```

- [ ] **Step 3: Add cases to gameReducer.ts**

```ts
    case 'PICK_STRATEGY_CARD': {
      const factionRaw = entry.event['faction'];
      const cardRaw = entry.event['card'];
      if (typeof factionRaw !== 'string' || typeof cardRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `PICK_STRATEGY_CARD missing fields at ${entry.timestamp}`] };
      }
      return {
        ...state,
        strategyCardEvents: [
          ...state.strategyCardEvents,
          { faction: factionRaw, card: cardRaw, timestamp: entry.timestamp, gameTime: entry.gameTime, type: 'pick' },
        ],
      };
    }

    // NOTE: verify exact action names against discover-data output and update if needed
    case 'FOLLOW_SECONDARY': {
      const factionRaw = entry.event['faction'];
      const cardRaw = entry.event['strategyCard'];
      if (typeof factionRaw !== 'string' || typeof cardRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `FOLLOW_SECONDARY missing fields at ${entry.timestamp}`] };
      }
      return {
        ...state,
        secondaryEvents: [
          ...state.secondaryEvents,
          { faction: factionRaw, strategyCard: cardRaw, timestamp: entry.timestamp, gameTime: entry.gameTime, type: 'follow' },
        ],
      };
    }

    case 'ABSTAIN_SECONDARY': {
      const factionRaw = entry.event['faction'];
      const cardRaw = entry.event['strategyCard'];
      if (typeof factionRaw !== 'string' || typeof cardRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `ABSTAIN_SECONDARY missing fields at ${entry.timestamp}`] };
      }
      return {
        ...state,
        secondaryEvents: [
          ...state.secondaryEvents,
          { faction: factionRaw, strategyCard: cardRaw, timestamp: entry.timestamp, gameTime: entry.gameTime, type: 'abstain' },
        ],
      };
    }
```

- [ ] **Step 4: Run all tests — GREEN**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/parser/gameReducer.ts src/lib/parser/__tests__/gameReducer.test.ts
git commit -m "feat: handle PICK_STRATEGY_CARD and secondary events"
```

---

## Task 11: Action Cards + Component Events

**Files:**
- Modify: `src/lib/parser/gameReducer.ts`
- Modify: `src/lib/parser/__tests__/gameReducer.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('gameReducer — action cards and component events', () => {
  it('PLAY_ACTION_CARD emits an ActionCardEvent with type "play"', () => {
    const result = reduce([
      makeEntry('PLAY_ACTION_CARD', { faction: 'barony', card: 'Direct Hit' }),
    ]);
    expect(result.actionCardEvents[0]).toMatchObject({ faction: 'barony', card: 'Direct Hit', type: 'play' });
  });

  it('PLAY_ACTION_CARD captures optional target', () => {
    const result = reduce([
      makeEntry('PLAY_ACTION_CARD', { faction: 'barony', card: 'Spy', target: 'arborec' }),
    ]);
    expect(result.actionCardEvents[0]?.target).toBe('arborec');
  });

  it('PLAY_COMPONENT emits a ComponentEvent', () => {
    // Verify action name against discover-data output
    const result = reduce([
      makeEntry('PLAY_COMPONENT', { faction: 'barony', component: 'Creuss Rift Cannon' }),
    ]);
    expect(result.componentEvents[0]).toMatchObject({ faction: 'barony', component: 'Creuss Rift Cannon' });
  });
});
```

- [ ] **Step 2: Run — new tests fail**

```bash
npm test -- src/lib/parser/__tests__/gameReducer.test.ts
```

- [ ] **Step 3: Add cases**

```ts
    case 'PLAY_ACTION_CARD': {
      const factionRaw = entry.event['faction'];
      const cardRaw = entry.event['card'];
      if (typeof factionRaw !== 'string' || typeof cardRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `PLAY_ACTION_CARD missing fields at ${entry.timestamp}`] };
      }
      const targetRaw = entry.event['target'];
      return {
        ...state,
        actionCardEvents: [
          ...state.actionCardEvents,
          {
            faction: factionRaw, card: cardRaw, timestamp: entry.timestamp, gameTime: entry.gameTime,
            type: 'play',
            ...(typeof targetRaw === 'string' ? { target: targetRaw } : {}),
          },
        ],
      };
    }

    // NOTE: verify action name against discover-data; may be COMPONENT_ACTION or similar
    case 'PLAY_COMPONENT': {
      const factionRaw = entry.event['faction'];
      const componentRaw = entry.event['component'];
      if (typeof factionRaw !== 'string' || typeof componentRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `PLAY_COMPONENT missing fields at ${entry.timestamp}`] };
      }
      return {
        ...state,
        componentEvents: [
          ...state.componentEvents,
          { faction: factionRaw, component: componentRaw, timestamp: entry.timestamp, gameTime: entry.gameTime },
        ],
      };
    }
```

- [ ] **Step 4: Run all tests — GREEN**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/parser/gameReducer.ts src/lib/parser/__tests__/gameReducer.test.ts
git commit -m "feat: handle PLAY_ACTION_CARD and PLAY_COMPONENT"
```

---

## Task 12: Remaining Events + ADVANCE_PHASE

Handles: leaders, objective reveals, speaker changes, attachments, alliances, promissory notes, expeditions, and ADVANCE_PHASE (which captures RoundState snapshots).

**Files:**
- Modify: `src/lib/parser/gameReducer.ts`
- Modify: `src/lib/parser/__tests__/gameReducer.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('gameReducer — ADVANCE_PHASE', () => {
  it('pushes a RoundState snapshot and updates currentRound', () => {
    const result = reduce([
      makeEntry('ADVANCE_PHASE', {
        round: 2,
        phase: 'action',
        speaker: 'barony',
        strategyCards: { barony: 'Warfare', arborec: 'Technology' },
      }, 5000),
    ]);
    expect(result.rounds).toHaveLength(1);
    expect(result.rounds[0]).toMatchObject({ round: 2, phase: 'action', speaker: 'barony' });
    expect(result.currentRound).toBe(2);
  });
});

describe('gameReducer — REVEAL_OBJECTIVE', () => {
  it('emits an ObjectiveReveal', () => {
    // Verify action name against discover-data output
    const result = reduce([
      makeEntry('REVEAL_OBJECTIVE', { objective: 'Expand Borders', stage: 'I' }, 1000),
    ]);
    expect(result.objectiveReveals[0]).toMatchObject({ objective: 'Expand Borders', stage: 'I' });
    expect(result.revealedObjectives).toContain('Expand Borders');
  });
});

describe('gameReducer — CHANGE_SPEAKER', () => {
  it('emits a SpeakerEvent and updates currentSpeaker', () => {
    const result = reduce([
      makeEntry('CHANGE_SPEAKER', { newSpeaker: 'arborec', prevSpeaker: 'barony' }),
    ]);
    expect(result.speakerEvents[0]).toMatchObject({ newSpeaker: 'arborec', prevSpeaker: 'barony' });
    expect(result.currentSpeaker).toBe('arborec');
  });
});

describe('gameReducer — leader events', () => {
  it('PLAY_LEADER emits a LeaderEvent with type "play"', () => {
    // Verify action name against discover-data output
    const result = reduce([
      makeEntry('PLAY_LEADER', { faction: 'barony', leader: 'Magmus' }),
    ]);
    expect(result.leaderEvents[0]).toMatchObject({ faction: 'barony', leader: 'Magmus', type: 'play' });
  });
});
```

- [ ] **Step 2: Run — new tests fail**

```bash
npm test -- src/lib/parser/__tests__/gameReducer.test.ts
```

- [ ] **Step 3: Add cases to gameReducer.ts**

```ts
    case 'ADVANCE_PHASE': {
      const roundRaw = entry.event['round'];
      const phaseRaw = entry.event['phase'];
      const speakerRaw = entry.event['speaker'];
      const round = typeof roundRaw === 'number' ? roundRaw : state.currentRound;
      const phase = typeof phaseRaw === 'string' ? phaseRaw : state.currentPhase;
      const speaker = typeof speakerRaw === 'string' ? speakerRaw : state.currentSpeaker;
      const rawCards = entry.event['strategyCards'];
      const strategyCards: Record<string, string> = (typeof rawCards === 'object' && rawCards !== null)
        ? Object.fromEntries(
            Object.entries(rawCards as Record<string, unknown>)
              .filter(([, v]) => typeof v === 'string')
              .map(([k, v]) => [k, v as string]),
          )
        : {};
      const roundState: RoundState = { round, phase, speaker, strategyCards };
      return { ...state, rounds: [...state.rounds, roundState], currentRound: round, currentPhase: phase, currentSpeaker: speaker };
    }

    // NOTE: verify action name against discover-data
    case 'REVEAL_OBJECTIVE': {
      const objRaw = entry.event['objective'];
      const stageRaw = entry.event['stage'];
      if (typeof objRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `REVEAL_OBJECTIVE missing objective at ${entry.timestamp}`] };
      }
      const stage = stageRaw === 'II' ? 'II' : 'I';
      return {
        ...state,
        objectiveReveals: [
          ...state.objectiveReveals,
          { objective: objRaw, stage, round: state.currentRound, timestamp: entry.timestamp },
        ],
        revealedObjectives: [...state.revealedObjectives, objRaw],
      };
    }

    case 'CHANGE_SPEAKER': {
      const newSpeakerRaw = entry.event['newSpeaker'];
      const prevSpeakerRaw = entry.event['prevSpeaker'];
      if (typeof newSpeakerRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `CHANGE_SPEAKER missing newSpeaker at ${entry.timestamp}`] };
      }
      return {
        ...state,
        speakerEvents: [
          ...state.speakerEvents,
          { newSpeaker: newSpeakerRaw, prevSpeaker: typeof prevSpeakerRaw === 'string' ? prevSpeakerRaw : '', timestamp: entry.timestamp, gameTime: entry.gameTime },
        ],
        currentSpeaker: newSpeakerRaw,
      };
    }

    // NOTE: verify action names against discover-data; unlock/exhaust/purge may be separate actions
    case 'PLAY_LEADER':
    case 'EXHAUST_LEADER':
    case 'UNLOCK_LEADER':
    case 'PURGE_LEADER': {
      const factionRaw = entry.event['faction'];
      const leaderRaw = entry.event['leader'];
      if (typeof factionRaw !== 'string' || typeof leaderRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `${entry.action} missing fields at ${entry.timestamp}`] };
      }
      const leaderTypeMap: Record<string, LeaderEvent['type']> = {
        PLAY_LEADER: 'play', EXHAUST_LEADER: 'exhaust', UNLOCK_LEADER: 'unlock', PURGE_LEADER: 'purge',
      };
      const leaderType = leaderTypeMap[entry.action] ?? 'play';
      return {
        ...state,
        leaderEvents: [
          ...state.leaderEvents,
          { faction: factionRaw, leader: leaderRaw, timestamp: entry.timestamp, gameTime: entry.gameTime, type: leaderType },
        ],
      };
    }

    case 'ADD_ATTACHMENT': {
      const factionRaw = entry.event['faction'];
      const planetRaw = entry.event['planet'];
      const attachmentRaw = entry.event['attachment'];
      if (typeof planetRaw !== 'string' || typeof attachmentRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `ADD_ATTACHMENT missing fields at ${entry.timestamp}`] };
      }
      return {
        ...state,
        attachmentEvents: [
          ...state.attachmentEvents,
          {
            faction: typeof factionRaw === 'string' ? factionRaw : null,
            planet: planetRaw, attachment: attachmentRaw,
            timestamp: entry.timestamp, gameTime: entry.gameTime, type: 'attach',
          },
        ],
      };
    }

    case 'FORM_ALLIANCE': {
      const f1Raw = entry.event['faction1'];
      const f2Raw = entry.event['faction2'];
      if (typeof f1Raw !== 'string' || typeof f2Raw !== 'string') {
        return { ...state, warnings: [...state.warnings, `FORM_ALLIANCE missing fields at ${entry.timestamp}`] };
      }
      return {
        ...state,
        allianceEvents: [
          ...state.allianceEvents,
          { faction1: f1Raw, faction2: f2Raw, timestamp: entry.timestamp, gameTime: entry.gameTime, type: 'form' },
        ],
      };
    }

    case 'PLAY_PROMISSORY_NOTE': {
      const fromRaw = entry.event['fromFaction'];
      const toRaw = entry.event['toFaction'];
      const noteRaw = entry.event['note'];
      if (typeof fromRaw !== 'string' || typeof toRaw !== 'string' || typeof noteRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `PLAY_PROMISSORY_NOTE missing fields at ${entry.timestamp}`] };
      }
      return {
        ...state,
        promissoryNoteEvents: [
          ...state.promissoryNoteEvents,
          { fromFaction: fromRaw, toFaction: toRaw, note: noteRaw, timestamp: entry.timestamp, gameTime: entry.gameTime, type: 'play' },
        ],
      };
    }

    case 'EXPEDITION': {
      const factionRaw = entry.event['faction'];
      const planetRaw = entry.event['planet'];
      if (typeof factionRaw !== 'string' || typeof planetRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `EXPEDITION missing fields at ${entry.timestamp}`] };
      }
      return {
        ...state,
        expeditionEvents: [
          ...state.expeditionEvents,
          { faction: factionRaw, planet: planetRaw, timestamp: entry.timestamp, gameTime: entry.gameTime },
        ],
      };
    }
```

- [ ] **Step 4: Run all tests — GREEN**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/parser/gameReducer.ts src/lib/parser/__tests__/gameReducer.test.ts
git commit -m "feat: handle ADVANCE_PHASE, REVEAL_OBJECTIVE, CHANGE_SPEAKER, leaders, attachments, alliances, promissory notes, expeditions"
```

---

## Task 13: parseGame.ts

**Files:**
- Create: `src/lib/parser/parseGame.ts`
- Create: `src/lib/parser/__tests__/parseGame.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/parser/__tests__/parseGame.test.ts
import { describe, it, expect } from 'vitest';
import { parseGame } from '../parseGame';

const minimalInput = () => ({
  actionLog: [],
  factions: [
    { factionId: 'barony', playerName: 'Alice', color: 'red', mapPosition: 0, startingTechs: [], startingPlanets: [] },
    { factionId: 'arborec', playerName: 'Bob', color: 'green', mapPosition: 1, startingTechs: [], startingPlanets: [] },
  ],
  speaker: 0,
  timers: { game: 7200, factions: { barony: 3600, arborec: 3600 }, secondaries: {}, agendas: { first: 0, second: 0 } },
  options: { 'victory-points': 10 },
});

describe('parseGame', () => {
  it('returns a ParsedGame with correct shape for minimal input', () => {
    const result = parseGame(minimalInput());
    expect(result.gameId).toBeTypeOf('string');
    expect(result.gameId.length).toBeGreaterThan(0);
    expect(result.factions).toHaveLength(2);
    expect(result.factions[0]?.factionId).toBe('barony');
    expect(result.initialSpeaker).toBe('barony'); // mapPosition 0
    expect(result.vpEvents).toHaveLength(0);
    expect(result.finalScores).toEqual({ barony: 0, arborec: 0 });
    expect(result.winner).toBeNull();
    expect(result.timers.game).toBe(7200);
  });

  it('throws when input is not an object', () => {
    expect(() => parseGame('not an object')).toThrow('parseGame: expected an object');
    expect(() => parseGame(null)).toThrow('parseGame: expected an object');
    expect(() => parseGame(42)).toThrow('parseGame: expected an object');
  });

  it('sorts actionLog ascending by timestamp before reducing', () => {
    const input = {
      ...minimalInput(),
      actionLog: [
        { action: 'SCORE_OBJECTIVE', event: { faction: 'barony', objective: 'Imperial Point' }, timestamp: 2000 },
        { action: 'SCORE_OBJECTIVE', event: { faction: 'arborec', objective: 'Imperial Point' }, timestamp: 1000 },
      ],
    };
    const result = parseGame(input);
    expect(result.vpEvents[0]?.faction).toBe('arborec'); // timestamp 1000 comes first
    expect(result.vpEvents[1]?.faction).toBe('barony');
  });

  it('identifies winner when a faction reaches the VP threshold', () => {
    const input = {
      ...minimalInput(),
      options: { 'victory-points': 1 },
      actionLog: [
        { action: 'SCORE_OBJECTIVE', event: { faction: 'barony', objective: 'Imperial Point' }, timestamp: 1000 },
      ],
    };
    const result = parseGame(input);
    expect(result.winner).toBe('barony');
  });

  it('produces a stable gameId for the same input', () => {
    const a = parseGame(minimalInput());
    const b = parseGame(minimalInput());
    expect(a.gameId).toBe(b.gameId);
  });
});
```

- [ ] **Step 2: Run — new tests fail**

```bash
npm test -- src/lib/parser/__tests__/parseGame.test.ts
```

Expected: FAIL — `Cannot find module '../parseGame'`.

- [ ] **Step 3: Create parseGame.ts**

```ts
// src/lib/parser/parseGame.ts
import type { ParsedGame, FactionSetup, GameTimers, RawLogEntry } from './types';
import { createInitialState, gameReducer } from './gameReducer';

function hashGameId(firstTimestamp: number, sortedFactionIds: string[]): string {
  const input = `${firstTimestamp}:${sortedFactionIds.join(',')}`;
  // FNV-1a 32-bit — deterministic, browser-safe
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(36);
}

/** Reads `top.data.factions[]`. Real entries have only { id, playerName, color };
 *  the parser fills mapPosition (from array index) and empty starting arrays. */
function extractFactions(raw: Record<string, unknown>): FactionSetup[] {
  const dataObj = (typeof raw['data'] === 'object' && raw['data'] !== null)
    ? (raw['data'] as Record<string, unknown>)
    : {};
  const rawFactions = Array.isArray(dataObj['factions']) ? dataObj['factions'] : [];
  return rawFactions.map((f, idx): FactionSetup => {
    const faction = (typeof f === 'object' && f !== null) ? (f as Record<string, unknown>) : {};
    return {
      factionId: typeof faction['id'] === 'string' ? faction['id'] : '',
      playerName: typeof faction['playerName'] === 'string' ? faction['playerName'] : '',
      color: typeof faction['color'] === 'string' ? faction['color'] : '',
      mapPosition: idx,
      startingTechs: [],
      startingPlanets: [],
    };
  });
}

/** Reads `top.actionLog[]` and normalizes the wrapped shape into flat `RawLogEntry`.
 *  Real shape: { timestampMillis, data: { action, event, timestamp }, gameSeconds? } */
function extractLogEntries(raw: Record<string, unknown>): RawLogEntry[] {
  const rawLog = Array.isArray(raw['actionLog']) ? raw['actionLog'] : [];
  return rawLog
    .flatMap((entry): RawLogEntry[] => {
      if (typeof entry !== 'object' || entry === null) return [];
      const e = entry as Record<string, unknown>;
      const inner = (typeof e['data'] === 'object' && e['data'] !== null)
        ? (e['data'] as Record<string, unknown>)
        : {};
      const action = inner['action'];
      if (typeof action !== 'string') return [];
      // Prefer inner timestamp (action-internal), fall back to outer timestampMillis
      const ts = typeof inner['timestamp'] === 'number'
        ? inner['timestamp']
        : (typeof e['timestampMillis'] === 'number' ? e['timestampMillis'] : 0);
      return [{
        action,
        event: (typeof inner['event'] === 'object' && inner['event'] !== null)
          ? (inner['event'] as Record<string, unknown>)
          : {},
        timestamp: ts,
        ...(typeof e['gameSeconds'] === 'number' ? { gameTime: e['gameSeconds'] } : {}),
      }];
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

function extractTimers(raw: Record<string, unknown>, factions: FactionSetup[]): GameTimers {
  const rawTimers = (typeof raw['timers'] === 'object' && raw['timers'] !== null)
    ? (raw['timers'] as Record<string, unknown>)
    : {};
  const rawFactionTimers = (typeof rawTimers['factions'] === 'object' && rawTimers['factions'] !== null)
    ? (rawTimers['factions'] as Record<string, unknown>)
    : {};
  const rawSecondaries = (typeof rawTimers['secondaries'] === 'object' && rawTimers['secondaries'] !== null)
    ? (rawTimers['secondaries'] as Record<string, unknown>)
    : {};
  const rawAgendas = (typeof rawTimers['agendas'] === 'object' && rawTimers['agendas'] !== null)
    ? (rawTimers['agendas'] as Record<string, unknown>)
    : {};

  const factionTimers: Record<string, number> = {};
  const secondaryTimers: Record<string, number> = {};
  for (const { factionId } of factions) {
    factionTimers[factionId] = typeof rawFactionTimers[factionId] === 'number' ? (rawFactionTimers[factionId] as number) : 0;
    secondaryTimers[factionId] = typeof rawSecondaries[factionId] === 'number' ? (rawSecondaries[factionId] as number) : 0;
  }

  return {
    game: typeof rawTimers['game'] === 'number' ? rawTimers['game'] : 0,
    factions: factionTimers,
    secondaries: secondaryTimers,
    agendas: {
      first: typeof rawAgendas['first'] === 'number' ? rawAgendas['first'] : 0,
      second: typeof rawAgendas['second'] === 'number' ? rawAgendas['second'] : 0,
    },
  };
}

export function parseGame(raw: unknown): ParsedGame {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('parseGame: expected an object');
  }
  const game = raw as Record<string, unknown>;

  const factions = extractFactions(game);
  const entries = extractLogEntries(game);
  const timers = extractTimers(game, factions);

  const speakerIndex = typeof game['speaker'] === 'number' ? game['speaker'] : 0;
  const initialSpeaker = factions.find((f) => f.mapPosition === speakerIndex)?.factionId ?? '';

  const rawOptions = (typeof game['options'] === 'object' && game['options'] !== null)
    ? (game['options'] as Record<string, unknown>)
    : {};

  const finalState = entries.reduce(gameReducer, createInitialState(factions));

  const firstTimestamp = entries[0]?.timestamp ?? 0;
  const sortedFactionIds = factions.map((f) => f.factionId).sort();
  const gameId = hashGameId(firstTimestamp, sortedFactionIds);

  const vpThreshold = typeof rawOptions['victory-points'] === 'number' ? rawOptions['victory-points'] : 10;
  const scoreEntries = Object.entries(finalState.currentScores);
  const topScore = scoreEntries.reduce((max, [, s]) => Math.max(max, s), 0);
  const winner = topScore >= vpThreshold
    ? (scoreEntries.find(([, s]) => s === topScore)?.[0] ?? null)
    : null;

  return {
    gameId,
    playedAt: firstTimestamp,
    durationSeconds: timers.game,
    factions,
    options: rawOptions,
    initialSpeaker,
    rounds: finalState.rounds,
    vpEvents: finalState.vpEvents,
    planetEvents: finalState.planetEvents,
    techEvents: finalState.techEvents,
    agendaResolutions: finalState.agendaResolutions,
    strategyCardEvents: finalState.strategyCardEvents,
    actionCardEvents: finalState.actionCardEvents,
    componentEvents: finalState.componentEvents,
    relicEvents: finalState.relicEvents,
    leaderEvents: finalState.leaderEvents,
    objectiveReveals: finalState.objectiveReveals,
    speakerEvents: finalState.speakerEvents,
    attachmentEvents: finalState.attachmentEvents,
    allianceEvents: finalState.allianceEvents,
    promissoryNoteEvents: finalState.promissoryNoteEvents,
    expeditionEvents: finalState.expeditionEvents,
    secondaryEvents: finalState.secondaryEvents,
    actionEvents: finalState.actionEvents,
    finalScores: finalState.currentScores,
    winner,
    timers,
    warnings: finalState.warnings,
  };
}
```

- [ ] **Step 4: Run all tests — GREEN**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/parser/parseGame.ts src/lib/parser/__tests__/parseGame.test.ts
git commit -m "feat: add parseGame top-level parser function"
```

---

## Task 14: Coverage Gate

**Files:**
- Modify: `vitest.config.ts`

- [ ] **Step 1: Run coverage report to see current state**

```bash
npm run test:coverage
```

Note the current line coverage percentage for `src/lib/**`.

- [ ] **Step 2: Update vitest.config.ts to enforce 90 % threshold**

Replace the `thresholds` block in `vitest.config.ts`:

```ts
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 80,
        statements: 90,
      },
```

(Branches are set to 80 % because some defensive `typeof` guards in event payloads are hard to exercise without real data. Raise branches to 90 % once integration coverage is confirmed.)

- [ ] **Step 3: Run coverage — must pass**

```bash
npm run test:coverage
```

Expected: coverage report shows ≥ 90 % lines/functions/statements. If below 90 %, add targeted tests for uncovered branches before proceeding.

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts
git commit -m "feat: raise coverage threshold to 90% lines/functions/statements"
```

---

## Task 15: Integration Smoke Test

**Files:**
- Create: `src/lib/parser/__tests__/parseGame.integration.test.ts`

- [ ] **Step 1: Write the integration tests**

```ts
// src/lib/parser/__tests__/parseGame.integration.test.ts
// Reads the six real game JSON exports and asserts Phase 1a acceptance criteria.
// These are smoke tests — they verify non-throwing and non-empty output,
// NOT exact score matching (that is the Phase 1 combined gating test).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parseGame } from '../parseGame';

const GAME_DATA = join(process.cwd(), 'game-data');
const files = readdirSync(GAME_DATA).filter((f) => f.endsWith('.json'));

describe('parseGame integration — all 6 real game exports', () => {
  it('finds exactly 6 game files', () => {
    expect(files).toHaveLength(6);
  });

  it.each(files)('%s — parses without throwing', (file) => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));
    expect(() => parseGame(raw)).not.toThrow();
  });

  it.each(files)('%s — vpEvents is non-empty', (file) => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));
    const result = parseGame(raw);
    expect(result.vpEvents.length).toBeGreaterThan(0);
  });

  it.each(files)('%s — finalScores has an entry for each faction', (file) => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));
    const result = parseGame(raw);
    expect(Object.keys(result.finalScores).length).toBeGreaterThan(0);
    expect(Object.keys(result.finalScores).length).toBe(result.factions.length);
  });

  it.each(files)('%s — agendaResolutions includes vote data when agenda phase present', (file) => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));
    const result = parseGame(raw);
    // If there are any agenda resolutions, each must have a votes array
    for (const res of result.agendaResolutions) {
      expect(Array.isArray(res.votes)).toBe(true);
    }
  });

  it.each(files)('%s — no warnings for unknown objectives in actual game data', (file) => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));
    const result = parseGame(raw);
    const objectiveWarnings = result.warnings.filter((w) => w.startsWith('Unknown objective'));
    if (objectiveWarnings.length > 0) {
      // Fail with helpful message listing which objectives are missing from the dictionary
      throw new Error(
        `Missing objectives in dictionary for ${file}:\n${objectiveWarnings.join('\n')}\n` +
        'Add these to src/lib/parser/objectives.ts'
      );
    }
  });
});
```

- [ ] **Step 2: Run the integration tests**

```bash
npm test -- src/lib/parser/__tests__/parseGame.integration.test.ts
```

Expected: all tests GREEN. If any "Missing objectives in dictionary" errors appear, add the flagged strings to `objectives.ts` and re-run.

- [ ] **Step 3: Run the full test suite**

```bash
npm test
```

Expected: all tests GREEN.

- [ ] **Step 4: Verify coverage still ≥ 90 %**

```bash
npm run test:coverage
```

- [ ] **Step 5: Final typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/parser/__tests__/parseGame.integration.test.ts
git commit -m "feat: add integration smoke tests for all 6 real game exports"
```

---

## Self-Review Checklist

| Requirement from spec | Task that covers it |
|----------------------|-------------------|
| Schema correction (RawLogEntry flat format) | Task 1 (types.ts) |
| ParsedGame with all 20+ fields | Task 1 (types.ts) |
| Objective dictionary | Task 2 |
| SCORE_OBJECTIVE / UNSCORE_OBJECTIVE | Task 4 |
| Custodians VP | Task 5 |
| Planet events with prevOwner tracking | Task 5 |
| Relic VPs (Shard, Crown of Emphidia) | Task 6 |
| Agenda resolutions with vote data | Task 7 |
| Seed of an Empire stateful VP | Task 7 |
| Imperial Rider stateful VP | Task 8 |
| Tech events | Task 9 |
| Strategy card / secondary events | Task 10 |
| Action card / component events | Task 11 |
| Leader / reveal / speaker / attachment / alliance / promissory / expedition events | Task 12 |
| ADVANCE_PHASE → RoundState | Task 12 |
| parseGame top-level function | Task 13 |
| discover-data script | Task 0 |
| Coverage ≥ 90 % | Task 14 |
| All 6 exports parse without throwing | Task 15 |
| Non-empty vpEvents + finalScores | Task 15 |
| warnings[] non-empty for unknown objectives | Task 2 (test), Task 4 (implementation) |
| Styx legendary VP | Task 2 (dictionary) |
| TDD throughout | Every task: test first, then implement |
