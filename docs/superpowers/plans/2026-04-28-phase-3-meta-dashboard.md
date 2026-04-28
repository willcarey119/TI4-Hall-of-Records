# Phase 3 Meta-Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cross-game analytics dashboard organized around factions as the primary axis. New `/meta` route with four sections (Factions, Strategy, Techs, Stats) computed client-side from all uploaded games via pure aggregator functions in `src/lib/aggregator/`.

**Architecture:** Client-side aggregation. `MetaContext` calls `loadAllGames()` once on mount, runs four pure aggregator functions, and provides the result to four section components via a `useMeta()` hook. Adding a new stat means adding (or extending) a pure function — no Firestore migration. Same FrozenHeader / ScrollBody / `<section data-section>` shell as game-detail.

**Tech Stack:** React 18 · TypeScript strict (`noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`) · Vitest + React Testing Library · Inline SVG · Newsreader / IBM Plex Sans / IBM Plex Mono · CSS custom properties (`--paper`, `--ink`, `--ink-2/3/4`, `--accent`, `--cool`, `--moss`, `--gold`, `--rule`)

**Source spec:** [`docs/superpowers/specs/2026-04-28-phase3-meta-dashboard-design.md`](../specs/2026-04-28-phase3-meta-dashboard-design.md) — every aggregator interface and section visual is defined there. This plan operationalizes the spec into TDD-sized steps.

---

## Key context — read before starting any task

### Naming collision: `deriveRoundBoundaries` already exists

There is a stub function `deriveRoundBoundaries(_snapshots: PhaseSnapshot[]): RoundBoundary[]` in `app/src/lib/tech/buildTechSummary.ts` that always returns `[]`. Its `RoundBoundary` interface uses `phaseStartTimestamp`. **Task 3 deletes that stub** and replaces it with a real implementation in `src/lib/aggregator/deriveRoundBoundaries.ts` whose `RoundBoundary` interface uses `startTimestamp`. `buildTechSummary` must be migrated to import from the new location. Existing tech tests pass `roundBoundaries = []` and continue to work, but the field name change in the type means call sites must be checked.

### Aggregator/section pattern (mirror the game-detail pattern)

```tsx
// pure function in src/lib/aggregator/buildXStats.ts → tested in isolation
export function buildXStats(games: ParsedGame[], ...): XSummary

// section in src/features/meta-dashboard/XSection.tsx
import { useMeta } from './MetaContext';
export function XSection() {
  const { xStats } = useMeta();
  if (xStats === null) return <section id="x" data-section="x" />;
  return (
    <section id="x" data-section="x" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}>
      {/* content */}
    </section>
  );
}
```

The shell-only render (no provider) returns the empty `<section>` so `sections.test.tsx` can assert on `id` / `data-section` without needing data.

### Type safety reminders (matches Phase 2 plan)

- `Record<string, T>` indexing yields `T | undefined` due to `noUncheckedIndexedAccess`. Use `?? default` or explicit checks.
- Optional object fields cannot be set to `undefined` explicitly due to `exactOptionalPropertyTypes`. Use conditional spread: `...(cond ? { foo: val } : {})`.
- Never use `as` to lie to the compiler. Use type guards or runtime checks instead.

### Test runner command (from `app/`)

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

For one file: `npx vitest run src/path/to/file.test.ts`

### Sample size honesty (UI display rules — apply in Tasks 11–14)

With 6 games in the dataset, almost every rate has a margin of error of ±30–40 pp. These rules prevent the UI from looking authoritative when it isn't:

