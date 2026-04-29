# Phase 5d — New Analytics Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add six new analytics features: round-by-round score snapshots in RecapSection, speaker order correlation in MetaDashboard Stats, a scoring pace curve in MetaDashboard, relic performance stats, a dedicated `/agenda` route with cross-game analytics, and tech path analysis in MetaDashboard Techs.

**Architecture:** Six independent tasks. Tasks 1–4 are additions to existing views (RecapSection and MetaDashboard). Task 5 is a new `/agenda` route (standalone page, loads its own data). Task 6 extends MetaDashboard Techs. Each task adds one new aggregator + one UI change; MetaContext is extended in Tasks 2–4 and 6.

**Tech Stack:** TypeScript, React 19, Vitest. No new dependencies. The project uses `noUncheckedIndexedAccess: true` — every array access needs `?.` or `?? fallback`. `vpEvents`, `phaseSnapshots`, `relicEvents`, and `strategyCardEvents` are all present on `ParsedGame`.

**Key types available:**
- `RelicEvent`: `{ faction, relic, timestamp, gameTime?, type: 'gain' | 'play' | 'lose' }`
- `PhaseSnapshot`: `{ round, phase: string, speaker, strategyCards }`
- `VpEvent`: `{ faction, objective, points, timestamp, gameTime?, source: VpSource }`
- `StrategyCardEvent`: `{ faction, card, timestamp, gameTime?, type: 'pick' | 'play_primary' | 'play_secondary' | 'pass_secondary' }`
- `ParsedGame.initialSpeaker: string`
- `ParsedGame.durationSeconds: number`, `ParsedGame.playedAt: number` (earliest timestampMillis)
- `getVictoryPointThreshold(options)` in `src/lib/parser/options.ts`

---

## File Map

| File | Action | Purpose |
|------|---------|---------|
| `app/src/lib/recap/buildRoundScores.ts` | Create | Round-by-round cumulative VP per faction |
| `app/src/lib/recap/buildRoundScores.test.ts` | Create | TDD tests |
| `app/src/features/game-detail/RecapSection.tsx` | Modify | Add round score table below standings |
| `app/src/lib/aggregator/buildSpeakerStats.ts` | Create | Speaker order win correlation |
| `app/src/lib/aggregator/buildSpeakerStats.test.ts` | Create | TDD tests |
| `app/src/lib/aggregator/index.ts` | Modify | Export buildSpeakerStats + types |
| `app/src/features/meta-dashboard/MetaContext.tsx` | Modify | Add speakerStats, scoringPace, relicStats, techPaths fields |
| `app/src/features/meta-dashboard/StatsSection.tsx` | Modify | Add speaker + relic sections |
| `app/src/lib/aggregator/buildScoringPace.ts` | Create | Normalized winner VP curves per game |
| `app/src/lib/aggregator/buildScoringPace.test.ts` | Create | TDD tests |
| `app/src/features/meta-dashboard/ScoringPaceSection.tsx` | Create | SVG pace chart |
| `app/src/features/meta-dashboard/MetaDashboardPage.tsx` | Modify | Add ScoringPaceSection |
| `app/src/lib/aggregator/buildRelicStats.ts` | Create | Relic gain/play/VP frequency |
| `app/src/lib/aggregator/buildRelicStats.test.ts` | Create | TDD tests |
| `app/src/lib/aggregator/buildAgendaStats.ts` | Create | Cross-game agenda pass/fail analytics |
| `app/src/lib/aggregator/buildAgendaStats.test.ts` | Create | TDD tests |
| `app/src/features/agenda/AgendaPage.tsx` | Create | Standalone agenda analytics page |
| `app/src/App.tsx` | Modify | Add `/agenda` route |
| `app/src/lib/aggregator/buildTechPaths.ts` | Create | Per-faction research order aggregation |
| `app/src/lib/aggregator/buildTechPaths.test.ts` | Create | TDD tests |
| `app/src/features/meta-dashboard/TechSection.tsx` | Modify | Add research path section |

---

## Task 1 — Round-by-round score snapshots in RecapSection

**Files:**
- Create: `app/src/lib/recap/buildRoundScores.ts`
- Create: `app/src/lib/recap/buildRoundScores.test.ts`
- Modify: `app/src/features/game-detail/RecapSection.tsx`

> **Context:** RecapSection's standings strip shows only final scores. Add a compact round-by-round VP table below it. `buildRoundScores` takes `vpEvents`, `factions`, and `roundBoundaries` (derived from `strategyCardEvents`) and returns one row per round, each row showing every faction's cumulative VP at the end of that round. A faction's VP at the end of round N = sum of all their `vpEvents` with `timestamp < startTimestamp[round N+1]` (or all events for the final round). If `roundBoundaries` is empty (rare — no strategy card picks detected), return `[]` and the table is simply not rendered.

### Steps

- [ ] **Step 1: Write failing tests for `buildRoundScores`**

Create `app/src/lib/recap/buildRoundScores.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildRoundScores } from './buildRoundScores';
import type { VpEvent, FactionSetup } from '../parser/types';
import type { RoundBoundary } from '../aggregator/deriveRoundBoundaries';

function makeVp(faction: string, points: number, timestamp: number): VpEvent {
  return { faction, objective: 'test', points, timestamp, source: 'score_objective' };
}
function makeFaction(id: string): FactionSetup {
  return { factionId: id, playerName: 'p', color: 'red', mapPosition: 0, startingTechs: [], startingPlanets: [] };
}

describe('buildRoundScores', () => {
  it('returns empty array when no boundaries', () => {
    const result = buildRoundScores([makeVp('Sol', 1, 100)], [makeFaction('Sol')], []);
    expect(result).toEqual([]);
  });

  it('produces one row per round in boundaries', () => {
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 0 },
      { round: 2, startTimestamp: 1000 },
      { round: 3, startTimestamp: 2000 },
    ];
    const events: VpEvent[] = [makeVp('Sol', 2, 500), makeVp('Sol', 3, 1500)];
    const result = buildRoundScores(events, [makeFaction('Sol')], boundaries);
    expect(result).toHaveLength(3);
  });

  it('cuts off events that happen in a later round', () => {
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 0 },
      { round: 2, startTimestamp: 1000 },
    ];
    const events: VpEvent[] = [makeVp('Sol', 2, 500), makeVp('Sol', 3, 1500)];
    const result = buildRoundScores(events, [makeFaction('Sol')], boundaries);
    expect(result[0]?.scores['Sol']).toBe(2);  // only the round-1 event
    expect(result[1]?.scores['Sol']).toBe(5);  // both events (final round: all)
  });

  it('handles two factions independently', () => {
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 0 },
      { round: 2, startTimestamp: 1000 },
    ];
    const events: VpEvent[] = [makeVp('Sol', 2, 500), makeVp('Hacan', 1, 800)];
    const result = buildRoundScores(events, [makeFaction('Sol'), makeFaction('Hacan')], boundaries);
    expect(result[0]?.scores['Sol']).toBe(2);
    expect(result[0]?.scores['Hacan']).toBe(1);
  });

  it('faction with no VP events gets 0 in every round', () => {
    const boundaries: RoundBoundary[] = [{ round: 1, startTimestamp: 0 }];
    const result = buildRoundScores([], [makeFaction('Sol')], boundaries);
    expect(result[0]?.scores['Sol']).toBe(0);
  });
});
```

