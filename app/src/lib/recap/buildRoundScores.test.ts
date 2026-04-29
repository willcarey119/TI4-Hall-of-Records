import { describe, it, expect } from 'vitest';
import { buildRoundScores } from './buildRoundScores';
import type { VpEvent, FactionSetup } from '../parser/types';
import type { RoundBoundary } from '../aggregator/deriveRoundBoundaries';

function makeVp(faction: string, points: number, timestamp: number): VpEvent {
  return { faction, objective: 'test', points, timestamp, source: 'score_objective' };
}
function makeFaction(id: string): FactionSetup {
  return { factionId: id, playerName: 'p', color: 'red', mapPosition: 0, startingTechs: [], startingPlanets: [] };
}

describe('buildRoundScores', () => {
  it('returns empty array when no boundaries', () => {
    const result = buildRoundScores([makeVp('Sol', 1, 100)], [makeFaction('Sol')], []);
    expect(result).toEqual([]);
  });

  it('produces one row per round in boundaries', () => {
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 0 },
      { round: 2, startTimestamp: 1000 },
      { round: 3, startTimestamp: 2000 },
    ];
    const events: VpEvent[] = [makeVp('Sol', 2, 500), makeVp('Sol', 3, 1500)];
    const result = buildRoundScores(events, [makeFaction('Sol')], boundaries);
    expect(result).toHaveLength(3);
  });

  it('cuts off events that happen in a later round', () => {
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 0 },
      { round: 2, startTimestamp: 1000 },
    ];
    const events: VpEvent[] = [makeVp('Sol', 2, 500), makeVp('Sol', 3, 1500)];
    const result = buildRoundScores(events, [makeFaction('Sol')], boundaries);
    expect(result[0]?.scores['Sol']).toBe(2);  // only the round-1 event
    expect(result[1]?.scores['Sol']).toBe(5);  // both events (final round: all)
  });

  it('handles two factions independently', () => {
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 0 },
      { round: 2, startTimestamp: 1000 },
    ];
    const events: VpEvent[] = [makeVp('Sol', 2, 500), makeVp('Hacan', 1, 800)];
    const result = buildRoundScores(events, [makeFaction('Sol'), makeFaction('Hacan')], boundaries);
    expect(result[0]?.scores['Sol']).toBe(2);
    expect(result[0]?.scores['Hacan']).toBe(1);
  });

  it('faction with no VP events gets 0 in every round', () => {
    const boundaries: RoundBoundary[] = [{ round: 1, startTimestamp: 0 }];
    const result = buildRoundScores([], [makeFaction('Sol')], boundaries);
    expect(result[0]?.scores['Sol']).toBe(0);
  });
});
