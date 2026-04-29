import { describe, it, expect } from 'vitest';
import { buildScoringPace, buildScoringPaceRounds } from './buildScoringPace';
import type { ParsedGame } from '../parser/types';
import type { RoundBoundary } from './deriveRoundBoundaries';

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

describe('buildScoringPaceRounds', () => {
  const R1: RoundBoundary = { round: 1, startTimestamp: 1000 };
  const R2: RoundBoundary = { round: 2, startTimestamp: 5000 };
  const R3: RoundBoundary = { round: 3, startTimestamp: 9000 };

  function makeGameWithRounds(overrides: Partial<ParsedGame>): ParsedGame {
    return {
      gameId: 'g1', playedAt: 0, durationSeconds: 15,
      factions: [
        { factionId: 'Sol', playerName: 'p1', color: 'blue', mapPosition: 0, startingTechs: [], startingPlanets: [] },
        { factionId: 'Mentak', playerName: 'p2', color: 'red', mapPosition: 1, startingTechs: [], startingPlanets: [] },
      ],
      options: {}, initialSpeaker: 'Sol', phaseSnapshots: [],
      vpEvents: [], planetEvents: [], techEvents: [], agendaResolutions: [],
      strategyCardEvents: [
        { type: 'pick', faction: 'Sol', card: 'Leadership', timestamp: 1000 },
        { type: 'pick', faction: 'Mentak', card: 'Diplomacy', timestamp: 1200 },
        { type: 'pick', faction: 'Sol', card: 'Leadership', timestamp: 5000 },
        { type: 'pick', faction: 'Mentak', card: 'Diplomacy', timestamp: 5200 },
        { type: 'pick', faction: 'Sol', card: 'Leadership', timestamp: 9000 },
        { type: 'pick', faction: 'Mentak', card: 'Diplomacy', timestamp: 9200 },
      ],
      actionCardEvents: [], componentEvents: [],
      relicEvents: [], leaderEvents: [], objectiveReveals: [], speakerEvents: [],
      attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: [],
      expeditionEvents: [], secondaryEvents: [], actionEvents: [],
      finalScores: { Sol: 10, Mentak: 5 }, winner: 'Sol',
      timers: { game: 15, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
      warnings: [],
      ...overrides,
    } as ParsedGame;
  }

  it('returns empty for no games', () => {
    const r = buildScoringPaceRounds([]);
    expect(r.roundCurves).toHaveLength(0);
  });

  it('excludes games with no winner', () => {
    const game = makeGameWithRounds({ winner: null });
    const r = buildScoringPaceRounds([game]);
    expect(r.roundCurves).toHaveLength(0);
  });

  it('excludes games where roundBoundaries cannot be derived', () => {
    // No strategy card events → no boundaries → no curve
    const game = makeGameWithRounds({ strategyCardEvents: [], winner: 'Sol' });
    const r = buildScoringPaceRounds([game]);
    expect(r.roundCurves).toHaveLength(0);
  });

  it('produces one curve per game with winner', () => {
    const game = makeGameWithRounds({
      vpEvents: [
        { faction: 'Sol', objective: 'obj1', points: 3, timestamp: 2000, source: 'score_objective' },
        { faction: 'Sol', objective: 'obj2', points: 7, timestamp: 7000, source: 'score_objective' },
      ],
      finalScores: { Sol: 10, Mentak: 2 },
      winner: 'Sol',
    });
    const r = buildScoringPaceRounds([game]);
    expect(r.roundCurves).toHaveLength(1);
  });

  it('curve starts at round 0 with 0 VP', () => {
    const game = makeGameWithRounds({
      vpEvents: [{ faction: 'Sol', objective: 'obj1', points: 5, timestamp: 2000, source: 'score_objective' }],
      winner: 'Sol',
    });
    const r = buildScoringPaceRounds([game]);
    expect(r.roundCurves[0]?.points[0]).toEqual({ round: 0, vp: 0 });
  });

  it('accumulates winner VP per round correctly', () => {
    // Sol scores 3 VP in R1 (ts=2000 < R2.startTimestamp=5000)
    // Sol scores 3+7=10 VP by end of R2 (ts=7000 < R3.startTimestamp=9000)
    const game = makeGameWithRounds({
      vpEvents: [
        { faction: 'Sol', objective: 'obj1', points: 3, timestamp: 2000, source: 'score_objective' },
        { faction: 'Sol', objective: 'obj2', points: 7, timestamp: 7000, source: 'score_objective' },
      ],
      finalScores: { Sol: 10, Mentak: 2 },
      winner: 'Sol',
    });
    const r = buildScoringPaceRounds([game]);
    const pts = r.roundCurves[0]?.points ?? [];
    // round 0 anchor, then R1=3, R2=10, R3=10 (winner already at 10)
    expect(pts).toHaveLength(4);
    expect(pts[1]).toEqual({ round: 1, vp: 3 });
    expect(pts[2]).toEqual({ round: 2, vp: 10 });
    expect(pts[3]).toEqual({ round: 3, vp: 10 });
  });

  it('exposes maxRounds and victoryPoints on summary', () => {
    const game = makeGameWithRounds({
      vpEvents: [{ faction: 'Sol', objective: 'obj1', points: 10, timestamp: 2000, source: 'score_objective' }],
      winner: 'Sol',
    });
    const r = buildScoringPaceRounds([game]);
    expect(r.maxRounds).toBeGreaterThanOrEqual(3);
    expect(r.victoryPoints).toBe(10);
  });

  it('tracks the game with highest peak VP as highlightGameId', () => {
    const gameA = makeGameWithRounds({
      gameId: 'gA',
      vpEvents: [{ faction: 'Sol', objective: 'obj1', points: 10, timestamp: 2000, source: 'score_objective' }],
      finalScores: { Sol: 10, Mentak: 2 }, winner: 'Sol',
    });
    const gameB = { ...makeGameWithRounds({
      gameId: 'gB',
      vpEvents: [{ faction: 'Sol', objective: 'obj1', points: 8, timestamp: 2000, source: 'score_objective' }],
      finalScores: { Sol: 8, Mentak: 5 }, winner: 'Sol',
    }), gameId: 'gB' };
    const r = buildScoringPaceRounds([gameA, gameB]);
    expect(r.highlightGameId).toBe('gA');
  });
});
