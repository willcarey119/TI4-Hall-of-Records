import { describe, it, expect } from 'vitest';
import { createInitialState, gameReducer } from '../gameReducer';
import type { FactionSetup, RawLogEntry } from '../types';

// ── Test helpers exported for use by Tasks 4–12 ─────────────────────────────
export function makeEntry(
  action: string,
  event: Record<string, unknown>,
  timestamp = 1000,
): RawLogEntry {
  return { action, event, timestamp };
}

export function makeFaction(factionId: string, startingPlanets: string[] = []): FactionSetup {
  return {
    factionId,
    playerName: 'Player',
    color: 'blue',
    mapPosition: 0,
    startingTechs: [],
    startingPlanets,
  };
}

export function reduce(
  entries: RawLogEntry[],
  factions: FactionSetup[] = [],
) {
  return entries.reduce(gameReducer, createInitialState(factions));
}

// ── Tests ───────────────────────────────────────────────────────────────────
describe('createInitialState', () => {
  it('initialises zero scores for each faction', () => {
    const state = createInitialState([makeFaction('barony'), makeFaction('arborec')]);
    expect(state.currentScores).toEqual({ barony: 0, arborec: 0 });
  });

  it('seeds currentOwners from startingPlanets', () => {
    const state = createInitialState([makeFaction('barony', ['Lazar', 'Sakulag'])]);
    expect(state.currentOwners['Lazar']).toBe('barony');
    expect(state.currentOwners['Sakulag']).toBe('barony');
  });

  it('starts with empty event arrays and zero pending state', () => {
    const state = createInitialState([]);
    expect(state.vpEvents).toHaveLength(0);
    expect(state.planetEvents).toHaveLength(0);
    expect(state.warnings).toHaveLength(0);
    expect(state.pendingAgenda).toBeNull();
    expect(state.pendingVotes).toHaveLength(0);
    expect(state.pendingRiders).toHaveLength(0);
    expect(state.currentTurnFaction).toBe('');
    expect(state.custodiansTaken).toBe(false);
  });
});

describe('gameReducer — unknown action', () => {
  it('appends a warning and does not throw', () => {
    const result = reduce([makeEntry('COMPLETELY_UNKNOWN_XYZ', {})]);
    expect(result.warnings).toContain('Unknown action: COMPLETELY_UNKNOWN_XYZ');
  });

  it('does not emit any events for unknown action', () => {
    const result = reduce([makeEntry('COMPLETELY_UNKNOWN_XYZ', {})]);
    expect(result.vpEvents).toHaveLength(0);
    expect(result.planetEvents).toHaveLength(0);
  });

  it('handles empty log without error', () => {
    const result = reduce([]);
    expect(result.warnings).toHaveLength(0);
  });
});

describe('gameReducer — SCORE_OBJECTIVE', () => {
  it('emits a VpEvent with correct fields and source', () => {
    const result = reduce([
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Lead from the Front' }, 2000),
    ], [makeFaction('barony')]);
    expect(result.vpEvents).toHaveLength(1);
    const ev = result.vpEvents[0];
    expect(ev?.faction).toBe('barony');
    expect(ev?.objective).toBe('Lead from the Front');
    expect(ev?.points).toBe(1);
    expect(ev?.source).toBe('score_objective');
    expect(ev?.timestamp).toBe(2000);
  });

  it('awards 2 VP for Stage II objectives', () => {
    const result = reduce([
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Construct Massive Cities' }),
    ], [makeFaction('barony')]);
    expect(result.vpEvents[0]?.points).toBe(2);
  });

  it('increments currentScores by points value', () => {
    const result = reduce([
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Lead from the Front' }),
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Construct Massive Cities' }),
    ], [makeFaction('barony')]);
    expect(result.currentScores['barony']).toBe(3);
  });

  it('handles "Support for the Throne" with optional key field', () => {
    const result = reduce([
      makeEntry('SCORE_OBJECTIVE', { faction: 'arborec', objective: 'Support for the Throne', key: 'barony' }),
    ], [makeFaction('arborec'), makeFaction('barony')]);
    expect(result.vpEvents[0]?.faction).toBe('arborec');
    expect(result.vpEvents[0]?.points).toBe(1);
  });

  it('appends a warning for an unknown objective and does not emit VpEvent', () => {
    const result = reduce([
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'UNKNOWN_OBJ_XYZ' }),
    ], [makeFaction('barony')]);
    expect(result.vpEvents).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes('UNKNOWN_OBJ_XYZ'))).toBe(true);
    expect(result.currentScores['barony']).toBe(0);
  });

  it('appends warning when faction or objective field is missing', () => {
    const result = reduce([makeEntry('SCORE_OBJECTIVE', {})]);
    expect(result.warnings.some((w) => w.includes('SCORE_OBJECTIVE'))).toBe(true);
    expect(result.vpEvents).toHaveLength(0);
  });
});

