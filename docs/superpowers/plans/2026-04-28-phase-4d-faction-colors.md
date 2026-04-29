# Phase 4d: Faction Color Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add canonical brand colors for all 25 standard TI4 factions plus the Discordant Stars factions in the playgroup corpus. Expose them as both a TypeScript lookup and CSS custom properties; apply to `FactionChip` and `RecapSection`.

**Architecture:** One source of truth — `src/lib/factions/factionBrandColors.ts` — contains a `Record<string, string>` keyed by factionId (the exact strings from `factionExpansions.ts`). A `getFactionBrandColor(factionId, fallback)` helper is called in components instead of passing `color` directly. CSS custom properties on `:root` in `index.css` give an optional CSS-side reference that future stylesheet work can consume.

**Tech Stack:** TypeScript, CSS custom properties, no new dependencies.

---

## Faction Brand Color Reference

Colors derived from the playgroup's faction color notes. Keys match the exact `factionId` strings used in game exports (no "The" prefix; see `factionExpansions.ts`).

| factionId | Primary description | Brand color hex |
|---|---|---|
| `'Arborec'` | Green 90%, Blue 10% | `#2d6a4f` |
| `'Argent Flight'` | Orange | `#d97c2b` |
| `'Barony of Letnev'` | Red 80%, Black 20% | `#7a1c1c` |
| `'Clan of Saar'` | Green/Yellow/Orange blend | `#8b7d2a` |
| `'Council Keleres'` | Yellow-orange + Purple + Blue | `#9a7840` |
| `'Embers of Muaat'` | Red/Orange | `#d44418` |
| `'Emirates of Hacan'` | Orange 70%, Yellow 30% | `#c8900c` |
| `'Empyrean'` | Purple | `#6b2fb0` |
| `'Federation of Sol'` | Yellow 60%, Blue 40% | `#1a5eb0` |
| `'Ghosts of Creuss'` | Blue | `#1a4ab5` |
| `'L1Z1X Mindnet'` | Black 70%, Red 30% | `#3a0c14` |
| `'Mahact Gene-Sorcerers'` | Yellow | `#c8b010` |
| `'Mentak Coalition'` | Orange/Black | `#8a4c10` |
| `'Naalu Collective'` | Green | `#1a8a3a` |
| `'Naaz-Rokha Alliance'` | Green | `#5a8a18` |
| `'Nekro Virus'` | Red | `#a01010` |
| `'Nomad'` | Blue/Purple | `#3030a0` |
| `"Sardakk N'orr"` | Black 70%, Red 30% | `#3a1010` |
| `'Titans of Ul'` | Pink | `#c04a7a` |
| `'Universities of Jol-Nar'` | Blue | `#1a30a0` |
| `"Vuil'raith Cabal"` | Red 60%, Black 40% | `#6a0c18` |
| `'Winnu'` | Orange/Yellow | `#c07a18` |
| `'Xxcha Kingdom'` | Green/Blue (teal) | `#1a7a6a` |
| `'Yin Brotherhood'` | Purple 90%, Yellow 10% | `#50188a` |
| `'Yssaril Tribes'` | Green/Yellow blend | `#5a7820` |
| `'Augurs of Ilyxum'` | DS — oracle gold (approx) | `#9a7030` |
| `'Crimson Rebellion'` | DS — rebellion crimson | `#a01818` |
| `'Deepwrought Scholarate'` | DS — deep blue scholars | `#1a3a8a` |
| `'Firmament'` | DS — sky blue | `#3a90c8` |
| `'Free Systems Compact'` | DS — alliance green | `#2a8a5a` |
| `'Kollecc Society'` | DS — rust collector | `#7a3a2a` |
| `'Kortali Tribunal'` | DS — tribunal purple | `#5a3a7a` |
| `"L'tokk Khrask"` | DS — desert tan | `#7a5a2a` |
| `'Li-Zho Dynasty'` | DS — imperial red | `#c83a1a` |
| `'Nivyn Star Kings'` | DS — star gold | `#c8a020` |
| `'Ral Nel Consortium'` | DS — merchant green | `#5a8a3a` |
| `'Vaden Banking Clans'` | DS — banking gold | `#9a8a1a` |
| `'Veldyr Sovereignty'` | DS — royal purple | `#3a1a6a` |

> **Note on Mahact:** The game export may use `'Mahact Gene-Sorcerers'` (with hyphen) or `'Mahact Gene Sorcerers'` (without). Include both keys pointing to the same color.

