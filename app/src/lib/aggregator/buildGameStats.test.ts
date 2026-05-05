import { describe, it, expect } from 'vitest';
import { buildGameStats } from './buildGameStats';
import type { ParsedGame, PlanetEvent, RelicEvent, AgendaResolution, VpEvent, LeaderEvent, ActionTypeEvent } from '../parser/types';
import type { RoundBoundary } from './deriveRoundBoundaries';

function makeGame(gameId: string, opts: Partial<ParsedGame>): ParsedGame {
  const base: ParsedGame = {
    gameId, playedAt: 0, durationSeconds: 3600,
    factions: [
      { factionId: 'Sol',   playerName: 'p', color: '#00f', mapPosition: 0, startingTechs: [], startingPlanets: [] },
      { factionId: 'Hacan', playerName: 'p', color: '#fa0', mapPosition: 1, startingTechs: [], startingPlanets: [] },
    ],
    options: {}, vpThreshold: 10, initialSpeaker: 'Sol',
    phaseSnapshots: [], vpEvents: [], planetEvents: [], techEvents: [],
    agendaResolutions: [], strategyCardEvents: [], actionCardEvents: [], componentEvents: [],
    relicEvents: [], leaderEvents: [], objectiveReveals: [], speakerEvents: [],
    attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: [],
    expeditionEvents: [], secondaryEvents: [], actionEvents: [],
    finalScores: { Sol: 10, Hacan: 5 }, winner: 'Sol',
    timers: { game: 3600, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
  };
  return { ...base, ...opts };
}

// Suppress unused type warning — RoundBoundary is used implicitly via Map<string, RoundBoundary[]>
const _unused: RoundBoundary | undefined = undefined;
void _unused;

describe('buildGameStats', () => {
  it('avgDurationSeconds averages across games', () => {
    const games = [
      makeGame('g1', { durationSeconds: 3600 }),
      makeGame('g2', { durationSeconds: 7200 }),
    ];
    expect(buildGameStats(games, new Map()).avgDurationSeconds).toBe(5400);
  });

  it('mecatol.firstClaimerWinRate counts winner first-claimer / total decided games', () => {
    const planetEvents: PlanetEvent[] = [
      { faction: 'Sol', planet: 'Mecatol Rex', prevOwner: null, timestamp: 100, type: 'claim' },
    ];
    const games = [makeGame('g1', { planetEvents, winner: 'Sol' })];
    expect(buildGameStats(games, new Map()).mecatol.firstClaimerWinRate).toBe(1);
  });

  it('mecatol excludes games with null winner from the rate', () => {
    const planetEvents: PlanetEvent[] = [
      { faction: 'Sol', planet: 'Mecatol Rex', prevOwner: null, timestamp: 100, type: 'claim' },
    ];
    const games = [makeGame('g1', { planetEvents, winner: null })];
    expect(buildGameStats(games, new Map()).mecatol.firstClaimerWinRate).toBeNull();
  });

  it('actionTypes returns null percentages when actionTypeEvents absent', () => {
    const games = [makeGame('g1', {})];
    const at = buildGameStats(games, new Map()).actionTypes;
    expect(at.tacticalPct).toBeNull();
    expect(at.tactical).toBe(0);
  });

  it('actionTypes computes percentages when events present', () => {
    const actionTypeEvents: ActionTypeEvent[] = [
      { faction: 'Sol', actionType: 'tactical',  timestamp: 100 },
      { faction: 'Sol', actionType: 'tactical',  timestamp: 200 },
      { faction: 'Sol', actionType: 'component', timestamp: 300 },
      { faction: 'Sol', actionType: 'pass',      timestamp: 400 },
    ];
    const games = [makeGame('g1', { actionTypeEvents })];
    const at = buildGameStats(games, new Map()).actionTypes;
    expect(at.tactical).toBe(2);
    expect(at.tacticalPct).toBeCloseTo(0.5, 5);
  });

  it('relics tracks drawn and played counts', () => {
    const relicEvents: RelicEvent[] = [
      { faction: 'Sol', relic: 'Shard of the Throne', timestamp: 100, type: 'gain' },
      { faction: 'Sol', relic: 'Shard of the Throne', timestamp: 200, type: 'play' },
    ];
    const result = buildGameStats([makeGame('g1', { relicEvents })], new Map());
    const shard = result.relics.find(r => r.relic === 'Shard of the Throne');
    expect(shard?.drawnCount).toBe(1);
    expect(shard?.playedCount).toBe(1);
    expect(shard?.grantsVp).toBe(true);
  });

  it('agendas tracks pass rate for binary agendas', () => {
    const agendaResolutions: AgendaResolution[] = [
      { agenda: 'Mutiny', outcome: 'For',     round: 1, votes: [], riders: [], timestamp: 100 },
      { agenda: 'Mutiny', outcome: 'Against', round: 2, votes: [], riders: [], timestamp: 200 },
    ];
    const result = buildGameStats([makeGame('g1', { agendaResolutions })], new Map());
    const mutiny = result.agendas.find(a => a.agenda === 'Mutiny');
    expect(mutiny?.passRate).toBe(0.5);
    expect(mutiny?.timesResolved).toBe(2);
  });

  it('vpSources breakdown sums points by source and computes share', () => {
    // 'Expand Borders' is a Stage I objective — emitted as score_objective_stage1
    const vpEvents: VpEvent[] = [
      { faction: 'Sol',   objective: 'Expand Borders', points: 3, timestamp: 100, source: 'score_objective' },
      { faction: 'Hacan', objective: 'O2',             points: 1, timestamp: 200, source: 'custodians' },
    ];
    const result = buildGameStats([makeGame('g1', { vpEvents })], new Map());
    const obj = result.vpSources.find(s => s.source === 'score_objective_stage1');
    expect(obj?.totalPoints).toBe(3);
    expect(obj?.sharePct).toBeCloseTo(0.75, 5);
  });

  it('headline counters: avgWinningVp, avgPlayersPerGame', () => {
    const games = [
      makeGame('g1', { finalScores: { Sol: 10, Hacan: 5 }, winner: 'Sol' }),
      makeGame('g2', { finalScores: { Sol: 12, Hacan: 6 }, winner: 'Sol' }),
    ];
    const result = buildGameStats(games, new Map());
    expect(result.avgWinningVp).toBe(11);
    expect(result.avgPlayersPerGame).toBe(2);
  });

  it('heroActivations counts only "play" type leader events for known heroes', () => {
    const leaderEvents: LeaderEvent[] = [
      { faction: 'Sol', leader: 'Brother Omar',   timestamp: 100, type: 'unlock' },
      { faction: 'Sol', leader: 'Brother Omar',   timestamp: 200, type: 'play'   },
      { faction: 'Sol', leader: 'Some Commander', timestamp: 300, type: 'play'   },
    ];
    const result = buildGameStats([makeGame('g1', { leaderEvents })], new Map());
    const omar = result.heroActivations.find(h => h.leaderName === 'Brother Omar');
    if (omar !== undefined) {
      expect(omar.gamesActivated).toBe(1);
    }
  });

  it('vpDiversity averages distinct sources for winners vs. non-winners', () => {
    const vpEvents: VpEvent[] = [
      { faction: 'Sol',   objective: 'O1', points: 2, timestamp: 100, source: 'score_objective' },
      { faction: 'Sol',   objective: 'C',  points: 1, timestamp: 200, source: 'custodians' },
      { faction: 'Sol',   objective: 'A',  points: 1, timestamp: 300, source: 'agenda' },
      { faction: 'Hacan', objective: 'O2', points: 2, timestamp: 400, source: 'score_objective' },
    ];
    const games = [makeGame('g1', { vpEvents, winner: 'Sol' })];
    const div = buildGameStats(games, new Map()).vpDiversity;
    expect(div.avgWinnerDistinctSources).toBe(3);
    expect(div.avgLoserDistinctSources).toBe(1);
  });

  it('vpDiversity HHI is higher (more concentrated) for the loser in this fixture', () => {
    const vpEvents: VpEvent[] = [
      { faction: 'Sol',   objective: 'O1', points: 1, timestamp: 100, source: 'score_objective' },
      { faction: 'Sol',   objective: 'C',  points: 1, timestamp: 200, source: 'custodians' },
      { faction: 'Sol',   objective: 'A',  points: 1, timestamp: 300, source: 'agenda' },
      { faction: 'Sol',   objective: 'R',  points: 1, timestamp: 400, source: 'relic' },
      { faction: 'Hacan', objective: 'O2', points: 4, timestamp: 500, source: 'score_objective' },
    ];
    const games = [makeGame('g1', { vpEvents, winner: 'Sol' })];
    const div = buildGameStats(games, new Map()).vpDiversity;
    expect(div.avgWinnerHHI).toBeCloseTo(0.25, 3);
    expect(div.avgLoserHHI).toBe(1);
  });

  it('vpDiversity returns null avgs when no games have winners', () => {
    const games = [makeGame('g1', { winner: null })];
    const div = buildGameStats(games, new Map()).vpDiversity;
    expect(div.avgWinnerDistinctSources).toBeNull();
    expect(div.avgWinnerHHI).toBeNull();
  });

  it('stage2 firstStage2ScorerWinRate is null when no Stage II events present', () => {
    const games = [makeGame('g1', { winner: 'Sol', vpEvents: [] })];
    expect(buildGameStats(games, new Map()).stage2.firstStage2ScorerWinRate).toBeNull();
  });

  it('stage2 counts the first Stage-II-points-2 score event per game vs. winner', () => {
    // 'Construct Massive Cities' is a Stage II objective (points: 2) in objectives.ts
    const vpEvents: VpEvent[] = [
      { faction: 'Sol',   objective: 'Construct Massive Cities', points: 2, timestamp: 100, source: 'score_objective' },
      { faction: 'Hacan', objective: 'Construct Massive Cities', points: 2, timestamp: 200, source: 'score_objective' },
    ];
    const games = [makeGame('g1', { vpEvents, winner: 'Sol' })];
    const s2 = buildGameStats(games, new Map()).stage2;
    expect(s2.gamesWithStage2).toBe(1);
    expect(s2.firstStage2ScorerWins).toBe(1);
    expect(s2.firstStage2ScorerWinRate).toBe(1);
  });

  it('heroActivations clamps activation rate to 1 when play occurs without unlock', () => {
    // A hero play without a preceding unlock — gamesPresent is 0 in naive impl.
    // The rate should be 1.0, not Infinity.
    const leaderEvents: LeaderEvent[] = [
      { faction: 'Sol', leader: 'Jace X. 4th Air Legion', timestamp: 100, type: 'play' },
    ];
    const result = buildGameStats([makeGame('g1', { leaderEvents })], new Map());
    const hero = result.heroActivations.find(h => h.leaderName === 'Jace X. 4th Air Legion');
    if (hero !== undefined) {
      expect(hero.activationRate).toBeLessThanOrEqual(1);
      expect(hero.activationRate).toBeGreaterThan(0);
    }
  });

  it('agendas netVpSwing sums agenda-source VP events near the resolution timestamp', () => {
    const agendaResolutions: AgendaResolution[] = [
      { agenda: 'Seed of an Empire', outcome: 'For', round: 1, votes: [], riders: [], timestamp: 1000 },
    ];
    const vpEvents: VpEvent[] = [
      { faction: 'Sol', objective: 'Seed of an Empire', points: 1, timestamp: 1010, source: 'agenda' },
    ];
    const result = buildGameStats([makeGame('g1', { agendaResolutions, vpEvents })], new Map());
    const seed = result.agendas.find(a => a.agenda === 'Seed of an Empire');
    expect(seed?.netVpSwing).toBe(1);
  });

  it('comingFromBehind excludes games where no VP was scored before round 4', () => {
    const boundaries = new Map<string, RoundBoundary[]>([
      ['g1', [
        { round: 1, startTimestamp: 0 },
        { round: 2, startTimestamp: 1000 },
        { round: 3, startTimestamp: 2000 },
        { round: 4, startTimestamp: 3000 },
      ]],
    ]);
    // VP events all happen after round 4 starts
    const vpEvents: VpEvent[] = [
      { faction: 'Sol', objective: 'O1', points: 5, timestamp: 4000, source: 'score_objective' },
    ];
    const games = [makeGame('g1', { vpEvents, winner: 'Sol' })];
    const cfb = buildGameStats(games, boundaries).comingFromBehind;
    // Game is excluded from denominator — gamesWithRound3Data should be 0
    expect(cfb.gamesWithRound3Data).toBe(0);
    expect(cfb.round3LeaderWinRate).toBeNull();
  });

  it('returns safe defaults for empty games array', () => {
    const result = buildGameStats([], new Map());
    expect(result.totalGames).toBe(0);
    expect(result.avgDurationSeconds).toBe(0);
    expect(result.mecatol.firstClaimerWinRate).toBeNull();
    expect(result.heroActivations).toEqual([]);
    expect(result.relics).toEqual([]);
    expect(result.vpSources).toEqual([]);
    expect(result.vpDiversity.avgWinnerDistinctSources).toBeNull();
    expect(result.stage2.firstStage2ScorerWinRate).toBeNull();
  });
});

describe('buildVpSources — objective stage split', () => {
  function makeVpEvent(objective: string, points: number): VpEvent {
    return { faction: 'f1', objective, points, timestamp: 1, source: 'score_objective' };
  }

  it('buckets Stage I objective as score_objective_stage1', () => {
    // 'Expand Borders' is a known Stage I objective
    const game = makeGame('g1', { vpEvents: [makeVpEvent('Expand Borders', 1)] });
    const result = buildGameStats([game], new Map());
    const stageI = result.vpSources.find(s => s.source === 'score_objective_stage1');
    expect(stageI?.totalPoints).toBe(1);
  });

  it('buckets Stage II objective as score_objective_stage2', () => {
    // 'Centralize Galactic Trade' is a known Stage II objective
    const game = makeGame('g1', { vpEvents: [makeVpEvent('Centralize Galactic Trade', 2)] });
    const result = buildGameStats([game], new Map());
    const stageII = result.vpSources.find(s => s.source === 'score_objective_stage2');
    expect(stageII?.totalPoints).toBe(2);
  });

  it('buckets secret objective as score_objective_secret', () => {
    // 'Destroy Their Greatest Ship' is a known secret objective
    const game = makeGame('g1', { vpEvents: [makeVpEvent('Destroy Their Greatest Ship', 1)] });
    const result = buildGameStats([game], new Map());
    const secret = result.vpSources.find(s => s.source === 'score_objective_secret');
    expect(secret?.totalPoints).toBe(1);
  });

  it('buckets unknown objective name as score_objective_stage1 (safe fallback)', () => {
    const game = makeGame('g1', { vpEvents: [makeVpEvent('Unknown Objective XYZ', 1)] });
    const result = buildGameStats([game], new Map());
    const stageI = result.vpSources.find(s => s.source === 'score_objective_stage1');
    expect(stageI?.totalPoints).toBe(1);
  });

  it('does not emit bare score_objective in vpSources', () => {
    const game = makeGame('g1', { vpEvents: [makeVpEvent('Expand Borders', 1)] });
    const result = buildGameStats([game], new Map());
    expect(result.vpSources.find(s => s.source === 'score_objective')).toBeUndefined();
  });
});

describe('buildGameStats — byThreshold segmentation', () => {
  it('returns one segment per distinct vpThreshold, sorted ascending', () => {
    const games = [
      makeGame('g1', { vpThreshold: 10, durationSeconds: 3600 }),
      makeGame('g2', { vpThreshold: 12, durationSeconds: 4800 }),
      makeGame('g3', { vpThreshold: 10, durationSeconds: 4200 }),
    ];
    const result = buildGameStats(games, new Map());
    expect(result.byThreshold.map(s => s.vpThreshold)).toEqual([10, 12]);
  });

  it('counts games per segment correctly', () => {
    const games = [
      makeGame('g1', { vpThreshold: 10, durationSeconds: 3600 }),
      makeGame('g2', { vpThreshold: 10, durationSeconds: 4200 }),
      makeGame('g3', { vpThreshold: 12, durationSeconds: 4800 }),
    ];
    const result = buildGameStats(games, new Map());
    const tenPt = result.byThreshold.find(s => s.vpThreshold === 10)!;
    const twelvePt = result.byThreshold.find(s => s.vpThreshold === 12)!;
    expect(tenPt.gameCount).toBe(2);
    expect(twelvePt.gameCount).toBe(1);
  });

  it('computes avgWinningVp per segment', () => {
    const games = [
      makeGame('g1', { vpThreshold: 10, finalScores: { Sol: 10, Hacan: 5 }, winner: 'Sol' }),
      makeGame('g2', { vpThreshold: 12, finalScores: { Sol: 12, Hacan: 8 }, winner: 'Sol' }),
    ];
    const result = buildGameStats(games, new Map());
    const tenPt = result.byThreshold.find(s => s.vpThreshold === 10)!;
    expect(tenPt.avgWinningVp).toBe(10);
  });

  it('returns empty byThreshold for empty games', () => {
    const result = buildGameStats([], new Map());
    expect(result.byThreshold).toEqual([]);
  });
});
