import { describe, it, expect } from 'vitest';
import { buildMecatolTimeline } from './buildMecatolTimeline';
import type { PlanetEvent, FactionSetup } from '../parser/types';
import type { RoundBoundary } from '../aggregator/deriveRoundBoundaries';

function makeFaction(id: string, color: string): FactionSetup {
  return { factionId: id, playerName: 'P', color, mapPosition: 0, startingTechs: [], startingPlanets: [] };
}

function makeClaim(faction: string, ts: number): PlanetEvent {
  return { faction, planet: 'Mecatol Rex', prevOwner: null, timestamp: ts, type: 'claim' };
}

function makeUnclaim(faction: string, ts: number): PlanetEvent {
  return { faction, planet: 'Mecatol Rex', prevOwner: faction, timestamp: ts, type: 'unclaim' };
}

function makeNonMecatol(faction: string, ts: number): PlanetEvent {
  return { faction, planet: 'Vefut II', prevOwner: null, timestamp: ts, type: 'claim' };
}

function makeBoundary(round: number, start: number): RoundBoundary {
  return { round, startTimestamp: start };
}

const FACTIONS = [makeFaction('Sol', '#1a5eb0'), makeFaction('Hacan', '#c8900c')];
const BOUNDARIES: RoundBoundary[] = [
  makeBoundary(1, 100),
  makeBoundary(2, 200),
  makeBoundary(3, 300),
];

describe('buildMecatolTimeline', () => {
  it('returns empty result when roundBoundaries is empty', () => {
    const result = buildMecatolTimeline([], FACTIONS, []);
    expect(result.rounds).toHaveLength(0);
    expect(result.totalRounds).toBe(0);
    expect(result.claimedInGame).toBe(false);
  });

  it('all rounds unclaimed when there are no planet events', () => {
    const result = buildMecatolTimeline([], FACTIONS, BOUNDARIES);
    expect(result.rounds).toHaveLength(3);
    expect(result.rounds.every(r => r.factionId === null)).toBe(true);
    expect(result.claimedInGame).toBe(false);
  });

  it('non-mecatol planet events are ignored', () => {
    const events: PlanetEvent[] = [makeNonMecatol('Sol', 150)];
    const result = buildMecatolTimeline(events, FACTIONS, BOUNDARIES);
    expect(result.rounds.every(r => r.factionId === null)).toBe(true);
    expect(result.claimedInGame).toBe(false);
  });

  it('claimed in R2 → R1 null, R2+ shows factionId', () => {
    // Sol claims Mecatol at timestamp 250 (between R2 start=200 and R3 start=300)
    const events: PlanetEvent[] = [makeClaim('Sol', 250)];
    const result = buildMecatolTimeline(events, FACTIONS, BOUNDARIES);
    expect(result.rounds[0]?.factionId).toBeNull();   // R1 end = just before R2 start
    expect(result.rounds[1]?.factionId).toBe('Sol');  // R2
    expect(result.rounds[2]?.factionId).toBe('Sol');  // R3
  });

  it('claimed R1, taken by another faction R3 → R1 A, R2 A, R3 B', () => {
    const events: PlanetEvent[] = [
      makeClaim('Sol', 150),    // in R1 window
      makeClaim('Hacan', 350), // in R3 window
    ];
    const result = buildMecatolTimeline(events, FACTIONS, BOUNDARIES);
    expect(result.rounds[0]?.factionId).toBe('Sol');
    expect(result.rounds[1]?.factionId).toBe('Sol');
    expect(result.rounds[2]?.factionId).toBe('Hacan');
  });

  it('claimed then unclaimed within same round → null for that round', () => {
    const events: PlanetEvent[] = [
      makeClaim('Sol', 150),
      makeUnclaim('Sol', 170),
    ];
    const result = buildMecatolTimeline(events, FACTIONS, BOUNDARIES);
    expect(result.rounds[0]?.factionId).toBeNull();
    expect(result.rounds[1]?.factionId).toBeNull();
    expect(result.rounds[2]?.factionId).toBeNull();
  });

  it('claimedInGame is true when at least one round has an owner', () => {
    const events: PlanetEvent[] = [makeClaim('Sol', 150)];
    const result = buildMecatolTimeline(events, FACTIONS, BOUNDARIES);
    expect(result.claimedInGame).toBe(true);
  });

  it('assigns correct color from factions lookup', () => {
    const events: PlanetEvent[] = [makeClaim('Hacan', 150)];
    const result = buildMecatolTimeline(events, FACTIONS, BOUNDARIES);
    expect(result.rounds[0]?.color).toBe('#c8900c');
  });

  it('color is null when factionId is null', () => {
    const result = buildMecatolTimeline([], FACTIONS, BOUNDARIES);
    expect(result.rounds[0]?.color).toBeNull();
  });

  it('totalRounds equals the number of round boundaries', () => {
    const result = buildMecatolTimeline([], FACTIONS, BOUNDARIES);
    expect(result.totalRounds).toBe(3);
  });
});
