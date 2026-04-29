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

describe('gameReducer — agenda system', () => {
  it('REVEAL_AGENDA sets pendingAgenda', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Mutiny' }, 1000),
    ]);
    expect(result.pendingAgenda).toBe('Mutiny');
    expect(result.pendingVotes).toHaveLength(0);
  });

  it('CAST_VOTES appends to pendingVotes when pendingAgenda is set', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Mutiny' }, 1000),
      makeEntry('CAST_VOTES', { faction: 'barony', votes: 8, extraVotes: 0, target: 'For' }, 1100),
      makeEntry('CAST_VOTES', { faction: 'arborec', votes: 5, extraVotes: 2, target: 'Against' }, 1200),
    ]);
    expect(result.pendingVotes).toHaveLength(2);
    expect(result.pendingVotes[0]).toEqual({ faction: 'barony', outcome: 'For', votes: 8 });
    expect(result.pendingVotes[1]).toEqual({ faction: 'arborec', outcome: 'Against', votes: 7 });
  });

  it('CAST_VOTES outside an agenda window appends a warning', () => {
    const result = reduce([
      makeEntry('CAST_VOTES', { faction: 'barony', votes: 8, target: 'For' }),
    ]);
    expect(result.warnings.some((w) => w.includes('CAST_VOTES'))).toBe(true);
    expect(result.pendingVotes).toHaveLength(0);
  });

  it('RESOLVE_AGENDA emits an AgendaResolution and clears pending state', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Mutiny' }, 1000),
      makeEntry('CAST_VOTES', { faction: 'barony', votes: 8, target: 'For' }, 1100),
      makeEntry('CAST_VOTES', { faction: 'arborec', votes: 4, target: 'Against' }, 1200),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Mutiny', target: 'For' }, 1300),
    ]);
    expect(result.agendaResolutions).toHaveLength(1);
    const res = result.agendaResolutions[0];
    expect(res?.agenda).toBe('Mutiny');
    expect(res?.outcome).toBe('For');
    expect(res?.votes).toHaveLength(2);
    expect(res?.riders).toHaveLength(0);
    expect(result.pendingAgenda).toBeNull();
    expect(result.pendingVotes).toHaveLength(0);
  });

  it('RESOLVE_AGENDA missing agenda field appends warning', () => {
    const result = reduce([makeEntry('RESOLVE_AGENDA', {})]);
    expect(result.warnings.some((w) => w.includes('RESOLVE_AGENDA'))).toBe(true);
    expect(result.agendaResolutions).toHaveLength(0);
  });

  it('HIDE_AGENDA clears pending agenda state without emitting a resolution', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Ixthian Artifact' }, 1000),
      makeEntry('CAST_VOTES', { faction: 'barony', votes: 5, target: 'For' }, 1100),
      makeEntry('HIDE_AGENDA', {}, 1200),
    ]);
    expect(result.pendingAgenda).toBeNull();
    expect(result.pendingVotes).toHaveLength(0);
    expect(result.agendaResolutions).toHaveLength(0);
  });

  it('Seed of an Empire "For" outcome: leader gains +1 VP only (trailer is unaffected)', () => {
    // FOR card text: "Each player that has the most victory points gains 1 victory point."
    // No effect on trailers — that's the AGAINST clause.
    const result = reduce([
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Lead from the Front' }, 100),
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Construct Massive Cities' }, 200),
      makeEntry('REVEAL_AGENDA', { agenda: 'Seed of an Empire' }, 1000),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Seed of an Empire', target: 'For' }, 1300),
    ], [makeFaction('barony'), makeFaction('arborec')]);
    const agendaVps = result.vpEvents.filter((e) => e.source === 'agenda');
    expect(agendaVps.find((e) => e.faction === 'barony' && e.points === 1)).toBeDefined();
    // Trailer should NOT lose VP on a "For" outcome.
    expect(agendaVps.find((e) => e.faction === 'arborec')).toBeUndefined();
    expect(result.currentScores['barony']).toBe(4); // 3 + 1
    expect(result.currentScores['arborec']).toBe(0); // unchanged
  });

  it('Seed of an Empire "Against" outcome: trailer loses 1 VP only (leader is unaffected)', () => {
    // AGAINST card text: "Each player that has the fewest victory points loses 1 victory point."
    const result = reduce([
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Lead from the Front' }, 100),
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Construct Massive Cities' }, 200),
      makeEntry('REVEAL_AGENDA', { agenda: 'Seed of an Empire' }, 1000),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Seed of an Empire', target: 'Against' }, 1300),
    ], [makeFaction('barony'), makeFaction('arborec')]);
    const agendaVps = result.vpEvents.filter((e) => e.source === 'agenda');
    expect(agendaVps.find((e) => e.faction === 'arborec' && e.points === -1)).toBeDefined();
    // Leader should NOT gain VP on an "Against" outcome.
    expect(agendaVps.find((e) => e.faction === 'barony')).toBeUndefined();
    expect(result.currentScores['barony']).toBe(3); // unchanged
    expect(result.currentScores['arborec']).toBe(-1); // 0 - 1
  });

  it('Seed of an Empire with all factions tied does not emit any VP changes', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Seed of an Empire' }, 1000),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Seed of an Empire', target: 'For' }, 1300),
    ], [makeFaction('barony'), makeFaction('arborec')]);
    const agendaVps = result.vpEvents.filter((e) => e.source === 'agenda');
    expect(agendaVps).toHaveLength(0);
  });

  it('RESOLVE_AGENDA on a watch-listed agenda emits a warning (still unimplemented)', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Crown of Thalnos' }, 1000),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Crown of Thalnos', target: 'For' }, 1100),
    ]);
    expect(result.warnings.some((w) => w.includes('Crown of Thalnos') && w.includes('VP'))).toBe(true);
  });

  // ── Elect-player VP laws ──────────────────────────────────────────────────

  it('Prophecy of Ixth awards +1 VP to the elected player', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Prophecy of Ixth' }, 1000),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Prophecy of Ixth', target: 'barony' }, 1300),
    ], [makeFaction('barony'), makeFaction('arborec')]);
    const agendaVps = result.vpEvents.filter((e) => e.source === 'agenda');
    expect(agendaVps).toHaveLength(1);
    expect(agendaVps[0]?.faction).toBe('barony');
    expect(agendaVps[0]?.points).toBe(1);
    expect(agendaVps[0]?.objective).toBe('Prophecy of Ixth');
    expect(result.currentScores['barony']).toBe(1);
    expect(result.currentScores['arborec']).toBe(0);
  });

  it('Prophecy of Ixth with unknown faction target emits no VP and a warning', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Prophecy of Ixth' }, 1000),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Prophecy of Ixth', target: 'nobody' }, 1300),
    ], [makeFaction('barony')]);
    expect(result.vpEvents.filter((e) => e.source === 'agenda')).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes('Prophecy of Ixth'))).toBe(true);
  });

  it('Political Censure awards +1 VP to the elected player', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Political Censure' }, 1000),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Political Censure', target: 'arborec' }, 1300),
    ], [makeFaction('barony'), makeFaction('arborec')]);
    const agendaVps = result.vpEvents.filter((e) => e.source === 'agenda');
    expect(agendaVps).toHaveLength(1);
    expect(agendaVps[0]?.faction).toBe('arborec');
    expect(agendaVps[0]?.points).toBe(1);
    expect(agendaVps[0]?.objective).toBe('Political Censure');
    expect(result.currentScores['arborec']).toBe(1);
    expect(result.currentScores['barony']).toBe(0);
  });

  // ── Covert Legislation ────────────────────────────────────────────────────

  it('Covert Legislation with a known faction target awards that faction +1 VP', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Covert Legislation' }, 1000),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Covert Legislation', target: 'barony' }, 1300),
    ], [makeFaction('barony'), makeFaction('arborec')]);
    const agendaVps = result.vpEvents.filter((e) => e.source === 'agenda');
    expect(agendaVps).toHaveLength(1);
    expect(agendaVps[0]?.faction).toBe('barony');
    expect(agendaVps[0]?.points).toBe(1);
    expect(agendaVps[0]?.objective).toBe('Covert Legislation');
    expect(result.currentScores['barony']).toBe(1);
  });

  it('Covert Legislation with For/Against target emits no VP (hidden agenda was not an elect-player law)', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Covert Legislation' }, 1000),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Covert Legislation', target: 'Against' }, 1300),
    ], [makeFaction('barony'), makeFaction('arborec')]);
    expect(result.vpEvents.filter((e) => e.source === 'agenda')).toHaveLength(0);
    expect(result.currentScores['barony']).toBe(0);
  });

  it('Covert Legislation with an unknown faction target emits a warning (no silent VP drop)', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Covert Legislation' }, 1000),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Covert Legislation', target: 'mispelled-faction' }, 1300),
    ], [makeFaction('barony'), makeFaction('arborec')]);
    expect(result.vpEvents.filter((e) => e.source === 'agenda')).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes('Covert Legislation') && w.includes('mispelled-faction'))).toBe(true);
  });

  // ── Mutiny ────────────────────────────────────────────────────────────────

  it('Mutiny "For" outcome: each For-voter gains +1 VP', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Mutiny' }, 1000),
      makeEntry('CAST_VOTES', { faction: 'barony', votes: 5, target: 'For' }, 1100),
      makeEntry('CAST_VOTES', { faction: 'arborec', votes: 3, target: 'For' }, 1150),
      makeEntry('CAST_VOTES', { faction: 'hacan', votes: 4, target: 'Against' }, 1200),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Mutiny', target: 'For' }, 1300),
    ], [makeFaction('barony'), makeFaction('arborec'), makeFaction('hacan')]);
    const agendaVps = result.vpEvents.filter((e) => e.source === 'agenda' && e.objective === 'Mutiny');
    expect(agendaVps.find((e) => e.faction === 'barony' && e.points === 1)).toBeDefined();
    expect(agendaVps.find((e) => e.faction === 'arborec' && e.points === 1)).toBeDefined();
    expect(agendaVps.find((e) => e.faction === 'hacan')).toBeUndefined();
    expect(result.currentScores['barony']).toBe(1);
    expect(result.currentScores['arborec']).toBe(1);
    expect(result.currentScores['hacan']).toBe(0);
  });

  it('Mutiny "Against" outcome: each For-voter loses -1 VP', () => {
    const result = reduce([
      makeEntry('SCORE_OBJECTIVE', { faction: 'barony', objective: 'Lead from the Front' }, 50),
      makeEntry('REVEAL_AGENDA', { agenda: 'Mutiny' }, 1000),
      makeEntry('CAST_VOTES', { faction: 'barony', votes: 5, target: 'For' }, 1100),
      makeEntry('CAST_VOTES', { faction: 'arborec', votes: 4, target: 'Against' }, 1200),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Mutiny', target: 'Against' }, 1300),
    ], [makeFaction('barony'), makeFaction('arborec')]);
    const agendaVps = result.vpEvents.filter((e) => e.source === 'agenda' && e.objective === 'Mutiny');
    expect(agendaVps.find((e) => e.faction === 'barony' && e.points === -1)).toBeDefined();
    expect(agendaVps.find((e) => e.faction === 'arborec')).toBeUndefined();
    expect(result.currentScores['barony']).toBe(0); // was 1 (Lead from the Front), -1 from Mutiny
    expect(result.currentScores['arborec']).toBe(0);
  });

  it('Mutiny with no For-voters emits no VP events', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Mutiny' }, 1000),
      makeEntry('CAST_VOTES', { faction: 'barony', votes: 5, target: 'Against' }, 1100),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Mutiny', target: 'For' }, 1300),
    ], [makeFaction('barony')]);
    expect(result.vpEvents.filter((e) => e.source === 'agenda')).toHaveLength(0);
  });

  it('START_VOTING and SELECT_ELIGIBLE_OUTCOMES are no-ops', () => {
    const result = reduce([
      makeEntry('START_VOTING', {}),
      makeEntry('SELECT_ELIGIBLE_OUTCOMES', { outcomes: ['For', 'Against'] }),
    ]);
    expect(result.warnings).toHaveLength(0);
  });
});