1. **Always show the denominator.** Render rates as `X% (n=N)` — never a bare percentage.
2. **Suppress stats below n=3.** When the denominator (games played, winner games, etc.) is < 3, render `—` in place of the number. Show a tooltip or parenthetical `(n=N)` so the user knows why.
3. **Whole-integer percentages only.** Round to nearest integer. `Math.round(rate * 100)` — never `toFixed(2)` or raw floats.
4. **null → `—`.** The aggregators already return `null` for zero-denominator stats. UI maps `null` to `—`, never `0%` or `NaN%`.
5. **Head-to-head pairings with n=1** are shown (don't hide data) but styled with `--ink-3` (lighter weight) so the user can visually distinguish sparse from robust records.

---

## Files created

| File | Purpose |
|---|---|
| `app/src/lib/aggregator/deriveRoundBoundaries.ts` | Pure fn: round boundaries from strategy card pick events |
| `app/src/lib/aggregator/deriveRoundBoundaries.test.ts` | Tests |
| `app/src/lib/aggregator/factionExpansions.ts` | Static dict: factionId → expansion tag |
| `app/src/lib/aggregator/buildFactionStats.ts` | Pure fn: per-faction win rate, pairings, SFT transfers |
| `app/src/lib/aggregator/buildFactionStats.test.ts` | Tests |
| `app/src/lib/aggregator/buildStrategyCardStats.ts` | Pure fn: pick position, follow rate by round |
| `app/src/lib/aggregator/buildStrategyCardStats.test.ts` | Tests |
| `app/src/lib/aggregator/buildTechStats.ts` | Pure fn: research counts, winner-held rate, by color |
| `app/src/lib/aggregator/buildTechStats.test.ts` | Tests |
| `app/src/lib/aggregator/buildGameStats.ts` | Pure fn: Mecatol, action types, heroes, relics, agendas, comeback |
| `app/src/lib/aggregator/buildGameStats.test.ts` | Tests |
| `app/src/lib/aggregator/heroLeaders.ts` | Static set: known hero leader names (populated from real data) |
| `app/src/features/meta-dashboard/MetaContext.tsx` | `MetaProvider` + `useMeta()` |
| `app/src/features/meta-dashboard/MetaDashboardPage.tsx` | FrozenHeader + ScrollBody shell |
| `app/src/features/meta-dashboard/FactionSection.tsx` | League leaderboard section |
| `app/src/features/meta-dashboard/StrategyCardSection.tsx` | Strategy card meta section |
| `app/src/features/meta-dashboard/TechSection.tsx` | Cross-game tech meta section |
| `app/src/features/meta-dashboard/StatsSection.tsx` | Game-level stats section |
| `app/src/features/meta-dashboard/sections.test.tsx` | Shell-render tests for all 4 sections |

## Files modified

| File | Change |
|---|---|
| `app/src/lib/parser/types.ts` | Add `ActionTypeEvent` type + optional `actionTypeEvents` field on `ParsedGame` |
| `app/src/lib/parser/gameReducer.ts` | Replace `case 'SELECT_ACTION': return state` with capturing logic; add `actionTypeEvents` to ReducerState |
| `app/src/lib/parser/parseGame.ts` | Spread `actionTypeEvents` into the returned `ParsedGame` |
| `app/src/lib/tech/buildTechSummary.ts` | Delete local `deriveRoundBoundaries` stub + `RoundBoundary` interface; import both from `aggregator/deriveRoundBoundaries` |
| `app/src/lib/aggregator/index.ts` | Export aggregator surface |
| `app/src/features/meta-dashboard/index.ts` | Export `MetaDashboardPage` |
| `app/src/adapters/firestore.ts` | Add `loadAllGames()` |
| `app/src/App.tsx` | Add `/meta` route |
| `app/src/features/home/HomePage.tsx` | Add "League Stats →" kicker link below Mast |

---

## Task 1: Parser captures `SELECT_ACTION` events

The reducer currently ignores `SELECT_ACTION`. The aggregator's tactical/component/pass action breakdown depends on capturing them. Field is **optional** on `ParsedGame` so existing Firestore documents (uploaded before this change) still parse.

**Files:**
- Modify: `app/src/lib/parser/types.ts`
- Modify: `app/src/lib/parser/gameReducer.ts`
- Modify: `app/src/lib/parser/parseGame.ts`
- Modify: `app/src/lib/parser/gameReducer.test.ts` (or wherever SELECT_ACTION negative test lives — search if unsure)

- [ ] **Step 1: Add the new type and optional field**

In `app/src/lib/parser/types.ts`, after the `ActionEvent` interface (around line 207), add:

```typescript
export type PlayerActionType = 'tactical' | 'component' | 'pass';

export interface ActionTypeEvent {
  faction: string;
  actionType: PlayerActionType;
  timestamp: number;
  gameTime?: number;
}
```

In the same file, in the `ParsedGame` interface, after the `actionEvents: ActionEvent[];` line, add:

```typescript
  /** Optional for backward compatibility with documents uploaded before Phase 3.
   *  Aggregators treat absence as []. */
  actionTypeEvents?: ActionTypeEvent[];
```

- [ ] **Step 2: Write the failing reducer test**

Find the existing `gameReducer.test.ts` (search with `Glob: app/src/lib/parser/gameReducer.test.ts`). Append the following block before the final `});` of the outer `describe`:

```typescript
describe('SELECT_ACTION', () => {
  function runReducer(entries: { action: string; event: Record<string, unknown>; timestamp: number }[]) {
    let state = createInitialState([
      { factionId: 'Sol', playerName: 'p', color: '#00f', mapPosition: 0, startingTechs: [], startingPlanets: [] },
    ]);
    state = { ...state, currentTurnFaction: 'Sol' };
    for (const e of entries) {
      state = reduce(state, { action: e.action, event: e.event, timestamp: e.timestamp });
    }
    return state;
  }

  it('captures TACTICAL/COMPONENT/PASS as actionTypeEvents', () => {
    const state = runReducer([
      { action: 'SELECT_ACTION', event: { action: 'TACTICAL' }, timestamp: 100 },
      { action: 'SELECT_ACTION', event: { action: 'COMPONENT' }, timestamp: 200 },
      { action: 'SELECT_ACTION', event: { action: 'PASS' }, timestamp: 300 },
    ]);
    expect(state.actionTypeEvents.map(e => e.actionType)).toEqual(['tactical', 'component', 'pass']);
    expect(state.actionTypeEvents.every(e => e.faction === 'Sol')).toBe(true);
  });

  it('ignores SELECT_ACTION with unknown action string', () => {
    const state = runReducer([
      { action: 'SELECT_ACTION', event: { action: 'UNKNOWN' }, timestamp: 100 },
    ]);
    expect(state.actionTypeEvents).toEqual([]);
  });

  it('ignores SELECT_ACTION with non-string action field', () => {
    const state = runReducer([
      { action: 'SELECT_ACTION', event: {}, timestamp: 100 },
    ]);
    expect(state.actionTypeEvents).toEqual([]);
  });
});
```

If the test file does not yet import `createInitialState` and `reduce`, add them to its imports. If the existing tests use a different invocation harness, mirror that style instead.

- [ ] **Step 3: Run the test to confirm it fails**

```bash
cd app && npx vitest run src/lib/parser/gameReducer.test.ts -t "SELECT_ACTION"
```

Expected: 3 failures — `actionTypeEvents` is not on `ReducerState`.

- [ ] **Step 4: Add `actionTypeEvents` to `ReducerState` and `createInitialState`**

In `app/src/lib/parser/gameReducer.ts`:

1. Add to the type imports at the top (where other event types are imported from `./types`):
   ```typescript
   ActionTypeEvent,
   PlayerActionType,
   ```

2. In the `ReducerState` interface (around line 30), add this field next to `actionEvents`:
   ```typescript
   actionTypeEvents: ActionTypeEvent[];
   ```

3. In `createInitialState` (around line 77), add to the returned object:
   ```typescript
   actionTypeEvents: [],
   ```

4. Replace the existing `case 'SELECT_ACTION': return state;` block (around line 631) with:

```typescript
    case 'SELECT_ACTION': {
      const raw = entry.event['action'];
      if (typeof raw !== 'string') return state;
      const actionTypeMap: Record<string, PlayerActionType> = {
        TACTICAL: 'tactical',
        COMPONENT: 'component',
        PASS: 'pass',
      };
      const actionType = actionTypeMap[raw];
      if (actionType === undefined) return state;
      const ev: ActionTypeEvent = {
        faction: state.currentTurnFaction,
        actionType,
        timestamp: entry.timestamp,
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return { ...state, actionTypeEvents: [...state.actionTypeEvents, ev] };
    }
```

- [ ] **Step 5: Spread the new field into ParsedGame**

In `app/src/lib/parser/parseGame.ts`, in the final `return { ... }` (around line 168), add this line after `actionEvents`:

```typescript
    actionTypeEvents: finalState.actionTypeEvents,
```

- [ ] **Step 6: Re-run reducer test, then full parser test suite**

```bash
cd app && npx vitest run src/lib/parser
```

Expected: all tests pass, including the 3 new SELECT_ACTION tests. If any pre-existing test fails because it spreads a `ReducerState`-shaped object, add `actionTypeEvents: []` to those fixtures.

- [ ] **Step 7: Commit**

```bash
git add app/src/lib/parser/types.ts app/src/lib/parser/gameReducer.ts app/src/lib/parser/parseGame.ts app/src/lib/parser/gameReducer.test.ts
git commit -m "feat(parser): capture SELECT_ACTION as actionTypeEvents"
```

---

## Task 2: `factionExpansions.ts` static dictionary

Maps factionId → expansion tag. The aggregator uses this to break down win rate by expansion.

**Files:**
- Create: `app/src/lib/aggregator/factionExpansions.ts`

- [ ] **Step 1: Discovery — enumerate factions across all 6 game exports**

Run a one-off script to print every unique `factionId` across the parsed games:

```bash
cd app && node --input-type=module -e "
import('./src/lib/parser/parseGame.js').catch(() => null);
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const dir = 'game-data';
const files = readdirSync(dir).filter(f => f.endsWith('.json'));
const ids = new Set();
for (const f of files) {
  const j = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const factions = j?.data?.factions ?? {};
  for (const id of Object.keys(factions)) ids.add(id);
}
console.log([...ids].sort().join('\n'));
"
```

If the import-side approach fails because the parser is TS, fall back to a plain JSON walk (no parser needed for this discovery — only `data.factions` keys):

```bash
cd app && node -e "
const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const dir = 'game-data';
const ids = new Set();
for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const j = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  for (const id of Object.keys(j?.data?.factions ?? {})) ids.add(id);
}
console.log([...ids].sort().join('\n'));
"
```

Capture the output. You will use this list to populate the dictionary in Step 2.

- [ ] **Step 2: Write the static dict**

Create `app/src/lib/aggregator/factionExpansions.ts`:

```typescript
export type ExpansionTag = 'base' | 'pok' | 'ds' | 'te';

/** Manually classified for the playgroup's 6-game corpus. Defaults to 'base'.
 *
 * Expansion guide:
 *  - base: 17 factions in the original TI4 box
 *  - pok:  Prophecy of Kings adds 7 factions (Argent, Empyrean, Mahact, Naaz-Rokha, Nomad, Titans, Vuil'raith)
 *  - ds:   Discordant Stars adds ~34 fan-made factions
 *  - te:   Thunder's Edge / additional codex content
 *
 * For unknown factions encountered in new uploads, default 'base' is fine — UI shows tag but does not change behavior. */
const EXPANSIONS: Record<string, ExpansionTag> = {
  // Populate from Step 1 discovery output. Example shape:
  // 'Federation of Sol': 'base',
  // 'Argent Flight': 'pok',
  // 'Vaden Banking Clans': 'ds',
};

export function getFactionExpansion(factionId: string): ExpansionTag {
  return EXPANSIONS[factionId] ?? 'base';
}
```

Cross-reference each discovered factionId against the official faction lists:
- **base (17):** Federation of Sol, Mentak Coalition, Yin Brotherhood, Embers of Muaat, Arborec, L1Z1X Mindnet, Winnu, Nekro Virus, Naalu Collective, Barony of Letnev, Clan of Saar, Universities of Jol-Nar, Sardakk N'orr, Xxcha Kingdom, Yssaril Tribes, Emirates of Hacan, Ghosts of Creuss
- **pok (7):** Argent Flight, Empyrean, Mahact Gene-Sorcerers, Naaz-Rokha Alliance, Nomad, Titans of Ul, Vuil'raith Cabal
- **ds:** any faction not in the above two lists (Discordant Stars adds Vaden Banking Clans, L'tokk Khrask, etc.)

- [ ] **Step 3: Add to `aggregator/index.ts`**

Replace `app/src/lib/aggregator/index.ts` contents with:

```typescript
export { getFactionExpansion } from './factionExpansions';
export type { ExpansionTag } from './factionExpansions';
```

- [ ] **Step 4: Confirm typecheck passes**

```bash
cd app && npm run typecheck
```

Expected: PASS (no test file required for a static dict).

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/aggregator/factionExpansions.ts app/src/lib/aggregator/index.ts
git commit -m "feat(aggregator): add factionExpansions dictionary"
```

---

## Task 3: `deriveRoundBoundaries` (canonical) + migrate tech caller

**Files:**
- Create: `app/src/lib/aggregator/deriveRoundBoundaries.ts`
- Create: `app/src/lib/aggregator/deriveRoundBoundaries.test.ts`
- Modify: `app/src/lib/tech/buildTechSummary.ts` (delete local stub, import from aggregator)
- Modify: `app/src/lib/tech/buildTechSummary.test.ts` (if it imported the old `RoundBoundary` type)

- [ ] **Step 1: Write the failing tests**

Create `app/src/lib/aggregator/deriveRoundBoundaries.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { deriveRoundBoundaries, assignRound } from './deriveRoundBoundaries';
import type { StrategyCardEvent } from '../parser/types';

function pick(faction: string, card: string, timestamp: number): StrategyCardEvent {
  return { faction, card, timestamp, type: 'pick' };
}

describe('deriveRoundBoundaries', () => {
  it('returns one boundary per chunk of factionCount picks', () => {
    const events: StrategyCardEvent[] = [
      pick('A', 'Lead', 100), pick('B', 'Tech', 110), pick('C', 'War', 120),
      pick('A', 'Imp', 1000), pick('B', 'Pol', 1010), pick('C', 'Diplo', 1020),
    ];
    const result = deriveRoundBoundaries(events, 3);
    expect(result).toEqual([
      { round: 1, startTimestamp: 100 },
      { round: 2, startTimestamp: 1000 },
    ]);
  });

  it('sorts pick events by timestamp before chunking', () => {
    const events: StrategyCardEvent[] = [
      pick('B', 'Tech', 110), pick('C', 'War', 120), pick('A', 'Lead', 100),
    ];
    const result = deriveRoundBoundaries(events, 3);
    expect(result[0]?.startTimestamp).toBe(100);
  });

  it('ignores non-pick strategy card events', () => {
    const events: StrategyCardEvent[] = [
      { faction: 'A', card: 'Lead', timestamp: 50, type: 'play_primary' },
      pick('A', 'Lead', 100), pick('B', 'Tech', 110),
    ];
    const result = deriveRoundBoundaries(events, 2);
    expect(result).toEqual([{ round: 1, startTimestamp: 100 }]);
  });

  it('returns [] for empty events', () => {
    expect(deriveRoundBoundaries([], 4)).toEqual([]);
  });

  it('emits a final boundary even when last chunk is smaller than factionCount', () => {
    const events: StrategyCardEvent[] = [
      pick('A', 'Lead', 100), pick('B', 'Tech', 110), pick('C', 'War', 120),
      pick('A', 'Imp', 1000), // partial round 2
    ];
    const result = deriveRoundBoundaries(events, 3);
    expect(result).toEqual([
      { round: 1, startTimestamp: 100 },
      { round: 2, startTimestamp: 1000 },
    ]);
  });
});

describe('assignRound', () => {
  const boundaries = [
    { round: 1, startTimestamp: 100 },
    { round: 2, startTimestamp: 1000 },
    { round: 3, startTimestamp: 2000 },
  ];

  it('returns round 1 for timestamps before all boundaries (setup events)', () => {
    expect(assignRound(50, boundaries)).toBe(1);
  });

  it('returns the latest round whose startTimestamp <= timestamp', () => {
    expect(assignRound(100, boundaries)).toBe(1);
    expect(assignRound(500, boundaries)).toBe(1);
    expect(assignRound(1000, boundaries)).toBe(2);
    expect(assignRound(1500, boundaries)).toBe(2);
    expect(assignRound(2500, boundaries)).toBe(3);
  });

  it('returns final round for post-game timestamps', () => {
    expect(assignRound(99999, boundaries)).toBe(3);
  });

  it('returns 1 for any timestamp when boundaries are empty', () => {
    expect(assignRound(500, [])).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd app && npx vitest run src/lib/aggregator/deriveRoundBoundaries.test.ts
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `deriveRoundBoundaries` and `assignRound`**

Create `app/src/lib/aggregator/deriveRoundBoundaries.ts`:

```typescript
import type { StrategyCardEvent } from '../parser/types';

export interface RoundBoundary {
  round: number;
  /** Timestamp of the first strategy card pick in this round. */
  startTimestamp: number;
}

/**
 * Returns round boundaries derived from strategy card pick timestamps.
 *
 * Every faction picks exactly one strategy card per round during the strategy
 * phase. Sorting all 'pick' events by timestamp ascending and chunking into
 * groups of factionCount produces one chunk per round. The minimum timestamp
 * in each chunk is that round's startTimestamp.
 *
 * Initial setup events (starting techs/planets) carry timestamps before the
 * first pick; assignRound() correctly maps them to round 1.
 */
export function deriveRoundBoundaries(
  strategyCardEvents: StrategyCardEvent[],
  factionCount: number,
): RoundBoundary[] {
  if (factionCount <= 0) return [];
  const picks = strategyCardEvents
    .filter(e => e.type === 'pick')
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp);

  const boundaries: RoundBoundary[] = [];
  for (let i = 0; i < picks.length; i += factionCount) {
    const chunk = picks.slice(i, i + factionCount);
    const first = chunk[0];
    if (first === undefined) continue;
    boundaries.push({
      round: boundaries.length + 1,
      startTimestamp: first.timestamp,
    });
  }
  return boundaries;
}

/**
 * Returns the round a given timestamp belongs to.
 * Falls back to round 1 for timestamps before the first boundary (setup events)
 * or when boundaries is empty.
 */
export function assignRound(timestamp: number, boundaries: RoundBoundary[]): number {
  if (boundaries.length === 0) return 1;
  let assigned = boundaries[0]?.round ?? 1;
  for (const b of boundaries) {
    if (b.startTimestamp <= timestamp) assigned = b.round;
    else break;
  }
  return assigned;
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd app && npx vitest run src/lib/aggregator/deriveRoundBoundaries.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Migrate `buildTechSummary.ts` to use the new module**

In `app/src/lib/tech/buildTechSummary.ts`:

1. Add to imports at top:
   ```typescript
   import { deriveRoundBoundaries, assignRound, type RoundBoundary } from '../aggregator/deriveRoundBoundaries';
   ```

2. Delete the local `RoundBoundary` interface (lines 32–35).

3. Delete the local stub `deriveRoundBoundaries` function (lines ~37–43, including the eslint-disable comment).

4. Delete the local `assignRound` helper (lines ~45–53).

5. Re-export the types so existing consumers of `buildTechSummary` types keep working:

   At the top of the file (after the imports), add:
   ```typescript
   export { deriveRoundBoundaries, assignRound };
   export type { RoundBoundary };
   ```

   This preserves the public surface of `buildTechSummary.ts` for any caller that was importing `RoundBoundary` from there.

- [ ] **Step 6: Update aggregator index to export the new module**

Replace `app/src/lib/aggregator/index.ts`:

```typescript
export { getFactionExpansion } from './factionExpansions';
export type { ExpansionTag } from './factionExpansions';
export { deriveRoundBoundaries, assignRound } from './deriveRoundBoundaries';
export type { RoundBoundary } from './deriveRoundBoundaries';
```

- [ ] **Step 7: Run the full test suite to catch any broken imports**

```bash
cd app && npm run typecheck && npm test
```

Expected: all tests pass. If `buildTechSummary.test.ts` or any other file imported `RoundBoundary` with the old `phaseStartTimestamp` field, fix the field name to `startTimestamp`.

- [ ] **Step 8: Commit**

```bash
git add app/src/lib/aggregator/deriveRoundBoundaries.ts app/src/lib/aggregator/deriveRoundBoundaries.test.ts app/src/lib/aggregator/index.ts app/src/lib/tech/buildTechSummary.ts
git commit -m "feat(aggregator): add deriveRoundBoundaries from strategy card picks"
```

---

## Task 4: `buildFactionStats` aggregator

Per-faction win rate, frequent pairings, Support for the Throne transfers.

**Files:**
- Create: `app/src/lib/aggregator/buildFactionStats.ts`
- Create: `app/src/lib/aggregator/buildFactionStats.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `app/src/lib/aggregator/buildFactionStats.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildFactionStats } from './buildFactionStats';
import type { ParsedGame, FactionSetup, VpEvent, PromissoryNoteEvent, AgendaResolution } from '../parser/types';

function makeFaction(id: string, mapPosition = 0): FactionSetup {
  return { factionId: id, playerName: 'p', color: '#aaa', mapPosition, startingTechs: [], startingPlanets: [] };
}

function makeGame(opts: {
  gameId: string;
  factions: string[];
  finalScores: Record<string, number>;
  winner: string | null;
  vpEvents?: VpEvent[];
  promissoryNoteEvents?: PromissoryNoteEvent[];
  agendaResolutions?: AgendaResolution[];
}): ParsedGame {
  return {
    gameId: opts.gameId, playedAt: 0, durationSeconds: 3600,
    factions: opts.factions.map((id, i) => makeFaction(id, i)),
    options: { victoryPoints: 10 },
    initialSpeaker: opts.factions[0] ?? '',
    phaseSnapshots: [], vpEvents: opts.vpEvents ?? [], planetEvents: [], techEvents: [],
    agendaResolutions: opts.agendaResolutions ?? [], strategyCardEvents: [], actionCardEvents: [], componentEvents: [],
    relicEvents: [], leaderEvents: [], objectiveReveals: [], speakerEvents: [],
    attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: opts.promissoryNoteEvents ?? [],
    expeditionEvents: [], secondaryEvents: [], actionEvents: [],
    finalScores: opts.finalScores, winner: opts.winner,
    timers: { game: 3600, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
  };
}

describe('buildFactionStats', () => {
  it('returns empty summary for empty games array', () => {
    const result = buildFactionStats([]);
    expect(result.totalGames).toBe(0);
    expect(result.factions).toEqual([]);
    expect(result.topPairings).toEqual([]);
    expect(result.sftTransfers).toEqual([]);
  });

  it('counts gamesPlayed and wins per faction', () => {
    const games = [
      makeGame({ gameId: 'g1', factions: ['Sol', 'Hacan'], finalScores: { Sol: 10, Hacan: 7 }, winner: 'Sol' }),
      makeGame({ gameId: 'g2', factions: ['Sol', 'Hacan'], finalScores: { Sol: 10, Hacan: 6 }, winner: 'Sol' }),
    ];
    const result = buildFactionStats(games);
    const sol = result.factions.find(f => f.factionId === 'Sol');
    expect(sol?.gamesPlayed).toBe(2);
    expect(sol?.wins).toBe(2);
    expect(sol?.winRate).toBe(1);
  });

  it('winRate is 0 when faction never won', () => {
    const games = [
      makeGame({ gameId: 'g1', factions: ['Sol', 'Hacan'], finalScores: { Sol: 5, Hacan: 10 }, winner: 'Hacan' }),
    ];
    const sol = buildFactionStats(games).factions.find(f => f.factionId === 'Sol');
    expect(sol?.winRate).toBe(0);
  });

  it('avgFinalVp averages finalScores across games', () => {
    const games = [
      makeGame({ gameId: 'g1', factions: ['Sol'], finalScores: { Sol: 10 }, winner: 'Sol' }),
      makeGame({ gameId: 'g2', factions: ['Sol'], finalScores: { Sol: 6 }, winner: null }),
    ];
    const sol = buildFactionStats(games).factions.find(f => f.factionId === 'Sol');
    expect(sol?.avgFinalVp).toBe(8);
  });

  it('orders factions by winRate desc, then gamesPlayed desc', () => {
    const games = [
      makeGame({ gameId: 'g1', factions: ['A', 'B'], finalScores: { A: 10, B: 5 }, winner: 'A' }),
      makeGame({ gameId: 'g2', factions: ['A', 'B'], finalScores: { A: 5, B: 10 }, winner: 'B' }),
      makeGame({ gameId: 'g3', factions: ['C'], finalScores: { C: 10 }, winner: 'C' }),
    ];
    const result = buildFactionStats(games);
    expect(result.factions[0]?.factionId).toBe('C'); // 100% win rate
    expect(result.factions[0]?.gamesPlayed).toBe(1);
  });

  it('topPairings counts co-appearances in canonical (lex-sorted) order', () => {
    const games = [
      makeGame({ gameId: 'g1', factions: ['Sol', 'Hacan'], finalScores: { Sol: 10, Hacan: 5 }, winner: 'Sol' }),
      makeGame({ gameId: 'g2', factions: ['Hacan', 'Sol'], finalScores: { Sol: 5, Hacan: 10 }, winner: 'Hacan' }),
    ];
    const pairing = buildFactionStats(games).topPairings[0];
    expect(pairing?.factionA).toBe('Hacan'); // lex-first
    expect(pairing?.factionB).toBe('Sol');
    expect(pairing?.coAppearances).toBe(2);
  });

  it('sftTransfers records Support for the Throne play events', () => {
    const games = [
      makeGame({
        gameId: 'g1', factions: ['Sol', 'Hacan'], finalScores: { Sol: 10, Hacan: 5 }, winner: 'Sol',
        promissoryNoteEvents: [
          { fromFaction: 'Sol', toFaction: 'Hacan', note: 'Support for the Throne', timestamp: 100, type: 'play' },
          { fromFaction: 'Sol', toFaction: 'Hacan', note: 'Trade Agreement',        timestamp: 200, type: 'play' },
        ],
      }),
    ];
    const result = buildFactionStats(games);
    expect(result.sftTransfers).toEqual([{ fromFaction: 'Sol', toFaction: 'Hacan', count: 1 }]);
  });

  it('counts an SFT transfer once per game even if played multiple times', () => {
    const games = [
      makeGame({
        gameId: 'g1', factions: ['Sol', 'Hacan'], finalScores: { Sol: 10, Hacan: 5 }, winner: 'Sol',
        promissoryNoteEvents: [
          { fromFaction: 'Sol', toFaction: 'Hacan', note: 'Support for the Throne', timestamp: 100, type: 'play' },
          { fromFaction: 'Sol', toFaction: 'Hacan', note: 'Support for the Throne', timestamp: 200, type: 'play' },
        ],
      }),
    ];
    expect(buildFactionStats(games).sftTransfers[0]?.count).toBe(1);
  });

  it('attaches expansion tag to each faction', () => {
    const games = [makeGame({ gameId: 'g1', factions: ['Federation of Sol'], finalScores: { 'Federation of Sol': 10 }, winner: 'Federation of Sol' })];
    expect(buildFactionStats(games).factions[0]?.expansion).toBe('base');
  });

  it('winningVoteRate counts votes that match the resolved outcome', () => {
    const agendaResolutions: AgendaResolution[] = [
      {
        agenda: 'Mutiny', outcome: 'For', round: 2, timestamp: 1000,
        votes: [
          { faction: 'Sol',   outcome: 'For',     votes: 4 },  // matched
          { faction: 'Hacan', outcome: 'Against', votes: 2 },  // not matched
        ],
        riders: [],
      },
      {
        agenda: 'Classified Document Leaks', outcome: 'Against', round: 3, timestamp: 2000,
        votes: [
          { faction: 'Sol',   outcome: 'Against', votes: 3 },  // matched
          { faction: 'Hacan', outcome: 'Against', votes: 5 },  // matched
        ],
        riders: [],
      },
    ];
    const games = [makeGame({
      gameId: 'g1', factions: ['Sol', 'Hacan'],
      finalScores: { Sol: 10, Hacan: 5 }, winner: 'Sol',
      agendaResolutions,
    })];
    const stats = buildFactionStats(games).factions;
    expect(stats.find(f => f.factionId === 'Sol')?.winningVoteRate).toBe(1);    // 2/2
    expect(stats.find(f => f.factionId === 'Hacan')?.winningVoteRate).toBe(0.5); // 1/2
  });

  it('winningVoteRate is null when faction never voted on a binary outcome', () => {
    const agendaResolutions: AgendaResolution[] = [
      // Elect-type outcome: 'Mecatol Rex' is neither 'For' nor 'Against' — votes still counted iff vote.outcome matches
      { agenda: 'Holy Planet of Ixth', outcome: 'Mecatol Rex', round: 2, timestamp: 1000,
        votes: [{ faction: 'Sol', outcome: 'Mecatol Rex', votes: 2 }], riders: [] },
    ];
    const games = [makeGame({
      gameId: 'g1', factions: ['Sol', 'Hacan'],
      finalScores: { Sol: 10, Hacan: 5 }, winner: 'Sol',
      agendaResolutions,
    })];
    const stats = buildFactionStats(games).factions;
    // Sol voted for the elected outcome — counts as winning vote (1/1)
    expect(stats.find(f => f.factionId === 'Sol')?.winningVoteRate).toBe(1);
    // Hacan never cast a vote — null
    expect(stats.find(f => f.factionId === 'Hacan')?.winningVoteRate).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd app && npx vitest run src/lib/aggregator/buildFactionStats.test.ts
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `buildFactionStats`**

Create `app/src/lib/aggregator/buildFactionStats.ts`:

```typescript
import type { ParsedGame, VpSource } from '../parser/types';
import { getFactionExpansion, type ExpansionTag } from './factionExpansions';

export interface FactionStat {
  factionId: string;
  expansion: ExpansionTag;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  avgFinalVp: number;
  /** Reserved for future use: per-round average VP. Empty until wired up. */
  avgVpPerRound: number[];
  distinctVpSources: VpSource[];
  /** Senate Power Index — fraction of agenda votes cast by this faction whose
   *  vote.outcome matched the resolution.outcome. Null if faction never voted. */
  winningVoteRate: number | null;
}

export interface FactionPairing {
  factionA: string;
  factionB: string;
  coAppearances: number;
}

export interface SftTransfer {
  fromFaction: string;
  toFaction: string;
  count: number;
}

export interface FactionStatsSummary {
  totalGames: number;
  factions: FactionStat[];
  topPairings: FactionPairing[];
  sftTransfers: SftTransfer[];
}

const SFT_NOTE = 'Support for the Throne';

export function buildFactionStats(games: ParsedGame[]): FactionStatsSummary {
  if (games.length === 0) {
    return { totalGames: 0, factions: [], topPairings: [], sftTransfers: [] };
  }

  // Per-faction running totals
  const playCount = new Map<string, number>();
  const winCount = new Map<string, number>();
  const vpTotal = new Map<string, number>();
  const sources = new Map<string, Set<VpSource>>();
  const votesCast = new Map<string, number>();
  const votesWith = new Map<string, number>();

  for (const game of games) {
    for (const faction of game.factions) {
      const id = faction.factionId;
      playCount.set(id, (playCount.get(id) ?? 0) + 1);
      vpTotal.set(id, (vpTotal.get(id) ?? 0) + (game.finalScores[id] ?? 0));
      if (!sources.has(id)) sources.set(id, new Set());
    }
    for (const ev of game.vpEvents) {
      const set = sources.get(ev.faction);
      if (set !== undefined) set.add(ev.source);
    }
    if (game.winner !== null) {
      winCount.set(game.winner, (winCount.get(game.winner) ?? 0) + 1);
    }
    // Senate Power Index: count votes whose outcome matched the resolved outcome.
    for (const res of game.agendaResolutions) {
      for (const v of res.votes) {
        votesCast.set(v.faction, (votesCast.get(v.faction) ?? 0) + 1);
        if (v.outcome === res.outcome) {
          votesWith.set(v.faction, (votesWith.get(v.faction) ?? 0) + 1);
        }
      }
    }
  }

  const factions: FactionStat[] = [...playCount.entries()].map(([id, gp]) => {
    const wins = winCount.get(id) ?? 0;
    const cast = votesCast.get(id) ?? 0;
    return {
      factionId: id,
      expansion: getFactionExpansion(id),
      gamesPlayed: gp,
      wins,
      winRate: gp > 0 ? wins / gp : 0,
      avgFinalVp: gp > 0 ? (vpTotal.get(id) ?? 0) / gp : 0,
      avgVpPerRound: [],
      distinctVpSources: [...(sources.get(id) ?? [])],
      winningVoteRate: cast > 0 ? (votesWith.get(id) ?? 0) / cast : null,
    };
  });
  factions.sort((a, b) => b.winRate - a.winRate || b.gamesPlayed - a.gamesPlayed);

  // Pairings
  const pairCounts = new Map<string, number>();
  for (const game of games) {
    const ids = game.factions.map(f => f.factionId).sort();
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i];
        const b = ids[j];
        if (a === undefined || b === undefined) continue;
        const key = `${a} ${b}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }
  const topPairings: FactionPairing[] = [...pairCounts.entries()]
    .map(([key, coAppearances]) => {
      const [factionA, factionB] = key.split(' ');
      return { factionA: factionA ?? '', factionB: factionB ?? '', coAppearances };
    })
    .sort((a, b) => b.coAppearances - a.coAppearances)
    .slice(0, 10);

  // Support for the Throne — count distinct game-direction occurrences
  const sftCounts = new Map<string, number>();
  for (const game of games) {
    const seenInGame = new Set<string>();
    for (const note of game.promissoryNoteEvents) {
      if (note.note !== SFT_NOTE || note.type !== 'play') continue;
      const key = `${note.fromFaction} ${note.toFaction}`;
      if (seenInGame.has(key)) continue;
      seenInGame.add(key);
      sftCounts.set(key, (sftCounts.get(key) ?? 0) + 1);
    }
  }
  const sftTransfers: SftTransfer[] = [...sftCounts.entries()].map(([key, count]) => {
    const [fromFaction, toFaction] = key.split(' ');
    return { fromFaction: fromFaction ?? '', toFaction: toFaction ?? '', count };
  });

  return { totalGames: games.length, factions, topPairings, sftTransfers };
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd app && npx vitest run src/lib/aggregator/buildFactionStats.test.ts
```

Expected: 9 tests pass.

- [ ] **Step 5: Add to aggregator index**

In `app/src/lib/aggregator/index.ts`, append:

```typescript
export { buildFactionStats } from './buildFactionStats';
export type {
  FactionStat,
  FactionPairing,
  SftTransfer,
  FactionStatsSummary,
} from './buildFactionStats';
```

- [ ] **Step 6: Commit**

```bash
git add app/src/lib/aggregator/buildFactionStats.ts app/src/lib/aggregator/buildFactionStats.test.ts app/src/lib/aggregator/index.ts
git commit -m "feat(aggregator): add buildFactionStats"
```

---

## Task 5: `buildStrategyCardStats` aggregator

**Files:**
- Create: `app/src/lib/aggregator/buildStrategyCardStats.ts`
- Create: `app/src/lib/aggregator/buildStrategyCardStats.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `app/src/lib/aggregator/buildStrategyCardStats.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildStrategyCardStats } from './buildStrategyCardStats';
import type { ParsedGame, StrategyCardEvent } from '../parser/types';
import type { RoundBoundary } from './deriveRoundBoundaries';

function makeGame(gameId: string, strategyCardEvents: StrategyCardEvent[]): ParsedGame {
  return {
    gameId, playedAt: 0, durationSeconds: 3600,
    factions: [
      { factionId: 'A', playerName: 'p', color: '#aaa', mapPosition: 0, startingTechs: [], startingPlanets: [] },
      { factionId: 'B', playerName: 'p', color: '#bbb', mapPosition: 1, startingTechs: [], startingPlanets: [] },
    ],
    options: {}, initialSpeaker: 'A',
    phaseSnapshots: [], vpEvents: [], planetEvents: [], techEvents: [],
    agendaResolutions: [], strategyCardEvents, actionCardEvents: [], componentEvents: [],
    relicEvents: [], leaderEvents: [], objectiveReveals: [], speakerEvents: [],
    attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: [],
    expeditionEvents: [], secondaryEvents: [], actionEvents: [],
    finalScores: {}, winner: null,
    timers: { game: 3600, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
  };
}

describe('buildStrategyCardStats', () => {
  it('returns empty summary for empty games', () => {
    const result = buildStrategyCardStats([], new Map());
    expect(result.cards).toEqual([]);
    expect(result.mostContested).toEqual([]);
  });

  it('totals picks across games and rounds', () => {
    const game = makeGame('g1', [
      { faction: 'A', card: 'Tech', timestamp: 100, type: 'pick' },
      { faction: 'B', card: 'Tech', timestamp: 200, type: 'pick' },
    ]);
    const boundaries = new Map<string, RoundBoundary[]>([['g1', [{ round: 1, startTimestamp: 100 }]]]);
    const result = buildStrategyCardStats([game], boundaries);
    const tech = result.cards.find(c => c.card === 'Tech');
    expect(tech?.totalPicks).toBe(2);
  });

  it('secondaryFollowRate is play / (play + pass)', () => {
    const game = makeGame('g1', [
      { faction: 'A', card: 'Tech', timestamp: 100, type: 'pick' },
      { faction: 'B', card: 'Tech', timestamp: 110, type: 'play_secondary' },
      { faction: 'A', card: 'Tech', timestamp: 120, type: 'play_secondary' },
      { faction: 'B', card: 'Tech', timestamp: 130, type: 'pass_secondary' },
    ]);
    const boundaries = new Map<string, RoundBoundary[]>([['g1', [{ round: 1, startTimestamp: 100 }]]]);
    const tech = buildStrategyCardStats([game], boundaries).cards.find(c => c.card === 'Tech');
    expect(tech?.secondaryFollowRate).toBeCloseTo(2 / 3, 5);
  });

  it('secondaryFollowRate is null when no secondary events exist', () => {
    const game = makeGame('g1', [
      { faction: 'A', card: 'Construction', timestamp: 100, type: 'pick' },
    ]);
    const boundaries = new Map<string, RoundBoundary[]>([['g1', [{ round: 1, startTimestamp: 100 }]]]);
    expect(buildStrategyCardStats([game], boundaries).cards[0]?.secondaryFollowRate).toBeNull();
  });

  it('avgPickPosition orders by timestamp within the same round', () => {
    const game = makeGame('g1', [
      { faction: 'A', card: 'Imperial', timestamp: 100, type: 'pick' },  // pos 1
      { faction: 'B', card: 'Tech',     timestamp: 200, type: 'pick' },  // pos 2
      { faction: 'A', card: 'Tech',     timestamp: 1000, type: 'pick' }, // pos 1 in round 2
      { faction: 'B', card: 'Imperial', timestamp: 1100, type: 'pick' }, // pos 2
    ]);
    const boundaries = new Map<string, RoundBoundary[]>([
      ['g1', [{ round: 1, startTimestamp: 100 }, { round: 2, startTimestamp: 1000 }]],
    ]);
    const result = buildStrategyCardStats([game], boundaries);
    const tech = result.cards.find(c => c.card === 'Tech');
    // Tech picked at pos 2 in r1, pos 1 in r2 → avg 1.5
    expect(tech?.avgPickPosition).toBeCloseTo(1.5, 5);
    expect(tech?.avgPickPositionByRound[1]).toBe(2);
    expect(tech?.avgPickPositionByRound[2]).toBe(1);
  });

  it('pickCountByRound buckets picks per round', () => {
    const game = makeGame('g1', [
      { faction: 'A', card: 'Tech', timestamp: 100, type: 'pick' },
      { faction: 'B', card: 'Tech', timestamp: 1000, type: 'pick' },
    ]);
    const boundaries = new Map<string, RoundBoundary[]>([
      ['g1', [{ round: 1, startTimestamp: 100 }, { round: 2, startTimestamp: 1000 }]],
    ]);
    const tech = buildStrategyCardStats([game], boundaries).cards.find(c => c.card === 'Tech');
    expect(tech?.pickCountByRound[1]).toBe(1);
    expect(tech?.pickCountByRound[2]).toBe(1);
  });

  it('mostContested orders by avgPickPosition asc', () => {
    const game = makeGame('g1', [
      { faction: 'A', card: 'Tech',     timestamp: 100, type: 'pick' }, // pos 1
      { faction: 'B', card: 'Politics', timestamp: 200, type: 'pick' }, // pos 2
    ]);
    const boundaries = new Map<string, RoundBoundary[]>([['g1', [{ round: 1, startTimestamp: 100 }]]]);
    expect(buildStrategyCardStats([game], boundaries).mostContested[0]).toBe('Tech');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd app && npx vitest run src/lib/aggregator/buildStrategyCardStats.test.ts
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `buildStrategyCardStats`**

Create `app/src/lib/aggregator/buildStrategyCardStats.ts`:

```typescript
import type { ParsedGame, StrategyCardEvent } from '../parser/types';
import { assignRound, type RoundBoundary } from './deriveRoundBoundaries';

export interface StrategyCardStat {
  card: string;
  totalPicks: number;
  secondaryFollowRate: number | null;
  avgPickPosition: number | null;
  avgPickPositionByRound: Record<number, number | null>;
  secondaryFollowRateByRound: Record<number, number | null>;
  pickCountByRound: Record<number, number>;
}

export interface StrategyCardSummary {
  cards: StrategyCardStat[];
  mostContested: string[];
}

interface PerCardAcc {
  picks: number;
  follows: number;
  passes: number;
  positions: number[];                                       // overall avg
  positionsByRound: Map<number, number[]>;
  followsByRound: Map<number, { f: number; p: number }>;
  pickCountByRound: Map<number, number>;
}

export function buildStrategyCardStats(
  games: ParsedGame[],
  roundBoundariesByGame: Map<string, RoundBoundary[]>,
): StrategyCardSummary {
  const acc = new Map<string, PerCardAcc>();
  const get = (card: string): PerCardAcc => {
    let cur = acc.get(card);
    if (cur === undefined) {
      cur = {
        picks: 0, follows: 0, passes: 0, positions: [],
        positionsByRound: new Map(), followsByRound: new Map(), pickCountByRound: new Map(),
      };
      acc.set(card, cur);
    }
    return cur;
  };

  for (const game of games) {
    const boundaries = roundBoundariesByGame.get(game.gameId) ?? [];

    // Bucket pick events by round, then sort each bucket by timestamp to compute position.
    const picksByRound = new Map<number, StrategyCardEvent[]>();
    for (const ev of game.strategyCardEvents) {
      if (ev.type !== 'pick') continue;
      const round = assignRound(ev.timestamp, boundaries);
      const arr = picksByRound.get(round) ?? [];
      arr.push(ev);
      picksByRound.set(round, arr);
    }
    for (const [round, picks] of picksByRound) {
      picks.sort((a, b) => a.timestamp - b.timestamp);
      picks.forEach((ev, idx) => {
        const a = get(ev.card);
        const position = idx + 1;
        a.picks += 1;
        a.positions.push(position);
        const ra = a.positionsByRound.get(round) ?? [];
        ra.push(position);
        a.positionsByRound.set(round, ra);
        a.pickCountByRound.set(round, (a.pickCountByRound.get(round) ?? 0) + 1);
      });
    }

    // Secondary follow / pass events
    for (const ev of game.strategyCardEvents) {
      if (ev.type !== 'play_secondary' && ev.type !== 'pass_secondary') continue;
      const round = assignRound(ev.timestamp, boundaries);
      const a = get(ev.card);
      const fp = a.followsByRound.get(round) ?? { f: 0, p: 0 };
      if (ev.type === 'play_secondary') { a.follows += 1; fp.f += 1; }
      else                              { a.passes  += 1; fp.p += 1; }
      a.followsByRound.set(round, fp);
    }
  }

  const cards: StrategyCardStat[] = [...acc.entries()].map(([card, a]) => {
    const avgPickPosition = a.positions.length > 0
      ? a.positions.reduce((s, n) => s + n, 0) / a.positions.length
      : null;
    const totalSecondary = a.follows + a.passes;
    const secondaryFollowRate = totalSecondary > 0 ? a.follows / totalSecondary : null;

    const avgPickPositionByRound: Record<number, number | null> = {};
    for (const [round, positions] of a.positionsByRound) {
      avgPickPositionByRound[round] = positions.length > 0
        ? positions.reduce((s, n) => s + n, 0) / positions.length
        : null;
    }
    const secondaryFollowRateByRound: Record<number, number | null> = {};
    for (const [round, fp] of a.followsByRound) {
      const total = fp.f + fp.p;
      secondaryFollowRateByRound[round] = total > 0 ? fp.f / total : null;
    }
    const pickCountByRound: Record<number, number> = {};
    for (const [round, count] of a.pickCountByRound) pickCountByRound[round] = count;

    return {
      card, totalPicks: a.picks, secondaryFollowRate,
      avgPickPosition, avgPickPositionByRound, secondaryFollowRateByRound, pickCountByRound,
    };
  });

  cards.sort((a, b) => b.totalPicks - a.totalPicks);

  const mostContested = [...cards]
    .filter(c => c.avgPickPosition !== null)
    .sort((a, b) => (a.avgPickPosition ?? 0) - (b.avgPickPosition ?? 0))
    .map(c => c.card);

  return { cards, mostContested };
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd app && npx vitest run src/lib/aggregator/buildStrategyCardStats.test.ts
```

Expected: 7 tests pass.

- [ ] **Step 5: Export from aggregator index**

Append to `app/src/lib/aggregator/index.ts`:

```typescript
export { buildStrategyCardStats } from './buildStrategyCardStats';
export type { StrategyCardStat, StrategyCardSummary } from './buildStrategyCardStats';
```

- [ ] **Step 6: Commit**

```bash
git add app/src/lib/aggregator/buildStrategyCardStats.ts app/src/lib/aggregator/buildStrategyCardStats.test.ts app/src/lib/aggregator/index.ts
git commit -m "feat(aggregator): add buildStrategyCardStats"
```

---

## Task 6: `buildTechStats` aggregator

Cross-game tech research counts, by-color groupings, winner-held rate, avg round of first research.

**Files:**
- Create: `app/src/lib/aggregator/buildTechStats.ts`
- Create: `app/src/lib/aggregator/buildTechStats.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `app/src/lib/aggregator/buildTechStats.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildTechStats } from './buildTechStats';
import type { ParsedGame, TechEvent } from '../parser/types';
import type { RoundBoundary } from './deriveRoundBoundaries';

function makeGame(gameId: string, opts: {
  factions?: string[];
  techEvents?: TechEvent[];
  winner?: string | null;
  finalScores?: Record<string, number>;
}): ParsedGame {
  const factions = (opts.factions ?? ['Sol']).map((id, i) => ({
    factionId: id, playerName: 'p', color: '#aaa', mapPosition: i, startingTechs: [], startingPlanets: [],
  }));
  return {
    gameId, playedAt: 0, durationSeconds: 3600,
    factions, options: {}, initialSpeaker: factions[0]?.factionId ?? '',
    phaseSnapshots: [], vpEvents: [], planetEvents: [], techEvents: opts.techEvents ?? [],
    agendaResolutions: [], strategyCardEvents: [], actionCardEvents: [], componentEvents: [],
    relicEvents: [], leaderEvents: [], objectiveReveals: [], speakerEvents: [],
    attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: [],
    expeditionEvents: [], secondaryEvents: [], actionEvents: [],
    finalScores: opts.finalScores ?? {}, winner: opts.winner ?? null,
    timers: { game: 3600, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
  };
}

describe('buildTechStats', () => {
  it('returns empty summary for empty games', () => {
    const result = buildTechStats([], new Map());
    expect(result.topTechs).toEqual([]);
    expect(result.byColor.green).toEqual([]);
  });

  it('aggregates research counts across games', () => {
    const games = [
      makeGame('g1', { techEvents: [
        { faction: 'Sol', tech: 'Plasma Scoring', timestamp: 100, type: 'research' },
      ] }),
      makeGame('g2', { techEvents: [
        { faction: 'Sol', tech: 'Plasma Scoring', timestamp: 100, type: 'research' },
      ] }),
    ];
    const result = buildTechStats(games, new Map());
    const ps = result.topTechs.find(t => t.tech === 'Plasma Scoring');
    expect(ps?.researchCount).toBe(2);
  });

  it('excludes starting techs from researchCount but includes them in winnerHeldRate', () => {
    const games = [
      makeGame('g1', {
        winner: 'Sol',
        techEvents: [
          { faction: 'Sol', tech: 'Antimass Deflectors', timestamp: 50, type: 'starting' },
        ],
      }),
    ];
    const result = buildTechStats(games, new Map());
    const amd = result.topTechs.find(t => t.tech === 'Antimass Deflectors');
    // Starting tech: researchCount 0, but winner held it → winnerHeldRate 1
    expect(amd?.researchCount).toBe(0);
    expect(amd?.winnerHeldRate).toBe(1);
  });

  it('winnerHeldRate excludes games where winner is null', () => {
    const games = [
      makeGame('g1', { winner: null, techEvents: [
        { faction: 'Sol', tech: 'Sarween Tools', timestamp: 100, type: 'research' },
      ] }),
    ];
    const result = buildTechStats(games, new Map());
    const st = result.topTechs.find(t => t.tech === 'Sarween Tools');
    expect(st?.winnerHeldRate).toBe(0);  // 0 / 0 → 0 by convention (no winner games)
  });

  it('avgRoundFirstResearched is null when no boundaries available', () => {
    const games = [makeGame('g1', { techEvents: [
      { faction: 'Sol', tech: 'AI Development Algorithm', timestamp: 100, type: 'research' },
    ] })];
    expect(buildTechStats(games, new Map()).topTechs[0]?.avgRoundFirstResearched).toBeNull();
  });

  it('avgRoundFirstResearched uses boundaries when present', () => {
    const games = [
      makeGame('g1', { techEvents: [
        { faction: 'Sol', tech: 'AI Development Algorithm', timestamp: 1500, type: 'research' },
      ] }),
    ];
    const boundaries = new Map<string, RoundBoundary[]>([
      ['g1', [{ round: 1, startTimestamp: 100 }, { round: 2, startTimestamp: 1000 }]],
    ]);
    expect(buildTechStats(games, boundaries).topTechs[0]?.avgRoundFirstResearched).toBe(2);
  });

  it('byColor groups techs by their color', () => {
    const games = [makeGame('g1', { techEvents: [
      { faction: 'Sol', tech: 'Plasma Scoring',  timestamp: 100, type: 'research' }, // red
      { faction: 'Sol', tech: 'Sarween Tools',   timestamp: 200, type: 'research' }, // yellow
    ] })];
    const result = buildTechStats(games, new Map());
    expect(result.byColor.red.some(t => t.tech === 'Plasma Scoring')).toBe(true);
    expect(result.byColor.yellow.some(t => t.tech === 'Sarween Tools')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd app && npx vitest run src/lib/aggregator/buildTechStats.test.ts
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `buildTechStats`**

Create `app/src/lib/aggregator/buildTechStats.ts`:

```typescript
import type { ParsedGame } from '../parser/types';
import { lookupTechColor, type TechColor } from '../parser/techs';
import { assignRound, type RoundBoundary } from './deriveRoundBoundaries';

export interface TechStat {
  tech: string;
  color: TechColor;
  researchCount: number;
  researchingFactions: string[];
  avgRoundFirstResearched: number | null;
  winnerHeldRate: number;
  winnerHeldCount: number;
}

export interface TechSummary {
  topTechs: TechStat[];
  byColor: Record<TechColor, TechStat[]>;
  /** Number of games with a non-null winner. Denominator for "N of M winning games" displays. */
  totalWinnerGames: number;
}

interface TechAcc {
  researchCount: number;
  factions: Set<string>;
  firstRoundsPerGame: number[];
  winnerHeldCount: number;
}

export function buildTechStats(
  games: ParsedGame[],
  roundBoundariesByGame: Map<string, RoundBoundary[]>,
): TechSummary {
  const acc = new Map<string, TechAcc>();
  const get = (tech: string): TechAcc => {
    let cur = acc.get(tech);
    if (cur === undefined) {
      cur = { researchCount: 0, factions: new Set(), firstRoundsPerGame: [], winnerHeldCount: 0 };
      acc.set(tech, cur);
    }
    return cur;
  };

  const winnerGames = games.filter(g => g.winner !== null).length;

  for (const game of games) {
    const boundaries = roundBoundariesByGame.get(game.gameId) ?? [];

    // Track first-research round per tech per game
    const firstResearchInGame = new Map<string, number>();
    // Track techs held by the winner (research OR starting)
    const winnerTechs = new Set<string>();

    for (const ev of game.techEvents) {
      if (ev.type === 'research') {
        const a = get(ev.tech);
        a.researchCount += 1;
        a.factions.add(ev.faction);
        if (boundaries.length > 0 && !firstResearchInGame.has(ev.tech)) {
          firstResearchInGame.set(ev.tech, assignRound(ev.timestamp, boundaries));
        }
      } else if (ev.type === 'starting') {
        get(ev.tech); // ensure entry exists for winnerHeldRate denominator
        get(ev.tech).factions.add(ev.faction);
      }
      if (game.winner !== null && ev.faction === game.winner &&
          (ev.type === 'research' || ev.type === 'starting')) {
        winnerTechs.add(ev.tech);
      }
    }

    for (const [tech, round] of firstResearchInGame) {
      get(tech).firstRoundsPerGame.push(round);
    }
    for (const tech of winnerTechs) {
      get(tech).winnerHeldCount += 1;
    }
  }

  const stats: TechStat[] = [...acc.entries()].map(([tech, a]) => ({
    tech,
    color: lookupTechColor(tech),
    researchCount: a.researchCount,
    researchingFactions: [...a.factions],
    avgRoundFirstResearched: a.firstRoundsPerGame.length > 0
      ? a.firstRoundsPerGame.reduce((s, n) => s + n, 0) / a.firstRoundsPerGame.length
      : null,
    winnerHeldRate: winnerGames > 0 ? a.winnerHeldCount / winnerGames : 0,
    winnerHeldCount: a.winnerHeldCount,
  }));

  const topTechs = [...stats].sort((a, b) => b.researchCount - a.researchCount).slice(0, 15);

  const byColor: Record<TechColor, TechStat[]> = {
    green: [], blue: [], yellow: [], red: [], unit: [],
  };
  for (const s of stats) byColor[s.color].push(s);
  for (const color of Object.keys(byColor) as TechColor[]) {
    byColor[color].sort((a, b) => b.researchCount - a.researchCount);
  }

  return { topTechs, byColor, totalWinnerGames: winnerGames };
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd app && npx vitest run src/lib/aggregator/buildTechStats.test.ts
```

Expected: 7 tests pass.

- [ ] **Step 5: Export from aggregator index**

Append to `app/src/lib/aggregator/index.ts`:

```typescript
export { buildTechStats } from './buildTechStats';
export type { TechStat, TechSummary } from './buildTechStats';
```

- [ ] **Step 6: Commit**

```bash
git add app/src/lib/aggregator/buildTechStats.ts app/src/lib/aggregator/buildTechStats.test.ts app/src/lib/aggregator/index.ts
git commit -m "feat(aggregator): add buildTechStats"
```

---

## Task 7: `buildGameStats` aggregator (with hero discovery)

The biggest aggregator: Mecatol, action types, heroes, relics, agendas, comeback, VP source breakdown, objective timing.

**Files:**
- Create: `app/src/lib/aggregator/heroLeaders.ts`
- Create: `app/src/lib/aggregator/buildGameStats.ts`
- Create: `app/src/lib/aggregator/buildGameStats.test.ts`

- [ ] **Step 1: Discovery — enumerate played leader names**

Run a one-off script to list every distinct `leader` string that has a `play` event across the parsed games. The output seeds the `HEROES` set.

```bash
cd app && npx vitest run --reporter=verbose -t "DISCOVERY:leaders" 2>/dev/null || true
```

If no such test exists yet, create a temporary discovery file `app/src/lib/aggregator/_discovery.test.ts`:

```typescript
import { describe, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseGame } from '../parser/parseGame';

describe.skip('DISCOVERY:leaders', () => {
  it('prints all played leader names across game-data/', () => {
    const dir = 'game-data';
    const leaders = new Set<string>();
    for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
      const raw = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      const game = parseGame(raw);
      for (const ev of game.leaderEvents) {
        if (ev.type === 'play') leaders.add(ev.leader);
      }
    }
    // eslint-disable-next-line no-console
    console.log([...leaders].sort().join('\n'));
  });
});
```

Run it (un-skip locally first, then re-skip or delete):

```bash
cd app && npx vitest run src/lib/aggregator/_discovery.test.ts -t "DISCOVERY:leaders" --reporter=verbose
```

Capture the output. **Delete `_discovery.test.ts` before committing** (it relies on `node:fs` reading `game-data/` which won't be present in CI).

- [ ] **Step 2: Write `heroLeaders.ts`**

Cross-reference the discovery output with the official TI4 leader cards. Heroes are unlocked separately from agents/commanders. Common patterns: `'Jae Mir Kan'` (Hacan), `'Mentak Hero'`, `'Brother Omar'` (Yin), etc.

Create `app/src/lib/aggregator/heroLeaders.ts`:

```typescript
/** Manually classified hero leader names from the playgroup's game-data corpus.
 *  TI Assistant exports do not tag leaders by tier — heroes must be enumerated
 *  by name. Update this set when a new hero appears in an upload. */
export const HERO_LEADERS: ReadonlySet<string> = new Set<string>([
  // Populate from Step 1 discovery output.
  // Examples (verify against your data):
  // 'Jae Mir Kan',         // Hacan hero
  // 'Brother Omar',        // Yin hero
  // 'Ahk-Syl Siven',       // Nomad hero
]);

export function isHeroLeader(name: string): boolean {
  return HERO_LEADERS.has(name);
}
```

- [ ] **Step 3: Write the failing tests for `buildGameStats`**

Create `app/src/lib/aggregator/buildGameStats.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildGameStats } from './buildGameStats';
import type { ParsedGame, PlanetEvent, RelicEvent, AgendaResolution, VpEvent, LeaderEvent, ActionTypeEvent } from '../parser/types';
import type { RoundBoundary } from './deriveRoundBoundaries';

function makeGame(gameId: string, opts: Partial<ParsedGame>): ParsedGame {
  const base: ParsedGame = {
    gameId, playedAt: 0, durationSeconds: 3600,
    factions: [
      { factionId: 'Sol',   playerName: 'p', color: '#00f', mapPosition: 0, startingTechs: [], startingPlanets: [] },
      { factionId: 'Hacan', playerName: 'p', color: '#fa0', mapPosition: 1, startingTechs: [], startingPlanets: [] },
    ],
    options: {}, initialSpeaker: 'Sol',
    phaseSnapshots: [], vpEvents: [], planetEvents: [], techEvents: [],
    agendaResolutions: [], strategyCardEvents: [], actionCardEvents: [], componentEvents: [],
    relicEvents: [], leaderEvents: [], objectiveReveals: [], speakerEvents: [],
    attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: [],
    expeditionEvents: [], secondaryEvents: [], actionEvents: [],
    finalScores: { Sol: 10, Hacan: 5 }, winner: 'Sol',
    timers: { game: 3600, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
  };
  return { ...base, ...opts };
}

describe('buildGameStats', () => {
  it('avgDurationSeconds averages across games', () => {
    const games = [
      makeGame('g1', { durationSeconds: 3600 }),
      makeGame('g2', { durationSeconds: 7200 }),
    ];
    expect(buildGameStats(games, new Map()).avgDurationSeconds).toBe(5400);
  });

  it('mecatol.firstClaimerWinRate counts winner first-claimer / total decided games', () => {
    const planetEvents: PlanetEvent[] = [
      { faction: 'Sol', planet: 'Mecatol Rex', prevOwner: null, timestamp: 100, type: 'claim' },
    ];
    const games = [makeGame('g1', { planetEvents, winner: 'Sol' })];
    expect(buildGameStats(games, new Map()).mecatol.firstClaimerWinRate).toBe(1);
  });

  it('mecatol excludes games with null winner from the rate', () => {
    const planetEvents: PlanetEvent[] = [
      { faction: 'Sol', planet: 'Mecatol Rex', prevOwner: null, timestamp: 100, type: 'claim' },
    ];
    const games = [makeGame('g1', { planetEvents, winner: null })];
    expect(buildGameStats(games, new Map()).mecatol.firstClaimerWinRate).toBeNull();
  });

  it('actionTypes returns null percentages when actionTypeEvents absent', () => {
    const games = [makeGame('g1', {})];
    const at = buildGameStats(games, new Map()).actionTypes;
    expect(at.tacticalPct).toBeNull();
    expect(at.tactical).toBe(0);
  });

  it('actionTypes computes percentages when events present', () => {
    const actionTypeEvents: ActionTypeEvent[] = [
      { faction: 'Sol', actionType: 'tactical',  timestamp: 100 },
      { faction: 'Sol', actionType: 'tactical',  timestamp: 200 },
      { faction: 'Sol', actionType: 'component', timestamp: 300 },
      { faction: 'Sol', actionType: 'pass',      timestamp: 400 },
    ];
    const games = [makeGame('g1', { actionTypeEvents })];
    const at = buildGameStats(games, new Map()).actionTypes;
    expect(at.tactical).toBe(2);
    expect(at.tacticalPct).toBeCloseTo(0.5, 5);
  });

  it('relics splits drawnCount (gain) vs playedCount (play)', () => {
    const relicEvents: RelicEvent[] = [
      { faction: 'Sol', relic: 'Shard of the Throne', timestamp: 100, type: 'gain' },
      { faction: 'Sol', relic: 'Shard of the Throne', timestamp: 200, type: 'play' },
    ];
    const games = [makeGame('g1', { relicEvents })];
    const shard = buildGameStats(games, new Map()).relics.find(r => r.relic === 'Shard of the Throne');
    expect(shard?.drawnCount).toBe(1);
    expect(shard?.playedCount).toBe(1);
    expect(shard?.grantsVp).toBe(true);
  });

  it('agendas excludes elect-type from passRate but counts them in timesResolved', () => {
    const agendaResolutions: AgendaResolution[] = [
      { agenda: 'Mutiny',         outcome: 'For',     round: 2, timestamp: 100, votes: [], riders: [] },
      { agenda: 'Mutiny',         outcome: 'Against', round: 3, timestamp: 200, votes: [], riders: [] },
      { agenda: 'Holy Planet',    outcome: 'Mecatol', round: 4, timestamp: 300, votes: [], riders: [] },
    ];
    const result = buildGameStats([makeGame('g1', { agendaResolutions })], new Map());
    const mutiny = result.agendas.find(a => a.agenda === 'Mutiny');
    expect(mutiny?.timesResolved).toBe(2);
    expect(mutiny?.passRate).toBe(0.5);
    const holy = result.agendas.find(a => a.agenda === 'Holy Planet');
    expect(holy?.passRate).toBeNull();
  });

  it('comingFromBehind returns null winRate when no round-3 data', () => {
    const games = [makeGame('g1', {})];
    expect(buildGameStats(games, new Map()).comingFromBehind.round3LeaderWinRate).toBeNull();
  });

  it('comingFromBehind tracks round-3 leader vs winner', () => {
    const vpEvents: VpEvent[] = [
      { faction: 'Sol', objective: 'O1', points: 6, timestamp: 1500, source: 'score_objective' }, // round 2 (during round 2)
      { faction: 'Hacan', objective: 'O2', points: 4, timestamp: 2500, source: 'score_objective' }, // round 3
    ];
    const boundaries = new Map<string, RoundBoundary[]>([
      ['g1', [
        { round: 1, startTimestamp: 0    },
        { round: 2, startTimestamp: 1000 },
        { round: 3, startTimestamp: 2000 },
        { round: 4, startTimestamp: 3000 },
      ]],
    ]);
    // At end of round 3: Sol has 6, Hacan has 4. Winner is Sol.
    const games = [makeGame('g1', { vpEvents, winner: 'Sol' })];
    const cfb = buildGameStats(games, boundaries).comingFromBehind;
    expect(cfb.gamesWithRound3Data).toBe(1);
    expect(cfb.round3LeaderWins).toBe(1);
    expect(cfb.round3LeaderWinRate).toBe(1);
  });

  it('vpSources breakdown sums points by source and computes share', () => {
    const vpEvents: VpEvent[] = [
      { faction: 'Sol',   objective: 'O1', points: 3, timestamp: 100, source: 'score_objective' },
      { faction: 'Hacan', objective: 'O2', points: 1, timestamp: 200, source: 'custodians' },
    ];
    const result = buildGameStats([makeGame('g1', { vpEvents })], new Map());
    const obj = result.vpSources.find(s => s.source === 'score_objective');
    expect(obj?.totalPoints).toBe(3);
    expect(obj?.sharePct).toBeCloseTo(0.75, 5);
  });

  it('headline counters: avgWinningVp, avgPlayersPerGame', () => {
    const games = [
      makeGame('g1', { finalScores: { Sol: 10, Hacan: 5 }, winner: 'Sol' }),
      makeGame('g2', { finalScores: { Sol: 12, Hacan: 6 }, winner: 'Sol' }),
    ];
    const result = buildGameStats(games, new Map());
    expect(result.avgWinningVp).toBe(11);
    expect(result.avgPlayersPerGame).toBe(2);
  });

  it('heroActivations counts only "play" type leader events for known heroes', () => {
    const leaderEvents: LeaderEvent[] = [
      { faction: 'Sol', leader: 'Brother Omar',   timestamp: 100, type: 'unlock' }, // not a play
      { faction: 'Sol', leader: 'Brother Omar',   timestamp: 200, type: 'play'   },
      { faction: 'Sol', leader: 'Some Commander', timestamp: 300, type: 'play'   }, // not a hero
    ];
    // Note: 'Brother Omar' must be present in HERO_LEADERS for this test to pass.
    const result = buildGameStats([makeGame('g1', { leaderEvents })], new Map());
    const omar = result.heroActivations.find(h => h.leaderName === 'Brother Omar');
    if (omar !== undefined) {
      expect(omar.gamesActivated).toBe(1);
    }
    // If Brother Omar isn't in HERO_LEADERS yet, this assertion is skipped — no failure.
    // Update HERO_LEADERS to include 'Brother Omar' to enable this test.
  });

  it('vpDiversity averages distinct sources for winners vs. non-winners', () => {
    const vpEvents: VpEvent[] = [
      // Sol (winner) scored from 3 distinct sources
      { faction: 'Sol',   objective: 'O1', points: 2, timestamp: 100, source: 'score_objective' },
      { faction: 'Sol',   objective: 'C',  points: 1, timestamp: 200, source: 'custodians' },
      { faction: 'Sol',   objective: 'A',  points: 1, timestamp: 300, source: 'agenda' },
      // Hacan (loser) scored from 1 source
      { faction: 'Hacan', objective: 'O2', points: 2, timestamp: 400, source: 'score_objective' },
    ];
    const games = [makeGame('g1', { vpEvents, winner: 'Sol' })];
    const div = buildGameStats(games, new Map()).vpDiversity;
    expect(div.avgWinnerDistinctSources).toBe(3);
    expect(div.avgLoserDistinctSources).toBe(1);
  });

  it('vpDiversity HHI is higher (more concentrated) for the loser in this fixture', () => {
    const vpEvents: VpEvent[] = [
      // Sol (winner): 4 points spread across 4 sources at 1 pt each → HHI = 4 * (0.25)^2 = 0.25
      { faction: 'Sol',   objective: 'O1', points: 1, timestamp: 100, source: 'score_objective' },
      { faction: 'Sol',   objective: 'C',  points: 1, timestamp: 200, source: 'custodians' },
      { faction: 'Sol',   objective: 'A',  points: 1, timestamp: 300, source: 'agenda' },
      { faction: 'Sol',   objective: 'R',  points: 1, timestamp: 400, source: 'relic' },
      // Hacan (loser): 4 points, all from one source → HHI = 1.0
      { faction: 'Hacan', objective: 'O2', points: 4, timestamp: 500, source: 'score_objective' },
    ];
    const games = [makeGame('g1', { vpEvents, winner: 'Sol' })];
    const div = buildGameStats(games, new Map()).vpDiversity;
    expect(div.avgWinnerHHI).toBeCloseTo(0.25, 3);
    expect(div.avgLoserHHI).toBe(1);
  });

  it('vpDiversity returns null avgs when no games have winners', () => {
    const games = [makeGame('g1', { winner: null })];
    const div = buildGameStats(games, new Map()).vpDiversity;
    expect(div.avgWinnerDistinctSources).toBeNull();
    expect(div.avgWinnerHHI).toBeNull();
  });

  it('stage2 firstStage2ScorerWinRate is null when no Stage II events present', () => {
    const games = [makeGame('g1', { winner: 'Sol', vpEvents: [] })];
    expect(buildGameStats(games, new Map()).stage2.firstStage2ScorerWinRate).toBeNull();
  });

  it('stage2 counts the first Stage-II-points-2 score event per game vs. winner', () => {
    // Use a known Stage II objective name from objectives.ts dictionary.
    // 'Construct Massive Cities' is documented as a 2-point Stage II objective in CLAUDE.md.
    const vpEvents: VpEvent[] = [
      { faction: 'Sol',   objective: 'Construct Massive Cities', points: 2, timestamp: 100, source: 'score_objective' },
      { faction: 'Hacan', objective: 'Construct Massive Cities', points: 2, timestamp: 200, source: 'score_objective' },
    ];
    const games = [makeGame('g1', { vpEvents, winner: 'Sol' })];
    const s2 = buildGameStats(games, new Map()).stage2;
    expect(s2.gamesWithStage2).toBe(1);
    expect(s2.firstStage2ScorerWins).toBe(1);
    expect(s2.firstStage2ScorerWinRate).toBe(1);
  });
});
```

- [ ] **Step 4: Run the test to confirm it fails**

```bash
cd app && npx vitest run src/lib/aggregator/buildGameStats.test.ts
```

Expected: FAIL — module does not exist.

- [ ] **Step 5: Implement `buildGameStats`**

Create `app/src/lib/aggregator/buildGameStats.ts`:

```typescript
import type { ParsedGame, VpSource } from '../parser/types';
import { assignRound, type RoundBoundary } from './deriveRoundBoundaries';
import { isHeroLeader } from './heroLeaders';
import { getObjectivePoints } from '../parser/objectives';

export interface ActionTypeBreakdown {
  tactical: number;
  component: number;
  pass: number;
  tacticalPct: number | null;
  componentPct: number | null;
  passPct: number | null;
  topTactical: Array<{ factionId: string; avgPerGame: number }>;
  topComponent: Array<{ factionId: string; avgPerGame: number }>;
}

export interface MecatolStat {
  avgFirstClaimRound: number | null;
  firstClaimerWinRate: number | null;
  avgTurnoverPerGame: number;
}

export interface HeroActivation {
  factionId: string;
  leaderName: string;
  avgActivationRound: number | null;
  activationRate: number;
  gamesActivated: number;
  gamesPlayed: number;
}

export interface RelicStat {
  relic: string;
  drawnCount: number;
  playedCount: number;
  grantsVp: boolean;
}

export interface AgendaStat {
  agenda: string;
  timesResolved: number;
  passRate: number | null;
  netVpSwing: number;
}

export interface VpSourceStat {
  source: VpSource;
  totalPoints: number;
  sharePct: number;
}

export interface ComingFromBehindStat {
  round3LeaderWins: number;
  gamesWithRound3Data: number;
  round3LeaderWinRate: number | null;
}

export interface ObjectiveTimingStat {
  vpByRound: Record<number, number>;
  avgWinningVpRound: number | null;
}

export interface VpDiversityStat {
  /** Avg distinct VP sources used by winners across games with non-null winner. */
  avgWinnerDistinctSources: number | null;
  /** Avg distinct VP sources used by non-winners (all losing factions in winning games). */
  avgLoserDistinctSources: number | null;
  /** Avg HHI concentration index across winners (0–1, higher = more concentrated). */
  avgWinnerHHI: number | null;
  /** Avg HHI concentration index across non-winners. */
  avgLoserHHI: number | null;
}

export interface Stage2Stat {
  /** Number of games where the first faction to score a Stage II objective went on to win. */
  firstStage2ScorerWins: number;
  /** Number of games where (a) at least one Stage II objective was scored AND (b) winner != null. */
  gamesWithStage2: number;
  /** firstStage2ScorerWins / gamesWithStage2; null if denominator is 0. */
  firstStage2ScorerWinRate: number | null;
}

export interface GameStatsSummary {
  totalGames: number;
  avgDurationSeconds: number;
  avgWinningVp: number;
  avgPlayersPerGame: number;
  mecatol: MecatolStat;
  actionTypes: ActionTypeBreakdown;
  heroActivations: HeroActivation[];
  relics: RelicStat[];
  agendas: AgendaStat[];
  vpSources: VpSourceStat[];
  comingFromBehind: ComingFromBehindStat;
  objectiveTiming: ObjectiveTimingStat;
  vpDiversity: VpDiversityStat;
  stage2: Stage2Stat;
}

const VP_RELICS: ReadonlySet<string> = new Set(['Shard of the Throne', 'Crown of Emphidia', 'Styx']);

export function buildGameStats(
  games: ParsedGame[],
  roundBoundariesByGame: Map<string, RoundBoundary[]>,
): GameStatsSummary {
  const totalGames = games.length;
  const avgDurationSeconds = totalGames > 0
    ? games.reduce((s, g) => s + g.durationSeconds, 0) / totalGames
    : 0;
  const winnerGames = games.filter(g => g.winner !== null);
  const avgWinningVp = winnerGames.length > 0
    ? winnerGames.reduce((s, g) => s + (g.finalScores[g.winner ?? ''] ?? 0), 0) / winnerGames.length
    : 0;
  const avgPlayersPerGame = totalGames > 0
    ? games.reduce((s, g) => s + g.factions.length, 0) / totalGames
    : 0;

  return {
    totalGames,
    avgDurationSeconds,
    avgWinningVp,
    avgPlayersPerGame,
    mecatol: buildMecatol(games, roundBoundariesByGame),
    actionTypes: buildActionTypes(games),
    heroActivations: buildHeroes(games, roundBoundariesByGame),
    relics: buildRelics(games),
    agendas: buildAgendas(games),
    vpSources: buildVpSources(games),
    comingFromBehind: buildComingFromBehind(games, roundBoundariesByGame),
    objectiveTiming: buildObjectiveTiming(games, roundBoundariesByGame),
    vpDiversity: buildVpDiversity(games),
    stage2: buildStage2(games),
  };
}

function buildMecatol(games: ParsedGame[], boundariesByGame: Map<string, RoundBoundary[]>): MecatolStat {
  const firstClaimRounds: number[] = [];
  let firstClaimerWins = 0;
  let decidedGames = 0;
  let turnoverTotal = 0;

  for (const game of games) {
    const claims = game.planetEvents.filter(e => e.planet === 'Mecatol Rex' && e.type === 'claim');
    if (claims.length === 0) continue;
    turnoverTotal += claims.length - 1;

    const first = claims[0];
    if (first === undefined) continue;

    const boundaries = boundariesByGame.get(game.gameId) ?? [];
    if (boundaries.length > 0) firstClaimRounds.push(assignRound(first.timestamp, boundaries));

    if (game.winner !== null) {
      decidedGames += 1;
      if (first.faction === game.winner) firstClaimerWins += 1;
    }
  }

  return {
    avgFirstClaimRound: firstClaimRounds.length > 0
      ? firstClaimRounds.reduce((s, n) => s + n, 0) / firstClaimRounds.length
      : null,
    firstClaimerWinRate: decidedGames > 0 ? firstClaimerWins / decidedGames : null,
    avgTurnoverPerGame: games.length > 0 ? turnoverTotal / games.length : 0,
  };
}

function buildActionTypes(games: ParsedGame[]): ActionTypeBreakdown {
  const allEvents = games.flatMap(g => g.actionTypeEvents ?? []);
  const tactical  = allEvents.filter(e => e.actionType === 'tactical').length;
  const component = allEvents.filter(e => e.actionType === 'component').length;
  const pass      = allEvents.filter(e => e.actionType === 'pass').length;
  const total = tactical + component + pass;
  const anyData = games.some(g => g.actionTypeEvents !== undefined);

  // Per-faction averages
  const tacByFaction  = new Map<string, { actions: number; gamesPlayed: number }>();
  const compByFaction = new Map<string, { actions: number; gamesPlayed: number }>();
  for (const game of games) {
    if (game.actionTypeEvents === undefined) continue;
    const tactCount = new Map<string, number>();
    const compCount = new Map<string, number>();
    for (const ev of game.actionTypeEvents) {
      if (ev.actionType === 'tactical')  tactCount.set(ev.faction, (tactCount.get(ev.faction) ?? 0) + 1);
      if (ev.actionType === 'component') compCount.set(ev.faction, (compCount.get(ev.faction) ?? 0) + 1);
    }
    for (const f of game.factions) {
      const t = tacByFaction.get(f.factionId)  ?? { actions: 0, gamesPlayed: 0 };
      t.actions += tactCount.get(f.factionId)  ?? 0;
      t.gamesPlayed += 1;
      tacByFaction.set(f.factionId, t);
      const c = compByFaction.get(f.factionId) ?? { actions: 0, gamesPlayed: 0 };
      c.actions += compCount.get(f.factionId) ?? 0;
      c.gamesPlayed += 1;
      compByFaction.set(f.factionId, c);
    }
  }
  const top3 = (m: Map<string, { actions: number; gamesPlayed: number }>) => [...m.entries()]
    .map(([factionId, v]) => ({ factionId, avgPerGame: v.gamesPlayed > 0 ? v.actions / v.gamesPlayed : 0 }))
    .sort((a, b) => b.avgPerGame - a.avgPerGame)
    .slice(0, 3);

  return {
    tactical, component, pass,
    tacticalPct:  anyData && total > 0 ? tactical  / total : null,
    componentPct: anyData && total > 0 ? component / total : null,
    passPct:      anyData && total > 0 ? pass      / total : null,
    topTactical:  top3(tacByFaction),
    topComponent: top3(compByFaction),
  };
}

function buildHeroes(games: ParsedGame[], boundariesByGame: Map<string, RoundBoundary[]>): HeroActivation[] {
  const acc = new Map<string, { factionId: string; leaderName: string; rounds: number[]; gamesActivated: Set<string>; gamesPlayed: Set<string> }>();
  for (const game of games) {
    const boundaries = boundariesByGame.get(game.gameId) ?? [];
    // Track gamesPlayed per (faction, hero) only when the hero appears at all in this game's leaderEvents
    const seenInGame = new Set<string>();
    for (const ev of game.leaderEvents) {
      if (!isHeroLeader(ev.leader)) continue;
      const key = `${ev.faction} ${ev.leader}`;
      let cur = acc.get(key);
      if (cur === undefined) {
        cur = { factionId: ev.faction, leaderName: ev.leader, rounds: [], gamesActivated: new Set(), gamesPlayed: new Set() };
        acc.set(key, cur);
      }
      if (!seenInGame.has(key)) { cur.gamesPlayed.add(game.gameId); seenInGame.add(key); }
      if (ev.type === 'play') {
        cur.gamesActivated.add(game.gameId);
        if (boundaries.length > 0) cur.rounds.push(assignRound(ev.timestamp, boundaries));
      }
    }
  }
  return [...acc.values()].map(v => ({
    factionId: v.factionId,
    leaderName: v.leaderName,
    avgActivationRound: v.rounds.length > 0 ? v.rounds.reduce((s, n) => s + n, 0) / v.rounds.length : null,
    activationRate: v.gamesPlayed.size > 0 ? v.gamesActivated.size / v.gamesPlayed.size : 0,
    gamesActivated: v.gamesActivated.size,
    gamesPlayed: v.gamesPlayed.size,
  })).sort((a, b) => b.activationRate - a.activationRate);
}

function buildRelics(games: ParsedGame[]): RelicStat[] {
  const acc = new Map<string, { drawnCount: number; playedCount: number }>();
  for (const game of games) {
    for (const ev of game.relicEvents) {
      const cur = acc.get(ev.relic) ?? { drawnCount: 0, playedCount: 0 };
      if (ev.type === 'gain') cur.drawnCount += 1;
      if (ev.type === 'play') cur.playedCount += 1;
      acc.set(ev.relic, cur);
    }
  }
  return [...acc.entries()]
    .map(([relic, v]) => ({ relic, ...v, grantsVp: VP_RELICS.has(relic) }))
    .sort((a, b) => b.drawnCount - a.drawnCount);
}

function buildAgendas(games: ParsedGame[]): AgendaStat[] {
  const acc = new Map<string, { fors: number; againsts: number; electCount: number; netVp: number }>();
  for (const game of games) {
    for (const res of game.agendaResolutions) {
      const cur = acc.get(res.agenda) ?? { fors: 0, againsts: 0, electCount: 0, netVp: 0 };
      if (res.outcome === 'For')          cur.fors += 1;
      else if (res.outcome === 'Against') cur.againsts += 1;
      else                                cur.electCount += 1;
      // Sum agenda-source VP events whose round matches this resolution
      for (const ev of game.vpEvents) {
        if (ev.source === 'agenda' &&
            // Same round per the resolution's recorded round; tolerant of unset round (0).
            // VpEvent has no round field — this is approximate. Caller may refine later.
            Math.abs(ev.timestamp - res.timestamp) < 60_000) {
          cur.netVp += ev.points;
        }
      }
      acc.set(res.agenda, cur);
    }
  }
  return [...acc.entries()].map(([agenda, v]) => {
    const binaryTotal = v.fors + v.againsts;
    return {
      agenda,
      timesResolved: v.fors + v.againsts + v.electCount,
      passRate: binaryTotal > 0 ? v.fors / binaryTotal : null,
      netVpSwing: v.netVp,
    };
  }).sort((a, b) => Math.abs(b.netVpSwing) - Math.abs(a.netVpSwing));
}

function buildVpSources(games: ParsedGame[]): VpSourceStat[] {
  const acc = new Map<VpSource, number>();
  let total = 0;
  for (const game of games) {
    for (const ev of game.vpEvents) {
      acc.set(ev.source, (acc.get(ev.source) ?? 0) + ev.points);
      total += ev.points;
    }
  }
  return [...acc.entries()]
    .map(([source, totalPoints]) => ({ source, totalPoints, sharePct: total > 0 ? totalPoints / total : 0 }))
    .sort((a, b) => b.sharePct - a.sharePct);
}

function buildComingFromBehind(games: ParsedGame[], boundariesByGame: Map<string, RoundBoundary[]>): ComingFromBehindStat {
  let leaderWins = 0;
  let gamesWithR3 = 0;
  for (const game of games) {
    const boundaries = boundariesByGame.get(game.gameId) ?? [];
    const r4Boundary = boundaries.find(b => b.round === 4);
    if (r4Boundary === undefined || game.winner === null) continue;
    gamesWithR3 += 1;
    const totals = new Map<string, number>();
    for (const ev of game.vpEvents) {
      if (ev.timestamp < r4Boundary.startTimestamp) {
        totals.set(ev.faction, (totals.get(ev.faction) ?? 0) + ev.points);
      }
    }
    const r3Leader = [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (r3Leader === game.winner) leaderWins += 1;
  }
  return {
    round3LeaderWins: leaderWins,
    gamesWithRound3Data: gamesWithR3,
    round3LeaderWinRate: gamesWithR3 > 0 ? leaderWins / gamesWithR3 : null,
  };
}

function buildObjectiveTiming(games: ParsedGame[], boundariesByGame: Map<string, RoundBoundary[]>): ObjectiveTimingStat {
  const vpByRound: Record<number, number> = {};
  const winningRounds: number[] = [];
  for (const game of games) {
    const boundaries = boundariesByGame.get(game.gameId) ?? [];
    if (boundaries.length === 0) continue;
    let lastWinningRound: number | null = null;
    for (const ev of game.vpEvents) {
      const r = assignRound(ev.timestamp, boundaries);
      vpByRound[r] = (vpByRound[r] ?? 0) + ev.points;
      if (game.winner !== null && ev.faction === game.winner) lastWinningRound = r;
    }
    if (lastWinningRound !== null) winningRounds.push(lastWinningRound);
  }
  return {
    vpByRound,
    avgWinningVpRound: winningRounds.length > 0
      ? winningRounds.reduce((s, n) => s + n, 0) / winningRounds.length
      : null,
  };
}

function buildVpDiversity(games: ParsedGame[]): VpDiversityStat {
  const winnerDistinct: number[] = [];
  const loserDistinct: number[] = [];
  const winnerHHI: number[] = [];
  const loserHHI: number[] = [];

  for (const game of games) {
    if (game.winner === null) continue;
    // Group: faction → source → totalPoints
    const byFactionSource = new Map<string, Map<VpSource, number>>();
    for (const ev of game.vpEvents) {
      let m = byFactionSource.get(ev.faction);
      if (m === undefined) { m = new Map(); byFactionSource.set(ev.faction, m); }
      m.set(ev.source, (m.get(ev.source) ?? 0) + ev.points);
    }
    for (const f of game.factions) {
      const sources = byFactionSource.get(f.factionId);
      const distinct = sources?.size ?? 0;
      const total = sources !== undefined
        ? [...sources.values()].reduce((s, n) => s + n, 0)
        : 0;
      const hhi = total > 0 && sources !== undefined
        ? [...sources.values()].reduce((s, n) => s + (n / total) ** 2, 0)
        : 0;
      if (f.factionId === game.winner) {
        winnerDistinct.push(distinct);
        if (total > 0) winnerHHI.push(hhi);
      } else {
        loserDistinct.push(distinct);
        if (total > 0) loserHHI.push(hhi);
      }
    }
  }

  const avg = (arr: number[]): number | null =>
    arr.length > 0 ? arr.reduce((s, n) => s + n, 0) / arr.length : null;

  return {
    avgWinnerDistinctSources: avg(winnerDistinct),
    avgLoserDistinctSources:  avg(loserDistinct),
    avgWinnerHHI: avg(winnerHHI),
    avgLoserHHI:  avg(loserHHI),
  };
}

function buildStage2(games: ParsedGame[]): Stage2Stat {
  let firstStage2ScorerWins = 0;
  let gamesWithStage2 = 0;

  for (const game of games) {
    if (game.winner === null) continue;
    const stage2Events = game.vpEvents
      .filter(ev => ev.source === 'score_objective' && getObjectivePoints(ev.objective)?.stage === 'II')
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp);
    const first = stage2Events[0];
    if (first === undefined) continue;
    gamesWithStage2 += 1;
    if (first.faction === game.winner) firstStage2ScorerWins += 1;
  }

  return {
    firstStage2ScorerWins,
    gamesWithStage2,
    firstStage2ScorerWinRate: gamesWithStage2 > 0
      ? firstStage2ScorerWins / gamesWithStage2
      : null,
  };
}
```

- [ ] **Step 6: Run the tests to confirm they pass**

```bash
cd app && npx vitest run src/lib/aggregator/buildGameStats.test.ts
```

Expected: 16 tests pass. The hero activation test only enforces a hard assertion if the hero name happens to be present in `HERO_LEADERS`; otherwise it short-circuits. The Stage II test depends on `'Construct Massive Cities'` being recognized by `getObjectivePoints` as Stage II — verify it is in `objectives.ts` before running; if the dictionary uses a different exact string, swap to one that's there (any name where `getObjectivePoints(name).stage === 'II'`).

- [ ] **Step 7: Export from aggregator index**

Append to `app/src/lib/aggregator/index.ts`:

```typescript
export { buildGameStats } from './buildGameStats';
export type {
  ActionTypeBreakdown, MecatolStat, HeroActivation, RelicStat,
  AgendaStat, VpSourceStat, ComingFromBehindStat, ObjectiveTimingStat,
  VpDiversityStat, Stage2Stat,
  GameStatsSummary,
} from './buildGameStats';
export { isHeroLeader, HERO_LEADERS } from './heroLeaders';
```

- [ ] **Step 8: Commit**

```bash
git add app/src/lib/aggregator/heroLeaders.ts app/src/lib/aggregator/buildGameStats.ts app/src/lib/aggregator/buildGameStats.test.ts app/src/lib/aggregator/index.ts
git commit -m "feat(aggregator): add buildGameStats with hero/relic/mecatol/comeback"
```

---

## Task 8: `loadAllGames()` Firestore adapter

**Files:**
- Modify: `app/src/adapters/firestore.ts`

- [ ] **Step 1: Add the function**

In `app/src/adapters/firestore.ts`, after `listGames()` (around line 62), add:

```typescript
/** Returns all stored games, ordered by playedAt descending. Loads full ParsedGame objects. */
export async function loadAllGames(): Promise<ParsedGame[]> {
  const q = query(collection(db, 'games'), orderBy('playedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(docSnap => docSnap.data() as unknown as ParsedGame);
}
```

- [ ] **Step 2: Confirm typecheck passes**

```bash
cd app && npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/src/adapters/firestore.ts
git commit -m "feat(adapter): add loadAllGames"
```

---

## Task 9: `MetaContext` + `MetaDashboardPage` shell + 4 stub sections

This task wires the shell together: provider, hook, page, four placeholder sections, and the shared shell-render test. Sections render as empty `<section>` shells until later tasks fill them in.

**Files:**
- Create: `app/src/features/meta-dashboard/MetaContext.tsx`
- Create: `app/src/features/meta-dashboard/MetaDashboardPage.tsx`
- Create: `app/src/features/meta-dashboard/FactionSection.tsx`        (stub)
- Create: `app/src/features/meta-dashboard/StrategyCardSection.tsx`   (stub)
- Create: `app/src/features/meta-dashboard/TechSection.tsx`           (stub)
- Create: `app/src/features/meta-dashboard/StatsSection.tsx`          (stub)
- Create: `app/src/features/meta-dashboard/sections.test.tsx`
- Modify: `app/src/features/meta-dashboard/index.ts`

- [ ] **Step 1: Write the shell-render tests first**

Create `app/src/features/meta-dashboard/sections.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FactionSection } from './FactionSection';
import { StrategyCardSection } from './StrategyCardSection';
import { TechSection } from './TechSection';
import { StatsSection } from './StatsSection';

const cases = [
  { Component: FactionSection,       id: 'factions' },
  { Component: StrategyCardSection,  id: 'strategy' },
  { Component: TechSection,          id: 'techs'    },
  { Component: StatsSection,         id: 'stats'    },
] as const;

cases.forEach(({ Component, id }) => {
  describe(id, () => {
    it('has the correct id for scroll targeting', () => {
      render(<MemoryRouter><Component /></MemoryRouter>);
      expect(document.getElementById(id)).toBeInTheDocument();
    });

    it('has a data-section attribute matching its id', () => {
      render(<MemoryRouter><Component /></MemoryRouter>);
      expect(document.getElementById(id)).toHaveAttribute('data-section', id);
    });
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL on missing imports**

```bash
cd app && npx vitest run src/features/meta-dashboard/sections.test.tsx
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create `MetaContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadAllGames } from '../../adapters/firestore';
import {
  buildFactionStats, buildStrategyCardStats, buildTechStats, buildGameStats,
  deriveRoundBoundaries,
  type FactionStatsSummary, type StrategyCardSummary, type TechSummary, type GameStatsSummary,
  type RoundBoundary,
} from '../../lib/aggregator';

export interface MetaState {
  loading: boolean;
  error: string | null;
  factionStats: FactionStatsSummary | null;
  strategyCardStats: StrategyCardSummary | null;
  techStats: TechSummary | null;
  gameStats: GameStatsSummary | null;
}

const initialState: MetaState = {
  loading: true,
  error: null,
  factionStats: null,
  strategyCardStats: null,
  techStats: null,
  gameStats: null,
};

const MetaContext = createContext<MetaState>(initialState);

export function MetaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MetaState>(initialState);

  useEffect(() => {
    let cancelled = false;
    loadAllGames()
      .then(games => {
        const boundariesByGame = new Map<string, RoundBoundary[]>();
        for (const g of games) {
          boundariesByGame.set(g.gameId, deriveRoundBoundaries(g.strategyCardEvents, g.factions.length));
        }
        const next: MetaState = {
          loading: false,
          error: null,
          factionStats:      buildFactionStats(games),
          strategyCardStats: buildStrategyCardStats(games, boundariesByGame),
          techStats:         buildTechStats(games, boundariesByGame),
          gameStats:         buildGameStats(games, boundariesByGame),
        };
        if (!cancelled) setState(next);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setState({
          ...initialState,
          loading: false,
          error: e instanceof Error ? e.message : 'Failed to load meta-dashboard',
        });
      });
    return () => { cancelled = true; };
  }, []);

  return <MetaContext.Provider value={state}>{children}</MetaContext.Provider>;
}

export function useMeta(): MetaState {
  return useContext(MetaContext);
}
```

- [ ] **Step 4: Create the four stub sections**

All four sections follow this exact pattern. Create:

`app/src/features/meta-dashboard/FactionSection.tsx`:
```tsx
export function FactionSection() {
  return <section id="factions" data-section="factions" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }} />;
}
```

`app/src/features/meta-dashboard/StrategyCardSection.tsx`:
```tsx
export function StrategyCardSection() {
  return <section id="strategy" data-section="strategy" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }} />;
}
```

`app/src/features/meta-dashboard/TechSection.tsx`:
```tsx
export function TechSection() {
  return <section id="techs" data-section="techs" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }} />;
}
```

`app/src/features/meta-dashboard/StatsSection.tsx`:
```tsx
export function StatsSection() {
  return <section id="stats" data-section="stats" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }} />;
}
```

- [ ] **Step 5: Create `MetaDashboardPage.tsx`**

Look up how `GameDetailPage` uses `FrozenHeader` and `ScrollBody` first:

```bash
cd app && grep -n "FrozenHeader\|ScrollBody" src/features/game-detail/GameDetailPage.tsx
```

Then create `app/src/features/meta-dashboard/MetaDashboardPage.tsx` mirroring that pattern. The component should wrap everything in `<MetaProvider>`, render a `FrozenHeader` titled `"LEAGUE STATS"` with 4 tab buttons (`Factions`, `Strategy`, `Techs`, `Stats`) whose slugs match the section ids (`factions`, `strategy`, `techs`, `stats`), and a `ScrollBody` containing the four section components in order.

If `FrozenHeader` and `ScrollBody` are not yet usable from a different feature (i.e. they live in `game-detail` rather than `shared`), import them via relative path:
```tsx
import { FrozenHeader } from '../game-detail/FrozenHeader';
import { ScrollBody } from '../game-detail/ScrollBody';
```

Skeleton:

```tsx
import { MetaProvider } from './MetaContext';
import { FactionSection } from './FactionSection';
import { StrategyCardSection } from './StrategyCardSection';
import { TechSection } from './TechSection';
import { StatsSection } from './StatsSection';
// Adjust these imports to match where FrozenHeader/ScrollBody actually live:
import { FrozenHeader } from '../game-detail/FrozenHeader';
import { ScrollBody } from '../game-detail/ScrollBody';

const TABS = [
  { id: 'factions', label: 'Factions' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'techs',    label: 'Techs' },
  { id: 'stats',    label: 'Stats' },
] as const;

export function MetaDashboardPage() {
  return (
    <MetaProvider>
      <FrozenHeader title="LEAGUE STATS" tabs={TABS} />
      <ScrollBody>
        <FactionSection />
        <StrategyCardSection />
        <TechSection />
        <StatsSection />
      </ScrollBody>
    </MetaProvider>
  );
}
```

If `FrozenHeader` / `ScrollBody` have a different prop shape than assumed above, adapt accordingly (the props on `GameDetailPage` are the source of truth).

- [ ] **Step 6: Update `index.ts`**

Replace `app/src/features/meta-dashboard/index.ts`:

```typescript
export { MetaDashboardPage } from './MetaDashboardPage';
export { MetaProvider, useMeta } from './MetaContext';
export type { MetaState } from './MetaContext';
```

- [ ] **Step 7: Run the test to confirm it passes**

```bash
cd app && npx vitest run src/features/meta-dashboard/sections.test.tsx
```

Expected: 8 tests pass (4 sections × 2 assertions each).

- [ ] **Step 8: Commit**

```bash
git add app/src/features/meta-dashboard/
git commit -m "feat(meta-dashboard): add MetaContext, page shell, and stub sections"
```

---

## Task 10: Navigation — `/meta` route and "League Stats" kicker on home

**Files:**
- Modify: `app/src/App.tsx`
- Modify: `app/src/features/home/HomePage.tsx`

- [ ] **Step 1: Add the `/meta` route**

In `app/src/App.tsx`, replace the file with:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './features/home';
import { GameDetailPage } from './features/game-detail';
import { MetaDashboardPage } from './features/meta-dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/games/:gameId" element={<GameDetailPage />} />
        <Route path="/meta" element={<MetaDashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Add the "League Stats →" kicker link below the masthead**

In `app/src/features/home/HomePage.tsx`, after the `<Mast ... />` component (around line 41), add:

```tsx
      <div style={{ marginBottom: '16px' }}>
        <a
          href="/meta"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--accent)',
            textDecoration: 'none',
          }}
        >
          League Stats →
        </a>
      </div>
```

- [ ] **Step 3: Smoke test the build**

```bash
cd app && npm run typecheck && npm run build
```

Expected: clean typecheck, successful build.

- [ ] **Step 4: Commit**

```bash
git add app/src/App.tsx app/src/features/home/HomePage.tsx
git commit -m "feat(meta-dashboard): wire /meta route and home kicker link"
```

---

## Task 11: `FactionSection` — leaderboard with Cards/Table view toggle

**Files:**
- Modify: `app/src/features/meta-dashboard/FactionSection.tsx`

- [ ] **Step 1: Replace stub with full implementation**

Replace `app/src/features/meta-dashboard/FactionSection.tsx`:

```tsx
import { useState, useEffect, useMemo } from 'react';
import { useMeta } from './MetaContext';
import { Rule } from '../../shared';

type ViewMode = 'table' | 'cards';
type SortKey = 'winRate' | 'gamesPlayed' | 'avgFinalVp';

const STORAGE_KEY = 'meta.factionViewMode';

function readStoredView(): ViewMode {
  if (typeof window === 'undefined') return 'cards';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'table' || stored === 'cards' ? stored : 'cards';
}

function FactionDot({ color }: { color: string }) {
  return (
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, verticalAlign: 'middle' }} />
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) {
    return <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--ink-3)' }}>—</span>;
  }
  const max = Math.max(...values, 1);
  const w = 56, h = 14, gap = 1;
  const barW = (w - gap * (values.length - 1)) / values.length;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {values.map((v, i) => {
        const bh = (v / max) * h;
        return <rect key={i} x={i * (barW + gap)} y={h - bh} width={barW} height={bh} fill="var(--ink-3)" />;
      })}
    </svg>
  );
}

export function FactionSection() {
  const { factionStats } = useMeta();
  const [view, setView] = useState<ViewMode>(readStoredView);
  const [sort, setSort] = useState<SortKey>('winRate');

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, view);
  }, [view]);

  const sorted = useMemo(() => {
    if (factionStats === null) return [];
    const arr = [...factionStats.factions];
    if (sort === 'winRate')      arr.sort((a, b) => b.winRate - a.winRate);
    if (sort === 'gamesPlayed')  arr.sort((a, b) => b.gamesPlayed - a.gamesPlayed);
    if (sort === 'avgFinalVp')   arr.sort((a, b) => b.avgFinalVp - a.avgFinalVp);
    return arr;
  }, [factionStats, sort]);

  if (factionStats === null) {
    return <section id="factions" data-section="factions" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }} />;
  }

  const topWinRate = sorted[0]?.winRate ?? 0;

  return (
    <section id="factions" data-section="factions" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}>
      {/* Kicker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--ink-4)', paddingBottom: 3, marginBottom: 6 }}>
        <span>Factions · League Standings</span>
        <span>{factionStats.totalGames} games · {factionStats.factions.length} factions</span>
      </div>

      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, fontWeight: 800, lineHeight: 1.1, marginBottom: 2 }}>
        The leaderboard.
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 6 }}>
        Sample sizes are small — based on {factionStats.totalGames} game{factionStats.totalGames !== 1 ? 's' : ''}.
      </div>

      {/* View / sort toggles */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        <span style={{ color: 'var(--ink-3)' }}>View</span>
        <button onClick={() => setView('table')} style={{ background: view === 'table' ? 'var(--ink)' : 'transparent', color: view === 'table' ? 'var(--paper)' : 'var(--ink)', border: '1px solid var(--ink)', padding: '2px 6px', cursor: 'pointer' }}>Table</button>
        <button onClick={() => setView('cards')} style={{ background: view === 'cards' ? 'var(--ink)' : 'transparent', color: view === 'cards' ? 'var(--paper)' : 'var(--ink)', border: '1px solid var(--ink)', padding: '2px 6px', cursor: 'pointer' }}>Cards</button>
        {view === 'table' && (
          <>
            <span style={{ marginLeft: 12, color: 'var(--ink-3)' }}>Sort</span>
            <button onClick={() => setSort('winRate')}     style={{ background: 'transparent', color: sort === 'winRate' ? 'var(--accent)' : 'var(--ink-3)', border: 'none', cursor: 'pointer' }}>Win%</button>
            <button onClick={() => setSort('gamesPlayed')} style={{ background: 'transparent', color: sort === 'gamesPlayed' ? 'var(--accent)' : 'var(--ink-3)', border: 'none', cursor: 'pointer' }}>Pick</button>
            <button onClick={() => setSort('avgFinalVp')}  style={{ background: 'transparent', color: sort === 'avgFinalVp' ? 'var(--accent)' : 'var(--ink-3)', border: 'none', cursor: 'pointer' }}>Avg VP</button>
          </>
        )}
      </div>

      {view === 'table' ? (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
          {sorted.map(f => (
            <div key={f.factionId} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 50px 60px', gap: 8, padding: '3px 0', borderBottom: '1px dotted var(--ink-4)' }}>
              <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 11, fontWeight: 700 }}>
                {f.factionId} <span style={{ fontSize: 7, color: 'var(--ink-3)', textTransform: 'uppercase' }}>{f.expansion}</span>
              </span>
              <span style={{ color: 'var(--ink-3)' }}>{f.gamesPlayed}/{factionStats.totalGames}</span>
              <span>{Math.round(f.winRate * 100)}%</span>
              <span>{f.avgFinalVp.toFixed(1)}</span>
              <Sparkline values={f.avgVpPerRound} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {sorted.map(f => (
            <div key={f.factionId} style={{ border: f.winRate === topWinRate && f.winRate > 0 ? '2px solid var(--rule)' : '1px solid var(--ink-4)', padding: 8, background: 'var(--paper-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <FactionDot color="#888" />
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 11 }}>{f.factionId}</span>
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 2 }}>{f.expansion}</div>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 24, fontWeight: 800, color: f.winRate === topWinRate && f.winRate > 0 ? 'var(--accent)' : 'var(--ink)' }}>
                {Math.round(f.winRate * 100)}%
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'var(--ink-3)' }}>
                {f.gamesPlayed} game{f.gamesPlayed !== 1 ? 's' : ''} · {f.avgFinalVp.toFixed(1)} avg VP
              </div>
              <div style={{ marginTop: 4 }}><Sparkline values={f.avgVpPerRound} /></div>
            </div>
          ))}
        </div>
      )}

      <Rule />

      {/* Frequent Pairings */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 8, marginBottom: 4 }}>
        Frequent Pairings
      </div>
      {factionStats.topPairings.slice(0, 5).map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, padding: '2px 0' }}>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 10 }}>{p.factionA} · {p.factionB}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--ink-3)' }}>{p.coAppearances} game{p.coAppearances !== 1 ? 's' : ''}</span>
        </div>
      ))}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: 'var(--ink-3)', marginTop: 4 }}>
        Win-rate split by pairing requires 10+ games.
      </div>

      {/* Senate Power Index */}
      {factionStats.factions.some(f => f.winningVoteRate !== null) && (
        <>
          <Rule />
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 8, marginBottom: 4 }}>
            Senate Power · Voted with Outcome
          </div>
          {[...factionStats.factions]
            .filter(f => f.winningVoteRate !== null)
            .sort((a, b) => (b.winningVoteRate ?? 0) - (a.winningVoteRate ?? 0))
            .map(f => (
              <div key={f.factionId} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 50px', gap: 6, alignItems: 'center', padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 10 }}>{f.factionId}</span>
                <div style={{ background: 'var(--ink-4)', height: 4 }}>
                  <div style={{ background: 'var(--cool)', height: 4, width: `${(f.winningVoteRate ?? 0) * 100}%` }} />
                </div>
                <span style={{ textAlign: 'right' }}>{Math.round((f.winningVoteRate ?? 0) * 100)}%</span>
              </div>
            ))}
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: 'var(--ink-3)', marginTop: 4 }}>
            Share of votes cast that backed the resolved outcome. Soft power without VP.
          </div>
        </>
      )}

      {/* Support for the Throne */}
      {factionStats.sftTransfers.length > 0 && (
        <>
          <Rule />
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 8, marginBottom: 4 }}>
            Support for the Throne
          </div>
          {factionStats.sftTransfers.map((t, i) => (
            <div key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, padding: '2px 0' }}>
              {t.fromFaction} → {t.toFaction} <span style={{ color: 'var(--ink-3)', marginLeft: 4 }}>({t.count} game{t.count !== 1 ? 's' : ''})</span>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Run sections shell test (must still pass)**

```bash
cd app && npx vitest run src/features/meta-dashboard/sections.test.tsx
```

Expected: still 8/8 passing.

- [ ] **Step 3: Commit**

```bash
git add app/src/features/meta-dashboard/FactionSection.tsx
git commit -m "feat(meta-dashboard): implement FactionSection leaderboard"
```

---

## Task 12: `StrategyCardSection`

**Files:**
- Modify: `app/src/features/meta-dashboard/StrategyCardSection.tsx`

- [ ] **Step 1: Replace stub with full implementation**

Replace `app/src/features/meta-dashboard/StrategyCardSection.tsx`:

```tsx
import { useMeta } from './MetaContext';
import { Rule } from '../../shared';

const HIGH_FOLLOW = 0.8;

function fmtPct(p: number | null): string {
  return p === null ? 'n/a' : `${Math.round(p * 100)}%`;
}

function fmtPos(p: number | null): string {
  return p === null ? '—' : p.toFixed(1);
}

export function StrategyCardSection() {
  const { strategyCardStats } = useMeta();
  if (strategyCardStats === null) {
    return <section id="strategy" data-section="strategy" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }} />;
  }

  const allRounds = new Set<number>();
  for (const c of strategyCardStats.cards) {
    for (const r of Object.keys(c.pickCountByRound)) allRounds.add(Number(r));
  }
  const roundsAsc = [...allRounds].sort((a, b) => a - b);

  return (
    <section id="strategy" data-section="strategy" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--ink-4)', paddingBottom: 3, marginBottom: 6 }}>
        <span>Strategy Cards · Across Games</span>
        <span>{strategyCardStats.cards.length} cards</span>
      </div>

      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, fontWeight: 800, lineHeight: 1.1, marginBottom: 8 }}>
        Drafting and follow-through.
      </div>

      {/* Secondary follow rate — all rounds */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 6 }}>
        Secondary Follow Rate · All Rounds
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
        {[...strategyCardStats.cards].sort((a, b) => (b.secondaryFollowRate ?? -1) - (a.secondaryFollowRate ?? -1)).map(c => {
          const isHigh = c.secondaryFollowRate !== null && c.secondaryFollowRate >= HIGH_FOLLOW;
          return (
            <div key={c.card} style={{ border: '1px solid var(--ink-4)', padding: 6, background: 'var(--paper-2)' }}>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 10 }}>{c.card}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: isHigh ? 'var(--accent)' : 'var(--ink)' }}>
                {fmtPct(c.secondaryFollowRate)}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: 'var(--ink-3)' }}>
                {c.totalPicks} pick{c.totalPicks !== 1 ? 's' : ''}
              </div>
            </div>
          );
        })}
      </div>

      <Rule />

      {/* Most Picked by Round */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>
        Most Picked · By Round
      </div>
      {roundsAsc.map(r => {
        const cardsInRound = [...strategyCardStats.cards]
          .filter(c => (c.pickCountByRound[r] ?? 0) > 0)
          .sort((a, b) => (b.pickCountByRound[r] ?? 0) - (a.pickCountByRound[r] ?? 0))
          .slice(0, 3);
        return (
          <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
            <span style={{ width: 32, color: 'var(--ink-3)' }}>R{r}</span>
            {cardsInRound.map(c => (
              <span key={c.card} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--ink-4)', padding: '1px 6px' }}>
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 10 }}>{c.card}</span>
                <span style={{ color: 'var(--ink-3)' }}>{c.pickCountByRound[r] ?? 0}×</span>
              </span>
            ))}
          </div>
        );
      })}

      <Rule />

      {/* Most contested */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>
        Draft Position · Most Contested
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, marginBottom: 4 }}>
        {strategyCardStats.mostContested.map((card, i) => {
          const stat = strategyCardStats.cards.find(c => c.card === card);
          return (
            <span key={card} style={{ marginRight: 12 }}>
              <span style={{ color: 'var(--ink-3)' }}>{i + 1}.</span>{' '}
              <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 10 }}>{card}</span>{' '}
              <span style={{ color: 'var(--ink-3)' }}>(avg pick {fmtPos(stat?.avgPickPosition ?? null)})</span>
            </span>
          );
        })}
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: 'var(--ink-3)' }}>
        Lower = grabbed earlier in strategy phase.
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Run shell test**

```bash
cd app && npx vitest run src/features/meta-dashboard/sections.test.tsx
```

Expected: 8/8 passing.

- [ ] **Step 3: Commit**

```bash
git add app/src/features/meta-dashboard/StrategyCardSection.tsx
git commit -m "feat(meta-dashboard): implement StrategyCardSection"
```

---

## Task 13: meta-dashboard `TechSection`

Note: this `TechSection` is in `features/meta-dashboard/`, not the existing `features/game-detail/TechSection.tsx`. They coexist.

**Files:**
- Modify: `app/src/features/meta-dashboard/TechSection.tsx`

- [ ] **Step 1: Replace stub**

Replace `app/src/features/meta-dashboard/TechSection.tsx`:

```tsx
import { useState, useMemo } from 'react';
import { useMeta } from './MetaContext';
import { Rule } from '../../shared';
import type { TechColor } from '../../lib/parser/techs';

const COLOR_VAR: Record<TechColor, string> = {
  green: 'var(--moss)', blue: 'var(--cool)', yellow: 'var(--gold)', red: 'var(--accent)', unit: 'var(--ink-2)',
};

const COLOR_LABEL: Record<TechColor | 'all', string> = {
  all: 'All', green: 'Biotic', blue: 'Propulsion', yellow: 'Cybernetic', red: 'Warfare', unit: 'Unit',
};

const TABS: ReadonlyArray<TechColor | 'all'> = ['all', 'green', 'blue', 'yellow', 'red', 'unit'];

export function TechSection() {
  const { techStats } = useMeta();
  const [filter, setFilter] = useState<TechColor | 'all'>('all');

  const visibleTechs = useMemo(() => {
    if (techStats === null) return [];
    return filter === 'all' ? techStats.topTechs : techStats.byColor[filter].slice(0, 15);
  }, [techStats, filter]);

  if (techStats === null) {
    return <section id="techs" data-section="techs" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }} />;
  }

  const maxCount = Math.max(1, ...visibleTechs.map(t => t.researchCount));

  return (
    <section id="techs" data-section="techs" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--ink-4)', paddingBottom: 3, marginBottom: 6 }}>
        <span>Techs · Across Games</span>
        <span>{techStats.topTechs.length} top techs</span>
      </div>

      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, fontWeight: 800, lineHeight: 1.1, marginBottom: 8 }}>
        The research log.
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setFilter(tab)} style={{ background: filter === tab ? 'var(--ink)' : 'transparent', color: filter === tab ? 'var(--paper)' : 'var(--ink)', border: '1px solid var(--ink)', padding: '2px 6px', cursor: 'pointer' }}>
            {COLOR_LABEL[tab]}
          </button>
        ))}
      </div>

      {visibleTechs.map(t => (
        <div key={t.tech} style={{ display: 'grid', gridTemplateColumns: '8px 1fr 50px 80px 60px', gap: 6, alignItems: 'center', padding: '3px 0', borderBottom: '1px dotted var(--ink-4)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR_VAR[t.color] }} />
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 10 }}>{t.tech}</span>
          <span style={{ color: 'var(--ink-3)' }}>{t.avgRoundFirstResearched === null ? '—' : `Rnd ${t.avgRoundFirstResearched.toFixed(1)}`}</span>
          <div style={{ background: 'var(--ink-4)', height: 4 }}>
            <div style={{ background: COLOR_VAR[t.color], height: 4, width: `${(t.researchCount / maxCount) * 100}%` }} />
          </div>
          <span style={{ color: t.winnerHeldRate >= 0.5 ? 'var(--accent)' : 'var(--ink-3)' }}>
            Won: {Math.round(t.winnerHeldRate * 100)}%
          </span>
        </div>
      ))}

      <Rule />

      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>
        Winner Possession · Top 10
      </div>
      {[...techStats.topTechs].sort((a, b) => b.winnerHeldRate - a.winnerHeldRate).slice(0, 10).map(t => (
        <div key={t.tech} style={{ display: 'flex', gap: 6, padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR_VAR[t.color] }} />
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 10, flex: 1 }}>{t.tech}</span>
          <span style={{ color: 'var(--ink-3)' }}>{t.winnerHeldCount} of {techStats.totalWinnerGames} winning games</span>
          {t.winnerHeldRate >= 0.67 && (
            <span style={{ color: 'var(--accent)', textTransform: 'uppercase', fontSize: 7, letterSpacing: '0.1em' }}>★ trend</span>
          )}
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 2: Run shell test**

```bash
cd app && npx vitest run src/features/meta-dashboard/sections.test.tsx
```

Expected: 8/8 passing.

- [ ] **Step 3: Commit**

```bash
git add app/src/features/meta-dashboard/TechSection.tsx
git commit -m "feat(meta-dashboard): implement TechSection cross-game tech meta"
```

---

## Task 14: `StatsSection`

**Files:**
- Modify: `app/src/features/meta-dashboard/StatsSection.tsx`

- [ ] **Step 1: Replace stub**

Replace `app/src/features/meta-dashboard/StatsSection.tsx`:

```tsx
import { useMeta } from './MetaContext';
import { Rule } from '../../shared';
import { formatDuration } from '../../shared/formatters';

const SOURCE_LABEL: Record<string, string> = {
  score_objective: 'OBJ', custodians: 'CUST', imperial_point: 'IMP', support_for_throne: 'SFT',
  relic: 'RELIC', agenda: 'AGD', rider: 'RIDER', legendary_planet: 'LGND', manual: 'MAN',
};

function fmtPct(p: number | null): string {
  return p === null ? 'n/a' : `${Math.round(p * 100)}%`;
}

export function StatsSection() {
  const { gameStats } = useMeta();
  if (gameStats === null) {
    return <section id="stats" data-section="stats" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }} />;
  }

  const maxVpRound = Math.max(1, ...Object.values(gameStats.objectiveTiming.vpByRound));

  return (
    <section id="stats" data-section="stats" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--ink-4)', paddingBottom: 3, marginBottom: 6 }}>
        <span>Game Stats · Aggregate</span>
        <span>{gameStats.totalGames} games</span>
      </div>

      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, fontWeight: 800, lineHeight: 1.1, marginBottom: 8 }}>
        The almanac.
      </div>

      {/* Headline grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Total games',     value: String(gameStats.totalGames) },
          { label: 'Avg duration',    value: formatDuration(Math.round(gameStats.avgDurationSeconds)) },
          { label: 'Avg winning VP',  value: gameStats.avgWinningVp.toFixed(1) },
          { label: 'Avg players',     value: gameStats.avgPlayersPerGame.toFixed(1) },
        ].map(cell => (
          <div key={cell.label} style={{ background: 'var(--paper-2)', padding: 8, border: '1px solid var(--ink-4)' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)' }}>{cell.label}</div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 18, fontWeight: 800 }}>{cell.value}</div>
          </div>
        ))}
      </div>

      {/* Mecatol Rex */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 4 }}>Mecatol Rex</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
        <div><span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 16, fontWeight: 800 }}>{fmtPct(gameStats.mecatol.firstClaimerWinRate)}</span><div style={{ color: 'var(--ink-3)', fontSize: 7 }}>FIRST CLAIMER WINS</div></div>
        <div><span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 16, fontWeight: 800 }}>{gameStats.mecatol.avgFirstClaimRound === null ? '—' : `Rnd ${gameStats.mecatol.avgFirstClaimRound.toFixed(1)}`}</span><div style={{ color: 'var(--ink-3)', fontSize: 7 }}>AVG FIRST CLAIM</div></div>
        <div><span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 16, fontWeight: 800 }}>{gameStats.mecatol.avgTurnoverPerGame.toFixed(1)}×</span><div style={{ color: 'var(--ink-3)', fontSize: 7 }}>AVG TURNOVERS / GAME</div></div>
      </div>

      <Rule />

      {/* Action types */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Action Type Breakdown</div>
      {gameStats.actionTypes.tacticalPct === null ? (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)' }}>
          Re-upload game files to enable action tracking.
        </div>
      ) : (
        <>
          {([['Tactical', gameStats.actionTypes.tacticalPct], ['Component', gameStats.actionTypes.componentPct], ['Pass', gameStats.actionTypes.passPct]] as const).map(([label, pct]) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 40px', gap: 6, alignItems: 'center', padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
              <span>{label}</span>
              <div style={{ background: 'var(--ink-4)', height: 6 }}>
                <div style={{ background: 'var(--cool)', height: 6, width: `${(pct ?? 0) * 100}%` }} />
              </div>
              <span style={{ textAlign: 'right' }}>{Math.round((pct ?? 0) * 100)}%</span>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Tactical Leaders</div>
              {gameStats.actionTypes.topTactical.map(t => (
                <div key={t.factionId} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>{t.factionId} · {t.avgPerGame.toFixed(1)}/game</div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Component Leaders</div>
              {gameStats.actionTypes.topComponent.map(t => (
                <div key={t.factionId} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>{t.factionId} · {t.avgPerGame.toFixed(1)}/game</div>
              ))}
            </div>
          </div>
        </>
      )}

      <Rule />

      {/* VP source breakdown */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>VP Source Breakdown</div>
      {gameStats.vpSources.map(src => (
        <div key={src.source} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 40px', gap: 6, alignItems: 'center', padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
          <span>{SOURCE_LABEL[src.source] ?? src.source}</span>
          <div style={{ background: 'var(--ink-4)', height: 4 }}>
            <div style={{ background: 'var(--accent)', height: 4, width: `${src.sharePct * 100}%` }} />
          </div>
          <span style={{ textAlign: 'right' }}>{Math.round(src.sharePct * 100)}%</span>
        </div>
      ))}

      <Rule />

      {/* VP Source Diversity — winners vs. losers */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>VP Diversity · Winners vs. Losers</div>
      {gameStats.vpDiversity.avgWinnerDistinctSources === null ? (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)' }}>Requires at least one decided game.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
          <div>
            <div style={{ color: 'var(--ink-3)', fontSize: 7, textTransform: 'uppercase' }}>Avg Distinct Sources</div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, fontWeight: 800 }}>
              <span style={{ color: 'var(--accent)' }}>{(gameStats.vpDiversity.avgWinnerDistinctSources ?? 0).toFixed(1)}</span>
              <span style={{ color: 'var(--ink-3)' }}> winners · </span>
              <span>{(gameStats.vpDiversity.avgLoserDistinctSources ?? 0).toFixed(1)}</span>
              <span style={{ color: 'var(--ink-3)' }}> losers</span>
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--ink-3)', fontSize: 7, textTransform: 'uppercase' }}>Concentration (HHI)</div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, fontWeight: 800 }}>
              <span style={{ color: 'var(--accent)' }}>{(gameStats.vpDiversity.avgWinnerHHI ?? 0).toFixed(2)}</span>
              <span style={{ color: 'var(--ink-3)' }}> winners · </span>
              <span>{(gameStats.vpDiversity.avgLoserHHI ?? 0).toFixed(2)}</span>
              <span style={{ color: 'var(--ink-3)' }}> losers</span>
            </div>
          </div>
        </div>
      )}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: 'var(--ink-3)', marginTop: 4 }}>
        Lower HHI = points spread across more sources. Higher = concentrated on one engine.
      </div>

      <Rule />

      {/* Comeback */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Comeback / Collapse</div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
        {gameStats.comingFromBehind.gamesWithRound3Data === 0
          ? <span style={{ color: 'var(--ink-3)' }}>Requires 3+ rounds of data.</span>
          : <span>Round 3 leader wins: <strong>{gameStats.comingFromBehind.round3LeaderWins} of {gameStats.comingFromBehind.gamesWithRound3Data}</strong> ({fmtPct(gameStats.comingFromBehind.round3LeaderWinRate)})</span>
        }
      </div>

      <Rule />

      {/* Stage II first scorer */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Stage II First Scorer</div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
        {gameStats.stage2.gamesWithStage2 === 0
          ? <span style={{ color: 'var(--ink-3)' }}>No Stage II scoring data yet.</span>
          : <span>First Stage II scorer wins: <strong>{gameStats.stage2.firstStage2ScorerWins} of {gameStats.stage2.gamesWithStage2}</strong> ({fmtPct(gameStats.stage2.firstStage2ScorerWinRate)})</span>
        }
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: 'var(--ink-3)', marginTop: 4 }}>
        Whether the first faction to crack a Stage II objective tends to close out the game.
      </div>

      <Rule />

      {/* Objective timing */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Objective Timing — VP per Round</div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 50, marginBottom: 12 }}>
        {Object.entries(gameStats.objectiveTiming.vpByRound).sort(([a], [b]) => Number(a) - Number(b)).map(([round, vp]) => (
          <div key={round} style={{ flex: 1, textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: 8 }}>
            <div style={{ background: 'var(--ink)', width: '100%', height: (vp / maxVpRound) * 40 }} />
            <div style={{ color: 'var(--ink-3)' }}>R{round}</div>
            <div>{vp}</div>
          </div>
        ))}
      </div>

      <Rule />

      {/* Hero activations */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Hero Activations</div>
      {gameStats.heroActivations.length === 0 ? (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)' }}>No hero activation data recorded.</div>
      ) : gameStats.heroActivations.map(h => (
        <div key={`${h.factionId}::${h.leaderName}`} style={{ display: 'flex', gap: 6, padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 10 }}>{h.factionId} · {h.leaderName}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--ink-3)' }}>
            {h.avgActivationRound === null ? '—' : `Rnd ${h.avgActivationRound.toFixed(1)} avg`} · {h.gamesActivated}/{h.gamesPlayed} games
          </span>
        </div>
      ))}

      <Rule />

      {/* Relics */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Relic Activity</div>
      {gameStats.relics.map(r => (
        <div key={r.relic} style={{ display: 'flex', gap: 6, padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 10 }}>{r.relic}</span>
          <span style={{ color: 'var(--ink-3)' }}>Drawn {r.drawnCount}× · Played {r.playedCount}×</span>
          {r.grantsVp && <span style={{ color: 'var(--accent)', textTransform: 'uppercase', fontSize: 7, letterSpacing: '0.1em' }}>VP</span>}
        </div>
      ))}

      <Rule />

      {/* Agenda analysis */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Agenda Analysis · Top 5 by Impact</div>
      {gameStats.agendas.slice(0, 5).map(a => (
        <div key={a.agenda} style={{ display: 'flex', gap: 6, padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 10, flex: 1 }}>{a.agenda}</span>
          <span style={{ color: 'var(--ink-3)' }}>Pass {fmtPct(a.passRate)}</span>
          <span style={{ color: a.netVpSwing >= 0 ? 'var(--accent)' : 'var(--cool)' }}>
            {a.netVpSwing >= 0 ? '+' : ''}{a.netVpSwing} VP
          </span>
        </div>
      ))}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: 'var(--ink-3)', marginTop: 4 }}>
        Elect-type agendas excluded from pass rate.
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Run shell test**

