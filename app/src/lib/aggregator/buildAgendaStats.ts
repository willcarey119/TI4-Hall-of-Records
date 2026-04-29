import type { ParsedGame } from '../parser/types';

export interface AgendaFreqStat {
  name: string;
  /** Total resolutions: passCount + failCount + electCount. */
  appearances: number;
  /** Resolutions with outcome === 'For'. */
  passCount: number;
  /** Resolutions with outcome === 'Against'. */
  failCount: number;
  /** Resolutions where outcome is the elected target (e.g. faction or planet name).
   *  Elect-type agendas have no pass/fail concept — tracked separately so they
   *  don't inflate passRate. */
  electCount: number;
  /** passes / (passes + fails). Null when an agenda has no binary resolutions. */
  passRate: number | null;
  /** Average For votes per binary appearance. Null when no binary resolutions. */
  avgForVotes: number | null;
  /** Average Against votes per binary appearance. Null when no binary resolutions. */
  avgAgainstVotes: number | null;
}

export interface AgendaStatsSummary {
  agendas: AgendaFreqStat[];
  totalResolutions: number;
  /** Σ passCount / Σ (passCount + failCount) across all agendas.
   *  Null when no binary resolutions exist (e.g. only elect-type results in dataset). */
  overallPassRate: number | null;
  gamesAnalyzed: number;
}

export function buildAgendaStats(games: ParsedGame[]): AgendaStatsSummary {
  const agendaMap = new Map<string, {
    appearances: number; passes: number; fails: number; elects: number;
    totalFor: number; totalAgainst: number;
  }>();

  for (const game of games) {
    for (const res of game.agendaResolutions) {
      let entry = agendaMap.get(res.agenda);
      if (entry === undefined) {
        entry = { appearances: 0, passes: 0, fails: 0, elects: 0, totalFor: 0, totalAgainst: 0 };
        agendaMap.set(res.agenda, entry);
      }
      entry.appearances++;
      if (res.outcome === 'For') entry.passes++;
      else if (res.outcome === 'Against') entry.fails++;
      else entry.elects++;

      for (const v of res.votes) {
        const voteCount = typeof v.votes === 'number' ? v.votes : 0;
        if (v.outcome === 'For') entry.totalFor += voteCount;
        else if (v.outcome === 'Against') entry.totalAgainst += voteCount;
      }
    }
  }

  const agendas: AgendaFreqStat[] = Array.from(agendaMap.entries()).map(([name, data]) => {
    const binary = data.passes + data.fails;
    return {
      name,
      appearances: data.appearances,
      passCount: data.passes,
      failCount: data.fails,
      electCount: data.elects,
      passRate: binary > 0 ? data.passes / binary : null,
      avgForVotes: binary > 0 ? data.totalFor / binary : null,
      avgAgainstVotes: binary > 0 ? data.totalAgainst / binary : null,
    };
  });

  const totalResolutions = agendas.reduce((s, a) => s + a.appearances, 0);
  const totalPassed = agendas.reduce((s, a) => s + a.passCount, 0);
  const totalFailed = agendas.reduce((s, a) => s + a.failCount, 0);
  const totalBinary = totalPassed + totalFailed;

  return {
    agendas: agendas.sort((a, b) => b.appearances - a.appearances),
    totalResolutions,
    overallPassRate: totalBinary > 0 ? totalPassed / totalBinary : null,
    gamesAnalyzed: games.length,
  };
}