describe('gameReducer — PLAY_RIDER', () => {
  it('PLAY_RIDER buffers into pendingRiders during an agenda', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Mutiny' }, 1000),
      makeEntry('PLAY_RIDER', { rider: 'Politics Rider', faction: 'barony', outcome: 'For' }, 1100),
    ]);
    expect(result.pendingRiders).toHaveLength(1);
    expect(result.pendingRiders[0]).toEqual({ faction: 'barony', rider: 'Politics Rider', outcome: 'For' });
  });

  it('PLAY_RIDER outside an agenda window appends warning', () => {
    const result = reduce([
      makeEntry('PLAY_RIDER', { rider: 'Politics Rider', faction: 'barony', outcome: 'For' }),
    ]);
    expect(result.warnings.some((w) => w.includes('PLAY_RIDER'))).toBe(true);
    expect(result.pendingRiders).toHaveLength(0);
  });

  it('riders are drained into AgendaResolution at RESOLVE_AGENDA', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Mutiny' }, 1000),
      makeEntry('PLAY_RIDER', { rider: 'Politics Rider', faction: 'barony', outcome: 'For' }, 1100),
      makeEntry('PLAY_RIDER', { rider: 'Trade Rider', faction: 'arborec', outcome: 'Against' }, 1200),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Mutiny', target: 'For' }, 1300),
    ]);
    expect(result.agendaResolutions[0]?.riders).toHaveLength(2);
    expect(result.pendingRiders).toHaveLength(0);
  });

  it('Imperial Rider with matching outcome emits +1 VpEvent', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Mutiny' }, 1000),
      makeEntry('PLAY_RIDER', { rider: 'Imperial Rider', faction: 'barony', outcome: 'For' }, 1100),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Mutiny', target: 'For' }, 1300),
    ], [makeFaction('barony')]);
    const riderVp = result.vpEvents.find((e) => e.source === 'rider');
    expect(riderVp?.faction).toBe('barony');
    expect(riderVp?.points).toBe(1);
    expect(riderVp?.objective).toBe('Imperial Rider');
    expect(result.currentScores['barony']).toBe(1);
  });

  it('Imperial Rider with mismatched outcome emits NO VpEvent', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Mutiny' }, 1000),
      makeEntry('PLAY_RIDER', { rider: 'Imperial Rider', faction: 'barony', outcome: 'For' }, 1100),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Mutiny', target: 'Against' }, 1300),
    ], [makeFaction('barony')]);
    const riderVps = result.vpEvents.filter((e) => e.source === 'rider');
    expect(riderVps).toHaveLength(0);
    expect(result.currentScores['barony']).toBe(0);
  });

  it('Non-VP riders (Politics, Trade, etc.) emit no VP even when outcome matches', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Mutiny' }, 1000),
      makeEntry('PLAY_RIDER', { rider: 'Politics Rider', faction: 'barony', outcome: 'For' }, 1100),
      makeEntry('RESOLVE_AGENDA', { agenda: 'Mutiny', target: 'For' }, 1300),
    ], [makeFaction('barony')]);
    expect(result.vpEvents.filter((e) => e.source === 'rider')).toHaveLength(0);
  });

  it('PLAY_RIDER missing fields appends warning', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Mutiny' }),
      makeEntry('PLAY_RIDER', {}),
    ]);
    expect(result.warnings.some((w) => w.includes('PLAY_RIDER'))).toBe(true);
  });
});