> **Note on DS colors:** Discordant Stars faction colors are approximations based on faction names/themes — not sourced from official art. Update them once official/community art references are found.

---

## File Map

| File | Action | Purpose |
|------|---------|---------|
| `app/src/lib/factions/factionBrandColors.ts` | **Create** | `FACTION_BRAND_COLORS` Record + `getFactionBrandColor` helper |
| `app/src/lib/factions/factionBrandColors.test.ts` | **Create** | Coverage for lookup + fallback behavior |
| `app/src/index.css` | **Modify** | CSS custom properties on `:root` for all factions |
| `app/src/shared/FactionChip.tsx` | **Modify** | Use `getFactionBrandColor(factionId, color)` |
| `app/src/features/game-detail/RecapSection.tsx` | **Modify** | Use brand color in winner swatch |

---

## Task 1: Faction brand color lookup table + CSS properties

**Files:**
- Create: `app/src/lib/factions/factionBrandColors.ts`
- Create: `app/src/lib/factions/factionBrandColors.test.ts`
- Modify: `app/src/index.css`

> **Context:** The lookup table is the single source of truth. The CSS properties are for completeness/future use. The TypeScript side is what components actually call — `getFactionBrandColor(factionId, fallback)` returns the brand hex if it exists, otherwise the fallback (the game-export color).

- [ ] **Step 1: Write failing tests**

Create `app/src/lib/factions/factionBrandColors.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getFactionBrandColor, FACTION_BRAND_COLORS } from './factionBrandColors';

describe('FACTION_BRAND_COLORS', () => {
  const STANDARD_FACTIONS = [
    'Arborec', 'Argent Flight', 'Barony of Letnev', 'Clan of Saar',
    'Council Keleres', 'Embers of Muaat', 'Emirates of Hacan', 'Empyrean',
    'Federation of Sol', 'Ghosts of Creuss', 'L1Z1X Mindnet', 'Mahact Gene-Sorcerers',
    'Mentak Coalition', 'Naalu Collective', 'Naaz-Rokha Alliance', 'Nekro Virus',
    'Nomad', "Sardakk N'orr", 'Titans of Ul', 'Universities of Jol-Nar',
    "Vuil'raith Cabal", 'Winnu', 'Xxcha Kingdom', 'Yin Brotherhood', 'Yssaril Tribes',
  ];

  it('has an entry for every standard TI4 faction', () => {
    for (const id of STANDARD_FACTIONS) {
      expect(FACTION_BRAND_COLORS[id], `missing color for ${id}`).toBeDefined();
    }
  });

  it('all color values are valid 6-digit hex strings', () => {
    for (const [id, color] of Object.entries(FACTION_BRAND_COLORS)) {
      expect(color, `invalid hex for ${id}`).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('getFactionBrandColor', () => {
  it('returns the brand color for a known faction', () => {
    expect(getFactionBrandColor('Arborec', '#ffffff')).toBe('#2d6a4f');
  });

  it('returns the fallback for an unknown faction', () => {
    expect(getFactionBrandColor('Unknown Faction', '#abcdef')).toBe('#abcdef');
  });

  it('handles Mahact with hyphen variant', () => {
    expect(getFactionBrandColor('Mahact Gene-Sorcerers', '#ffffff')).toBe('#c8b010');
  });

  it('handles Mahact without hyphen variant', () => {
    expect(getFactionBrandColor('Mahact Gene Sorcerers', '#ffffff')).toBe('#c8b010');
  });
});
```

Run:
```
cd "D:\_TI4 App\app"
npm test -- factionBrandColors
```
Expected: FAIL — module not found.

- [ ] **Step 2: Implement `factionBrandColors.ts`**

Create `app/src/lib/factions/factionBrandColors.ts`:

```ts
export const FACTION_BRAND_COLORS: Record<string, string> = {
  // Base game (17)
  'Arborec':                   '#2d6a4f',
  'Barony of Letnev':          '#7a1c1c',
  'Clan of Saar':              '#8b7d2a',
  'Embers of Muaat':           '#d44418',
  'Emirates of Hacan':         '#c8900c',
  'Federation of Sol':         '#1a5eb0',
  'Ghosts of Creuss':          '#1a4ab5',
  'L1Z1X Mindnet':             '#3a0c14',
  'Mentak Coalition':          '#8a4c10',
  'Naalu Collective':          '#1a8a3a',
  'Nekro Virus':               '#a01010',
  "Sardakk N'orr":             '#3a1010',
  'Universities of Jol-Nar':  '#1a30a0',
  'Winnu':                     '#c07a18',
  'Xxcha Kingdom':             '#1a7a6a',
  'Yin Brotherhood':           '#50188a',
  'Yssaril Tribes':            '#5a7820',

  // PoK (7 + Council Keleres)
  'Argent Flight':             '#d97c2b',
  'Council Keleres':           '#9a7840',
  'Empyrean':                  '#6b2fb0',
  'Mahact Gene-Sorcerers':     '#c8b010',
  'Mahact Gene Sorcerers':     '#c8b010', // alternate export spelling
  'Naaz-Rokha Alliance':       '#5a8a18',
  'Nomad':                     '#3030a0',
  'Titans of Ul':              '#c04a7a',
  "Vuil'raith Cabal":          '#6a0c18',

  // Discordant Stars factions seen in playgroup corpus
  // Colors are approximations — update when official/community art is available
  'Augurs of Ilyxum':          '#9a7030',
  'Crimson Rebellion':         '#a01818',
  'Deepwrought Scholarate':    '#1a3a8a',
  'Firmament':                 '#3a90c8',
  'Free Systems Compact':      '#2a8a5a',
  'Kollecc Society':           '#7a3a2a',
  'Kortali Tribunal':          '#5a3a7a',
  "L'tokk Khrask":             '#7a5a2a',
  'Li-Zho Dynasty':            '#c83a1a',
  'Nivyn Star Kings':          '#c8a020',
  'Ral Nel Consortium':        '#5a8a3a',
  'Vaden Banking Clans':       '#9a8a1a',
  'Veldyr Sovereignty':        '#3a1a6a',
};

export function getFactionBrandColor(factionId: string, fallback: string): string {
  return FACTION_BRAND_COLORS[factionId] ?? fallback;
}
```

- [ ] **Step 3: Run tests to verify they pass**

```
cd "D:\_TI4 App\app"
npm test -- factionBrandColors
```
Expected: all tests pass.

- [ ] **Step 4: Add CSS custom properties to `app/src/index.css`**

Append a `:root` block to `app/src/index.css` (after the existing variables):

```css
/* Faction brand colors — 25 standard factions + DS corpus */
:root {
  --f-arborec:               #2d6a4f;
  --f-barony-of-letnev:      #7a1c1c;
  --f-clan-of-saar:          #8b7d2a;
  --f-embers-of-muaat:       #d44418;
  --f-emirates-of-hacan:     #c8900c;
  --f-federation-of-sol:     #1a5eb0;
  --f-ghosts-of-creuss:      #1a4ab5;
  --f-l1z1x-mindnet:         #3a0c14;
  --f-mentak-coalition:      #8a4c10;
  --f-naalu-collective:      #1a8a3a;
  --f-nekro-virus:           #a01010;
  --f-sardakk-norr:          #3a1010;
  --f-universities-of-jol-nar: #1a30a0;
  --f-winnu:                 #c07a18;
  --f-xxcha-kingdom:         #1a7a6a;
  --f-yin-brotherhood:       #50188a;
  --f-yssaril-tribes:        #5a7820;
  --f-argent-flight:         #d97c2b;
  --f-council-keleres:       #9a7840;
  --f-empyrean:              #6b2fb0;
  --f-mahact-gene-sorcerers: #c8b010;
  --f-naaz-rokha-alliance:   #5a8a18;
  --f-nomad:                 #3030a0;
  --f-titans-of-ul:          #c04a7a;
  --f-vuil-raith-cabal:      #6a0c18;
  --f-augurs-of-ilyxum:      #9a7030;
  --f-crimson-rebellion:     #a01818;
  --f-deepwrought-scholarate: #1a3a8a;
  --f-firmament:             #3a90c8;
  --f-free-systems-compact:  #2a8a5a;
  --f-kollecc-society:       #7a3a2a;
  --f-kortali-tribunal:      #5a3a7a;
  --f-l-tokk-khrask:         #7a5a2a;
  --f-li-zho-dynasty:        #c83a1a;
  --f-nivyn-star-kings:      #c8a020;
  --f-ral-nel-consortium:    #5a8a3a;
  --f-vaden-banking-clans:   #9a8a1a;
  --f-veldyr-sovereignty:    #3a1a6a;
}
```

- [ ] **Step 5: Run typecheck**

