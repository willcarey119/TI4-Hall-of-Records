# Phase 3 — Meta-Dashboard (Faction-First) Design Spec

> **Status:** Approved for implementation  
> **Date:** 2026-04-28  
> **Acceptance bar:** All six game exports visible in aggregate; user can answer "what's the highest-win-rate faction" in two clicks. Player names anonymized by default everywhere.

---

## Goal

A cross-game analytics dashboard organized around **factions** as the primary axis. Surfaces the kind of counterintuitive, data-driven insights a FiveThirtyEight-style sports analytics site would surface — but for Twilight Imperium 4th Edition.

Phase 3.5 (best-effort player attribution) is explicitly out of scope for this plan.

---

## Architecture

### Approach: Client-side aggregation

All `ParsedGame` documents are loaded from Firestore at page mount. Pure aggregation functions in `src/lib/aggregator/` compute all stats client-side. With 6 games (~200–400 KB total), this is instant. Adding a new stat means adding a pure function — no Firestore migration.

### Data flow

```
Firestore
  └─ loadAllGames() → ParsedGame[]
       └─ MetaContext (on mount)
            ├─ deriveRoundBoundaries(game) — per-game, used by all aggregators
            ├─ buildFactionStats(games) → FactionStatsSummary
            ├─ buildStrategyCardStats(games) → StrategyCardSummary
            ├─ buildTechStats(games) → TechSummary
            └─ buildGameStats(games) → GameStatsSummary
                  └─ useMeta() hook → section components
```

### Navigation

`HomePage` gets a `"League Stats →"` kicker link below the masthead subtitle. New route `/meta` added to `App.tsx`.

---

## File Structure

```
src/adapters/firestore.ts                  ← add loadAllGames()
src/App.tsx                                ← add /meta route
src/features/home/HomePage.tsx             ← add League Stats kicker link

src/features/meta-dashboard/
  MetaContext.tsx                          ← loads games, runs aggregators, provides useMeta()
  MetaDashboardPage.tsx                    ← FrozenHeader (4 tabs) + ScrollBody (4 sections)
  FactionSection.tsx
  StrategyCardSection.tsx
  TechSection.tsx
  StatsSection.tsx
  sections.test.tsx                        ← same shell-render test pattern as game-detail

src/lib/aggregator/
  factionExpansions.ts                     ← static dict: factionId → expansion tag (no test)
  buildFactionStats.ts
  buildFactionStats.test.ts
  buildStrategyCardStats.ts
  buildStrategyCardStats.test.ts
  buildTechStats.ts
  buildTechStats.test.ts
  buildGameStats.ts
  buildGameStats.test.ts
  deriveRoundBoundaries.ts
  deriveRoundBoundaries.test.ts

src/lib/parser/gameReducer.ts              ← extend SELECT_ACTION to capture action types
src/lib/parser/types.ts                    ← add ActionTypeEvent; mark actionTypeEvents optional
```

---

## Parser Extension: Action Type Capture

`SELECT_ACTION` events are currently ignored (`case 'SELECT_ACTION': return state`). The event payload carries `{ action: 'TACTICAL' | 'COMPONENT' | 'PASS' }`.

### New type (add to `types.ts`)

```ts
export type PlayerActionType = 'tactical' | 'component' | 'pass';

export interface ActionTypeEvent {
  faction: string;
  actionType: PlayerActionType;
  timestamp: number;
  gameTime?: number;
}
```

### Change to `ParsedGame` (add to `types.ts`)

```ts
// Optional for backward compatibility — documents uploaded before Phase 3
// will not have this field. Aggregators treat absence as [].
actionTypeEvents?: ActionTypeEvent[];
```

### Reducer change

```ts
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
    gameTime: entry.gameTime,
  };
  return {
    ...state,
    actionTypeEvents: [...(state.actionTypeEvents ?? []), ev],
  };
}
```

> **Note:** Existing Firestore documents won't have `actionTypeEvents`. Users should re-upload their game files after this parser change to populate the field. The UI degrades gracefully to "n/a" when the field is absent.

---

## `deriveRoundBoundaries`

**File:** `src/lib/aggregator/deriveRoundBoundaries.ts`

Uses **strategy card pick events** as anchors. The Strategy Phase is the first real action of every round — the first pick in each round's strategy phase marks round start. Since every faction picks exactly one strategy card per round, sorted pick events form clusters of exactly `factionCount` events. Chunking by `factionCount` gives clean round boundaries with no ambiguity.

