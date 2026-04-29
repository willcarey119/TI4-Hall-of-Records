// src/lib/parser/agendas.ts
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

interface AgendaEntryBase {
  type: 'law' | 'directive';
  /** Trigger text shown before voting begins (e.g. "When this agenda is revealed…") */
  trigger?: string;
  expansion: AgendaExpansion;
  /** True if this base-game card is removed from play when PoK is used */
  removedInPok?: boolean;
}

export interface AgendaEntryForAgainst extends AgendaEntryBase {
  elect: null;
  forEffect: string;
  againstEffect: string;
}

export interface AgendaEntryElect extends AgendaEntryBase {
  elect: Exclude<AgendaElect, null>;
  effect: string;
}

export type AgendaEntry = AgendaEntryForAgainst | AgendaEntryElect;

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
    againstEffect: 'The player with the fewest victory points loses 1 victory point.',
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
