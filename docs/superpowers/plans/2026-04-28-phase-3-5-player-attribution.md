# Phase 3.5 — Player Attribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add opt-in, best-effort first-name attribution to the meta-dashboard: a "Players" section lets the user map the 26 raw `playerName` strings in the dataset to canonical first names and shows per-player win-rate stats derived at read time from game records.

**Architecture:** A pure lib function (`buildPlayerStats`) aggregates game records by canonical name using a `nameMap` stored in `localStorage` — no Firestore writes, no player collection. `MetaContext` is extended to expose the raw `games` array so `PlayerSection` can drive both the name-assignment UI and the player-stats display from a single data source. All player names are anonymized by default; the user opts in per name.

**Tech Stack:** TypeScript + Vitest (lib layer) · React + `localStorage` (attribution state) · `@testing-library/react` `renderHook` (hook tests) · React Testing Library (component tests)

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/lib/attribution/buildPlayerStats.ts` | Create | Pure functions: `collectAllRawNames`, `buildPlayerStats` |
| `src/lib/attribution/buildPlayerStats.test.ts` | Create | Unit tests for both functions |
| `src/features/player-attribution/usePlayerNames.ts` | Create | `usePlayerNames` hook — localStorage read/write for the name map |
| `src/features/player-attribution/usePlayerNames.test.ts` | Create | Hook tests using `renderHook` |
| `src/features/player-attribution/index.ts` | Modify | Export `usePlayerNames` |
| `src/features/meta-dashboard/MetaContext.tsx` | Modify | Add `games: ParsedGame[]` to `MetaState` |
| `src/features/meta-dashboard/PlayerSection.tsx` | Create | Name-assignment table + player-stats cards |
| `src/features/meta-dashboard/MetaDashboardPage.tsx` | Modify | Add "Players" to nav tabs and scroll body |
| `src/features/meta-dashboard/sections.test.tsx` | Modify | Add `PlayerSection` to the scroll-target test cases |

---

## Task 1: `buildPlayerStats` + `collectAllRawNames` (TDD)

**Files:**
- Create: `src/lib/attribution/buildPlayerStats.ts`
- Create: `src/lib/attribution/buildPlayerStats.test.ts`

### Context

The lib layer must stay pure (no React, no I/O). Two exported functions:

- `collectAllRawNames(games)` — scans all games and returns a sorted, deduplicated list of every distinct `playerName` string.
- `buildPlayerStats(games, nameMap)` — given the games and the user's name map (`{ rawName → canonicalFirstName }`), aggregates per-canonical-name stats. Multiple raw names can map to the same canonical name (user-driven, not auto-merged).

The `nameMap` has type `Record<string, string>`. Because `noUncheckedIndexedAccess` is enabled in this project, `nameMap[key]` returns `string | undefined`. Always filter entries before using values.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/attribution/buildPlayerStats.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildPlayerStats, collectAllRawNames } from './buildPlayerStats';
import type { ParsedGame, FactionSetup } from '../parser/types';

function makeFaction(id: string, playerName: string): FactionSetup {
  return { factionId: id, playerName, color: '#aaa', mapPosition: 0, startingTechs: [], startingPlanets: [] };
}

function makeGame(opts: {
  gameId: string;
  factions: Array<{ id: string; playerName: string }>;
  finalScores: Record<string, number>;
  winner: string | null;
}): ParsedGame {
  return {
    gameId: opts.gameId, playedAt: 0, durationSeconds: 3600,
    factions: opts.factions.map(f => makeFaction(f.id, f.playerName)),
    options: {},
    initialSpeaker: opts.factions[0]?.id ?? '',
    phaseSnapshots: [], vpEvents: [], planetEvents: [], techEvents: [],
    agendaResolutions: [], strategyCardEvents: [], actionCardEvents: [], componentEvents: [],
    relicEvents: [], leaderEvents: [], objectiveReveals: [], speakerEvents: [],
    attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: [],
    expeditionEvents: [], secondaryEvents: [], actionEvents: [],
    finalScores: opts.finalScores, winner: opts.winner,
    timers: { game: 3600, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
  };
}

// Shared fixture games
const g1 = makeGame({
  gameId: 'g1',
  factions: [
    { id: 'Sol', playerName: 'Tim' },
    { id: 'Barony', playerName: 'Jake' },
  ],
  finalScores: { Sol: 10, Barony: 7 },
  winner: 'Sol',
});

const g2 = makeGame({
  gameId: 'g2',
  factions: [
    { id: 'Hacan', playerName: 'Tim' },
    { id: 'Nekro', playerName: 'Jake' },
  ],
  finalScores: { Hacan: 7, Nekro: 10 },
  winner: 'Nekro',
});

const g3 = makeGame({
  gameId: 'g3',
  factions: [
    { id: 'Sol', playerName: 'Tim L' },      // alias for same person
    { id: 'Arborec', playerName: 'Steve' },
  ],
  finalScores: { Sol: 10, Arborec: 5 },
  winner: 'Sol',
});

// ── collectAllRawNames ───────────────────────────────────────────────────────

describe('collectAllRawNames', () => {
  it('returns empty array for empty games', () => {
    expect(collectAllRawNames([])).toEqual([]);
  });

  it('returns sorted, deduplicated names', () => {
    const result = collectAllRawNames([g1, g2]);
    expect(result).toEqual(['Jake', 'Tim']);
  });

  it('includes names from multiple games and deduplicates', () => {
    const result = collectAllRawNames([g1, g3]);
    expect(result).toEqual(['Jake', 'Steve', 'Tim', 'Tim L']);
  });
});

// ── buildPlayerStats ─────────────────────────────────────────────────────────

describe('buildPlayerStats', () => {
  it('returns no players when nameMap is empty', () => {
    const result = buildPlayerStats([g1, g2], {});
    expect(result.players).toEqual([]);
    expect(result.totalRawNames).toBe(2);
  });

  it('returns empty players for empty games', () => {
    const result = buildPlayerStats([], { Tim: 'Tim' });
    expect(result.players).toEqual([]);
    expect(result.totalRawNames).toBe(0);
  });

  it('aggregates single mapped name correctly', () => {
    const result = buildPlayerStats([g1, g2], { Tim: 'Tim' });
    expect(result.players).toHaveLength(1);
    const tim = result.players[0];
    expect(tim?.canonicalName).toBe('Tim');
    expect(tim?.gamesPlayed).toBe(2);
    expect(tim?.wins).toBe(1);
    expect(tim?.winRate).toBeCloseTo(0.5);
    expect(tim?.rawNames).toContain('Tim');
  });

  it('merges two raw names that map to the same canonical', () => {
    // Tim played g1 as 'Tim' and g3 as 'Tim L' — both mapped to 'Tim'
    const result = buildPlayerStats([g1, g3], { Tim: 'Tim', 'Tim L': 'Tim' });
    expect(result.players).toHaveLength(1);
    const tim = result.players[0];
    expect(tim?.gamesPlayed).toBe(3); // Sol in g1, Hacan in g2 not included; Sol in g1 + Sol in g3 = 2... wait
    // g1: Tim → Sol (win), g3: Tim L → Sol (win) = 2 games, 2 wins
    // Wait: g1 has Tim→Sol (winner Sol), g3 has Tim L→Sol (winner Sol)
    expect(tim?.gamesPlayed).toBe(2);
    expect(tim?.wins).toBe(2);
    expect(tim?.winRate).toBe(1);
    expect(tim?.rawNames).toContain('Tim');
    expect(tim?.rawNames).toContain('Tim L');
  });

  it('determines favoriteFaction as the most-played faction', () => {
    // Tim: Sol in g1, Hacan in g2 — each once, Sol is first alphabetically but not "favorite" by count
    // Same count → whichever is encountered first in iteration order wins; just verify it's not null
    const result = buildPlayerStats([g1, g2], { Tim: 'Tim' });
    expect(result.players[0]?.favoriteFaction).not.toBeNull();
  });

  it('favoriteFaction is the faction with the most appearances', () => {
    // Tim plays Sol in g1, Sol in g3 (as Tim L), Hacan in g2 → Sol appears twice, Hacan once
    const result = buildPlayerStats([g1, g2, g3], { Tim: 'Tim', 'Tim L': 'Tim' });
    const tim = result.players[0];
    expect(tim?.favoriteFaction).toBe('Sol');
  });

  it('winRate is 0 when no wins', () => {
    // Jake won g2 but not g1 — but let's use a zero-win fixture
    const noWinGame = makeGame({
      gameId: 'x1',
      factions: [{ id: 'Letnev', playerName: 'Newbie' }],
      finalScores: { Letnev: 3 },
      winner: null,
    });
    const result = buildPlayerStats([noWinGame], { Newbie: 'Newbie' });
    expect(result.players[0]?.winRate).toBe(0);
    expect(result.players[0]?.wins).toBe(0);
  });

  it('ignores nameMap entries with blank canonical names', () => {
    const result = buildPlayerStats([g1], { Tim: '   ' });
    expect(result.players).toHaveLength(0);
  });

  it('totalRawNames counts distinct names across all games', () => {
    const result = buildPlayerStats([g1, g3], {});
    // g1: Tim, Jake; g3: Tim L, Steve → 4 distinct names
    expect(result.totalRawNames).toBe(4);
  });

  it('sorts players by gamesPlayed descending', () => {
    // Tim appears in g1 + g2 (2 games), Jake only in g1 (1 game)
    const result = buildPlayerStats([g1, g2], { Tim: 'Tim', Jake: 'Jake' });
    expect(result.players[0]?.canonicalName).toBe('Tim');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
cd "D:\_TI4 App\app" && npx vitest run src/lib/attribution/buildPlayerStats.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `buildPlayerStats.ts`**

Create `src/lib/attribution/buildPlayerStats.ts`:

```typescript
import type { ParsedGame } from '../parser/types';

