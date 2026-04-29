# Phase 4c: Hero Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver two hi-fi hero screens — VP Race (Screen 7A) with dots at each scoring event + editorial drop cap prose, and a new End-Game Recap (Screen 10A) as the first section of the game-detail page with masthead layout, 3-column winner/prose/stats grid, and standings strip.

**Architecture:** Two independent tasks. Task 1 enhances the existing `VpRaceSection` and its backing `buildVpTimeline` function — adds an `editorialProse` string field, improves the `headline` wording, and places SVG circles at each `VpPoint` on faction lines. Task 2 creates a new `RecapSection` component backed by a pure `buildRecapSummary` lib function; `RecapSection` becomes the first section in the game-detail scroll body and nav.

**Tech Stack:** React 19 + TypeScript, SVG (built-in), CSS custom properties already defined (`--paper`, `--ink`, `--accent`, `--ink-2/3/4`, `--rule`), Vitest

---

## File Map

| File | Action | Purpose |
|------|---------|---------|
| `app/src/lib/vp/buildVpTimeline.ts` | **Modify** | Add `editorialProse` to `VpTimelineSummary`; improve `headline` from "wins." to "takes the throne." |
| `app/src/lib/vp/buildVpTimeline.test.ts` | **Modify** | Tests for `editorialProse` field and updated `headline` |
| `app/src/features/game-detail/VpRaceSection.tsx` | **Modify** | Add SVG circles at each VP event in `FactionPath`; render `editorialProse` with `.dropcap` below legend |
| `app/src/index.css` | **Modify** | Add `.dropcap::first-letter` CSS rule |
| `app/src/lib/recap/buildRecapSummary.ts` | **Create** | Pure function — standings sorted by VP, vpMargin, totalRounds, editorialHeadline/Deck |
| `app/src/lib/recap/buildRecapSummary.test.ts` | **Create** | TDD tests for all fields |
| `app/src/features/game-detail/RecapSection.tsx` | **Create** | "The Galactic Chronicle" — header strip, masthead, kicker, headline, 3-column grid, standings strip |
| `app/src/features/game-detail/ScrollBody.tsx` | **Modify** | Import and render `RecapSection` first; add 'recap' to `SECTION_IDS` |
| `app/src/features/game-detail/FrozenHeader.tsx` | **Modify** | Prepend `{ id: 'recap', label: 'Recap' }` to `SECTIONS` |

---

## Task 1: VP Race hi-fi (Screen 7A)

**Files:**
- Modify: `app/src/lib/vp/buildVpTimeline.ts`
- Modify: `app/src/lib/vp/buildVpTimeline.test.ts`
- Modify: `app/src/features/game-detail/VpRaceSection.tsx`
- Modify: `app/src/index.css`

> **Context:** The VP Race section has a time-based slope chart. The wireframe (Screen 7A) adds two features: (1) small dots at each VP-scoring event on faction lines, with a larger terminal dot at the final position; (2) an editorial prose paragraph below the legend with a CSS drop cap first letter.
>
> **Dots:** Implemented as SVG `<circle>` elements in `FactionPath`. Each `VpPoint` in `s.points` gets a circle at its `(x, y)` position — radius 1.5 for interior points, radius 3 for the final point. The stroke color matches the existing line color (accent for winner, ink-3 for others).
>
> **Drop cap:** The `.dropcap::first-letter` CSS pseudo-element floats a large initial capital. We add this class to a new `<p>` rendered after the legend, containing the new `editorialProse` string from `buildVpTimeline`.
>
> **Why the x-axis stays time-based:** `VpEvent` has no `round` field, and `PhaseSnapshot` has no `timestamp` field — there is no existing data bridge to position VP events by round number without a new mapping approach. Time-based dots at each scoring event still show the pacing narrative the wireframe intends.

- [ ] **Step 1: Write failing tests for `editorialProse` and updated `headline`**

Open `app/src/lib/vp/buildVpTimeline.test.ts`. Add this describe block after the existing tests. First check what imports are already at the top of the file — you will need `VpEvent` and `FactionSetup` from `'../parser/types'` for the test fixtures.