The single exception is game start: initial setup events (starting techs, starting planets) precede round 1's strategy phase, but these carry timestamps before the first pick and are correctly assigned to round 1 by the `assignRound` helper.

```ts
export interface RoundBoundary {
  round: number;
  /** Timestamp of the first strategy card pick in this round. */
  startTimestamp: number;
}

/**
 * Returns round boundaries derived from strategy card pick timestamps.
 *
 * Sort all 'pick' events by timestamp ascending. Chunk into groups of
 * factionCount — each group is one round's strategy phase. The minimum
 * timestamp in each chunk is that round's startTimestamp.
 *
 * Returns [] if no pick events exist (very short / incomplete games).
 */
export function deriveRoundBoundaries(
  strategyCardEvents: StrategyCardEvent[],
  factionCount: number
): RoundBoundary[]
```

**Implementation logic:**
1. Filter `strategyCardEvents` to `type === 'pick'`, sort by timestamp ascending.
2. Chunk into groups of `factionCount`.
3. For each chunk at index `i`, emit `{ round: i + 1, startTimestamp: chunk[0].timestamp }`.
4. Return sorted array (already in order by construction).

**Helper used by aggregators:**

```ts
export function assignRound(
  timestamp: number,
  boundaries: RoundBoundary[]
): number {
  // Find the latest boundary whose startTimestamp <= timestamp.
  // Falls back to round 1 if timestamp precedes all boundaries (setup events).
  let assigned = boundaries[0]?.round ?? 1;
  for (const b of boundaries) {
    if (b.startTimestamp <= timestamp) assigned = b.round;
    else break;
  }
  return assigned;
}
```

**Tests required:**
- 3 factions × 2 rounds → 6 picks → 2 boundaries with correct startTimestamps
- `assignRound` returns round 1 for timestamps before first pick (setup events)
- `assignRound` returns correct round for timestamps mid-round
- `assignRound` returns final round for post-game timestamps
- Returns `[]` for empty strategyCardEvents
- Partial final round (game ends before all picks): last chunk smaller than factionCount → still emits a boundary for that round

---

## `factionExpansions.ts`

**File:** `src/lib/aggregator/factionExpansions.ts`

Static lookup. Cover only factions that appear in the 6 game exports (enumerate during implementation by reading parsed output). Remaining factions default to `'base'`.

```ts
export type ExpansionTag = 'base' | 'pok' | 'ds' | 'te';

/** Returns the expansion tag for a given factionId. Defaults to 'base' for unknowns. */
export function getFactionExpansion(factionId: string): ExpansionTag
```

No test file needed — it's a static dictionary lookup.

---

## Aggregator: `buildFactionStats`

**File:** `src/lib/aggregator/buildFactionStats.ts`

```ts
export interface FactionStat {
  factionId: string;
  expansion: ExpansionTag;
  gamesPlayed: number;
  wins: number;
  winRate: number;              // wins / gamesPlayed, or 0 if gamesPlayed === 0
  avgFinalVp: number;
  /** Average VP at each round index [0] = round 1 end, [1] = round 2 end, etc.
   *  Computed only for games where deriveRoundBoundaries returns non-empty result.
   *  Empty array if insufficient round data. */
  avgVpPerRound: number[];
  /** VP source diversity: distinct VpSource values used across all games. */
  distinctVpSources: VpSource[];
}

export interface FactionPairing {
  factionA: string;
  factionB: string;   // factionA < factionB lexicographically (canonical order)
  coAppearances: number;
}

export interface SftTransfer {
  fromFaction: string;
  toFaction: string;
  count: number;  // number of games where this transfer occurred
}

export interface FactionStatsSummary {
  totalGames: number;
  factions: FactionStat[];    // ordered by winRate desc, then gamesPlayed desc
  topPairings: FactionPairing[];  // ordered by coAppearances desc, top 10
  sftTransfers: SftTransfer[];    // Support for the Throne transfers across all games
}

export function buildFactionStats(games: ParsedGame[]): FactionStatsSummary
```

**Behavior:**
- A faction is included only if it appeared in ≥ 1 game.
- `winRate` = 0 for factions with no wins.
- `avgVpPerRound[i]` = average `finalScores[factionId]` accumulated up to round `i+1`, computed per game where round boundaries are derivable, then averaged. For games without round data, the faction is excluded from that round's average but still included in `gamesPlayed`.
- `SftTransfer`: scan `promissoryNoteEvents` where `note === 'Support for the Throne'` and `type === 'play'`. One transfer per game per direction (not per note play, since a note can be played back and forth — count distinct game occurrences).
- `FactionPairing`: canonical order = `factionA < factionB` lexicographically. Count games where both appeared.

