# Phase 5b — UX & Legibility Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix tech section ordering and round labels, correct a strategy-card reducer bug, raise the default font size floor across the app, and add an A–/A+ font scale toggle to the frozen nav header.

**Architecture:** Four independent tasks that can be executed in order. Tasks 1–2 are pure lib/component fixes with tests. Task 3 is a targeted font-size audit (change hardcoded `px` values in specific components). Task 4 adds a `useFontScale` hook that writes `--font-scale` to the CSS `:root` and to `localStorage`, wires two buttons into `FrozenHeader`, and converts key label `fontSize` values in that header to `calc(Npx * var(--font-scale))`.

**Tech Stack:** TypeScript, React 19, Vitest. No new dependencies.

---

## File Map

| File | Action | Purpose |
|------|---------|---------|
| `app/src/lib/tech/buildTechSummary.ts` | Modify | Remove unused `_phaseSnapshots` param; shift `roundBoundaries` to 3rd param |
| `app/src/lib/tech/buildTechSummary.test.ts` | Modify | Update 3-arg calls; update 4-arg call |
| `app/src/features/game-detail/TechSection.tsx` | Modify | Compute `roundBoundaries`; swap Final Inventories before Research Order |
| `app/src/lib/parser/gameReducer.ts` | Modify | Fix `SecondaryEvent.strategyCard: ''` → `state.activeStrategyCard` |
| `app/src/lib/parser/__tests__/gameReducer.test.ts` | Modify | Add assertion that SecondaryEvent.strategyCard is populated |
| `app/src/features/game-detail/DashboardSection.tsx` | Modify | Raise 7 px → 9 px font sizes |
| `app/src/features/game-detail/AgendaSection.tsx` | Modify | Raise 7 px → 9 px font sizes |
| `app/src/features/game-detail/RecapSection.tsx` | Modify | Raise 7 px → 9 px kicker/label sizes |
| `app/src/features/game-detail/TechSection.tsx` | Modify | Raise 7 px "start" badge to 9 px (also covered by Task 1 edit) |
| `app/src/index.css` | Modify | Add `--font-scale: 1` to `:root` |
| `app/src/shared/useFontScale.ts` | Create | Hook: reads/writes localStorage + sets `--font-scale` CSS var |
| `app/src/features/game-detail/FrozenHeader.tsx` | Modify | Add A–/A+ buttons; convert nav `fontSize` to calc-with-var |

---

## Task 1 — Tech section: round labels + section reorder

**Files:**
- Modify: `app/src/lib/tech/buildTechSummary.ts`
- Modify: `app/src/lib/tech/buildTechSummary.test.ts`
- Modify: `app/src/features/game-detail/TechSection.tsx`

