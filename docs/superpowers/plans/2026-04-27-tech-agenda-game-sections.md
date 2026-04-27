# Tech & Agenda Game Sections — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Tech and Agenda as two new top-level scroll sections in the game-detail page, backed by pure data-transformation functions, a static agenda text dictionary, and a tech-color lookup.

**Architecture:** Pure functions in `src/lib/` transform `ParsedGame` data into display shapes; React components in `src/features/game-detail/` render them using the existing newspaper design tokens. No new design tokens are needed. Phase 3 meta views are a separate plan.

**Tech Stack:** React + TypeScript, Vitest + React Testing Library, existing CSS custom properties (`var(--paper-2)`, `var(--accent)`, `var(--cool)`, `var(--gold)`, `var(--moss)`, `var(--ink-*)`, `var(--rule)`).

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/parser/agendas.ts` | Static dictionary: agenda name → text + metadata |
| Create | `src/lib/parser/agendas.test.ts` | Tests for `lookupAgenda` |
| Create | `src/lib/parser/techs.ts` | Static dictionary: tech name → color category |
| Create | `src/lib/parser/techs.test.ts` | Tests for `lookupTechColor` |
| Create | `src/lib/agenda/buildAgendaSummary.ts` | Pure fn: `AgendaResolution[]` + `VpEvent[]` → display shape |
| Create | `src/lib/agenda/buildAgendaSummary.test.ts` | TDD tests |
| Create | `src/lib/tech/buildTechSummary.ts` | Pure fn: `TechEvent[]` + `PhaseSnapshot[]` + `FactionSetup[]` → display shape |
| Create | `src/lib/tech/buildTechSummary.test.ts` | TDD tests |
| Create | `src/features/game-detail/TechSection.tsx` | Tech scroll section component |
| Create | `src/features/game-detail/AgendaSection.tsx` | Agenda scroll section component |
| Modify | `src/features/game-detail/ScrollBody.tsx` | Add `TechSection`, `AgendaSection`; expand `SECTION_IDS` to 6 |
| Modify | `src/features/game-detail/FrozenHeader.tsx` | Add Tech + Agenda to `SECTIONS` array |
| Modify | `src/features/game-detail/sections.test.tsx` | Add tech + agenda section cases |

---

## Task 1: Agenda Dictionary

**Files:**
- Create: `app/src/lib/parser/agendas.ts`
- Create: `app/src/lib/parser/agendas.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// app/src/lib/parser/agendas.test.ts
import { describe, it, expect } from 'vitest';
import { lookupAgenda, AGENDAS } from './agendas';

