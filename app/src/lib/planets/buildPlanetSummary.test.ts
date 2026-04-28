import { describe, it, expect } from 'vitest';
import { buildPlanetSummary } from './buildPlanetSummary';
import type { PlanetEvent, FactionSetup } from '../parser/types';

function makeFaction(id: string, pos: number): FactionSetup {
  return { factionId: id, playerName: 'P', color: '#aaa', mapPosition: pos, startingTechs: [], startingPlanets: [] };
}

function makeClaim(faction: string, planet: string, ts: number, prevOwner: string | null = null): PlanetEvent {
  return { faction, planet, prevOwner, timestamp: ts, type: 'claim' };
}

function makeUnclaim(faction: string, planet: string, ts: number): PlanetEvent {
  return { faction, planet, prevOwner: faction, timestamp: ts, type: 'unclaim' };
}

const FACTIONS = [makeFaction('Sol', 0), makeFaction('Hacan', 1)];

describe('buildPlanetSummary', () => {
  it('returns empty inventories for empty planet events', () => {
    const result = buildPlanetSummary([], FACTIONS);
    expect(result.inventories).toHaveLength(0);
    expect(result.totalControlled).toBe(0);
  });

  it('assigns planets to the last claiming faction', () => {
    const events = [
      makeClaim('Sol', 'Vefut II', 100),
      makeClaim('Hacan', 'Vefut II', 200, 'Sol'),
    ];
    const result = buildPlanetSummary(events, FACTIONS);
    const hacan = result.inventories.find(inv => inv.factionId === 'Hacan');
    expect(hacan?.planets.some(p => p.planet === 'Vefut II')).toBe(true);
    const sol = result.inventories.find(inv => inv.factionId === 'Sol');
    expect(sol?.planets.some(p => p.planet === 'Vefut II')).toBeFalsy();
  });

  it('unclaimed planets are not assigned to any faction', () => {
    const events = [
      makeClaim('Sol', 'Vefut II', 100),
      makeUnclaim('Sol', 'Vefut II', 200),
    ];
    const result = buildPlanetSummary(events, FACTIONS);
    expect(result.totalControlled).toBe(0);
  });

  it('tracks changeCount for planets that changed hands', () => {
    const events = [
      makeClaim('Sol', 'Mecatol Rex', 100),
      makeClaim('Hacan', 'Mecatol Rex', 200, 'Sol'),
    ];
    const result = buildPlanetSummary(events, FACTIONS);
    const mr = result.mecatol;
    expect(mr?.changeCount).toBeGreaterThanOrEqual(1);
  });

  it('identifies Mecatol Rex separately', () => {
    const events = [makeClaim('Sol', 'Mecatol Rex', 100)];
    const result = buildPlanetSummary(events, FACTIONS);
    expect(result.mecatol).not.toBeNull();
    expect(result.mecatol?.isMecatol).toBe(true);
    expect(result.mecatol?.factionId).toBe('Sol');
  });

  it('mecatol is null when no faction has claimed it', () => {
    const result = buildPlanetSummary([], FACTIONS);
    expect(result.mecatol).toBeNull();
  });

  it('contested planets are those that changed hands 2+ times', () => {
    const events = [
      makeClaim('Sol', 'Vefut II', 100),
      makeClaim('Hacan', 'Vefut II', 200, 'Sol'),
      makeClaim('Sol', 'Vefut II', 300, 'Hacan'),
    ];
    const result = buildPlanetSummary(events, FACTIONS);
    expect(result.contested.some(p => p.planet === 'Vefut II')).toBe(true);
  });

  it('inventories are ordered by mapPosition and exclude factions with 0 planets', () => {
    const events = [makeClaim('Hacan', 'Vefut II', 100)];
    const result = buildPlanetSummary(events, FACTIONS);
    expect(result.inventories).toHaveLength(1);
    expect(result.inventories[0]?.factionId).toBe('Hacan');
  });

  it('deckText is a non-empty string', () => {
    const result = buildPlanetSummary([makeClaim('Sol', 'Vefut II', 100)], FACTIONS);
    expect(result.deckText.length).toBeGreaterThan(0);
  });

  it('handles empty inputs without throwing', () => {
    expect(() => buildPlanetSummary([], [])).not.toThrow();
  });

  it('sorts Mecatol Rex first in a faction inventory with multiple planets', () => {
    const events = [
      makeClaim('Sol', 'Vefut II', 100),
      makeClaim('Sol', 'Mecatol Rex', 200),
    ];
    const result = buildPlanetSummary(events, FACTIONS);
    const sol = result.inventories.find(inv => inv.factionId === 'Sol');
    expect(sol?.planets[0]?.planet).toBe('Mecatol Rex');
    expect(sol?.planets[1]?.planet).toBe('Vefut II');
  });
});
