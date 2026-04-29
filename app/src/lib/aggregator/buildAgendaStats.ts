import type { ParsedGame } from '../parser/types';

export interface AgendaFreqStat {
  name: string;
  appearances: number;
  passCount: number;
  failCount: number;
  passRate: number;
  avgForVotes: number;
  avgAgainstVotes: number;
}

export interface AgendaStatsSummary {
  agendas: AgendaFreqStat[];
  totalResolutions: number;
  overallPassRate: number;
  gamesAnalyzed: number;
}

function isPassed(outcome: string): boolean {
  return outcome !== 'Against';
}

export function buildAgendaStats(games: ParsedGame[]): AgendaStatsSummary {
  const agendaMap = new Map<string, {
    appearances: number; passes: number; fails: number;
    totalFor: number; totalAgainst: number;
  }>();

  for (const game of games) {
    for (const res of game.agendaResolutions) {
      let entry = agendaMap.get(res.agenda);
      if (entry === undefined) {
        entry = { appearances: 0, passes: 0, fails: 0, totalFor: 0, totalAgainst: 0 };
        agendaMap.set(res.agenda, entry);
      }
      entry.appearances++;
      if (isPassed(res.outcome)) entry.passes++;
      else entry.fails++;

      for (const v of res.votes) {
        const voteCount = typeof v.votes === 'number' ? v.votes : 0;
        if (v.outcome === 'For') entry.totalFor += voteCount;
        else if (v.outcome === 'Against') entry.totalAgainst += voteCount;
      }
    }
  }

  const agendas: AgendaFreqStat[] = Array.from(agendaMap.entries()).map(([name, data]) => ({
    name,
    appearances: data.appearances,
    passCount: data.passes,
    failCount: data.fails,
    passRate: data.appearances > 0 ? data.passes / data.appearances : 0,
    avgForVotes: data.appearances > 0 ? data.totalFor / data.appearances : 0,
    avgAgainstVotes: data.appearances > 0 ? data.totalAgainst / data.appearances : 0,
  }));

  const totalResolutions = agendas.reduce((s, a) => s + a.appearances, 0);
  const totalPassed = agendas.reduce((s, a) => s + a.passCount, 0);

  return {
    agendas: agendas.sort((a, b) => b.appearances - a.appearances),
    totalResolutions,
    overallPassRate: totalResolutions > 0 ? totalPassed / totalResolutions : 0,
    gamesAnalyzed: games.length,
  };
}