```ts
describe('editorialProse and headline wording', () => {
  const factions: FactionSetup[] = [
    { factionId: 'Sol', playerName: 'Tim', color: '#aaa', mapPosition: 0, startingTechs: [], startingPlanets: [] },
    { factionId: 'Hacan', playerName: 'Jake', color: '#bbb', mapPosition: 1, startingTechs: [], startingPlanets: [] },
  ];
  const winnerEvents: VpEvent[] = [
    { faction: 'Sol', objective: 'Imperial', points: 1, timestamp: 100, source: 'imperial' },
    { faction: 'Hacan', objective: 'Public I', points: 1, timestamp: 200, source: 'public_objective' },
    { faction: 'Sol', objective: 'Imperial', points: 9, timestamp: 300, source: 'imperial' },
  ];
  const winnerScores = { Sol: 10, Hacan: 1 };

  it('headline contains "takes the throne" when there is a winner', () => {
    const summary = buildVpTimeline(winnerEvents, factions, winnerScores, { victoryPoints: 10 }, 3600);
    expect(summary.headline).toContain('takes the throne');
  });

  it('editorialProse is a non-empty string containing the winner faction name', () => {
    const summary = buildVpTimeline(winnerEvents, factions, winnerScores, { victoryPoints: 10 }, 3600);
    expect(summary.editorialProse.length).toBeGreaterThan(20);
    expect(summary.editorialProse).toContain('Sol');
  });

  it('editorialProse is non-empty when there is no winner', () => {
    const noWinEvents: VpEvent[] = [
      { faction: 'Sol', objective: 'Pub I', points: 3, timestamp: 100, source: 'public_objective' },
    ];
    const summary = buildVpTimeline(noWinEvents, factions, { Sol: 3, Hacan: 0 }, {}, 1800);
    expect(summary.editorialProse.length).toBeGreaterThan(10);
  });
});
```

Run:
```
cd "D:\_TI4 App\app"
npm test -- buildVpTimeline
```
Expected: FAIL — `Property 'editorialProse' does not exist on type 'VpTimelineSummary'` (or similar type error / undefined access).

- [ ] **Step 2: Add `editorialProse` to the interface and implement it**

In `app/src/lib/vp/buildVpTimeline.ts`, add `editorialProse: string` to the interface:

```ts
export interface VpTimelineSummary {
  series: FactionVpSeries[];
  victoryPoints: number;
  gameDurationSeconds: number;
  headline: string;
  deckText: string;
  editorialProse: string;
}
```

Then replace the editorial text block at the bottom of `buildVpTimeline` (the lines that set `headline` and `deckText`, from `const winner = ...` down to the `return` statement) with:

```ts
  const winner = series.find(s => s.isWinner);
  const leader = [...series].sort((a, b) => b.finalVp - a.finalVp)[0];
  const hours = Math.round((gameDurationSeconds / 3600) * 10) / 10;
  const sortedByVp = [...series].sort((a, b) => b.finalVp - a.finalVp);
  const secondVp = sortedByVp[1]?.finalVp ?? 0;

  const headline = winner !== undefined
    ? `${winner.factionId} takes the throne.`
    : 'The race is unfinished.';

  const deckText = winner !== undefined
    ? `Victory in ${hours}h. Final scores: ${series.map(s => `${s.factionId} ${s.finalVp}`).join(', ')}.`
    : leader !== undefined
      ? `${leader.factionId} led with ${leader.finalVp} VP after ${hours}h.`
      : `${series.length} factions competed over ${hours}h.`;

  const editorialProse = winner !== undefined
    ? `${winner.factionId} reached ${winner.finalVp} victory points in ${hours}h, claiming the galaxy by a margin of ${winner.finalVp - secondVp}. ${series.length} factions contested the stars; the campaign ran its full course before a victor emerged.`
    : leader !== undefined
      ? `After ${hours}h, ${leader.factionId} held the lead with ${leader.finalVp} VP. No empire reached the ${victoryPoints}-point threshold before the game concluded.`
      : `${series.length} factions competed over ${hours}h without a decisive conclusion.`;

  return { series, victoryPoints, gameDurationSeconds, headline, deckText, editorialProse };
```

- [ ] **Step 3: Run tests to verify they pass**

```
cd "D:\_TI4 App\app"
npm test -- buildVpTimeline
```
Expected: all tests pass (new ones + previously passing ones).

- [ ] **Step 4: Add drop cap CSS to `app/src/index.css`**

Append to the bottom of `app/src/index.css`:

```css
.dropcap::first-letter {
  float: left;
  font-size: 2.8em;
  font-weight: 800;
  line-height: 0.82;
  margin-right: 0.06em;
  font-family: 'Newsreader', Georgia, serif;
  color: var(--ink);
}
```