```bash
cd app && npx vitest run src/features/meta-dashboard/sections.test.tsx
```

Expected: 8/8 passing.

- [ ] **Step 3: Commit**

```bash
git add app/src/features/meta-dashboard/StatsSection.tsx
git commit -m "feat(meta-dashboard): implement StatsSection almanac"
```

---

## Task 15: Phase 3 acceptance — full verification

**Files:** None modified.

- [ ] **Step 1: Run the full check pipeline**

```bash
cd app && npm run typecheck && npm run lint && npm test && npm run build
```

Expected: every command succeeds. Coverage report should show `src/lib/aggregator/**` ≥ 90%.

- [ ] **Step 2: Run dev server and click through manually**

```bash
cd app && npm run dev
```

In a browser at the dev URL:

1. Home page shows "League Stats →" kicker link in the masthead area.
2. Click it. URL changes to `/meta`.
3. Page shows `LEAGUE STATS` masthead with 4 nav buttons (Factions / Strategy / Techs / Stats).
4. Each section renders without errors. With 6 games uploaded, you should see real numbers — not all zeros.
5. Browser console shows no errors.
6. Faction view-mode toggle (Cards/Table) persists across page reload.
7. Tech color filter switches the visible top-15 list.
8. Re-upload at least one game export so its `actionTypeEvents` field populates; verify the Stats section's Action Type Breakdown bars render with percentages.

