# Phase 5a — Critical Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four confirmed bugs that display wrong data: VP threshold key mismatch causing wrong VP line and recap prose, Dashboard showing source abbreviations instead of objective names, planet inventories missing home-system starting planets, and VP chart not rendering lines for 0-VP factions.
**Architecture:** One shared helper (`getVictoryPointThreshold`) centralizes VP threshold reads and fixes all three consumers (VP timeline, dashboard, recap). The other three bugs are independent fixes in their respective lib functions and one UI component. All lib changes follow TDD (Red → Green → Refactor).
**Tech Stack:** TypeScript, React 19, Vitest. No new dependencies.

---

## File Map

| File | Action | Purpose |
|------|---------|---------|
| `app/src/lib/parser/options.ts` | Create | `getVictoryPointThreshold(options)` helper |
| `app/src/lib/parser/options.test.ts` | Create | Tests for the helper |
| `app/src/lib/vp/buildVpTimeline.ts` | Modify | Use `getVictoryPointThreshold`; add terminal point to each series |
| `app/src/lib/vp/buildVpTimeline.test.ts` | Modify | Update affected assertions; add terminal point tests |
| `app/src/lib/dashboard/buildDashboardSummary.ts` | Modify | Use `getVictoryPointThreshold`; seed `finalPlanetOwner` with `startingPlanets` |
| `app/src/lib/dashboard/buildDashboardSummary.test.ts` | Modify | Add test for startingPlanet planet counts |
| `app/src/lib/planets/buildPlanetSummary.ts` | Modify | Seed `finalOwner` with `startingPlanets` before walking events |
| `app/src/lib/planets/buildPlanetSummary.test.ts` | Modify | Add tests for starting planet inventory |
| `app/src/lib/recap/buildRecapSummary.ts` | Modify | Use `getVictoryPointThreshold` |
| `app/src/features/game-detail/DashboardSection.tsx` | Modify | Remove `SOURCE_LABEL`; render `obj.objective` as chip text |

---

## Task 1 — `getVictoryPointThreshold` helper + fix three lib consumers

**Files:**
- Create: `app/src/lib/parser/options.ts`
- Create: `app/src/lib/parser/options.test.ts`
- Modify: `app/src/lib/vp/buildVpTimeline.ts`
- Modify: `app/src/lib/dashboard/buildDashboardSummary.ts`
- Modify: `app/src/lib/recap/buildRecapSummary.ts`

> **Context:** Real TI Assistant exports store the victory threshold as `options['victory-points']` (kebab-case key). All three lib functions currently read `options['victoryPoints']` (camelCase), which is always `undefined` in real data, causing them to fall back to 10. For any game played at a non-default threshold (8 VP, 12 VP, 14 VP) the VP race chart draws the victory line at 10, the recap states the wrong threshold in prose, and the dashboard marks winners wrong. The fix is a single shared helper that reads both key variants (kebab-case preferred, camelCase fallback for existing test fixtures).

### Steps

- [ ] **Step 1: Write failing tests for `getVictoryPointThreshold`**

Create `app/src/lib/parser/options.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getVictoryPointThreshold } from './options';

describe('getVictoryPointThreshold', () => {
  it('reads kebab-case key from real TI Assistant exports', () => {
    expect(getVictoryPointThreshold({ 'victory-points': 14 })).toBe(14);
  });

  it('reads camelCase key from legacy test fixtures', () => {
    expect(getVictoryPointThreshold({ victoryPoints: 8 })).toBe(8);
  });

  it('defaults to 10 when neither key is present', () => {
    expect(getVictoryPointThreshold({})).toBe(10);
  });

  it('defaults to 10 when value is not a number', () => {
    expect(getVictoryPointThreshold({ 'victory-points': 'ten' })).toBe(10);
  });

  it('prefers kebab-case over camelCase when both present', () => {
    expect(getVictoryPointThreshold({ 'victory-points': 12, victoryPoints: 10 })).toBe(12);
  });
});
```

Run:
```
cd "D:\_TI4 App\app"
npm test -- options.test
```
Expected: FAIL — module not found.

- [ ] **Step 2: Implement `options.ts`**

Create `app/src/lib/parser/options.ts`:

```ts
export function getVictoryPointThreshold(options: Record<string, unknown>): number {
  const v = options['victory-points'] ?? options['victoryPoints'];
  return typeof v === 'number' ? v : 10;
}
```

