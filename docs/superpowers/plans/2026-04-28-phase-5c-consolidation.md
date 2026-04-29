# Phase 5c — Consolidation & Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract repeated UI primitives and logic into `src/shared/`, fix raw formatters in `GamePreview`, delete dead code, and update documentation.

**Architecture:** Four independent tasks executed in order. Task 1 touches the most files (8 components); do it first so later tasks can import from the updated barrel. Tasks 2–4 are small, targeted cleanups.

**Tech Stack:** TypeScript, React 19, Vitest. No new dependencies.

---

## File Map

| File | Action | Purpose |
|------|---------|---------|
| `app/src/shared/FactionDot.tsx` | Create | Shared colored-circle component; replaces 5 local definitions + 3 inline patterns |
| `app/src/shared/TechPip.tsx` | Create | Shared tech-color dot; replaces 3 local COLOR_VAR + 2 local TechPip definitions |
| `app/src/shared/index.ts` | Modify | Export FactionDot, TechPip, useScrollSpy |
| `app/src/shared/hooks/useScrollSpy.ts` | Create | Extracted IntersectionObserver hook |
| `app/src/shared/hooks/index.ts` | Modify | Export useScrollSpy |
| `app/src/features/game-detail/TechSection.tsx` | Modify | Remove local FactionDot, TechPip, COLOR_VAR; import from shared |
| `app/src/features/game-detail/DashboardSection.tsx` | Modify | Remove local FactionDot, TechPip, COLOR_VAR; import from shared |
| `app/src/features/game-detail/PlanetsSection.tsx` | Modify | Remove local FactionDot; import from shared |
| `app/src/features/game-detail/TimelineSection.tsx` | Modify | Remove local FactionDot; import from shared |
| `app/src/features/game-detail/RecapSection.tsx` | Modify | Replace inline div with FactionDot |
| `app/src/features/game-detail/VpRaceSection.tsx` | Modify | Replace inline span with FactionDot |
| `app/src/features/game-detail/ScrollBody.tsx` | Modify | Replace inlined observer logic with useScrollSpy |
| `app/src/features/meta-dashboard/FactionSection.tsx` | Modify | Remove local FactionDot; import from shared |
| `app/src/features/meta-dashboard/TechSection.tsx` | Modify | Replace inline COLOR_VAR spans with TechPip |
| `app/src/features/upload/GamePreview.tsx` | Modify | Replace local formatDate/formatDuration with shared versions |
| `app/src/lib/tech/buildTechSummary.ts` | Modify | Remove pure re-exports (deriveRoundBoundaries, assignRound, RoundBoundary) |
| `app/src/lib/tech/buildTechSummary.test.ts` | Modify | Remove backward-compat re-export test; update imports |
| `app/src/features/game-detail/TechSection.tsx` | Modify | Import deriveRoundBoundaries from its real source |
| `app/src/features/game-replay/index.ts` | Delete | Empty stub — unused |
| `CLAUDE.md` | Modify | Mark 5b complete, gameTime naming decision, update test count |

---

## Task 1 — Extract FactionDot and TechPip to shared

**Files:**
- Create: `app/src/shared/FactionDot.tsx`
- Create: `app/src/shared/TechPip.tsx`
- Modify: `app/src/shared/index.ts`
- Modify: 8 consumer files (TechSection, DashboardSection, PlanetsSection, TimelineSection, RecapSection, VpRaceSection, meta FactionSection, meta TechSection)

> **Context:** A `FactionDot` (7×7 colored circle) is locally defined in 5 feature files and appears inline in 2 others. A `TechPip` (8×8 circle using a tech-color→CSS-var map `COLOR_VAR`) is locally defined in 2 feature files and appears inline in 1 meta file. Three files each independently define the same `COLOR_VAR` map. Extraction removes ~120 lines of duplication. The shared `FactionDot` takes `color: string`, `size?: number` (default 7), and `style?: CSSProperties` for the rare case where margin/display overrides are needed.

- [ ] **Step 1: Create `app/src/shared/FactionDot.tsx`**

```tsx
import type { CSSProperties } from 'react';

interface Props {
  color: string;
  size?: number;
  style?: CSSProperties;
}

export function FactionDot({ color, size = 7, style }: Props) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
}
```

- [ ] **Step 2: Create `app/src/shared/TechPip.tsx`**

`TechColor` is defined in `src/lib/parser/techs.ts` as `'green' | 'blue' | 'yellow' | 'red' | 'unit'`. `COLOR_VAR` is kept internal — consumers don't need to import it.