**Tests required (minimum):**
- Single game: correct pick count, win rate, avg VP
- Two games same faction wins both: winRate = 1.0
- Two games same faction wins neither: winRate = 0.0
- Pairings: factions that co-appear are counted; ordering is canonical
- SftTransfer: play events recorded correctly; return transfers not counted
- avgVpPerRound: empty array when no round boundaries available
- Empty games array: returns empty summary

---

## Aggregator: `buildStrategyCardStats`

**File:** `src/lib/aggregator/buildStrategyCardStats.ts`

```ts
export interface StrategyCardStat {
  card: string;
  totalPicks: number;
  /** Secondary follow rate: play_secondary / (play_secondary + pass_secondary).
   *  null if no secondary events exist for this card. */
  secondaryFollowRate: number | null;
  /** Average draft pick position (1 = first picked in a round, N = last).
   *  Computed from timestamps within each round's strategy phase. */
  avgPickPosition: number | null;
  /** avgPickPosition broken down by round number. null entries where no data. */
  avgPickPositionByRound: Record<number, number | null>;
  /** Secondary follow rate broken down by round number. */
  secondaryFollowRateByRound: Record<number, number | null>;
  /** Pick frequency broken down by round number: how often this card was picked in round N. */
  pickCountByRound: Record<number, number>;
}

export interface StrategyCardSummary {
  cards: StrategyCardStat[];    // ordered by totalPicks desc
  /** Cards sorted by avgPickPosition asc (most contested first). */
  mostContested: string[];
}

export function buildStrategyCardStats(
  games: ParsedGame[],
  roundBoundariesByGame: Map<string, RoundBoundary[]>
): StrategyCardSummary
```

**Draft position logic:** Within each round's strategy phase, sort all `'pick'` events by timestamp. Position 1 = earliest pick, position N = latest. Average across all occurrences of a card across all rounds/games.

**Tests required:**
- Follow rate: 2 follows + 1 pass = 67%
- Follow rate null when no secondary events
- Pick position: correct ordering within a round by timestamp
- pickCountByRound populated correctly
- Empty games: empty summary

---

## Aggregator: `buildTechStats`

**File:** `src/lib/aggregator/buildTechStats.ts`

```ts
export type TechColor = 'green' | 'blue' | 'yellow' | 'red' | 'unit';

export interface TechStat {
  tech: string;
  color: TechColor;
  researchCount: number;          // total 'research' type events across all games
  researchingFactions: string[];  // distinct faction IDs that researched it
  /** Average round first researched (across games where round data available).
   *  null if no round boundary data available. */
  avgRoundFirstResearched: number | null;
  /** % of games where the winner held this tech (researched or starting).
   *  0–1 range. */
  winnerHeldRate: number;
  winnerHeldCount: number;
}

export interface TechSummary {
  /** Top 15 by researchCount. */
  topTechs: TechStat[];
  /** All techs grouped by color, each group sorted by researchCount desc. */
  byColor: Record<TechColor, TechStat[]>;
}

export function buildTechStats(
  games: ParsedGame[],
  roundBoundariesByGame: Map<string, RoundBoundary[]>
): TechSummary
```

**Winner held logic:** For each game with a `winner`, collect all `techEvents` where `faction === winner` and `type === 'research' | 'starting'`. A tech is "held by the winner" if any such event exists. Divide by total games.

**Tests required:**
- researchCount aggregated across games
- winnerHeldRate: winner researched tech → counted; non-winner → not counted
- winnerHeldRate: no winner (winner === null) → not counted
- avgRoundFirstResearched: correct when boundaries available; null when not
- byColor grouping uses lookupTechColor from existing parser/techs
- Negative: starting techs excluded from researchCount but included in winnerHeldRate

---

## Aggregator: `buildGameStats`

**File:** `src/lib/aggregator/buildGameStats.ts`

