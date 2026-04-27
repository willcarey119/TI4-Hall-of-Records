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
