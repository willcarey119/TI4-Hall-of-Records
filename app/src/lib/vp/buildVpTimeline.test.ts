import { describe, it, expect } from 'vitest';
import { buildVpTimeline } from './buildVpTimeline';
import type { VpEvent, FactionSetup } from '../parser/types';

function makeFaction(id: string, pos: number, color = '#aaa'): FactionSetup {
  return { factionId: id, playerName: 'Player', color, mapPosition: pos, startingTechs: [], startingPlanets: [] };
}

function makeVpEvent(faction: string, points: number, timestamp: number): VpEvent {
  return { faction, objective: 'Test Obj', points, timestamp, source: 'objective' };
}

const FACTIONS = [makeFaction('Sol', 0, 'blue'), makeFaction('Hacan', 1, 'gold')];
const SCORES: Record<string, number> = { Sol: 7, Hacan: 10 };
const OPTIONS: Record<string, unknown> = { victoryPoints: 10 };

describe('buildVpTimeline', () => {
  it('returns one series entry per faction', () => {
    const result = buildVpTimeline([], FACTIONS, SCORES, OPTIONS, 3600);
    expect(result.series).toHaveLength(2);
  });

  it('every series starts at cumulativeVp 0', () => {
    const result = buildVpTimeline([], FACTIONS, SCORES, OPTIONS, 3600);
    for (const s of result.series) {
      expect(s.points[0]?.cumulativeVp).toBe(0);
    }
  });

  it('reads victoryPoints from options, defaulting to 10', () => {
    expect(buildVpTimeline([], FACTIONS, SCORES, {}, 3600).victoryPoints).toBe(10);
    expect(buildVpTimeline([], FACTIONS, SCORES, { victoryPoints: 14 }, 3600).victoryPoints).toBe(14);
  });

  it('builds cumulative VP series from events in order', () => {
    const events = [
      makeVpEvent('Sol', 1, 100),
      makeVpEvent('Sol', 2, 200),
      makeVpEvent('Hacan', 3, 300),
    ];
    const result = buildVpTimeline(events, FACTIONS, SCORES, OPTIONS, 3600);
    const sol = result.series.find(s => s.factionId === 'Sol');
    expect(sol?.points.map(p => p.cumulativeVp)).toEqual([0, 1, 3]);
    const hacan = result.series.find(s => s.factionId === 'Hacan');
    expect(hacan?.points.map(p => p.cumulativeVp)).toEqual([0, 3]);
  });

  it('marks the winner (faction at or above victoryPoints in finalScores)', () => {
    const result = buildVpTimeline([], FACTIONS, SCORES, OPTIONS, 3600);
    expect(result.series.find(s => s.factionId === 'Hacan')?.isWinner).toBe(true);
    expect(result.series.find(s => s.factionId === 'Sol')?.isWinner).toBe(false);
  });

  it('series are ordered by faction mapPosition', () => {
    const result = buildVpTimeline([], FACTIONS, SCORES, OPTIONS, 3600);
    expect(result.series[0]?.factionId).toBe('Sol');   // mapPosition 0
    expect(result.series[1]?.factionId).toBe('Hacan'); // mapPosition 1
  });

  it('headline and deckText are non-empty strings', () => {
    const result = buildVpTimeline([], FACTIONS, SCORES, OPTIONS, 3600);
    expect(result.headline.length).toBeGreaterThan(0);
    expect(result.deckText.length).toBeGreaterThan(0);
  });

  it('handles empty inputs without throwing', () => {
    expect(() => buildVpTimeline([], [], {}, {}, 0)).not.toThrow();
  });

  it('silently drops VP events for unregistered factions', () => {
    const events = [makeVpEvent('Unknown', 5, 100)];
    const result = buildVpTimeline(events, FACTIONS, SCORES, OPTIONS, 3600);
    expect(result.series).toHaveLength(2);
    // Known factions should have only the anchor point — no VP was added
    for (const s of result.series) {
      expect(s.points).toHaveLength(1);
      expect(s.points[0]?.cumulativeVp).toBe(0);
    }
  });

  it('gameTimeSeconds on each point is relative to the first event timestamp', () => {
    const events = [makeVpEvent('Sol', 1, 1000), makeVpEvent('Sol', 1, 3000)];
    const result = buildVpTimeline(events, FACTIONS, SCORES, OPTIONS, 3600);
    const sol = result.series.find(s => s.factionId === 'Sol');
    expect(sol?.points[1]?.gameTimeSeconds).toBe(0);     // first event = t0
    expect(sol?.points[2]?.gameTimeSeconds).toBe(2000);  // second event = t0 + 2000
  });
});
