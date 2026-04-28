import type { ParsedGame, StrategyCardEvent } from '../parser/types';
import { assignRound, type RoundBoundary } from './deriveRoundBoundaries';

export interface StrategyCardStat {
  card: string;
  totalPicks: number;
  secondaryFollowRate: number | null;
  avgPickPosition: number | null;
  avgPickPositionByRound: Record<number, number | null>;
  secondaryFollowRateByRound: Record<number, number | null>;
  pickCountByRound: Record<number, number>;
}

export interface StrategyCardSummary {
  cards: StrategyCardStat[];
  mostContested: string[];
}

interface PerCardAcc {
  picks: number;
  follows: number;
  passes: number;
  positions: number[];                                       // overall avg
  positionsByRound: Map<number, number[]>;
  followsByRound: Map<number, { f: number; p: number }>;
  pickCountByRound: Map<number, number>;
}

export function buildStrategyCardStats(
  games: ParsedGame[],
  roundBoundariesByGame: Map<string, RoundBoundary[]>,
): StrategyCardSummary {
  const acc = new Map<string, PerCardAcc>();
  const get = (card: string): PerCardAcc => {
    let cur = acc.get(card);
    if (cur === undefined) {
      cur = {
        picks: 0, follows: 0, passes: 0, positions: [],
        positionsByRound: new Map(), followsByRound: new Map(), pickCountByRound: new Map(),
      };
      acc.set(card, cur);
    }
    return cur;
  };

  for (const game of games) {
    const boundaries = roundBoundariesByGame.get(game.gameId) ?? [];

    // Bucket pick events by round, then sort each bucket by timestamp to compute position.
    const picksByRound = new Map<number, StrategyCardEvent[]>();
    for (const ev of game.strategyCardEvents) {
      if (ev.type !== 'pick') continue;
      const round = assignRound(ev.timestamp, boundaries);
      const arr = picksByRound.get(round) ?? [];
      arr.push(ev);
      picksByRound.set(round, arr);
    }
    for (const [round, picks] of picksByRound) {
      picks.sort((a, b) => a.timestamp - b.timestamp);
      picks.forEach((ev, idx) => {
        const a = get(ev.card);
        const position = idx + 1;
        a.picks += 1;
        a.positions.push(position);
        const ra = a.positionsByRound.get(round) ?? [];
        ra.push(position);
        a.positionsByRound.set(round, ra);
        a.pickCountByRound.set(round, (a.pickCountByRound.get(round) ?? 0) + 1);
      });
    }

    // Secondary follow / pass events
    for (const ev of game.strategyCardEvents) {
      if (ev.type !== 'play_secondary' && ev.type !== 'pass_secondary') continue;
      const round = assignRound(ev.timestamp, boundaries);
      const a = get(ev.card);
      const fp = a.followsByRound.get(round) ?? { f: 0, p: 0 };
      if (ev.type === 'play_secondary') { a.follows += 1; fp.f += 1; }
      else                              { a.passes  += 1; fp.p += 1; }
      a.followsByRound.set(round, fp);
    }
  }

  const cards: StrategyCardStat[] = [...acc.entries()].map(([card, a]) => {
    const avgPickPosition = a.positions.length > 0
      ? a.positions.reduce((s, n) => s + n, 0) / a.positions.length
      : null;
    const totalSecondary = a.follows + a.passes;
    const secondaryFollowRate = totalSecondary > 0 ? a.follows / totalSecondary : null;

    const avgPickPositionByRound: Record<number, number | null> = {};
    for (const [round, positions] of a.positionsByRound) {
      avgPickPositionByRound[round] = positions.length > 0
        ? positions.reduce((s, n) => s + n, 0) / positions.length
        : null;
    }
    const secondaryFollowRateByRound: Record<number, number | null> = {};
    for (const [round, fp] of a.followsByRound) {
      const total = fp.f + fp.p;
      secondaryFollowRateByRound[round] = total > 0 ? fp.f / total : null;
    }
    const pickCountByRound: Record<number, number> = {};
    for (const [round, count] of a.pickCountByRound) pickCountByRound[round] = count;

    return {
      card, totalPicks: a.picks, secondaryFollowRate,
      avgPickPosition, avgPickPositionByRound, secondaryFollowRateByRound, pickCountByRound,
    };
  });

  cards.sort((a, b) => b.totalPicks - a.totalPicks);

  const mostContested = [...cards]
    .filter(c => c.avgPickPosition !== null)
    .sort((a, b) => (a.avgPickPosition ?? 0) - (b.avgPickPosition ?? 0))
    .map(c => c.card);

  return { cards, mostContested };
}
