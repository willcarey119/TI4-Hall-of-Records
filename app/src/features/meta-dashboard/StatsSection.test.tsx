import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StatsSection } from './StatsSection';
import type { MetaState } from './MetaContext';
import type { RelicStatsSummary } from '../../lib/aggregator';

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
    objectiveTiming: { avgVpPerRound: {} },
    heroActivations: [],
    relics: [],
    agendas: [],
  } as unknown as MetaState['gameStats'];
}

describe('StatsSection · Relic Performance panel', () => {
  it('renders a "VP" badge for relics that grant VP and omits it for non-VP relics', () => {
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

    render(<MemoryRouter><StatsSection /></MemoryRouter>);

    // Locate each relic row in the Relic Performance panel by its italic
    // Newsreader label, then walk up to its row container.
    const shardLabel = screen.getByText('Shard of the Throne');
    const crownLabel = screen.getByText('The Crown of Emphidia');
    const stellarLabel = screen.getByText('Stellar Converter');

    // Each row contains the relic name and the gained/played counts; for
    // VP-granting relics the row also contains a "VP" badge sibling.
    const shardRow = shardLabel.closest('div')!;
    const crownRow = crownLabel.closest('div')!;
    const stellarRow = stellarLabel.closest('div')!;

    expect(within(shardRow).getByText('VP')).toBeInTheDocument();
    expect(within(crownRow).getByText('VP')).toBeInTheDocument();
    expect(within(stellarRow).queryByText('VP')).not.toBeInTheDocument();
  });
});