describe('lookupAgenda', () => {
  it('returns null for an unknown agenda name', () => {
    expect(lookupAgenda('Unknown Agenda That Does Not Exist')).toBeNull();
  });

  it('returns the entry for a known base-game FOR/AGAINST law', () => {
    const entry = lookupAgenda('Anti-Intellectual Revolution');
    expect(entry).not.toBeNull();
    expect(entry?.type).toBe('law');
    expect(entry?.elect).toBeNull();
    expect(entry?.forEffect).toContain('destroy 1 of their non-fighter ships');
    expect(entry?.againstEffect).toContain('exhausts 1 planet for each technology');
    expect(entry?.expansion).toBe('base');
    expect(entry?.removedInPok).toBeUndefined();
  });

  it('returns the entry for an elect-player law', () => {
    const entry = lookupAgenda('Imperial Arbiter');
    expect(entry).not.toBeNull();
    expect(entry?.type).toBe('law');
    expect(entry?.elect).toBe('player');
    expect(entry?.effect).toContain('swap 1 of their strategy cards');
    expect(entry?.forEffect).toBeUndefined();
  });

  it('returns the entry for a base-game directive', () => {
    const entry = lookupAgenda('Mutiny');
    expect(entry).not.toBeNull();
    expect(entry?.type).toBe('directive');
    expect(entry?.elect).toBeNull();
    expect(entry?.forEffect).toContain('gains 1 victory point');
    expect(entry?.againstEffect).toContain('loses 1 victory point');
  });

  it('returns a PoK law', () => {
    const entry = lookupAgenda('Political Censure');
    expect(entry).not.toBeNull();
    expect(entry?.expansion).toBe('pok');
    expect(entry?.elect).toBe('player');
  });

  it('flags base-game cards removed in PoK', () => {
    const entry = lookupAgenda('Shard of the Throne');
    expect(entry?.removedInPok).toBe(true);
    expect(entry?.expansion).toBe('base');
  });

  it('covers all 63 entries (50 base + 13 PoK)', () => {
    const entries = Object.entries(AGENDAS);
    const base = entries.filter(([, e]) => e.expansion === 'base');
    const pok  = entries.filter(([, e]) => e.expansion === 'pok');
    expect(base.length).toBe(50);
    expect(pok.length).toBe(13);
  });

  it('every FOR/AGAINST entry has both forEffect and againstEffect', () => {
    Object.entries(AGENDAS).forEach(([name, entry]) => {
      if (entry.elect === null) {
        expect(entry.forEffect, `${name} missing forEffect`).toBeTruthy();
        expect(entry.againstEffect, `${name} missing againstEffect`).toBeTruthy();
      }
    });
  });

  it('every elect entry has effect and no forEffect/againstEffect', () => {
    Object.entries(AGENDAS).forEach(([name, entry]) => {
      if (entry.elect !== null) {
        expect(entry.effect, `${name} missing effect`).toBeTruthy();
        expect(entry.forEffect, `${name} should not have forEffect`).toBeUndefined();
        expect(entry.againstEffect, `${name} should not have againstEffect`).toBeUndefined();
      }
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
cd app && npm test -- agendas.test
```

Expected: FAIL — "Cannot find module './agendas'"

- [ ] **Step 3: Create the agenda dictionary**

```typescript
// app/src/lib/parser/agendas.ts
// Static dictionary of all TI4 + PoK agenda cards.
// Keys are EXACT names as they appear in TI Assistant exports (case-sensitive).
// Source: TI4 wiki, verified against real game exports.

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
  /** FOR effect text — present when elect is null */
  forEffect?: string;
  /** AGAINST effect text — present when elect is null */
  againstEffect?: string;
  /** Single effect text — present when elect is non-null */
  effect?: string;
  /** Trigger text shown before voting begins (e.g. "When this agenda is revealed…") */
  trigger?: string;
  expansion: AgendaExpansion;
  /** True if this base-game card is removed from play when PoK is used */
  removedInPok?: boolean;
}

// ─── BASE GAME LAWS ─────────────────────────────────────────────────────────

const BASE_LAWS: Record<string, AgendaEntry> = {
  'Anti-Intellectual Revolution': {
    type: 'law', elect: null, expansion: 'base',
    forEffect: 'After a player researches a technology, they must destroy 1 of their non-fighter ships.',
    againstEffect: 'At the start of the next strategy phase, each player chooses and exhausts 1 planet for each technology they own.',
  },
  'Classified Document Leaks': {
    type: 'law', elect: 'scored-secret-objective', expansion: 'base',
    trigger: 'When this agenda is revealed, if there are no scored secret objectives, discard this card and reveal another agenda from the top of the deck.',
    effect: 'The elected secret objective becomes a public objective; place it near the other public objectives in the common play area.',
  },
  'Committee Formation': {
    type: 'law', elect: 'player', expansion: 'base',
    effect: 'The elected player gains this card. Before players vote on an agenda that requires a player to be elected, the owner of this card may discard this card to choose a player to be elected. Players do not vote on that agenda.',
  },
  'Conventions of War': {
    type: 'law', elect: null, expansion: 'base',
    forEffect: 'Players cannot use BOMBARDMENT against units that are on cultural planets.',
    againstEffect: 'Each player that voted "Against" discards all of their action cards.',
  },
  'Core Mining': {
    type: 'law', elect: 'hazardous-planet', expansion: 'base', removedInPok: true,
    effect: 'Attach this card to the elected planet\'s card. Then, destroy 1 infantry on the planet. The resource value of this planet is increased by 2.',
  },
  'Demilitarized Zone': {
    type: 'law', elect: 'cultural-planet', expansion: 'base', removedInPok: true,
    effect: 'Attach this card to the elected planet\'s card. Then, destroy all units on that planet. Player\'s units cannot land, be produced, or be placed on this planet.',
  },
  'Enforced Travel Ban': {
    type: 'law', elect: null, expansion: 'base',
    forEffect: 'Alpha and beta wormholes have no effect during movement.',
    againstEffect: 'Destroy each PDS in or adjacent to a system that contains a wormhole.',
  },
  'Executive Sanctions': {
    type: 'law', elect: null, expansion: 'base',
    forEffect: 'Each player can have a maximum of 3 action cards in their hand.',
    againstEffect: 'Each player discards 1 random action card from their hand.',
  },
  'Fleet Regulations': {
    type: 'law', elect: null, expansion: 'base',
    forEffect: 'Each player cannot have more than 4 tokens in their fleet pool.',
    againstEffect: 'Each player places 1 command token from their reinforcements in their fleet pool.',
  },
  'Holy Planet of Ixth': {
    type: 'law', elect: 'cultural-planet', expansion: 'base', removedInPok: true,
    effect: 'Attach this card to the elected planet\'s card. The planet\'s owner gains 1 victory point. Units on this planet cannot use PRODUCTION. When a player gains control of this planet, they gain 1 victory point. When a player loses control of this planet, they lose 1 victory point.',
  },
  'Homeland Defense Act': {
    type: 'law', elect: null, expansion: 'base',
    forEffect: 'Each player can have any number of PDS units on planets they control.',
    againstEffect: 'Each player destroys 1 of their PDS unit.',
  },
  'Imperial Arbiter': {
    type: 'law', elect: 'player', expansion: 'base',
    effect: 'The elected player gains this card. At the end of the strategy phase, the owner of this card may discard this card to swap 1 of their strategy cards with 1 of another player\'s strategy cards.',
  },
  'Minister of Commerce': {
    type: 'law', elect: 'player', expansion: 'base',
    effect: 'The elected player gains this card. After the owner of this card replenishes commodities, they gain 1 trade good for each player that is their neighbor.',
  },
  'Minister of Exploration': {
    type: 'law', elect: 'player', expansion: 'base',
    effect: 'The elected player gains this card. When the owner of this card gains control of a planet, they gain 1 trade good.',
  },
  'Minister of Industry': {
    type: 'law', elect: 'player', expansion: 'base',
    effect: 'The elected player gains this card. When the owner of this card places a space dock in a system, their units in that system may use their PRODUCTION abilities.',
  },
  'Minister of Peace': {
    type: 'law', elect: 'player', expansion: 'base',
    effect: 'The elected player gains this card. After a player activates a system that contains 1 or more of a different player\'s units, the owner of this card may discard this card; immediately end the active player\'s turn.',
  },
  'Minister of Policy': {
    type: 'law', elect: 'player', expansion: 'base',
    effect: 'The elected player gains this card. At the end of the status phase, the owner of this card draws 1 action card.',
  },
  'Minister of Sciences': {
    type: 'law', elect: 'player', expansion: 'base',
    effect: 'The elected player gains this card. When the owner of this card resolves the primary or secondary ability of the "Technology" strategy card, they do not need to spend resources to research technology.',
  },
  'Minister of War': {
    type: 'law', elect: 'player', expansion: 'base',
    effect: 'The elected player gains this card. The owner of this card may discard this card after performing an action to remove 1 of their command counters from the game board and return it to their reinforcements; then they may perform 1 additional action.',
  },
  'Prophecy of Ixth': {
    type: 'law', elect: 'player', expansion: 'base',
    effect: 'The elected player gains this card. The owner of this card applies +1 to the result of their fighter\'s combat rolls. When the owner of this card uses PRODUCTION, they discard this card unless they produce 2 or more fighters.',
  },
  'Publicize Weapon Schematics': {
    type: 'law', elect: null, expansion: 'base',
    forEffect: 'If any player owns a war sun technology, all players may ignore all prerequisites on war sun technologies. All war suns lose SUSTAIN DAMAGE.',
    againstEffect: 'Each player that owns a war sun technology discards all of their action cards.',
  },
  'Regulated Conscription': {
    type: 'law', elect: null, expansion: 'base',
    forEffect: 'When a player produces units, they produce only 1 fighter and infantry for its cost instead of 2.',
    againstEffect: 'No effect.',
  },
  'Representative Government': {
    type: 'law', elect: null, expansion: 'base', removedInPok: true,
    forEffect: 'Players cannot exhaust planets to cast votes during the agenda phase. Each player may cast 1 vote on each agenda instead.',
    againstEffect: 'At the start of the next strategy phase, each player that voted "Against" exhausts all of their cultural planets.',
  },
  'Research Team: Biotic': {
    type: 'law', elect: 'industrial-planet', expansion: 'base', removedInPok: true,
    effect: 'Attach this card to the elected planet\'s card. When the owner of this planet researches technology, they may exhaust this card to ignore 1 green prerequisite.',
  },
  'Research Team: Cybernetic': {
    type: 'law', elect: 'industrial-planet', expansion: 'base', removedInPok: true,
    effect: 'Attach this card to the elected planet\'s card. When the owner of this planet researches technology, they may exhaust this card to ignore 1 yellow prerequisite.',
  },
  'Research Team: Propulsion': {
    type: 'law', elect: 'industrial-planet', expansion: 'base', removedInPok: true,
    effect: 'Attach this card to the elected planet\'s card. When the owner of this planet researches technology, they may exhaust this card to ignore 1 blue prerequisite.',
  },
  'Research Team: Warfare': {
    type: 'law', elect: 'hazardous-planet', expansion: 'base', removedInPok: true,
    effect: 'Attach this card to the elected planet\'s card. When the owner of this planet researches technology, they may exhaust this card to ignore 1 red prerequisite.',
  },
  'Senate Sanctuary': {
    type: 'law', elect: 'cultural-planet', expansion: 'base', removedInPok: true,
    effect: 'Attach this card to the elected planet\'s card. The influence value of this planet is increased by 2.',
  },
  'Shard of the Throne': {
    type: 'law', elect: 'player', expansion: 'base', removedInPok: true,
    effect: 'The elected player gains this card and 1 victory point. A player gains this card and 1 victory point when they win a combat against the owner of this card. Then, the previous owner of this card loses 1 victory point.',
  },
  'Shared Research': {
    type: 'law', elect: null, expansion: 'base',
    forEffect: 'Each player\'s units can move through nebulae.',
    againstEffect: 'Each player places a command token from their reinforcements in their home system, if able.',
  },
  'Terraforming Initiative': {
    type: 'law', elect: 'hazardous-planet', expansion: 'base', removedInPok: true,
    effect: 'Attach this card to the elected planet\'s card. The resource and influence values of this planet are increased by 1.',
  },
  'The Crown of Emphidia': {
    type: 'law', elect: 'player', expansion: 'base', removedInPok: true,
    effect: 'The elected player gains this card and 1 victory point. A player gains this card and 1 victory point after they gain control of a planet in the home system of this card\'s owner. Then, the previous owner of this card loses 1 victory point.',
  },
  'The Crown of Thalnos': {
    type: 'law', elect: 'player', expansion: 'base', removedInPok: true,
    effect: 'The elected player gains this card. During each combat round, the owner of this card may reroll any number of dice; they must destroy each of their units that did not produce a hit with its reroll.',
  },
  'Wormhole Reconstruction': {
    type: 'law', elect: null, expansion: 'base',
    forEffect: 'All systems that contain either an alpha or beta wormhole are adjacent to each other.',
    againstEffect: 'Each player places a command token from their reinforcements in each system that contains a wormhole and 1 or more of their ships.',
  },
};

// ─── BASE GAME DIRECTIVES ────────────────────────────────────────────────────

const BASE_DIRECTIVES: Record<string, AgendaEntry> = {
  'Archived Secret': {
    type: 'directive', elect: 'player', expansion: 'base',
    effect: 'Elected player draws 1 secret objective.',
  },
  'Arms Reduction': {
    type: 'directive', elect: null, expansion: 'base',
    forEffect: 'Each player destroys all but 2 of their dreadnaughts and all but 4 of their cruisers.',
    againstEffect: 'At the start of the next strategy phase, each player exhausts each of their planets that have a technology specialty.',
  },
  'Colonial Redistribution': {
    type: 'directive', elect: 'non-home-planet', expansion: 'base',
    effect: 'Destroy each unit on the elected planet. Then, the player who controls that planet chooses 1 player with the fewest victory points; that player may place 1 infantry from their reinforcements on the elected planet.',
  },
  'Compensated Disarmament': {
    type: 'directive', elect: 'planet', expansion: 'base',
    effect: 'Destroy each ground force on the elected planet; for each unit that was destroyed, the player who controls that planet gains 1 trade good.',
  },
  'Economic Equality': {
    type: 'directive', elect: null, expansion: 'base',
    forEffect: 'Each player returns all of their trade goods to the supply. Then, each player gains 5 trade goods.',
    againstEffect: 'Each player returns all of their trade goods to the supply.',
  },
  'Incentive Program': {
    type: 'directive', elect: null, expansion: 'base',
    forEffect: 'Draw and reveal 1 stage I public objective from the deck and place it near the public objectives.',
    againstEffect: 'Draw and reveal 1 stage II public objective from the deck and place it near the public objectives.',
  },
  'Ixthian Artifact': {
    type: 'directive', elect: null, expansion: 'base',
    forEffect: 'The speaker rolls 1 die. If the result is 6–10, each player may research 2 technologies. If the result is 1–5, destroy all units in Mecatol Rex\'s system, and each player with units in systems adjacent to Mecatol Rex\'s system destroys 3 of their units in each of those systems.',
    againstEffect: 'No effect.',
  },
  'Judicial Abolishment': {
    type: 'directive', elect: 'law', expansion: 'base',
    trigger: 'When this agenda is revealed, if there are no laws in play, discard this card and reveal another agenda from the top of the deck.',
    effect: 'Discard the elected law from play.',
  },
  'Miscount Disclosed': {
    type: 'directive', elect: 'law', expansion: 'base',
    trigger: 'When this agenda is revealed, if there are no laws in play, discard this card and reveal another agenda from the top of the deck.',
    effect: 'Vote on the elected law as if it were just revealed from the top of the deck.',
  },
  'Mutiny': {
    type: 'directive', elect: null, expansion: 'base',
    forEffect: 'Each player who voted "For" gains 1 victory point.',
    againstEffect: 'Each player who voted "For" loses 1 victory point.',
  },
  'New Constitution': {
    type: 'directive', elect: null, expansion: 'base',
    trigger: 'When this agenda is revealed, if there are no laws in play, discard this card and reveal another agenda from the top of the deck.',
    forEffect: 'Discard all laws in play. At the start of the next strategy phase, each player exhausts each planet in their home system.',
    againstEffect: 'No effect.',
  },
  'Public Execution': {
    type: 'directive', elect: 'player', expansion: 'base',
    effect: 'The elected player discards all of their action cards. If they have the speaker token, they give it to the player on their left. The elected player cannot vote on any agendas during this agenda phase.',
  },
  'Seed of an Empire': {
    type: 'directive', elect: null, expansion: 'base',
    forEffect: 'The player with most victory points gains 1 victory point.',
    againstEffect: 'The player with the fewest victory points gains 1 victory point.',
  },
  'Swords to Plowshares': {
    type: 'directive', elect: null, expansion: 'base',
    forEffect: 'Each player destroys half of their infantry on each planet they control, rounded up. Then, each player gains trade goods equal to the number of their infantry that were destroyed.',
    againstEffect: 'Each player places 1 infantry from their reinforcements on each planet they control.',
  },
  'Unconventional Measures': {
    type: 'directive', elect: null, expansion: 'base',
    forEffect: 'Each player that voted "For" draws 2 action cards.',
    againstEffect: 'Each player that voted "For" discards all of their action cards.',
  },
  'Wormhole Research': {
    type: 'directive', elect: null, expansion: 'base',
    forEffect: 'Each player who has 1 or more ships in a system that contains a wormhole may research 1 technology. Then, destroy all ships in systems that contain an alpha or beta wormhole.',
    againstEffect: 'Each player that voted "Against" removes 1 command token from their command sheet and returns it to their reinforcements.',
  },
};

// ─── POK LAWS ───────────────────────────────────────────────────────────────

const POK_LAWS: Record<string, AgendaEntry> = {
  'Articles of War': {
    type: 'law', elect: null, expansion: 'pok',
    forEffect: 'All mechs lose their printed abilities except for SUSTAIN DAMAGE.',
    againstEffect: 'Each player that voted "For" gains 3 trade goods.',
  },
  'Checks and Balances': {
    type: 'law', elect: null, expansion: 'pok',
    forEffect: 'When a player chooses a strategy card during the strategy phase, they give that strategy card to another player that does not have 1 (or a player that does not have 2 in a three- or four-player game), if able.',
    againstEffect: 'Each player readies only 3 of their planets at the end of this agenda phase.',
  },
  'Nexus Sovereignty': {
    type: 'law', elect: null, expansion: 'pok',
    forEffect: 'Alpha and beta wormholes in the wormhole nexus have no effect during movement.',
    againstEffect: 'Place a gamma wormhole token in the Mecatol Rex system.',
  },
  'Political Censure': {
    type: 'law', elect: 'player', expansion: 'pok',
    effect: 'The elected player gains this card and 1 victory point. The elected player cannot play action cards. If the owner of this card loses this card, they lose 1 victory point.',
  },
  'Representative Government': {
    type: 'law', elect: null, expansion: 'pok',
    forEffect: 'Players cannot exhaust planets to cast votes during the agenda phase; each player may cast 1 vote on each agenda instead. Players cannot cast additional votes.',
    againstEffect: 'At the start of the next strategy phase, each player that voted "Against" exhausts all of their cultural planets.',
  },
  'Search Warrant': {
    type: 'law', elect: 'player', expansion: 'pok',
    effect: 'The elected player gains this card and draws 2 secret objectives. The owner of this card plays with their secret objectives revealed.',
  },
};

// ─── POK DIRECTIVES ─────────────────────────────────────────────────────────

const POK_DIRECTIVES: Record<string, AgendaEntry> = {
  'Armed Forces Standardization': {
    type: 'directive', elect: 'player', expansion: 'pok',
    effect: 'The elected player places command tokens from their reinforcements so that they have 3 tokens in their tactic pool, 3 tokens in their fleet pool and 2 tokens in their strategy pool. They return any excess tokens to their reinforcements.',
  },
  'Clandestine Operations': {
    type: 'directive', elect: null, expansion: 'pok',
    forEffect: 'Each player removes 2 command tokens from their command sheet and returns those tokens to their reinforcements.',
    againstEffect: 'Each player removes 1 command token from their fleet pool and returns that token to their reinforcements.',
  },
  'Covert Legislation': {
    type: 'directive', elect: null, expansion: 'pok',
    trigger: 'When this agenda is revealed, the speaker draws the next card in the agenda deck but does not reveal it to the other players. Instead, the speaker reads the eligible outcomes aloud; the other players vote for these outcomes without knowing their effects.',
    forEffect: 'Resolve the hidden agenda\'s FOR outcome.',
    againstEffect: 'Resolve the hidden agenda\'s AGAINST outcome.',
  },
  'Galactic Crisis Pact': {
    type: 'directive', elect: 'strategy-card', expansion: 'pok',
    effect: 'Each player may perform the secondary ability of the elected strategy card without spending a command token; command tokens placed by the ability are placed from a player\'s reinforcements instead.',
  },
  'Minister of Antiques': {
    type: 'directive', elect: 'player', expansion: 'pok',
    effect: 'The elected player gains 1 relic.',
  },
  'Rearmament Agreement': {
    type: 'directive', elect: null, expansion: 'pok',
    forEffect: 'Each player places 1 mech from their reinforcements on a planet they control in their home system.',
    againstEffect: 'Each player replaces each of their mechs with 1 infantry from their reinforcements.',
  },
  'Research Grant Reallocation': {
    type: 'directive', elect: 'player', expansion: 'pok',
    effect: 'The elected player gains any 1 technology of their choice. Then, for each prerequisite on that technology, they remove 1 token from their fleet pool and return it to their reinforcements.',
  },
};

// ─── Exported dictionary ────────────────────────────────────────────────────

export const AGENDAS: Record<string, AgendaEntry> = {
  ...BASE_LAWS,
  ...BASE_DIRECTIVES,
  ...POK_LAWS,
  ...POK_DIRECTIVES,
};

export function lookupAgenda(name: string): AgendaEntry | null {
  return AGENDAS[name] ?? null;
}
```

**Note on `'Representative Government'` key collision:** Base game and PoK both have a card with this name. The PoK version replaces the base version in play. Since they share the same TI Assistant export string, the PoK entry wins (it is spread last). The base version is handled by flagging it `removedInPok: true`. If you need both stored separately, key the base version as `'Representative Government (TI4)'` to match any TI Assistant exports that distinguish them.

- [ ] **Step 4: Run tests — confirm they pass**

```
cd app && npm test -- agendas.test
```

Expected: all 8 tests pass. If the count test fails (50 base / 13 PoK), recount entries by expansion key and fix any duplicates or missing entries.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/parser/agendas.ts app/src/lib/parser/agendas.test.ts
git commit -m "feat: add agenda dictionary with all 63 TI4 + PoK entries"
```

---

## Task 2: `buildAgendaSummary`

**Files:**
- Create: `app/src/lib/agenda/buildAgendaSummary.ts`
- Create: `app/src/lib/agenda/buildAgendaSummary.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// app/src/lib/agenda/buildAgendaSummary.test.ts
import { describe, it, expect } from 'vitest';
import { buildAgendaSummary } from './buildAgendaSummary';
import type { AgendaResolution, VpEvent, FactionSetup } from '../../lib/parser/types';

const makeFaction = (id: string): FactionSetup => ({
  factionId: id, playerName: 'Player', color: '#aaa',
  mapPosition: 0, startingTechs: [], startingPlanets: [],
});

const makeResolution = (
  overrides: Partial<AgendaResolution> = {}
): AgendaResolution => ({
  agenda: 'Mutiny',
  outcome: 'For',
  round: 2,
  timestamp: 1000,
  votes: [
    { faction: 'Sol', outcome: 'For', votes: 8 },
    { faction: 'Hacan', outcome: 'Against', votes: 5 },
  ],
  riders: [],
  ...overrides,
});

describe('buildAgendaSummary', () => {
  it('returns one entry per resolution', () => {
    const result = buildAgendaSummary(
      [makeResolution(), makeResolution({ agenda: 'Incentive Program', round: 2, timestamp: 2000 })],
      [],
      [makeFaction('Sol'), makeFaction('Hacan')],
    );
    expect(result.entries).toHaveLength(2);
  });

  it('assigns indexInRound 1 and 2 for two agendas in the same round', () => {
    const result = buildAgendaSummary(
      [
        makeResolution({ timestamp: 1000, round: 2 }),
        makeResolution({ timestamp: 2000, round: 2 }),
      ],
      [],
      [makeFaction('Sol')],
    );
    expect(result.entries[0]?.indexInRound).toBe(1);
    expect(result.entries[1]?.indexInRound).toBe(2);
  });

  it('sets passed=true when outcome is "For"', () => {
    const result = buildAgendaSummary([makeResolution({ outcome: 'For' })], [], [makeFaction('Sol')]);
    expect(result.entries[0]?.passed).toBe(true);
  });

  it('sets passed=false when outcome is "Against"', () => {
    const result = buildAgendaSummary([makeResolution({ outcome: 'Against' })], [], [makeFaction('Sol')]);
    expect(result.entries[0]?.passed).toBe(false);
  });

  it('computes totalFor and totalAgainst from votes', () => {
    const result = buildAgendaSummary([makeResolution()], [], [makeFaction('Sol'), makeFaction('Hacan')]);
    const entry = result.entries[0]!;
    expect(entry.totalFor).toBe(8);
    expect(entry.totalAgainst).toBe(5);
  });

  it('attaches agenda dictionary entry when known', () => {
    const result = buildAgendaSummary([makeResolution({ agenda: 'Mutiny' })], [], [makeFaction('Sol')]);
    expect(result.entries[0]?.entry).not.toBeNull();
    expect(result.entries[0]?.entry?.type).toBe('directive');
  });

  it('sets entry to null for unknown agenda names', () => {
    const result = buildAgendaSummary(
      [makeResolution({ agenda: 'Future Expansion Agenda XYZ' })],
      [],
      [makeFaction('Sol')],
    );
    expect(result.entries[0]?.entry).toBeNull();
  });

  it('sets electedFaction for elect-player agendas', () => {
    const result = buildAgendaSummary(
      [makeResolution({ agenda: 'Imperial Arbiter', outcome: 'Hacan', votes: [
        { faction: 'Sol', outcome: 'Hacan', votes: 10 },
        { faction: 'Naal', outcome: 'Sol', votes: 4 },
      ]})],
      [],
      [makeFaction('Sol'), makeFaction('Hacan')],
    );
    expect(result.entries[0]?.electedFaction).toBe('Hacan');
  });

  it('computes net beneficiaries from agenda-sourced vp events', () => {
    const vpEvents: VpEvent[] = [
      { faction: 'Hacan', objective: 'Mutiny', points: 1, timestamp: 1000, source: 'agenda' },
      { faction: 'Sol', objective: 'Mutiny', points: -1, timestamp: 1000, source: 'agenda' },
    ];
    const result = buildAgendaSummary([makeResolution()], vpEvents, [makeFaction('Hacan'), makeFaction('Sol')]);
    const hacan = result.netBeneficiaries.find(b => b.factionId === 'Hacan');
    const sol   = result.netBeneficiaries.find(b => b.factionId === 'Sol');
    expect(hacan?.vpDelta).toBe(1);
    expect(sol?.vpDelta).toBe(-1);
  });

  it('omits factions with zero agenda VP delta from netBeneficiaries', () => {
    const result = buildAgendaSummary([makeResolution()], [], [makeFaction('Sol'), makeFaction('Hacan')]);
    expect(result.netBeneficiaries).toHaveLength(0);
  });

  it('generates a deckText string', () => {
    const result = buildAgendaSummary([makeResolution()], [], [makeFaction('Sol')]);
    expect(typeof result.deckText).toBe('string');
    expect(result.deckText.length).toBeGreaterThan(0);
  });

  it('sorts entries ascending by timestamp', () => {
    const result = buildAgendaSummary(
      [makeResolution({ timestamp: 5000 }), makeResolution({ timestamp: 1000 })],
      [],
      [makeFaction('Sol')],
    );
    expect(result.entries[0]?.timestamp).toBe(1000);
    expect(result.entries[1]?.timestamp).toBe(5000);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
cd app && npm test -- buildAgendaSummary.test
```

Expected: FAIL — "Cannot find module './buildAgendaSummary'"

- [ ] **Step 3: Create the function**

```typescript
// app/src/lib/agenda/buildAgendaSummary.ts
import { lookupAgenda } from '../parser/agendas';
import type { AgendaEntry } from '../parser/agendas';
import type {
  AgendaResolution, AgendaVote, AgendaRider, VpEvent, FactionSetup,
} from '../parser/types';

export interface AgendaDisplayEntry {
  round: number;
  indexInRound: 1 | 2;
  agenda: string;
  entry: AgendaEntry | null;
  outcome: string;
  passed: boolean;
  electedFaction?: string;
  totalFor: number;
  totalAgainst: number;
  votes: AgendaVote[];
  riders: AgendaRider[];
  timestamp: number;
}

export interface AgendaSummary {
  entries: AgendaDisplayEntry[];
  netBeneficiaries: Array<{ factionId: string; vpDelta: number }>;
  deckText: string;
}

export function buildAgendaSummary(
  agendaResolutions: AgendaResolution[],
  vpEvents: VpEvent[],
  factions: FactionSetup[],
): AgendaSummary {
  // Sort ascending by timestamp
  const sorted = [...agendaResolutions].sort((a, b) => a.timestamp - b.timestamp);

  // Track how many agendas we have seen per round for indexInRound
  const roundCount: Record<number, number> = {};

  const entries: AgendaDisplayEntry[] = sorted.map((res) => {
    roundCount[res.round] = (roundCount[res.round] ?? 0) + 1;
    const indexInRound = roundCount[res.round] as 1 | 2;

    const dictEntry = lookupAgenda(res.agenda);

    // FOR/AGAINST totals: group by outcome string
    const forOutcome = 'For';
    const totalFor = res.votes
      .filter((v) => v.outcome === forOutcome)
      .reduce((sum, v) => sum + v.votes, 0);
    const totalAgainst = res.votes
      .filter((v) => v.outcome !== forOutcome)
      .reduce((sum, v) => sum + v.votes, 0);

    // passed: true when outcome matches the FOR side
    const passed = res.outcome === forOutcome;

    // electedFaction: the outcome string for elect-player agendas
    const electedFaction =
      dictEntry?.elect === 'player' ? res.outcome : undefined;

    return {
      round: res.round,
      indexInRound,
      agenda: res.agenda,
      entry: dictEntry,
      outcome: res.outcome,
      passed,
      electedFaction,
      totalFor,
      totalAgainst,
      votes: res.votes,
      riders: res.riders,
      timestamp: res.timestamp,
    };
  });

  // Net beneficiaries: VP deltas from agenda-sourced events only
  const deltaMap: Record<string, number> = {};
  for (const event of vpEvents) {
    if (event.source !== 'agenda') continue;
    deltaMap[event.faction] = (deltaMap[event.faction] ?? 0) + event.points;
  }
  const netBeneficiaries = Object.entries(deltaMap)
    .filter(([, delta]) => delta !== 0)
    .map(([factionId, vpDelta]) => ({ factionId, vpDelta }))
    .sort((a, b) => Math.abs(b.vpDelta) - Math.abs(a.vpDelta));

  // Deck text
  const passedCount = entries.filter((e) => e.passed).length;
  const topBeneficiary = netBeneficiaries[0];
  let deckText: string;
  if (topBeneficiary !== undefined) {
    const sign = topBeneficiary.vpDelta > 0 ? '+' : '';
    deckText = `${topBeneficiary.factionId} the net agenda beneficiary at ${sign}${topBeneficiary.vpDelta} VP.`;
  } else {
    deckText = `${entries.length} agendas resolved, ${passedCount} passed.`;
  }

  return { entries, netBeneficiaries, deckText };
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```
cd app && npm test -- buildAgendaSummary.test
```

Expected: all 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/agenda/buildAgendaSummary.ts app/src/lib/agenda/buildAgendaSummary.test.ts
git commit -m "feat: add buildAgendaSummary pure function"
```

---

## Task 3: Tech Color Dictionary

**Files:**
- Create: `app/src/lib/parser/techs.ts`
- Create: `app/src/lib/parser/techs.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// app/src/lib/parser/techs.test.ts
import { describe, it, expect } from 'vitest';
import { lookupTechColor } from './techs';

describe('lookupTechColor', () => {
  it('returns "green" for a known Biotic tech', () => {
    expect(lookupTechColor('Neural Motivator')).toBe('green');
  });

  it('returns "blue" for a known Propulsion tech', () => {
    expect(lookupTechColor('Sling Relay')).toBe('blue');
  });

  it('returns "yellow" for a known Cybernetics tech', () => {
    expect(lookupTechColor('Sarween Tools')).toBe('yellow');
  });

  it('returns "red" for a known Warfare tech', () => {
    expect(lookupTechColor('Magen Defense Grid')).toBe('red');
  });

  it('returns "unit" for a known unit upgrade', () => {
    expect(lookupTechColor('Dreadnought II')).toBe('unit');
  });

  it('returns "unit" for an unknown tech name (graceful fallback)', () => {
    expect(lookupTechColor('Some Future Expansion Tech')).toBe('unit');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
cd app && npm test -- techs.test
```

Expected: FAIL — "Cannot find module './techs'"

- [ ] **Step 3: Create the tech color dictionary**

```typescript
// app/src/lib/parser/techs.ts
// Maps TI4 + PoK tech names to their color category.
// Colors correspond to TI4 tech schools:
//   green  = Biotic   (green prerequisite symbol)
//   blue   = Propulsion (blue prerequisite symbol)
//   yellow = Cybernetics (yellow prerequisite symbol)
//   red    = Warfare   (red prerequisite symbol)
//   unit   = Unit upgrade (no single color) or unknown
//
// IMPORTANT: Keys must match EXACTLY what TI Assistant exports in techEvents[i].tech.
// Run the discover-data script (see Phase 1 backlog) to find all unique tech strings
// in your game exports and fill any gaps. Unknown names gracefully return 'unit'.

export type TechColor = 'green' | 'blue' | 'yellow' | 'red' | 'unit';

const TECH_COLORS: Record<string, TechColor> = {
  // ── Biotic (green) ────────────────────────────────────────────────────────
  'Neural Motivator': 'green',
  'Psychoarchaeology': 'green',
  'Dacxive Animators': 'green',
  'Bio-Stims': 'green',
  'Hyper Metabolism': 'green',
  'Mageon Implants': 'green',
  'Neuroglaive': 'green',
  'Spacial Conduit Cylinder': 'green',
  'Instinct Training': 'green',
  'AI Development Algorithm': 'green',
  'Transparasteel Plating': 'green',
  'E-res Siphons': 'green',
  'Vortex': 'green',
  'Bioplasmics': 'green',
  'Genetic Recombination': 'green',
  'Production Biomes': 'green',
  'Valefar Assimilator X': 'green',
  'Valefar Assimilator Y': 'green',
  'Quantum Entanglement': 'green',
  'Wormhole Generator': 'green',
  'Pre-Fab Arcologies': 'green',
  'Hegemonic Trade Policy': 'green',

  // ── Propulsion (blue) ─────────────────────────────────────────────────────
  'Sling Relay': 'blue',
  'Fleet Logistics': 'blue',
  'Light-Wave Deflector': 'blue',
  'Aetherpassage': 'blue',
  'Mirror Computing': 'blue',
  'Transit Diodes': 'blue',
  'Impulse Core': 'blue',
  'Lazax Gate Folding': 'blue',
  'Aerie Hololattice': 'blue',
  'Chaos Mapping': 'blue',
  'Nullification Field': 'blue',
  'Wormhole Generator (Creuss)': 'blue',
  'Non-Euclidean Shielding': 'blue',
  'Quantum Datahub Node': 'blue',
  'Graviton Laser System': 'blue',

  // ── Cybernetics (yellow) ──────────────────────────────────────────────────
  'Sarween Tools': 'yellow',
  'Scanlink Drone Network': 'yellow',
  'Integrated Economy': 'yellow',
  'Predictive Intelligence': 'yellow',
  'Inheritance Systems': 'yellow',
  'Salvage Operations': 'yellow',
  'Yin Spinner': 'yellow',
  'L4 Disruptors': 'yellow',
  'Crimson Legionnaire II': 'yellow',
  'Memoria II': 'yellow',
  'Agency Supply Network': 'yellow',
  'Bio-Stims (Yin)': 'yellow',
  'Dimora Initiative': 'yellow',
  'Wormhole Generator II': 'yellow',
  'Encryption Codes': 'yellow',

  // ── Warfare (red) ─────────────────────────────────────────────────────────
  'Magen Defense Grid': 'red',
  'Duranium Armor': 'red',
  'Supercharge': 'red',
  'Plasma Scoring': 'red',
  'Assault Cannon': 'red',
  'Self-Assembly Routines': 'red',
  'Iff System': 'red',
  'Magmus Reactor': 'red',
  'Magmus Reactor II': 'red',
  'Valiant-Class Cruiser': 'red',
  'Strike Wing Ambuscade': 'red',
  'Tyrant': 'red',
  'Vortex (Yin)': 'red',
  'X-89 Bacterial Weapon': 'red',
  'Wormhole Generator (Mendak)': 'red',

  // ── Unit Upgrades (unit) ──────────────────────────────────────────────────
  'Carrier II': 'unit',
  'Cruiser II': 'unit',
  'Destroyer II': 'unit',
  'Dreadnought II': 'unit',
  'Fighter II': 'unit',
  'Infantry II': 'unit',
  'PDS II': 'unit',
  'Space Dock II': 'unit',
  'War Sun': 'unit',
  // Faction-specific unit upgrades
  'Exotrireme II': 'unit',
  'Memoria II (ship)': 'unit',
  'Saturn Engine II': 'unit',
  'Spec Ops II': 'unit',
  'Hybrid Crystal Fighter II': 'unit',
  'Super-Dreadnought II': 'unit',
  'Prototype War Sun II': 'unit',
  'Strike Wing Alpha II': 'unit',
  'Eidolon': 'unit',
  'Tyrant (unit)': 'unit',
  'Advance Carrier II': 'unit',
  'Floating Factory II': 'unit',
  'Hel-Titan II': 'unit',
  'Crimson Legionnaire II (unit)': 'unit',
  'Valiant-Class Cruiser (unit)': 'unit',
};

export function lookupTechColor(tech: string): TechColor {
  return TECH_COLORS[tech] ?? 'unit';
}
```

**Note:** This covers the most common TI4 + PoK techs. If you encounter grey pips for techs you expect to be colored, run `grep -r '"tech"' app/game-data/` to find all unique tech strings in your exports and add any missing entries.

- [ ] **Step 4: Run tests — confirm they pass**

```
cd app && npm test -- techs.test
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/parser/techs.ts app/src/lib/parser/techs.test.ts
git commit -m "feat: add tech color dictionary"
```

---

## Task 4: `buildTechSummary`

**Files:**
- Create: `app/src/lib/tech/buildTechSummary.ts`
- Create: `app/src/lib/tech/buildTechSummary.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// app/src/lib/tech/buildTechSummary.test.ts
import { describe, it, expect } from 'vitest';
import { buildTechSummary } from './buildTechSummary';
import type { TechEvent, FactionSetup, PhaseSnapshot } from '../../lib/parser/types';

const makeFaction = (id: string, map = 0, starting: string[] = []): FactionSetup => ({
  factionId: id, playerName: 'P', color: '#aaa',
  mapPosition: map, startingTechs: starting, startingPlanets: [],
});

const makeSnapshot = (round: number, ts: number): PhaseSnapshot => ({
  round, phase: 'action', speaker: 'Sol',
  strategyCards: {},
  // PhaseSnapshot has no timestamp in the type — use the timestamp field from the event
  // to derive round via sorted snapshots. We inject snapshots with round numbers and
  // timestamps for bucketing.
  // NOTE: PhaseSnapshot in types.ts does not have a timestamp field.
  // buildTechSummary receives phaseSnapshots and uses their position in the sorted
  // agendaResolutions to derive round. Since PhaseSnapshot has no timestamp, we pass
  // round number directly and the function uses techEvent.round if available, or
  // falls back to round 1 for all events when phaseSnapshots is empty.
});

// IMPORTANT: PhaseSnapshot in types.ts:
// { round: number; phase: string; speaker: string; strategyCards: Record<string,string> }
// There is NO timestamp on PhaseSnapshot. buildTechSummary cannot bucket by timestamp.
// Instead: pass an augmented array [{round, phaseStart: timestamp}] derived outside.
// See implementation note in buildTechSummary.ts.

const makeTechEvent = (
  faction: string,
  tech: string,
  type: TechEvent['type'],
  timestamp: number,
): TechEvent => ({ faction, tech, type, timestamp });

describe('buildTechSummary', () => {
  it('timeline contains only "research" type events, sorted by timestamp', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Neural Motivator', 'research', 2000),
      makeTechEvent('Hacan', 'Sarween Tools', 'starting', 100),
      makeTechEvent('Sol', 'Bio-Stims', 'research', 1000),
    ];
    const result = buildTechSummary(events, [makeFaction('Sol'), makeFaction('Hacan')], []);
    expect(result.timeline).toHaveLength(2);
    expect(result.timeline[0]?.tech).toBe('Bio-Stims');
    expect(result.timeline[1]?.tech).toBe('Neural Motivator');
  });

  it('timeline entries have correct factionId', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Bio-Stims', 'research', 1000),
    ];
    const result = buildTechSummary(events, [makeFaction('Sol')], []);
    expect(result.timeline[0]?.factionId).toBe('Sol');
  });

  it('assigns tech color via lookupTechColor', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Sarween Tools', 'research', 1000),
    ];
    const result = buildTechSummary(events, [makeFaction('Sol')], []);
    expect(result.timeline[0]?.color).toBe('yellow');
  });

  it('inventories include both research and starting techs', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Neural Motivator', 'starting', 100),
      makeTechEvent('Sol', 'Bio-Stims', 'research', 1000),
    ];
    const result = buildTechSummary(events, [makeFaction('Sol')], []);
    expect(result.inventories[0]?.techs).toHaveLength(2);
  });

  it('inventory techs carry origin field', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Neural Motivator', 'starting', 100),
      makeTechEvent('Sol', 'Bio-Stims', 'research', 1000),
    ];
    const result = buildTechSummary(events, [makeFaction('Sol')], []);
    const techs = result.inventories[0]?.techs ?? [];
    expect(techs.find(t => t.tech === 'Neural Motivator')?.origin).toBe('starting');
    expect(techs.find(t => t.tech === 'Bio-Stims')?.origin).toBe('research');
  });

  it('inventories are ordered by faction mapPosition', () => {
    const events: TechEvent[] = [
      makeTechEvent('Hacan', 'Sarween Tools', 'research', 1000),
      makeTechEvent('Sol', 'Bio-Stims', 'research', 2000),
    ];
    const result = buildTechSummary(
      events,
      [makeFaction('Sol', 1), makeFaction('Hacan', 0)],
      [],
    );
    expect(result.inventories[0]?.factionId).toBe('Hacan');
    expect(result.inventories[1]?.factionId).toBe('Sol');
  });

  it('totalResearched counts only research events', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Neural Motivator', 'starting', 100),
      makeTechEvent('Sol', 'Bio-Stims', 'research', 1000),
      makeTechEvent('Sol', 'Sarween Tools', 'research', 2000),
    ];
    const result = buildTechSummary(events, [makeFaction('Sol')], []);
    expect(result.totalResearched).toBe(2);
  });

  it('totalStarting counts only starting events', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Neural Motivator', 'starting', 100),
      makeTechEvent('Hacan', 'Sarween Tools', 'starting', 101),
      makeTechEvent('Sol', 'Bio-Stims', 'research', 1000),
    ];
    const result = buildTechSummary(
      events,
      [makeFaction('Sol'), makeFaction('Hacan')],
      [],
    );
    expect(result.totalStarting).toBe(2);
  });

  it('ignores remove and purge events in timeline and totals', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Bio-Stims', 'research', 1000),
      makeTechEvent('Sol', 'Bio-Stims', 'purge', 2000),
    ];
    const result = buildTechSummary(events, [makeFaction('Sol')], []);
    expect(result.totalResearched).toBe(1);
    expect(result.timeline).toHaveLength(1);
  });

  it('deckText is a non-empty string', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Bio-Stims', 'research', 1000),
    ];
    const result = buildTechSummary(events, [makeFaction('Sol')], []);
    expect(typeof result.deckText).toBe('string');
    expect(result.deckText.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```
cd app && npm test -- buildTechSummary.test
```

Expected: FAIL — "Cannot find module './buildTechSummary'"

- [ ] **Step 3: Create the function**

```typescript
// app/src/lib/tech/buildTechSummary.ts
// IMPLEMENTATION NOTE on round derivation:
// PhaseSnapshot in types.ts has no timestamp field, so we cannot bucket TechEvents
// into rounds by comparing timestamps. Instead, buildTechSummary accepts an optional
// roundBoundaries parameter: an array of { round: number; phaseStartTimestamp: number }
// sorted ascending. If provided, each tech event is assigned to the round whose
// phaseStartTimestamp is ≤ event.timestamp. If roundBoundaries is empty, all events
// are assigned round 0 (displayed as "—").
// Callers derive roundBoundaries from phaseSnapshots via a helper exported below.

import { lookupTechColor } from '../parser/techs';
import type { TechColor } from '../parser/techs';
import type { TechEvent, FactionSetup, PhaseSnapshot } from '../parser/types';

export interface TechTimelineEntry {
  round: number;
  factionId: string;
  tech: string;
  color: TechColor;
  type: 'research';
}

export interface FactionTechInventoryItem {
  tech: string;
  color: TechColor;
  origin: 'research' | 'starting';
}

export interface FactionTechInventory {
  factionId: string;
  techs: FactionTechInventoryItem[];
}

export interface TechSummary {
  timeline: TechTimelineEntry[];
  inventories: FactionTechInventory[];
  totalResearched: number;
  totalStarting: number;
  deckText: string;
}

export interface RoundBoundary {
  round: number;
  phaseStartTimestamp: number;
}

/** Derive round boundaries from phaseSnapshots.
 *  Each unique round's earliest snapshot timestamp becomes that round's start.
 *  Pass the result to buildTechSummary as the optional roundBoundaries param. */
export function deriveRoundBoundaries(snapshots: PhaseSnapshot[]): RoundBoundary[] {
  // PhaseSnapshot has no timestamp — we cannot derive boundaries without timestamps.
  // This function exists as an extension point; callers with timestamp-augmented
  // snapshots can pass boundaries manually. Return empty array as default.
  void snapshots;
  return [];
}

function assignRound(timestamp: number, boundaries: RoundBoundary[]): number {
  if (boundaries.length === 0) return 0;
  let round = boundaries[0]?.round ?? 0;
  for (const b of boundaries) {
    if (b.phaseStartTimestamp <= timestamp) round = b.round;
    else break;
  }
  return round;
}

export function buildTechSummary(
  techEvents: TechEvent[],
  factions: FactionSetup[],
  _phaseSnapshots: PhaseSnapshot[],
  roundBoundaries: RoundBoundary[] = [],
): TechSummary {
  const sorted = [...techEvents].sort((a, b) => a.timestamp - b.timestamp);

  // Build timeline: research events only
  const timeline: TechTimelineEntry[] = sorted
    .filter((e) => e.type === 'research')
    .map((e) => ({
      round: assignRound(e.timestamp, roundBoundaries),
      factionId: e.faction,
      tech: e.tech,
      color: lookupTechColor(e.tech),
      type: 'research' as const,
    }));

  // Build per-faction inventories ordered by mapPosition
  const factionsSorted = [...factions].sort((a, b) => a.mapPosition - b.mapPosition);
  const inventories: FactionTechInventory[] = factionsSorted.map((faction) => {
    const techs: FactionTechInventoryItem[] = sorted
      .filter((e) => e.faction === faction.factionId && (e.type === 'research' || e.type === 'starting'))
      .map((e) => ({
        tech: e.tech,
        color: lookupTechColor(e.tech),
        origin: e.type as 'research' | 'starting',
      }));
    return { factionId: faction.factionId, techs };
  });

  const totalResearched = sorted.filter((e) => e.type === 'research').length;
  const totalStarting   = sorted.filter((e) => e.type === 'starting').length;

  // Deck text: faction with most researched techs leads
  const researchCounts: Record<string, number> = {};
  for (const e of sorted.filter((e) => e.type === 'research')) {
    researchCounts[e.faction] = (researchCounts[e.faction] ?? 0) + 1;
  }
  const sorted_factions = Object.entries(researchCounts).sort(([, a], [, b]) => b - a);
  let deckText: string;
  if (sorted_factions.length === 0) {
    deckText = 'No technologies researched this game.';
  } else if (sorted_factions.length >= 2 && sorted_factions[0]![1] === sorted_factions[1]![1]) {
    deckText = `${totalResearched} technologies researched across ${factions.length} factions.`;
  } else {
    const [leader, count] = sorted_factions[0]!;
    deckText = `${leader} led the tech race with ${count} technolog${count === 1 ? 'y' : 'ies'} researched.`;
  }

  return { timeline, inventories, totalResearched, totalStarting, deckText };
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```
cd app && npm test -- buildTechSummary.test
```

Expected: all 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/tech/buildTechSummary.ts app/src/lib/tech/buildTechSummary.test.ts
git commit -m "feat: add buildTechSummary pure function"
```

---

## Task 5: TechSection Component

**Files:**
- Create: `app/src/features/game-detail/TechSection.tsx`

- [ ] **Step 1: Write the failing test (section stub contract)**

The section stub tests in `sections.test.tsx` are extended in Task 7. For now, confirm the component renders without crashing using the existing `GameContext`.

```typescript
// Append to app/src/features/game-detail/sections.test.tsx after existing cases:
import { TechSection } from './TechSection';
// (Add to the cases array in Task 7 — see that task for the full edit)
```

Skip this step — the section stub test is added in Task 7. Proceed to implementation.

- [ ] **Step 2: Create TechSection**

```tsx
// app/src/features/game-detail/TechSection.tsx
import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildTechSummary } from '../../lib/tech/buildTechSummary';
import type { TechColor } from '../../lib/parser/techs';
import { Label, Rule } from '../../shared';

const COLOR_VAR: Record<TechColor, string> = {
  green:  'var(--moss)',
  blue:   'var(--cool)',
  yellow: 'var(--gold)',
  red:    'var(--accent)',
  unit:   'var(--ink-2)',
};

function TechPip({ color }: { color: TechColor }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: COLOR_VAR[color],
        flexShrink: 0,
        verticalAlign: 'middle',
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
        verticalAlign: 'middle',
      }}
    />
  );
}

export function TechSection() {
  const { game } = useGame();

  const summary = useMemo(
    () =>
      game
        ? buildTechSummary(game.techEvents, game.factions, game.phaseSnapshots)
        : null,
    [game],
  );

  if (game === null || summary === null) return null;

  const factionColorMap: Record<string, string> = {};
  for (const f of game.factions) {
    factionColorMap[f.factionId] = f.color;
  }

  return (
    <section
      id="tech"
      data-section="tech"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      {/* Kicker */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
          borderBottom: '1px solid var(--ink-4)',
          paddingBottom: 3,
          marginBottom: 6,
        }}
      >
        <span>Technology · This Game</span>
        <span>{summary.totalResearched} researched</span>
      </div>

      {/* Headline + Deck */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 17,
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 2,
        }}
      >
        The arms race.
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
        {summary.deckText}
      </div>

      <Rule weight="double" />

      {/* Research Order */}
      <Label>Research Order</Label>
      <div
        style={{
          borderLeft: '2px solid var(--cool)',
          paddingLeft: 8,
          marginBottom: 8,
        }}
      >
        {summary.timeline.length === 0 ? (
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              color: 'var(--ink-3)',
              padding: '4px 0',
            }}
          >
            No technologies researched.
          </div>
        ) : (
          summary.timeline.map((entry, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr 8px',
                gap: 4,
                alignItems: 'center',
                padding: '2px 0',
                borderBottom: '1px dotted var(--ink-4)',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
              }}
            >
              <span style={{ color: 'var(--ink-3)' }}>
                {entry.round === 0 ? '—' : `R${entry.round}`}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Newsreader', Georgia, serif", fontSize: 10 }}>
                <FactionDot color={factionColorMap[entry.factionId] ?? '#aaa'} />
                {entry.tech}
              </span>
              <TechPip color={entry.color} />
            </div>
          ))
        )}
      </div>

      <Rule />

      {/* Final Inventories */}
      <Label>Final Inventories</Label>
      {summary.inventories.map((inv, i) => {
        const faction = game.factions.find(f => f.factionId === inv.factionId);
        if (!faction || inv.techs.length === 0) return null;
        return (
          <div key={inv.factionId}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 5,
                margin: '5px 0 2px',
              }}
            >
              <FactionDot color={faction.color} />
              <span
                style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontWeight: 700,
                  fontSize: 11,
                }}
              >
                {faction.factionId}
              </span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 8,
                  color: 'var(--ink-3)',
                  marginLeft: 'auto',
                }}
              >
                {inv.techs.length} tech{inv.techs.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6, fontSize: 10 }}>
              {inv.techs.map((t, j) => (
                <span key={j} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <TechPip color={t.color} />
                  {t.tech}
                  {t.origin === 'starting' && (
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 7,
                        border: '1px solid var(--cool)',
                        color: 'var(--cool)',
                        padding: '0 3px',
                        lineHeight: '12px',
                        display: 'inline-block',
                      }}
                    >
                      start
                    </span>
                  )}
                </span>
              ))}
            </div>
            {i < summary.inventories.length - 1 && <Rule />}
          </div>
        );
      })}
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/src/features/game-detail/TechSection.tsx
git commit -m "feat: add TechSection component"
```

---

## Task 6: AgendaSection Component

**Files:**
- Create: `app/src/features/game-detail/AgendaSection.tsx`

- [ ] **Step 1: Create AgendaSection**

```tsx
// app/src/features/game-detail/AgendaSection.tsx
import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildAgendaSummary, type AgendaDisplayEntry } from '../../lib/agenda/buildAgendaSummary';
import { Label, Rule } from '../../shared';