- [ ] **Step 3: Run tests — verify pass**

```
cd "D:\_TI4 App\app"
npm test -- options.test
```
Expected: 5/5 pass.

- [ ] **Step 4: Update `buildVpTimeline.ts` to use the helper**

In `app/src/lib/vp/buildVpTimeline.ts`, add the import after the existing import on line 1:

```ts
import { getVictoryPointThreshold } from '../parser/options';
```

Replace lines 33–34:
```ts
  const raw = options['victoryPoints'];
  const victoryPoints = typeof raw === 'number' ? raw : 10;
```
with:
```ts
  const victoryPoints = getVictoryPointThreshold(options);
```

- [ ] **Step 5: Update `buildDashboardSummary.ts` to use the helper**

In `app/src/lib/dashboard/buildDashboardSummary.ts`, add the import after the existing imports:

```ts
import { getVictoryPointThreshold } from '../parser/options';
```

Replace lines 41–42:
```ts
  const raw = options['victoryPoints'];
  const victoryPoints = typeof raw === 'number' ? raw : 10;
```
with:
```ts
  const victoryPoints = getVictoryPointThreshold(options);
```

- [ ] **Step 6: Update `buildRecapSummary.ts` to use the helper**

In `app/src/lib/recap/buildRecapSummary.ts`, add the import after the existing import on line 1:

```ts
import { getVictoryPointThreshold } from '../parser/options';
```

Replace lines 24–25:
```ts
  const raw = game.options['victoryPoints'];
  const victoryPoints = typeof raw === 'number' ? raw : 10;
```
with:
```ts
  const victoryPoints = getVictoryPointThreshold(game.options);
```

- [ ] **Step 7: Typecheck and full test suite**

```
cd "D:\_TI4 App\app"
npm run typecheck && npm test
```
Expected: no type errors, all existing tests still pass. The helper reads `victoryPoints` (camelCase) as fallback, so existing test fixtures that pass `{ victoryPoints: 10 }` continue to work without changes.

- [ ] **Step 8: Commit**

```bash
git add app/src/lib/parser/options.ts \
        app/src/lib/parser/options.test.ts \
        app/src/lib/vp/buildVpTimeline.ts \
        app/src/lib/dashboard/buildDashboardSummary.ts \
        app/src/lib/recap/buildRecapSummary.ts
git commit -m "fix: centralize getVictoryPointThreshold — reads real export key victory-points"
```

---

## Task 2 — VP chart: add terminal points so all factions render

**Files:**
- Modify: `app/src/lib/vp/buildVpTimeline.ts`
- Modify: `app/src/lib/vp/buildVpTimeline.test.ts`

