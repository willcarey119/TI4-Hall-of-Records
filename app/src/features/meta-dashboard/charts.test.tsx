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
  it('returns 8 columns labeled with strategy cards', () => {
    const game = makeGame({
      factions: [fac('Sol'), fac('Hacan')],
      strategyCardEvents: [pick('Sol', 'Imperial', 1), pick('Hacan', 'Trade', 2)],
    });
    const out = buildFactionStrategyHeatmap([game]);
    expect(out.colLabels).toHaveLength(8);
    expect(out.colLabels).toContain('Imperial');
    expect(out.rowLabels).toEqual(['Hacan', 'Sol']);
    expect(out.ranks).toHaveLength(2);
  });

  it('ranks are unique integers 1..8 per row (ordinal, no ties)', () => {
    const game = makeGame({
      factions: [fac('Sol')],
      strategyCardEvents: [pick('Sol', 'Imperial', 1)],
    });
    const out = buildFactionStrategyHeatmap([game]);
    const solIdx = out.rowLabels.indexOf('Sol');
    const row = out.ranks[solIdx]!.slice().sort((a, b) => a - b);
    expect(row).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('gives rank 1 to the most-picked card and higher rank to others', () => {
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
    expect(out.ranks[solIdx]?.[impIdx]).toBe(1);
    expect(out.ranks[solIdx]?.[tradeIdx]).toBeGreaterThan(1);
  });

  it('includes rank tooltips with pick counts', () => {
    const game = makeGame({
      factions: [fac('Sol')],
      strategyCardEvents: [pick('Sol', 'Imperial', 1)],
    });
    const out = buildFactionStrategyHeatmap([game]);
    const solIdx = out.rowLabels.indexOf('Sol');
    const impIdx = out.colLabels.indexOf('Imperial');
    expect(out.tooltips[solIdx]?.[impIdx]).toContain('#1');
    expect(out.tooltips[solIdx]?.[impIdx]).toContain('Imperial');
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
