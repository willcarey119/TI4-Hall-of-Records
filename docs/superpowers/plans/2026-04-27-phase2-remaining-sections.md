# Phase 2 Remaining Sections — VP Race, Planets, Dashboard, Timeline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four stub sections (VP Race, Planets, Dashboard, Timeline) in the game-detail page with real content, completing the single-game replay view for Phase 2.

**Architecture:** Each section follows the established pattern: a pure function in `src/lib/<domain>/` transforms `ParsedGame` data into a display-ready summary (TDD, ≥90% coverage), then a React component in `src/features/game-detail/` renders it using `useGame()` + `useMemo()`. Charts use inline SVG. No new dependencies.

**Tech Stack:** React 18 · TypeScript strict (`noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`) · Vitest + React Testing Library · Inline SVG · CSS custom properties: `var(--paper)`, `var(--paper-2)`, `var(--ink)`, `var(--ink-2)`, `var(--ink-3)`, `var(--ink-4)`, `var(--accent)`, `var(--cool)`, `var(--moss)`, `var(--gold)`, `var(--rule)`

---

## Key context — read before starting any task

### Component pattern (copy from existing sections)

```tsx
import { useMemo } from 'react';
import { useGame } from './GameContext';
import { Label, Rule } from '../../shared';

export function XSection() {
  const game = useGame();
  const summary = useMemo(
    () => (game !== null ? buildX(game.field) : null),
    [game],
  );
  if (game === null || summary === null) return null;
  return (
    <section id="x" data-section="x" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}>
      {/* content */}
    </section>
  );
}
```

### Kicker pattern (inline, not using the shared `<Kicker>` component)

```tsx
<div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--rule)', paddingBottom: 3, marginBottom: 6 }}>
  <span>Section Name · This Game</span>
  <span>stat summary</span>
</div>
```

### Headline + Deck pattern

```tsx
<div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 22, fontWeight: 800, fontStyle: 'italic', lineHeight: 1.1, margin: '4px 0 2px' }}>
  The headline.
</div>
<div style={{ fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
  Deck text here.
</div>
<hr style={{ border: 'none', borderTop: '3px double var(--rule)', margin: '6px 0' }} />
```

### Available data in `ParsedGame`

- `vpEvents: VpEvent[]` — `{ faction, objective, points, timestamp, source }`
- `planetEvents: PlanetEvent[]` — `{ faction, planet, prevOwner: string|null, timestamp, type: 'claim'|'unclaim' }`
- `techEvents: TechEvent[]` — `{ faction, tech, timestamp, type: 'research'|'starting'|'remove'|'purge' }`
- `agendaResolutions: AgendaResolution[]` — `{ agenda, outcome, round, timestamp, votes[], riders[] }`
- `objectiveReveals: ObjectiveReveal[]` — `{ objective, stage: 'I'|'II', round, timestamp }`
- `strategyCardEvents: StrategyCardEvent[]` — `{ faction, card, timestamp, type: 'pick'|'play_primary'|'play_secondary'|'pass_secondary' }`
- `factions: FactionSetup[]` — `{ factionId, playerName, color, mapPosition, startingTechs, startingPlanets }`
- `finalScores: Record<string, number>` — keyed on `factionId`
- `options: Record<string, unknown>` — `options['victoryPoints']` is `10 | 12 | 14`
- `durationSeconds: number` — total game seconds

All event arrays are sorted ascending by `timestamp`.

### Type safety reminders

- `Record<string, T>` indexing yields `T | undefined` due to `noUncheckedIndexedAccess`. Use `?? default` or explicit checks.
- Optional object fields (`foo?: string`) cannot be set to `undefined` explicitly due to `exactOptionalPropertyTypes`. Use conditional spread: `...(cond ? { foo: val } : {})`.
- Never use `as` to lie to the compiler. Use type guards or runtime checks instead.

### Test runner command

From `app/`:
```bash
npm run typecheck && npm run lint && npm test && npm run build
```

---

## Files created

| File | Purpose |
|---|---|
| `app/src/lib/vp/buildVpTimeline.ts` | Pure fn: per-faction cumulative VP series |
| `app/src/lib/vp/buildVpTimeline.test.ts` | Tests |
| `app/src/lib/planets/buildPlanetSummary.ts` | Pure fn: final planet ownership per faction |
| `app/src/lib/planets/buildPlanetSummary.test.ts` | Tests |
| `app/src/lib/dashboard/buildDashboardSummary.ts` | Pure fn: per-faction final state |
| `app/src/lib/dashboard/buildDashboardSummary.test.ts` | Tests |
| `app/src/lib/timeline/buildTimelineFeed.ts` | Pure fn: key events in chronological order |
| `app/src/lib/timeline/buildTimelineFeed.test.ts` | Tests |

## Files modified

| File | Change |
|---|---|
| `app/src/features/game-detail/VpRaceSection.tsx` | Replace stub with SVG slope chart |
| `app/src/features/game-detail/PlanetsSection.tsx` | Replace stub with planet control ledger |
| `app/src/features/game-detail/DashboardSection.tsx` | Replace stub with faction dossier cards |
| `app/src/features/game-detail/TimelineSection.tsx` | Replace stub with chronological event feed |

---

## Task 1: `buildVpTimeline` pure function

**Files:**
- Create: `app/src/lib/vp/buildVpTimeline.ts`
- Create: `app/src/lib/vp/buildVpTimeline.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `app/src/lib/vp/buildVpTimeline.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildVpTimeline } from './buildVpTimeline';
import type { VpEvent, FactionSetup } from '../parser/types';

function makeFaction(id: string, pos: number, color = '#aaa'): FactionSetup {
  return { factionId: id, playerName: 'Player', color, mapPosition: pos, startingTechs: [], startingPlanets: [] };
}

function makeVpEvent(faction: string, points: number, timestamp: number): VpEvent {
  return { faction, objective: 'Test Obj', points, timestamp, source: 'objective' };
}

const FACTIONS = [makeFaction('Sol', 0, 'blue'), makeFaction('Hacan', 1, 'gold')];
const SCORES: Record<string, number> = { Sol: 7, Hacan: 10 };
const OPTIONS: Record<string, unknown> = { victoryPoints: 10 };