```
cd "D:\_TI4 App\app"
npm run typecheck
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/src/lib/factions/factionBrandColors.ts \
        app/src/lib/factions/factionBrandColors.test.ts \
        app/src/index.css
git commit -m "feat: add faction brand color palette — 25 standard + DS corpus factions"
```

---

## Task 2: Apply brand colors to UI components

**Files:**
- Modify: `app/src/shared/FactionChip.tsx`
- Modify: `app/src/features/game-detail/RecapSection.tsx`

> **Context:** Two places currently render faction identity using `f.color` (the player-assigned game token color):
>
> 1. **`FactionChip`** — the small pill/chip used in FrozenHeader, game cards, and the upload preview. Switching to `getFactionBrandColor(factionId, color)` means chips always show the faction's canonical color, with the player-chosen token color as a fallback for unrecognized factionIds.
>
> 2. **`RecapSection`** winner color swatch — the 36×36 block in column 1. This swatch represents the winning faction's identity, so brand color is more appropriate than player token color.
>
> **Why `color` stays as fallback:** New game uploads may contain factionIds not yet in the lookup (newer expansions, new DS factions). Falling back to `color` preserves visual correctness — something shows rather than nothing.

- [ ] **Step 1: Read `FactionChip.tsx` to understand current implementation**

```
Read app/src/shared/FactionChip.tsx
```

Note the current prop signature and how `color` is used. The change you'll make is to add the `getFactionBrandColor` import and replace the `color` usage in the component's background/border style with `getFactionBrandColor(factionId, color)`.

- [ ] **Step 2: Update `FactionChip.tsx` to use brand color**

After reading the file, add the import and update the color reference. The change will look approximately like this (adjust line numbers to match what you read):

**Add import** near the top of the file:
```tsx
import { getFactionBrandColor } from '../lib/factions/factionBrandColors';
```

**Replace** the place where `color` is used as a CSS background/border value with:
```tsx
getFactionBrandColor(factionId, color)
```

Do not change the prop type — `color: string` stays as-is (it's the fallback source).

- [ ] **Step 3: Check `FactionChip.test.tsx` — update if needed**

Read `app/src/shared/FactionChip.test.tsx`. If any tests assert on the specific color value (e.g., `expect(element).toHaveStyle('background: #abcdef')`), update those assertions to pass a factionId that has a known brand color and assert the brand color value instead — or pass an unknown factionId and assert the fallback color.

- [ ] **Step 4: Update `RecapSection.tsx` winner swatch**

Open `app/src/features/game-detail/RecapSection.tsx`. Add the import:
```tsx
import { getFactionBrandColor } from '../../lib/factions/factionBrandColors';
```

Find the winner color swatch:
```tsx
style={{
  width: 36,
  height: 36,
  background: winner.color,
  opacity: 0.7,
  marginBottom: 4,
}}
```

Change `winner.color` to `getFactionBrandColor(winner.factionId, winner.color)`.

- [ ] **Step 5: Run typecheck and full test suite**

```
cd "D:\_TI4 App\app"
npm run typecheck && npm test
```
Expected: no type errors, all tests pass.

- [ ] **Step 6: Build**

```
cd "D:\_TI4 App\app"
npm run build 2>&1 | tail -20
```
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add app/src/shared/FactionChip.tsx \
        app/src/shared/FactionChip.test.tsx \
        app/src/features/game-detail/RecapSection.tsx
git commit -m "feat: apply faction brand colors to FactionChip and RecapSection"
```

---

## Self-Review

### Spec Coverage

| Requirement (ROADMAP Phase 4d) | Task |
|---|---|
| 25-faction CSS custom properties | Task 1, Step 4 |
| TypeScript lookup for component use | Task 1, Step 2 |
| FactionChip uses brand color | Task 2, Step 2 |
| RecapSection winner swatch uses brand color | Task 2, Step 4 |

### Placeholder Scan

No TBD or TODO. DS faction colors are noted as approximations in the source comments — this is intentional and documented, not a gap.

### Type Consistency

- `getFactionBrandColor(factionId: string, fallback: string): string` — both parameters and return are `string`; matches how `factionId` and `color` are typed throughout the codebase
- `FACTION_BRAND_COLORS: Record<string, string>` — plain string keys, no `as const` needed since we're not narrowing the key type
- `FactionChip` prop `color: string` is unchanged — `getFactionBrandColor(factionId, color)` returns `string`, matching the existing inline style expectation