```tsx
import type { TechColor } from '../lib/parser/techs';

const COLOR_VAR: Record<TechColor, string> = {
  green:  'var(--moss)',
  blue:   'var(--cool)',
  yellow: 'var(--gold)',
  red:    'var(--accent)',
  unit:   'var(--ink-2)',
};

interface Props {
  color: TechColor;
  size?: number;
}

export function TechPip({ color, size = 8 }: Props) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: COLOR_VAR[color],
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    />
  );
}
```

- [ ] **Step 3: Add exports to `app/src/shared/index.ts`**

Add after the `FactionChip` export line:

```ts
export { FactionDot } from './FactionDot';
export { TechPip } from './TechPip';
```

- [ ] **Step 4: Update `app/src/features/game-detail/TechSection.tsx`**

Read the file. Remove the local `COLOR_VAR` constant, local `TechPip` function, and local `FactionDot` function (these are the first ~45 lines of the file after imports).

Add `FactionDot` and `TechPip` to the shared import. The file already has:
```ts
import { buildTechSummary, deriveRoundBoundaries } from '../../lib/tech/buildTechSummary';
```
Add a new import line:
```ts
import { FactionDot, TechPip } from '../../shared';
```

The local `TechPip` was 8×8 — matches the shared default, so no `size` prop needed.
The local `FactionDot` was 7×7 — matches the shared default, so no `size` prop needed.
All existing `<TechPip ...>` and `<FactionDot ...>` JSX usages in this file require no changes.

- [ ] **Step 5: Update `app/src/features/game-detail/DashboardSection.tsx`**

Read the file. Remove the local `COLOR_VAR` constant, local `TechPip` function, and local `FactionDot` function.

Add to the existing shared import (or create one if none exists):
```ts
import { FactionDot, TechPip } from '../../shared';
```

The local `TechPip` was **6×6** — smaller than the shared default. Find every `<TechPip ...>` usage in this file and add `size={6}`:
```tsx
<TechPip color={t.color} size={6} />
```

The local `FactionDot` was 7×7 — matches shared default, no `size` prop needed.

- [ ] **Step 6: Update `app/src/features/game-detail/PlanetsSection.tsx`**

Read the file. Remove the local `FactionDot` function.

Add to imports:
```ts
import { FactionDot } from '../../shared';
```

The local `FactionDot` was 7×7 — no `size` prop needed on existing JSX usages.

- [ ] **Step 7: Update `app/src/features/game-detail/TimelineSection.tsx`**

Read the file. Remove the local `FactionDot` function.

Add to imports:
```ts
import { FactionDot } from '../../shared';
```

The local `FactionDot` was 7×7 — no `size` prop needed.

- [ ] **Step 8: Update `app/src/features/game-detail/RecapSection.tsx`**

Read the file. In the standings strip (the `{standings.map(...)}` block), find the inline colored div:

```tsx
<div
  style={{
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: s.color,
    margin: '0 auto 2px',
  }}
/>
```

Replace with:
```tsx
<FactionDot color={s.color} size={6} style={{ display: 'block', margin: '0 auto 2px' }} />
```

(`display: 'block'` is needed so `margin: auto` centers it horizontally inside the `textAlign: 'center'` container.)

Add to imports:
```ts
import { FactionDot, Rule, formatDate, formatDuration } from '../../shared';
```

(Merge with any existing shared import in this file.)

- [ ] **Step 9: Update `app/src/features/game-detail/VpRaceSection.tsx`**

Read the file. Find the inline colored span in the legend strip:

```tsx
<span style={{ width: 6, height: 6, borderRadius: '50%',
  background: factionColorMap[s.factionId] ?? 'var(--ink-4)', display: 'inline-block' }} />
```

Replace with:
```tsx
<FactionDot color={factionColorMap[s.factionId] ?? 'var(--ink-4)'} size={6} />
```

Add `FactionDot` to the existing shared import in this file.

- [ ] **Step 10: Update `app/src/features/meta-dashboard/FactionSection.tsx`**

Read the file. Remove the local `FactionDot` function.

Add to imports:
```ts
import { FactionDot } from '../../shared';
```

The local `FactionDot` was **8×8**. Find every `<FactionDot ...>` usage and add `size={8}`:
```tsx
<FactionDot color={...} size={8} />
```

- [ ] **Step 11: Update `app/src/features/meta-dashboard/TechSection.tsx`**

Read the file. Remove the local `COLOR_VAR` constant. Find any inline `<span>` elements that use `COLOR_VAR[t.color]` as their background (there are 2 occurrences) and replace each with `<TechPip color={t.color} />`.

Also check if `TechColor` was imported only for `COLOR_VAR` — if so, remove that import. Add:
```ts
import { TechPip } from '../../shared';
```