```ts
export interface ActionTypeBreakdown {
  tactical: number;   // total tactical action events across all games
  component: number;
  pass: number;
  /** % of total (0–1). null if actionTypeEvents absent (pre-Phase-3 data). */
  tacticalPct: number | null;
  componentPct: number | null;
  passPct: number | null;
  /** Top 3 factions by avg tactical actions per game they played. */
  topTactical: Array<{ factionId: string; avgPerGame: number }>;
  /** Top 3 factions by avg component actions per game they played. */
  topComponent: Array<{ factionId: string; avgPerGame: number }>;
}

export interface MecatolStat {
  /** Avg round of first Mecatol Rex claim across all games. */
  avgFirstClaimRound: number | null;
  /** % of games where the first Mecatol claimer won. */
  firstClaimerWinRate: number | null;
  /** Average number of times Mecatol Rex changed hands per game. */
  avgTurnoverPerGame: number;
}

export interface HeroActivation {
  factionId: string;
  leaderName: string;
  /** Avg round of activation across games where activated. */
  avgActivationRound: number | null;
  /** Games where hero was activated / games faction played. */
  activationRate: number;
  gamesActivated: number;
  gamesPlayed: number;
}

export interface RelicStat {
  relic: string;
  drawnCount: number;         // GAIN events
  playedCount: number;        // PLAY events
  /** Whether this relic grants VP (derived from known VP relics list). */
  grantsVp: boolean;
}

export interface AgendaStat {
  agenda: string;
  timesResolved: number;
  passRate: number;           // 'For' outcomes / total resolutions (0–1)
  /** Net VP swing caused by this agenda across all resolutions.
   *  Positive = net VP added to game, negative = net VP removed. */
  netVpSwing: number;
}

export interface VpSourceStat {
  source: VpSource;
  totalPoints: number;
  /** Fraction of all VP scored from this source (0–1). */
  sharePct: number;
}

export interface ComingFromBehindStat {
  /** Number of games where round-3 leader went on to win. */
  round3LeaderWins: number;
  /** Number of games with derivable round 3 data. */
  gamesWithRound3Data: number;
  /** round3LeaderWins / gamesWithRound3Data. null if no data. */
  round3LeaderWinRate: number | null;
}

export interface ObjectiveTimingStat {
  /** Distribution of VP events by round: Record<roundNumber, totalVpScored>. */
  vpByRound: Record<number, number>;
  /** Average round of game-winning VP event. null if no data. */
  avgWinningVpRound: number | null;
}

export interface GameStatsSummary {
  totalGames: number;
  avgDurationSeconds: number;
  avgWinningVp: number;
  avgPlayersPerGame: number;
  mecatol: MecatolStat;
  actionTypes: ActionTypeBreakdown;
  heroActivations: HeroActivation[];   // sorted by activationRate desc
  relics: RelicStat[];                 // sorted by drawnCount desc
  agendas: AgendaStat[];               // sorted by netVpSwing desc (most impactful first)
  vpSources: VpSourceStat[];           // sorted by sharePct desc
  comingFromBehind: ComingFromBehindStat;
  objectiveTiming: ObjectiveTimingStat;
}

export function buildGameStats(
  games: ParsedGame[],
  roundBoundariesByGame: Map<string, RoundBoundary[]>
): GameStatsSummary
```

**VP relics:** Hard-coded set for `grantsVp`: `['Shard of the Throne', 'Crown of Emphidia', 'Styx']`. Derived from the existing objectives dictionary where `source === 'relic'`.