describe('gameReducer — tech events', () => {
  it('ADD_TECH emits a TechEvent with type=research', () => {
    const result = reduce([
      makeEntry('ADD_TECH', { faction: 'barony', tech: 'Neural Motivator' }, 1000),
    ]);
    expect(result.techEvents).toHaveLength(1);
    expect(result.techEvents[0]).toMatchObject({ faction: 'barony', tech: 'Neural Motivator', type: 'research' });
  });

  it('REMOVE_TECH emits a TechEvent with type=remove', () => {
    const result = reduce([
      makeEntry('REMOVE_TECH', { faction: 'barony', tech: 'Neural Motivator' }),
    ]);
    expect(result.techEvents[0]?.type).toBe('remove');
  });

  it('CHOOSE_STARTING_TECH emits a TechEvent with type=starting', () => {
    const result = reduce([
      makeEntry('CHOOSE_STARTING_TECH', { faction: 'barony', tech: 'Sarween Tools' }),
    ]);
    expect(result.techEvents[0]).toMatchObject({ tech: 'Sarween Tools', type: 'starting' });
  });

  it('appends warning when faction or tech missing', () => {
    const result = reduce([makeEntry('ADD_TECH', {})]);
    expect(result.warnings.some((w) => w.includes('ADD_TECH'))).toBe(true);
    expect(result.techEvents).toHaveLength(0);
  });
});