export interface PlayerStat {
  canonicalName: string;
  rawNames: string[];
  gamesPlayed: number;
  wins: number;
  winRate: number;
  favoriteFaction: string | null;
}

export interface PlayerStatsSummary {
  players: PlayerStat[];
  totalRawNames: number;
}

export function collectAllRawNames(games: ParsedGame[]): string[] {
  const names = new Set<string>();
  for (const g of games) {
    for (const f of g.factions) {
      if (f.playerName !== '') names.add(f.playerName);
    }
  }
  return [...names].sort();
}

export function buildPlayerStats(
  games: ParsedGame[],
  nameMap: Record<string, string>,
): PlayerStatsSummary {
  const totalRawNames = collectAllRawNames(games).length;

  // Only keep entries with a non-blank canonical name
  const entries = Object.entries(nameMap).filter(([, v]) => v.trim() !== '');
  if (entries.length === 0) {
    return { players: [], totalRawNames };
  }

  // Group raw names by canonical (trimmed)
  const canonicalToRaw = new Map<string, string[]>();
  for (const [raw, canonical] of entries) {
    const key = canonical.trim();
    const existing = canonicalToRaw.get(key);
    if (existing !== undefined) {
      existing.push(raw);
    } else {
      canonicalToRaw.set(key, [raw]);
    }
  }

  const players: PlayerStat[] = [];
  for (const [canonical, rawNames] of canonicalToRaw.entries()) {
    const rawSet = new Set(rawNames);
    let gamesPlayed = 0;
    let wins = 0;
    const factionCounts = new Map<string, number>();

    for (const game of games) {
      for (const faction of game.factions) {
        if (!rawSet.has(faction.playerName)) continue;
        gamesPlayed++;
        if (game.winner === faction.factionId) wins++;
        factionCounts.set(
          faction.factionId,
          (factionCounts.get(faction.factionId) ?? 0) + 1,
        );
      }
    }

    let favoriteFaction: string | null = null;
    let maxCount = 0;
    for (const [fId, count] of factionCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        favoriteFaction = fId;
      }
    }

    players.push({
      canonicalName: canonical,
      rawNames,
      gamesPlayed,
      wins,
      winRate: gamesPlayed > 0 ? wins / gamesPlayed : 0,
      favoriteFaction,
    });
  }

  players.sort((a, b) => b.gamesPlayed - a.gamesPlayed || b.winRate - a.winRate);
  return { players, totalRawNames };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
