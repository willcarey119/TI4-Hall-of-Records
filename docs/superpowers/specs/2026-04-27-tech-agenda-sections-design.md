# Tech & Agenda Sections — Design Spec

## Goal

Add two new top-level scroll sections to the single-game detail page — **Tech** and **Agenda** — and provide matching aggregate views in the Phase 3 meta-dashboard. Both views use identical visual templates; the only difference is the unit of data (one game vs. all games).

## Architecture

### Placement

Six scroll sections total in `game-detail/ScrollBody`:

```
VP Race · Timeline · Dashboard · Planets · Tech · Agenda
```

The `FrozenHeader` nav gains two buttons: **Tech** and **Agenda**. `SECTION_IDS` in `ScrollBody.tsx` expands from 4 to 6 entries.

### New files

| File | Purpose |
|---|---|
| `src/lib/parser/agendas.ts` | Static dictionary: agenda name → `AgendaEntry` |
| `src/lib/tech/buildTechSummary.ts` | Pure fn: single game tech display data |
| `src/lib/tech/buildMetaTechSummary.ts` | Pure fn: cross-game tech aggregation |
| `src/lib/agenda/buildAgendaSummary.ts` | Pure fn: single game agenda display data |
| `src/lib/agenda/buildMetaAgendaSummary.ts` | Pure fn: cross-game agenda aggregation |
| `src/features/game-detail/TechSection.tsx` | Game-level tech section |
| `src/features/game-detail/AgendaSection.tsx` | Game-level agenda section |
| `src/features/meta-dashboard/MetaTechSection.tsx` | Meta-level tech section |
| `src/features/meta-dashboard/MetaAgendaSection.tsx` | Meta-level agenda section |

### Modified files

- `src/features/game-detail/ScrollBody.tsx` — add `TechSection`, `AgendaSection`
- `src/features/game-detail/FrozenHeader.tsx` — add Tech + Agenda nav buttons
- `src/features/game-detail/sections.test.tsx` — add section stub tests

---

## Data Sources

All data already exists in `ParsedGame`:

- `techEvents: TechEvent[]` — type `'research' | 'starting' | 'remove' | 'purge'`
- `factions: FactionSetup[]` — `startingTechs: string[]` per faction
- `agendaResolutions: AgendaResolution[]` — agenda name, outcome, round, votes `{ faction, outcome, votes }[]`, riders

The distinction between **researched** and **started with** is `TechEvent.type`:
- `'starting'` = faction starting tech (free, not a player choice)
- `'research'` = actively researched during the game

---

## Agenda Dictionary (`src/lib/parser/agendas.ts`)

Static lookup keyed on agenda name string (exact match to what `agendaResolutions[i].agenda` produces from TI Assistant exports).

```ts
export type AgendaExpansion = 'base' | 'pok';
export type AgendaElect =
  | 'player'
  | 'scored-secret-objective'
  | 'law'
  | 'strategy-card'
  | 'hazardous-planet'
  | 'cultural-planet'
  | 'industrial-planet'
  | 'non-home-planet'
  | 'planet'
  | null;

export interface AgendaEntry {
  type: 'law' | 'directive';
  elect: AgendaElect;
  /** FOR effect text — present when elect is null (vote FOR/AGAINST) */
  forEffect?: string;
  /** AGAINST effect text — present when elect is null */
  againstEffect?: string;
  /** Single effect text — present when elect is non-null */
  effect?: string;
  /** Extra context (e.g. "when this agenda is revealed…" trigger text) */
  trigger?: string;
  expansion: AgendaExpansion;
  /** True if this base-game card was removed when PoK is in play */
  removedInPok?: boolean;
}

export const AGENDAS: Record<string, AgendaEntry> = { ... };

export function lookupAgenda(name: string): AgendaEntry | null {
  return AGENDAS[name] ?? null;
}
```

