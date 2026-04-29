import { describe, it, expect } from 'vitest';
import { buildScoringPace } from './buildScoringPace';
import type { ParsedGame } from '../parser/types';

function makeGame(overrides: Partial<ParsedGame>): ParsedGame {
  return {
    gameId: 'g1', playedAt: 1000, durationSeconds: 10,
    factions: [{ factionId: 'Sol', playerName: 'p', color: 'blue', mapPosition: 0, startingTechs: [], startingPlanets: [] }],
    options: {}, initialSpeaker: 'Sol', phaseSnapshots: [],
    vpEvents: [], planetEvents: [], techEvents: [], agendaResolutions: [],
    strategyCardEvents: [], actionCardEvents: [], componentEvents: [],
    relicEvents: [], leaderEvents: [], objectiveReveals: [], speakerEvents: [],
    attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: [],
    expeditionEvents: [], secondaryEvents: [], actionEvents: [],
    finalScores: { Sol: 10 }, winner: 'Sol',
    timers: { game: 10, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
    ...overrides,
  } as ParsedGame;
}

describe('buildScoringPace', () => {
  it('returns empty curves for no games', () => {
    expect(buildScoringPace([]).curves).toHaveLength(0);
  });

  it('excludes games with no winner', () => {
    const r = buildScoringPace([makeGame({ winner: null })]);
    expect(r.curves).toHaveLength(0);
  });

  it('curve always starts at (0, 0)', () => {
    const game = makeGame({
      vpEvents: [{ faction: 'Sol', objective: 'obj', points: 3, timestamp: 5000, source: 'score_objective' }],
    });
    const r = buildScoringPace([game]);
    expect(r.curves[0]?.points[0]).toEqual({ t: 0, vp: 0 });
  });

  it('normalizes timestamp within game duration', () => {
    // playedAt=1000ms, durationSeconds=10 → durationMs=10000ms
    // VP event at timestamp=6000 → t = (6000-1000)/10000 = 0.5
    const game = makeGame({
      vpEvents: [{ faction: 'Sol', objective: 'obj', points: 5, timestamp: 6000, source: 'score_objective' }],
    });
    const r = buildScoringPace([game]);
    expect(r.curves[0]?.points[1]?.t).toBeCloseTo(0.5);
    expect(r.curves[0]?.points[1]?.vp).toBe(5);
  });

  it('appends terminal point at t=1 with finalVp', () => {
    const game = makeGame({
      vpEvents: [{ faction: 'Sol', objective: 'obj', points: 7, timestamp: 3000, source: 'score_objective' }],
      finalScores: { Sol: 10 },
    });
    const r = buildScoringPace([game]);
    const pts = r.curves[0]?.points ?? [];
    expect(pts[pts.length - 1]).toEqual({ t: 1, vp: 10 });
  });
});