describe('gameReducer — UNSCORE_OBJECTIVE', () => {
  it('emits a VpEvent with negative points', () => {
    const result = reduce([
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Lead from the Front' }, 1000),
      makeEntry('UNSCORE_OBJECTIVE', { faction: 'barony', objective: 'Lead from the Front' }, 1500),
    ], [makeFaction('barony')]);
    expect(result.vpEvents).toHaveLength(2);
    expect(result.vpEvents[1]?.points).toBe(-1);
    expect(result.vpEvents[1]?.source).toBe('score_objective');
  });

  it('decrements currentScores by points value', () => {
    const result = reduce([
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Construct Massive Cities' }),
      makeEntry('UNSCORE_OBJECTIVE', { faction: 'barony', objective: 'Construct Massive Cities' }),
    ], [makeFaction('barony')]);
    expect(result.currentScores['barony']).toBe(0);
  });
});

describe('gameReducer — CLAIM_PLANET', () => {
  it('emits a PlanetEvent with type=claim and null prevOwner for new claim', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'barony', planet: 'Mecatol Rex' }, 1000),
    ], [makeFaction('barony')]);
    expect(result.planetEvents).toHaveLength(1);
    const ev = result.planetEvents[0];
    expect(ev?.faction).toBe('barony');
    expect(ev?.planet).toBe('Mecatol Rex');
    expect(ev?.type).toBe('claim');
    expect(ev?.prevOwner).toBeNull();
  });

  it('uses prevOwner from payload when present', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'arborec', planet: 'Mecatol Rex', prevOwner: 'barony' }, 1000),
    ]);
    expect(result.planetEvents[0]?.prevOwner).toBe('barony');
  });

  it('falls back to currentOwners when prevOwner field absent', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'barony', planet: 'Mecatol Rex' }, 1000),
      makeEntry('CLAIM_PLANET', { faction: 'arborec', planet: 'Mecatol Rex' }, 2000),
    ], [makeFaction('barony'), makeFaction('arborec')]);
    expect(result.planetEvents[1]?.prevOwner).toBe('barony');
  });

  it('emits a Custodians VpEvent on first claim of Mecatol Rex', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'barony', planet: 'Mecatol Rex' }, 1000),
    ], [makeFaction('barony')]);
    const custVp = result.vpEvents.find((e) => e.source === 'custodians');
    expect(custVp).toBeDefined();
    expect(custVp?.faction).toBe('barony');
    expect(custVp?.points).toBe(1);
    expect(custVp?.objective).toBe('Custodians Token');
    expect(result.custodiansTaken).toBe(true);
    expect(result.currentScores['barony']).toBe(1);
  });

  it('does NOT emit Custodians VP on second claim of Mecatol Rex', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'barony', planet: 'Mecatol Rex' }, 1000),
      makeEntry('CLAIM_PLANET', { faction: 'arborec', planet: 'Mecatol Rex' }, 2000),
    ], [makeFaction('barony'), makeFaction('arborec')]);
    const custVps = result.vpEvents.filter((e) => e.source === 'custodians');
    expect(custVps).toHaveLength(1);
    expect(result.currentScores['barony']).toBe(1);
    expect(result.currentScores['arborec']).toBe(0);
  });

  it('does NOT emit Custodians VP for non-Mecatol planets', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'barony', planet: 'Jord' }, 1000),
    ], [makeFaction('barony')]);
    expect(result.vpEvents.filter((e) => e.source === 'custodians')).toHaveLength(0);
  });

  it('updates currentOwners', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'barony', planet: 'Lazar' }),
    ]);
    expect(result.currentOwners['Lazar']).toBe('barony');
  });

  it('appends warning when faction or planet missing', () => {
    const result = reduce([makeEntry('CLAIM_PLANET', {})]);
    expect(result.warnings.some((w) => w.includes('CLAIM_PLANET'))).toBe(true);
    expect(result.planetEvents).toHaveLength(0);
  });
});

describe('gameReducer — UNCLAIM_PLANET', () => {
  it('emits a PlanetEvent with type=unclaim', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'barony', planet: 'Lazar' }, 500),
      makeEntry('UNCLAIM_PLANET', { faction: 'barony', planet: 'Lazar' }, 1000),
    ]);
    expect(result.planetEvents).toHaveLength(2);
    expect(result.planetEvents[1]?.type).toBe('unclaim');
    expect(result.planetEvents[1]?.faction).toBe('barony');
  });

  it('removes planet from currentOwners on unclaim', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'barony', planet: 'Lazar' }),
      makeEntry('UNCLAIM_PLANET', { faction: 'barony', planet: 'Lazar' }),
    ]);
    expect(result.currentOwners['Lazar']).toBeUndefined();
  });
});