const INDEX_LABEL = ['I', 'II'] as const;

function EffectBlock({ entry }: { entry: AgendaDisplayEntry['entry'] }) {
  if (entry === null) return null;

  const blockStyle: React.CSSProperties = {
    background: 'var(--paper-2)',
    borderLeft: '2px solid var(--ink-4)',
    padding: '6px 8px',
    margin: '6px 0',
    fontSize: 10,
    lineHeight: 1.5,
  };
  const labelStyle = (color: string): React.CSSProperties => ({
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color,
    display: 'block',
  });
  const textStyle: React.CSSProperties = {
    color: 'var(--ink-2)',
    fontFamily: "'Newsreader', Georgia, serif",
    display: 'block',
    marginTop: 1,
    marginBottom: 4,
  };

  if (entry.elect === null) {
    return (
      <div style={blockStyle}>
        {entry.forEffect && (
          <>
            <span style={labelStyle('var(--accent)')}>For:</span>
            <span style={textStyle}>{entry.forEffect}</span>
          </>
        )}
        {entry.againstEffect && (
          <>
            <span style={labelStyle('var(--cool)')}>Against:</span>
            <span style={{ ...textStyle, marginBottom: 0 }}>{entry.againstEffect}</span>
          </>
        )}
      </div>
    );
  }

  const electLabel = `Elect ${entry.elect?.replace(/-/g, ' ')} · Effect:`;
  return (
    <div style={blockStyle}>
      {entry.trigger && (
        <span style={{ ...textStyle, color: 'var(--ink-3)', fontStyle: 'italic', marginBottom: 6 }}>
          {entry.trigger}
        </span>
      )}
      <span style={labelStyle('var(--ink-3)')}>{electLabel}</span>
      {entry.effect && (
        <span style={{ ...textStyle, marginBottom: 0 }}>{entry.effect}</span>
      )}
    </div>
  );
}