The dictionary covers all 50 base-game agendas plus the 13 PoK additions (26 net cards — 13 removed, 13 added). Cards removed in PoK are flagged `removedInPok: true` so the UI can note the expansion context when they appear in older recordings.

If `lookupAgenda` returns `null` (unknown agenda name, future expansion content, or data entry typo), the UI renders the agenda record without the effect text block rather than crashing.

---

## Tech Section — Game View (`TechSection.tsx`)

### Pure function: `buildTechSummary(techEvents, factions, phaseSnapshots)`

`phaseSnapshots` is required to derive round labels: each `TechEvent.timestamp` is bucketed into a round by finding the last `PhaseSnapshot` with `timestamp ≤ event.timestamp`.

```ts
interface TechTimelineEntry {
  round: number;       // derived from phaseSnapshots
  factionId: string;
  tech: string;
  color: 'yellow' | 'blue' | 'red' | 'green' | 'unit';
  type: 'research' | 'starting';
}

interface FactionTechInventory {
  factionId: string;
  techs: Array<{
    tech: string;
    color: 'yellow' | 'blue' | 'red' | 'green' | 'unit';
    origin: 'research' | 'starting';
  }>;
}

interface TechSummary {
  timeline: TechTimelineEntry[];      // 'research' events only, ascending by timestamp
  inventories: FactionTechInventory[]; // one per faction, ordered by mapPosition; includes starting techs
  totalResearched: number;
  totalStarting: number;
}
```

### Layout

```
Kicker:  "Technology · This Game"  |  "{N} researched"
Headline: "The arms race."
Deck:    [computed: "{Faction with most researched techs} led the tech race with {N} technologies researched." Falls back to "N technologies researched across M factions." if all factions are tied.]
═══ double rule ═══

LABEL: Research Order
│  R2  [faction dot]  Tech Name  [color pip]
│  R2  [faction dot]  Tech Name  [color pip]
│  R3  [faction dot]  Tech Name  [color pip]
│  …
─── rule ───

LABEL: Final Inventories
[faction dot] Faction Name          N techs
  [pip] Tech  [pip] Tech  [pip] Tech  …
─── rule ───
[faction dot] Faction Name          N techs
  …
```

- Research Order feed: left border in `var(--cool)` (blue). Each row: `grid-template-columns: 28px 1fr 8px` — round label | faction+name | color pip.
- Final Inventories: starting techs show a small mono `start` badge (blue border, blue text) inline after the tech name.
- Color pips: yellow = `var(--gold)`, blue = `var(--cool)`, red = `var(--accent)`, green = `var(--moss)`, unit = `var(--ink-2)`.

---

## Tech Section — Meta View (`MetaTechSection.tsx`)

### Pure function: `buildMetaTechSummary(games: ParsedGame[])`

```ts
interface MetaTechEntry {
  tech: string;
  color: 'yellow' | 'blue' | 'red' | 'green' | 'unit';
  gamesResearched: number;   // how many of N games this tech was actively researched
  totalGames: number;        // N
  topFaction: string;        // factionId most frequently researching this tech
  topFactionCount: number;
}

interface MetaFactionTechInventory {
  factionId: string;
  avgTechsPerGame: number;
  techs: Array<{
    tech: string;
    color: 'yellow' | 'blue' | 'red' | 'green' | 'unit';
    origin: 'research' | 'starting';
    gamesWithTech: number;
    totalGamesPlayed: number;   // games this faction appeared in
  }>;
}

interface MetaTechSummary {
  topResearched: MetaTechEntry[];    // sorted by gamesResearched desc
  topStarting: MetaTechEntry[];      // starting techs sorted by gamesStarted desc
  factionInventories: MetaFactionTechInventory[];
  totalGames: number;
}
```

### Layout

Same overall structure as game view. The "Research Order" feed is replaced by a two-part "Most Researched" section:

