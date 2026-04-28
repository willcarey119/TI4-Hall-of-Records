import type { ParsedGame } from '../parser/types';
import { lookupTechColor, type TechColor } from '../parser/techs';
import { assignRound, type RoundBoundary } from './deriveRoundBoundaries';

export interface TechStat {
  tech: string;
  color: TechColor;
  researchCount: number;
  researchingFactions: string[];
  avgRoundFirstResearched: number | null;
  winnerHeldRate: number;
  winnerHeldCount: number;
}

export interface TechSummary {
  topTechs: TechStat[];
  byColor: Record<TechColor, TechStat[]>;
  /** Number of games with a non-null winner. Denominator for "N of M winning games" displays. */
  totalWinnerGames: number;
}

interface TechAcc {
  researchCount: number;
  factions: Set<string>;
  firstRoundsPerGame: number[];
  winnerHeldCount: number;
}

export function buildTechStats(
  games: ParsedGame[],
  roundBoundariesByGame: Map<string, RoundBoundary[]>,
): TechSummary {
  const acc = new Map<string, TechAcc>();
  const get = (tech: string): TechAcc => {
    let cur = acc.get(tech);
    if (cur === undefined) {
      cur = { researchCount: 0, factions: new Set(), firstRoundsPerGame: [], winnerHeldCount: 0 };
      acc.set(tech, cur);
    }
    return cur;
  };

  const winnerGames = games.filter(g => g.winner !== null).length;

  for (const game of games) {
    const boundaries = roundBoundariesByGame.get(game.gameId) ?? [];

    // Track first-research round per tech per game
    const firstResearchInGame = new Map<string, number>();
    // Track techs held by the winner (research OR starting)
    const winnerTechs = new Set<string>();

    for (const ev of game.techEvents) {
      if (ev.type === 'research') {
        const a = get(ev.tech);
        a.researchCount += 1;
        a.factions.add(ev.faction);
        if (boundaries.length > 0 && !firstResearchInGame.has(ev.tech)) {
          firstResearchInGame.set(ev.tech, assignRound(ev.timestamp, boundaries));
        }
      } else if (ev.type === 'starting') {
        get(ev.tech); // ensure entry exists for winnerHeldRate denominator
        get(ev.tech).factions.add(ev.faction);
      }
      if (game.winner !== null && ev.faction === game.winner &&
          (ev.type === 'research' || ev.type === 'starting')) {
        winnerTechs.add(ev.tech);
      }
    }

    for (const [tech, round] of firstResearchInGame) {
      get(tech).firstRoundsPerGame.push(round);
    }
    for (const tech of winnerTechs) {
      get(tech).winnerHeldCount += 1;
    }
  }

  const stats: TechStat[] = [...acc.entries()].map(([tech, a]) => ({
    tech,
    color: lookupTechColor(tech),
    researchCount: a.researchCount,
    researchingFactions: [...a.factions],
    avgRoundFirstResearched: a.firstRoundsPerGame.length > 0
      ? a.firstRoundsPerGame.reduce((s, n) => s + n, 0) / a.firstRoundsPerGame.length
      : null,
    winnerHeldRate: winnerGames > 0 ? a.winnerHeldCount / winnerGames : 0,
    winnerHeldCount: a.winnerHeldCount,
  }));

  const topTechs = [...stats].sort((a, b) => b.researchCount - a.researchCount).slice(0, 15);

  const byColor: Record<TechColor, TechStat[]> = {
    green: [], blue: [], yellow: [], red: [], unit: [],
  };
  for (const s of stats) byColor[s.color].push(s);
  for (const color of Object.keys(byColor) as TechColor[]) {
    byColor[color].sort((a, b) => b.researchCount - a.researchCount);
  }

  return { topTechs, byColor, totalWinnerGames: winnerGames };
}