describe('buildVpTimeline', () => {
  it('returns one series entry per faction', () => {
    const result = buildVpTimeline([], FACTIONS, SCORES, OPTIONS, 3600);
    expect(result.series).toHaveLength(2);
  });

  it('every series starts at cumulativeVp 0', () => {
    const result = buildVpTimeline([], FACTIONS, SCORES, OPTIONS, 3600);
    for (const s of result.series) {
      expect(s.points[0]?.cumulativeVp).toBe(0);
    }
  });

  it('reads victoryPoints from options, defaulting to 10', () => {
    expect(buildVpTimeline([], FACTIONS, SCORES, {}, 3600).victoryPoints).toBe(10);
    expect(buildVpTimeline([], FACTIONS, SCORES, { victoryPoints: 14 }, 3600).victoryPoints).toBe(14);
  });

  it('builds cumulative VP series from events in order', () => {
    const events = [
      makeVpEvent('Sol', 1, 100),
      makeVpEvent('Sol', 2, 200),
      makeVpEvent('Hacan', 3, 300),
    ];
    const result = buildVpTimeline(events, FACTIONS, SCORES, OPTIONS, 3600);
    const sol = result.series.find(s => s.factionId === 'Sol');
    expect(sol?.points.map(p => p.cumulativeVp)).toEqual([0, 1, 3]);
    const hacan = result.series.find(s => s.factionId === 'Hacan');
    expect(hacan?.points.map(p => p.cumulativeVp)).toEqual([0, 3]);
  });

  it('marks the winner (faction at or above victoryPoints in finalScores)', () => {
    const result = buildVpTimeline([], FACTIONS, SCORES, OPTIONS, 3600);
    expect(result.series.find(s => s.factionId === 'Hacan')?.isWinner).toBe(true);
    expect(result.series.find(s => s.factionId === 'Sol')?.isWinner).toBe(false);
  });

  it('series are ordered by faction mapPosition', () => {
    const result = buildVpTimeline([], FACTIONS, SCORES, OPTIONS, 3600);
    expect(result.series[0]?.factionId).toBe('Sol');   // mapPosition 0
    expect(result.series[1]?.factionId).toBe('Hacan'); // mapPosition 1
  });

  it('headline and deckText are non-empty strings', () => {
    const result = buildVpTimeline([], FACTIONS, SCORES, OPTIONS, 3600);
    expect(result.headline.length).toBeGreaterThan(0);
    expect(result.deckText.length).toBeGreaterThan(0);
  });

  it('handles empty inputs without throwing', () => {
    expect(() => buildVpTimeline([], [], {}, {}, 0)).not.toThrow();
  });

  it('gameTimeSeconds on each point is relative to the first event timestamp', () => {
    const events = [makeVpEvent('Sol', 1, 1000), makeVpEvent('Sol', 1, 3000)];
    const result = buildVpTimeline(events, FACTIONS, SCORES, OPTIONS, 3600);
    const sol = result.series.find(s => s.factionId === 'Sol');
    expect(sol?.points[1]?.gameTimeSeconds).toBe(0);     // first event = t0
    expect(sol?.points[2]?.gameTimeSeconds).toBe(2000);  // second event = t0 + 2000
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd app && npx vitest run src/lib/vp/buildVpTimeline.test.ts
```

Expected: FAIL — "Cannot find module './buildVpTimeline'"

- [ ] **Step 3: Implement `buildVpTimeline`**

Create `app/src/lib/vp/buildVpTimeline.ts`:

```typescript
import type { VpEvent, FactionSetup } from '../parser/types';

export interface VpPoint {
  timestamp: number;
  gameTimeSeconds: number;
  cumulativeVp: number;
}

export interface FactionVpSeries {
  factionId: string;
  color: string;
  points: VpPoint[];
  finalVp: number;
  isWinner: boolean;
}

export interface VpTimelineSummary {
  series: FactionVpSeries[];
  victoryPoints: number;
  gameDurationSeconds: number;
  headline: string;
  deckText: string;
}

export function buildVpTimeline(
  vpEvents: VpEvent[],
  factions: FactionSetup[],
  finalScores: Record<string, number>,
  options: Record<string, unknown>,
  gameDurationSeconds: number,
): VpTimelineSummary {
  const victoryPoints = (options['victoryPoints'] as number | undefined) ?? 10;
  const firstTimestamp = vpEvents[0]?.timestamp ?? 0;

  // Initialize running totals and series maps
  const running: Record<string, number> = {};
  const pointsMap: Record<string, VpPoint[]> = {};
  for (const f of factions) {
    running[f.factionId] = 0;
    pointsMap[f.factionId] = [{ timestamp: firstTimestamp, gameTimeSeconds: 0, cumulativeVp: 0 }];
  }

  // Process events in chronological order
  for (const event of vpEvents) {
    const prev = running[event.faction] ?? 0;
    running[event.faction] = prev + event.points;
    const arr = pointsMap[event.faction];
    if (arr !== undefined) {
      arr.push({
        timestamp: event.timestamp,
        gameTimeSeconds: event.timestamp - firstTimestamp,
        cumulativeVp: running[event.faction],
      });
    }
  }

  // Build series ordered by mapPosition
  const series: FactionVpSeries[] = factions
    .slice()
    .sort((a, b) => a.mapPosition - b.mapPosition)
    .map(f => ({
      factionId: f.factionId,
      color: f.color,
      points: pointsMap[f.factionId] ?? [],
      finalVp: finalScores[f.factionId] ?? 0,
      isWinner: (finalScores[f.factionId] ?? 0) >= victoryPoints,
    }));

  // Editorial text — winner or leader
  const winner = series.find(s => s.isWinner);
  const leader = [...series].sort((a, b) => b.finalVp - a.finalVp)[0];
  const hours = Math.round((gameDurationSeconds / 3600) * 10) / 10;

  const headline = winner !== undefined
    ? `${winner.factionId} wins.`
    : 'The race is unfinished.';

  const deckText = leader !== undefined
    ? `${leader.factionId} led with ${leader.finalVp} VP over ${hours}h.`
    : `${series.length} factions competed over ${hours}h.`;

  return { series, victoryPoints, gameDurationSeconds, headline, deckText };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd app && npx vitest run src/lib/vp/buildVpTimeline.test.ts
```

Expected: 9 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/vp/buildVpTimeline.ts app/src/lib/vp/buildVpTimeline.test.ts
git commit -m "feat: add buildVpTimeline pure function"
```

---

## Task 2: `VpRaceSection` component

**Files:**
- Modify: `app/src/features/game-detail/VpRaceSection.tsx` (replace stub)

- [ ] **Step 1: Write the failing component test**

This section's id/data-section is already covered by `sections.test.tsx`. Run the existing test to confirm it still passes after replacing the stub:

```bash
cd app && npx vitest run src/features/game-detail/sections.test.tsx
```

Expected: PASS (id and data-section tests cover `vp-race`).

- [ ] **Step 2: Replace stub with full implementation**

Replace `app/src/features/game-detail/VpRaceSection.tsx` entirely:

```tsx
import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildVpTimeline, type FactionVpSeries, type VpTimelineSummary } from '../../lib/vp/buildVpTimeline';
import { Rule } from '../../shared';
import { formatDuration } from '../../shared/formatters';

const W = 400;
const H = 200;
const PX = 28; // left padding for VP labels
const PY = 14; // top/bottom padding

function xScale(gameTimeSeconds: number, gameDurationSeconds: number): number {
  return PX + (gameTimeSeconds / Math.max(gameDurationSeconds, 1)) * (W - PX - 6);
}

function yScale(vp: number, victoryPoints: number): number {
  return H - PY - (vp / (victoryPoints + 1)) * (H - PY * 2);
}

function SlopeChart({ summary }: { summary: VpTimelineSummary }) {
  const { series, victoryPoints, gameDurationSeconds } = summary;

  const gridVps = Array.from(
    { length: Math.floor(victoryPoints / 2) },
    (_, i) => (i + 1) * 2,
  ).filter(v => v <= victoryPoints);

  // Format x-axis time labels at 0%, 25%, 50%, 75%, 100%
  const timeLabels = [0, 0.25, 0.5, 0.75, 1].map(frac => ({
    x: xScale(frac * gameDurationSeconds, gameDurationSeconds),
    label: formatDuration(Math.round(frac * gameDurationSeconds)),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {/* Horizontal VP gridlines */}
      {gridVps.map(v => (
        <g key={v}>
          <line
            x1={PX} y1={yScale(v, victoryPoints)}
            x2={W - 6} y2={yScale(v, victoryPoints)}
            stroke="var(--ink-4)" strokeWidth={0.5} strokeDasharray="2 3"
          />
          <text
            x={PX - 4} y={yScale(v, victoryPoints) + 3}
            textAnchor="end"
            fontFamily="'IBM Plex Mono', monospace" fontSize={7}
            fill="var(--ink-3)"
          >
            {v}
          </text>
        </g>
      ))}

      {/* Victory line */}
      <line
        x1={PX} y1={yScale(victoryPoints, victoryPoints)}
        x2={W - 6} y2={yScale(victoryPoints, victoryPoints)}
        stroke="var(--accent)" strokeWidth={1}
      />
      <text
        x={W - 6} y={yScale(victoryPoints, victoryPoints) - 3}
        textAnchor="end"
        fontFamily="'IBM Plex Mono', monospace" fontSize={7}
        fill="var(--accent)"
      >
        VICTORY · {victoryPoints}
      </text>

      {/* X-axis time labels */}
      {timeLabels.map((tick, i) => (
        <text
          key={i} x={tick.x} y={H - 2}
          textAnchor="middle"
          fontFamily="'IBM Plex Mono', monospace" fontSize={7}
          fill="var(--ink-4)"
        >
          {tick.label}
        </text>
      ))}

      {/* Faction paths */}
      {series.map(s => <FactionPath key={s.factionId} s={s} summary={summary} />)}
    </svg>
  );
}

function FactionPath({ s, summary }: { s: FactionVpSeries; summary: VpTimelineSummary }) {
  const { victoryPoints, gameDurationSeconds } = summary;
  if (s.points.length < 2) return null;

  const pathD = s.points
    .map((p, i) => {
      const x = xScale(p.gameTimeSeconds, gameDurationSeconds);
      const y = yScale(p.cumulativeVp, victoryPoints);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const stroke = s.isWinner ? 'var(--accent)' : 'var(--ink-3)';
  const sw = s.isWinner ? 2 : 1;
  const lastPt = s.points[s.points.length - 1];

  return (
    <g>
      <path
        d={pathD} fill="none"
        stroke={stroke} strokeWidth={sw}
        strokeLinejoin="round" strokeLinecap="round"
      />
      {lastPt !== undefined && (
        <text
          x={xScale(lastPt.gameTimeSeconds, gameDurationSeconds) + 4}
          y={yScale(lastPt.cumulativeVp, victoryPoints) + 3}
          fontFamily="'Newsreader', Georgia, serif" fontSize={9} fontWeight={700}
          fill={stroke}
        >
          {s.finalVp}
        </text>
      )}
    </g>
  );
}

export function VpRaceSection() {
  const game = useGame();

  const summary = useMemo(
    () =>
      game !== null
        ? buildVpTimeline(
            game.vpEvents,
            game.factions,
            game.finalScores,
            game.options,
            game.durationSeconds,
          )
        : null,
    [game],
  );

  if (game === null || summary === null) return null;

  const factionColorMap = Object.fromEntries(
    game.factions.map(f => [f.factionId, f.color]),
  );

  return (
    <section
      id="vp-race"
      data-section="vp-race"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      {/* Kicker */}
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--rule)',
          paddingBottom: 3,
          marginBottom: 6,
        }}
      >
        <span>VP Race · This Game</span>
        <span>To {summary.victoryPoints} · {formatDuration(summary.gameDurationSeconds)}</span>
      </div>

      {/* Headline */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 22,
          fontWeight: 800,
          fontStyle: 'italic',
          lineHeight: 1.1,
          margin: '4px 0 2px',
        }}
      >
        {summary.headline}
      </div>

      {/* Deck */}
      <div style={{ fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
        {summary.deckText}
      </div>

      <hr style={{ border: 'none', borderTop: '3px double var(--rule)', margin: '6px 0' }} />

      {/* SVG slope chart */}
      <SlopeChart summary={summary} />

      <Rule />

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: 4 }}>
        {summary.series.map(s => (
          <div key={s.factionId} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
            <span
              style={{
                width: 16,
                height: s.isWinner ? 3 : 1.5,
                background: s.isWinner ? 'var(--accent)' : 'var(--ink-3)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontWeight: s.isWinner ? 700 : 400,
                color: s.isWinner ? 'var(--accent)' : 'var(--ink-2)',
              }}
            >
              {s.factionId}
            </span>
            <span style={{ color: 'var(--ink-3)', fontSize: 9 }}>{s.finalVp}</span>
            {/* color dot */}
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: factionColorMap[s.factionId] ?? 'var(--ink-4)',
                display: 'inline-block',
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Run tests and typecheck**

```bash
cd app && npm run typecheck && npx vitest run src/features/game-detail/sections.test.tsx
```

Expected: typecheck clean, sections test passes (vp-race id + data-section verified).

- [ ] **Step 4: Commit**

```bash
git add app/src/features/game-detail/VpRaceSection.tsx
git commit -m "feat: add VpRaceSection slope chart"
```

---

## Task 3: `buildPlanetSummary` pure function

**Files:**
- Create: `app/src/lib/planets/buildPlanetSummary.ts`
- Create: `app/src/lib/planets/buildPlanetSummary.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `app/src/lib/planets/buildPlanetSummary.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildPlanetSummary } from './buildPlanetSummary';
import type { PlanetEvent, FactionSetup } from '../parser/types';

function makeFaction(id: string, pos: number): FactionSetup {
  return { factionId: id, playerName: 'P', color: '#aaa', mapPosition: pos, startingTechs: [], startingPlanets: [] };
}

function makeClaim(faction: string, planet: string, ts: number, prevOwner: string | null = null): PlanetEvent {
  return { faction, planet, prevOwner, timestamp: ts, type: 'claim' };
}

function makeUnclaim(faction: string, planet: string, ts: number): PlanetEvent {
  return { faction, planet, prevOwner: faction, timestamp: ts, type: 'unclaim' };
}

const FACTIONS = [makeFaction('Sol', 0), makeFaction('Hacan', 1)];

describe('buildPlanetSummary', () => {
  it('returns empty inventories for empty planet events', () => {
    const result = buildPlanetSummary([], FACTIONS);
    expect(result.inventories).toHaveLength(0);
    expect(result.totalControlled).toBe(0);
  });

  it('assigns planets to the last claiming faction', () => {
    const events = [
      makeClaim('Sol', 'Vefut II', 100),
      makeClaim('Hacan', 'Vefut II', 200, 'Sol'),
    ];
    const result = buildPlanetSummary(events, FACTIONS);
    const hacan = result.inventories.find(inv => inv.factionId === 'Hacan');
    expect(hacan?.planets.some(p => p.planet === 'Vefut II')).toBe(true);
    const sol = result.inventories.find(inv => inv.factionId === 'Sol');
    expect(sol?.planets.some(p => p.planet === 'Vefut II')).toBeFalsy();
  });

  it('unclaimed planets are not assigned to any faction', () => {
    const events = [
      makeClaim('Sol', 'Vefut II', 100),
      makeUnclaim('Sol', 'Vefut II', 200),
    ];
    const result = buildPlanetSummary(events, FACTIONS);
    expect(result.totalControlled).toBe(0);
  });

  it('tracks changeCount for planets that changed hands', () => {
    const events = [
      makeClaim('Sol', 'Mecatol Rex', 100),
      makeClaim('Hacan', 'Mecatol Rex', 200, 'Sol'),
    ];
    const result = buildPlanetSummary(events, FACTIONS);
    const mr = result.mecatol;
    expect(mr?.changeCount).toBeGreaterThanOrEqual(1);
  });

  it('identifies Mecatol Rex separately', () => {
    const events = [makeClaim('Sol', 'Mecatol Rex', 100)];
    const result = buildPlanetSummary(events, FACTIONS);
    expect(result.mecatol).not.toBeNull();
    expect(result.mecatol?.isMecatol).toBe(true);
    expect(result.mecatol?.factionId).toBe('Sol');
  });

  it('mecatol is null when no faction has claimed it', () => {
    const result = buildPlanetSummary([], FACTIONS);
    expect(result.mecatol).toBeNull();
  });

  it('contested planets are those that changed hands 2+ times', () => {
    const events = [
      makeClaim('Sol', 'Vefut II', 100),
      makeClaim('Hacan', 'Vefut II', 200, 'Sol'),
      makeClaim('Sol', 'Vefut II', 300, 'Hacan'),
    ];
    const result = buildPlanetSummary(events, FACTIONS);
    expect(result.contested.some(p => p.planet === 'Vefut II')).toBe(true);
  });

  it('inventories are ordered by mapPosition and exclude factions with 0 planets', () => {
    const events = [makeClaim('Hacan', 'Vefut II', 100)];
    const result = buildPlanetSummary(events, FACTIONS);
    expect(result.inventories).toHaveLength(1);
    expect(result.inventories[0]?.factionId).toBe('Hacan');
  });

  it('deckText is a non-empty string', () => {
    const result = buildPlanetSummary([makeClaim('Sol', 'Vefut II', 100)], FACTIONS);
    expect(result.deckText.length).toBeGreaterThan(0);
  });

  it('handles empty inputs without throwing', () => {
    expect(() => buildPlanetSummary([], [])).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd app && npx vitest run src/lib/planets/buildPlanetSummary.test.ts
```

Expected: FAIL — "Cannot find module './buildPlanetSummary'"

- [ ] **Step 3: Implement `buildPlanetSummary`**

Create `app/src/lib/planets/buildPlanetSummary.ts`:

```typescript
import type { PlanetEvent, FactionSetup } from '../parser/types';

export interface PlanetControlEntry {
  planet: string;
  factionId: string;
  changeCount: number;
  isMecatol: boolean;
}

export interface FactionPlanetInventory {
  factionId: string;
  color: string;
  planets: PlanetControlEntry[];
  totalPlanets: number;
}

export interface PlanetSummary {
  inventories: FactionPlanetInventory[];
  mecatol: PlanetControlEntry | null;
  contested: PlanetControlEntry[];
  totalControlled: number;
  deckText: string;
}

export function buildPlanetSummary(
  planetEvents: PlanetEvent[],
  factions: FactionSetup[],
): PlanetSummary {
  const finalOwner: Record<string, string | null> = {};
  const changeCounts: Record<string, number> = {};

  for (const event of planetEvents) {
    if (event.type === 'claim') {
      // prevOwner not null means it transferred between factions
      if (event.prevOwner !== null) {
        changeCounts[event.planet] = (changeCounts[event.planet] ?? 0) + 1;
      }
      finalOwner[event.planet] = event.faction;
    } else {
      // unclaim — planet returns to neutral
      if (finalOwner[event.planet] !== undefined && finalOwner[event.planet] !== null) {
        changeCounts[event.planet] = (changeCounts[event.planet] ?? 0) + 1;
      }
      finalOwner[event.planet] = null;
    }
  }

  // Bucket planets per faction
  const factionPlanets: Record<string, PlanetControlEntry[]> = {};
  for (const f of factions) {
    factionPlanets[f.factionId] = [];
  }

  for (const [planet, owner] of Object.entries(finalOwner)) {
    if (owner === null) continue;
    const arr = factionPlanets[owner];
    if (arr !== undefined) {
      arr.push({
        planet,
        factionId: owner,
        changeCount: changeCounts[planet] ?? 0,
        isMecatol: planet === 'Mecatol Rex',
      });
    }
  }

  // Sort each faction's list: Mecatol first, then alpha
  for (const arr of Object.values(factionPlanets)) {
    arr.sort((a, b) => {
      if (a.isMecatol) return -1;
      if (b.isMecatol) return 1;
      return a.planet.localeCompare(b.planet);
    });
  }

  // Build inventories ordered by mapPosition, exclude factions with 0 planets
  const inventories: FactionPlanetInventory[] = factions
    .slice()
    .sort((a, b) => a.mapPosition - b.mapPosition)
    .filter(f => (factionPlanets[f.factionId]?.length ?? 0) > 0)
    .map(f => {
      const planets = factionPlanets[f.factionId] ?? [];
      return { factionId: f.factionId, color: f.color, planets, totalPlanets: planets.length };
    });

  const allPlanets = inventories.flatMap(inv => inv.planets);
  const mecatol = allPlanets.find(p => p.isMecatol) ?? null;
  const contested = allPlanets.filter(p => p.changeCount >= 2);
  const totalControlled = allPlanets.length;

  const leader = inventories.reduce<FactionPlanetInventory | undefined>(
    (max, inv) => (max === undefined || inv.totalPlanets > max.totalPlanets ? inv : max),
    undefined,
  );
  const deckText =
    leader !== undefined
      ? `${leader.factionId} controlled the most territory with ${leader.totalPlanets} planets.`
      : `${totalControlled} planets controlled across ${inventories.length} factions.`;

  return { inventories, mecatol, contested, totalControlled, deckText };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd app && npx vitest run src/lib/planets/buildPlanetSummary.test.ts
```

Expected: 10 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/planets/buildPlanetSummary.ts app/src/lib/planets/buildPlanetSummary.test.ts
git commit -m "feat: add buildPlanetSummary pure function"
```

---

## Task 4: `PlanetsSection` component

**Files:**
- Modify: `app/src/features/game-detail/PlanetsSection.tsx` (replace stub)

- [ ] **Step 1: Replace stub with full implementation**

Replace `app/src/features/game-detail/PlanetsSection.tsx` entirely:

```tsx
import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildPlanetSummary } from '../../lib/planets/buildPlanetSummary';
import { Label, Rule } from '../../shared';

function FactionDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    />
  );
}

export function PlanetsSection() {
  const game = useGame();

  const summary = useMemo(
    () => (game !== null ? buildPlanetSummary(game.planetEvents, game.factions) : null),
    [game],
  );

  if (game === null || summary === null) return null;

  const factionColorMap = Object.fromEntries(
    game.factions.map(f => [f.factionId, f.color]),
  );

  const contestedNames = new Set(summary.contested.map(p => p.planet));

  return (
    <section
      id="planets"
      data-section="planets"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      {/* Kicker */}
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--rule)',
          paddingBottom: 3,
          marginBottom: 6,
        }}
      >
        <span>Planet Control · This Game</span>
        <span>
          {summary.totalControlled} controlled
          {summary.contested.length > 0 && ` · ${summary.contested.length} contested`}
        </span>
      </div>

      {/* Headline */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 22,
          fontWeight: 800,
          fontStyle: 'italic',
          lineHeight: 1.1,
          margin: '4px 0 2px',
        }}
      >
        Territory at game end.
      </div>

      {/* Deck */}
      <div style={{ fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
        {summary.deckText}
      </div>

      <hr style={{ border: 'none', borderTop: '3px double var(--rule)', margin: '6px 0' }} />

      {/* Mecatol Rex callout (if claimed) */}
      {summary.mecatol !== null && (
        <>
          <Label>Mecatol Rex</Label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 0 6px',
              fontSize: 11,
            }}
          >
            <FactionDot color={factionColorMap[summary.mecatol.factionId] ?? '#aaa'} />
            <span
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontWeight: 700,
              }}
            >
              {summary.mecatol.factionId}
            </span>
            {summary.mecatol.changeCount >= 1 && (
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 7,
                  background: 'var(--paper-2)',
                  border: '1px solid var(--rule)',
                  padding: '0 4px',
                  color: 'var(--ink-3)',
                }}
              >
                changed hands {summary.mecatol.changeCount}×
              </span>
            )}
          </div>
          <Rule />
        </>
      )}

      {/* Per-faction inventories */}
      <Label>Final Control</Label>
      <div style={{ marginTop: 4 }}>
        {summary.inventories.map((inv, i, arr) => (
          <div key={inv.factionId}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 0 3px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <FactionDot color={inv.color} />
                <span
                  style={{
                    fontFamily: "'Newsreader', Georgia, serif",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {inv.factionId}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 9,
                  color: 'var(--ink-3)',
                }}
              >
                {inv.totalPlanets} planets
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '2px 6px',
                paddingBottom: 4,
                fontSize: 10,
                color: 'var(--ink-2)',
              }}
            >
              {inv.planets
                .filter(p => !p.isMecatol) // Mecatol shown above
                .map(p => (
                  <span
                    key={p.planet}
                    style={{
                      fontFamily: "'Newsreader', Georgia, serif",
                      fontStyle: p.planet === 'Mecatol Rex' ? 'italic' : 'normal',
                      color: contestedNames.has(p.planet) ? 'var(--accent)' : 'var(--ink-2)',
                    }}
                  >
                    {p.planet}
                    {contestedNames.has(p.planet) && (
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, marginLeft: 2, color: 'var(--accent)' }}>
                        ×{p.changeCount}
                      </span>
                    )}
                  </span>
                ))}
            </div>
            {i < arr.length - 1 && <Rule />}
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Run typecheck + sections test**