function VoteColumns({ agendaEntry }: { agendaEntry: AgendaDisplayEntry }) {
  const { votes, entry, totalFor, totalAgainst, electedFaction } = agendaEntry;
  const isElect = entry?.elect !== null && entry?.elect !== undefined;

  if (isElect && electedFaction !== undefined) {
    // Group votes by candidate
    const byCandidate: Record<string, Array<{ faction: string; votes: number }>> = {};
    for (const v of votes) {
      if (!byCandidate[v.outcome]) byCandidate[v.outcome] = [];
      byCandidate[v.outcome]!.push({ faction: v.faction, votes: v.votes });
    }
    const candidateEntries = Object.entries(byCandidate).sort(([, a], [, b]) => {
      const sumA = a.reduce((s, x) => s + x.votes, 0);
      const sumB = b.reduce((s, x) => s + x.votes, 0);
      return sumB - sumA;
    });

    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(candidateEntries.length, 3)}, 1fr)`, gap: 8 }}>
        {candidateEntries.map(([candidate, voters]) => {
          const total = voters.reduce((s, v) => s + v.votes, 0);
          const isWinner = candidate === electedFaction;
          return (
            <div key={candidate}>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 8,
                  fontWeight: 700,
                  color: isWinner ? 'var(--accent)' : 'var(--ink-3)',
                  marginBottom: 3,
                }}
              >
                {candidate} · {total}
              </div>
              <Rule />
              {voters.map((v) => (
                <div
                  key={v.faction}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '1px 0' }}
                >
                  <span style={{ flex: 1 }}>{v.faction}</span>
                  <strong>{v.votes}</strong>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  // FOR / AGAINST layout
  const forVoters  = votes.filter((v) => v.outcome === 'For');
  const againstVoters = votes.filter((v) => v.outcome !== 'For');

  const colLabel = (label: string, total: number, color: string) => (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 8,
        fontWeight: 700,
        color,
        marginBottom: 3,
      }}
    >
      {label} · {total}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <div>
        {colLabel('For', totalFor, 'var(--accent)')}
        <Rule />
        {forVoters.map((v) => (
          <div key={v.faction} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '1px 0' }}>
            <span style={{ flex: 1 }}>{v.faction}</span>
            <strong>{v.votes}</strong>
          </div>
        ))}
      </div>
      <div>
        {colLabel('Against', totalAgainst, 'var(--cool)')}
        <Rule />
        {againstVoters.map((v) => (
          <div key={v.faction} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '1px 0' }}>
            <span style={{ flex: 1 }}>{v.faction}</span>
            <strong>{v.votes}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgendaSection() {
  const { game } = useGame();

  const summary = useMemo(
    () =>
      game
        ? buildAgendaSummary(game.agendaResolutions, game.vpEvents, game.factions)
        : null,
    [game],
  );

  if (game === null || summary === null) return null;

  const passedCount = summary.entries.filter((e) => e.passed).length;

  return (
    <section
      id="agenda"
      data-section="agenda"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      {/* Kicker */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
          borderBottom: '1px solid var(--ink-4)',
          paddingBottom: 3,
          marginBottom: 6,
        }}
      >
        <span>The Galactic Senate · Record</span>
        <span>{summary.entries.length} agendas · {passedCount} passed</span>
      </div>

      {/* Headline + Deck */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 17,
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 2,
        }}
      >
        Laws of the Realm.
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
        {summary.deckText}
      </div>

      <Rule weight="double" />

      {summary.entries.length === 0 ? (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color: 'var(--ink-3)',
            padding: '8px 0',
          }}
        >
          No agendas resolved this game.
        </div>
      ) : (
        summary.entries.map((entry, i) => (
          <div key={i}>
            {/* Round label */}
            <Label>Round {entry.round} · Agenda {INDEX_LABEL[(entry.indexInRound - 1) as 0 | 1]}</Label>

            {/* Agenda name */}
            <div
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: 15,
                fontWeight: 800,
                fontStyle: 'italic',
                margin: '4px 0 2px',
              }}
            >
              "{entry.agenda}."
            </div>

            {/* Status row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 7,
                  padding: '0 3px',
                  lineHeight: '11px',
                  display: 'inline-block',
                  height: 11,
                  ...(entry.entry?.type === 'law'
                    ? { background: 'var(--ink)', color: 'var(--paper)' }
                    : { border: '1px solid var(--ink-3)', color: 'var(--ink-3)' }),
                }}
              >
                {entry.entry?.type === 'law' ? 'LAW' : 'DIR'}
              </span>
              {entry.electedFaction !== undefined ? (
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'var(--ink-3)' }}>
                  Elect: {entry.entry?.elect?.replace(/-/g, ' ')} · <strong style={{ color: 'var(--ink)' }}>{entry.electedFaction} elected</strong>
                </span>
              ) : (
                <>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 8,
                      fontWeight: 700,
                      color: entry.passed ? 'var(--ink)' : 'var(--ink-3)',
                    }}
                  >
                    {entry.passed ? 'PASSED' : 'failed'}
                  </span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'var(--ink-3)' }}>
                    {entry.totalFor} for · {entry.totalAgainst} against
                  </span>
                </>
              )}
            </div>

            {/* Effect block */}
            <EffectBlock entry={entry.entry} />

            {/* Vote breakdown */}
            <VoteColumns agendaEntry={entry} />

            {i < summary.entries.length - 1 && <Rule />}
          </div>
        ))
      )}

      {/* Net Beneficiaries */}
      {summary.netBeneficiaries.length > 0 && (
        <>
          <Rule />
          <Label>Net Beneficiaries (VP)</Label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
            {summary.netBeneficiaries.map(({ factionId, vpDelta }) => (
              <span
                key={factionId}
                style={{
                  background: 'var(--paper-2)',
                  padding: '1px 5px',
                  border: '1px solid var(--ink-4)',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 9,
                  opacity: vpDelta < 0 ? 0.6 : 1,
                }}
              >
                {factionId} {vpDelta > 0 ? '+' : ''}{vpDelta}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/features/game-detail/AgendaSection.tsx
git commit -m "feat: add AgendaSection component"
```