Run: `cd "D:/_TI4 App/app" && npm test -- buildRoundScores`
Expected: all 5 tests FAIL (module not found).

- [ ] **Step 2: Implement `buildRoundScores.ts`**

Create `app/src/lib/recap/buildRoundScores.ts`:

```ts
import type { VpEvent, FactionSetup } from '../parser/types';
import type { RoundBoundary } from '../aggregator/deriveRoundBoundaries';

export interface RoundScoreRow {
  round: number;
  scores: Record<string, number>;
}

export function buildRoundScores(
  vpEvents: VpEvent[],
  factions: FactionSetup[],
  roundBoundaries: RoundBoundary[],
): RoundScoreRow[] {
  if (roundBoundaries.length === 0) return [];

  const maxRound = Math.max(...roundBoundaries.map(b => b.round));
  const rows: RoundScoreRow[] = [];

  for (let r = 1; r <= maxRound; r++) {
    const nextBoundary = roundBoundaries.find(b => b.round === r + 1);
    const cutoff = nextBoundary?.startTimestamp ?? Infinity;

    const scores: Record<string, number> = {};
    for (const f of factions) {
      scores[f.factionId] = vpEvents
        .filter(e => e.faction === f.factionId && e.timestamp < cutoff)
        .reduce((sum, e) => sum + e.points, 0);
    }
    rows.push({ round: r, scores });
  }
  return rows;
}
```

- [ ] **Step 3: Run tests — verify pass**

```
cd "D:/_TI4 App/app" && npm test -- buildRoundScores
```

Expected: 5/5 pass.

- [ ] **Step 4: Add round score table to `RecapSection.tsx`**

Read `app/src/features/game-detail/RecapSection.tsx`. At the top, add imports:

```ts
import { buildRoundScores, type RoundScoreRow } from '../../lib/recap/buildRoundScores';
import { deriveRoundBoundaries } from '../../lib/aggregator/deriveRoundBoundaries';
```

Inside the `RecapSection` function, add a second `useMemo` after the existing `recap` one:

```ts
  const roundScores: RoundScoreRow[] = useMemo(
    () =>
      game !== null
        ? buildRoundScores(
            game.vpEvents,
            game.factions,
            deriveRoundBoundaries(game.strategyCardEvents, game.factions.length),
          )
        : [],
    [game],
  );
```

Add the round score table JSX after the standings strip (after the closing `</div>` of the `{standings.map(...)}` block), still inside the `<section>`:

```tsx
      {roundScores.length > 0 && (
        <>
          <Rule />
          {/* Round-by-round score table */}
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', color: 'var(--ink-3)', fontWeight: 'normal', paddingRight: 8, whiteSpace: 'nowrap' }}>Rd</th>
                  {standings.map(s => (
                    <th key={s.factionId} style={{ textAlign: 'center', color: 'var(--ink-3)', fontWeight: 'normal', paddingBottom: 2 }}>
                      <FactionDot color={s.color} size={5} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roundScores.map(row => (
                  <tr key={row.round}>
                    <td style={{ color: 'var(--ink-3)', paddingRight: 8 }}>R{row.round}</td>
                    {standings.map(s => (
                      <td
                        key={s.factionId}
                        style={{
                          textAlign: 'center',
                          fontWeight: 800,
                          color: s.isWinner ? 'var(--accent)' : 'var(--ink)',
                        }}
                      >
                        {row.scores[s.factionId] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
```

`standings` is already in scope from `recap`. `FactionDot` is already imported from `'../../shared'`. `Rule` is already imported.

- [ ] **Step 5: Typecheck + full suite**

```
cd "D:/_TI4 App/app" && npm run typecheck && npm test
```

Expected: no errors, all tests pass (5 new tests added).

- [ ] **Step 6: Commit**

```bash
cd "D:/_TI4 App/app" && git add src/lib/recap/buildRoundScores.ts src/lib/recap/buildRoundScores.test.ts src/features/game-detail/RecapSection.tsx && git commit -m "feat: round-by-round score table in RecapSection"
```

---

## Task 2 — Speaker order stats in MetaDashboard Stats tab

**Files:**
- Create: `app/src/lib/aggregator/buildSpeakerStats.ts`
- Create: `app/src/lib/aggregator/buildSpeakerStats.test.ts`
- Modify: `app/src/lib/aggregator/index.ts`
- Modify: `app/src/features/meta-dashboard/MetaContext.tsx`
- Modify: `app/src/features/meta-dashboard/StatsSection.tsx`

> **Context:** `ParsedGame.initialSpeaker` is the factionId of the round-1 speaker. `phaseSnapshots` records the `speaker` at every phase transition. To find who was speaker in round N, look for the first snapshot with `round === N` whose `phase` contains 'strategy' (case-insensitive). Compute: (1) what fraction of games were won by the initial speaker, and (2) do winners average more rounds as speaker than non-winners?

### Steps

- [ ] **Step 1: Write failing tests**

Create `app/src/lib/aggregator/buildSpeakerStats.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildSpeakerStats } from './buildSpeakerStats';
import type { ParsedGame, PhaseSnapshot, FactionSetup } from '../parser/types';

function makeGame(overrides: Partial<ParsedGame>): ParsedGame {
  return {
    gameId: 'g1', playedAt: 0, durationSeconds: 3600,
    factions: [
      { factionId: 'Sol', playerName: 'p1', color: 'blue', mapPosition: 0, startingTechs: [], startingPlanets: [] },
      { factionId: 'Hacan', playerName: 'p2', color: 'yellow', mapPosition: 1, startingTechs: [], startingPlanets: [] },
    ],
    options: {}, initialSpeaker: 'Sol',
    phaseSnapshots: [
      { round: 1, phase: 'Strategy', speaker: 'Sol', strategyCards: {} },
      { round: 2, phase: 'Strategy', speaker: 'Hacan', strategyCards: {} },
    ],
    vpEvents: [], planetEvents: [], techEvents: [], agendaResolutions: [],
    strategyCardEvents: [], actionCardEvents: [], componentEvents: [],
    relicEvents: [], leaderEvents: [], objectiveReveals: [], speakerEvents: [],
    attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: [],
    expeditionEvents: [], secondaryEvents: [], actionEvents: [],
    finalScores: { Sol: 10, Hacan: 6 }, winner: 'Sol',
    timers: { game: 3600, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
    ...overrides,
  } as ParsedGame;
}

describe('buildSpeakerStats', () => {
  it('returns zeros for empty games array', () => {
    const r = buildSpeakerStats([]);
    expect(r.gamesAnalyzed).toBe(0);
    expect(r.initialSpeakerWinRate).toBe(0);
  });

  it('counts initial speaker win when winner matches initialSpeaker', () => {
    const r = buildSpeakerStats([makeGame({ winner: 'Sol', initialSpeaker: 'Sol' })]);
    expect(r.initialSpeakerWinCount).toBe(1);
    expect(r.initialSpeakerWinRate).toBe(1);
  });

  it('does not count initial speaker win when winner differs', () => {
    const r = buildSpeakerStats([makeGame({ winner: 'Hacan', initialSpeaker: 'Sol' })]);
    expect(r.initialSpeakerWinCount).toBe(0);
    expect(r.initialSpeakerWinRate).toBe(0);
  });

  it('excludes games with no winner', () => {
    const r = buildSpeakerStats([makeGame({ winner: null })]);
    expect(r.gamesAnalyzed).toBe(0);
  });

  it('computes winner rounds as speaker correctly', () => {
    const game = makeGame({
      winner: 'Sol',
      phaseSnapshots: [
        { round: 1, phase: 'Strategy', speaker: 'Sol', strategyCards: {} },
        { round: 2, phase: 'Strategy', speaker: 'Sol', strategyCards: {} },
        { round: 3, phase: 'Strategy', speaker: 'Hacan', strategyCards: {} },
      ],
    });
    const r = buildSpeakerStats([game]);
    expect(r.avgRoundsAsSpeakerWinner).toBe(2);
  });
});
```