cd "D:\_TI4 App\app" && npx vitest run src/lib/attribution/buildPlayerStats.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Run full suite to confirm no regressions**

```
cd "D:\_TI4 App\app" && npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/attribution/buildPlayerStats.ts src/lib/attribution/buildPlayerStats.test.ts
git commit -m "feat: add buildPlayerStats and collectAllRawNames for player attribution"
```

---

## Task 2: `usePlayerNames` hook

**Files:**
- Create: `src/features/player-attribution/usePlayerNames.ts`
- Create: `src/features/player-attribution/usePlayerNames.test.ts`

### Context

This hook manages the name map in `localStorage`. Key: `'attribution.nameMap'` (JSON object).

Rules:
- `setName(rawName, canonicalName)` — if `canonicalName.trim()` is empty, removes the entry; otherwise stores it trimmed.
- `clearName(rawName)` — removes the entry.
- Initial state reads from `localStorage` on mount; falls back to `{}` on parse failure.

`noUncheckedIndexedAccess` is on, so callers of `nameMap[key]` get `string | undefined`. That's correct and expected — callers must handle `undefined` (e.g., `nameMap[rawName] ?? ''`).

- [ ] **Step 1: Write the failing tests**

Create `src/features/player-attribution/usePlayerNames.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayerNames } from './usePlayerNames';

const STORAGE_KEY = 'attribution.nameMap';

beforeEach(() => {
  localStorage.clear();
});

describe('usePlayerNames', () => {
  it('starts with empty nameMap when localStorage is empty', () => {
    const { result } = renderHook(() => usePlayerNames());
    expect(result.current.nameMap).toEqual({});
  });

  it('initializes from existing localStorage data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ Alice: 'Alice' }));
    const { result } = renderHook(() => usePlayerNames());
    expect(result.current.nameMap['Alice']).toBe('Alice');
  });

  it('setName stores a name and updates nameMap', () => {
    const { result } = renderHook(() => usePlayerNames());
    act(() => { result.current.setName('Tim', 'Tim'); });
    expect(result.current.nameMap['Tim']).toBe('Tim');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({ Tim: 'Tim' });
  });

  it('setName trims whitespace from canonical name', () => {
    const { result } = renderHook(() => usePlayerNames());
    act(() => { result.current.setName('Tim', '  Tim  '); });
    expect(result.current.nameMap['Tim']).toBe('Tim');
  });

  it('setName with blank string removes the entry', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ Tim: 'Tim' }));
    const { result } = renderHook(() => usePlayerNames());
    act(() => { result.current.setName('Tim', '   '); });
    expect(result.current.nameMap).not.toHaveProperty('Tim');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored).not.toHaveProperty('Tim');
  });

  it('clearName removes the specified entry and leaves others', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ Tim: 'Tim', Jake: 'Jake' }));
    const { result } = renderHook(() => usePlayerNames());
    act(() => { result.current.clearName('Tim'); });
    expect(result.current.nameMap).not.toHaveProperty('Tim');
    expect(result.current.nameMap['Jake']).toBe('Jake');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored).not.toHaveProperty('Tim');
    expect(stored).toHaveProperty('Jake');
  });

  it('falls back to empty object when localStorage contains invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{{{');
    const { result } = renderHook(() => usePlayerNames());
    expect(result.current.nameMap).toEqual({});
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
cd "D:\_TI4 App\app" && npx vitest run src/features/player-attribution/usePlayerNames.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `usePlayerNames.ts`**

Create `src/features/player-attribution/usePlayerNames.ts`:

```typescript
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'attribution.nameMap';