```bash
cd app && npm run typecheck && npx vitest run src/features/game-detail/sections.test.tsx
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/src/features/game-detail/PlanetsSection.tsx
git commit -m "feat: add PlanetsSection planet control ledger"
```

---

## Task 5: `buildDashboardSummary` pure function

**Files:**
- Create: `app/src/lib/dashboard/buildDashboardSummary.ts`
- Create: `app/src/lib/dashboard/buildDashboardSummary.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `app/src/lib/dashboard/buildDashboardSummary.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildDashboardSummary } from './buildDashboardSummary';
import type { VpEvent, PlanetEvent, TechEvent, FactionSetup } from '../parser/types';

function makeFaction(id: string, pos: number, startingTechs: string[] = []): FactionSetup {
  return { factionId: id, playerName: 'P', color: '#aaa', mapPosition: pos, startingTechs, startingPlanets: [] };
}

function makeVp(faction: string, points: number): VpEvent {
  return { faction, objective: 'Obj', points, timestamp: 100, source: 'objective' };
}

function makePlanetClaim(faction: string, planet: string): PlanetEvent {
  return { faction, planet, prevOwner: null, timestamp: 100, type: 'claim' };
}

function makeTech(faction: string, tech: string, type: TechEvent['type']): TechEvent {
  return { faction, tech, timestamp: 100, type };
}

