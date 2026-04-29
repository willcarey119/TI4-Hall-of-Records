import type { ParsedGame } from '../parser/types';
import type { AgendaFreqStat } from './buildAgendaStats';

// Re-export AgendaVote and AgendaRider types for convenience
export type { AgendaVote, AgendaRider } from '../parser/types';

import type { AgendaVote, AgendaRider } from '../parser/types';

export interface AgendaAppearance {
  gameId: string;
  gameDate: number;
  gameWinner: string | null;
  round: number;
  indexInRound: 1 | 2;
  outcome: string;
  passed: boolean;
  totalFor: number;
  totalAgainst: number;
  electedFaction?: string;
  votes: AgendaVote[];
  riders: AgendaRider[];
  vpDeltaByFaction: Record<string, number>;
}

export interface AgendaCrossGameStat extends AgendaFreqStat {
  /** The full list of per-appearance records (named appearances_list to avoid clash with AgendaFreqStat.appearances count). */
  appearances_list: AgendaAppearance[];
  vpDeltaByFaction: Record<string, number>;
  roundDistribution: Record<number, number>;
}

export interface FactionAgendaVote {
  factionId: string;
  forCount: number;
  againstCount: number;
  electCount: number;
  abstainCount: number;
}

export interface AgendaFactionVotingSummary {
  agenda: string;
  factions: FactionAgendaVote[];
}

export interface AgendaCrossGameSummary {
  agendas: AgendaCrossGameStat[];
  totalResolutions: number;
  overallPassRate: number | null;
  gamesAnalyzed: number;
  factionVotingByAgenda: Record<string, AgendaFactionVotingSummary>;
}

