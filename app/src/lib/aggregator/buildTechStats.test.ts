import { describe, it, expect } from 'vitest';
import { buildTechStats } from './buildTechStats';
import type { ParsedGame, TechEvent } from '../parser/types';
import type { RoundBoundary } from './deriveRoundBoundaries';

function makeGame(gameId: string, opts: {
  factions?: string[];
  techEvents?: TechEvent[];
  winner?: string | null;
  finalScores?: Record<string, number>;
}): ParsedGame {
  const factions = (opts.factions ?? ['Sol']).map((id, i) => ({
    factionId: id, playerName: 'p', color: '#aaa', mapPosition: i, startingTechs: [], startingPlanets: [],
  }));
  return {
    gameId, playedAt: 0, durationSeconds: 3600,
    factions, options: {}, initialSpeaker: factions[0]?.factionId ?? '',
    phaseSnapshots: [], vpEvents: [], planetEvents: [], techEvents: opts.techEvents ?? [],
    agendaResolutions: [], strategyCardEvents: [], actionCardEvents: [], componentEvents: [],
    relicEvents: [], leaderEvents: [], objectiveReveals: [], speakerEvents: [],
    attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: [],
    expeditionEvents: [], secondaryEvents: [], actionEvents: [],
    finalScores: opts.finalScores ?? {}, winner: opts.winner ?? null,
    timers: { game: 3600, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
  };
}

describe('buildTechStats', () => {
  it('returns empty summary for empty games', () => {
    const result = buildTechStats([], new Map());
    expect(result.topTechs).toEqual([]);
    expect(result.byColor.green).toEqual([]);
  });

  it('aggregates research counts across games', () => {
    const games = [
      makeGame('g1', { techEvents: [
        { faction: 'Sol', tech: 'Plasma Scoring', timestamp: 100, type: 'research' },
      ] }),
      makeGame('g2', { techEvents: [
        { faction: 'Sol', tech: 'Plasma Scoring', timestamp: 100, type: 'research' },
      ] }),
    ];
    const result = buildTechStats(games, new Map());
    const ps = result.topTechs.find(t => t.tech === 'Plasma Scoring');
    expect(ps?.researchCount).toBe(2);
  });

  it('excludes starting techs from researchCount but includes them in winnerHeldRate', () => {
    const games = [
      makeGame('g1', {
        winner: 'Sol',
        techEvents: [
          { faction: 'Sol', tech: 'Antimass Deflectors', timestamp: 50, type: 'starting' },
        ],
      }),
    ];
    const result = buildTechStats(games, new Map());
    const amd = result.topTechs.find(t => t.tech === 'Antimass Deflectors');
    // Starting tech: researchCount 0, but winner held it → winnerHeldRate 1
    expect(amd?.researchCount).toBe(0);
    expect(amd?.winnerHeldRate).toBe(1);
  });

  it('winnerHeldRate excludes games where winner is null', () => {
    const games = [
      makeGame('g1', { winner: null, techEvents: [
        { faction: 'Sol', tech: 'Sarween Tools', timestamp: 100, type: 'research' },
      ] }),
    ];
    const result = buildTechStats(games, new Map());
    const st = result.topTechs.find(t => t.tech === 'Sarween Tools');
    expect(st?.winnerHeldRate).toBe(0);  // 0 / 0 → 0 by convention (no winner games)
  });

  it('avgRoundFirstResearched is null when no boundaries available', () => {
    const games = [makeGame('g1', { techEvents: [
      { faction: 'Sol', tech: 'AI Development Algorithm', timestamp: 100, type: 'research' },
    ] })];
    expect(buildTechStats(games, new Map()).topTechs[0]?.avgRoundFirstResearched).toBeNull();
  });

  it('avgRoundFirstResearched uses boundaries when present', () => {
    const games = [
      makeGame('g1', { techEvents: [
        { faction: 'Sol', tech: 'AI Development Algorithm', timestamp: 1500, type: 'research' },
      ] }),
    ];
    const boundaries = new Map<string, RoundBoundary[]>([
      ['g1', [{ round: 1, startTimestamp: 100 }, { round: 2, startTimestamp: 1000 }]],
    ]);
    expect(buildTechStats(games, boundaries).topTechs[0]?.avgRoundFirstResearched).toBe(2);
  });

  it('byColor groups techs by their color', () => {
    const games = [makeGame('g1', { techEvents: [
      { faction: 'Sol', tech: 'Plasma Scoring',  timestamp: 100, type: 'research' }, // red
      { faction: 'Sol', tech: 'Sarween Tools',   timestamp: 200, type: 'research' }, // yellow
    ] })];
    const result = buildTechStats(games, new Map());
    expect(result.byColor.red.some(t => t.tech === 'Plasma Scoring')).toBe(true);
    expect(result.byColor.yellow.some(t => t.tech === 'Sarween Tools')).toBe(true);
  });
});
