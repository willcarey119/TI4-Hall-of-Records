import { describe, it, expect } from 'vitest';
import { buildTechPaths } from './buildTechPaths';
import type { ParsedGame, TechEvent } from '../parser/types';

function makeTechEvent(faction: string, tech: string, timestamp: number): TechEvent {
  return { faction, tech, type: 'research', timestamp };
}
function makeGame(id: string, events: TechEvent[], factionId = 'Sol'): Partial<ParsedGame> {
  return {
    gameId: id,
    techEvents: events,
    factions: [{ factionId, playerName: 'p', color: 'blue', mapPosition: 0, startingTechs: [], startingPlanets: [] }],
  };
}

describe('buildTechPaths', () => {
  it('returns empty for no games', () => {
    expect(buildTechPaths([]).factions).toHaveLength(0);
  });

  it('excludes factions that appear in only 1 game', () => {
    const r = buildTechPaths([makeGame('g1', [makeTechEvent('Sol', 'Neural Motivator', 1)])] as ParsedGame[]);
    expect(r.factions).toHaveLength(0);
  });

  it('includes factions that appear in 2+ games', () => {
    const games = [
      makeGame('g1', [makeTechEvent('Sol', 'Neural Motivator', 1)]),
      makeGame('g2', [makeTechEvent('Sol', 'Sarween Tools', 1)]),
    ] as ParsedGame[];
    const r = buildTechPaths(games);
    expect(r.factions.find(f => f.factionId === 'Sol')).toBeDefined();
  });

  it('identifies most common first-researched tech', () => {
    const games = [
      makeGame('g1', [makeTechEvent('Sol', 'Neural Motivator', 1), makeTechEvent('Sol', 'Sarween Tools', 2)]),
      makeGame('g2', [makeTechEvent('Sol', 'Neural Motivator', 1), makeTechEvent('Sol', 'Predictive Intelligence', 2)]),
      makeGame('g3', [makeTechEvent('Sol', 'Neural Motivator', 1)]),
    ] as ParsedGame[];
    const r = buildTechPaths(games);
    const sol = r.factions.find(f => f.factionId === 'Sol');
    expect(sol?.pathByPosition[0]?.topTechs[0]?.tech).toBe('Neural Motivator');
  });

  it('uses only type research events, not starting', () => {
    const games = [
      makeGame('g1', [
        { faction: 'Sol', tech: 'Neural Motivator', type: 'starting', timestamp: 0 },
        makeTechEvent('Sol', 'Sarween Tools', 1),
      ]),
      makeGame('g2', [makeTechEvent('Sol', 'Sarween Tools', 1)]),
    ] as ParsedGame[];
    const r = buildTechPaths(games);
    const sol = r.factions.find(f => f.factionId === 'Sol');
    expect(sol?.pathByPosition[0]?.topTechs[0]?.tech).toBe('Sarween Tools');
  });
});