Run: `cd "D:/_TI4 App/app" && npm test -- buildSpeakerStats`
Expected: all FAIL (module not found).

- [ ] **Step 2: Implement `buildSpeakerStats.ts`**

Create `app/src/lib/aggregator/buildSpeakerStats.ts`:

```ts
import type { ParsedGame, PhaseSnapshot } from '../parser/types';

export interface SpeakerStats {
  gamesAnalyzed: number;
  initialSpeakerWinCount: number;
  initialSpeakerWinRate: number;
  avgRoundsAsSpeakerWinner: number;
  avgRoundsAsSpeakerNonWinner: number;
}

function speakerByRound(snapshots: PhaseSnapshot[]): Record<number, string> {
  const result: Record<number, string> = {};
  for (const snap of snapshots) {
    if (snap.phase.toLowerCase().includes('strategy') && result[snap.round] === undefined) {
      result[snap.round] = snap.speaker;
    }
  }
  return result;
}

export function buildSpeakerStats(games: ParsedGame[]): SpeakerStats {
  let gamesAnalyzed = 0;
  let initialSpeakerWinCount = 0;
  let totalWinnerRounds = 0;
  let totalNonWinnerRounds = 0;
  let nonWinnerFactionRoundPairs = 0;

  for (const game of games) {
    if (game.winner === null) continue;
    gamesAnalyzed++;

    if (game.winner === game.initialSpeaker) initialSpeakerWinCount++;

    const byRound = speakerByRound(game.phaseSnapshots);
    const rounds = Object.keys(byRound).map(Number);
    if (rounds.length === 0) continue;

    let winnerRounds = 0;
    for (const r of rounds) {
      if (byRound[r] === game.winner) winnerRounds++;
    }
    totalWinnerRounds += winnerRounds;

    for (const f of game.factions) {
      if (f.factionId === game.winner) continue;
      let fRounds = 0;
      for (const r of rounds) {
        if (byRound[r] === f.factionId) fRounds++;
      }
      totalNonWinnerRounds += fRounds;
      nonWinnerFactionRoundPairs++;
    }
  }

  return {
    gamesAnalyzed,
    initialSpeakerWinCount,
    initialSpeakerWinRate: gamesAnalyzed > 0 ? initialSpeakerWinCount / gamesAnalyzed : 0,
    avgRoundsAsSpeakerWinner: gamesAnalyzed > 0 ? totalWinnerRounds / gamesAnalyzed : 0,
    avgRoundsAsSpeakerNonWinner: nonWinnerFactionRoundPairs > 0 ? totalNonWinnerRounds / nonWinnerFactionRoundPairs : 0,
  };
}
```

- [ ] **Step 3: Run tests — verify pass**

```
cd "D:/_TI4 App/app" && npm test -- buildSpeakerStats
```

Expected: 5/5 pass.

- [ ] **Step 4: Export from `app/src/lib/aggregator/index.ts`**

Read the file. Add after the last existing export line:

```ts
export { buildSpeakerStats } from './buildSpeakerStats';
export type { SpeakerStats } from './buildSpeakerStats';
```

- [ ] **Step 5: Add `speakerStats` to MetaContext**

Read `app/src/features/meta-dashboard/MetaContext.tsx`.

Add to the import from `'../../lib/aggregator'`:
```ts
buildSpeakerStats, type SpeakerStats,
```

Add to the `MetaState` interface:
```ts
  speakerStats: SpeakerStats | null;
```

Add to `initialState`:
```ts
  speakerStats: null,
```

In the `loadAllGames().then(...)` block, add to `next`:
```ts
  speakerStats: buildSpeakerStats(games),
```

- [ ] **Step 6: Add speaker section to `StatsSection.tsx`**

Read `app/src/features/meta-dashboard/StatsSection.tsx`. The component uses `const { gameStats } = useMetaContext()` (or similar). Add `speakerStats` to the destructure.

Add a new "Speaker Order" section. Find the `gameStats` null-guard and ensure the component also handles `speakerStats`. Insert this section after the existing "Agenda Analysis" block (near the end):

```tsx
      {speakerStats !== null && speakerStats.gamesAnalyzed > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 6 }}>
            Speaker Order
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 28, lineHeight: 1 }}>
                {Math.round(speakerStats.initialSpeakerWinRate * 100)}%
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-3)', marginTop: 2 }}>
                initial speaker<br />win rate
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 28, lineHeight: 1 }}>
                {speakerStats.avgRoundsAsSpeakerWinner.toFixed(1)}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-3)', marginTop: 2 }}>
                avg rounds as<br />speaker (winners)
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 28, lineHeight: 1 }}>
                {speakerStats.avgRoundsAsSpeakerNonWinner.toFixed(1)}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-3)', marginTop: 2 }}>
                avg rounds as<br />speaker (others)
              </div>
            </div>
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-4)', marginTop: 6 }}>
            {speakerStats.initialSpeakerWinCount} of {speakerStats.gamesAnalyzed} games won by initial speaker
          </div>
        </div>
      )}
```

- [ ] **Step 7: Typecheck + full suite**

```
cd "D:/_TI4 App/app" && npm run typecheck && npm test
```

Expected: no errors, all tests pass.

- [ ] **Step 8: Commit**

```bash
cd "D:/_TI4 App/app" && git add src/lib/aggregator/buildSpeakerStats.ts src/lib/aggregator/buildSpeakerStats.test.ts src/lib/aggregator/index.ts src/features/meta-dashboard/MetaContext.tsx src/features/meta-dashboard/StatsSection.tsx && git commit -m "feat: speaker order win correlation in MetaDashboard Stats"
```

---

## Task 3 — Scoring pace curve in MetaDashboard

**Files:**
- Create: `app/src/lib/aggregator/buildScoringPace.ts`
- Create: `app/src/lib/aggregator/buildScoringPace.test.ts`
- Modify: `app/src/lib/aggregator/index.ts`
- Modify: `app/src/features/meta-dashboard/MetaContext.tsx`
- Create: `app/src/features/meta-dashboard/ScoringPaceSection.tsx`
- Modify: `app/src/features/meta-dashboard/MetaDashboardPage.tsx`

> **Context:** For each game that has a winner, compute the winner's VP progression over normalized game time (0→1). `game.playedAt` is the earliest event timestamp in ms; `game.durationSeconds * 1000` is the total game duration in ms. Normalizing: `t = (event.timestamp - game.playedAt) / (game.durationSeconds * 1000)`, clamped to [0, 1]. Each curve anchors at `(0, 0)` and ends at `(1, finalVp)`. Render as an SVG with one path per game, all semi-transparent except on hover.

### Steps

- [ ] **Step 1: Write failing tests**