---

## Task 7: Wire Up Nav + ScrollBody

**Files:**
- Modify: `app/src/features/game-detail/ScrollBody.tsx`
- Modify: `app/src/features/game-detail/FrozenHeader.tsx`
- Modify: `app/src/features/game-detail/sections.test.tsx`

- [ ] **Step 1: Update the section stub tests**

Replace the entire contents of `sections.test.tsx`:

```tsx
// app/src/features/game-detail/sections.test.tsx
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VpRaceSection } from './VpRaceSection';
import { TimelineSection } from './TimelineSection';
import { DashboardSection } from './DashboardSection';
import { PlanetsSection } from './PlanetsSection';
import { TechSection } from './TechSection';
import { AgendaSection } from './AgendaSection';
import { GameContext } from './GameContext';
import type { ParsedGame } from '../../lib/parser/types';

const minimalGame = {
  gameId: 'test', playedAt: 0, durationSeconds: 0,
  factions: [], options: {}, initialSpeaker: '',
  phaseSnapshots: [], vpEvents: [], planetEvents: [],
  techEvents: [], agendaResolutions: [], strategyCardEvents: [],
  actionCardEvents: [], componentEvents: [], relicEvents: [],
  leaderEvents: [], objectiveReveals: [], speakerEvents: [],
  attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: [],
  expeditionEvents: [], secondaryEvents: [], actionEvents: [],
  finalScores: {}, winner: null,
  timers: { game: 0, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
  warnings: [],
} as unknown as ParsedGame;

function withGame(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <GameContext.Provider value={{ game: minimalGame, loading: false, error: null }}>
        {ui}
      </GameContext.Provider>
    </MemoryRouter>
  );
}

const cases = [
  { Component: VpRaceSection,   id: 'vp-race',   needsGame: false },
  { Component: TimelineSection, id: 'timeline',  needsGame: false },
  { Component: DashboardSection,id: 'dashboard', needsGame: false },
  { Component: PlanetsSection,  id: 'planets',   needsGame: false },
  { Component: TechSection,     id: 'tech',      needsGame: true  },
  { Component: AgendaSection,   id: 'agenda',    needsGame: true  },
] as const;

cases.forEach(({ Component, id, needsGame }) => {
  describe(id, () => {
    it('has the correct id for scroll targeting', () => {
      if (needsGame) {
        withGame(<Component />);
      } else {
        render(<Component />);
      }
      expect(document.getElementById(id)).toBeInTheDocument();
    });

    it('has a data-section attribute matching its id', () => {
      if (needsGame) {
        withGame(<Component />);
      } else {
        render(<Component />);
      }
      expect(document.getElementById(id)).toHaveAttribute('data-section', id);
    });
  });
});
```