export function buildAgendaCrossGame(games: ParsedGame[]): AgendaCrossGameSummary {
  if (games.length === 0) {
    return {
      agendas: [],
      totalResolutions: 0,
      overallPassRate: null,
      gamesAnalyzed: 0,
      factionVotingByAgenda: {},
    };
  }

  // Per-agenda accumulator
  const agendaMap = new Map<string, {
    appearances_list: AgendaAppearance[];
    passes: number;
    fails: number;
    elects: number;
    totalFor: number;
    totalAgainst: number;
    vpDeltaByFaction: Record<string, number>;
    roundDistribution: Record<number, number>;
  }>();

  // Per-agenda faction voting accumulator: agenda -> factionId -> vote tallies
  const factionVotingMap = new Map<string, Map<string, FactionAgendaVote>>();

  for (const game of games) {
    // Derive game winner from game.winner (already computed by parser)
    const gameWinner = game.winner;

    // Build a lookup of agenda vpEvents by timestamp for this game
    const agendaVpByTimestamp = new Map<number, { faction: string; points: number }[]>();
    for (const vp of game.vpEvents) {
      if (vp.source === 'agenda') {
        let list = agendaVpByTimestamp.get(vp.timestamp);
        if (list === undefined) {
          list = [];
          agendaVpByTimestamp.set(vp.timestamp, list);
        }
        list.push({ faction: vp.faction, points: vp.points });
      }
    }

    // Track indexInRound: how many resolutions have we seen per round for this game
    const roundIndexTracker = new Map<number, number>();

    for (const res of game.agendaResolutions) {
      // Derive indexInRound
      const prevCount = roundIndexTracker.get(res.round) ?? 0;
      const indexInRound = (prevCount + 1) as 1 | 2;
      roundIndexTracker.set(res.round, prevCount + 1);

      // Compute totalFor / totalAgainst
      let totalFor = 0;
      let totalAgainst = 0;
      for (const v of res.votes) {
        const voteCount = typeof v.votes === 'number' ? v.votes : 0;
        if (v.outcome === 'For') totalFor += voteCount;
        else if (v.outcome === 'Against') totalAgainst += voteCount;
      }

      // Determine passed
      const isBinary = res.outcome === 'For' || res.outcome === 'Against';
      const passed = res.outcome === 'For';

      // Build vpDeltaByFaction for this appearance
      const vpDelta: Record<string, number> = {};
      const vpEntries = agendaVpByTimestamp.get(res.timestamp) ?? [];
      for (const entry of vpEntries) {
        vpDelta[entry.faction] = (vpDelta[entry.faction] ?? 0) + entry.points;
      }

      const appearance: AgendaAppearance = {
        gameId: game.gameId,
        gameDate: game.playedAt,
        gameWinner,
        round: res.round,
        indexInRound,
        outcome: res.outcome,
        passed,
        totalFor,
        totalAgainst,
        votes: res.votes,
        riders: res.riders,
        vpDeltaByFaction: vpDelta,
      };

      // Accumulate into agendaMap
      let entry = agendaMap.get(res.agenda);
      if (entry === undefined) {
        entry = {
          appearances_list: [],
          passes: 0,
          fails: 0,
          elects: 0,
          totalFor: 0,
          totalAgainst: 0,
          vpDeltaByFaction: {},
          roundDistribution: {},
        };
        agendaMap.set(res.agenda, entry);
      }
      entry.appearances_list.push(appearance);
      if (isBinary) {
        if (passed) entry.passes++;
        else entry.fails++;
        entry.totalFor += totalFor;
        entry.totalAgainst += totalAgainst;
      } else {
        entry.elects++;
      }
      // Accumulate vpDelta into agenda-level
      for (const [faction, delta] of Object.entries(vpDelta)) {
        entry.vpDeltaByFaction[faction] = (entry.vpDeltaByFaction[faction] ?? 0) + delta;
      }
      // roundDistribution
      entry.roundDistribution[res.round] = (entry.roundDistribution[res.round] ?? 0) + 1;

      // Accumulate faction voting
      let agendaFactionMap = factionVotingMap.get(res.agenda);
      if (agendaFactionMap === undefined) {
        agendaFactionMap = new Map();
        factionVotingMap.set(res.agenda, agendaFactionMap);
      }
      for (const v of res.votes) {
        let fv = agendaFactionMap.get(v.faction);
        if (fv === undefined) {
          fv = { factionId: v.faction, forCount: 0, againstCount: 0, electCount: 0, abstainCount: 0 };
          agendaFactionMap.set(v.faction, fv);
        }
        if (v.outcome === 'For') fv.forCount++;
        else if (v.outcome === 'Against') fv.againstCount++;
        else fv.electCount++;
      }
    }
  }

  // Build the final agendas array
  const agendas: AgendaCrossGameStat[] = Array.from(agendaMap.entries()).map(([name, data]) => {
    const binary = data.passes + data.fails;
    return {
      name,
      appearances: data.appearances_list.length, // AgendaFreqStat count field
      appearances_list: data.appearances_list,
      passCount: data.passes,
      failCount: data.fails,
      electCount: data.elects,
      passRate: binary > 0 ? data.passes / binary : null,
      avgForVotes: binary > 0 ? data.totalFor / binary : null,
      avgAgainstVotes: binary > 0 ? data.totalAgainst / binary : null,
      vpDeltaByFaction: data.vpDeltaByFaction,
      roundDistribution: data.roundDistribution,
    };
  });

  // Sort by appearance count descending
  agendas.sort((a, b) => b.appearances - a.appearances);

  const totalResolutions = agendas.reduce((s, a) => s + a.appearances, 0);
  const totalPassed = agendas.reduce((s, a) => s + a.passCount, 0);
  const totalFailed = agendas.reduce((s, a) => s + a.failCount, 0);
  const totalBinary = totalPassed + totalFailed;

  // Build factionVotingByAgenda
  const factionVotingByAgenda: Record<string, AgendaFactionVotingSummary> = {};
  for (const [agendaName, factionMap] of factionVotingMap.entries()) {
    factionVotingByAgenda[agendaName] = {
      agenda: agendaName,
      factions: Array.from(factionMap.values()),
    };
  }

  return {
    agendas,
    totalResolutions,
    overallPassRate: totalBinary > 0 ? totalPassed / totalBinary : null,
    gamesAnalyzed: games.length,
    factionVotingByAgenda,
  };
}