**Agenda pass rate:** `outcome === 'For'` counts as pass. `outcome === 'Against'` counts as fail. Elect-type outcomes (non-null elect agendas) are excluded from pass/fail rate (they're not binary). `netVpSwing`: sum VP events with `source === 'agenda'` that occurred in the same round as this agenda's resolution.

**Mecatol first claimer win rate:** For each game, find the first `planetEvent` where `planet === 'Mecatol Rex'` and `type === 'claim'`. Record the `faction`. Compare to `game.winner`. Exclude games where `winner === null`.

**Hero activations:** From `leaderEvents` where `type === 'play'`. Requires a lookup to distinguish heroes from agents/commanders — use a hard-coded set of known hero leader names. During implementation: enumerate all unique `leader` strings across the 6 exports and classify manually. Heroes are typically `'<FactionName> Hero'` or named characters (e.g., `'Jae Mir Kan'`).

**Coming from behind:** For each game with round 3 boundary data, find the faction with highest accumulated VP at round 3 end timestamp. If that faction is `game.winner`, it's a "leader held on" game; otherwise it's a "comeback" game.

**Tests required:**
- avgDurationSeconds averaged correctly across games
- mecatol.firstClaimerWinRate: first claimer = winner → counts; winner = null → excluded
- actionTypes: returns null percentages when actionTypeEvents absent
- topTactical: correct top-3 by avg per game (not total)
- heroActivations: only 'play' events included; activation rate correct
- relics: drawnCount from 'gain' events; playedCount from 'play' events
- agendas: elect-type excluded from passRate; netVpSwing computed correctly
- comingFromBehind: round3LeaderWinRate null when gamesWithRound3Data === 0
- Negative: games with winner === null excluded from win-rate calculations

---

## `MetaContext` and `useMeta`

**File:** `src/features/meta-dashboard/MetaContext.tsx`

```tsx
interface MetaState {
  loading: boolean;
  error: string | null;
  factionStats: FactionStatsSummary | null;
  strategyCardStats: StrategyCardSummary | null;
  techStats: TechSummary | null;
  gameStats: GameStatsSummary | null;
}

export function MetaProvider({ children }: { children: React.ReactNode }): JSX.Element
export function useMeta(): MetaState
```

**On mount:** call `loadAllGames()`, then for each game compute `deriveRoundBoundaries(game.strategyCardEvents, game.factions.length)`. Build `roundBoundariesByGame: Map<string, RoundBoundary[]>` keyed on `gameId`. Run all four aggregators synchronously after the async load.

---

## Page Structure

### `MetaDashboardPage`

Mirrors `GameDetailPage` exactly:
- `<MetaProvider>` wrapping
- `FrozenHeader` with title `"LEAGUE STATS"` and 4 tab buttons: `Factions`, `Strategy`, `Techs`, `Stats`
- `ScrollBody` with 4 `<section>` elements, `id` and `data-section` matching tab slugs: `factions`, `strategy`, `techs`, `stats`

### `sections.test.tsx` (meta-dashboard)

Same pattern as game-detail `sections.test.tsx`:
- All 4 sections render their `<section id="X" data-section="X">` shell without a `MetaProvider` (loading/empty state)
- All 4 sections render content when wrapped in a `MetaProvider` with mock data

---

## Section: `FactionSection`

**Controls (in section header):**
- View toggle: `Table | Cards` — local state, persisted to `localStorage` key `meta.factionViewMode`
- Sort toggle (table view only): `Win% | Pick | Avg VP` — local state only

**Table view columns:** Faction name + expansion tag · Picked (N/total) · Win% (bar + number) · Avg VP · Momentum sparkline

**Momentum sparkline:** `avgVpPerRound` array rendered as a mini bar chart (5 bars max, heights proportional to values). Empty array → render a `—` placeholder.

**Cards view:** Grid of `FactionCard` components. Each card: faction dot + name + expansion tag · Win% (large, accent color if highest) · Picked · Avg VP · momentum sparkline. Sorted by win rate descending; top card gets `border: 2px solid var(--rule)`.

**Frequent Pairings sub-section:** Top 5 `topPairings` rendered as rows with two faction dots, names, and co-appearance count. Below pairings: `"Win-rate split by pairing requires 10+ games."` in `--ink-3` mono.

**Support for the Throne sub-section:** `sftTransfers` rendered as `"Faction A → Faction B (N games)"` rows. Omit section if no transfers exist.

---

## Section: `StrategyCardSection`

**Sub-sections (each under a `Kicker`):**

1. **Secondary Follow Rate — All Rounds:** 4-column card grid (2 rows of 4). Each card: card name · follow rate (red if ≥ 80%) · total picks. Cards sorted by follow rate desc. Cards with `secondaryFollowRate === null` show `"n/a"`.

2. **Most Picked — By Round:** Rows for rounds 1–N (where N = max round seen). Each row: round label · top 3 cards as pills with pick count. Pills sorted by pickCount desc.

3. **Draft Position — Most Contested:** Cards sorted by `avgPickPosition` asc. Render as a ranked list: `1. Technology (avg pick 1.2)  2. Imperial (avg pick 2.8)  …`. Show note: `"Lower = grabbed earlier in strategy phase."` Cards with `null` position omitted.

4. **Draft Position Shift by Round:** Small table: rows = cards, columns = rounds. Cell value = avg pick position for that card in that round. Highlight cells where a card's position shifts ≥ 2 spots vs. previous round (signals changing meta). Only show cards with data in ≥ 2 rounds.

---

## Section: `TechSection`

**Controls:** Color filter tabs: `All · Biotic · Propulsion · Cybernetic · Warfare · Unit`

**Main list (top 15 by researchCount, filtered by active color tab):**
Each row: color dot · tech name · `avgRoundFirstResearched` (formatted `"Rnd 2.1"` or `"—"` if null) · relative frequency bar · `winnerHeldRate` formatted as `"Won: 67%"` in accent color if ≥ 50%, ink-3 otherwise.

**Winner Possession sub-section:** Top 10 techs sorted by `winnerHeldRate` desc, with count `"N of M games"`. Small callout if a tech appears disproportionately (winnerHeldRate ≥ 0.67): kicker styled label `"Appears in most winning games"`.

---

## Section: `StatsSection`

**Headline grid (4 cells):** Total games · Avg duration (formatted `"4h 38m"`) · Avg winning VP · Avg players/game

**Mecatol Rex sub-section:** First claimer win rate as a prominent number + `"N of M games"` sub-label. Avg first claim round. Avg turnovers/game.

**Action Type Breakdown:** Horizontal bars (Tactical / Component / Pass) with percentages. If `actionTypeEvents` absent: show `"Re-upload game files to enable action tracking."` Below bars: two rows of top-3 leaders (Tactical Leaders · Component Leaders) as `FactionDot + name + avg/game`.

**VP Source Breakdown:** Horizontal bars showing share of total VP by source, sorted by sharePct desc. Labels use the `SOURCE_LABEL` map from `DashboardSection` (`OBJ`, `CUST`, `IMP`, etc.).

**Comeback / Collapse:** Single stat block: `"Round 3 leader wins: N of M games (X%)"`. If `gamesWithRound3Data === 0`: `"Requires 3+ rounds of data."` Small flavor note: whether the data suggests it's better to lead early or come from behind.

**Objective Timing:** Bar chart by round: total VP scored in each round. Label the peak round. Shows whether games are decided early or late.

**Hero Activations:** Rows of `FactionDot + faction name + hero name + "Rnd N avg" + "N/M games"`. Sorted by activationRate desc. If no hero data: `"No hero activation data recorded."`.

**Relic Activity:** Rows of `relic name + "Drawn N×" + "Played N×" + VP badge if grantsVp`. Sorted by drawnCount desc.

**Agenda Analysis:** Top 5 agendas by `|netVpSwing|` (most impactful). Each row: agenda name · pass rate · net VP swing (positive in accent, negative in cool). Note: `"Elect-type agendas excluded from pass rate."`.

---

## Firestore Adapter Addition

```ts
/** Returns all stored games, ordered by playedAt descending. */
export async function loadAllGames(): Promise<ParsedGame[]>
```

Implementation mirrors `listGames()` but returns full `ParsedGame` objects instead of `ParsedGameSummary`. Same `orderBy('playedAt', 'desc')` query.

---

## Navigation

### `App.tsx`

```tsx
<Route path="/meta" element={<MetaDashboardPage />} />
```

### `HomePage.tsx`

Below the masthead `<Mast>` component, before the archive section:

```tsx
<div style={{ marginBottom: '16px' }}>
  <Kicker>
    <a href="/meta" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
      League Stats →
    </a>
  </Kicker>
</div>
```

---

## Testing Strategy

- All pure functions in `src/lib/aggregator/` follow TDD (test first, minimum implementation, refactor).
- Each function has ≥ 1 negative test: empty games array, missing optional fields, `winner === null`.
- `MetaContext` tested with a mock `loadAllGames` that returns 2 fixture games.
- `sections.test.tsx` mirrors game-detail pattern: shell renders without provider; content renders with provider.
- Parser extension (`SELECT_ACTION`) tested with: known action types, unknown action type (no-op), missing action field (warning emitted).
- `deriveRoundBoundaries` tested with: normal case, single round, no reveals, multiple reveals same round.
- Coverage gate: `src/lib/aggregator/**` ≥ 90%.

---

## Sample-Size Honesty

With 6 games, correlations are illustrative. All stats that are win-rate correlations (Mecatol first-claimer win rate, winner tech possession, comeback rate) should display `"based on N games"` inline below the number. This label updates naturally as more games are uploaded — the app rewards continued use.

---

## Out of Scope (Phase 3.5)

- Player attribution / first-name opt-in
- Agent cadence (incomplete data in TI Assistant exports)
- Secondary abstain correlation
- "Was on track to win/lose" narrative analysis