- [ ] **Step 2: Run the section tests — confirm they fail**

```
cd app && npm test -- sections.test
```

Expected: FAIL — TechSection and AgendaSection don't have correct ids yet (they will once the components pass, but fail now because the imports don't exist yet from the test file's perspective — if they already pass from Tasks 5 & 6, that's fine, proceed).

- [ ] **Step 3: Update ScrollBody to include the new sections**

Replace the contents of `app/src/features/game-detail/ScrollBody.tsx`:

```tsx
// app/src/features/game-detail/ScrollBody.tsx
import { useEffect, useRef } from 'react';
import { VpRaceSection } from './VpRaceSection';
import { TimelineSection } from './TimelineSection';
import { DashboardSection } from './DashboardSection';
import { PlanetsSection } from './PlanetsSection';
import { TechSection } from './TechSection';
import { AgendaSection } from './AgendaSection';

interface ScrollBodyProps {
  onSectionChange: (sectionId: string) => void;
}

const SECTION_IDS = ['vp-race', 'timeline', 'dashboard', 'planets', 'tech', 'agenda'] as const;

export function ScrollBody({ onSectionChange }: ScrollBodyProps) {
  const callbackRef = useRef(onSectionChange);
  useEffect(() => {
    callbackRef.current = onSectionChange;
  });

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el === null) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const sectionId =
                (entry.target as HTMLElement).dataset['section'] ?? id;
              callbackRef.current(sectionId);
            }
          });
        },
        { threshold: 0.4 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((o) => { o.disconnect(); });
    };
  }, []);

  return (
    <div style={{ overflowY: 'scroll', flex: 1 }}>
      <VpRaceSection />
      <TimelineSection />
      <DashboardSection />
      <PlanetsSection />
      <TechSection />
      <AgendaSection />
    </div>
  );
}
```