```
LABEL: Researched in-game          [blue left border]
│  [pip] Tech Name    [X/N games callout]  [most: Faction N× callout]
│  …

LABEL: Started with (faction)      [yellow left border]
│  [pip] Tech Name    [X/N games callout]  [faction name callout]
│  …
─── rule ───

LABEL: Per-Faction Totals
[faction dot] Faction Name          avg N.N techs/game
  [pip] Tech [start badge?] [X/N callout]  [pip] Tech [X/N callout]  …
```

Callout pills: two variants —
- `callout` (grey border): standard frequency `6/6 games`, `most: Hacan 5×`
- `callout-accent` (vermillion border): used when a tech or agenda appears in **every** game (`6/6`)

---

## Agenda Section — Game View (`AgendaSection.tsx`)

### Pure function: `buildAgendaSummary(agendaResolutions, lookupAgenda)`

```ts
interface AgendaDisplayEntry {
  round: number;
  indexInRound: 1 | 2;
  agenda: string;
  entry: AgendaEntry | null;       // null = not in dictionary
  outcome: string;                  // winning outcome string
  passed: boolean;                  // for FOR/AGAINST agendas
  electedFaction?: string;          // for elect-player agendas
  totalFor: number;
  totalAgainst: number;
  votes: AgendaVote[];
  riders: AgendaRider[];
}
```

### Layout

```
Kicker:  "The Galactic Senate · Record"  |  "{N} agendas · {M} passed"
Headline: "Laws of the Realm."
Deck:    [computed: "{AgendaName} passed/failed, {beneficiary faction} the net beneficiary." Uses the agenda with the largest absolute VP delta. Falls back to "N agendas resolved, M passed." if no agenda produced a VP event.]
═══ double rule ═══

LABEL: Round N · Agenda I
"Agenda Name."                    ← italic Newsreader 700
[LAW|DIR tag]  [PASSED|failed]  [N for · M against]   ← or "Elect: Player · X elected"

┌─ tinted effect block ──────────────────────────────────┐
│ FOR:    effect text (serif, ink-2)                      │
│ AGAINST: effect text                                    │
│ — or —                                                  │
│ ELECT PLAYER · EFFECT: text                            │
└────────────────────────────────────────────────────────┘

  FOR · N          AGAINST · M
  [dot] Faction  V    [dot] Faction  V
  [dot] Faction  V    [dot] Faction  V

─── rule ───

LABEL: Round N · Agenda II
…

─── rule (after all agendas) ───

LABEL: Net Beneficiaries
[Faction +N]  [Faction +N]  [Faction −N]
```

**Effect block styling:**
- Background: `var(--paper-2)`, left border: `2px solid var(--ink-4)`
- `FOR:` label: `var(--accent)`, monospace 8px uppercase
- `AGAINST:` label: `var(--cool)`, monospace 8px uppercase
- `ELECT … · EFFECT:` label: `var(--ink-3)`, monospace 8px uppercase
- Effect text: serif 10px, `var(--ink-2)`, line-height 1.5

**Unknown agendas:** if `lookupAgenda` returns null, the effect block is omitted entirely. The vote breakdown and outcome still render.

**Elected agendas** (elect ≠ null): FOR/AGAINST columns become "FOR [Candidate]" columns, one per candidate who received votes, showing which factions voted for each.

---

## Agenda Section — Meta View (`MetaAgendaSection.tsx`)

### Pure function: `buildMetaAgendaSummary(games: ParsedGame[], lookupAgenda)`

```ts
interface MetaAgendaEntry {
  agenda: string;
  entry: AgendaEntry | null;
  appearances: number;
  passed: number;           // times outcome was FOR / non-zero elect
  failed: number;
  avgFor: number;
  avgAgainst: number;
  factionVotingPatterns: Array<{
    factionId: string;
    avgVotesFor: number;
    avgVotesAgainst: number;
    timesVotedFor: number;
    timesVotedAgainst: number;
    timesElected?: number;   // for elect-player agendas
    totalAppearances: number;
  }>;
}

interface MetaAgendaSummary {
  agendas: MetaAgendaEntry[];          // sorted by appearances desc, then name asc
  netBeneficiaries: Array<{ factionId: string; vpDelta: number }>;
  totalGames: number;
}
```

