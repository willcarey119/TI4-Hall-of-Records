import { describe, it, expect } from 'vitest';
import { buildTerritoryByRound } from './buildTerritoryByRound';
import type { PlanetEvent, FactionSetup } from '../parser/types';
import type { RoundBoundary } from './deriveRoundBoundaries';

function makeFaction(id: string, planets: string[]): FactionSetup {
  return {
    factionId: id,
    playerName: id,
    color: '#000',
    mapPosition: 0,
    startingTechs: [],
    startingPlanets: planets,
  };
}

describe('buildTerritoryByRound', () => {
  it('returns empty array when no round boundaries', () => {
    const result = buildTerritoryByRound([], [], []);
    expect(result).toEqual([]);
  });

  it('round 1 reflects starting planets when no events have fired', () => {
    const factions = [makeFaction('A', ['Jord', 'Nar']), makeFaction('B', ['Arc Prime'])];
    const boundaries: RoundBoundary[] = [{ round: 1, startTimestamp: 100 }];
    const result = buildTerritoryByRound([], factions, boundaries);
    expect(result).toHaveLength(1);
    expect(result[0]?.round).toBe(1);
    const a = result[0]?.factions.find(f => f.factionId === 'A');
    const b = result[0]?.factions.find(f => f.factionId === 'B');
    expect(a?.planets.sort()).toEqual(['Jord', 'Nar']);
    expect(b?.planets).toEqual(['Arc Prime']);
    expect(a?.planetCount).toBe(2);
    expect(a?.gained).toEqual([]);
    expect(a?.lost).toEqual([]);
  });

  it('applies claim events through end of each round', () => {
    const factions = [makeFaction('A', ['Jord']), makeFaction('B', ['Arc Prime'])];
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 100 },
      { round: 2, startTimestamp: 1000 },
    ];
    const events: PlanetEvent[] = [
      { faction: 'A', planet: 'Saudor', prevOwner: null, timestamp: 200, type: 'claim' },
      { faction: 'A', planet: 'Primor', prevOwner: null, timestamp: 1500, type: 'claim' },
    ];
    const result = buildTerritoryByRound(events, factions, boundaries);
    const r1A = result[0]?.factions.find(f => f.factionId === 'A');
    const r2A = result[1]?.factions.find(f => f.factionId === 'A');
    expect(r1A?.planets.sort()).toEqual(['Jord', 'Saudor']);
    expect(r1A?.gained).toEqual(['Saudor']);
    expect(r2A?.planets.sort()).toEqual(['Jord', 'Primor', 'Saudor']);
    expect(r2A?.gained).toEqual(['Primor']);
  });

  it('tracks losses when prevOwner had a planet that gets claimed by another faction', () => {
    const factions = [makeFaction('A', ['Jord']), makeFaction('B', ['Arc Prime'])];
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 100 },
      { round: 2, startTimestamp: 1000 },
    ];
    const events: PlanetEvent[] = [
      { faction: 'B', planet: 'Jord', prevOwner: 'A', timestamp: 1500, type: 'claim' },
    ];
    const result = buildTerritoryByRound(events, factions, boundaries);
    const r2A = result[1]?.factions.find(f => f.factionId === 'A');
    const r2B = result[1]?.factions.find(f => f.factionId === 'B');
    expect(r2A?.planets).toEqual([]);
    expect(r2A?.lost).toEqual(['Jord']);
    expect(r2B?.planets.sort()).toEqual(['Arc Prime', 'Jord']);
    expect(r2B?.gained).toEqual(['Jord']);
  });

  it('handles unclaim events (planet returns to neutral)', () => {
    const factions = [makeFaction('A', ['Jord'])];
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 100 },
      { round: 2, startTimestamp: 1000 },
    ];
    const events: PlanetEvent[] = [
      { faction: 'A', planet: 'Jord', prevOwner: 'A', timestamp: 1500, type: 'unclaim' },
    ];
    const result = buildTerritoryByRound(events, factions, boundaries);
    const r2A = result[1]?.factions.find(f => f.factionId === 'A');
    expect(r2A?.planets).toEqual([]);
    expect(r2A?.lost).toEqual(['Jord']);
  });

  it('multiple changes within same round: only end-of-round state is shown', () => {
    const factions = [makeFaction('A', ['Jord']), makeFaction('B', [])];
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 100 },
      { round: 2, startTimestamp: 1000 },
    ];
    // In round 2: B claims Saudor, then A claims Saudor from B (last state wins)
    const events: PlanetEvent[] = [
      { faction: 'B', planet: 'Saudor', prevOwner: null, timestamp: 1200, type: 'claim' },
      { faction: 'A', planet: 'Saudor', prevOwner: 'B', timestamp: 1300, type: 'claim' },
    ];
    const result = buildTerritoryByRound(events, factions, boundaries);
    const r2A = result[1]?.factions.find(f => f.factionId === 'A');
    const r2B = result[1]?.factions.find(f => f.factionId === 'B');
    expect(r2A?.planets.sort()).toEqual(['Jord', 'Saudor']);
    expect(r2A?.gained).toEqual(['Saudor']);
    expect(r2B?.planets).toEqual([]);
    // B never had Saudor at end of round 1 so it's not "lost" for B in round 2
    expect(r2B?.lost).toEqual([]);
  });

  it('processes events at the boundary timestamp as belonging to the new round', () => {
    // An event at timestamp == round 2 boundary should be applied AT round 2
    const factions = [makeFaction('A', [])];
    const boundaries: RoundBoundary[] = [
      { round: 1, startTimestamp: 100 },
      { round: 2, startTimestamp: 1000 },
    ];
    const events: PlanetEvent[] = [
      { faction: 'A', planet: 'X', prevOwner: null, timestamp: 1000, type: 'claim' },
    ];
    const result = buildTerritoryByRound(events, factions, boundaries);
    expect(result[0]?.factions.find(f => f.factionId === 'A')?.planets).toEqual([]);
    expect(result[1]?.factions.find(f => f.factionId === 'A')?.planets).toEqual(['X']);
  });
});
