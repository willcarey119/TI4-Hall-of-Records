# Card-Based UI Redesign — Design Spec

## Overview

Replace flat list and table layouts across the Game Detail pages and Agenda tab with card-based designs. Each card is a self-contained fact unit: headline stat front-and-center, supporting context below. No layout changes to the Meta Dashboard (approved separately in meta-cards wireframe, deferred). No parser changes required — all data already exists in `ParsedGame`.

**Scope:** Three pages
1. Game Detail — Final Standings, Planets, Tech, Agenda sections
2. Agenda tab (`/agenda`) — cross-game aggregate vote summary

**Not in scope:** Meta Dashboard card redesigns (separate backlog item), any new analytics, parser changes.

---

## Architecture

No new data sources. All changes are UI-layer only, consuming `ParsedGame` fields that already exist:

| Data needed | Source |
|---|---|
| VP sources, objectives | `vpEvents`, `objectives` |
| Tech list + category + round | `techEvents` |
| Planet holdings + claim/lose events | `planetEvents` |
| Agenda votes, riders | `agendaResolutions` |
| Round boundaries | `strategyCardEvents` (via `deriveRoundBoundaries(strategyCardEvents, factions.length)`) |

One new aggregator helper is needed: **`buildTerritoryByRound(planetEvents, roundBoundaries)`** — reconstructs planet holdings per faction at end of each round. Returns `RoundTerritory[]`, one entry per round, each containing a map of `factionId → { planets: string[], res: number, inf: number, gained: string[], lost: string[] }`. This is a pure function that lives in `src/lib/aggregator/`.

All other data transformations happen inline in components (no new aggregator needed).

---

## Section 1 — Final Standings: Enhanced Faction Cards

**File:** `app/src/features/game-detail/RecapSection.tsx` (or a new `StandingsSection.tsx` if Recap is already large — check at implementation time)

### Layout
Three-column grid (2-col on narrow). One card per faction, sorted by final VP descending.

### Card structure (three stacked sections, separated by 1px rules)

**Top: VP summary**
- Rank badge (`#1 — 1st Place`, `#2`, etc.) — winner badge in `var(--accent)`
- Faction dot + name + player name
- Large VP number (`font-size: 28px`) + bar filled to VP threshold (`vpThreshold` field on `ParsedGame`)
- Source list: one row per `vpEvents` entry for this faction — source pip (color-coded by type) + objective name + point value
  - Pip colors: Stage I obj = `var(--ink-3)`, Stage II = `var(--ink-2)`, Secret = `var(--accent)`, Imperial = amber `#b06020`, Custodians = blue `var(--c-sol)`, SFT = teal `var(--c-naalu)`
- Winner gets diagonal ribbon (`position: absolute, rotate(45deg)`) + card `border-color: var(--ink-3) 1.5px`

**Middle: Technology snapshot**
- Label: `Technology · N total`
- Category pip count row: `[blue dot] 2 Prop · [red dot] 1 War · [yellow dot] 2 Cyb · [green dot] 1 Bio · [gray dot] 2 Fac`
- List of up to 2 named techs (last 2 by timestamp, i.e. most recently researched) + `+ N more` overflow
- Only `type === 'research'` events — starting techs excluded from count and list

**Bottom: Territory snapshot**
- Label: `Territory at game end`
- Three inline stats: `12 Res · 8 Inf · 6 Planets`
- Planet chips: compact inline chips for each planet held. Contested chip (`border: 1px solid var(--accent)`, red text) for planets that changed hands during the game. Legendary chip (gold border). Mecatol chip normal. Overflow: `+ N more` chip if > 6 planets.

---

## Section 2 — Territory at Game End: Detailed Cards

**File:** `app/src/features/game-detail/PlanetsSection.tsx`

Replace the current flat planet list with a 3-column card grid, one card per faction.

### Card structure
- Header: faction dot + name + player name
- Stats row: `Resources N · Influence N · Planets held N`
- Planet chip list (full, no overflow truncation here): normal / contested (red border) / legendary (gold border)

Contested = planet appears in `planetEvents` more than once across the game (changed hands).

---

## Section 3 — Planet Control by Round: Interactive Slideshow

**File:** `app/src/features/game-detail/PlanetsSection.tsx` (new sub-section above or below the card grid)

### New aggregator

```typescript
// src/lib/aggregator/buildTerritoryByRound.ts
export interface FactionRoundTerritory {
  factionId: string;
  planets: string[];
  res: number;
  inf: number;
  gained: string[];  // captured this round
  lost: string[];    // lost this round
}

export interface RoundTerritory {
  round: number;
  factions: FactionRoundTerritory[];
}

export function buildTerritoryByRound(
  planetEvents: PlanetEvent[],
  roundBoundaries: RoundBoundary[],
  factions: ParsedFaction[],
): RoundTerritory[]
```

