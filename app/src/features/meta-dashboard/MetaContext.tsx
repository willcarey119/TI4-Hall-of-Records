import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadAllGames } from '../../adapters/firestore';
import {
  buildFactionStats, buildStrategyCardStats, buildTechStats, buildGameStats, buildSpeakerStats,
  buildScoringPace, buildScoringPaceRounds, buildRelicStats, buildTechPaths,
  deriveRoundBoundaries,
  type FactionStatsSummary, type StrategyCardSummary, type TechSummary, type GameStatsSummary,
  type RoundBoundary, type SpeakerStats, type ScoringPaceSummary, type ScoringPaceRoundSummary,
  type RelicStatsSummary, type TechPathSummary,
} from '../../lib/aggregator';
import type { ParsedGame } from '../../lib/parser/types';

export interface MetaState {
  loading: boolean;
  error: string | null;
  games: ParsedGame[];
  factionStats: FactionStatsSummary | null;
  strategyCardStats: StrategyCardSummary | null;
  techStats: TechSummary | null;
  gameStats: GameStatsSummary | null;
  speakerStats: SpeakerStats | null;
  scoringPace: ScoringPaceSummary | null;
  scoringPaceRounds: ScoringPaceRoundSummary | null;
  relicStats: RelicStatsSummary | null;
  techPaths: TechPathSummary | null;
}

const initialState: MetaState = {
  loading: true,
  error: null,
  games: [],
  factionStats: null,
  strategyCardStats: null,
  techStats: null,
  gameStats: null,
  speakerStats: null,
  scoringPace: null,
  scoringPaceRounds: null,
  relicStats: null,
  techPaths: null,
};

const MetaContext = createContext<MetaState>(initialState);

export function MetaProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MetaState>(initialState);

  useEffect(() => {
    let cancelled = false;
    loadAllGames()
      .then(games => {
        const boundariesByGame = new Map<string, RoundBoundary[]>();
        for (const g of games) {
          boundariesByGame.set(g.gameId, deriveRoundBoundaries(g.strategyCardEvents, g.factions.length));
        }
        const next: MetaState = {
          loading: false,
          error: null,
          games,
          factionStats:      buildFactionStats(games, boundariesByGame),
          strategyCardStats: buildStrategyCardStats(games, boundariesByGame),
          techStats:         buildTechStats(games, boundariesByGame),
          gameStats:         buildGameStats(games, boundariesByGame),
          speakerStats:      buildSpeakerStats(games),
          scoringPace:       buildScoringPace(games),
          scoringPaceRounds: buildScoringPaceRounds(games),
          relicStats:        buildRelicStats(games),
          techPaths:         buildTechPaths(games),
        };
        if (!cancelled) setState(next);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setState({
          ...initialState,
          loading: false,
          error: e instanceof Error ? e.message : 'Failed to load meta-dashboard',
        });
      });
    return () => { cancelled = true; };
  }, []);

  return <MetaContext.Provider value={state}>{children}</MetaContext.Provider>;
}

export function useMeta(): MetaState {
  return useContext(MetaContext);
}