- [ ] **Step 5: Add dots to `FactionPath` and editorial prose to `VpRaceContent`**

**Replace the entire `FactionPath` function** in `app/src/features/game-detail/VpRaceSection.tsx`:

```tsx
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

  // Intentional editorial design: winner highlighted in accent, others in neutral ink.
  // Faction identity is communicated via the legend's color dots, not the line strokes.
  // This creates clear visual hierarchy and matches the newspaper/almanac aesthetic.
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
      {s.points.map((p, i) => {
        const cx = xScale(p.gameTimeSeconds, gameDurationSeconds);
        const cy = yScale(p.cumulativeVp, victoryPoints);
        const isLast = i === s.points.length - 1;
        return (
          <circle
            key={i}
            cx={cx} cy={cy}
            r={isLast ? 3 : 1.5}
            fill={stroke}
          />
        );
      })}
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
```

**In `VpRaceContent`**, add the editorial prose paragraph after the closing `</div>` of the legend block (the `{summary.series.map(...)}` div):

```tsx
      {/* Editorial prose with drop cap */}
      <p
        className="dropcap"
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 10,
          lineHeight: 1.55,
          color: 'var(--ink-2)',
          marginTop: 10,
          marginBottom: 0,
        }}
      >
        {summary.editorialProse}
      </p>
```

- [ ] **Step 6: Run typecheck and full test suite**

```
cd "D:\_TI4 App\app"
npm run typecheck && npm test
```
Expected: no type errors, all tests pass.

- [ ] **Step 7: Build**

```
cd "D:\_TI4 App\app"
npm run build 2>&1 | tail -20
```
Expected: build succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
git add app/src/lib/vp/buildVpTimeline.ts \
        app/src/lib/vp/buildVpTimeline.test.ts \
        app/src/features/game-detail/VpRaceSection.tsx \
        app/src/index.css
git commit -m "feat: VP Race hi-fi — editorial prose with drop cap, dots at VP events"
```

---

## Task 2: RecapSection (Screen 10A — End-Game Recap)

**Files:**
- Create: `app/src/lib/recap/buildRecapSummary.ts`
- Create: `app/src/lib/recap/buildRecapSummary.test.ts`
- Create: `app/src/features/game-detail/RecapSection.tsx`
- Modify: `app/src/features/game-detail/ScrollBody.tsx`
- Modify: `app/src/features/game-detail/FrozenHeader.tsx`

> **Context:** `RecapSection` is a new first section in the game-detail page that renders a newspaper front page for the game outcome. It is wired before `VpRaceSection` in `ScrollBody` and gets a new 'Recap' nav tab in `FrozenHeader`.
>
> Layout matches wireframe Screen 10A (`Recap_Front`):
> 1. **Header strip** — "FINAL EDITION" + date, framed by double-top-rule / single-bottom-rule
> 2. **Masthead** — "The Galactic Chronicle" italic Newsreader 30px, double-bottom-rule
> 3. **Kicker** — "The Final Tally · Round N" / "Xh · N empires · 1 throne"
> 4. **Headline** — "WINNER TAKES THE THRONE." centered Newsreader 800 26px
> 5. **Deck** — centered italic Newsreader
> 6. **Double rule**
> 7. **3-column grid** (1fr 1fr 1fr): Col 1 = winner block, Col 2 = dropcap prose, Col 3 = margin/length stats
> 8. **Rule**
> 9. **Standings strip** — `repeat(N, 1fr)` grid, one cell per faction sorted by VP descending
>
> `buildRecapSummary` is a pure function with no React, no I/O. It derives all display data from a `ParsedGame`. `totalRounds` comes from `phaseSnapshots[].round` max value.
>
> **Player name in Col 1:** `winner.playerName` is shown as a byline in the winner block. This is intentional — the Recap is a post-game summary where player identity adds context (compare: in-game sections anonymize by default; the Recap is the "shareable" final edition).
>
> **Faction name truncation:** The standings strip uses `factionId.split(' ')[0] ?? factionId` to fit long names (e.g., "Vaden Banking Clans" → "Vaden") in narrow cells.

- [ ] **Step 1: Write failing tests for `buildRecapSummary`**

Create `app/src/lib/recap/buildRecapSummary.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildRecapSummary } from './buildRecapSummary';
import type { ParsedGame, FactionSetup, PhaseSnapshot } from '../parser/types';