describe('gameReducer — strategy card and secondary events', () => {
  it('ASSIGN_STRATEGY_CARD emits StrategyCardEvent with type=pick', () => {
    const result = reduce([
      makeEntry('ASSIGN_STRATEGY_CARD', { assignedTo: 'barony', id: 'Warfare', pickedBy: 'barony' }, 1000),
    ]);
    expect(result.strategyCardEvents).toHaveLength(1);
    expect(result.strategyCardEvents[0]).toMatchObject({ faction: 'barony', card: 'Warfare', type: 'pick' });
  });

  it('ASSIGN_STRATEGY_CARD missing fields appends warning', () => {
    const result = reduce([makeEntry('ASSIGN_STRATEGY_CARD', {})]);
    expect(result.warnings.some((w) => w.includes('ASSIGN_STRATEGY_CARD'))).toBe(true);
  });

  it('MARK_SECONDARY DONE emits SecondaryEvent with type=follow', () => {
    const result = reduce([
      makeEntry('MARK_SECONDARY', { faction: 'barony', state: 'DONE' }),
    ]);
    expect(result.secondaryEvents[0]).toMatchObject({ faction: 'barony', type: 'follow' });
  });

  it('MARK_SECONDARY SKIPPED emits SecondaryEvent with type=abstain', () => {
    const result = reduce([
      makeEntry('MARK_SECONDARY', { faction: 'barony', state: 'SKIPPED' }),
    ]);
    expect(result.secondaryEvents[0]?.type).toBe('abstain');
  });

  it('MARK_SECONDARY with unrecognised state appends warning', () => {
    const result = reduce([
      makeEntry('MARK_SECONDARY', { faction: 'barony', state: 'UNKNOWN' }),
    ]);
    expect(result.warnings.some((w) => w.includes('MARK_SECONDARY'))).toBe(true);
    expect(result.secondaryEvents).toHaveLength(0);
  });

  it('SELECT_ACTION with a card name sets activeStrategyCard', () => {
    const result = reduce([makeEntry('SELECT_ACTION', { action: 'Politics' }, 100)]);
    expect(result.activeStrategyCard).toBe('Politics');
  });

  it('SELECT_ACTION with TACTICAL/COMPONENT/PASS does not overwrite activeStrategyCard', () => {
    const result = reduce([
      makeEntry('SELECT_ACTION', { action: 'Warfare' }, 100),
      makeEntry('SELECT_ACTION', { action: 'TACTICAL' }, 200),
    ]);
    expect(result.activeStrategyCard).toBe('Warfare');
  });

  it('MARK_SECONDARY DONE emits play_secondary StrategyCardEvent with active card', () => {
    const result = reduce([
      makeEntry('SELECT_ACTION', { action: 'Technology' }, 100),
      makeEntry('MARK_SECONDARY', { faction: 'barony', state: 'DONE' }, 200),
    ]);
    const scEv = result.strategyCardEvents.find(e => e.type === 'play_secondary');
    expect(scEv).toMatchObject({ faction: 'barony', card: 'Technology', type: 'play_secondary' });
  });

  it('MARK_SECONDARY SKIPPED emits pass_secondary StrategyCardEvent with active card', () => {
    const result = reduce([
      makeEntry('SELECT_ACTION', { action: 'Imperial' }, 100),
      makeEntry('MARK_SECONDARY', { faction: 'arborec', state: 'SKIPPED' }, 200),
    ]);
    const scEv = result.strategyCardEvents.find(e => e.type === 'pass_secondary');
    expect(scEv).toMatchObject({ faction: 'arborec', card: 'Imperial', type: 'pass_secondary' });
  });

  it('MARK_SECONDARY without prior SELECT_ACTION emits event with empty card (graceful)', () => {
    const result = reduce([
      makeEntry('MARK_SECONDARY', { faction: 'barony', state: 'DONE' }, 100),
    ]);
    const scEv = result.strategyCardEvents.find(e => e.type === 'play_secondary');
    expect(scEv?.card).toBe('');
  });

  it('MARK_SECONDARY DONE sets SecondaryEvent.strategyCard from activeStrategyCard', () => {
    const result = reduce([
      makeEntry('SELECT_ACTION',  { action: 'Technology' }),
      makeEntry('MARK_SECONDARY', { faction: 'Sol', state: 'DONE' }),
    ]);
    expect(result.secondaryEvents[0]?.strategyCard).toBe('Technology');
  });

  it('MARK_SECONDARY SKIPPED sets SecondaryEvent.strategyCard from activeStrategyCard', () => {
    const result = reduce([
      makeEntry('SELECT_ACTION',  { action: 'Politics' }),
      makeEntry('MARK_SECONDARY', { faction: 'Hacan', state: 'SKIPPED' }),
    ]);
    expect(result.secondaryEvents[0]?.strategyCard).toBe('Politics');
  });
});