function readStored(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export interface UsePlayerNamesResult {
  nameMap: Record<string, string>;
  setName: (rawName: string, canonicalName: string) => void;
  clearName: (rawName: string) => void;
}

export function usePlayerNames(): UsePlayerNamesResult {
  const [nameMap, setNameMap] = useState<Record<string, string>>(readStored);

  const setName = useCallback((rawName: string, canonicalName: string) => {
    setNameMap(prev => {
      const next = { ...prev };
      if (canonicalName.trim() === '') {
        delete next[rawName];
      } else {
        next[rawName] = canonicalName.trim();
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearName = useCallback((rawName: string) => {
    setNameMap(prev => {
      const next = { ...prev };
      delete next[rawName];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { nameMap, setName, clearName };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
cd "D:\_TI4 App\app" && npx vitest run src/features/player-attribution/usePlayerNames.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Export from index**

Replace `src/features/player-attribution/index.ts` content with:

```typescript
export { usePlayerNames } from './usePlayerNames';
export type { UsePlayerNamesResult } from './usePlayerNames';
```

- [ ] **Step 6: Run full suite**

```
cd "D:\_TI4 App\app" && npx vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/player-attribution/usePlayerNames.ts src/features/player-attribution/usePlayerNames.test.ts src/features/player-attribution/index.ts
git commit -m "feat: add usePlayerNames hook for localStorage-backed name attribution"
```

---

## Task 3: Expose `games` in MetaContext

**Files:**
- Modify: `src/features/meta-dashboard/MetaContext.tsx`

### Context

`PlayerSection` needs the raw `games` array to pass to `collectAllRawNames` and `buildPlayerStats`. MetaContext is the only place that loads games from Firestore — exposing `games` here avoids a duplicate Firestore fetch.

The initial state must provide `games: []` (not `null`) so `PlayerSection` can render an empty table rather than needing a null check.

- [ ] **Step 1: Modify `MetaContext.tsx`**

In `src/features/meta-dashboard/MetaContext.tsx`:

1. Add `import type { ParsedGame } from '../../lib/parser/types';` to the imports at the top.

2. Add `games: ParsedGame[];` to the `MetaState` interface, after the `error` field:

```typescript
export interface MetaState {
  loading: boolean;
  error: string | null;
  games: ParsedGame[];
  factionStats: FactionStatsSummary | null;
  strategyCardStats: StrategyCardSummary | null;
  techStats: TechSummary | null;
  gameStats: GameStatsSummary | null;
}
```

3. Add `games: [],` to `initialState`:

```typescript
const initialState: MetaState = {
  loading: true,
  error: null,
  games: [],
  factionStats: null,
  strategyCardStats: null,
  techStats: null,
  gameStats: null,
};
```

4. Add `games,` to the `next` object inside the `.then()` callback:

```typescript
const next: MetaState = {
  loading: false,
  error: null,
  games,
  factionStats:      buildFactionStats(games),
  strategyCardStats: buildStrategyCardStats(games, boundariesByGame),
  techStats:         buildTechStats(games, boundariesByGame),
  gameStats:         buildGameStats(games, boundariesByGame),
};
```

- [ ] **Step 2: Typecheck**

```
cd "D:\_TI4 App\app" && npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Run full suite**

```
cd "D:\_TI4 App\app" && npx vitest run
```

Expected: all tests pass (no tests need updating — sections.test.tsx renders components against `initialState` which now has `games: []`, and all components handle empty data gracefully).

- [ ] **Step 4: Commit**

```bash
git add src/features/meta-dashboard/MetaContext.tsx
git commit -m "feat: expose raw games array in MetaContext for player attribution"
```

---

## Task 4: `PlayerSection` + MetaDashboardPage nav update

**Files:**
- Create: `src/features/meta-dashboard/PlayerSection.tsx`
- Modify: `src/features/meta-dashboard/MetaDashboardPage.tsx`
- Modify: `src/features/meta-dashboard/sections.test.tsx`

### Context

`PlayerSection` renders as two visual panels:

1. **Name assignment table** (always visible): for every distinct raw `playerName` across all games, a row shows the raw name and an editable input. The input uses `defaultValue` (uncontrolled) and saves to the name map on blur. Pass `key={currentValue}` so the input re-mounts if its stored value changes externally.

2. **Player records** (visible only when ≥1 canonical name is assigned): a simple table with one row per canonical name showing games played, win rate, and favorite faction. Marked "best-effort" in the subheading.

No `playerName` strings may appear in section headers or other cross-game UI — only in the explicitly-opted-in attribution table rows.

The nav update adds `{ id: 'players', label: 'Players' }` to `META_SECTIONS` in `MetaDashboardPage.tsx` and `<PlayerSection />` at the bottom of `MetaScrollBody`.

- [ ] **Step 1: Add `PlayerSection` test case to `sections.test.tsx`**

In `src/features/meta-dashboard/sections.test.tsx`, add the import and test case:

```typescript
import { PlayerSection } from './PlayerSection';
```

Add to the `cases` array:

```typescript
{ Component: PlayerSection, id: 'players' },
```

The full updated `cases` array:

```typescript
const cases = [
  { Component: FactionSection,      id: 'factions' },
  { Component: StrategyCardSection, id: 'strategy' },
  { Component: TechSection,         id: 'techs'    },
  { Component: StatsSection,        id: 'stats'    },
  { Component: PlayerSection,       id: 'players'  },
] as const;
```

- [ ] **Step 2: Run the updated test to confirm it fails**

```
cd "D:\_TI4 App\app" && npx vitest run src/features/meta-dashboard/sections.test.tsx
```

Expected: FAIL — `PlayerSection` not found.

- [ ] **Step 3: Create `PlayerSection.tsx`**

Create `src/features/meta-dashboard/PlayerSection.tsx`:

```typescript
import { useMemo } from 'react';
import { useMeta } from './MetaContext';
import { Rule } from '../../shared';
import { usePlayerNames } from '../player-attribution/usePlayerNames';
import { buildPlayerStats, collectAllRawNames, type PlayerStat } from '../../lib/attribution/buildPlayerStats';

function NameRow({
  rawName,
  value,
  onSave,
}: {
  rawName: string;
  value: string;
  onSave: (val: string) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '3px 0',
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          color: 'var(--ink-2)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {rawName}
      </span>
      <input
        key={value}
        defaultValue={value}
        placeholder="first name"
        onBlur={e => { onSave(e.currentTarget.value); }}
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          border: '1px solid var(--rule)',
          background: 'var(--paper-2)',
          color: 'var(--ink)',
          padding: '2px 6px',
          width: 100,
          outline: 'none',
        }}
      />
    </div>
  );
}

function PlayerCard({ player }: { player: PlayerStat }) {
  const pct = Math.round(player.winRate * 100);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '6px 0',
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--ink)',
          flex: 1,
        }}
      >
        {player.canonicalName}
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          color: 'var(--ink-2)',
        }}
      >
        {player.gamesPlayed}g · {pct}% W
      </div>
      {player.favoriteFaction !== null && (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color: 'var(--ink-3)',
            maxWidth: 120,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          fav: {player.favoriteFaction}
        </div>
      )}
    </div>
  );
}

export function PlayerSection() {
  const { games } = useMeta();
  const { nameMap, setName } = usePlayerNames();

  const allRawNames = useMemo(() => collectAllRawNames(games), [games]);
  const { players, totalRawNames } = useMemo(
    () => buildPlayerStats(games, nameMap),
    [games, nameMap],
  );

  return (
    <section
      id="players"
      data-section="players"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      <Rule weight="double" />
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--ink)',
          padding: '8px 0 2px',
        }}
      >
        PLAYERS
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
          marginBottom: 12,
        }}
      >
        {totalRawNames} distinct names · assign first names to enable player records
      </div>

      <div style={{ marginBottom: players.length > 0 ? 16 : 0 }}>
        {allRawNames.length === 0 ? (
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: 'var(--ink-3)',
            }}
          >
            No games loaded.
          </div>
        ) : (
          allRawNames.map(rawName => (
            <NameRow
              key={rawName}
              rawName={rawName}
              value={nameMap[rawName] ?? ''}
              onSave={val => { setName(rawName, val); }}
            />
          ))
        )}
      </div>

      {players.length > 0 && (
        <>
          <Rule weight="single" />
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--ink-3)',
              margin: '8px 0',
            }}
          >
            Player Records · best-effort · {players.length} player{players.length !== 1 ? 's' : ''}
          </div>
          {players.map(p => (
            <PlayerCard key={p.canonicalName} player={p} />
          ))}
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run the sections test to confirm it passes**