function makeFaction(id: string, playerName: string, color: string): FactionSetup {
  return { factionId: id, playerName, color, mapPosition: 0, startingTechs: [], startingPlanets: [] };
}

function makeGame(overrides: Partial<ParsedGame> = {}): ParsedGame {
  return {
    gameId: 'g1', playedAt: 0, durationSeconds: 21600,
    factions: [
      makeFaction('Sol', 'Tim', '#aaa'),
      makeFaction('Hacan', 'Jake', '#bbb'),
      makeFaction('Arborec', 'Steve', '#ccc'),
    ],
    options: { victoryPoints: 10 },
    initialSpeaker: 'Sol',
    phaseSnapshots: [
      { round: 1, phase: 'strategy', speaker: 'Sol' },
      { round: 2, phase: 'strategy', speaker: 'Hacan' },
      { round: 3, phase: 'strategy', speaker: 'Sol' },
    ] as PhaseSnapshot[],
    vpEvents: [], planetEvents: [], techEvents: [], agendaResolutions: [],
    strategyCardEvents: [], actionCardEvents: [], componentEvents: [], relicEvents: [],
    leaderEvents: [], objectiveReveals: [], speakerEvents: [], attachmentEvents: [],
    allianceEvents: [], promissoryNoteEvents: [], expeditionEvents: [],
    secondaryEvents: [], actionEvents: [],
    finalScores: { Sol: 10, Hacan: 8, Arborec: 5 },
    winner: 'Sol',
    timers: { game: 21600, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
    ...overrides,
  };
}

describe('buildRecapSummary', () => {
  it('winner has correct factionId and VP', () => {
    const recap = buildRecapSummary(makeGame());
    expect(recap.winner?.factionId).toBe('Sol');
    expect(recap.winner?.finalVp).toBe(10);
  });

  it('standings are sorted by VP descending', () => {
    const recap = buildRecapSummary(makeGame());
    expect(recap.standings.map(s => s.factionId)).toEqual(['Sol', 'Hacan', 'Arborec']);
  });

  it('standings ranks start at 1 and increment', () => {
    const recap = buildRecapSummary(makeGame());
    expect(recap.standings[0]?.rank).toBe(1);
    expect(recap.standings[1]?.rank).toBe(2);
    expect(recap.standings[2]?.rank).toBe(3);
  });

  it('isWinner is true only for the winner standing', () => {
    const recap = buildRecapSummary(makeGame());
    expect(recap.standings.filter(s => s.isWinner).map(s => s.factionId)).toEqual(['Sol']);
  });

  it('totalRounds is the max round in phaseSnapshots', () => {
    const recap = buildRecapSummary(makeGame());
    expect(recap.totalRounds).toBe(3);
  });

  it('totalRounds is 0 when phaseSnapshots is empty', () => {
    const recap = buildRecapSummary(makeGame({ phaseSnapshots: [] }));
    expect(recap.totalRounds).toBe(0);
  });

  it('vpMargin is winner VP minus nearest non-winner VP', () => {
    const recap = buildRecapSummary(makeGame());
    expect(recap.vpMargin).toBe(2); // 10 - 8
  });

  it('vpMargin is 0 when no winner', () => {
    const recap = buildRecapSummary(makeGame({ winner: null }));
    expect(recap.vpMargin).toBe(0);
  });

  it('winner is null when game has no winner', () => {
    const recap = buildRecapSummary(makeGame({ winner: null }));
    expect(recap.winner).toBeNull();
  });

  it('editorialHeadline contains uppercased faction name when winner exists', () => {
    const recap = buildRecapSummary(makeGame());
    expect(recap.editorialHeadline).toContain('SOL');
  });

  it('durationSeconds matches game durationSeconds', () => {
    const recap = buildRecapSummary(makeGame());
    expect(recap.durationSeconds).toBe(21600);
  });

  it('victoryPoints defaults to 10 when not in options', () => {
    const recap = buildRecapSummary(makeGame({ options: {} }));
    expect(recap.victoryPoints).toBe(10);
  });
});
```

Run:
```
cd "D:\_TI4 App\app"
npm test -- buildRecapSummary
```
Expected: FAIL — module not found.

- [ ] **Step 2: Implement `buildRecapSummary`**

Create `app/src/lib/recap/buildRecapSummary.ts`:

```ts
import type { ParsedGame } from '../parser/types';

export interface RecapStanding {
  rank: number;
  factionId: string;
  color: string;
  playerName: string;
  finalVp: number;
  isWinner: boolean;
}

export interface RecapSummary {
  winner: RecapStanding | null;
  standings: RecapStanding[];
  totalRounds: number;
  durationSeconds: number;
  victoryPoints: number;
  vpMargin: number;
  editorialHeadline: string;
  editorialDeck: string;
}

export function buildRecapSummary(game: ParsedGame): RecapSummary {
  const raw = game.options['victoryPoints'];
  const victoryPoints = typeof raw === 'number' ? raw : 10;

  const sortedFactions = game.factions
    .slice()
    .sort((a, b) => (game.finalScores[b.factionId] ?? 0) - (game.finalScores[a.factionId] ?? 0));

  const standings: RecapStanding[] = sortedFactions.map((f, i) => ({
    rank: i + 1,
    factionId: f.factionId,
    color: f.color,
    playerName: f.playerName,
    finalVp: game.finalScores[f.factionId] ?? 0,
    isWinner: f.factionId === game.winner,
  }));

  const winner = standings.find(s => s.isWinner) ?? null;

  const totalRounds =
    game.phaseSnapshots.length > 0
      ? Math.max(...game.phaseSnapshots.map(s => s.round))
      : 0;

  const vpMargin =
    winner !== null
      ? winner.finalVp - (standings.find(s => !s.isWinner)?.finalVp ?? 0)
      : 0;

  const hours = Math.round((game.durationSeconds / 3600) * 10) / 10;

  const editorialHeadline =
    winner !== null
      ? `${winner.factionId.toUpperCase()} TAKES THE THRONE.`
      : 'THE RACE GOES ON.';

  const editorialDeck =
    winner !== null
      ? `${totalRounds} rounds · ${hours}h · ${game.factions.length} empires · 1 throne`
      : `${totalRounds} rounds · ${hours}h · no victor`;

  return {
    winner,
    standings,
    totalRounds,
    durationSeconds: game.durationSeconds,
    victoryPoints,
    vpMargin,
    editorialHeadline,
    editorialDeck,
  };
}
```

- [ ] **Step 3: Run tests to verify they pass**

```
cd "D:\_TI4 App\app"
npm test -- buildRecapSummary
```
Expected: all 12 tests pass.

- [ ] **Step 4: Create `RecapSection.tsx`**

Create `app/src/features/game-detail/RecapSection.tsx`:

```tsx
import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildRecapSummary } from '../../lib/recap/buildRecapSummary';
import { Rule, formatDate, formatDuration } from '../../shared';