describe('gameReducer — action cards and components', () => {
  it('PLAY_COMPONENT emits a ComponentEvent using factionId and name', () => {
    const result = reduce([
      makeEntry('PLAY_COMPONENT', { factionId: 'barony', name: 'Exploration Probe' }),
    ]);
    expect(result.componentEvents[0]).toMatchObject({ faction: 'barony', component: 'Exploration Probe' });
  });

  it('PLAY_COMPONENT missing fields appends warning', () => {
    const result = reduce([makeEntry('PLAY_COMPONENT', {})]);
    expect(result.warnings.some((w) => w.includes('PLAY_COMPONENT'))).toBe(true);
  });

  it('END_TURN updates currentTurnFaction from prevFaction', () => {
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'barony' }),
    ]);
    expect(result.currentTurnFaction).toBe('barony');
  });

  it('PLAY_ACTION_CARD attributes to currentTurnFaction', () => {
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'barony' }, 1000),
      makeEntry('PLAY_ACTION_CARD', { card: 'Direct Hit' }, 1100),
    ]);
    expect(result.actionCardEvents[0]).toMatchObject({ faction: 'barony', card: 'Direct Hit', type: 'play' });
  });

  it('PLAY_ACTION_CARD captures optional target', () => {
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'barony' }, 1000),
      makeEntry('PLAY_ACTION_CARD', { card: 'Spy', target: 'arborec' }, 1100),
    ]);
    expect(result.actionCardEvents[0]?.target).toBe('arborec');
  });

  it('PLAY_ACTION_CARD emits with empty faction and warns when currentTurnFaction unknown', () => {
    const result = reduce([
      makeEntry('PLAY_ACTION_CARD', { card: 'Direct Hit' }),
    ]);
    expect(result.actionCardEvents).toHaveLength(1);
    expect(result.actionCardEvents[0]?.faction).toBe('');
    expect(result.warnings.some((w) => w.includes('PLAY_ACTION_CARD'))).toBe(true);
  });

  it('PLAY_ACTION_CARD missing card field appends warning and emits no event', () => {
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'barony' }),
      makeEntry('PLAY_ACTION_CARD', {}),
    ]);
    expect(result.warnings.some((w) => w.includes('PLAY_ACTION_CARD'))).toBe(true);
    expect(result.actionCardEvents).toHaveLength(0);
  });

  it('SELECT_ACTION is a no-op', () => {
    const result = reduce([makeEntry('SELECT_ACTION', { action: 'Tactical' })]);
    expect(result.warnings).toHaveLength(0);
  });
});