### Layout

Same visual template as game view. Each agenda entry replaces single-game data with aggregate data:

```
LABEL: Agenda Name
[LAW|DIR tag]  [passed N/M games callout]  avg N for · M against

┌─ effect block (identical text to game view) ────────────┐
│ …                                                        │
└──────────────────────────────────────────────────────────┘

  FOR · avg N          AGAINST · avg M
  [dot] Faction  avg V  [X/M callout]
  …

─── rule ───
```

For elect-player agendas, the vote columns become:

```
MOST ELECTED
[dot] Faction  [X/M games callout]
[dot] Faction  [X/M games callout]
```

**Callout variants:**
- `callout-accent` (vermillion): agenda passed in every appearance (e.g. `passed 4/4 games`)
- `callout` (grey): standard frequency

---

## Design Tokens (no new tokens needed)

All visuals use existing `wireframes.css` tokens:
- `var(--paper)`, `var(--paper-2)` — backgrounds
- `var(--ink)`, `var(--ink-2)`, `var(--ink-3)`, `var(--ink-4)` — text hierarchy
- `var(--accent)` — FOR votes, vermillion callouts
- `var(--cool)` — AGAINST votes, blue accents
- `var(--gold)` — yellow tech pips
- `var(--moss)` — green tech pips
- `var(--rule)` — borders and rules

---

## Roadmap Placement

| Phase | Deliverable |
|---|---|
| **Phase 2** | `agendas.ts` dictionary, `TechSection`, `AgendaSection`, nav additions |
| **Phase 3** | `buildMetaTechSummary`, `buildMetaAgendaSummary`, `MetaTechSection`, `MetaAgendaSection` in meta-dashboard |

The dictionary (`agendas.ts`) is built in Phase 2 since the game-level view needs it. Phase 3 consumes the same dictionary — no duplication.

---

## Acceptance Criteria

### Phase 2 (game-level)

1. Tech section appears as section 5 in the scroll body; FrozenHeader shows a "Tech" nav button.
2. Research Order feed shows all `type: 'research'` tech events in chronological order, with round labels, faction dots, and color pips.
3. Final Inventories show all factions; starting techs carry a `start` badge distinct from researched techs.
4. Agenda section appears as section 6; FrozenHeader shows an "Agenda" nav button.
5. Each `AgendaResolution` renders with: italic headline, LAW/DIR tag, passed/failed status, vote counts, FOR/AGAINST columns with per-faction rows.
6. If the agenda name matches the dictionary, the tinted effect block renders with correct FOR/AGAINST (or ELECT/EFFECT) text.
7. If the agenda name is unknown, the record renders without the effect block — no crash, no empty block.
8. Net Beneficiaries strip at the bottom of the Agenda section reflects **VP deltas only** (not trade goods or other economic effects), sourced from `vpEvents` with `source: 'agenda'`. Factions with no agenda-sourced VP events are omitted from the strip.
9. All new section stubs have `id` attributes and `data-section` dataset entries; `ScrollBody` observer test count updates to 6.
10. `npm run typecheck && npm run lint && npm test` all pass.

### Phase 3 (meta-level)

11. MetaTechSection "Researched in-game" and "Started with" sub-lists are populated from separate buckets of `TechEvent.type`.
12. Per-faction inventory in meta view shows `X/N games` callout per tech; `start` badge present on starting techs.
13. MetaAgendaSummary aggregates by unique agenda name across all games.
14. Vote breakdown in meta view shows averages; per-faction frequency callouts present.
15. `callout-accent` (vermillion) appears only when an agenda passed in every game it appeared in.
16. Net Beneficiaries in meta view is a cumulative sum across all games.
17. All new pure functions have ≥ 90% test coverage.