Create `app/src/lib/aggregator/buildScoringPace.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildScoringPace } from './buildScoringPace';
import type { ParsedGame } from '../parser/types';

function makeGame(overrides: Partial<ParsedGame>): ParsedGame {
  return {
    gameId: 'g1', playedAt: 1000, durationSeconds: 10,
    factions: [{ factionId: 'Sol', playerName: 'p', color: 'blue', mapPosition: 0, startingTechs: [], startingPlanets: [] }],
    options: {}, initialSpeaker: 'Sol', phaseSnapshots: [],
    vpEvents: [], planetEvents: [], techEvents: [], agendaResolutions: [],
    strategyCardEvents: [], actionCardEvents: [], componentEvents: [],
    relicEvents: [], leaderEvents: [], objectiveReveals: [], speakerEvents: [],
    attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: [],
    expeditionEvents: [], secondaryEvents: [], actionEvents: [],
    finalScores: { Sol: 10 }, winner: 'Sol',
    timers: { game: 10, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
    ...overrides,
  } as ParsedGame;
}

describe('buildScoringPace', () => {
  it('returns empty curves for no games', () => {
    expect(buildScoringPace([]).curves).toHaveLength(0);
  });

  it('excludes games with no winner', () => {
    const r = buildScoringPace([makeGame({ winner: null })]);
    expect(r.curves).toHaveLength(0);
  });

  it('curve always starts at (0, 0)', () => {
    const game = makeGame({
      vpEvents: [{ faction: 'Sol', objective: 'obj', points: 3, timestamp: 5000, source: 'score_objective' }],
    });
    const r = buildScoringPace([game]);
    expect(r.curves[0]?.points[0]).toEqual({ t: 0, vp: 0 });
  });

  it('normalizes timestamp within game duration', () => {
    // playedAt=1000ms, durationSeconds=10 → durationMs=10000ms
    // VP event at timestamp=6000 → t = (6000-1000)/10000 = 0.5
    const game = makeGame({
      vpEvents: [{ faction: 'Sol', objective: 'obj', points: 5, timestamp: 6000, source: 'score_objective' }],
    });
    const r = buildScoringPace([game]);
    expect(r.curves[0]?.points[1]?.t).toBeCloseTo(0.5);
    expect(r.curves[0]?.points[1]?.vp).toBe(5);
  });

  it('appends terminal point at t=1 with finalVp', () => {
    const game = makeGame({
      vpEvents: [{ faction: 'Sol', objective: 'obj', points: 7, timestamp: 3000, source: 'score_objective' }],
      finalScores: { Sol: 10 },
    });
    const r = buildScoringPace([game]);
    const pts = r.curves[0]?.points ?? [];
    expect(pts[pts.length - 1]).toEqual({ t: 1, vp: 10 });
  });
});
```

Run: `cd "D:/_TI4 App/app" && npm test -- buildScoringPace`
Expected: all FAIL.

- [ ] **Step 2: Implement `buildScoringPace.ts`**

Create `app/src/lib/aggregator/buildScoringPace.ts`:

```ts
import type { ParsedGame } from '../parser/types';
import { getVictoryPointThreshold } from '../parser/options';

export interface ScoringPacePoint {
  t: number;  // 0–1 normalized game time
  vp: number; // cumulative VP
}

export interface ScoringPaceCurve {
  gameId: string;
  playedAt: number;
  points: ScoringPacePoint[];
  victoryPoints: number;
}

export interface ScoringPaceSummary {
  curves: ScoringPaceCurve[];
}

export function buildScoringPace(games: ParsedGame[]): ScoringPaceSummary {
  const curves: ScoringPaceCurve[] = [];

  for (const game of games) {
    if (game.winner === null || game.durationSeconds === 0) continue;

    const victoryPoints = getVictoryPointThreshold(game.options);
    const durationMs = game.durationSeconds * 1000;
    const startMs = game.playedAt;
    const winnerEvents = game.vpEvents.filter(e => e.faction === game.winner);

    const points: ScoringPacePoint[] = [{ t: 0, vp: 0 }];
    let cumVp = 0;

    for (const e of winnerEvents) {
      cumVp += e.points;
      const t = Math.min(1, Math.max(0, (e.timestamp - startMs) / durationMs));
      points.push({ t, vp: cumVp });
    }

    const finalVp = game.finalScores[game.winner] ?? 0;
    const lastPt = points[points.length - 1];
    if (lastPt === undefined || lastPt.t < 1) {
      points.push({ t: 1, vp: finalVp });
    }

    curves.push({ gameId: game.gameId, playedAt: game.playedAt, points, victoryPoints });
  }

  return { curves };
}
```

- [ ] **Step 3: Run tests — verify pass**

```
cd "D:/_TI4 App/app" && npm test -- buildScoringPace
```

Expected: 5/5 pass.

- [ ] **Step 4: Export from `index.ts` and add to MetaContext**

In `app/src/lib/aggregator/index.ts`, add:
```ts
export { buildScoringPace } from './buildScoringPace';
export type { ScoringPaceSummary, ScoringPaceCurve, ScoringPacePoint } from './buildScoringPace';
```

Read `app/src/features/meta-dashboard/MetaContext.tsx`. Add `buildScoringPace` and `ScoringPaceSummary` to the aggregator import. Add `scoringPace: ScoringPaceSummary | null` to `MetaState`, `null` to `initialState`, and `scoringPace: buildScoringPace(games)` to the `next` object in the then-handler.

- [ ] **Step 5: Create `ScoringPaceSection.tsx`**

Create `app/src/features/meta-dashboard/ScoringPaceSection.tsx`:

```tsx
import { useMetaContext } from './MetaContext';
import { Kicker } from '../../shared';
import { formatDate } from '../../shared';

const W = 480;
const H = 200;
const PAD = { top: 12, right: 12, bottom: 24, left: 28 };

export function ScoringPaceSection() {
  const { scoringPace } = useMetaContext();
  if (scoringPace === null || scoringPace.curves.length === 0) return null;

  const maxVp = Math.max(...scoringPace.curves.map(c => c.victoryPoints));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  function toSvgX(t: number) { return PAD.left + t * innerW; }
  function toSvgY(vp: number) { return PAD.top + innerH - (vp / maxVp) * innerH; }

  function curveToPath(points: { t: number; vp: number }[]): string {
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.t).toFixed(1)} ${toSvgY(p.vp).toFixed(1)}`)
      .join(' ');
  }

  return (
    <section id="scoring-pace" data-section="scoring-pace" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}>
      <Kicker>Scoring Pace</Kicker>
      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>
        Winner VP trajectory per game — normalized to game duration
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxWidth: W }}>
        {/* Y axis labels */}
        {[0, Math.round(maxVp / 2), maxVp].map(v => (
          <text key={v} x={PAD.left - 4} y={toSvgY(v) + 3} textAnchor="end"
            style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, fill: 'var(--ink-4)' }}>
            {v}
          </text>
        ))}
        {/* VP threshold line */}
        <line x1={PAD.left} y1={toSvgY(maxVp)} x2={PAD.left + innerW} y2={toSvgY(maxVp)}
          stroke="var(--rule)" strokeWidth={1} strokeDasharray="3 3" />
        {/* One path per game */}
        {scoringPace.curves.map(curve => (
          <path
            key={curve.gameId}
            d={curveToPath(curve.points)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.5}
            opacity={0.5}
          />
        ))}
        {/* X axis */}
        <line x1={PAD.left} y1={PAD.top + innerH} x2={PAD.left + innerW} y2={PAD.top + innerH}
          stroke="var(--rule)" strokeWidth={1} />
        {['0%', '50%', '100%'].map((label, i) => (
          <text key={label} x={toSvgX(i * 0.5)} y={PAD.top + innerH + 12} textAnchor="middle"
            style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, fill: 'var(--ink-4)' }}>
            {label}
          </text>
        ))}
      </svg>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-4)', marginTop: 4 }}>
        {scoringPace.curves.length} game{scoringPace.curves.length !== 1 ? 's' : ''} · {maxVp} VP threshold
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Add to `MetaDashboardPage.tsx`**