describe('gameReducer — Task 12 remaining events', () => {
  it('SET_SPEAKER emits SpeakerEvent and updates currentSpeaker', () => {
    const result = reduce([
      makeEntry('SET_SPEAKER', { newSpeaker: 'arborec', prevSpeaker: 'barony' }),
    ]);
    expect(result.speakerEvents[0]).toMatchObject({ newSpeaker: 'arborec', prevSpeaker: 'barony' });
    expect(result.currentSpeaker).toBe('arborec');
  });

  it('UPDATE_LEADER_STATE locked->readied maps to type=unlock', () => {
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'barony' }, 1000),
      makeEntry('UPDATE_LEADER_STATE', { leaderId: 'Vera Khage', state: 'readied', prevState: 'locked' }, 1100),
    ]);
    expect(result.leaderEvents[0]).toMatchObject({ leader: 'Vera Khage', type: 'unlock', faction: 'barony' });
  });

  it('UPDATE_LEADER_STATE state=exhausted maps to type=exhaust', () => {
    const result = reduce([
      makeEntry('UPDATE_LEADER_STATE', { leaderId: 'Magmus', state: 'exhausted', prevState: 'readied' }),
    ]);
    expect(result.leaderEvents[0]?.type).toBe('exhaust');
  });

  it('UPDATE_LEADER_STATE state=purged maps to type=purge', () => {
    const result = reduce([
      makeEntry('UPDATE_LEADER_STATE', { leaderId: 'X', state: 'purged', prevState: 'readied' }),
    ]);
    expect(result.leaderEvents[0]?.type).toBe('purge');
  });

  it('ADD_ATTACHMENT derives faction from currentOwners', () => {
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'barony', planet: 'Lazar' }, 500),
      makeEntry('ADD_ATTACHMENT', { attachment: 'Paradise World', planet: 'Lazar' }, 1000),
    ]);
    expect(result.attachmentEvents[0]).toMatchObject({ faction: 'barony', planet: 'Lazar', attachment: 'Paradise World', type: 'attach' });
  });

  it('ADD_ATTACHMENT with no known owner emits faction=null', () => {
    const result = reduce([
      makeEntry('ADD_ATTACHMENT', { attachment: 'X', planet: 'UnknownPlanet' }),
    ]);
    expect(result.attachmentEvents[0]?.faction).toBeNull();
  });

  it('GAIN_ALLIANCE emits an AllianceEvent', () => {
    const result = reduce([
      makeEntry('GAIN_ALLIANCE', { faction: 'barony', fromFaction: 'arborec' }),
    ]);
    expect(result.allianceEvents[0]).toMatchObject({ faction1: 'barony', faction2: 'arborec', type: 'form' });
  });

  it('PLAY_PROMISSORY_NOTE attributes from currentTurnFaction', () => {
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'barony' }, 1000),
      makeEntry('PLAY_PROMISSORY_NOTE', { card: 'Trade Agreement', target: 'arborec' }, 1100),
    ]);
    expect(result.promissoryNoteEvents[0]).toMatchObject({
      fromFaction: 'barony',
      toFaction: 'arborec',
      note: 'Trade Agreement',
      type: 'play',
    });
  });

  it('REVEAL_OBJECTIVE emits ObjectiveReveal for known Stage I objective', () => {
    const result = reduce([
      makeEntry('REVEAL_OBJECTIVE', { objective: 'Lead from the Front' }, 1000),
    ]);
    expect(result.objectiveReveals[0]).toMatchObject({ objective: 'Lead from the Front', stage: 'I' });
    expect(result.revealedObjectives).toContain('Lead from the Front');
  });

  it('REVEAL_OBJECTIVE emits ObjectiveReveal for known Stage II objective', () => {
    const result = reduce([
      makeEntry('REVEAL_OBJECTIVE', { objective: 'Construct Massive Cities' }, 1000),
    ]);
    expect(result.objectiveReveals[0]?.stage).toBe('II');
  });

  it('REVEAL_OBJECTIVE for unknown objective appends warning', () => {
    const result = reduce([
      makeEntry('REVEAL_OBJECTIVE', { objective: 'BogusObjectiveXYZ' }),
    ]);
    expect(result.warnings.some((w) => w.includes('REVEAL_OBJECTIVE') || w.includes('BogusObjectiveXYZ'))).toBe(true);
  });

  it('ADVANCE_PHASE pushes a PhaseSnapshot and rotates phase', () => {
    const result = reduce([
      makeEntry('ADVANCE_PHASE', { skipAgenda: false }, 1000),
      makeEntry('ADVANCE_PHASE', { skipAgenda: false }, 2000),
    ]);
    expect(result.phaseSnapshots.length).toBeGreaterThanOrEqual(1);
  });

  it('catch-all events emit ActionEvent with currentTurnFaction', () => {
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'barony' }, 1000),
      makeEntry('REPEAL_AGENDA', { agenda: 'X' }, 1100),
      makeEntry('UNPASS', { faction: 'barony' }, 1200),
      makeEntry('END_GAME', {}, 1300),
    ]);
    expect(result.actionEvents.length).toBe(3);
    expect(result.actionEvents[0]).toMatchObject({ faction: 'barony', action: 'REPEAL_AGENDA' });
  });
});