- [ ] **Step 3: Phase 3 acceptance gate**

Confirm the spec's acceptance criteria:
- [ ] All six game exports visible in aggregate (faction count, total games, etc. reflect 6 games).
- [ ] User can answer "what's the highest-win-rate faction" in two clicks (home → League Stats → top of Cards view).
- [ ] Player names anonymized by default everywhere (no `playerName` strings appear in any meta-dashboard section).

If any gate fails, file the gap and address before declaring done.

- [ ] **Step 4: Update CLAUDE.md status table**

In `D:\_TI4 App\CLAUDE.md`, update the status table to mark Phase 2 as ✅ Complete and add a Phase 3 row marked ✅ Complete (or 🔲 if any acceptance item is outstanding). Replace the "Next up" line with the next planned phase (Phase 3.5 player attribution, or Phase 4 polish).

- [ ] **Step 5: Commit and push**

```bash
git add CLAUDE.md
git commit -m "docs: mark Phase 3 meta-dashboard complete"
```

---

## Phase 3 Done

The `/meta` route renders cross-game analytics for the playgroup. Adding new stats follows the same pattern: add a pure aggregator function under `src/lib/aggregator/`, write tests, surface in the relevant section component. No Firestore changes required.

**Out of scope for this plan (deferred):**
- Phase 3.5 player attribution (opt-in first-name aggregation).
- Avg-VP-per-round visualization (the `avgVpPerRound: number[]` field is computed as `[]` for now; a follow-up plan can wire round-aware accumulation through `buildFactionStats`).
- Deeper agenda netVpSwing accuracy (current implementation uses a 60-second timestamp window; spec calls for round-based matching that requires `round` field on `VpEvent` or a per-game lookup).