Read `app/src/features/meta-dashboard/MetaDashboardPage.tsx`. Import `ScoringPaceSection` and add it after `StatsSection` in the scroll body. Also add `{ id: 'scoring-pace', label: 'Pace' }` to `META_SECTIONS` so the nav shows a tab for it.

- [ ] **Step 7: Typecheck + full suite**

```
cd "D:/_TI4 App/app" && npm run typecheck && npm test
```

Expected: no errors, all tests pass.

- [ ] **Step 8: Commit**

```bash
cd "D:/_TI4 App/app" && git add src/lib/aggregator/buildScoringPace.ts src/lib/aggregator/buildScoringPace.test.ts src/lib/aggregator/index.ts src/features/meta-dashboard/MetaContext.tsx src/features/meta-dashboard/ScoringPaceSection.tsx src/features/meta-dashboard/MetaDashboardPage.tsx && git commit -m "feat: scoring pace curve in MetaDashboard"
```

---

## Task 4 — Relic performance stats

**Files:**
- Create: `app/src/lib/aggregator/buildRelicStats.ts`
- Create: `app/src/lib/aggregator/buildRelicStats.test.ts`
- Modify: `app/src/lib/aggregator/index.ts`
- Modify: `app/src/features/meta-dashboard/MetaContext.tsx`
- Modify: `app/src/features/meta-dashboard/StatsSection.tsx`