Algorithm:
1. Start from each faction's `startingPlanets` as their initial holdings
2. For each round boundary, filter `planetEvents` to `timestamp ≤ roundEnd`
3. Replay events in timestamp order to get current holdings per faction
4. Diff against previous round state to compute `gained` / `lost`
5. Compute `res` / `inf` totals from `PLANET_DATA` lookup (same lookup used in `PlanetsSection`)

### UI: Slideshow controls
- Play/pause button (▶ / ⏸), round pip track (R1–RN), speed selector (Slow 2.5s / Normal 1.5s / Fast 0.8s)
- Auto-advances; pauses at last round; resets to R1 on re-play from end
- Round heading: `Round N` (large serif) + subtitle from notable events that round (Mecatol changes, objectives scored)
- Progress bar (thin 2px line below controls, fills left-to-right)

### UI: Per-round faction cards
- Same card layout as Section 2 (faction dot, name, Res/Inf stats)
- **Gained planets:** green background chip, `▲ Gained` flag at right
- **Lost planets:** red strikethrough chip, `▼ Lost` flag at right, opacity 0.7
- **Change badge** top of card body if any movement: `+2 gained`, `−1 lost`, `+1 / −1` — color matches net direction
- Card `border-color: var(--ink-3)` when any change occurred this round
- CSS `transition: background 0.3s` on planet rows for smooth highlight-in

### State management
```typescript
// React state in PlanetsSection
const [round, setRound] = useState(0);
const [playing, setPlaying] = useState(false);
// useEffect for interval; cleanup on unmount
```

---

## Section 4 — Research Order: Faction Cards

**File:** `app/src/features/game-detail/TechSection.tsx`

Replace current flat ordered list with a 3-column card grid, one card per faction.

### Card structure
- Header: faction dot + name + player name
- Sequential numbered list (`1`, `2`, `3` …) of techs in research order (by `techEvent.timestamp`)
  - Each row: seq number + category pip + tech name + round label (`R1`, `R2`, etc.)
  - Round derived from `techEvent` timestamp vs. round boundaries
- Divider: `— Starting Techs —` (dimmed, `opacity: 0.45`)
- Starting techs listed below divider with `—` instead of sequence number, no round label

Category pip colors: blue = Propulsion, red = Warfare, yellow = Cybernetic, green = Biotic, gray = Faction Tech.

Tech category legend row below the grid.

---

## Section 5 — Mecatol Rex Widget: Enhanced

**File:** `app/src/features/game-detail/PlanetsSection.tsx`

Extends the existing Mecatol strip into a card-like widget:

### Header bar
- Title: `Mecatol Rex` + three inline stats: `N Turnovers · [faction name] Final Holder · R[n] First Claimed`

### Round-by-round strip
- One column per round (same as existing strip but with richer cells)
- Each cell: faction color dot + short faction name + event badge (`Captured` / `Retaken` / `Held`)
- Unclaimed rounds: ghost/dim `— Unclaimed`

### Change log (below strip)
- `Round N` tag + narrative sentence: "**Faction** seized Mecatol Rex from **Faction**."
- First claim includes "— Custodians VP awarded."
- One entry per handoff

---

## Section 6 — Agenda Game Detail: Per-Game Vote Cards

**File:** `app/src/features/game-detail/AgendaSection.tsx`

Replace flat agenda list with one card per resolved agenda.

### Card structure

**Header**
- Type badge: `Law` (gold), `Directive` (gray), `Elect · Player` (blue)
- Agenda name (serif, 14px bold)
- Outcome badge: `Passed — For` (green) / `Failed — Against` (red) / `Elected: [Name]` (blue)
- Effect text (italic, 10px)
- Round label: `Round N · Agenda N` (top right)

**Body — For/Against agendas**
- One row per faction: faction dot + name + horizontal vote bar (width = votes cast / max votes in this game, proportional)
  - Green bar = voted For, red bar = voted Against, gray = abstained
  - Label inside bar if wide enough: `N For` / `N Against`
  - Right tag: `Won` / `Lost` (green/red chip) or `Rider` (blue chip) or `Abstained` (faint)
- Total row: `17 For · 12 Against`

**Body — Elect-type agendas**
- Header note: `Votes cast for each candidate`
- Same bar format but bars represent votes toward each candidate (descending)
- Elected candidate gets `Elected` badge

**Footer — VP beneficiary strip** (only when `vpEvents` has agenda-sourced entries)
- `VP Awarded:` label + faction chips: `[dot] Hacan +1`, `[dot] Letnev −1`

Vote legend row above the card list: For = green, Against = red, Abstain = gray, Rider = blue.

---

## Section 7 — Agenda Tab: Political Bar Chart

