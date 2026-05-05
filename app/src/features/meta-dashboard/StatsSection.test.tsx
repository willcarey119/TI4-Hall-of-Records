import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  StatsSection,
  buildGameLengthHistogram,
  buildFinalVpHistogram,
  buildWinsByFaction,
} from './StatsSection';
import type { MetaState } from './MetaContext';
import type { RelicStatsSummary } from '../../lib/aggregator';
import type { ParsedGame } from '../../lib/parser/types';

// Mock useMeta so we can inject a deterministic state for the relic
// performance panel (the only thing this test exercises).
vi.mock('./MetaContext', () => ({
  useMeta: () => mockState,
}));

let mockState: MetaState;

function makeRelicStats(): RelicStatsSummary {
  return {
    totalGames: 3,
    gamesWithRelicVp: 2,
    relics: [
      {
        relic: 'Shard of the Throne',
        gainCount: 2,
        playCount: 0,
        grantsVp: true,
        topFactions: [{ factionId: 'Sol', gainCount: 2 }],
      },
      {
        relic: 'The Crown of Emphidia',
        gainCount: 1,
        playCount: 1,
        grantsVp: true,
        topFactions: [{ factionId: 'Hacan', gainCount: 1 }],
      },
      {
        relic: 'Stellar Converter',
        gainCount: 1,
        playCount: 0,
        grantsVp: false,
        topFactions: [{ factionId: 'Letnev', gainCount: 1 }],
      },
    ],
  };
}

// Minimal gameStats stub — every field StatsSection reads from gameStats has
// to exist or the component crashes before reaching the Relic Performance panel.
function makeGameStatsStub(): MetaState['gameStats'] {
  return {
    totalGames: 3,
    avgDurationSeconds: 0,
    avgWinningVp: null,
    avgPlayersPerGame: 0,
    mecatol: { firstClaimerWinRate: null, avgFirstClaimRound: null, avgTurnover: 0 },
    actionTypes: {
      tacticalPct: null, componentPct: null, passPct: null,
      topTacticalFactions: [], topComponentFactions: [],
    },
    vpSources: [],
    vpDiversity: {
      avgWinnerDistinctSources: null, avgLoserDistinctSources: null,
      avgWinnerHHI: null, avgLoserHHI: null,
    },
    comingFromBehind: {
      gamesWithRound3Data: 0, decidedGames: 0, round3LeaderWinRate: null,
    },
    stage2: {
      gamesWithStage2: 0, firstStage2ScorerWins: 0, firstStage2ScorerWinRate: null,
    },
    byThreshold: [],
    imperialMecatol: { totalActivations: 0, scoredVp: 0, contestedAway: 0, noMecatol: 0 },
    objectiveTiming: { avgVpPerRound: {} },
    heroActivations: [],
    relics: [],
    agendas: [],
  } as unknown as MetaState['gameStats'];
}

describe('StatsSection · VP Source Breakdown', () => {
  it('shows raw VP count alongside percent for each source (B4: rider/SFT 0% transparency)', () => {
    const gameStats = makeGameStatsStub();
    (gameStats as unknown as { vpSources: Array<{ source: string; totalPoints: number; sharePct: number }> }).vpSources = [
      { source: 'score_objective_stage1', totalPoints: 330, sharePct: 0.844 },
      { source: 'support_for_throne', totalPoints: 33, sharePct: 0.084 },
      { source: 'rider', totalPoints: 1, sharePct: 0.003 },
    ];
    mockState = {
      loading: false,
      error: null,
      games: [],
      factionStats: null,
      strategyCardStats: null,
      techStats: null,
      gameStats,
      speakerStats: null,
      scoringPace: null,
      relicStats: null,
      techPaths: null,
    };

    render(<MemoryRouter><StatsSection /></MemoryRouter>);

    // The new presentation must show "<count> VP · <percent>%" so a 0%-rounded
    // sparse row (e.g. RIDER · 1 VP · 0%) reads as "rare in our data" not "broken".
    expect(screen.getByText(/330 VP/)).toBeInTheDocument();
    expect(screen.getByText(/33 VP/)).toBeInTheDocument();
    expect(screen.getByText(/1 VP/)).toBeInTheDocument();
  });
});

