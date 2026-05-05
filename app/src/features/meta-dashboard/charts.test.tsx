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
    expect(out.values).toHaveLength(2);
  });

  it('normalizes values to 0..1', () => {
    const game = makeGame({
      factions: [fac('Sol')],
      strategyCardEvents: [pick('Sol', 'Imperial', 1)],
    });
    const out = buildFactionStrategyHeatmap([game]);
    const flat = out.values.flat();
    for (const v of flat) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
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