**File:** `app/src/features/agenda/AgendaPage.tsx` (the `/agenda` route)

New section (or replaces existing aggregate view): "Agenda Resolution Record"

### Political bar chart

One row per agenda that has appeared in our games. Rows sorted by descending For% (most passed at top).

**Row layout (3 columns via CSS grid):**
- Name column (200px): agenda name + type badge + `N appearances`
- Bar column (flex): unified 100%-wide bar track
  - Green segment anchored at left edge (width = For% of total votes cast)
  - Red segment anchored at right edge (width = Against% of total votes cast)
  - Center hairline at exactly 50% (`::after` pseudo-element, 1px `var(--ink-3)`)
  - Labels inside segment if wide enough; fallback to outside labels below track
- Outcome column (64px): outcome badge (`Passed N/M` / `Failed N/M`) + times passed / total appearances

**Elect-type rows:** skip the bar; show most-elected faction chips inline in bar column.

**Filter chips above table:** All / Law / Directive / Usually Passes / Usually Fails / Contested

**Axis labels row above table:**
- `← For` (green, right-aligned in left half)
- `50%` (centered)
- `Against →` (red, left-aligned in right half)

### Data source
`AgendaPage` already receives `agendaResolutions` from context. New aggregator helper `buildAgendaVoteSummary(agendaResolutions)` returns per-agenda aggregate:

```typescript
interface AgendaVoteSummary {
  agenda: string;
  type: 'law' | 'directive' | 'elect';
  appearances: number;
  totalForVotes: number;
  totalAgainstVotes: number;
  forPct: number;    // 0–1
  againstPct: number;
  passCount: number; // times resolved For / elected
  modalOutcome: 'passed' | 'failed' | 'split';
  // elect-type only:
  topElected?: { factionId: string; count: number }[];
}
```

This aggregator lives in `src/lib/aggregator/buildAgendaVoteSummary.ts`.

---

## Shared Components

No new shared primitives needed. The planet chip and faction card patterns are repeated across sections — acceptable duplication given YAGNI (each section has slightly different chip behavior). If a `PlanetChip` component emerges naturally during implementation, extract it.

---

## Data Dependencies Summary

| Section | New data needed | Source |
|---|---|---|
| Final Standings | none | `vpEvents`, `techEvents`, `planetEvents` |
| Territory cards | none | `planetEvents` |
| Planet slideshow | `buildTerritoryByRound()` | `planetEvents` + `strategyCardEvents` (round boundaries) |
| Research cards | round-per-tech | `techEvents` + round boundaries |
| Mecatol widget | none (existing) | `planetEvents` |
| Per-game vote cards | none | `agendaResolutions`, `vpEvents` |
| Political bar chart | `buildAgendaVoteSummary()` | cross-game `agendaResolutions` |

---

## Visual Design Constraints

All components use existing design tokens — no new CSS variables. Font stack unchanged (Newsreader for headings/names, IBM Plex Mono for stats/labels, IBM Plex Sans for body). Card backgrounds: `var(--paper-2)` default, `var(--paper-3)` for hover where applicable.

Color semantics:
- `var(--accent)` = winner / highlight — do not use for general decoration
- `#2a6e3a` / `#d8f0dc` = For / gained (green)
- `#a02020` / `#f5d8d8` = Against / lost (red)
- `#c8a060` / `#ede0c8` = legendary planet (gold)

---

## Testing

- **`buildTerritoryByRound`**: TDD. Tests cover: round 1 = starting planets, mid-game gains, mid-game losses, planets that change hands twice in one round (last event wins), empty planet events (all starting planets held throughout).
- **`buildAgendaVoteSummary`**: TDD. Tests cover: For/Against split, elect-type (no votes to split), 0-vote edge case, multiple appearances of same agenda.
- **UI sections**: React Testing Library. Test that cards render for each faction, that gained/lost chips appear on correct rounds, that political bar renders correct width proportions.

---

## File Map

| File | Change |
|---|---|
| `src/lib/aggregator/buildTerritoryByRound.ts` | **Create** |
| `src/lib/aggregator/buildTerritoryByRound.test.ts` | **Create** |
| `src/lib/aggregator/buildAgendaVoteSummary.ts` | **Create** |
| `src/lib/aggregator/buildAgendaVoteSummary.test.ts` | **Create** |
| `src/features/game-detail/RecapSection.tsx` | Faction snapshot cards |
| `src/features/game-detail/PlanetsSection.tsx` | Territory cards + slideshow + Mecatol widget |
| `src/features/game-detail/TechSection.tsx` | Research order faction cards |
| `src/features/game-detail/AgendaSection.tsx` | Per-game vote cards |
| `src/features/agenda/AgendaPage.tsx` | Political bar chart section |
