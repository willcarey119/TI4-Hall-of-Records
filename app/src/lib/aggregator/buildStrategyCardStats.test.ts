import { describe, it, expect } from 'vitest';
import { buildStrategyCardStats } from './buildStrategyCardStats';
import type { ParsedGame, StrategyCardEvent } from '../parser/types';
import type { RoundBoundary } from './deriveRoundBoundaries';

function makeGame(gameId: string, strategyCardEvents: StrategyCardEvent[]): ParsedGame {
  return {
    gameId, playedAt: 0, durationSeconds: 3600,
    factions: [
      { factionId: 'A', playerName: 'p', color: '#aaa', mapPosition: 0, startingTechs: [], startingPlanets: [] },
      { factionId: 'B', playerName: 'p', color: '#bbb', mapPosition: 1, startingTechs: [], startingPlanets: [] },
    ],
    options: {}, initialSpeaker: 'A',
    phaseSnapshots: [], vpEvents: [], planetEvents: [], techEvents: [],
    agendaResolutions: [], strategyCardEvents, actionCardEvents: [], componentEvents: [],
    relicEvents: [], leaderEvents: [], objectiveReveals: [], speakerEvents: [],
    attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: [],
    expeditionEvents: [], secondaryEvents: [], actionEvents: [],
    finalScores: {}, winner: null,
    timers: { game: 3600, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
  };
}

describe('buildStrategyCardStats', () => {
  it('returns empty summary for empty games', () => {
    const result = buildStrategyCardStats([], new Map());
    expect(result.cards).toEqual([]);
    expect(result.mostContested).toEqual([]);
  });

  it('totals picks across games and rounds', () => {
    const game = makeGame('g1', [
      { faction: 'A', card: 'Tech', timestamp: 100, type: 'pick' },
      { faction: 'B', card: 'Tech', timestamp: 200, type: 'pick' },
    ]);
    const boundaries = new Map<string, RoundBoundary[]>([['g1', [{ round: 1, startTimestamp: 100 }]]]);
    const result = buildStrategyCardStats([game], boundaries);
    const tech = result.cards.find(c => c.card === 'Tech');
    expect(tech?.totalPicks).toBe(2);
  });

  it('secondaryFollowRate is play / (play + pass)', () => {
    const game = makeGame('g1', [
      { faction: 'A', card: 'Tech', timestamp: 100, type: 'pick' },
      { faction: 'B', card: 'Tech', timestamp: 110, type: 'play_secondary' },
      { faction: 'A', card: 'Tech', timestamp: 120, type: 'play_secondary' },
      { faction: 'B', card: 'Tech', timestamp: 130, type: 'pass_secondary' },
    ]);
    const boundaries = new Map<string, RoundBoundary[]>([['g1', [{ round: 1, startTimestamp: 100 }]]]);
    const tech = buildStrategyCardStats([game], boundaries).cards.find(c => c.card === 'Tech');
    expect(tech?.secondaryFollowRate).toBeCloseTo(2 / 3, 5);
  });

  it('secondaryFollowRate is null when no secondary events exist', () => {
    const game = makeGame('g1', [
      { faction: 'A', card: 'Construction', timestamp: 100, type: 'pick' },
    ]);
    const boundaries = new Map<string, RoundBoundary[]>([['g1', [{ round: 1, startTimestamp: 100 }]]]);
    expect(buildStrategyCardStats([game], boundaries).cards[0]?.secondaryFollowRate).toBeNull();
  });

  it('avgPickPosition orders by timestamp within the same round', () => {
    const game = makeGame('g1', [
      { faction: 'A', card: 'Imperial', timestamp: 100, type: 'pick' },  // pos 1
      { faction: 'B', card: 'Tech',     timestamp: 200, type: 'pick' },  // pos 2
      { faction: 'A', card: 'Tech',     timestamp: 1000, type: 'pick' }, // pos 1 in round 2
      { faction: 'B', card: 'Imperial', timestamp: 1100, type: 'pick' }, // pos 2
    ]);
    const boundaries = new Map<string, RoundBoundary[]>([
      ['g1', [{ round: 1, startTimestamp: 100 }, { round: 2, startTimestamp: 1000 }]],
    ]);
    const result = buildStrategyCardStats([game], boundaries);
    const tech = result.cards.find(c => c.card === 'Tech');
    // Tech picked at pos 2 in r1, pos 1 in r2 → avg 1.5
    expect(tech?.avgPickPosition).toBeCloseTo(1.5, 5);
    expect(tech?.avgPickPositionByRound[1]).toBe(2);
    expect(tech?.avgPickPositionByRound[2]).toBe(1);
  });

  it('pickCountByRound buckets picks per round', () => {
    const game = makeGame('g1', [
      { faction: 'A', card: 'Tech', timestamp: 100, type: 'pick' },
      { faction: 'B', card: 'Tech', timestamp: 1000, type: 'pick' },
    ]);
    const boundaries = new Map<string, RoundBoundary[]>([
      ['g1', [{ round: 1, startTimestamp: 100 }, { round: 2, startTimestamp: 1000 }]],
    ]);
    const tech = buildStrategyCardStats([game], boundaries).cards.find(c => c.card === 'Tech');
    expect(tech?.pickCountByRound[1]).toBe(1);
    expect(tech?.pickCountByRound[2]).toBe(1);
  });

  it('mostContested orders by avgPickPosition asc', () => {
    const game = makeGame('g1', [
      { faction: 'A', card: 'Tech',     timestamp: 100, type: 'pick' }, // pos 1
      { faction: 'B', card: 'Politics', timestamp: 200, type: 'pick' }, // pos 2
    ]);
    const boundaries = new Map<string, RoundBoundary[]>([['g1', [{ round: 1, startTimestamp: 100 }]]]);
    expect(buildStrategyCardStats([game], boundaries).mostContested[0]).toBe('Tech');
  });
});