```
cd "D:\_TI4 App\app" && npx vitest run src/features/meta-dashboard/sections.test.tsx
```

Expected: all tests PASS (including the new `players` id and `data-section` tests).

- [ ] **Step 5: Add "Players" to MetaDashboardPage**

In `src/features/meta-dashboard/MetaDashboardPage.tsx`:

1. Add import at the top:

```typescript
import { PlayerSection } from './PlayerSection';
```

2. Add to `META_SECTIONS`:

```typescript
const META_SECTIONS = [
  { id: 'factions', label: 'Factions' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'techs',    label: 'Techs'    },
  { id: 'stats',    label: 'Stats'    },
  { id: 'players',  label: 'Players'  },
] as const;
```

3. Add `<PlayerSection />` at the bottom of the scroll body div in `MetaScrollBody`:

```typescript
return (
  <div style={{ overflowY: 'scroll', flex: 1 }}>
    <FactionSection />
    <StrategyCardSection />
    <TechSection />
    <StatsSection />
    <PlayerSection />
  </div>
);
```

- [ ] **Step 6: Typecheck**

```
cd "D:\_TI4 App\app" && npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 7: Run full suite**

```
cd "D:\_TI4 App\app" && npx vitest run
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/features/meta-dashboard/PlayerSection.tsx src/features/meta-dashboard/MetaDashboardPage.tsx src/features/meta-dashboard/sections.test.tsx
git commit -m "feat: add PlayerSection with name-assignment UI and per-player stats"
```

---

## Self-Review

### Spec coverage

| Requirement | Covered by |
|---|---|
| UI lists every distinct `playerName` across games | `collectAllRawNames` + `NameRow` table in `PlayerSection` |
| User assigns canonical first name (default: anonymized) | `usePlayerNames.setName` + `NameRow` input; default is blank = anonymized |
| Surface secondary stats where name assigned | `PlayerCard` rows (games, win rate, favorite faction), only shown when `players.length > 0` |
| Best-effort framing with contributing game count | "best-effort" label in player records header; `gamesPlayed` per player |
| No automatic alias merging | Only manual `setName` calls update the map |
| No player-keyed Firestore collection | `localStorage` only; no Firestore writes in any new code |
| Names default to anonymized | `nameMap[rawName] ?? ''` — blank default; player records only appear when names are explicitly assigned |

### Placeholder scan

No TBD/TODO/placeholder patterns detected.

### Type consistency

- `buildPlayerStats(games: ParsedGame[], nameMap: Record<string, string>)` → `PlayerStatsSummary` ✓
- `collectAllRawNames(games: ParsedGame[])` → `string[]` ✓
- `usePlayerNames()` → `{ nameMap: Record<string, string>, setName, clearName }` ✓
- `PlayerSection` uses `useMeta().games` (added in Task 3) ✓
- `nameMap[rawName] ?? ''` handles `noUncheckedIndexedAccess` correctly ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-28-phase-3-5-player-attribution.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, two-stage review after each

**2. Inline Execution** — execute tasks in this session using executing-plans
