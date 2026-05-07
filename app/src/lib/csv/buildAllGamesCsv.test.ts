import { describe, it, expect } from 'vitest';
import { buildAllGamesCsv } from './buildAllGamesCsv';
import type { ParsedGame, FactionSetup } from '../parser/types';

function fac(factionId: string): FactionSetup {
  return { factionId, playerName: '', color: 'gray', mapPosition: 0, startingTechs: [], startingPlanets: [] };
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

describe('buildAllGamesCsv', () => {
  it('returns empty string for no games', () => {
    expect(buildAllGamesCsv([])).toBe('');
  });

  it('produces correct header row', () => {
    const game = makeGame({ factions: [fac('Sol')], finalScores: { Sol: 10 }, winner: 'Sol' });
    const csv = buildAllGamesCsv([game]);
    const header = csv.split('\n')[0]!;
    expect(header).toBe('GameId,Date,DurationMinutes,VPThreshold,FactionId,FinalVP,IsWinner');
  });

  it('outputs one data row per faction per game', () => {
    const game = makeGame({
      factions: [fac('Sol'), fac('Hacan')],
      finalScores: { Sol: 10, Hacan: 7 },
      winner: 'Sol',
    });
    const csv = buildAllGamesCsv([game]);
    const dataRows = csv.split('\n').slice(1);
    expect(dataRows).toHaveLength(2);
  });

  it('marks the winner correctly', () => {
    const game = makeGame({
      factions: [fac('Sol'), fac('Hacan')],
      finalScores: { Sol: 10, Hacan: 7 },
      winner: 'Sol',
    });
    const csv = buildAllGamesCsv([game]);
    const rows = csv.split('\n').slice(1);
    const solRow = rows.find(r => r.includes('Sol'));
    const hacanRow = rows.find(r => r.includes('Hacan'));
    expect(solRow).toContain('true');
    expect(hacanRow).toContain('false');
  });

  it('includes correct final VP per faction', () => {
    const game = makeGame({
      factions: [fac('Sol')],
      finalScores: { Sol: 8 },
      winner: 'Sol',
      vpThreshold: 10,
    });
    const csv = buildAllGamesCsv([game]);
    expect(csv).toContain('Sol,8,true');
  });

  it('formats duration in whole minutes', () => {
    const game = makeGame({
      factions: [fac('Sol')],
      finalScores: { Sol: 10 },
      winner: 'Sol',
      durationSeconds: 7260, // 121 minutes
    });
    const csv = buildAllGamesCsv([game]);
    expect(csv).toContain(',121,');
  });

  it('formats date from playedAt timestamp', () => {
    const game = makeGame({
      factions: [fac('Sol')],
      finalScores: { Sol: 10 },
      winner: 'Sol',
      playedAt: new Date('2025-01-11').getTime(),
    });
    const csv = buildAllGamesCsv([game]);
    expect(csv).toContain('2025-01-11');
  });

  it('spans multiple games with all rows present', () => {
    const g1 = makeGame({ gameId: 'g1', factions: [fac('Sol')], finalScores: { Sol: 10 }, winner: 'Sol' });
    const g2 = makeGame({ gameId: 'g2', factions: [fac('Hacan')], finalScores: { Hacan: 10 }, winner: 'Hacan' });
    const csv = buildAllGamesCsv([g1, g2]);
    const dataRows = csv.split('\n').slice(1);
    expect(dataRows).toHaveLength(2);
    expect(csv).toContain('g1');
    expect(csv).toContain('g2');
  });
});