- [ ] **Step 12: Typecheck + full suite**

```
cd "D:\_TI4 App\app" && npm run typecheck && npm test
```

Expected: no errors, all 458+ tests pass.

- [ ] **Step 13: Commit**

```bash
cd "D:/_TI4 App/app" && git add src/shared/FactionDot.tsx src/shared/TechPip.tsx src/shared/index.ts src/features/game-detail/TechSection.tsx src/features/game-detail/DashboardSection.tsx src/features/game-detail/PlanetsSection.tsx src/features/game-detail/TimelineSection.tsx src/features/game-detail/RecapSection.tsx src/features/game-detail/VpRaceSection.tsx src/features/meta-dashboard/FactionSection.tsx src/features/meta-dashboard/TechSection.tsx && git commit -m "refactor: extract FactionDot and TechPip to shared — remove duplicate local definitions"
```

---

## Task 2 — Fix GamePreview formatters

**Files:**
- Modify: `app/src/features/upload/GamePreview.tsx`

> **Context:** `GamePreview.tsx` defines two local formatter functions that duplicate what is already exported from `src/shared/formatters.ts`. `formatDuration` is byte-for-byte identical to the shared version. `formatDate` uses `month: 'long'` (e.g. "April 28, 2026") while the shared version uses `month: 'short'` (e.g. "Apr 28, 2026"). Fix: delete both local functions and import from shared. The date output changes slightly — that's acceptable; consistency across the app matters more.

- [ ] **Step 1: Read `app/src/features/upload/GamePreview.tsx`**

Locate the two local functions (around lines 11–23):
```ts
function formatDuration(seconds: number): string { ... }
function formatDate(ms: number): string { ... }
```

- [ ] **Step 2: Delete both local functions and add shared import**

Delete the `formatDuration` function (5 lines).
Delete the `formatDate` function (7 lines).

Add an import from shared. If the file has no shared import yet:
```ts
import { formatDate, formatDuration } from '../../shared';
```
If it already has one, add `formatDate` and `formatDuration` to the existing destructure.

No other changes needed — the function signatures are identical.

- [ ] **Step 3: Typecheck + full suite**

```
cd "D:\_TI4 App\app" && npm run typecheck && npm test
```

Expected: no errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
cd "D:/_TI4 App/app" && git add src/features/upload/GamePreview.tsx && git commit -m "refactor: GamePreview uses shared formatDate/formatDuration instead of local copies"
```

---

## Task 3 — Extract useScrollSpy hook

**Files:**
- Create: `app/src/shared/hooks/useScrollSpy.ts`
- Modify: `app/src/shared/hooks/index.ts`
- Modify: `app/src/shared/index.ts`
- Modify: `app/src/features/game-detail/ScrollBody.tsx`

> **Context:** `ScrollBody.tsx` has 30 lines of IntersectionObserver setup inlined in a `useEffect`. This is a reusable scroll-spy pattern that could serve other scroll-reactive components. Extract to `src/shared/hooks/useScrollSpy.ts`. The hook takes the section IDs, a callback, and an optional threshold — returning void (side-effect only). The `callbackRef` stabilization pattern must be preserved: the inner observer effect runs once on mount (stable `sectionIds` and `threshold`), while a separate effect keeps `callbackRef.current` fresh on every render without re-creating observers. `src/shared/hooks/index.ts` currently contains `export {}` — replace it with the real export.

- [ ] **Step 1: Create `app/src/shared/hooks/useScrollSpy.ts`**

```ts
import { useEffect, useRef } from 'react';

export function useScrollSpy(
  sectionIds: readonly string[],
  onEnter: (sectionId: string) => void,
  threshold = 0.4,
): void {
  const callbackRef = useRef(onEnter);
  useEffect(() => {
    callbackRef.current = onEnter;
  });

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el === null) continue;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const sectionId = (entry.target as HTMLElement).dataset['section'] ?? id;
              callbackRef.current(sectionId);
            }
          }
        },
        { threshold },
      );

      observer.observe(el);
      observers.push(observer);
    }

    return () => {
      for (const o of observers) o.disconnect();
    };
  }, [sectionIds, threshold]);
}
```

- [ ] **Step 2: Update `app/src/shared/hooks/index.ts`**

Replace `export {}` with:
```ts
export { useScrollSpy } from './useScrollSpy';
```

- [ ] **Step 3: Add useScrollSpy to `app/src/shared/index.ts`**

Add after the `useFontScale` export line:
```ts
export { useScrollSpy } from './hooks/useScrollSpy';
```

- [ ] **Step 4: Simplify `app/src/features/game-detail/ScrollBody.tsx`**

Read the file. Replace the entire `useRef` + two `useEffect` block with a single `useScrollSpy` call:

Old (lines ~18–51):
```ts
  const callbackRef = useRef(onSectionChange);
  useEffect(() => {
    callbackRef.current = onSectionChange;
  });

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTION_IDS.forEach((id) => {
      // ... 20+ lines of observer setup
    });
    return () => {
      observers.forEach((o) => { o.disconnect(); });
    };
  }, []);
