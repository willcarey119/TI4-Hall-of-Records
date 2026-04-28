import { describe, it, expect } from 'vitest';
import { buildDashboardSummary } from './buildDashboardSummary';
import type { VpEvent, PlanetEvent, TechEvent, FactionSetup } from '../parser/types';

function makeFaction(id: string, pos: number, startingTechs: string[] = []): FactionSetup {
  return { factionId: id, playerName: 'P', color: '#aaa', mapPosition: pos, startingTechs, startingPlanets: [] };
}

function makeVp(faction: string, points: number): VpEvent {
  return { faction, objective: 'Obj', points, timestamp: 100, source: 'objective' };
}

function makePlanetClaim(faction: string, planet: string): PlanetEvent {
  return { faction, planet, prevOwner: null, timestamp: 100, type: 'claim' };
}

function makeTech(faction: string, tech: string, type: TechEvent['type']): TechEvent {
  return { faction, tech, timestamp: 100, type };
}

const FACTIONS = [makeFaction('Sol', 0, ['Neural Motivator']), makeFaction('Hacan', 1)];
const SCORES: Record<string, number> = { Sol: 7, Hacan: 10 };
const OPTIONS: Record<string, unknown> = { victoryPoints: 10 };

describe('buildDashboardSummary', () => {
  it('returns one faction entry per faction', () => {
    const result = buildDashboardSummary([], [], [], FACTIONS, SCORES, OPTIONS);
    expect(result.factions).toHaveLength(2);
  });

  it('factions are sorted by finalVp descending', () => {
    const result = buildDashboardSummary([], [], [], FACTIONS, SCORES, OPTIONS);
    expect(result.factions[0]?.finalVp).toBeGreaterThanOrEqual(result.factions[1]?.finalVp ?? 0);
  });

  it('marks the winner (faction at or above victoryPoints)', () => {
    const result = buildDashboardSummary([], [], [], FACTIONS, SCORES, OPTIONS);
    expect(result.winner).toBe('Hacan');
    expect(result.factions.find(f => f.factionId === 'Hacan')?.isWinner).toBe(true);
    expect(result.factions.find(f => f.factionId === 'Sol')?.isWinner).toBe(false);
  });

  it('includes objectives scored per faction', () => {
    const vpEvents = [makeVp('Sol', 1), makeVp('Sol', 2), makeVp('Hacan', 1)];
    const result = buildDashboardSummary(vpEvents, [], [], FACTIONS, SCORES, OPTIONS);
    expect(result.factions.find(f => f.factionId === 'Sol')?.objectivesScored).toHaveLength(2);
    expect(result.factions.find(f => f.factionId === 'Hacan')?.objectivesScored).toHaveLength(1);
  });

  it('includes only "research" type techs in techsResearched', () => {
    const techEvents = [
      makeTech('Sol', 'Bio-Stims', 'research'),
      makeTech('Sol', 'Neural Motivator', 'starting'),
      makeTech('Sol', 'Spec II', 'remove'),
    ];
    const result = buildDashboardSummary([], [], techEvents, FACTIONS, SCORES, OPTIONS);
    const sol = result.factions.find(f => f.factionId === 'Sol');
    expect(sol?.techsResearched).toHaveLength(1);
    expect(sol?.techsResearched[0]?.tech).toBe('Bio-Stims');
  });

  it('includes startingTechs from FactionSetup', () => {
    const result = buildDashboardSummary([], [], [], FACTIONS, SCORES, OPTIONS);
    const sol = result.factions.find(f => f.factionId === 'Sol');
    expect(sol?.startingTechs[0]?.tech).toBe('Neural Motivator');
  });

  it('counts planets controlled per faction', () => {
    const planetEvents = [
      makePlanetClaim('Sol', 'Vefut II'),
      makePlanetClaim('Sol', 'Mecatol Rex'),
    ];
    const result = buildDashboardSummary([], planetEvents, [], FACTIONS, SCORES, OPTIONS);
    expect(result.factions.find(f => f.factionId === 'Sol')?.planetsControlled).toBe(2);
    expect(result.factions.find(f => f.factionId === 'Hacan')?.planetsControlled).toBe(0);
  });

  it('counts starting planets even with no planetEvents', () => {
    const factionsWithPlanets: FactionSetup[] = [
      { factionId: 'Sol', playerName: 'P', color: '#aaa', mapPosition: 0, startingTechs: [], startingPlanets: ['Jord', 'Moll Primus'] },
      { factionId: 'Hacan', playerName: 'P', color: '#bbb', mapPosition: 1, startingTechs: [], startingPlanets: ['Hercant', 'Arretze', 'Kamdorn'] },
    ];
    const result = buildDashboardSummary([], [], [], factionsWithPlanets, { Sol: 7, Hacan: 10 }, { victoryPoints: 10 });
    const sol = result.factions.find(f => f.factionId === 'Sol');
    const hacan = result.factions.find(f => f.factionId === 'Hacan');
    expect(sol?.planetsControlled).toBe(2);
    expect(hacan?.planetsControlled).toBe(3);
  });

  it('winner is null when no faction reached victoryPoints', () => {
    const result = buildDashboardSummary([], [], [], FACTIONS, { Sol: 5, Hacan: 8 }, OPTIONS);
    expect(result.winner).toBeNull();
  });

  it('handles empty inputs without throwing', () => {
    expect(() => buildDashboardSummary([], [], [], [], {}, {})).not.toThrow();
  });
});
