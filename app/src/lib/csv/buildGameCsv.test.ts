import { describe, it, expect } from 'vitest';
import { buildGameCsv } from './buildGameCsv';
import type { ParsedGame, FactionSetup } from '../parser/types';
import type { RoundBoundary } from '../aggregator/deriveRoundBoundaries';

function fac(factionId: string, mapPosition: number): FactionSetup {
  return { factionId, playerName: '', color: 'gray', mapPosition, startingTechs: [], startingPlanets: [] };
}

function makeGame(overrides: Partial<ParsedGame>): ParsedGame {
  return {
    gameId: 'g1', playedAt: 0, durationSeconds: 0,
    factions: [], options: {}, vpThreshold: 10, initialSpeaker: '',
    phaseSnapshots: [], vpEvents: [], planetEvents: [], techEvents: [],
    agendaResolutions: [], strategyCardEvents: [], actionCardEvents: [],
    componentEvents: [], relicEvents: [], leaderEvents: [], objectiveReveals: [],
    speakerEvents: [], attachmentEvents: [], allianceEvents: [],
    promissoryNoteEvents: [], expeditionEvents: [], secondaryEvents: [],
    actionEvents: [], finalScores: {}, winner: null,
    timers: { factionTimers: {} } as ParsedGame['timers'],
    warnings: [],
    ...overrides,
  };
}

function boundary(round: number, startTimestamp: number): RoundBoundary {
  return { round, startTimestamp };
}

describe('buildGameCsv', () => {
  it('produces a header row with factions sorted by mapPosition', () => {
    const game = makeGame({
      factions: [fac('Sol', 2), fac('Hacan', 1)],
      finalScores: { Sol: 5, Hacan: 3 },
    });
    const csv = buildGameCsv(game, []);
    const header = csv.split('\n')[0]!;
    expect(header).toBe('Faction,FinalVP');
    const rows = csv.split('\n').slice(1);
    // Hacan is mapPosition 1, Sol is 2 — Hacan appears first
    expect(rows[0]).toContain('Hacan');
    expect(rows[1]).toContain('Sol');
  });

  it('fallback (no round boundaries): outputs faction + final VP rows', () => {
    const game = makeGame({
      factions: [fac('Sol', 1), fac('Hacan', 2)],
      finalScores: { Sol: 10, Hacan: 7 },
    });
    const csv = buildGameCsv(game, []);
    expect(csv).toContain('Sol,10');
    expect(csv).toContain('Hacan,7');
  });

  it('with round boundaries: header is Round then factions by mapPosition', () => {
    const game = makeGame({
      factions: [fac('Sol', 1), fac('Hacan', 2)],
      vpEvents: [],
      finalScores: { Sol: 0, Hacan: 0 },
    });
    const bounds = [boundary(1, 0), boundary(2, 100)];
    const csv = buildGameCsv(game, bounds);
    const header = csv.split('\n')[0]!;
    expect(header).toBe('Round,Sol,Hacan');
  });

  it('with round boundaries: includes one row per round plus round-0 anchor', () => {
    const game = makeGame({
      factions: [fac('Sol', 1)],
      vpEvents: [{ faction: 'Sol', objective: 'obj', points: 3, timestamp: 50, source: 'objective' }],
      finalScores: { Sol: 3 },
    });
    const bounds = [boundary(1, 0), boundary(2, 100)];
    const csv = buildGameCsv(game, bounds);
    const rows = csv.split('\n');
    expect(rows[1]).toBe('0,0');    // round 0 anchor
    expect(rows[2]).toBe('1,3');    // round 1: Sol scored 3 VP
  });

  it('cumulative VP increases across rounds', () => {
    const game = makeGame({
      factions: [fac('Sol', 1)],
      vpEvents: [
        { faction: 'Sol', objective: 'obj1', points: 2, timestamp: 50, source: 'objective' },
        { faction: 'Sol', objective: 'obj2', points: 3, timestamp: 150, source: 'objective' },
      ],
      finalScores: { Sol: 5 },
    });
    const bounds = [boundary(1, 0), boundary(2, 100), boundary(3, 200)];
    const csv = buildGameCsv(game, bounds);
    const rows = csv.split('\n');
    expect(rows[2]).toBe('1,2');  // end of round 1: 2 VP
    expect(rows[3]).toBe('2,5');  // end of round 2: 5 VP cumulative
  });

  it('handles multiple factions with correct column alignment', () => {
    const game = makeGame({
      factions: [fac('Sol', 1), fac('Hacan', 2)],
      vpEvents: [
        { faction: 'Sol', objective: 'obj', points: 2, timestamp: 50, source: 'objective' },
        { faction: 'Hacan', objective: 'obj2', points: 1, timestamp: 60, source: 'objective' },
      ],
      finalScores: { Sol: 2, Hacan: 1 },
    });
    const bounds = [boundary(1, 0), boundary(2, 100)];
    const csv = buildGameCsv(game, bounds);
    const rows = csv.split('\n');
    expect(rows[2]).toBe('1,2,1');  // round 1: Sol=2, Hacan=1
  });
});