- [ ] **Step 4: Update FrozenHeader to add Tech and Agenda nav buttons**

In `app/src/features/game-detail/FrozenHeader.tsx`, replace the `SECTIONS` constant:

```tsx
// Replace lines 9–14 (the SECTIONS constant) with:
const SECTIONS = [
  { id: 'vp-race',   label: 'VP Race' },
  { id: 'timeline',  label: 'Timeline' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'planets',   label: 'Planets' },
  { id: 'tech',      label: 'Tech' },
  { id: 'agenda',    label: 'Agenda' },
] as const;
```

No other changes to FrozenHeader.tsx are needed — the nav renders from the array.

- [ ] **Step 5: Update the ScrollBody test observer count**

In `app/src/features/game-detail/ScrollBody.test.tsx`, update the observer count assertion:

```tsx
// Replace:
  expect(IntersectionObserver).toHaveBeenCalledTimes(4);
// With:
  expect(IntersectionObserver).toHaveBeenCalledTimes(6);
```

Also update the FrozenHeader test for nav button count in `app/src/features/game-detail/FrozenHeader.test.tsx`:

```tsx
// Replace the 'renders all four nav buttons' test:
it('renders all six nav buttons', () => {
  renderHeader();
  expect(screen.getByRole('button', { name: /VP Race/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Timeline/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Planets/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Tech/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Agenda/i })).toBeInTheDocument();
});
```

- [ ] **Step 6: Run all tests**

```
cd app && npm test
```

Expected: all tests pass. If the ScrollBody test fails with "expected 4, got 6", you updated the component but not the test — check Step 5. If a FrozenHeader test fails, check the `SECTIONS` array update in Step 4.

- [ ] **Step 7: Full acceptance check**

```
cd app && npm run typecheck && npm run lint && npm test && npm run build
```

Expected: all pass, no type errors, no lint warnings, build succeeds.

- [ ] **Step 8: Commit**

```bash
git add app/src/features/game-detail/ScrollBody.tsx \
        app/src/features/game-detail/FrozenHeader.tsx \
        app/src/features/game-detail/sections.test.tsx \
        app/src/features/game-detail/ScrollBody.test.tsx \
        app/src/features/game-detail/FrozenHeader.test.tsx
git commit -m "feat: add Tech and Agenda sections to game-detail nav and scroll body"
```