> **Context:** The VP chart's `FactionPath` component returns null when a series has fewer than 2 points. Every faction gets exactly one anchor point `(gameTimeSeconds=0, cumulativeVp=0)` at initialization. A faction that scores 0 VP has only that anchor and never renders — producing the blank/partial chart the user sees. Fix: after the event-processing loop, push a terminal point at `(gameDurationSeconds, finalVp)` onto every faction's series. This guarantees every series has at least 2 points and that all lines extend to the right edge of the chart.
>
> **Existing tests that need updating:**
> - Line 43: `expect(sol?.points.map(p => p.cumulativeVp)).toEqual([0, 1, 3])` → must become `[0, 1, 3, 7]` (Sol's `finalVp` is 7; terminal point appended)
> - Line 45: `expect(hacan?.points.map(p => p.cumulativeVp)).toEqual([0, 3])` → must become `[0, 3, 10]`
> - Lines 75–78 (`'silently drops VP events for unregistered factions'`): asserts `points.toHaveLength(1)` → must become `toHaveLength(2)` because the anchor + terminal now exist for all registered factions even when no events occur
>
> **Tests that are unaffected:**
> - Line 81–87 (`gameTimeSeconds` test): checks indices `[1]` and `[2]` which are event points — the terminal is appended at `[3]` and does not shift earlier entries

### Steps

- [ ] **Step 1: Update affected assertions and add terminal point tests in `buildVpTimeline.test.ts`**

Open `app/src/lib/vp/buildVpTimeline.test.ts`.

**Update the existing `'builds cumulative VP series from events in order'` test (lines 35–46)** — replace the `toEqual` assertions to include the terminal point:

```ts
  it('builds cumulative VP series from events in order', () => {
    const events = [
      makeVpEvent('Sol', 1, 100),
      makeVpEvent('Sol', 2, 200),
      makeVpEvent('Hacan', 3, 300),
    ];
    const result = buildVpTimeline(events, FACTIONS, SCORES, OPTIONS, 3600);
    const sol = result.series.find(s => s.factionId === 'Sol');
    // anchor(0) + event(1) + event(3) + terminal(7) = 4 points
    expect(sol?.points.map(p => p.cumulativeVp)).toEqual([0, 1, 3, 7]);
    const hacan = result.series.find(s => s.factionId === 'Hacan');
    // anchor(0) + event(3) + terminal(10) = 3 points
    expect(hacan?.points.map(p => p.cumulativeVp)).toEqual([0, 3, 10]);
  });
```

**Update the `'silently drops VP events for unregistered factions'` test (lines 70–79)** — series now have anchor + terminal = 2 points:

```ts
  it('silently drops VP events for unregistered factions', () => {
    const events = [makeVpEvent('Unknown', 5, 100)];
    const result = buildVpTimeline(events, FACTIONS, SCORES, OPTIONS, 3600);
    expect(result.series).toHaveLength(2);
    // Each registered faction has anchor + terminal; the unknown faction's event is discarded
    for (const s of result.series) {
      expect(s.points).toHaveLength(2);
      expect(s.points[0]?.cumulativeVp).toBe(0);
    }
  });
```

**Add a new `describe('terminal point', ...)` block** after the closing `});` of the existing `describe('buildVpTimeline', ...)` block but before the `describe('editorialProse and headline wording', ...)` block:

```ts
describe('terminal point', () => {
  it('every series ends at gameTimeSeconds equal to gameDurationSeconds', () => {
    const result = buildVpTimeline([], FACTIONS, SCORES, OPTIONS, 3600);
    for (const s of result.series) {
      const last = s.points[s.points.length - 1];
      expect(last?.gameTimeSeconds).toBe(3600);
    }
  });

  it('terminal point cumulativeVp matches finalVp', () => {
    const result = buildVpTimeline([], FACTIONS, SCORES, OPTIONS, 3600);
    for (const s of result.series) {
      const last = s.points[s.points.length - 1];
      expect(last?.cumulativeVp).toBe(s.finalVp);
    }
  });

  it('a faction with no VP events has exactly 2 points: anchor and terminal', () => {
    // Sol has finalVp=7 but no events — should still get anchor + terminal
    const result = buildVpTimeline([], FACTIONS, SCORES, OPTIONS, 3600);
    const sol = result.series.find(s => s.factionId === 'Sol');
    expect(sol?.points).toHaveLength(2);
    expect(sol?.points[0]?.cumulativeVp).toBe(0);
    expect(sol?.points[1]?.cumulativeVp).toBe(7);
  });

  it('a faction with VP events has anchor + events + terminal', () => {
    const events = [
      makeVpEvent('Sol', 3, 100),
      makeVpEvent('Sol', 4, 200),
    ];
    const result = buildVpTimeline(events, FACTIONS, SCORES, OPTIONS, 3600);
    const sol = result.series.find(s => s.factionId === 'Sol');
    // anchor(0) + event(3) + event(7) + terminal(7) = 4 points
    expect(sol?.points).toHaveLength(4);
    expect(sol?.points[3]?.gameTimeSeconds).toBe(3600);
    expect(sol?.points[3]?.cumulativeVp).toBe(7);
  });
});
```

Run:
```
cd "D:\_TI4 App\app"
npm test -- buildVpTimeline
```
Expected: the updated cumulative assertions and new terminal point tests FAIL (terminal points not yet added to the implementation).

- [ ] **Step 2: Add terminal points in `buildVpTimeline.ts`**

In `app/src/lib/vp/buildVpTimeline.ts`, after the closing `}` of the `for (const event of vpEvents)` loop (currently line 58) and before the `// Build series ordered by mapPosition` comment (currently line 61), insert:

```ts
  // Add a terminal point at game end for every faction.
  // Ensures every series has ≥ 2 points so the chart always renders,
  // and lines extend to the right edge of the chart.
  // Factions that scored 0 VP render as a flat line at the bottom.
  for (const f of factions) {
    const arr = pointsMap[f.factionId];
    const lastPt = arr?.[arr.length - 1];
    if (arr !== undefined && lastPt !== undefined && lastPt.gameTimeSeconds < gameDurationSeconds) {
      arr.push({
        timestamp: lastPt.timestamp,
        gameTimeSeconds: gameDurationSeconds,
        cumulativeVp: running[f.factionId] ?? 0,
      });
    }
  }
```

- [ ] **Step 3: Run tests — verify all pass**

```
cd "D:\_TI4 App\app"
npm test -- buildVpTimeline
```
Expected: all tests pass, including the 4 new terminal point tests.

- [ ] **Step 4: Typecheck + full suite**

```
cd "D:\_TI4 App\app"
npm run typecheck && npm test
```
Expected: no errors, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/vp/buildVpTimeline.ts \
        app/src/lib/vp/buildVpTimeline.test.ts
git commit -m "fix: VP chart — add terminal point to each series so 0-VP factions render"
```

---

## Task 3 — Dashboard: show objective names instead of source abbreviations

**Files:**
- Modify: `app/src/features/game-detail/DashboardSection.tsx`

> **Context:** `DashboardSection.tsx` defines a `SOURCE_LABEL` map with keys `'objective'`, `'custodians'`, `'imperial'`, `'support'`, `'relic'`, `'agenda'`, `'rider'`. But the real `VpSource` enum values in the parsed data are `'objective'`, `'custodians_token'`, `'imperial_point'`, `'support_for_throne'`, `'relic'`, `'agenda'`, `'rider'` — different strings. Most lookups fall through to the `?? 'OBJ'` default, so nearly all objectives show "OBJ". The correct fix is to remove `SOURCE_LABEL` entirely and render `obj.objective` (the actual objective name string, e.g. `"Diversify Research"`, `"Custodians Token"`) directly as the chip text. The tooltip `title={obj.objective}` that was already there becomes redundant and can be removed.

### Steps

- [ ] **Step 1: Edit `DashboardSection.tsx`**

Open `app/src/features/game-detail/DashboardSection.tsx`.

**Delete the entire `SOURCE_LABEL` constant** (lines 16–24):

```ts
const SOURCE_LABEL: Record<string, string> = {
  objective: 'OBJ',
  custodians: 'CUST',
  imperial: 'IMP',
  support: 'SUPP',
  relic: 'RELIC',
  agenda: 'AGD',
  rider: 'RIDER',
};
```

**In `FactionCard`**, find the chip `<span>` inside the objectives map (lines 125–141) and replace the inner `title` + content:

Old (lines 137–139):
```tsx
                title={obj.objective}
              >
                {SOURCE_LABEL[obj.source] ?? 'OBJ'}{obj.points > 1 ? ` +${obj.points}` : ''}
```

New:
```tsx
              >
                {obj.objective}{obj.points > 1 ? ` +${obj.points}` : ''}
```

The full updated `<span>` block should look like:
```tsx
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
                }}
              >
                {obj.objective}{obj.points > 1 ? ` +${obj.points}` : ''}
              </span>