> **Context:** `RelicEvent`: `{ faction, relic, timestamp, gameTime?, type: 'gain' | 'play' | 'lose' }`. The existing StatsSection already shows a brief "Relic activity" count from `buildGameStats`. Add a new `buildRelicStats` that produces per-relic breakdown: how often each named relic was gained and played across all games, and which factions gained it most. `vpEvents` with `source: 'relic'` tell us games where relics contributed VP (we don't try to attribute VP to a specific relic). This replaces/extends the existing brief relic row in StatsSection.

### Steps

- [ ] **Step 1: Write failing tests**

Create `app/src/lib/aggregator/buildRelicStats.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildRelicStats } from './buildRelicStats';
import type { ParsedGame, RelicEvent } from '../parser/types';

function makeGame(relicEvents: RelicEvent[], hasRelicVp = false): Partial<ParsedGame> {
  return {
    gameId: 'g1',
    relicEvents,
    vpEvents: hasRelicVp
      ? [{ faction: 'Sol', objective: 'Shard', points: 1, timestamp: 1, source: 'relic' }]
      : [],
    factions: [],
  };
}

describe('buildRelicStats', () => {
  it('returns empty for no games', () => {
    expect(buildRelicStats([]).relics).toHaveLength(0);
  });

  it('counts gain and play per relic', () => {
    const events: RelicEvent[] = [
      { faction: 'Sol', relic: 'Shard', timestamp: 1, type: 'gain' },
      { faction: 'Sol', relic: 'Shard', timestamp: 2, type: 'play' },
      { faction: 'Hacan', relic: 'Crown', timestamp: 3, type: 'gain' },
    ];
    const r = buildRelicStats([makeGame(events)] as ParsedGame[]);
    const shard = r.relics.find(r => r.relic === 'Shard');
    expect(shard?.gainCount).toBe(1);
    expect(shard?.playCount).toBe(1);
    const crown = r.relics.find(r => r.relic === 'Crown');
    expect(crown?.gainCount).toBe(1);
    expect(crown?.playCount).toBe(0);
  });

  it('counts games with relic VP', () => {
    const r = buildRelicStats([makeGame([], true), makeGame([], false)] as ParsedGame[]);
    expect(r.gamesWithRelicVp).toBe(1);
  });

  it('tracks which factions gained each relic', () => {
    const events: RelicEvent[] = [
      { faction: 'Sol', relic: 'Shard', timestamp: 1, type: 'gain' },
      { faction: 'Sol', relic: 'Shard', timestamp: 2, type: 'gain' },
      { faction: 'Hacan', relic: 'Shard', timestamp: 3, type: 'gain' },
    ];
    const r = buildRelicStats([makeGame(events)] as ParsedGame[]);
    const shard = r.relics.find(r => r.relic === 'Shard');
    const solEntry = shard?.topFactions.find(f => f.factionId === 'Sol');
    expect(solEntry?.gainCount).toBe(2);
  });
});
```

Run: `cd "D:/_TI4 App/app" && npm test -- buildRelicStats`
Expected: all FAIL.

- [ ] **Step 2: Implement `buildRelicStats.ts`**

Create `app/src/lib/aggregator/buildRelicStats.ts`:

```ts
import type { ParsedGame } from '../parser/types';

export interface RelicStatEntry {
  relic: string;
  gainCount: number;
  playCount: number;
  topFactions: Array<{ factionId: string; gainCount: number }>;
}

export interface RelicStatsSummary {
  relics: RelicStatEntry[];
  gamesWithRelicVp: number;
  totalGames: number;
}

export function buildRelicStats(games: ParsedGame[]): RelicStatsSummary {
  const relicMap = new Map<string, { gains: number; plays: number; factions: Map<string, number> }>();
  let gamesWithRelicVp = 0;

  for (const game of games) {
    if (game.vpEvents.some(e => e.source === 'relic')) gamesWithRelicVp++;

    for (const e of game.relicEvents) {
      let entry = relicMap.get(e.relic);
      if (entry === undefined) {
        entry = { gains: 0, plays: 0, factions: new Map() };
        relicMap.set(e.relic, entry);
      }
      if (e.type === 'gain') {
        entry.gains++;
        entry.factions.set(e.faction, (entry.factions.get(e.faction) ?? 0) + 1);
      } else if (e.type === 'play') {
        entry.plays++;
      }
    }
  }

  const relics: RelicStatEntry[] = Array.from(relicMap.entries()).map(([relic, data]) => ({
    relic,
    gainCount: data.gains,
    playCount: data.plays,
    topFactions: Array.from(data.factions.entries())
      .map(([factionId, gainCount]) => ({ factionId, gainCount }))
      .sort((a, b) => b.gainCount - a.gainCount)
      .slice(0, 3),
  }));

  return {
    relics: relics.sort((a, b) => b.gainCount - a.gainCount),
    gamesWithRelicVp,
    totalGames: games.length,
  };
}
```

- [ ] **Step 3: Run tests — verify pass**

```
cd "D:/_TI4 App/app" && npm test -- buildRelicStats
```

Expected: 4/4 pass.

- [ ] **Step 4: Export and wire into MetaContext**

In `app/src/lib/aggregator/index.ts`, add:
```ts
export { buildRelicStats } from './buildRelicStats';
export type { RelicStatEntry, RelicStatsSummary } from './buildRelicStats';
```

Read `app/src/features/meta-dashboard/MetaContext.tsx`. Add `buildRelicStats`, `RelicStatsSummary` to the aggregator import. Add `relicStats: RelicStatsSummary | null` to `MetaState`, `null` to `initialState`, and `relicStats: buildRelicStats(games)` to the `next` object.

- [ ] **Step 5: Add relic section to `StatsSection.tsx`**

Read `StatsSection.tsx`. Add `relicStats` to the destructure from `useMetaContext()`. Add a "Relic Performance" block after the existing "Relic activity" row (find it by looking for `relics` in the JSX). The new block lists each relic with gain/play counts:

```tsx
      {relicStats !== null && relicStats.relics.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 6 }}>
            Relic Performance
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-4)', marginBottom: 6 }}>
            {relicStats.gamesWithRelicVp} of {relicStats.totalGames} games had relic VP
          </div>
          {relicStats.relics.map(r => (
            <div key={r.relic} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 13, fontStyle: 'italic' }}>{r.relic}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-3)' }}>
                {r.gainCount}× gained · {r.playCount}× played
              </span>
            </div>
          ))}
        </div>
      )}
```

- [ ] **Step 6: Typecheck + full suite**

```
cd "D:/_TI4 App/app" && npm run typecheck && npm test
```

Expected: no errors, all tests pass.

- [ ] **Step 7: Commit**

```bash
cd "D:/_TI4 App/app" && git add src/lib/aggregator/buildRelicStats.ts src/lib/aggregator/buildRelicStats.test.ts src/lib/aggregator/index.ts src/features/meta-dashboard/MetaContext.tsx src/features/meta-dashboard/StatsSection.tsx && git commit -m "feat: relic performance stats in MetaDashboard"
```

---

## Task 5 — Dedicated /agenda route

**Files:**
- Create: `app/src/lib/aggregator/buildAgendaStats.ts`
- Create: `app/src/lib/aggregator/buildAgendaStats.test.ts`
- Modify: `app/src/lib/aggregator/index.ts`
- Create: `app/src/features/agenda/AgendaPage.tsx`
- Modify: `app/src/App.tsx`

> **Context:** `agendaResolutions: AgendaResolution[]` on each `ParsedGame`. Shape: `{ agenda, outcome, round, timestamp, votes: AgendaVote[], riders: AgendaRider[] }`. `AgendaVote`: `{ faction, outcome, votes }`. An agenda "passes" when `outcome === 'For'`; it "fails" when `outcome === 'Against'`; for elect-type agendas, any non-null outcome is a pass (no fail). Detect pass/fail: `outcome === 'For'` → pass, `outcome === 'Against'` → fail, otherwise → pass (elected). `AgendaPage` loads games independently via `loadAllGames` — it does not use MetaContext.

### Steps

- [ ] **Step 1: Write failing tests**

Create `app/src/lib/aggregator/buildAgendaStats.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildAgendaStats } from './buildAgendaStats';
import type { ParsedGame, AgendaResolution } from '../parser/types';

function makeResolution(agenda: string, outcome: string): AgendaResolution {
  return { agenda, outcome, round: 1, timestamp: 0, votes: [], riders: [] };
}
function makeGame(resolutions: AgendaResolution[]): Partial<ParsedGame> {
  return { gameId: 'g1', agendaResolutions: resolutions, vpEvents: [], factions: [] };
}

describe('buildAgendaStats', () => {
  it('returns empty for no games', () => {
    const r = buildAgendaStats([]);
    expect(r.agendas).toHaveLength(0);
    expect(r.totalResolutions).toBe(0);
  });

  it('counts appearances per agenda name', () => {
    const r = buildAgendaStats([
      makeGame([makeResolution('Mutiny', 'For'), makeResolution('Mutiny', 'Against')]),
    ] as ParsedGame[]);
    expect(r.agendas.find(a => a.name === 'Mutiny')?.appearances).toBe(2);
  });

  it('counts pass when outcome is For', () => {
    const r = buildAgendaStats([makeGame([makeResolution('Mutiny', 'For')])] as ParsedGame[]);
    expect(r.agendas.find(a => a.name === 'Mutiny')?.passCount).toBe(1);
    expect(r.agendas.find(a => a.name === 'Mutiny')?.failCount).toBe(0);
  });

  it('counts fail when outcome is Against', () => {
    const r = buildAgendaStats([makeGame([makeResolution('Mutiny', 'Against')])] as ParsedGame[]);
    expect(r.agendas.find(a => a.name === 'Mutiny')?.failCount).toBe(1);
  });

  it('elect-type outcome (non-For/Against) counts as pass', () => {
    const r = buildAgendaStats([makeGame([makeResolution('Elect Officer', 'Hacan')])] as ParsedGame[]);
    expect(r.agendas.find(a => a.name === 'Elect Officer')?.passCount).toBe(1);
    expect(r.agendas.find(a => a.name === 'Elect Officer')?.failCount).toBe(0);
  });

  it('computes overall pass rate', () => {
    const r = buildAgendaStats([
      makeGame([makeResolution('A', 'For'), makeResolution('B', 'Against')]),
    ] as ParsedGame[]);
    expect(r.overallPassRate).toBeCloseTo(0.5);
  });
});
```

Run: `cd "D:/_TI4 App/app" && npm test -- buildAgendaStats`
Expected: all FAIL.

- [ ] **Step 2: Implement `buildAgendaStats.ts`**

Create `app/src/lib/aggregator/buildAgendaStats.ts`:

```ts
import type { ParsedGame } from '../parser/types';

export interface AgendaStat {
  name: string;
  appearances: number;
  passCount: number;
  failCount: number;
  passRate: number;
  avgForVotes: number;
  avgAgainstVotes: number;
}

export interface AgendaStatsSummary {
  agendas: AgendaStat[];
  totalResolutions: number;
  overallPassRate: number;
  gamesAnalyzed: number;
}

function isPassed(outcome: string): boolean {
  return outcome !== 'Against';
}

export function buildAgendaStats(games: ParsedGame[]): AgendaStatsSummary {
  const agendaMap = new Map<string, {
    appearances: number; passes: number; fails: number;
    totalFor: number; totalAgainst: number;
  }>();

  for (const game of games) {
    for (const res of game.agendaResolutions) {
      let entry = agendaMap.get(res.agenda);
      if (entry === undefined) {
        entry = { appearances: 0, passes: 0, fails: 0, totalFor: 0, totalAgainst: 0 };
        agendaMap.set(res.agenda, entry);
      }
      entry.appearances++;
      if (isPassed(res.outcome)) entry.passes++;
      else entry.fails++;

      for (const v of res.votes) {
        const voteCount = typeof v.votes === 'number' ? v.votes : 0;
        if (v.outcome === 'For') entry.totalFor += voteCount;
        else if (v.outcome === 'Against') entry.totalAgainst += voteCount;
      }
    }
  }

  const agendas: AgendaStat[] = Array.from(agendaMap.entries()).map(([name, data]) => ({
    name,
    appearances: data.appearances,
    passCount: data.passes,
    failCount: data.fails,
    passRate: data.appearances > 0 ? data.passes / data.appearances : 0,
    avgForVotes: data.appearances > 0 ? data.totalFor / data.appearances : 0,
    avgAgainstVotes: data.appearances > 0 ? data.totalAgainst / data.appearances : 0,
  }));

  const totalResolutions = agendas.reduce((s, a) => s + a.appearances, 0);
  const totalPassed = agendas.reduce((s, a) => s + a.passCount, 0);

  return {
    agendas: agendas.sort((a, b) => b.appearances - a.appearances),
    totalResolutions,
    overallPassRate: totalResolutions > 0 ? totalPassed / totalResolutions : 0,
    gamesAnalyzed: games.length,
  };
}
```

- [ ] **Step 3: Run tests — verify pass**

```
cd "D:/_TI4 App/app" && npm test -- buildAgendaStats
```

Expected: 6/6 pass.

- [ ] **Step 4: Export from aggregator index**

In `app/src/lib/aggregator/index.ts`, add:
```ts
export { buildAgendaStats } from './buildAgendaStats';
export type { AgendaStat, AgendaStatsSummary } from './buildAgendaStats';
```

- [ ] **Step 5: Create `app/src/features/agenda/AgendaPage.tsx`**

```tsx
import { useState, useEffect, useMemo } from 'react';
import { loadAllGames } from '../../adapters/firestore';
import { buildAgendaStats } from '../../lib/aggregator/buildAgendaStats';
import type { ParsedGame } from '../../lib/parser/types';
import { Kicker, Rule } from '../../shared';

export function AgendaPage() {
  const [games, setGames] = useState<ParsedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllGames()
      .then(g => { setGames(g); setLoading(false); })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load games');
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => buildAgendaStats(games), [games]);

  if (loading) {
    return <div style={{ padding: 24, fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}>Loading…</div>;
  }
  if (error !== null) {
    return <div style={{ padding: 24, color: 'var(--accent)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 48px' }}>
      {/* Masthead */}
      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 28, fontStyle: 'italic', borderBottom: '3px double var(--rule)', paddingBottom: 8, marginBottom: 12 }}>
        The Senate Almanac
      </div>
      <Kicker>Agenda Analytics · {stats.gamesAnalyzed} games · {stats.totalResolutions} resolutions</Kicker>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, margin: '12px 0' }}>
        <div>
          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 32, lineHeight: 1 }}>
            {Math.round(stats.overallPassRate * 100)}%
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-3)', marginTop: 2 }}>overall pass rate</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 32, lineHeight: 1 }}>
            {stats.agendas.length}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-3)', marginTop: 2 }}>distinct agendas</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 32, lineHeight: 1 }}>
            {stats.totalResolutions > 0 ? (stats.totalResolutions / stats.gamesAnalyzed).toFixed(1) : '—'}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-3)', marginTop: 2 }}>avg per game</div>
        </div>
      </div>

      <Rule weight="double" />

      {/* Agenda list */}
      {stats.agendas.map(agenda => (
        <div key={agenda.name} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 14 }}>
              {agenda.name}
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-3)' }}>
              {agenda.appearances}× · {Math.round(agenda.passRate * 100)}% pass
            </span>
          </div>
          {/* Pass/fail bar */}
          <div style={{ height: 4, background: 'var(--paper-2)', marginTop: 3, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${agenda.passRate * 100}%`, background: 'var(--accent)', borderRadius: 2 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Add route to `app/src/App.tsx`**

Read `app/src/App.tsx`. Add a lazy import for `AgendaPage`:
```ts
const AgendaPage = React.lazy(() => import('./features/agenda/AgendaPage').then(m => ({ default: m.AgendaPage })));
```

Add the route inside the `<Routes>` block:
```tsx
<Route path="/agenda" element={<React.Suspense fallback={<div>Loading…</div>}><AgendaPage /></React.Suspense>} />
```

- [ ] **Step 7: Typecheck + full suite**

```
cd "D:/_TI4 App/app" && npm run typecheck && npm test
```

Expected: no errors, all tests pass.

- [ ] **Step 8: Commit**

```bash
cd "D:/_TI4 App/app" && git add src/lib/aggregator/buildAgendaStats.ts src/lib/aggregator/buildAgendaStats.test.ts src/lib/aggregator/index.ts src/features/agenda/AgendaPage.tsx src/App.tsx && git commit -m "feat: /agenda route with cross-game senate almanac"
```

---

## Task 6 — Tech path analysis in MetaDashboard Techs tab

**Files:**
- Create: `app/src/lib/aggregator/buildTechPaths.ts`
- Create: `app/src/lib/aggregator/buildTechPaths.test.ts`
- Modify: `app/src/lib/aggregator/index.ts`
- Modify: `app/src/features/meta-dashboard/MetaContext.tsx`
- Modify: `app/src/features/meta-dashboard/TechSection.tsx`

> **Context:** `techEvents` with `type === 'research'` give us each faction's research history per game. Sort a faction's research events by `timestamp` ascending to get their research order (1st tech, 2nd tech, …). Aggregate across games: for each faction, for each position N (1st, 2nd, 3rd, 4th researched), count which tech appears most often. Only include factions that appear in ≥ 2 games (too sparse otherwise). Show top 3 techs per position. `lookupTechColor` from `src/lib/parser/techs.ts` maps tech name → `TechColor`.

### Steps

- [ ] **Step 1: Write failing tests**

Create `app/src/lib/aggregator/buildTechPaths.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildTechPaths } from './buildTechPaths';
import type { ParsedGame, TechEvent } from '../parser/types';

function makeTechEvent(faction: string, tech: string, timestamp: number): TechEvent {
  return { faction, tech, type: 'research', timestamp };
}
function makeGame(id: string, events: TechEvent[], factionId = 'Sol'): Partial<ParsedGame> {
  return {
    gameId: id,
    techEvents: events,
    factions: [{ factionId, playerName: 'p', color: 'blue', mapPosition: 0, startingTechs: [], startingPlanets: [] }],
  };
}

describe('buildTechPaths', () => {
  it('returns empty for no games', () => {
    expect(buildTechPaths([]).factions).toHaveLength(0);
  });

  it('excludes factions that appear in only 1 game', () => {
    const r = buildTechPaths([makeGame('g1', [makeTechEvent('Sol', 'Neural Motivator', 1)])] as ParsedGame[]);
    expect(r.factions).toHaveLength(0);
  });

  it('includes factions that appear in 2+ games', () => {
    const games = [
      makeGame('g1', [makeTechEvent('Sol', 'Neural Motivator', 1)]),
      makeGame('g2', [makeTechEvent('Sol', 'Sarween Tools', 1)]),
    ] as ParsedGame[];
    const r = buildTechPaths(games);
    expect(r.factions.find(f => f.factionId === 'Sol')).toBeDefined();
  });

  it('identifies most common first-researched tech', () => {
    const games = [
      makeGame('g1', [makeTechEvent('Sol', 'Neural Motivator', 1), makeTechEvent('Sol', 'Sarween Tools', 2)]),
      makeGame('g2', [makeTechEvent('Sol', 'Neural Motivator', 1), makeTechEvent('Sol', 'Predictive Intelligence', 2)]),
      makeGame('g3', [makeTechEvent('Sol', 'Neural Motivator', 1)]),
    ] as ParsedGame[];
    const r = buildTechPaths(games);
    const sol = r.factions.find(f => f.factionId === 'Sol');
    expect(sol?.pathByPosition[0]?.topTechs[0]?.tech).toBe('Neural Motivator');
  });

  it('uses only type research events, not starting', () => {
    const games = [
      makeGame('g1', [
        { faction: 'Sol', tech: 'Neural Motivator', type: 'starting', timestamp: 0 },
        makeTechEvent('Sol', 'Sarween Tools', 1),
      ]),
      makeGame('g2', [makeTechEvent('Sol', 'Sarween Tools', 1)]),
    ] as ParsedGame[];
    const r = buildTechPaths(games);
    const sol = r.factions.find(f => f.factionId === 'Sol');
    expect(sol?.pathByPosition[0]?.topTechs[0]?.tech).toBe('Sarween Tools');
  });
});
```

Run: `cd "D:/_TI4 App/app" && npm test -- buildTechPaths`
Expected: all FAIL.

- [ ] **Step 2: Implement `buildTechPaths.ts`**

Create `app/src/lib/aggregator/buildTechPaths.ts`:

```ts
import type { ParsedGame } from '../parser/types';
import { lookupTechColor } from '../parser/techs';
import type { TechColor } from '../parser/techs';

const MAX_POSITIONS = 4;
const MIN_GAMES = 2;

export interface TechPathEntry {
  position: number;
  topTechs: Array<{ tech: string; count: number; color: TechColor }>;
}

export interface FactionTechPath {
  factionId: string;
  gamesAnalyzed: number;
  pathByPosition: TechPathEntry[];
}

export interface TechPathSummary {
  factions: FactionTechPath[];
}

export function buildTechPaths(games: ParsedGame[]): TechPathSummary {
  // Map: factionId → position (0-based) → tech → count
  const data = new Map<string, Map<number, Map<string, number>>>();
  const gameCounts = new Map<string, number>();

  for (const game of games) {
    const factionsSeen = new Set<string>();
    for (const f of game.factions) {
      factionsSeen.add(f.factionId);
    }

    for (const factionId of factionsSeen) {
      const researched = game.techEvents
        .filter(e => e.faction === factionId && e.type === 'research')
        .sort((a, b) => a.timestamp - b.timestamp);

      gameCounts.set(factionId, (gameCounts.get(factionId) ?? 0) + 1);

      let posMap = data.get(factionId);
      if (posMap === undefined) {
        posMap = new Map();
        data.set(factionId, posMap);
      }

      for (let i = 0; i < Math.min(researched.length, MAX_POSITIONS); i++) {
        const tech = researched[i]?.tech;
        if (tech === undefined) continue;
        let techMap = posMap.get(i);
        if (techMap === undefined) {
          techMap = new Map();
          posMap.set(i, techMap);
        }
        techMap.set(tech, (techMap.get(tech) ?? 0) + 1);
      }
    }
  }

  const factions: FactionTechPath[] = [];

  for (const [factionId, posMap] of data) {
    const gamesAnalyzed = gameCounts.get(factionId) ?? 0;
    if (gamesAnalyzed < MIN_GAMES) continue;

    const pathByPosition: TechPathEntry[] = [];
    for (let pos = 0; pos < MAX_POSITIONS; pos++) {
      const techMap = posMap.get(pos);
      if (techMap === undefined || techMap.size === 0) continue;
      const topTechs = Array.from(techMap.entries())
        .map(([tech, count]) => ({ tech, count, color: lookupTechColor(tech) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      pathByPosition.push({ position: pos + 1, topTechs });
    }

    if (pathByPosition.length > 0) {
      factions.push({ factionId, gamesAnalyzed, pathByPosition });
    }
  }

  return { factions: factions.sort((a, b) => b.gamesAnalyzed - a.gamesAnalyzed) };
}
```

- [ ] **Step 3: Run tests — verify pass**

```
cd "D:/_TI4 App/app" && npm test -- buildTechPaths
```

Expected: 5/5 pass.

- [ ] **Step 4: Export from index and add to MetaContext**

In `app/src/lib/aggregator/index.ts`, add:
```ts
export { buildTechPaths } from './buildTechPaths';
export type { FactionTechPath, TechPathSummary, TechPathEntry } from './buildTechPaths';
```

Read `app/src/features/meta-dashboard/MetaContext.tsx`. Add `buildTechPaths`, `TechPathSummary` to imports. Add `techPaths: TechPathSummary | null` to MetaState, `null` to initialState, and `techPaths: buildTechPaths(games)` to the `next` object.

- [ ] **Step 5: Add tech paths section to `TechSection.tsx`**

Read `app/src/features/meta-dashboard/TechSection.tsx`. Add `techPaths` to the destructure from `useMetaContext()`. Add a "Research Openings" section at the bottom of the component:

```tsx
      {techPaths !== null && techPaths.factions.length > 0 && (
        <>
          <Rule />
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 8 }}>
            Research Openings
          </div>
          {techPaths.factions.map(f => (
            <div key={f.factionId} style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 13, marginBottom: 4 }}>
                {f.factionId} <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-4)' }}>({f.gamesAnalyzed} games)</span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {f.pathByPosition.map(pos => (
                  <div key={pos.position} style={{ minWidth: 80 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', color: 'var(--ink-4)', marginBottom: 2 }}>
                      #{pos.position}
                    </div>
                    {pos.topTechs.map(t => (
                      <div key={t.tech} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <TechPip color={t.color} size={6} />
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px' }}>
                          {t.tech} <span style={{ color: 'var(--ink-4)' }}>×{t.count}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
```

Note: `TechPip` is already imported from shared in this file (added in Phase 5c Task 1).

- [ ] **Step 6: Typecheck + full suite**

```
cd "D:/_TI4 App/app" && npm run typecheck && npm test
```

Expected: no errors, all tests pass.

- [ ] **Step 7: Commit**

```bash
cd "D:/_TI4 App/app" && git add src/lib/aggregator/buildTechPaths.ts src/lib/aggregator/buildTechPaths.test.ts src/lib/aggregator/index.ts src/features/meta-dashboard/MetaContext.tsx src/features/meta-dashboard/TechSection.tsx && git commit -m "feat: tech research opening paths in MetaDashboard Techs"
```

---

## Self-Review

### Spec Coverage

| Requirement | Task |
|---|---|
| Round-by-round score snapshots in RecapSection | Task 1 |
| Speaker order correlation (MetaDashboard Stats) | Task 2 |
| Scoring pace curve (MetaDashboard) | Task 3 |
| Relic performance tracking | Task 4 |
| Dedicated `/agenda` route | Task 5 |
| Tech path analysis | Task 6 |

### Placeholder Scan

No TBD or TODO present. All code blocks are complete.

### Type Consistency

- `RoundScoreRow.scores` is `Record<string, number>` — accessed with `row.scores[s.factionId] ?? 0` throughout (noUncheckedIndexedAccess satisfied).
- `ScoringPacePoint.t` is 0–1 float; `toFixed(1)` in SVG is safe — not used on `t`.
- `buildSpeakerStats` — `byRound[r]` access: `r` comes from `Object.keys(byRound).map(Number)`, so the key always exists; still typed as `string | undefined` under noUncheckedIndexedAccess — use `byRound[r] === game.winner` (undefined !== winner so it's safe).
- `buildTechPaths` — `researched[i]?.tech` correctly handles the optional access.
- MetaContext new fields are all nullable (`T | null`) matching the existing pattern.

### Existing Test Impact

| Area | Impact |
|---|---|
| RecapSection | No existing tests cover the standings strip; new lib has 5 new tests |
| MetaContext | No unit tests; adding fields doesn't break anything |
| StatsSection | No unit tests; new sections guarded by null-checks |
| buildSpeakerStats | 5 new tests |
| buildScoringPace | 5 new tests |
| buildRelicStats | 4 new tests |
| buildAgendaStats | 6 new tests |
| buildTechPaths | 5 new tests |

Total new tests: ~30.
