import { describe, it, expect } from 'vitest';
import { buildVpRaceSeries } from './buildVpRaceSeries';
import type { VpEvent, FactionSetup } from '../parser/types';
import type { RoundBoundary } from '../aggregator/deriveRoundBoundaries';

function makeFaction(id: string, pos: number, color = '#aaa'): FactionSetup {
  return {
    factionId: id,
    playerName: 'Player',
    color,
    mapPosition: pos,
    startingTechs: [],
    startingPlanets: [],
  };
}

function makeVp(faction: string, points: number, timestamp: number): VpEvent {
  return { faction, objective: 'Test Obj', points, timestamp, source: 'score_objective' };
}

const FACTIONS = [makeFaction('Sol', 0, 'blue'), makeFaction('Hacan', 1, 'gold')];
const OPTIONS: Record<string, unknown> = { victoryPoints: 10 };

describe('buildVpRaceSeries', () => {
  it('returns one series entry per faction', () => {
    const result = buildVpRaceSeries([], FACTIONS, { Sol: 0, Hacan: 0 }, OPTIONS, []);
    expect(result.series).toHaveLength(2);
  });

  it('series are ordered by faction mapPosition', () => {
    const result = buildVpRaceSeries([], FACTIONS, { Sol: 0, Hacan: 0 }, OPTIONS, []);
    expect(result.series[0]?.factionId).toBe('Sol');
    expect(result.series[1]?.factionId).toBe('Hacan');
  });

  it('reads victoryPoints from options, defaulting to 10', () => {
    expect(buildVpRaceSeries([], FACTIONS, {}, {}, []).victoryPoints).toBe(10);
    expect(buildVpRaceSeries([], FACTIONS, {}, { victoryPoints: 14 }, []).victoryPoints).toBe(14);
  });

  it('every series begins at round 0 with cumulativeVp 0 (chart anchor)', () => {
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 0 },
      { round: 2, startTimestamp: 1000 },
    ];
    const result = buildVpRaceSeries([], FACTIONS, { Sol: 0, Hacan: 0 }, OPTIONS, boundaries);
    for (const s of result.series) {
      expect(s.points[0]?.round).toBe(0);
      expect(s.points[0]?.cumulativeVp).toBe(0);
    }
  });

  it('produces one point per round with cumulative VP from buildRoundScores semantics', () => {
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 0 },
      { round: 2, startTimestamp: 1000 },
      { round: 3, startTimestamp: 2000 },
    ];
    const events: VpEvent[] = [
      makeVp('Sol', 2, 500),    // round 1
      makeVp('Sol', 3, 1500),   // round 2
      makeVp('Sol', 1, 2500),   // round 3
    ];
    const result = buildVpRaceSeries(events, FACTIONS, { Sol: 6, Hacan: 0 }, OPTIONS, boundaries);
    const sol = result.series.find(s => s.factionId === 'Sol');
    // anchor (round 0, 0 VP) + 3 rounds with cumulative scores 2, 5, 6
    expect(sol?.points.map(p => ({ round: p.round, cumulativeVp: p.cumulativeVp }))).toEqual([
      { round: 0, cumulativeVp: 0 },
      { round: 1, cumulativeVp: 2 },
      { round: 2, cumulativeVp: 5 },
      { round: 3, cumulativeVp: 6 },
    ]);
  });

  it('faction with no VP events shows 0 across all rounds', () => {
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 0 },
      { round: 2, startTimestamp: 1000 },
    ];
    const result = buildVpRaceSeries([], FACTIONS, { Sol: 0, Hacan: 0 }, OPTIONS, boundaries);
    const sol = result.series.find(s => s.factionId === 'Sol');
    expect(sol?.points.map(p => p.cumulativeVp)).toEqual([0, 0, 0]);
  });

  it('terminal round point cumulativeVp matches finalScores[factionId]', () => {
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 0 },
      { round: 2, startTimestamp: 1000 },
    ];
    const events: VpEvent[] = [makeVp('Sol', 4, 500), makeVp('Sol', 6, 1500)];
    const result = buildVpRaceSeries(events, FACTIONS, { Sol: 10, Hacan: 0 }, OPTIONS, boundaries);
    const sol = result.series.find(s => s.factionId === 'Sol');
    const last = sol?.points[sol.points.length - 1];
    expect(last?.cumulativeVp).toBe(10);
    expect(sol?.finalVp).toBe(10);
  });

  it('marks the winner (faction at or above victoryPoints in finalScores)', () => {
    const result = buildVpRaceSeries([], FACTIONS, { Sol: 7, Hacan: 10 }, OPTIONS, []);
    expect(result.series.find(s => s.factionId === 'Hacan')?.isWinner).toBe(true);
    expect(result.series.find(s => s.factionId === 'Sol')?.isWinner).toBe(false);
  });

  it('totalRounds equals the highest round number in boundaries', () => {
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 0 },
      { round: 2, startTimestamp: 1000 },
      { round: 3, startTimestamp: 2000 },
    ];
    const result = buildVpRaceSeries([], FACTIONS, { Sol: 0, Hacan: 0 }, OPTIONS, boundaries);
    expect(result.totalRounds).toBe(3);
  });

  it('headline mentions winner when one exists', () => {
    const result = buildVpRaceSeries([], FACTIONS, { Sol: 7, Hacan: 10 }, OPTIONS, []);
    expect(result.headline).toContain('Hacan');
    expect(result.headline).toContain('takes the throne');
  });

  it('editorialProse is non-empty', () => {
    const result = buildVpRaceSeries([], FACTIONS, { Sol: 7, Hacan: 10 }, OPTIONS, []);
    expect(result.editorialProse.length).toBeGreaterThan(20);
  });

  // Negative tests
  it('handles empty inputs without throwing', () => {
    expect(() => buildVpRaceSeries([], [], {}, {}, [])).not.toThrow();
  });

  it('with no round boundaries, each series has only the anchor point at round 0', () => {
    const events: VpEvent[] = [makeVp('Sol', 5, 500)];
    const result = buildVpRaceSeries(events, FACTIONS, { Sol: 5, Hacan: 0 }, OPTIONS, []);
    expect(result.totalRounds).toBe(0);
    for (const s of result.series) {
      expect(s.points).toEqual([{ round: 0, cumulativeVp: 0 }]);
    }
  });

  it('silently drops VP events for unregistered factions', () => {
    const boundaries: RoundBoundary[] = [{ round: 1, startTimestamp: 0 }];
    const events: VpEvent[] = [makeVp('Unknown', 5, 100)];
    const result = buildVpRaceSeries(events, FACTIONS, { Sol: 0, Hacan: 0 }, OPTIONS, boundaries);
    expect(result.series).toHaveLength(2);
    for (const s of result.series) {
      expect(s.points[s.points.length - 1]?.cumulativeVp).toBe(0);
    }
  });
});