```

- [ ] **Step 2: Typecheck + full suite**

```
cd "D:\_TI4 App\app"
npm run typecheck && npm test
```
Expected: no errors. (No unit tests directly cover `DashboardSection` chip text, so the only verification is typecheck + manual review.)

- [ ] **Step 3: Commit**

```bash
git add app/src/features/game-detail/DashboardSection.tsx
git commit -m "fix: dashboard — show objective names instead of source abbreviations"
```

---

## Task 4 — Planet inventory: seed with starting planets

**Files:**
- Modify: `app/src/lib/planets/buildPlanetSummary.ts`
- Modify: `app/src/lib/planets/buildPlanetSummary.test.ts`
- Modify: `app/src/lib/dashboard/buildDashboardSummary.ts`
- Modify: `app/src/lib/dashboard/buildDashboardSummary.test.ts`

> **Context:** `buildPlanetSummary` and `buildDashboardSummary` build planet inventories by walking `planetEvents`. Home-system planets (e.g. Sol's Jord, Hacan's Hercant/Arretze) are never claimed via events — they are present as `startingPlanets: string[]` on each `FactionSetup`. Factions that never lose a home planet appear with 0 planets. Fix: before walking events, seed `finalOwner` / `finalPlanetOwner` with each faction's `startingPlanets`. Events that follow (claims/unclaims) correctly overwrite this initial state.
>
> **Existing tests that remain valid:** The `FACTIONS` fixture in both test files uses `startingPlanets: []` (empty), so the existing `'returns empty inventories for empty planet events'` test (which asserts `inventories.toHaveLength(0)`) continues to pass after seeding — there is nothing to seed.

### Steps

- [ ] **Step 1: Write failing tests for `buildPlanetSummary` starting planet seeding**

Open `app/src/lib/planets/buildPlanetSummary.test.ts`. Add a new `describe` block after the closing `});` of the existing `describe('buildPlanetSummary', ...)`:

```ts
describe('starting planet seeding', () => {
  it('factions with startingPlanets but no events appear in inventory', () => {
    const factions: FactionSetup[] = [
      { factionId: 'Sol', playerName: 'P', color: '#aaa', mapPosition: 0, startingTechs: [], startingPlanets: ['Jord'] },
      { factionId: 'Hacan', playerName: 'P', color: '#bbb', mapPosition: 1, startingTechs: [], startingPlanets: ['Hercant', 'Arretze'] },
    ];
    const result = buildPlanetSummary([], factions);
    const sol = result.inventories.find(i => i.factionId === 'Sol');
    const hacan = result.inventories.find(i => i.factionId === 'Hacan');
    expect(sol?.totalPlanets).toBe(1);
    expect(hacan?.totalPlanets).toBe(2);
    expect(result.totalControlled).toBe(3);
  });

  it('a starting planet claimed by another faction shows the new owner', () => {
    const factions: FactionSetup[] = [
      { factionId: 'Sol', playerName: 'P', color: '#aaa', mapPosition: 0, startingTechs: [], startingPlanets: ['Jord'] },
      { factionId: 'Hacan', playerName: 'P', color: '#bbb', mapPosition: 1, startingTechs: [], startingPlanets: [] },
    ];
    const events: PlanetEvent[] = [
      { faction: 'Hacan', planet: 'Jord', prevOwner: 'Sol', timestamp: 100, type: 'claim' },
    ];
    const result = buildPlanetSummary(events, factions);
    const sol = result.inventories.find(i => i.factionId === 'Sol');
    const hacan = result.inventories.find(i => i.factionId === 'Hacan');
    expect(sol?.totalPlanets ?? 0).toBe(0);
    expect(hacan?.totalPlanets).toBe(1);
  });
});
```

`FactionSetup` and `PlanetEvent` are already imported at line 3 — no new imports needed.

Run:
```
cd "D:\_TI4 App\app"
npm test -- buildPlanetSummary
```
Expected: new tests FAIL (starting planets not seeded yet).

- [ ] **Step 2: Fix `buildPlanetSummary.ts` — seed before events loop**

In `app/src/lib/planets/buildPlanetSummary.ts`, before the `for (const event of planetEvents)` loop (currently line 32), insert:

```ts
  // Seed with each faction's home-system starting planets before processing events.
  // Home planets are never claimed via events; without seeding, factions that
  // never lost a home planet appear with 0 planets in the inventory.
  for (const f of factions) {
    for (const planet of f.startingPlanets) {
      finalOwner[planet] = f.factionId;
    }
  }
