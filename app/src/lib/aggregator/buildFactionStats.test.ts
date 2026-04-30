import { describe, it, expect } from 'vitest';
import { buildFactionStats } from './buildFactionStats';
import type { ParsedGame, FactionSetup, VpEvent, PromissoryNoteEvent, AgendaResolution, StrategyCardEvent } from '../parser/types';

function makeFaction(id: string, mapPosition = 0): FactionSetup {
  return { factionId: id, playerName: 'p', color: '#aaa', mapPosition, startingTechs: [], startingPlanets: [] };
}

function makeGame(opts: {
  gameId: string;
  factions: string[];
  finalScores: Record<string, number>;
  winner: string | null;
  vpEvents?: VpEvent[];
  promissoryNoteEvents?: PromissoryNoteEvent[];
  agendaResolutions?: AgendaResolution[];
  strategyCardEvents?: StrategyCardEvent[];
}): ParsedGame {
  return {
    gameId: opts.gameId, playedAt: 0, durationSeconds: 3600,
    factions: opts.factions.map((id, i) => makeFaction(id, i)),
    options: { victoryPoints: 10 },
    initialSpeaker: opts.factions[0] ?? '',
    phaseSnapshots: [], vpEvents: opts.vpEvents ?? [], planetEvents: [], techEvents: [],
    agendaResolutions: opts.agendaResolutions ?? [], strategyCardEvents: opts.strategyCardEvents ?? [], actionCardEvents: [], componentEvents: [],
    relicEvents: [], leaderEvents: [], objectiveReveals: [], speakerEvents: [],
    attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: opts.promissoryNoteEvents ?? [],
    expeditionEvents: [], secondaryEvents: [], actionEvents: [],
    finalScores: opts.finalScores, winner: opts.winner,
    timers: { game: 3600, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
  };
}

/**
 * Helper: build N strategy-card pick events per round, evenly spaced, so that
 * deriveRoundBoundaries() yields a boundary at the start of each round.
 */
function makeRoundPicks(factions: string[], rounds: number): StrategyCardEvent[] {
  const events: StrategyCardEvent[] = [];
  for (let r = 1; r <= rounds; r++) {
    factions.forEach((id, i) => {
      events.push({ faction: id, card: `R${r}-pick-${i}`, timestamp: r * 1000 + i, type: 'pick' });
    });
  }
  return events;
}

describe('buildFactionStats', () => {
  it('returns empty summary for empty games array', () => {
    const result = buildFactionStats([]);
    expect(result.totalGames).toBe(0);
    expect(result.factions).toEqual([]);
    expect(result.sftTransfers).toEqual([]);
  });

  it('counts gamesPlayed and wins per faction', () => {
    const games = [
      makeGame({ gameId: 'g1', factions: ['Sol', 'Hacan'], finalScores: { Sol: 10, Hacan: 7 }, winner: 'Sol' }),
      makeGame({ gameId: 'g2', factions: ['Sol', 'Hacan'], finalScores: { Sol: 10, Hacan: 6 }, winner: 'Sol' }),
    ];
    const result = buildFactionStats(games);
    const sol = result.factions.find(f => f.factionId === 'Sol');
    expect(sol?.gamesPlayed).toBe(2);
    expect(sol?.wins).toBe(2);
    expect(sol?.winRate).toBe(1);
  });

  it('winRate is 0 when faction never won', () => {
    const games = [
      makeGame({ gameId: 'g1', factions: ['Sol', 'Hacan'], finalScores: { Sol: 5, Hacan: 10 }, winner: 'Hacan' }),
    ];
    const sol = buildFactionStats(games).factions.find(f => f.factionId === 'Sol');
    expect(sol?.winRate).toBe(0);
  });

  it('avgFinalVp averages finalScores across games', () => {
    const games = [
      makeGame({ gameId: 'g1', factions: ['Sol'], finalScores: { Sol: 10 }, winner: 'Sol' }),
      makeGame({ gameId: 'g2', factions: ['Sol'], finalScores: { Sol: 6 }, winner: null }),
    ];
    const sol = buildFactionStats(games).factions.find(f => f.factionId === 'Sol');
    expect(sol?.avgFinalVp).toBe(8);
  });

  it('orders factions by winRate desc, then gamesPlayed desc', () => {
    const games = [
      makeGame({ gameId: 'g1', factions: ['A', 'B'], finalScores: { A: 10, B: 5 }, winner: 'A' }),
      makeGame({ gameId: 'g2', factions: ['A', 'B'], finalScores: { A: 5, B: 10 }, winner: 'B' }),
      makeGame({ gameId: 'g3', factions: ['C'], finalScores: { C: 10 }, winner: 'C' }),
    ];
    const result = buildFactionStats(games);
    expect(result.factions[0]?.factionId).toBe('C'); // 100% win rate
    expect(result.factions[0]?.gamesPlayed).toBe(1);
  });

  it('sftTransfers records Support for the Throne play events', () => {
    const games = [
      makeGame({
        gameId: 'g1', factions: ['Sol', 'Hacan'], finalScores: { Sol: 10, Hacan: 5 }, winner: 'Sol',
        promissoryNoteEvents: [
          { fromFaction: 'Sol', toFaction: 'Hacan', note: 'Support for the Throne', timestamp: 100, type: 'play' },
          { fromFaction: 'Sol', toFaction: 'Hacan', note: 'Trade Agreement',        timestamp: 200, type: 'play' },
        ],
      }),
    ];
    const result = buildFactionStats(games);
    expect(result.sftTransfers).toEqual([{ fromFaction: 'Sol', toFaction: 'Hacan', count: 1 }]);
  });

  it('counts an SFT transfer once per game even if played multiple times', () => {
    const games = [
      makeGame({
        gameId: 'g1', factions: ['Sol', 'Hacan'], finalScores: { Sol: 10, Hacan: 5 }, winner: 'Sol',
        promissoryNoteEvents: [
          { fromFaction: 'Sol', toFaction: 'Hacan', note: 'Support for the Throne', timestamp: 100, type: 'play' },
          { fromFaction: 'Sol', toFaction: 'Hacan', note: 'Support for the Throne', timestamp: 200, type: 'play' },
        ],
      }),
    ];
    expect(buildFactionStats(games).sftTransfers[0]?.count).toBe(1);
  });

  it('attaches expansion tag to each faction', () => {
    const games = [makeGame({ gameId: 'g1', factions: ['Federation of Sol'], finalScores: { 'Federation of Sol': 10 }, winner: 'Federation of Sol' })];
    expect(buildFactionStats(games).factions[0]?.expansion).toBe('base');
  });

  it('winningVoteRate counts votes that match the resolved outcome', () => {
    const agendaResolutions: AgendaResolution[] = [
      {
        agenda: 'Mutiny', outcome: 'For', round: 2, timestamp: 1000,
        votes: [
          { faction: 'Sol',   outcome: 'For',     votes: 4 },  // matched
          { faction: 'Hacan', outcome: 'Against', votes: 2 },  // not matched
        ],
        riders: [],
      },
      {
        agenda: 'Classified Document Leaks', outcome: 'Against', round: 3, timestamp: 2000,
        votes: [
          { faction: 'Sol',   outcome: 'Against', votes: 3 },  // matched
          { faction: 'Hacan', outcome: 'Against', votes: 5 },  // matched
        ],
        riders: [],
      },
    ];
    const games = [makeGame({
      gameId: 'g1', factions: ['Sol', 'Hacan'],
      finalScores: { Sol: 10, Hacan: 5 }, winner: 'Sol',
      agendaResolutions,
    })];
    const stats = buildFactionStats(games).factions;
    expect(stats.find(f => f.factionId === 'Sol')?.winningVoteRate).toBe(1);    // 2/2
    expect(stats.find(f => f.factionId === 'Hacan')?.winningVoteRate).toBe(0.5); // 1/2
  });

  it('winningVoteRate is null when faction never voted on a binary outcome', () => {
    const agendaResolutions: AgendaResolution[] = [
      // Elect-type outcome: 'Mecatol Rex' is neither 'For' nor 'Against' — votes still counted iff vote.outcome matches
      { agenda: 'Holy Planet of Ixth', outcome: 'Mecatol Rex', round: 2, timestamp: 1000,
        votes: [{ faction: 'Sol', outcome: 'Mecatol Rex', votes: 2 }], riders: [] },
    ];
    const games = [makeGame({
      gameId: 'g1', factions: ['Sol', 'Hacan'],
      finalScores: { Sol: 10, Hacan: 5 }, winner: 'Sol',
      agendaResolutions,
    })];
    const stats = buildFactionStats(games).factions;
    // Sol voted for the elected outcome — counts as winning vote (1/1)
    expect(stats.find(f => f.factionId === 'Sol')?.winningVoteRate).toBe(1);
    // Hacan never cast a vote — null
    expect(stats.find(f => f.factionId === 'Hacan')?.winningVoteRate).toBeNull();
  });

  describe('avgVpPerRound', () => {
    it('is non-empty for a faction whose game has vpEvents and strategyCardEvents', () => {
      const games = [makeGame({
        gameId: 'g1', factions: ['Sol', 'Hacan'],
        finalScores: { Sol: 4, Hacan: 2 }, winner: null,
        strategyCardEvents: makeRoundPicks(['Sol', 'Hacan'], 3),
        // Sol scores in rounds 1,2,3; Hacan scores in rounds 2,3.
        vpEvents: [
          { faction: 'Sol',   objective: 'O1', points: 1, timestamp: 1500, source: 'score_objective' },
          { faction: 'Sol',   objective: 'O2', points: 2, timestamp: 2500, source: 'score_objective' },
          { faction: 'Sol',   objective: 'O3', points: 1, timestamp: 3500, source: 'score_objective' },
          { faction: 'Hacan', objective: 'O1', points: 1, timestamp: 2500, source: 'score_objective' },
          { faction: 'Hacan', objective: 'O2', points: 1, timestamp: 3500, source: 'score_objective' },
        ],
      })];
      const stats = buildFactionStats(games).factions;
      const sol = stats.find(f => f.factionId === 'Sol');
      expect(sol?.avgVpPerRound.length).toBeGreaterThan(0);
    });

    it('values are monotonically non-decreasing within a single game (cumulative VP)', () => {
      const games = [makeGame({
        gameId: 'g1', factions: ['Sol'],
        finalScores: { Sol: 5 }, winner: null,
        strategyCardEvents: makeRoundPicks(['Sol'], 4),
        vpEvents: [
          { faction: 'Sol', objective: 'O1', points: 2, timestamp: 1500, source: 'score_objective' }, // R1: 2
          { faction: 'Sol', objective: 'O2', points: 1, timestamp: 2500, source: 'score_objective' }, // R2: 3
          { faction: 'Sol', objective: 'O3', points: 1, timestamp: 3500, source: 'score_objective' }, // R3: 4
          { faction: 'Sol', objective: 'O4', points: 1, timestamp: 4500, source: 'score_objective' }, // R4: 5
        ],
      })];
      const sol = buildFactionStats(games).factions.find(f => f.factionId === 'Sol');
      const arr = sol?.avgVpPerRound ?? [];
      expect(arr).toEqual([2, 3, 4, 5]);
      for (let i = 1; i < arr.length; i++) {
        expect(arr[i]).toBeGreaterThanOrEqual(arr[i - 1] ?? 0);
      }
    });

    it('semantic (A): mean only includes games that reached round N', () => {
      // Two games. Sol plays both. g1 reaches 3 rounds; g2 reaches 2 rounds.
      // g1 cumulative (Sol): R1=2, R2=4, R3=6
      // g2 cumulative (Sol): R1=1, R2=3
      // Expected mean (semantic A): R1=(2+1)/2=1.5, R2=(4+3)/2=3.5, R3=6/1=6
      const games = [
        makeGame({
          gameId: 'g1', factions: ['Sol'],
          finalScores: { Sol: 6 }, winner: 'Sol',
          strategyCardEvents: makeRoundPicks(['Sol'], 3),
          vpEvents: [
            { faction: 'Sol', objective: 'O1', points: 2, timestamp: 1500, source: 'score_objective' },
            { faction: 'Sol', objective: 'O2', points: 2, timestamp: 2500, source: 'score_objective' },
            { faction: 'Sol', objective: 'O3', points: 2, timestamp: 3500, source: 'score_objective' },
          ],
        }),
        makeGame({
          gameId: 'g2', factions: ['Sol'],
          finalScores: { Sol: 3 }, winner: null,
          strategyCardEvents: makeRoundPicks(['Sol'], 2),
          vpEvents: [
            { faction: 'Sol', objective: 'O1', points: 1, timestamp: 1500, source: 'score_objective' },
            { faction: 'Sol', objective: 'O2', points: 2, timestamp: 2500, source: 'score_objective' },
          ],
        }),
      ];
      const sol = buildFactionStats(games).factions.find(f => f.factionId === 'Sol');
      expect(sol?.avgVpPerRound).toEqual([1.5, 3.5, 6]);
    });

    it('faction without strategy card picks (no derivable rounds) gets empty array', () => {
      const games = [makeGame({
        gameId: 'g1', factions: ['Sol'],
        finalScores: { Sol: 0 }, winner: null,
        // no strategyCardEvents → deriveRoundBoundaries returns []
        vpEvents: [],
      })];
      const sol = buildFactionStats(games).factions.find(f => f.factionId === 'Sol');
      expect(sol?.avgVpPerRound).toEqual([]);
    });

    it('handles a faction that did not play in some games', () => {
      // Sol plays both games; Hacan only plays g2.
      const games = [
        makeGame({
          gameId: 'g1', factions: ['Sol'],
          finalScores: { Sol: 4 }, winner: null,
          strategyCardEvents: makeRoundPicks(['Sol'], 2),
          vpEvents: [
            { faction: 'Sol', objective: 'O1', points: 2, timestamp: 1500, source: 'score_objective' },
            { faction: 'Sol', objective: 'O2', points: 2, timestamp: 2500, source: 'score_objective' },
          ],
        }),
        makeGame({
          gameId: 'g2', factions: ['Sol', 'Hacan'],
          finalScores: { Sol: 1, Hacan: 3 }, winner: null,
          strategyCardEvents: makeRoundPicks(['Sol', 'Hacan'], 2),
          vpEvents: [
            { faction: 'Sol',   objective: 'O1', points: 1, timestamp: 1500, source: 'score_objective' },
            { faction: 'Hacan', objective: 'O1', points: 1, timestamp: 1500, source: 'score_objective' },
            { faction: 'Hacan', objective: 'O2', points: 2, timestamp: 2500, source: 'score_objective' },
          ],
        }),
      ];
      const factions = buildFactionStats(games).factions;
      const hacan = factions.find(f => f.factionId === 'Hacan');
      // Hacan only in g2: R1=1, R2=3
      expect(hacan?.avgVpPerRound).toEqual([1, 3]);
      const sol = factions.find(f => f.factionId === 'Sol');
      // Sol in both: R1=(2+1)/2=1.5, R2=(4+1)/2=2.5
      expect(sol?.avgVpPerRound).toEqual([1.5, 2.5]);
    });
  });
});