describe('gameReducer — GAIN_RELIC / PLAY_RELIC / LOSE_RELIC', () => {
  it('GAIN_RELIC emits a RelicEvent and tracks ownership', () => {
    const result = reduce([
      makeEntry('GAIN_RELIC', { faction: 'barony', relic: 'Stellar Converter' }, 1000),
    ], [makeFaction('barony')]);
    expect(result.relicEvents).toHaveLength(1);
    expect(result.relicEvents[0]?.type).toBe('gain');
    expect(result.relicEvents[0]?.faction).toBe('barony');
    expect(result.relicEvents[0]?.relic).toBe('Stellar Converter');
    expect(result.currentRelics['Stellar Converter']).toBe('barony');
  });

  it('GAIN_RELIC on "Shard of the Throne" emits +1 VpEvent (source=relic)', () => {
    const result = reduce([
      makeEntry('GAIN_RELIC', { faction: 'barony', relic: 'Shard of the Throne' }),
    ], [makeFaction('barony')]);
    const vp = result.vpEvents.find((e) => e.source === 'relic');
    expect(vp?.faction).toBe('barony');
    expect(vp?.points).toBe(1);
    expect(vp?.objective).toBe('Shard of the Throne');
    expect(result.currentScores['barony']).toBe(1);
  });

  it('GAIN_RELIC on non-VP relic does not emit VpEvent', () => {
    const result = reduce([
      makeEntry('GAIN_RELIC', { faction: 'barony', relic: 'Maw of Worlds' }),
    ], [makeFaction('barony')]);
    expect(result.vpEvents).toHaveLength(0);
    expect(result.currentScores['barony']).toBe(0);
  });

  it('PLAY_RELIC emits a RelicEvent with faction derived from currentRelics', () => {
    const result = reduce([
      makeEntry('GAIN_RELIC', { faction: 'barony', relic: 'Maw of Worlds' }, 500),
      makeEntry('PLAY_RELIC', { relic: 'Maw of Worlds', tech: 'Assault Cannon' }, 1000),
    ], [makeFaction('barony')]);
    const playEv = result.relicEvents.find((e) => e.type === 'play');
    expect(playEv?.faction).toBe('barony');
    expect(playEv?.relic).toBe('Maw of Worlds');
  });

  it('PLAY_RELIC on "Crown of Emphidia" emits +1 VpEvent', () => {
    const result = reduce([
      makeEntry('GAIN_RELIC', { faction: 'barony', relic: 'Crown of Emphidia' }, 500),
      makeEntry('PLAY_RELIC', { relic: 'Crown of Emphidia' }, 1000),
    ], [makeFaction('barony')]);
    const vp = result.vpEvents.find((e) => e.source === 'relic' && e.points === 1 && e.objective === 'Crown of Emphidia');
    expect(vp?.faction).toBe('barony');
    expect(result.currentScores['barony']).toBe(1);
  });

  it('PLAY_RELIC on "The Crown of Emphidia" (with article) also emits +1 VpEvent', () => {
    const result = reduce([
      makeEntry('GAIN_RELIC', { faction: 'barony', relic: 'The Crown of Emphidia' }, 500),
      makeEntry('PLAY_RELIC', { relic: 'The Crown of Emphidia' }, 1000),
    ], [makeFaction('barony')]);
    const vp = result.vpEvents.find((e) => e.source === 'relic' && e.points === 1);
    expect(vp?.faction).toBe('barony');
  });

  it('PLAY_RELIC with no known owner appends a warning', () => {
    const result = reduce([
      makeEntry('PLAY_RELIC', { relic: 'Maw of Worlds' }),
    ]);
    expect(result.warnings.some((w) => w.includes('PLAY_RELIC') && w.includes('owner'))).toBe(true);
    expect(result.relicEvents).toHaveLength(0);
  });

  it('LOSE_RELIC emits a RelicEvent with type=lose', () => {
    const result = reduce([
      makeEntry('GAIN_RELIC', { faction: 'barony', relic: 'Shard of the Throne' }, 500),
      makeEntry('LOSE_RELIC', { faction: 'barony', relic: 'Shard of the Throne' }, 1000),
    ], [makeFaction('barony')]);
    const loseEv = result.relicEvents.find((e) => e.type === 'lose');
    expect(loseEv).toBeDefined();
    expect(result.currentRelics['Shard of the Throne']).toBeUndefined();
  });

  it('LOSE_RELIC on "Shard of the Throne" emits -1 VpEvent', () => {
    const result = reduce([
      makeEntry('GAIN_RELIC', { faction: 'barony', relic: 'Shard of the Throne' }, 500),
      makeEntry('LOSE_RELIC', { faction: 'barony', relic: 'Shard of the Throne' }, 1000),
    ], [makeFaction('barony')]);
    expect(result.currentScores['barony']).toBe(0); // +1 then -1
    const lossVp = result.vpEvents.find((e) => e.source === 'relic' && e.points === -1);
    expect(lossVp?.faction).toBe('barony');
  });
});
