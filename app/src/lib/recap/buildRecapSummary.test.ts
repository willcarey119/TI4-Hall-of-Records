import { describe, it, expect } from 'vitest';
import { buildRecapSummary } from './buildRecapSummary';
import type { ParsedGame, FactionSetup, PhaseSnapshot } from '../parser/types';

function makeFaction(id: string, playerName: string, color: string): FactionSetup {
  return { factionId: id, playerName, color, mapPosition: 0, startingTechs: [], startingPlanets: [] };
}

function makeGame(overrides: Partial<ParsedGame> = {}): ParsedGame {
  return {
    gameId: 'g1', playedAt: 0, durationSeconds: 21600,
    factions: [
      makeFaction('Sol', 'Tim', '#aaa'),
      makeFaction('Hacan', 'Jake', '#bbb'),
      makeFaction('Arborec', 'Steve', '#ccc'),
    ],
    options: { victoryPoints: 10 },
    initialSpeaker: 'Sol',
    phaseSnapshots: [
      { round: 1, phase: 'strategy', speaker: 'Sol' },
      { round: 2, phase: 'strategy', speaker: 'Hacan' },
      { round: 3, phase: 'strategy', speaker: 'Sol' },
    ] as PhaseSnapshot[],
    vpEvents: [], planetEvents: [], techEvents: [], agendaResolutions: [],
    strategyCardEvents: [], actionCardEvents: [], componentEvents: [], relicEvents: [],
    leaderEvents: [], objectiveReveals: [], speakerEvents: [], attachmentEvents: [],
    allianceEvents: [], promissoryNoteEvents: [], expeditionEvents: [],
    secondaryEvents: [], actionEvents: [],
    finalScores: { Sol: 10, Hacan: 8, Arborec: 5 },
    winner: 'Sol',
    timers: { game: 21600, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
    ...overrides,
  };
}

describe('buildRecapSummary', () => {
  it('winner has correct factionId and VP', () => {
    const recap = buildRecapSummary(makeGame());
    expect(recap.winner?.factionId).toBe('Sol');
    expect(recap.winner?.finalVp).toBe(10);
  });

  it('standings are sorted by VP descending', () => {
    const recap = buildRecapSummary(makeGame());
    expect(recap.standings.map(s => s.factionId)).toEqual(['Sol', 'Hacan', 'Arborec']);
  });

  it('standings ranks start at 1 and increment', () => {
    const recap = buildRecapSummary(makeGame());
    expect(recap.standings[0]?.rank).toBe(1);
    expect(recap.standings[1]?.rank).toBe(2);
    expect(recap.standings[2]?.rank).toBe(3);
  });

  it('isWinner is true only for the winner standing', () => {
    const recap = buildRecapSummary(makeGame());
    expect(recap.standings.filter(s => s.isWinner).map(s => s.factionId)).toEqual(['Sol']);
  });

  it('totalRounds is the max round in phaseSnapshots', () => {
    const recap = buildRecapSummary(makeGame());
    expect(recap.totalRounds).toBe(3);
  });

  it('totalRounds is 0 when phaseSnapshots is empty', () => {
    const recap = buildRecapSummary(makeGame({ phaseSnapshots: [] }));
    expect(recap.totalRounds).toBe(0);
  });

  it('vpMargin is winner VP minus nearest non-winner VP', () => {
    const recap = buildRecapSummary(makeGame());
    expect(recap.vpMargin).toBe(2); // 10 - 8
  });

  it('vpMargin is 0 when no winner', () => {
    const recap = buildRecapSummary(makeGame({ winner: null }));
    expect(recap.vpMargin).toBe(0);
  });

  it('winner is null when game has no winner', () => {
    const recap = buildRecapSummary(makeGame({ winner: null }));
    expect(recap.winner).toBeNull();
  });

  it('editorialHeadline contains uppercased faction name when winner exists', () => {
    const recap = buildRecapSummary(makeGame());
    expect(recap.editorialHeadline).toContain('SOL');
  });

  it('durationSeconds matches game durationSeconds', () => {
    const recap = buildRecapSummary(makeGame());
    expect(recap.durationSeconds).toBe(21600);
  });

  it('victoryPoints defaults to 10 when not in options', () => {
    const recap = buildRecapSummary(makeGame({ options: {} }));
    expect(recap.victoryPoints).toBe(10);
  });
});