export function RecapSection() {
  const { game } = useGame();

  const recap = useMemo(
    () => (game !== null ? buildRecapSummary(game) : null),
    [game],
  );

  if (recap === null || game === null) return null;

  const { winner, standings, totalRounds, durationSeconds, vpMargin, editorialHeadline, editorialDeck } = recap;

  const dateStr = formatDate(game.playedAt);
  const durationStr = formatDuration(durationSeconds);

  const editorialProse =
    winner !== null
      ? `${winner.factionId} reached ${winner.finalVp} victory points after ${totalRounds} rounds. The campaign ran ${durationStr}, with ${standings.length} empires competing for control of the galaxy. Victory came by a margin of ${vpMargin} point${vpMargin === 1 ? '' : 's'} over the runner-up.`
      : `After ${totalRounds} rounds and ${durationStr}, no empire reached the victory threshold. The galaxy remains contested.`;

  return (
    <section
      id="recap"
      data-section="recap"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      {/* Header strip */}
      <div
        style={{
          borderTop: '4px double var(--rule)',
          borderBottom: '1px solid var(--rule)',
          padding: '4px 0',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>FINAL EDITION</span>
        <span>Vol. I</span>
        <span>{dateStr}</span>
      </div>

      {/* Masthead */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 30,
          fontStyle: 'italic',
          textAlign: 'center',
          padding: '8px 0',
          borderBottom: '3px double var(--rule)',
          lineHeight: 1.1,
        }}
      >
        The Galactic Chronicle
      </div>

      {/* Kicker */}
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: 6,
          paddingBottom: 3,
        }}
      >
        <span>The Final Tally · Round {totalRounds > 0 ? totalRounds : '—'}</span>
        <span>{durationStr} · {standings.length} empires · {winner !== null ? '1 throne' : 'no throne'}</span>
      </div>

      {/* Headline */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 26,
          fontWeight: 800,
          textAlign: 'center',
          lineHeight: 1.05,
          marginTop: 4,
        }}
      >
        {editorialHeadline}
      </div>

      {/* Deck */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontStyle: 'italic',
          fontSize: 11,
          textAlign: 'center',
          color: 'var(--ink-2)',
          marginTop: 4,
          lineHeight: 1.3,
        }}
      >
        {editorialDeck}
      </div>

      <hr style={{ border: 'none', borderTop: '3px double var(--rule)', margin: '8px 0' }} />

      {/* 3-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          alignItems: 'flex-start',
        }}
      >
        {/* Col 1: Winner block */}
        <div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '7px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--ink-3)',
              marginBottom: 4,
            }}
          >
            Winner
          </div>
          {winner !== null ? (
            <>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: winner.color,
                  opacity: 0.7,
                  marginBottom: 4,
                }}
              />
              <div
                style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontWeight: 800,
                  fontSize: 14,
                  lineHeight: 1.1,
                  marginBottom: 2,
                }}
              >
                {winner.factionId}
              </div>
              <div
                style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontWeight: 800,
                  fontSize: 24,
                  color: 'var(--accent)',
                  lineHeight: 1,
                }}
              >
                {winner.finalVp} VP
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '8px',
                  color: 'var(--ink-3)',
                  marginTop: 3,
                }}
              >
                {winner.playerName}
              </div>
            </>
          ) : (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', color: 'var(--ink-3)' }}>
              No victor
            </div>
          )}
        </div>

        {/* Col 2: Drop cap prose */}
        <div>
          <p
            className="dropcap"
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: 9,
              lineHeight: 1.45,
              color: 'var(--ink-2)',
              margin: 0,
            }}
          >
            {editorialProse}
          </p>
        </div>

        {/* Col 3: Margin + Length */}
        <div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '7px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--ink-3)',
              marginBottom: 2,
            }}
          >
            Margin
          </div>
          <div
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontWeight: 800,
              fontSize: 24,
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            {winner !== null ? `${vpMargin} VP` : '—'}
          </div>
          <Rule />
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '7px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--ink-3)',
              marginBottom: 2,
            }}
          >
            Length
          </div>
          <div
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontWeight: 800,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            {durationStr}
          </div>
        </div>
      </div>

      <Rule />

      {/* Standings strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${standings.length}, 1fr)`,
          gap: 3,
        }}
      >
        {standings.map(s => (
          <div
            key={s.factionId}
            style={{
              textAlign: 'center',
              padding: '4px 2px',
              background: s.isWinner ? 'var(--paper-2)' : 'transparent',
              border: s.isWinner ? '1px solid var(--accent)' : '1px solid var(--ink-4)',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: s.color,
                margin: '0 auto 2px',
              }}
            />
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '7px',
                color: 'var(--ink-3)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {s.factionId.split(' ')[0] ?? s.factionId}
            </div>
            <div
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontWeight: 800,
                fontSize: 13,
                color: s.isWinner ? 'var(--accent)' : 'var(--ink)',
              }}
            >
              {s.finalVp}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Wire `RecapSection` into `ScrollBody.tsx`**

Open `app/src/features/game-detail/ScrollBody.tsx` and make three changes:

**Add import** at the top (after existing section imports):
```tsx
import { RecapSection } from './RecapSection';
```

**Prepend 'recap' to `SECTION_IDS`**:
```tsx
const SECTION_IDS = ['recap', 'vp-race', 'timeline', 'dashboard', 'planets', 'tech', 'agenda'] as const;
```

**Add `<RecapSection />` as the first child** in the returned scroll container:
```tsx
  return (
    <div style={{ overflowY: 'scroll', flex: 1 }}>
      <RecapSection />
      <VpRaceSection />
      <TimelineSection />
      <DashboardSection />
      <PlanetsSection />
      <TechSection />
      <AgendaSection />
    </div>
  );
```

- [ ] **Step 6: Add 'Recap' tab to `FrozenHeader.tsx`**

Open `app/src/features/game-detail/FrozenHeader.tsx`. Prepend to the `SECTIONS` array:

```tsx
const SECTIONS = [
  { id: 'recap',     label: 'Recap' },
  { id: 'vp-race',   label: 'VP Race' },
  { id: 'timeline',  label: 'Timeline' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'planets',   label: 'Planets' },
  { id: 'tech',      label: 'Tech' },
  { id: 'agenda',    label: 'Agenda' },
] as const;
```

- [ ] **Step 7: Update existing section tests if needed**

Read both `app/src/features/game-detail/ScrollBody.test.tsx` and `app/src/features/game-detail/FrozenHeader.test.tsx`.

- If `ScrollBody.test.tsx` tests `onSectionChange` callbacks with specific section IDs, add a 'recap' case.
- If `FrozenHeader.test.tsx` asserts on the number of nav buttons or checks for specific button labels, update those assertions to include 'Recap'.

Make any needed edits, then verify the tests still pass.

- [ ] **Step 8: Run typecheck and full test suite**

```
cd "D:\_TI4 App\app"
npm run typecheck && npm test
```
Expected: no type errors. All tests pass.

- [ ] **Step 9: Build**

```
cd "D:\_TI4 App\app"
npm run build 2>&1 | tail -20
```
Expected: build succeeds with no errors.

- [ ] **Step 10: Commit**

```bash
git add app/src/lib/recap/buildRecapSummary.ts \
        app/src/lib/recap/buildRecapSummary.test.ts \
        app/src/features/game-detail/RecapSection.tsx \
        app/src/features/game-detail/ScrollBody.tsx \
        app/src/features/game-detail/FrozenHeader.tsx \
        app/src/features/game-detail/ScrollBody.test.tsx \
        app/src/features/game-detail/FrozenHeader.test.tsx
git commit -m "feat: add RecapSection (Screen 10A) — Galactic Chronicle end-game recap"
```

---

## Self-Review

### Spec Coverage

| Requirement (design_handoff_ti4_tracker README / wireframes) | Task |
|---|---|
| Screen 7A: dots at each data point on faction lines | Task 1, Step 5 (circles in FactionPath) |
| Screen 7A: larger terminal dot at final position | Task 1, Step 5 (r=3 for last point vs r=1.5) |
| Screen 7A: editorial drop cap prose | Task 1, Steps 4 + 5 |
| Screen 7A: improved headline (not just "X wins.") | Task 1, Steps 1–3 |
| Screen 10A: "FINAL EDITION" header strip with double-top-rule | Task 2, Step 4 |
| Screen 10A: "The Galactic Chronicle" masthead | Task 2, Step 4 |
| Screen 10A: Kicker with round count + duration | Task 2, Step 4 |
| Screen 10A: Centered winner headline | Task 2, Step 4 |
| Screen 10A: Centered deck text | Task 2, Step 4 |
| Screen 10A: 3-column winner/prose/stats grid | Task 2, Step 4 |
| Screen 10A: Winner block — color swatch, VP, player byline | Task 2, Step 4 |
| Screen 10A: Drop cap in prose column | Task 2, Step 4 (reuses `.dropcap` from Task 1) |
| Screen 10A: Margin stat + Length stat in col 3 | Task 2, Step 4 |
| Screen 10A: Faction standings strip | Task 2, Step 4 |
| RecapSection wired as first section | Task 2, Steps 5 + 6 |

### Placeholder Scan

No TBD or TODO. All code blocks are complete.

### Type Consistency

- `buildRecapSummary(game: ParsedGame): RecapSummary` — imported from `'../parser/types'`; used as `buildRecapSummary(game)` in `RecapSection` guarded by `game !== null`
- `RecapSummary.winner: RecapStanding | null` — narrowed with `winner !== null` before property access throughout
- `formatDate` and `formatDuration` are exported from `app/src/shared/index.ts` (re-exported from `./formatters`) — matches the import `from '../../shared'` in `RecapSection`
- `Rule` imported from `'../../shared'` — already used in other section components in this feature, consistent
- `s.factionId.split(' ')[0] ?? s.factionId` — `noUncheckedIndexedAccess` returns `string | undefined` for array index access; the `?? s.factionId` fallback handles this
- `Math.max(...game.phaseSnapshots.map(s => s.round))` — only called when `phaseSnapshots.length > 0`, so spread is never empty
- `standings.find(s => !s.isWinner)?.finalVp ?? 0` — `.find()` returns `T | undefined`; the optional chain + nullish coalescing is safe