```

- [ ] **Step 3: Run tests — verify pass**

```
cd "D:\_TI4 App\app"
npm test -- buildPlanetSummary
```
Expected: all tests pass including the 2 new seeding tests.

- [ ] **Step 4: Write failing tests for `buildDashboardSummary` starting planet seeding**

Open `app/src/lib/dashboard/buildDashboardSummary.test.ts`. Add a new `it` block inside the existing `describe('buildDashboardSummary', ...)`, after the `'counts planets controlled per faction'` test:

```ts
  it('counts starting planets even with no planetEvents', () => {
    const factionsWithPlanets: FactionSetup[] = [
      { factionId: 'Sol', playerName: 'P', color: '#aaa', mapPosition: 0, startingTechs: [], startingPlanets: ['Jord', 'Moll Primus'] },
      { factionId: 'Hacan', playerName: 'P', color: '#bbb', mapPosition: 1, startingTechs: [], startingPlanets: ['Hercant', 'Arretze', 'Kamdorn'] },
    ];
    const result = buildDashboardSummary([], [], [], factionsWithPlanets, { Sol: 7, Hacan: 10 }, { victoryPoints: 10 });
    const sol = result.factions.find(f => f.factionId === 'Sol');
    const hacan = result.factions.find(f => f.factionId === 'Hacan');
    expect(sol?.planetsControlled).toBe(2);
    expect(hacan?.planetsControlled).toBe(3);
  });