> **Context:** `buildTechSummary` has a dead `_phaseSnapshots` 3rd parameter (prefixed `_`, never used inside the function). The real `roundBoundaries` parameter is 4th and defaults to `[]`. Because `TechSection` only passes 3 arguments and never computes boundaries, every research event gets `round: 1` (from `assignRound`'s fallback — not 0 as earlier docs stated). This means the Research Order list shows "R1" for everything instead of the correct round. Fix: remove `_phaseSnapshots`, shift `roundBoundaries` to 3rd param, and compute boundaries from `game.strategyCardEvents` in `TechSection`. Also swap Final Inventories before Research Order in the JSX (user-requested reorder).

### Steps

- [ ] **Step 1: Write a failing test for `buildTechSummary` round labels**

Open `app/src/lib/tech/buildTechSummary.test.ts`.

After the existing `'assigns round from boundaries'` test (currently line 133), add:

```ts
  it('assigns correct round for a tech researched in round 2 (no phaseSnapshots param)', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Neural Motivator', 'research', 1500),
    ];
    const factions: FactionSetup[] = [makeFaction('Sol')];
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 0 },
      { round: 2, startTimestamp: 1000 },
    ];
    // New 3-arg signature: buildTechSummary(events, factions, boundaries)
    const result = buildTechSummary(events, factions, boundaries);
    expect(result.timeline[0]?.round).toBe(2);
  });
```

Run: `cd "D:\_TI4 App\app" && npm test -- buildTechSummary`
Expected: FAIL — "Expected arguments to match" (3-arg overload not yet supported).

- [ ] **Step 2: Update `buildTechSummary.ts` signature**

Open `app/src/lib/tech/buildTechSummary.ts`. Replace lines 36–41:

Old:
```ts
export function buildTechSummary(
  techEvents: TechEvent[],
  factions: FactionSetup[],
  _phaseSnapshots: PhaseSnapshot[],
  roundBoundaries: RoundBoundary[] = [],
): TechSummary {
```

New:
```ts
export function buildTechSummary(
  techEvents: TechEvent[],
  factions: FactionSetup[],
  roundBoundaries: RoundBoundary[] = [],
): TechSummary {
```

Also remove the `PhaseSnapshot` import (line 3) since it's no longer used:

Old:
```ts
import type { TechEvent, FactionSetup, PhaseSnapshot } from '../parser/types';
```

New:
```ts
import type { TechEvent, FactionSetup } from '../parser/types';
```

- [ ] **Step 3: Fix all existing test calls**

In `app/src/lib/tech/buildTechSummary.test.ts`, every call currently passes `[]` as the 3rd arg for `_phaseSnapshots`. Update all 3-arg calls to drop that arg, and update the 4-arg call to drop the `[]` placeholder.

Find all instances of:
```ts
buildTechSummary(events, ..., [])
```
Change to:
```ts
buildTechSummary(events, ...)
```
And find the one 4-arg call:
```ts
const result = buildTechSummary(events, factions, [], boundaries);
```
Change to:
```ts
const result = buildTechSummary(events, factions, boundaries);
```

Run: `cd "D:\_TI4 App\app" && npm test -- buildTechSummary`
Expected: all pass, including the new test from Step 1.

- [ ] **Step 4: Update `TechSection.tsx` — compute boundaries and reorder sections**

Open `app/src/features/game-detail/TechSection.tsx`.

**4a — Add `deriveRoundBoundaries` import.** Change line 4:

Old:
```ts
import { buildTechSummary } from '../../lib/tech/buildTechSummary';
```

New:
```ts
import { buildTechSummary, deriveRoundBoundaries } from '../../lib/tech/buildTechSummary';
```

**4b — Update the `useMemo` call** to compute and pass boundaries:

Old:
```ts
  const summary = useMemo(
    () =>
      game
        ? buildTechSummary(game.techEvents, game.factions, game.phaseSnapshots)
        : null,
    [game],
  );
```

New:
```ts
  const summary = useMemo(
    () =>
      game
        ? buildTechSummary(
            game.techEvents,
            game.factions,
            deriveRoundBoundaries(game.strategyCardEvents, game.factions.length),
          )
        : null,
    [game],
  );
```

**4c — Reorder the JSX sections.** The current order is: `{/* Research Order */}` → `<Rule />` → `{/* Final Inventories */}`. Swap to: `{/* Final Inventories */}` → `<Rule />` → `{/* Research Order */}`.

Cut the entire Final Inventories block (from `{/* Final Inventories */}` comment through the closing `})}`) and paste it immediately after `<Rule weight="double" />` (before `{/* Research Order */}`). Adjust the dividing `<Rule />` accordingly.

The resulting order inside the `<section>`:
1. Kicker
2. Headline + Deck
3. `<Rule weight="double" />`
4. Final Inventories (moved up)
5. `<Rule />`
6. Research Order (moved down)

- [ ] **Step 5: Typecheck + full suite**

```
cd "D:\_TI4 App\app" && npm run typecheck && npm test
```

Expected: no errors, all tests pass.

- [ ] **Step 6: Commit**

```bash
cd "D:\_TI4 App\app" && git add src/lib/tech/buildTechSummary.ts src/lib/tech/buildTechSummary.test.ts src/features/game-detail/TechSection.tsx && git commit -m "fix: tech section — round labels from strategyCardEvents, Final Inventories first"
```

---

## Task 2 — Strategy card: fix SecondaryEvent.strategyCard

**Files:**
- Modify: `app/src/lib/parser/gameReducer.ts`
- Modify: `app/src/lib/parser/__tests__/gameReducer.test.ts`

> **Context:** In the `MARK_SECONDARY` case of `gameReducer.ts`, a `SecondaryEvent` is built with `strategyCard: ''` hardcoded (line 603). The correct value is `state.activeStrategyCard`, which is set by the preceding `SELECT_ACTION` for the strategy card being resolved. The `StrategyCardEvent` created alongside it (line 608–614) already correctly uses `state.activeStrategyCard`. This fix makes both events consistent and enables future consumers of `secondaryEvents` to know which card's secondary was followed/abstained.

### Steps

- [ ] **Step 1: Write a failing test**

Open `app/src/lib/parser/__tests__/gameReducer.test.ts`. Find the test block for `MARK_SECONDARY` (search for `'MARK_SECONDARY DONE emits play_secondary StrategyCardEvent with active card'`).

Add a new test immediately after it:

```ts
    it('MARK_SECONDARY DONE sets SecondaryEvent.strategyCard from activeStrategyCard', () => {
      const entries: RawLogEntry[] = [
        makeEntry(1, 'SELECT_ACTION',  { action: 'Technology' }),
        makeEntry(2, 'MARK_SECONDARY', { faction: 'Sol', state: 'DONE' }),
      ];
      const state = entries.reduce(gameReducer, initialState());
      expect(state.secondaryEvents[0]?.strategyCard).toBe('Technology');
    });

    it('MARK_SECONDARY SKIPPED sets SecondaryEvent.strategyCard from activeStrategyCard', () => {
      const entries: RawLogEntry[] = [
        makeEntry(1, 'SELECT_ACTION',  { action: 'Politics' }),
        makeEntry(2, 'MARK_SECONDARY', { faction: 'Hacan', state: 'SKIPPED' }),
      ];
      const state = entries.reduce(gameReducer, initialState());
      expect(state.secondaryEvents[0]?.strategyCard).toBe('Politics');
    });
```

`makeEntry`, `initialState`, `RawLogEntry`, and `gameReducer` are already imported at the top of this test file — no new imports needed.

Run: `cd "D:\_TI4 App\app" && npm test -- gameReducer`
Expected: 2 new tests FAIL (`strategyCard` is `''` instead of `'Technology'`/`'Politics'`).

- [ ] **Step 2: Fix the reducer**

Open `app/src/lib/parser/gameReducer.ts`. Find the `case 'MARK_SECONDARY':` block. Find the `secondaryEv` object literal (around line 601–607). Change:

Old:
```ts
      const secondaryEv: SecondaryEvent = {
        faction: factionRaw,
        strategyCard: '',
        timestamp: entry.timestamp,
        type: secondaryType,
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
```

New:
```ts
      const secondaryEv: SecondaryEvent = {
        faction: factionRaw,
        strategyCard: state.activeStrategyCard,
        timestamp: entry.timestamp,
        type: secondaryType,
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
```

- [ ] **Step 3: Run tests — verify pass**

```
cd "D:\_TI4 App\app" && npm test -- gameReducer
```

Expected: all tests pass, including the 2 new ones.

- [ ] **Step 4: Typecheck + full suite**

```
cd "D:\_TI4 App\app" && npm run typecheck && npm test
```

Expected: no errors, all pass.

- [ ] **Step 5: Commit**

```bash
cd "D:\_TI4 App\app" && git add src/lib/parser/gameReducer.ts src/lib/parser/__tests__/gameReducer.test.ts && git commit -m "fix: MARK_SECONDARY SecondaryEvent.strategyCard now uses activeStrategyCard"
```

---

## Task 3 — Default font size improvements

**Files:**
- Modify: `app/src/features/game-detail/DashboardSection.tsx`
- Modify: `app/src/features/game-detail/AgendaSection.tsx`
- Modify: `app/src/features/game-detail/RecapSection.tsx`
- Modify: `app/src/features/game-detail/TechSection.tsx`

> **Context:** Several label and badge font sizes are 7 px — too small for comfortable reading on most phone screens. No tests cover these values (they're inline style numbers). The fix is mechanical: raise `fontSize: 7` → `fontSize: 9` in HTML elements across the four sections. Also raise the 8 px kicker/metadata lines to 10 px where they are the primary label (not a secondary caption). SVG `fontSize` values in `VpRaceSection.tsx` are intentionally left at 7 (SVG coordinate space is different).

### Steps

- [ ] **Step 1: Fix `DashboardSection.tsx`**

Open `app/src/features/game-detail/DashboardSection.tsx`.

Change **line 74** (faction kicker label): `fontSize: 7` → `fontSize: 9`

Change **line 119** (objective chip label): `fontSize: 7` → `fontSize: 9`

Change **line 159** (planet count label): `fontSize: 8` → `fontSize: 10`

Change **line 196** (kicker in VP standings strip): `fontSize: 8` → `fontSize: 10`

- [ ] **Step 2: Fix `AgendaSection.tsx`**

Open `app/src/features/game-detail/AgendaSection.tsx`.

Change **line 261** (rider/outcome badge label): `fontSize: 7` → `fontSize: 9`

- [ ] **Step 3: Fix `RecapSection.tsx`**

Open `app/src/features/game-detail/RecapSection.tsx`.

Change **line 37** (header strip FINAL EDITION / Vol. I / date row): `fontSize: '8px'` → `fontSize: '10px'`

Change **line 68** (kicker): `fontSize: '8px'` → `fontSize: '10px'`

Change **line 127** (col 1 "Winner" label): `fontSize: '7px'` → `fontSize: '9px'`

Change **line 198** (col 3 "Margin" label): `fontSize: '7px'` → `fontSize: '9px'`

Change **line 225** (col 3 "Length" label): `fontSize: '7px'` → `fontSize: '9px'`

In the standings strip (lines 268–283): change the faction name `fontSize: '7px'` → `fontSize: '9px'`

- [ ] **Step 4: Fix `TechSection.tsx`**

Open `app/src/features/game-detail/TechSection.tsx`.

Find the `'start'` badge span (the `fontSize: 7` in the `origin === 'starting'` block): change to `fontSize: 9`.

- [ ] **Step 5: Typecheck + full suite**

```
cd "D:\_TI4 App\app" && npm run typecheck && npm test
```

Expected: no errors (no tests cover inline font-size numbers), all 458+ tests pass.

- [ ] **Step 6: Commit**

```bash
cd "D:\_TI4 App\app" && git add src/features/game-detail/DashboardSection.tsx src/features/game-detail/AgendaSection.tsx src/features/game-detail/RecapSection.tsx src/features/game-detail/TechSection.tsx && git commit -m "fix: raise minimum font size floor — 7px→9px, key 8px labels→10px"
```

---

## Task 4 — A–/A+ font scale toggle

**Files:**
- Modify: `app/src/index.css`
- Create: `app/src/shared/useFontScale.ts`
- Modify: `app/src/features/game-detail/FrozenHeader.tsx`

> **Context:** The user wants an `A–`/`A+` button in the navigation header that scales the app's text up or down. The approach: a `--font-scale` CSS custom property on `:root` (default `1`). A `useFontScale` hook reads the stored preference from `localStorage` on first call, sets the CSS var immediately, and returns `{ scale, up, down }`. `FrozenHeader` renders two small buttons. Key nav text sizes in `FrozenHeader` are converted to `calc(Npx * var(--font-scale))` so they respond visually. Other sections benefit from the same conversion in future passes — Task 4 seeds the infrastructure.
>
> **Scale steps:** `[0.85, 1.0, 1.2]` — small, default, large. `up()` advances one step; `down()` goes back one step.

### Steps

- [ ] **Step 1: Add `--font-scale` to `index.css`**

Open `app/src/index.css`. In the existing `:root { ... }` block (the one with `--paper`, `--ink`, etc.), add one line after `--accent`:

```css
  --font-scale: 1;          /* set by useFontScale hook */
```

The `:root` block should now include:
```css
  --accent:  oklch(0.45 0.12 25);    /* faded vermillion — "stop press" */
  --font-scale: 1;          /* set by useFontScale hook */
  --cool:    oklch(0.45 0.08 240);   /* faded ink-blue — secondary accent */
```

No test needed — CSS var additions don't break anything.

- [ ] **Step 2: Create `useFontScale.ts`**

Create `app/src/shared/useFontScale.ts`:

```ts
import { useState, useEffect } from 'react';

const STEPS = [0.85, 1.0, 1.2] as const;
const LS_KEY = 'ti4-font-scale';

function clampStep(idx: number): number {
  return Math.max(0, Math.min(STEPS.length - 1, idx));
}

function applyScale(scale: number): void {
  document.documentElement.style.setProperty('--font-scale', scale.toString());
}

function readStoredIndex(): number {
  const stored = localStorage.getItem(LS_KEY);
  const parsed = stored !== null ? parseFloat(stored) : NaN;
  if (isNaN(parsed)) return 1; // default: index 1 = scale 1.0
  return clampStep(parsed);
}

export function useFontScale(): { scale: number; up: () => void; down: () => void } {
  const [stepIdx, setStepIdx] = useState<number>(() => {
    const idx = readStoredIndex();
    applyScale(STEPS[idx] ?? 1.0);
    return idx;
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, stepIdx.toString());
    applyScale(STEPS[stepIdx] ?? 1.0);
  }, [stepIdx]);

  return {
    scale: STEPS[stepIdx] ?? 1.0,
    up:   () => setStepIdx(i => clampStep(i + 1)),
    down: () => setStepIdx(i => clampStep(i - 1)),
  };
}
```

- [ ] **Step 3: Wire A–/A+ into `FrozenHeader.tsx`**

Open `app/src/features/game-detail/FrozenHeader.tsx`.

**Add import** at the top, after the existing imports:
```ts
import { useFontScale } from '../../shared/useFontScale';
```

**Add `useFontScale` call** inside `FrozenHeader` component body, right after the `const { game } = useGame();` line:
```ts
  const { scale, up, down } = useFontScale();
```

**Convert the nav button `fontSize`** from a literal to a calc string. Find:
```ts
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '9px',
              textTransform: 'uppercase',
```
Change `fontSize: '9px'` to `fontSize: 'calc(9px * var(--font-scale))'`.

(There is exactly one nav button style block — all buttons share the same style object. Change the `fontSize` line in that block.)

**Add A–/A+ buttons** to the end of the `<nav>` element, after the last `{SECTIONS.map(...)}` block but still inside `<nav>`:

```tsx
        {/* Font scale controls */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2, paddingRight: 4 }}>
          <button
            type="button"
            onClick={down}
            disabled={scale <= 0.85}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '9px',
              border: '1px solid var(--ink-4)',
              background: 'none',
              cursor: scale <= 0.85 ? 'default' : 'pointer',
              color: scale <= 0.85 ? 'var(--ink-4)' : 'var(--ink-3)',
              padding: '2px 5px',
              lineHeight: 1,
            }}
          >
            A–
          </button>
          <button
            type="button"
            onClick={up}
            disabled={scale >= 1.2}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '11px',
              border: '1px solid var(--ink-4)',
              background: 'none',
              cursor: scale >= 1.2 ? 'default' : 'pointer',
              color: scale >= 1.2 ? 'var(--ink-4)' : 'var(--ink-3)',
              padding: '2px 5px',
              lineHeight: 1,
            }}
          >
            A+
          </button>
        </div>
```

Note: the `A–` and `A+` buttons use literal `9px` / `11px` (intentionally fixed size so the buttons themselves don't scale with their own control).

- [ ] **Step 4: Typecheck + full suite**

```
cd "D:\_TI4 App\app" && npm run typecheck && npm test
```

Expected: no errors. The `FrozenHeader.test.tsx` snapshot (if any) may need updating — check. If it fails on the new buttons, update the snapshot.

- [ ] **Step 5: Commit**

```bash
cd "D:\_TI4 App\app" && git add src/index.css src/shared/useFontScale.ts src/features/game-detail/FrozenHeader.tsx && git commit -m "feat: A-/A+ font scale toggle in nav header — persists to localStorage"
```

---

## Self-Review

### Spec Coverage

| Requirement | Task |
|---|---|
| Tech section shows correct round labels (not "R1" everywhere) | Task 1 |
| Final Inventories appears above Research Order | Task 1 |
| `buildTechSummary` API cleaned up (no dead `_phaseSnapshots` param) | Task 1 |
| `SecondaryEvent.strategyCard` populated with active card name | Task 2 |
| 7 px font sizes raised to 9 px in HTML sections | Task 3 |
| Key 8 px label lines raised to 10 px | Task 3 |
| `--font-scale` CSS custom property on `:root` | Task 4 |
| A–/A+ buttons in `FrozenHeader` nav | Task 4 |
| Font scale persisted to `localStorage` | Task 4 |
| Nav button text responds to scale changes | Task 4 |

### Placeholder Scan

No TBD, TODO, or "similar to task N" present. All code blocks are complete.

### Type Consistency

- `buildTechSummary(techEvents, factions, roundBoundaries)` — 3-param signature used consistently in all tasks.
- `deriveRoundBoundaries(game.strategyCardEvents, game.factions.length)` — both args typed: `StrategyCardEvent[]` and `number`. Matches `deriveRoundBoundaries` signature in `aggregator/deriveRoundBoundaries.ts`.
- `useFontScale` returns `{ scale: number; up: () => void; down: () => void }` — destructured correctly in `FrozenHeader`.
- `STEPS[stepIdx]` has type `0.85 | 1.0 | 1.2 | undefined` because `noUncheckedIndexedAccess: true`. The `?? 1.0` fallback handles this everywhere it's used.

### Existing Test Impact

| Test | Change | Reason |
|---|---|---|
| `buildTechSummary` — all 3-arg calls | Drop the `[]` 3rd arg | `_phaseSnapshots` removed |
| `buildTechSummary` — 4-arg call | Drop `[]`, shift boundaries to 3rd | Same |
| `gameReducer` — MARK_SECONDARY tests | No change to existing tests; 2 new tests added | Existing tests don't assert on `strategyCard` field |
| `FrozenHeader.test.tsx` | May need snapshot update if snapshot-based | New A–/A+ buttons added to nav |
