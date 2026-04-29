import { describe, it, expect } from 'vitest';
import { buildSpeakerStats } from './buildSpeakerStats';
import type { ParsedGame } from '../parser/types';

function makeGame(overrides: Partial<ParsedGame>): ParsedGame {
  return {
    gameId: 'g1', playedAt: 0, durationSeconds: 3600,
    factions: [
      { factionId: 'Sol', playerName: 'p1', color: 'blue', mapPosition: 0, startingTechs: [], startingPlanets: [] },
      { factionId: 'Hacan', playerName: 'p2', color: 'yellow', mapPosition: 1, startingTechs: [], startingPlanets: [] },
    ],
    options: {}, initialSpeaker: 'Sol',
    phaseSnapshots: [
      { round: 1, phase: 'Strategy', speaker: 'Sol', strategyCards: {} },
      { round: 2, phase: 'Strategy', speaker: 'Hacan', strategyCards: {} },
    ],
    vpEvents: [], planetEvents: [], techEvents: [], agendaResolutions: [],
    strategyCardEvents: [], actionCardEvents: [], componentEvents: [],
    relicEvents: [], leaderEvents: [], objectiveReveals: [], speakerEvents: [],
    attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: [],
    expeditionEvents: [], secondaryEvents: [], actionEvents: [],
    finalScores: { Sol: 10, Hacan: 6 }, winner: 'Sol',
    timers: { game: 3600, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
    ...overrides,
  } as ParsedGame;
}

describe('buildSpeakerStats', () => {
  it('returns zeros for empty games array', () => {
    const r = buildSpeakerStats([]);
    expect(r.gamesAnalyzed).toBe(0);
    expect(r.initialSpeakerWinRate).toBe(0);
  });

  it('counts initial speaker win when winner matches initialSpeaker', () => {
    const r = buildSpeakerStats([makeGame({ winner: 'Sol', initialSpeaker: 'Sol' })]);
    expect(r.initialSpeakerWinCount).toBe(1);
    expect(r.initialSpeakerWinRate).toBe(1);
  });

  it('does not count initial speaker win when winner differs', () => {
    const r = buildSpeakerStats([makeGame({ winner: 'Hacan', initialSpeaker: 'Sol' })]);
    expect(r.initialSpeakerWinCount).toBe(0);
    expect(r.initialSpeakerWinRate).toBe(0);
  });

  it('excludes games with no winner', () => {
    const r = buildSpeakerStats([makeGame({ winner: null })]);
    expect(r.gamesAnalyzed).toBe(0);
  });

  it('computes winner rounds as speaker correctly', () => {
    const game = makeGame({
      winner: 'Sol',
      phaseSnapshots: [
        { round: 1, phase: 'Strategy', speaker: 'Sol', strategyCards: {} },
        { round: 2, phase: 'Strategy', speaker: 'Sol', strategyCards: {} },
        { round: 3, phase: 'Strategy', speaker: 'Hacan', strategyCards: {} },
      ],
    });
    const r = buildSpeakerStats([game]);
    expect(r.avgRoundsAsSpeakerWinner).toBe(2);
  });

  it('computes non-winner rounds as speaker correctly', () => {
    // Sol wins. Hacan was speaker in round 2, nowhere else.
    // nonWinnerFactionRoundPairs = 1 game × 1 non-winner faction = 1
    // totalNonWinnerRounds = 1 (Hacan was speaker in round 2)
    // avgRoundsAsSpeakerNonWinner = 1 / 1 = 1
    const game = makeGame({
      winner: 'Sol',
      phaseSnapshots: [
        { round: 1, phase: 'Strategy', speaker: 'Sol', strategyCards: {} },
        { round: 2, phase: 'Strategy', speaker: 'Hacan', strategyCards: {} },
      ],
    });
    const r = buildSpeakerStats([game]);
    expect(r.avgRoundsAsSpeakerNonWinner).toBe(1);
  });
});