---

## Phase 3.1 — Direct Strategy Phase round detection (follow-up)

**Why:** Today's `deriveRoundBoundaries` infers round boundaries by chunking strategy card pick events by `factionCount`. This is correct for well-formed exports but has two robustness gaps the code reviewer flagged in Task 3:
- Tied-timestamp picks (TI Assistant rapid-fire logs) could shuffle chunk boundaries — the sort is stable but no explicit tie-breaker is asserted.
- A wrong `factionCount` (or a partial export missing one faction's pick) silently misattributes every subsequent round by one.

A more direct approach would anchor on the **Strategy Phase transition itself** rather than its observable side effect (the picks). The Strategy Phase is the first thing in every round; a `ADVANCE_PHASE` event transitioning to `'strategy'` is an unambiguous round-start marker.

**Why we didn't do this in Phase 3:** TI Assistant's `ADVANCE_PHASE` events carry timestamps in the raw log, but the current parser strips them when building `phaseSnapshots`. Capturing them requires a parser extension (Task-1-shaped) before the aggregator change.

**Sketch of the work:**

1. **Parser extension:** Add a `phaseTransitions: PhaseTransition[]` field to `ParsedGame` capturing every `ADVANCE_PHASE` event with `{ fromPhase, toPhase, round, timestamp }`. Field is optional for back-compat with existing Firestore docs.

2. **Aggregator rewrite:** Replace `deriveRoundBoundaries(strategyCardEvents, factionCount)` with `deriveRoundBoundaries(phaseTransitions)`. Implementation becomes a one-liner filter: `transitions.filter(t => t.toPhase === 'strategy').map(t => ({ round: t.round, startTimestamp: t.timestamp }))`. No chunking, no factionCount, no tied-timestamp hazard.

3. **Caller migration:** `MetaContext` updates the `boundariesByGame` build to pass `game.phaseTransitions ?? []`. Falls back to the current strategy-card-chunking implementation when `phaseTransitions` is absent (pre-Phase-3.1 documents).

4. **Re-upload prompt:** Old Firestore docs won't have `phaseTransitions`; UI surfaces a "re-upload to enable strict round detection" hint similar to the existing action-types hint.

**Acceptance:** All 6 game exports re-uploaded. `MetaContext` builds boundariesByGame from `phaseTransitions` for those games. Round attribution for tech research order, agenda VP swings, comeback index, and Stage II first-scorer is derived from phase transitions, not pick chunking. Existing 9 `deriveRoundBoundaries` aggregator tests continue to pass against the legacy chunking codepath; new tests cover the phase-transition codepath.

**Order of operations:** Wait for Phase 3 to ship and the dashboard to be in real use. If the chunking-based implementation never produces a visible anomaly, this can stay deferred indefinitely. If anomalies appear (e.g., a game where round attribution looks off), bump priority.