const FACTIONS = [makeFaction('Sol', 0, ['Neural Motivator']), makeFaction('Hacan', 1)];
const SCORES: Record<string, number> = { Sol: 7, Hacan: 10 };
const OPTIONS: Record<string, unknown> = { victoryPoints: 10 };

describe('buildDashboardSummary', () => {
  it('returns one faction entry per faction', () => {
    const result = buildDashboardSummary([], [], [], FACTIONS, SCORES, OPTIONS);
    expect(result.factions).toHaveLength(2);
  });

  it('factions are sorted by finalVp descending', () => {
    const result = buildDashboardSummary([], [], [], FACTIONS, SCORES, OPTIONS);
    expect(result.factions[0]?.finalVp).toBeGreaterThanOrEqual(result.factions[1]?.finalVp ?? 0);
  });

  it('marks the winner (faction at or above victoryPoints)', () => {
    const result = buildDashboardSummary([], [], [], FACTIONS, SCORES, OPTIONS);
    expect(result.winner).toBe('Hacan');
    expect(result.factions.find(f => f.factionId === 'Hacan')?.isWinner).toBe(true);
    expect(result.factions.find(f => f.factionId === 'Sol')?.isWinner).toBe(false);
  });

  it('includes objectives scored per faction', () => {
    const vpEvents = [makeVp('Sol', 1), makeVp('Sol', 2), makeVp('Hacan', 1)];
    const result = buildDashboardSummary(vpEvents, [], [], FACTIONS, SCORES, OPTIONS);
    expect(result.factions.find(f => f.factionId === 'Sol')?.objectivesScored).toHaveLength(2);
    expect(result.factions.find(f => f.factionId === 'Hacan')?.objectivesScored).toHaveLength(1);
  });

  it('includes only "research" type techs in techsResearched', () => {
    const techEvents = [
      makeTech('Sol', 'Bio-Stims', 'research'),
      makeTech('Sol', 'Neural Motivator', 'starting'),
      makeTech('Sol', 'Spec II', 'remove'),
    ];
    const result = buildDashboardSummary([], [], techEvents, FACTIONS, SCORES, OPTIONS);
    const sol = result.factions.find(f => f.factionId === 'Sol');
    expect(sol?.techsResearched).toHaveLength(1);
    expect(sol?.techsResearched[0]?.tech).toBe('Bio-Stims');
  });

  it('includes startingTechs from FactionSetup', () => {
    const result = buildDashboardSummary([], [], [], FACTIONS, SCORES, OPTIONS);
    const sol = result.factions.find(f => f.factionId === 'Sol');
    expect(sol?.startingTechs[0]?.tech).toBe('Neural Motivator');
  });

  it('counts planets controlled per faction', () => {
    const planetEvents = [
      makePlanetClaim('Sol', 'Vefut II'),
      makePlanetClaim('Sol', 'Mecatol Rex'),
    ];
    const result = buildDashboardSummary([], planetEvents, [], FACTIONS, SCORES, OPTIONS);
    expect(result.factions.find(f => f.factionId === 'Sol')?.planetsControlled).toBe(2);
    expect(result.factions.find(f => f.factionId === 'Hacan')?.planetsControlled).toBe(0);
  });

  it('winner is null when no faction reached victoryPoints', () => {
    const result = buildDashboardSummary([], [], [], FACTIONS, { Sol: 5, Hacan: 8 }, OPTIONS);
    expect(result.winner).toBeNull();
  });

  it('handles empty inputs without throwing', () => {
    expect(() => buildDashboardSummary([], [], [], [], {}, {})).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd app && npx vitest run src/lib/dashboard/buildDashboardSummary.test.ts
```

Expected: FAIL — "Cannot find module './buildDashboardSummary'"

- [ ] **Step 3: Implement `buildDashboardSummary`**

Create `app/src/lib/dashboard/buildDashboardSummary.ts`:

```typescript
import type { VpEvent, PlanetEvent, TechEvent, FactionSetup } from '../parser/types';
import { lookupTechColor } from '../parser/techs';
import type { TechColor } from '../parser/techs';
import type { VpSource } from '../parser/types';

export interface ObjectiveScoredEntry {
  objective: string;
  points: number;
  source: VpSource;
}

export interface TechEntry {
  tech: string;
  color: TechColor;
}

export interface FactionDashboard {
  factionId: string;
  color: string;
  finalVp: number;
  isWinner: boolean;
  objectivesScored: ObjectiveScoredEntry[];
  techsResearched: TechEntry[];
  startingTechs: TechEntry[];
  planetsControlled: number;
}

export interface DashboardSummary {
  factions: FactionDashboard[];  // sorted by finalVp desc
  winner: string | null;         // factionId of winner, or null
  totalVpAwarded: number;
}

export function buildDashboardSummary(
  vpEvents: VpEvent[],
  planetEvents: PlanetEvent[],
  techEvents: TechEvent[],
  factions: FactionSetup[],
  finalScores: Record<string, number>,
  options: Record<string, unknown>,
): DashboardSummary {
  const victoryPoints = (options['victoryPoints'] as number | undefined) ?? 10;

  // Final planet ownership (last event per planet wins)
  const finalPlanetOwner: Record<string, string | null> = {};
  for (const event of planetEvents) {
    finalPlanetOwner[event.planet] =
      event.type === 'claim' ? event.faction : null;
  }
  const planetCounts: Record<string, number> = {};
  for (const owner of Object.values(finalPlanetOwner)) {
    if (owner !== null) {
      planetCounts[owner] = (planetCounts[owner] ?? 0) + 1;
    }
  }

  const factionDashboards: FactionDashboard[] = factions.map(f => {
    const finalVp = finalScores[f.factionId] ?? 0;
    const isWinner = finalVp >= victoryPoints;

    const objectivesScored: ObjectiveScoredEntry[] = vpEvents
      .filter(e => e.faction === f.factionId)
      .map(e => ({ objective: e.objective, points: e.points, source: e.source }));

    const techsResearched: TechEntry[] = techEvents
      .filter(e => e.faction === f.factionId && e.type === 'research')
      .map(e => ({ tech: e.tech, color: lookupTechColor(e.tech) }));

    const startingTechs: TechEntry[] = f.startingTechs.map(t => ({
      tech: t,
      color: lookupTechColor(t),
    }));

    return {
      factionId: f.factionId,
      color: f.color,
      finalVp,
      isWinner,
      objectivesScored,
      techsResearched,
      startingTechs,
      planetsControlled: planetCounts[f.factionId] ?? 0,
    };
  });

  factionDashboards.sort((a, b) => b.finalVp - a.finalVp);

  const winner = factionDashboards.find(d => d.isWinner)?.factionId ?? null;
  const totalVpAwarded = factionDashboards.reduce((sum, d) => sum + d.finalVp, 0);

  return { factions: factionDashboards, winner, totalVpAwarded };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd app && npx vitest run src/lib/dashboard/buildDashboardSummary.test.ts
```

Expected: 9 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/dashboard/buildDashboardSummary.ts app/src/lib/dashboard/buildDashboardSummary.test.ts
git commit -m "feat: add buildDashboardSummary pure function"
```

---

## Task 6: `DashboardSection` component

**Files:**
- Modify: `app/src/features/game-detail/DashboardSection.tsx` (replace stub)

- [ ] **Step 1: Replace stub with full implementation**

Replace `app/src/features/game-detail/DashboardSection.tsx` entirely:

```tsx
import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildDashboardSummary } from '../../lib/dashboard/buildDashboardSummary';
import type { FactionDashboard } from '../../lib/dashboard/buildDashboardSummary';
import type { TechColor } from '../../lib/parser/techs';
import { Label, Rule } from '../../shared';

const COLOR_VAR: Record<TechColor, string> = {
  green:  'var(--moss)',
  blue:   'var(--cool)',
  yellow: 'var(--gold)',
  red:    'var(--accent)',
  unit:   'var(--ink-2)',
};

const SOURCE_LABEL: Record<string, string> = {
  objective: 'OBJ',
  custodians: 'CUST',
  imperial: 'IMP',
  support: 'SUPP',
  relic: 'RELIC',
  agenda: 'AGD',
  rider: 'RIDER',
};

function TechPip({ color }: { color: TechColor }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: COLOR_VAR[color],
        flexShrink: 0,
      }}
    />
  );
}

function FactionDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

function FactionCard({ fd }: { fd: FactionDashboard }) {
  return (
    <div>
      {/* Faction header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '5px 0 3px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <FactionDot color={fd.color} />
          <span
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontWeight: 700,
              fontSize: 12,
              color: fd.isWinner ? 'var(--accent)' : 'var(--ink)',
            }}
          >
            {fd.factionId}
          </span>
          {fd.isWinner && (
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 7,
                background: 'var(--accent)',
                color: 'var(--paper)',
                padding: '0 3px',
                lineHeight: '11px',
                display: 'inline-block',
                height: 11,
              }}
            >
              WINNER
            </span>
          )}
        </div>
        <span
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontWeight: 800,
            fontSize: 18,
            color: fd.isWinner ? 'var(--accent)' : 'var(--ink)',
          }}
        >
          {fd.finalVp} <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)', fontWeight: 400 }}>VP</span>
        </span>
      </div>

      {/* Objectives scored */}
      {fd.objectivesScored.length > 0 && (
        <div style={{ marginBottom: 4 }}>
          <Label>Objectives</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 4px', marginTop: 2 }}>
            {fd.objectivesScored.map((obj, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 7,
                  border: `1px solid ${obj.points >= 2 ? 'var(--ink)' : 'var(--ink-4)'}`,
                  background: obj.points >= 2 ? 'var(--ink)' : 'var(--paper-2)',
                  color: obj.points >= 2 ? 'var(--paper)' : 'var(--ink-2)',
                  padding: '0 3px',
                  lineHeight: '13px',
                  display: 'inline-block',
                  title: obj.objective,
                }}
              >
                {SOURCE_LABEL[obj.source] ?? 'OBJ'} {obj.points > 1 ? `+${obj.points}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Techs */}
      {(fd.techsResearched.length > 0 || fd.startingTechs.length > 0) && (
        <div style={{ marginBottom: 4 }}>
          <Label>Techs</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px', marginTop: 2 }}>
            {fd.startingTechs.map((t, i) => (
              <span key={`s${i}`} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9 }}>
                <TechPip color={t.color} />
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", color: 'var(--ink-3)', fontStyle: 'italic' }}>{t.tech}</span>
              </span>
            ))}
            {fd.techsResearched.map((t, i) => (
              <span key={`r${i}`} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9 }}>
                <TechPip color={t.color} />
                <span style={{ fontFamily: "'Newsreader', Georgia, serif" }}>{t.tech}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Planets count */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'var(--ink-3)' }}>
        {fd.planetsControlled} planet{fd.planetsControlled !== 1 ? 's' : ''} at game end
      </div>
    </div>
  );
}

export function DashboardSection() {
  const game = useGame();

  const summary = useMemo(
    () =>
      game !== null
        ? buildDashboardSummary(
            game.vpEvents,
            game.planetEvents,
            game.techEvents,
            game.factions,
            game.finalScores,
            game.options,
          )
        : null,
    [game],
  );

  if (game === null || summary === null) return null;

  return (
    <section
      id="dashboard"
      data-section="dashboard"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      {/* Kicker */}
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--rule)',
          paddingBottom: 3,
          marginBottom: 6,
        }}
      >
        <span>Player Dossiers · This Game</span>
        <span>{summary.factions.length} factions · {summary.totalVpAwarded} VP total</span>
      </div>

      {/* Headline */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 22,
          fontWeight: 800,
          fontStyle: 'italic',
          lineHeight: 1.1,
          margin: '4px 0 2px',
        }}
      >
        The final standings.
      </div>

      {/* Deck */}
      <div style={{ fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
        {summary.winner !== null
          ? `${summary.winner} claimed victory.`
          : `No faction reached ${(game.options['victoryPoints'] as number | undefined) ?? 10} VP.`}
      </div>

      <hr style={{ border: 'none', borderTop: '3px double var(--rule)', margin: '6px 0' }} />

      {/* Faction cards */}
      {summary.factions.map((fd, i, arr) => (
        <div key={fd.factionId}>
          <FactionCard fd={fd} />
          {i < arr.length - 1 && <Rule />}
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 2: Run typecheck + sections test**

```bash
cd app && npm run typecheck && npx vitest run src/features/game-detail/sections.test.tsx
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/src/features/game-detail/DashboardSection.tsx
git commit -m "feat: add DashboardSection faction dossier cards"
```

---

## Task 7: `buildTimelineFeed` pure function

**Files:**
- Create: `app/src/lib/timeline/buildTimelineFeed.ts`
- Create: `app/src/lib/timeline/buildTimelineFeed.test.ts`

The timeline shows major in-game events in chronological order. It covers four event types: VP scoring, agenda resolutions, objective reveals, and Mecatol Rex claims. Strategy cards and tech events are omitted from this feed (too noisy for a narrative timeline).

- [ ] **Step 1: Write the failing tests**

Create `app/src/lib/timeline/buildTimelineFeed.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildTimelineFeed } from './buildTimelineFeed';
import type { VpEvent, AgendaResolution, ObjectiveReveal, PlanetEvent } from '../parser/types';

function makeVp(faction: string, points: number, ts: number): VpEvent {
  return { faction, objective: 'Pub-I', points, timestamp: ts, source: 'objective' };
}

function makeAgenda(agenda: string, outcome: string, ts: number): AgendaResolution {
  return { agenda, outcome, round: 2, timestamp: ts, votes: [], riders: [] };
}

function makeReveal(objective: string, ts: number): ObjectiveReveal {
  return { objective, stage: 'I', round: 2, timestamp: ts };
}

function makePlanetClaim(faction: string, planet: string, ts: number): PlanetEvent {
  return { faction, planet, prevOwner: null, timestamp: ts, type: 'claim' };
}

describe('buildTimelineFeed', () => {
  it('returns items sorted ascending by timestamp', () => {
    const events = [makeVp('Sol', 1, 300), makeVp('Hacan', 1, 100), makeReveal('Obj', 200)];
    const result = buildTimelineFeed(events, [], [], []);
    const timestamps = result.items.map(i => i.timestamp);
    expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));
  });

  it('VP events produce highlight items', () => {
    const result = buildTimelineFeed([makeVp('Sol', 1, 100)], [], [], []);
    expect(result.items[0]?.isHighlight).toBe(true);
    expect(result.items[0]?.type).toBe('vp');
  });

  it('agenda resolutions produce highlight items', () => {
    const result = buildTimelineFeed([], [makeAgenda('Mining Initiative', 'For', 100)], [], []);
    expect(result.items[0]?.isHighlight).toBe(true);
    expect(result.items[0]?.type).toBe('agenda');
  });

  it('FOR agenda outcome label is PASSED', () => {
    const result = buildTimelineFeed([], [makeAgenda('Mining Initiative', 'For', 100)], [], []);
    expect(result.items[0]?.label).toContain('PASSED');
  });

  it('AGAINST agenda outcome label is failed', () => {
    const result = buildTimelineFeed([], [makeAgenda('Wormhole Recon', 'Against', 100)], [], []);
    expect(result.items[0]?.label).toContain('failed');
  });

  it('elect agenda outcome (non-For/Against string) is treated as PASSED', () => {
    const result = buildTimelineFeed([], [makeAgenda('Imperial Arbiter', 'Sol', 100)], [], []);
    expect(result.items[0]?.label).toContain('PASSED');
  });

  it('objective reveals produce non-highlight items with type "objective"', () => {
    const result = buildTimelineFeed([], [], [makeReveal('Spend 8 Resources', 100)], []);
    expect(result.items[0]?.type).toBe('objective');
    expect(result.items[0]?.isHighlight).toBe(false);
  });

  it('Mecatol Rex claims produce highlight items with type "planet"', () => {
    const result = buildTimelineFeed([], [], [], [makePlanetClaim('Sol', 'Mecatol Rex', 100)]);
    expect(result.items[0]?.type).toBe('planet');
    expect(result.items[0]?.isHighlight).toBe(true);
  });

  it('non-Mecatol planet claims are excluded from the feed', () => {
    const result = buildTimelineFeed([], [], [], [makePlanetClaim('Sol', 'Vefut II', 100)]);
    expect(result.items).toHaveLength(0);
  });

  it('highlightCount matches items with isHighlight true', () => {
    const events = [makeVp('Sol', 1, 100), makeReveal('Obj', 200)];
    const result = buildTimelineFeed(events, [], [], []);
    expect(result.highlightCount).toBe(result.items.filter(i => i.isHighlight).length);
  });

  it('deckText is a non-empty string', () => {
    const result = buildTimelineFeed([makeVp('Sol', 1, 100)], [], [], []);
    expect(result.deckText.length).toBeGreaterThan(0);
  });

  it('handles empty inputs without throwing', () => {
    expect(() => buildTimelineFeed([], [], [], [])).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd app && npx vitest run src/lib/timeline/buildTimelineFeed.test.ts
```

Expected: FAIL — "Cannot find module './buildTimelineFeed'"

- [ ] **Step 3: Implement `buildTimelineFeed`**

Create `app/src/lib/timeline/buildTimelineFeed.ts`:

```typescript
import type { VpEvent, AgendaResolution, ObjectiveReveal, PlanetEvent } from '../parser/types';

export type TimelineEventType = 'vp' | 'agenda' | 'objective' | 'planet';

export interface TimelineFeedItem {
  timestamp: number;
  type: TimelineEventType;
  factionId: string | null;  // null for agenda/objective reveal events
  label: string;
  subLabel: string | null;
  isHighlight: boolean;
}

export interface TimelineSummary {
  items: TimelineFeedItem[];
  highlightCount: number;
  deckText: string;
}

export function buildTimelineFeed(
  vpEvents: VpEvent[],
  agendaResolutions: AgendaResolution[],
  objectiveReveals: ObjectiveReveal[],
  planetEvents: PlanetEvent[],
): TimelineSummary {
  const items: TimelineFeedItem[] = [];

  // VP scoring events — always highlight
  for (const e of vpEvents) {
    items.push({
      timestamp: e.timestamp,
      type: 'vp',
      factionId: e.faction,
      label: `+${e.points} VP — ${e.objective}`,
      subLabel: null,
      isHighlight: true,
    });
  }

  // Agenda resolutions — always highlight
  for (const e of agendaResolutions) {
    // 'For' = passed, 'Against' = failed, anything else = elected candidate = passed
    const passed = e.outcome !== 'Against';
    const totalFor = e.votes
      .filter(v => v.outcome === 'For')
      .reduce((s, v) => s + v.votes, 0);
    const totalAgainst = e.votes
      .filter(v => v.outcome === 'Against')
      .reduce((s, v) => s + v.votes, 0);
    items.push({
      timestamp: e.timestamp,
      type: 'agenda',
      factionId: null,
      label: `${e.agenda} — ${passed ? 'PASSED' : 'failed'}`,
      subLabel: totalFor + totalAgainst > 0 ? `${totalFor} for · ${totalAgainst} against` : null,
      isHighlight: true,
    });
  }

  // Objective reveals — not highlight (informational)
  for (const e of objectiveReveals) {
    items.push({
      timestamp: e.timestamp,
      type: 'objective',
      factionId: null,
      label: `Revealed: ${e.objective}`,
      subLabel: `Stage ${e.stage} · Round ${e.round}`,
      isHighlight: false,
    });
  }

  // Planet events — only Mecatol Rex claims (highlight)
  for (const e of planetEvents) {
    if (e.planet !== 'Mecatol Rex') continue;
    if (e.type !== 'claim') continue;
    items.push({
      timestamp: e.timestamp,
      type: 'planet',
      factionId: e.faction,
      label: `${e.faction} claimed Mecatol Rex`,
      subLabel: null,
      isHighlight: true,
    });
  }

  // Sort ascending by timestamp
  items.sort((a, b) => a.timestamp - b.timestamp);

  const highlightCount = items.filter(i => i.isHighlight).length;

  const vpCount = vpEvents.length;
  const agendaCount = agendaResolutions.length;
  const deckText =
    items.length > 0
      ? `${vpCount} VP events · ${agendaCount} agendas · ${items.length} total entries`
      : 'No events recorded.';

  return { items, highlightCount, deckText };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd app && npx vitest run src/lib/timeline/buildTimelineFeed.test.ts
```

Expected: 12 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/timeline/buildTimelineFeed.ts app/src/lib/timeline/buildTimelineFeed.test.ts
git commit -m "feat: add buildTimelineFeed pure function"
```

---

## Task 8: `TimelineSection` component

**Files:**
- Modify: `app/src/features/game-detail/TimelineSection.tsx` (replace stub)

- [ ] **Step 1: Replace stub with full implementation**

Replace `app/src/features/game-detail/TimelineSection.tsx` entirely:

```tsx
import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildTimelineFeed, type TimelineFeedItem } from '../../lib/timeline/buildTimelineFeed';
import { Rule } from '../../shared';

/** Format a raw timestamp (ms since epoch) as relative game time h:mm */
function formatGameTime(timestamp: number, firstTimestamp: number): string {
  const secs = Math.max(0, Math.floor((timestamp - firstTimestamp) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function FactionDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

const TYPE_ICON: Record<string, string> = {
  vp: '✦',
  agenda: '⚖',
  objective: '◆',
  planet: '⌖',
};

function FeedItem({
  item,
  factionColorMap,
  firstTimestamp,
}: {
  item: TimelineFeedItem;
  factionColorMap: Record<string, string>;
  firstTimestamp: number;
}) {
  const timeLabel = formatGameTime(item.timestamp, firstTimestamp);
  const color = item.isHighlight ? 'var(--ink)' : 'var(--ink-3)';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 10px 1fr',
        gap: 5,
        alignItems: 'flex-start',
        padding: '4px 0',
        borderBottom: '1px dotted var(--ink-4)',
      }}
    >
      {/* Time */}
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          color: 'var(--ink-4)',
          paddingTop: 1,
        }}
      >
        {timeLabel}
      </span>

      {/* Icon or faction dot */}
      {item.factionId !== null ? (
        <FactionDot color={factionColorMap[item.factionId] ?? 'var(--ink-4)'} />
      ) : (
        <span style={{ fontSize: 8, color: 'var(--ink-3)', paddingTop: 1 }}>
          {TYPE_ICON[item.type] ?? '·'}
        </span>
      )}

      {/* Label + sublabel */}
      <div>
        <span
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: 11,
            fontWeight: item.isHighlight ? 700 : 400,
            color,
          }}
        >
          {item.label}
        </span>
        {item.subLabel !== null && (
          <span
            style={{
              display: 'block',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 8,
              color: 'var(--ink-3)',
              marginTop: 1,
            }}
          >
            {item.subLabel}
          </span>
        )}
      </div>
    </div>
  );
}