```

`FactionSetup` is already imported at line 3 — no new imports needed.

Run:
```
cd "D:\_TI4 App\app"
npm test -- buildDashboardSummary
```
Expected: new test FAIL.

- [ ] **Step 5: Fix `buildDashboardSummary.ts` — seed before events loop**

In `app/src/lib/dashboard/buildDashboardSummary.ts`, before the `for (const event of planetEvents)` loop (currently line 46), insert:

```ts
  // Seed with starting planets before processing events.
  // Home-system planets are never claimed via events; without seeding,
  // factions that never lost a home planet appear with 0 planets.
  for (const f of factions) {
    for (const planet of f.startingPlanets) {
      if (finalPlanetOwner[planet] === undefined) {
        finalPlanetOwner[planet] = f.factionId;
      }
    }
  }
```

Note: the `=== undefined` guard prevents overwriting a planet that was already seeded by a different faction (defensive; in practice starting planets don't overlap).

- [ ] **Step 6: Run full test suite**

```
cd "D:\_TI4 App\app"
npm run typecheck && npm test
```
Expected: all tests pass including the new seeding test.

- [ ] **Step 7: Commit**

```bash
git add app/src/lib/planets/buildPlanetSummary.ts \
        app/src/lib/planets/buildPlanetSummary.test.ts \
        app/src/lib/dashboard/buildDashboardSummary.ts \
        app/src/lib/dashboard/buildDashboardSummary.test.ts
git commit -m "fix: seed planet inventory with startingPlanets before walking events"
```

---

## Self-Review

### Spec Coverage

| Requirement | Task |
|---|---|
| VP threshold reads real export key `victory-points` | Task 1 |
| VP timeline, recap, and dashboard all use the same threshold | Task 1 Steps 4–6 |
| Legacy test fixtures with `{ victoryPoints: 10 }` continue to pass | Task 1 (camelCase fallback in helper) |
| VP chart renders all factions including 0-VP ones | Task 2 |
| VP chart lines extend to the right edge of the chart | Task 2 |
| Dashboard shows actual objective names | Task 3 |
| Dashboard chips show correct label for all VP sources | Task 3 |
| Planet inventory includes home-system starting planets | Task 4 |
| Dashboard planet count includes starting planets | Task 4 |

### Placeholder Scan

No TBD. All code blocks are complete and verified against the actual source files.

### Existing-Test Impact Summary

| Test | Change | Reason |
|---|---|---|
| `buildVpTimeline` — `'builds cumulative VP series in order'` line 43 | `[0,1,3]` → `[0,1,3,7]` | Terminal point appended |
| `buildVpTimeline` — `'builds cumulative VP series in order'` line 45 | `[0,3]` → `[0,3,10]` | Terminal point appended |
| `buildVpTimeline` — `'silently drops VP events for unregistered factions'` line 75 | `toHaveLength(1)` → `toHaveLength(2)` | Anchor + terminal now exist for all registered factions |
| `buildVpTimeline` — `'gameTimeSeconds … relative to first event timestamp'` lines 82–87 | No change | Checks indices [1] and [2]; terminal is at [3] |
| `buildPlanetSummary` — all existing tests | No change | `FACTIONS` fixture has `startingPlanets: []`; seeding adds nothing |
| `buildDashboardSummary` — all existing tests | No change | `FACTIONS` fixture has `startingPlanets: []`; seeding adds nothing |

### Type Consistency

- `getVictoryPointThreshold(options: Record<string, unknown>): number` — matches the `options: Record<string, unknown>` field type in `ParsedGame` and all three call sites
- Terminal point fields `{ timestamp, gameTimeSeconds, cumulativeVp }` satisfy the `VpPoint` interface exactly (no extra fields, no missing fields)
- `startingPlanets: string[]` on `FactionSetup` — already typed; both seeding loops iterate it correctly and assign `string` to `Record<string, string | null>` which is type-safe