describe('gameReducer — Task 12.5 edge case fixes', () => {
  it('MARK_PRIMARY with completed=true emits StrategyCardEvent using currentTurnFaction', () => {
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'barony' }, 1000),
      makeEntry('MARK_PRIMARY', { completed: true }, 1100),
    ]);
    expect(result.strategyCardEvents).toHaveLength(1);
    expect(result.strategyCardEvents[0]).toMatchObject({ faction: 'barony', card: '', type: 'play_primary' });
    expect(result.warnings).toHaveLength(0);
  });

  it('MARK_PRIMARY with completed=false is a no-op', () => {
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'barony' }),
      makeEntry('MARK_PRIMARY', { completed: false }),
    ]);
    expect(result.strategyCardEvents).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('MARK_PRIMARY with no currentTurnFaction still emits with empty faction', () => {
    const result = reduce([
      makeEntry('MARK_PRIMARY', { completed: true }),
    ]);
    expect(result.strategyCardEvents[0]?.faction).toBe('');
  });

  it('PLAY_RIDER without outcome emits with empty outcome string', () => {
    const result = reduce([
      makeEntry('REVEAL_AGENDA', { agenda: 'Mutiny' }, 1000),
      makeEntry('PLAY_RIDER', { rider: 'Leadership Rider', faction: 'barony' }, 1100),
    ]);
    expect(result.pendingRiders).toHaveLength(1);
    expect(result.pendingRiders[0]).toEqual({ faction: 'barony', rider: 'Leadership Rider', outcome: '' });
    expect(result.warnings).toHaveLength(0);
  });

  it('PURGE_TECH with techId field and no faction uses currentTurnFaction', () => {
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'barony' }, 1000),
      makeEntry('PURGE_TECH', { techId: 'LightWave Deflector' }, 1100),
    ]);
    expect(result.techEvents).toHaveLength(1);
    expect(result.techEvents[0]).toMatchObject({ faction: 'barony', tech: 'LightWave Deflector', type: 'purge' });
    expect(result.warnings).toHaveLength(0);
  });

  it('PURGE_TECH missing techId appends warning', () => {
    const result = reduce([makeEntry('PURGE_TECH', {})]);
    expect(result.warnings.some((w) => w.includes('PURGE_TECH'))).toBe(true);
    expect(result.techEvents).toHaveLength(0);
  });

  it('COMMIT_TO_EXPEDITION accepts prevFaction as fallback for factionId', () => {
    const result = reduce([
      makeEntry('COMMIT_TO_EXPEDITION', { expedition: 'tradeGoods', prevFaction: 'barony' }),
    ]);
    expect(result.expeditionEvents).toHaveLength(1);
    expect(result.expeditionEvents[0]).toMatchObject({ faction: 'barony', planet: 'tradeGoods' });
    expect(result.warnings).toHaveLength(0);
  });

  it('COMMIT_TO_EXPEDITION still works with factionId field (backward compat)', () => {
    const result = reduce([
      makeEntry('COMMIT_TO_EXPEDITION', { expedition: 'influence', factionId: 'arborec' }),
    ]);
    expect(result.expeditionEvents[0]?.faction).toBe('arborec');
  });

  describe('SELECT_ACTION', () => {
    it('captures TACTICAL/COMPONENT/PASS as actionTypeEvents', () => {
      const result = reduce([
        makeEntry('END_TURN', { prevFaction: 'sol' }, 50),
        makeEntry('SELECT_ACTION', { action: 'TACTICAL' }, 100),
        makeEntry('SELECT_ACTION', { action: 'COMPONENT' }, 200),
        makeEntry('SELECT_ACTION', { action: 'PASS' }, 300),
      ]);
      expect(result.actionTypeEvents.map((e) => e.actionType)).toEqual([
        'tactical',
        'component',
        'pass',
      ]);
      expect(result.actionTypeEvents.every((e) => e.faction === 'sol')).toBe(true);
    });

    it('ignores SELECT_ACTION with unknown action string', () => {
      const result = reduce([
        makeEntry('SELECT_ACTION', { action: 'UNKNOWN' }, 100),
      ]);
      expect(result.actionTypeEvents).toEqual([]);
    });

    it('ignores SELECT_ACTION with non-string action field', () => {
      const result = reduce([
        makeEntry('SELECT_ACTION', {}, 100),
      ]);
      expect(result.actionTypeEvents).toEqual([]);
    });
  });
});