```

New:
```ts
  useScrollSpy(SECTION_IDS, onSectionChange);
```

Update the imports at the top of `ScrollBody.tsx`:
- Remove `useEffect` and `useRef` from the React import (if they're now unused)
- Add to the existing shared import (or create one): `import { useScrollSpy } from '../../shared';`

- [ ] **Step 5: Typecheck + full suite**

```
cd "D:\_TI4 App\app" && npm run typecheck && npm test
```

Expected: no errors, all tests pass.

- [ ] **Step 6: Commit**

```bash
cd "D:/_TI4 App/app" && git add src/shared/hooks/useScrollSpy.ts src/shared/hooks/index.ts src/shared/index.ts src/features/game-detail/ScrollBody.tsx && git commit -m "refactor: extract useScrollSpy hook from ScrollBody to src/shared/hooks"
```

---

## Task 4 — Re-export cleanup, delete game-replay/, update docs

**Files:**
- Modify: `app/src/lib/tech/buildTechSummary.ts`
- Modify: `app/src/lib/tech/buildTechSummary.test.ts`
- Modify: `app/src/features/game-detail/TechSection.tsx`
- Delete: `app/src/features/game-replay/index.ts` (then the directory)
- Modify: `CLAUDE.md` (root of `D:\_TI4 App\`)

> **Context:** Three cleanup items in one commit:
>
> **Re-exports:** `buildTechSummary.ts` re-exports `deriveRoundBoundaries`, `assignRound`, and `RoundBoundary`. Only `assignRound` and `RoundBoundary` are used internally (so their import stays). `deriveRoundBoundaries` is neither used inside the file nor needed as a re-export — `TechSection.tsx` is its only external consumer, and should import it directly. The test file has a dedicated `describe` block testing the re-export exists; that block should be deleted since `deriveRoundBoundaries.test.ts` already covers the function.
>
> **game-replay/:** `src/features/game-replay/index.ts` contains only `export {}` — an empty scaffolding stub never developed. Delete it.
>
> **CLAUDE.md:** Phase 5b is now complete; update the status table and test count.

- [ ] **Step 1: Update `TechSection.tsx` import for `deriveRoundBoundaries`**

Read `app/src/features/game-detail/TechSection.tsx`. Change line 4:

Old:
```ts
import { buildTechSummary, deriveRoundBoundaries } from '../../lib/tech/buildTechSummary';
```

New (two separate imports):
```ts
import { buildTechSummary } from '../../lib/tech/buildTechSummary';
import { deriveRoundBoundaries } from '../../lib/aggregator/deriveRoundBoundaries';
```

- [ ] **Step 2: Remove re-exports from `buildTechSummary.ts`**

Read `app/src/lib/tech/buildTechSummary.ts`. Remove lines 6–7:
```ts
export { deriveRoundBoundaries, assignRound };
export type { RoundBoundary };
```

The import on line 4 stays — `assignRound` and `RoundBoundary` are still used internally:
```ts
import { deriveRoundBoundaries, assignRound, type RoundBoundary } from '../aggregator/deriveRoundBoundaries';
```

Wait — after removing the re-exports, `deriveRoundBoundaries` is no longer used inside `buildTechSummary.ts` itself (only re-exported). Remove it from the import too:

New line 4:
```ts
import { assignRound, type RoundBoundary } from '../aggregator/deriveRoundBoundaries';
```

- [ ] **Step 3: Update `buildTechSummary.test.ts` imports and remove backward-compat test**

Read `app/src/lib/tech/buildTechSummary.test.ts`.

**Import changes (lines 2–3):**

Old:
```ts
import { buildTechSummary, deriveRoundBoundaries } from './buildTechSummary';
import type { RoundBoundary } from './buildTechSummary';
```

New:
```ts
import { buildTechSummary } from './buildTechSummary';
import { deriveRoundBoundaries } from '../aggregator/deriveRoundBoundaries';
import type { RoundBoundary } from '../aggregator/deriveRoundBoundaries';
```

**Delete the backward-compat describe block** (the one that starts with `describe('deriveRoundBoundaries (re-export from buildTechSummary)'`). This is the last describe block in the file (3 lines including the closing brace). Delete it entirely — `deriveRoundBoundaries.test.ts` already has proper tests for this function.

- [ ] **Step 4: Typecheck + verify tests still pass**

```
cd "D:\_TI4 App\app" && npm run typecheck && npm test
```

Expected: no errors, test count decreases by 1 (the backward-compat test is gone), all remaining tests pass.

- [ ] **Step 5: Delete `game-replay/`**

```bash
rm "D:/_TI4 App/app/src/features/game-replay/index.ts"
rmdir "D:/_TI4 App/app/src/features/game-replay"
```

Verify nothing imports from it:
```bash
grep -r "game-replay" "D:/_TI4 App/app/src"
```

Expected: no output.

- [ ] **Step 6: Update `CLAUDE.md`**

Read `D:\_TI4 App\CLAUDE.md`. In the status table, update the Phase 5b row:

Old:
```
| Phase 5b — UX & legibility | 🔲 Planned — font size controls, tech reorder, strategy card fix, round labels |
```

New:
```
| Phase 5b — UX & legibility | ✅ Complete — A–/A+ font scale toggle, font floor 7px→9px, tech section reorder, strategy card fix, round labels; 458 tests |
```

Update the Phase 5c row:
```
| Phase 5c — Consolidation | 🔲 Planned — shared extractions, cleanup, CLAUDE.md update |
```

Also update the "Next up" line near the top of the file:

Old:
```
**Next up:** Phase 5b. See ROADMAP.md for full spec.
```

New:
```
**Next up:** Phase 5c. See ROADMAP.md for full spec.
```

- [ ] **Step 7: Final typecheck + full suite**

```
cd "D:\_TI4 App\app" && npm run typecheck && npm test
```

Expected: clean.

- [ ] **Step 8: Commit**

```bash
cd "D:/_TI4 App/app" && git add src/lib/tech/buildTechSummary.ts src/lib/tech/buildTechSummary.test.ts src/features/game-detail/TechSection.tsx && git commit -m "refactor: remove pure re-exports from buildTechSummary, import deriveRoundBoundaries directly"

git add src/features/game-replay && git rm src/features/game-replay/index.ts && git commit -m "chore: delete empty game-replay scaffold stub"

cd "D:/_TI4 App" && git add CLAUDE.md && git commit -m "docs: mark Phase 5b complete in CLAUDE.md, update next-up pointer"
```

(Three small focused commits are clearer than one large cleanup commit.)

---

## Self-Review

### Spec Coverage

| Requirement | Task |
|---|---|
| Extract `FactionDot` to shared | Task 1 |
| Extract tech `COLOR_VAR` / `TechPip` to shared | Task 1 |
| Fix `formatters` in `GamePreview` | Task 2 |
| Extract `useScrollSpy` hook | Task 3 |
| Delete `game-replay/` stub | Task 4 |
| `gameTime` vs `gameTimeSeconds` decision | Task 4 (CLAUDE.md note) |
| `buildTechSummary` re-export cleanup | Task 4 |
| `CLAUDE.md` status update | Task 4 |

> **gameTime vs gameTimeSeconds decision:** Audit confirms no inconsistency — `gameTime` lives in the parser layer (raw event field, milliseconds relative to game start), `gameTimeSeconds` lives in the VP timeline layer (seconds relative to first event). They're in separate types and never mixed. No refactoring needed; the naming difference is acceptable.

### Placeholder Scan

No TBD, TODO, or "similar to task N" present.

### Type Consistency

- `FactionDot` props: `color: string`, `size?: number` (default 7), `style?: CSSProperties` — consistent across all 9 call sites.
- `TechPip` props: `color: TechColor`, `size?: number` (default 8) — DashboardSection passes `size={6}`, meta TechSection uses default.
- `useScrollSpy(sectionIds, onEnter, threshold)` — `sectionIds` is `readonly string[]`; `SECTION_IDS` in `ScrollBody.tsx` is `as const` which satisfies this.
- After removing `deriveRoundBoundaries` from the `buildTechSummary.ts` import, there is no unused import.

### Existing Test Impact

| Area | Impact |
|---|---|
| FactionDot/TechPip extraction | No behavior change — pure structural refactor; existing tests protected |
| GamePreview formatters | No tests cover the local functions; visual output for dates changes slightly (short month) |
| useScrollSpy | `ScrollBody` has no unit tests (DOM-dependent); existing integration behavior unchanged |
| buildTechSummary re-exports | 1 backward-compat test deleted; all other tests unaffected |
| game-replay deletion | Nothing imports from it; no test impact |
