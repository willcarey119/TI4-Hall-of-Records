import { describe, it, expect } from 'vitest';
import { buildFactionStrategyHeatmap } from './StrategyCardSection';
import { buildFactionAverageVpPace } from './ScoringPaceSection';
import type { ParsedGame, FactionSetup, StrategyCardEvent } from '../../lib/parser/types';

function fac(factionId: string): FactionSetup {
  return {
    factionId,
    playerName: '',
    color: 'gray',
    mapPosition: 0,
    startingTechs: [],
    startingPlanets: [],
  };
}

function makeGame(overrides: Partial<ParsedGame>): ParsedGame {
  return {
    gameId: 'g',
    playedAt: 0,
    durationSeconds: 0,
    factions: [],
    options: {},
    vpThreshold: 10,
    initialSpeaker: '',
    phaseSnapshots: [],
    vpEvents: [],
    planetEvents: [],
    techEvents: [],
    agendaResolutions: [],
    strategyCardEvents: [],
    actionCardEvents: [],
    componentEvents: [],
    relicEvents: [],
    leaderEvents: [],
    objectiveReveals: [],
    speakerEvents: [],
    attachmentEvents: [],
    allianceEvents: [],
    promissoryNoteEvents: [],
    expeditionEvents: [],
    secondaryEvents: [],
    actionEvents: [],
    finalScores: {},
    winner: null,
    timers: { factionTimers: {} } as ParsedGame['timers'],
    warnings: [],
    ...overrides,
  };
}

function pick(faction: string, card: string, ts: number): StrategyCardEvent {
  return { faction, card, timestamp: ts, type: 'pick' };
}

describe('buildFactionStrategyHeatmap', () => {
  it('returns 8 columns and sorted row labels', () => {
    const game = makeGame({
      factions: [fac('Sol'), fac('Hacan')],
      strategyCardEvents: [pick('Sol', 'Imperial', 1), pick('Hacan', 'Trade', 2)],
    });
    const out = buildFactionStrategyHeatmap([game]);
    expect(out.colLabels).toHaveLength(8);
    expect(out.colLabels).toContain('Imperial');
    expect(out.rowLabels).toEqual(['Hacan', 'Sol']);
    expect(out.rates).toHaveLength(2);
  });

  it('rates are 0–1 reflecting share of total faction picks', () => {
    const game = makeGame({
      factions: [fac('Sol')],
      strategyCardEvents: [pick('Sol', 'Imperial', 1)],
    });
    const out = buildFactionStrategyHeatmap([game]);
    const solIdx = out.rowLabels.indexOf('Sol');
    const impIdx = out.colLabels.indexOf('Imperial');
    expect(out.rates[solIdx]?.[impIdx]).toBe(1);   // 1 of 1 total picks = 100%
    const tradeIdx = out.colLabels.indexOf('Trade');
    expect(out.rates[solIdx]?.[tradeIdx]).toBe(0); // never picked
  });

  it('most-picked card has higher rate than others in the same row', () => {
    const game = makeGame({
      factions: [fac('Sol')],
      strategyCardEvents: [
        pick('Sol', 'Imperial', 1),
        pick('Sol', 'Imperial', 2),
        pick('Sol', 'Trade', 3),
      ],
    });
    const out = buildFactionStrategyHeatmap([game]);
    const solIdx = out.rowLabels.indexOf('Sol');
    const impIdx = out.colLabels.indexOf('Imperial');
    const tradeIdx = out.colLabels.indexOf('Trade');
    expect(out.rates[solIdx]?.[impIdx]).toBeGreaterThan(out.rates[solIdx]?.[tradeIdx] ?? 0);
  });

  it('shows percentage cell labels and pick-count tooltips', () => {
    const game = makeGame({
      factions: [fac('Sol')],
      strategyCardEvents: [pick('Sol', 'Imperial', 1)],
    });
    const out = buildFactionStrategyHeatmap([game]);
    const solIdx = out.rowLabels.indexOf('Sol');
    const impIdx = out.colLabels.indexOf('Imperial');
    expect(out.cellLabels[solIdx]?.[impIdx]).toBe('100%');
    expect(out.tooltips[solIdx]?.[impIdx]).toContain('Imperial');
    expect(out.tooltips[solIdx]?.[impIdx]).toContain('1 of 1');
  });

  it('shows empty string cell label for cards never picked', () => {
    const game = makeGame({
      factions: [fac('Sol')],
      strategyCardEvents: [],
    });
    const out = buildFactionStrategyHeatmap([game]);
    const solIdx = out.rowLabels.indexOf('Sol');
    const impIdx = out.colLabels.indexOf('Imperial');
    expect(out.cellLabels[solIdx]?.[impIdx]).toBe('');
  });

  it('tracks games played per faction for n=1 flagging', () => {
    const game = makeGame({ factions: [fac('Sol')], strategyCardEvents: [] });
    const out = buildFactionStrategyHeatmap([game]);
    const solIdx = out.rowLabels.indexOf('Sol');
    expect(out.gamesPlayed[solIdx]).toBe(1);
  });

  it('normalizes rates correctly: picks / total faction picks', () => {
    const game1 = makeGame({ gameId: 'g1', factions: [fac('Sol')], strategyCardEvents: [pick('Sol', 'Imperial', 1)] });
    const game2 = makeGame({ gameId: 'g2', factions: [fac('Sol')], strategyCardEvents: [pick('Sol', 'Trade', 2)] });
    const out = buildFactionStrategyHeatmap([game1, game2]);
    const solIdx = out.rowLabels.indexOf('Sol');
    const impIdx = out.colLabels.indexOf('Imperial');
    expect(out.rates[solIdx]?.[impIdx]).toBe(0.5);       // 1 Imperial of 2 total picks = 50%
    expect(out.cellLabels[solIdx]?.[impIdx]).toBe('50%');
    expect(out.gamesPlayed[solIdx]).toBe(2);
  });
});

describe('buildFactionAverageVpPace', () => {
  it('returns empty for zero games', () => {
    expect(buildFactionAverageVpPace([])).toEqual([]);
  });

  it('returns empty when games have no round boundaries', () => {
    const game = makeGame({ factions: [fac('Sol')] });
    expect(buildFactionAverageVpPace([game])).toEqual([]);
  });
});