// ── Imperial Strategy Card VP ─────────────────────────────────────────────────
// Imperial grants +1 VP to the active player when they control Mecatol Rex.
// TI Assistant records this via END_TURN { prevFaction, selectedAction: 'Imperial' }.
// The handler lives in END_TURN so prevFaction is unambiguous (SELECT_ACTION has no
// faction field; currentTurnFaction at that point is the *previous* player).

describe('gameReducer — Imperial Strategy Card VP (END_TURN)', () => {
  it('grants +1 VP when prevFaction controls Mecatol Rex', () => {
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'Sol', selectedAction: 'Imperial' }, 300),
    ], [makeFaction('Sol', ['Mecatol Rex'])]);
    const imperialVp = result.vpEvents.find((e) => e.source === 'imperial_point');
    expect(imperialVp).toBeDefined();
    expect(imperialVp?.faction).toBe('Sol');
    expect(imperialVp?.points).toBe(1);
    expect(imperialVp?.source).toBe('imperial_point');
    expect(imperialVp?.objective).toBe('Imperial Point');
    expect(imperialVp?.timestamp).toBe(300);
  });

  it('increments currentScores by 1 when VP is granted', () => {
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'Sol', selectedAction: 'Imperial' }, 300),
    ], [makeFaction('Sol', ['Mecatol Rex'])]);
    expect(result.currentScores['Sol']).toBe(1);
  });

  it('still sets currentTurnFaction to prevFaction', () => {
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'Sol', selectedAction: 'Imperial' }, 300),
    ], [makeFaction('Sol', ['Mecatol Rex'])]);
    expect(result.currentTurnFaction).toBe('Sol');
  });

  it('does not grant VP when prevFaction does not own Mecatol Rex', () => {
    // Hacan owns Mecatol Rex, Sol uses Imperial
    const result = reduce([
      makeEntry('CLAIM_PLANET', { faction: 'Hacan', planet: 'Mecatol Rex' }, 100),
      makeEntry('END_TURN', { prevFaction: 'Sol', selectedAction: 'Imperial' }, 300),
    ], [makeFaction('Sol'), makeFaction('Hacan')]);
    expect(result.vpEvents.filter((e) => e.source === 'imperial_point')).toHaveLength(0);
    expect(result.currentScores['Sol']).toBe(0);
  });

  it('does not grant VP when Mecatol Rex has no owner', () => {
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'Sol', selectedAction: 'Imperial' }, 300),
    ], [makeFaction('Sol')]);
    expect(result.vpEvents.filter((e) => e.source === 'imperial_point')).toHaveLength(0);
  });

  it('does not grant Imperial VP for non-Imperial selectedAction', () => {
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'Sol', selectedAction: 'Tactical' }, 300),
    ], [makeFaction('Sol', ['Mecatol Rex'])]);
    expect(result.vpEvents.filter((e) => e.source === 'imperial_point')).toHaveLength(0);
  });

  it('does not grant Imperial VP when selectedAction field is absent', () => {
    // Older log format may lack selectedAction
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'Sol' }, 300),
    ], [makeFaction('Sol', ['Mecatol Rex'])]);
    expect(result.vpEvents.filter((e) => e.source === 'imperial_point')).toHaveLength(0);
  });

  it('grants VP independently on each Imperial use when Mecatol Rex is held', () => {
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'Sol', selectedAction: 'Imperial' }, 300),
      makeEntry('END_TURN', { prevFaction: 'Sol', selectedAction: 'Imperial' }, 600),
    ], [makeFaction('Sol', ['Mecatol Rex'])]);
    expect(result.vpEvents.filter((e) => e.source === 'imperial_point')).toHaveLength(2);
    expect(result.currentScores['Sol']).toBe(2);
  });

  it('grants VP only on turns where Mecatol Rex ownership matches', () => {
    // Sol owns Mecatol Rex initially; then Hacan claims it; then Sol uses Imperial again
    const result = reduce([
      makeEntry('END_TURN', { prevFaction: 'Sol', selectedAction: 'Imperial' }, 300),
      makeEntry('CLAIM_PLANET', { faction: 'Hacan', planet: 'Mecatol Rex' }, 400),
      makeEntry('END_TURN', { prevFaction: 'Sol', selectedAction: 'Imperial' }, 600),
    ], [makeFaction('Sol', ['Mecatol Rex']), makeFaction('Hacan')]);
    // Only the first Imperial use should grant VP
    expect(result.vpEvents.filter((e) => e.source === 'imperial_point')).toHaveLength(1);
    expect(result.currentScores['Sol']).toBe(1);
  });
});