describe('StatsSection · unified Relics panel', () => {
  function setupWithRelicStats() {
    mockState = {
      loading: false,
      error: null,
      games: [],
      factionStats: null,
      strategyCardStats: null,
      techStats: null,
      gameStats: makeGameStatsStub(),
      speakerStats: null,
      scoringPace: null,
      relicStats: makeRelicStats(),
      techPaths: null,
    };
  }

  it('renders relic names in the unified Relics panel', () => {
    setupWithRelicStats();
    render(<MemoryRouter><StatsSection /></MemoryRouter>);

    expect(screen.getByText('Shard of the Throne')).toBeInTheDocument();
    expect(screen.getByText('The Crown of Emphidia')).toBeInTheDocument();
    expect(screen.getByText('Stellar Converter')).toBeInTheDocument();
  });

  it('renders a "VP" badge for relics that grant VP and omits it for non-VP relics', () => {
    setupWithRelicStats();
    render(<MemoryRouter><StatsSection /></MemoryRouter>);

    // The card structure: card > [name div, stats div, vp/no-vp div].
    // closest('div') gets the name's immediate wrapper; we need its parent (the card itself).
    const shardCard = screen.getByText('Shard of the Throne').closest('div')!.parentElement!;
    const crownCard = screen.getByText('The Crown of Emphidia').closest('div')!.parentElement!;
    const stellarCard = screen.getByText('Stellar Converter').closest('div')!.parentElement!;

    expect(within(shardCard).getByText('VP')).toBeInTheDocument();
    expect(within(crownCard).getByText('VP')).toBeInTheDocument();
    expect(within(stellarCard).queryByText('VP')).not.toBeInTheDocument();
    // Non-VP relics show "No VP" instead
    expect(within(stellarCard).getByText('No VP')).toBeInTheDocument();
  });

  it('merges gameStats.relics and relicStats.relics by relic name without duplicates', () => {
    const gameStats = makeGameStatsStub();
    (gameStats as unknown as { relics: Array<{ relic: string; drawnCount: number; playedCount: number; grantsVp: boolean }> }).relics = [
      { relic: 'Shard of the Throne', drawnCount: 3, playedCount: 0, grantsVp: true },
      { relic: 'Stellar Converter', drawnCount: 1, playedCount: 1, grantsVp: false },
    ];
    mockState = {
      loading: false,
      error: null,
      games: [],
      factionStats: null,
      strategyCardStats: null,
      techStats: null,
      gameStats,
      speakerStats: null,
      scoringPace: null,
      relicStats: makeRelicStats(),
      techPaths: null,
    };

    render(<MemoryRouter><StatsSection /></MemoryRouter>);

    // All three relics appear exactly once
    expect(screen.getAllByText('Shard of the Throne')).toHaveLength(1);
    expect(screen.getAllByText('Stellar Converter')).toHaveLength(1);
    expect(screen.getAllByText('The Crown of Emphidia')).toHaveLength(1);
  });
});

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

describe('StatsSection · builders', () => {
  it('buildGameLengthHistogram returns empty for no games', () => {
    expect(buildGameLengthHistogram([])).toEqual({ buckets: [], medianIdx: 0 });
  });

  it('buildGameLengthHistogram bins games by max round', () => {
    const games = [
      makeGame({ phaseSnapshots: [{ round: 6, phase: 'a', speaker: '', strategyCards: {} }] }),
      makeGame({ phaseSnapshots: [{ round: 8, phase: 'a', speaker: '', strategyCards: {} }] }),
      makeGame({ phaseSnapshots: [{ round: 8, phase: 'a', speaker: '', strategyCards: {} }] }),
    ];
    const { buckets } = buildGameLengthHistogram(games);
    expect(buckets.length).toBeGreaterThan(0);
    const total = buckets.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(3);
  });

  it('buildFinalVpHistogram bins all faction final scores', () => {
    const games = [
      makeGame({ finalScores: { A: 10, B: 8, C: 4 } }),
      makeGame({ finalScores: { A: 9, B: 6 } }),
    ];
    const { buckets } = buildFinalVpHistogram(games);
    const total = buckets.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(5);
    // 10+ bucket should have exactly 1
    const tenPlus = buckets.find(b => b.label === '10+');
    expect(tenPlus?.count).toBe(1);
  });

  it('buildFinalVpHistogram empty for no games', () => {
    expect(buildFinalVpHistogram([]).buckets).toEqual([]);
  });

  it('buildWinsByFaction counts winners and sorts desc', () => {
    const games = [
      makeGame({ winner: 'Sol' }),
      makeGame({ winner: 'Sol' }),
      makeGame({ winner: 'Hacan' }),
      makeGame({ winner: null }),
    ];
    const wins = buildWinsByFaction(games);
    expect(wins).toHaveLength(2);
    expect(wins[0]).toMatchObject({ label: 'Sol', value: 2 });
    expect(wins[1]).toMatchObject({ label: 'Hacan', value: 1 });
  });
});