export function TimelineSection() {
  const game = useGame();

  const summary = useMemo(
    () =>
      game !== null
        ? buildTimelineFeed(
            game.vpEvents,
            game.agendaResolutions,
            game.objectiveReveals,
            game.planetEvents,
          )
        : null,
    [game],
  );

  if (game === null || summary === null) return null;

  const factionColorMap = Object.fromEntries(
    game.factions.map(f => [f.factionId, f.color]),
  );

  // First event timestamp for relative time display
  const firstTimestamp = summary.items[0]?.timestamp ?? 0;

  return (
    <section
      id="timeline"
      data-section="timeline"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      {/* Kicker */}
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--rule)',
          paddingBottom: 3,
          marginBottom: 6,
        }}
      >
        <span>Chronicle · This Game</span>
        <span>{summary.items.length} events · {summary.highlightCount} highlights</span>
      </div>

      {/* Headline */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 22,
          fontWeight: 800,
          fontStyle: 'italic',
          lineHeight: 1.1,
          margin: '4px 0 2px',
        }}
      >
        Turn by turn.
      </div>

      {/* Deck */}
      <div style={{ fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
        {summary.deckText}
      </div>

      <hr style={{ border: 'none', borderTop: '3px double var(--rule)', margin: '6px 0' }} />

      {/* Event legend */}
      <div style={{ display: 'flex', gap: 10, fontSize: 9, marginBottom: 6, flexWrap: 'wrap' }}>
        {[
          { icon: '✦', label: 'VP scored', color: 'var(--ink)' },
          { icon: '⚖', label: 'Agenda', color: 'var(--ink)' },
          { icon: '◆', label: 'Objective revealed', color: 'var(--ink-3)' },
          { icon: '⌖', label: 'Mecatol Rex', color: 'var(--ink)' },
        ].map(({ icon, label, color }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ color, fontSize: 8 }}>{icon}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
          </span>
        ))}
      </div>

      <Rule />

      {/* Feed */}
      {summary.items.length === 0 ? (
        <div style={{ fontSize: 10, color: 'var(--ink-3)', fontStyle: 'italic', padding: '8px 0' }}>
          No events recorded.
        </div>
      ) : (
        <div>
          {summary.items.map((item, i) => (
            <FeedItem
              key={i}
              item={item}
              factionColorMap={factionColorMap}
              firstTimestamp={firstTimestamp}
            />
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Run typecheck + sections test**

```bash
cd app && npm run typecheck && npx vitest run src/features/game-detail/sections.test.tsx
```

Expected: clean.

- [ ] **Step 3: Run full acceptance bar**

```bash
cd app && npm run typecheck && npm run lint && npm test && npm run build
```

Expected: all pass. Note any pre-existing lint warnings — the only acceptable lint errors are pre-existing ones in `GameDetailPage.tsx` and `HomePage.tsx` (already present on main branch before this plan).

- [ ] **Step 4: Commit**

```bash
git add app/src/features/game-detail/TimelineSection.tsx
git commit -m "feat: add TimelineSection chronological event feed"
```

---

## Self-review checklist

**Spec coverage:**
- ✅ VP Race: `buildVpTimeline` + `VpRaceSection` with SVG slope chart → Task 1 + 2
- ✅ Planets: `buildPlanetSummary` + `PlanetsSection` with per-faction planet inventory → Task 3 + 4
- ✅ Dashboard: `buildDashboardSummary` + `DashboardSection` with per-faction dossiers → Task 5 + 6
- ✅ Timeline: `buildTimelineFeed` + `TimelineSection` with chronological event feed → Task 7 + 8
- ✅ All sections keep their `id` and `data-section` attributes for scroll targeting (sections.test.tsx continues to pass)
- ✅ All sections return `null` when `game === null`
- ✅ All pure functions are in `src/lib/` (no React, no I/O)
- ✅ `useMemo` wraps all pure function calls in components

**Type consistency across tasks:**
- `FactionVpSeries.points` → `VpPoint[]` — used in Task 2 SVG rendering
- `FactionPlanetInventory.planets` → `PlanetControlEntry[]` — used in Task 4 rendering
- `FactionDashboard.techsResearched` → `TechEntry[]` — used in Task 6 rendering
- `TimelineFeedItem.factionId` → `string | null` — Task 8 renders dot only when non-null
- `buildDashboardSummary` imports `lookupTechColor` from `'../parser/techs'` — same path used in `buildTechSummary`
