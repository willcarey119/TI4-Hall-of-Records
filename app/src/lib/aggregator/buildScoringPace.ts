import type { ParsedGame } from '../parser/types';
import { getVictoryPointThreshold } from '../parser/options';

export interface ScoringPacePoint {
  t: number;
  vp: number;
}

export interface ScoringPaceCurve {
  gameId: string;
  playedAt: number;
  points: ScoringPacePoint[];
  victoryPoints: number;
}

export interface ScoringPaceSummary {
  curves: ScoringPaceCurve[];
}

export function buildScoringPace(games: ParsedGame[]): ScoringPaceSummary {
  const curves: ScoringPaceCurve[] = [];

  for (const game of games) {
    if (game.winner === null || game.durationSeconds === 0) continue;

    const victoryPoints = getVictoryPointThreshold(game.options);
    const durationMs = game.durationSeconds * 1000;
    const startMs = game.playedAt;
    const winnerEvents = game.vpEvents.filter(e => e.faction === game.winner);

    const points: ScoringPacePoint[] = [{ t: 0, vp: 0 }];
    let cumVp = 0;

    for (const e of winnerEvents) {
      cumVp += e.points;
      const t = Math.min(1, Math.max(0, (e.timestamp - startMs) / durationMs));
      points.push({ t, vp: cumVp });
    }

    const finalVp = game.finalScores[game.winner] ?? 0;
    const lastPt = points[points.length - 1];
    if (lastPt === undefined || lastPt.t < 1) {
      points.push({ t: 1, vp: finalVp });
    }

    curves.push({ gameId: game.gameId, playedAt: game.playedAt, points, victoryPoints });
  }

  return { curves };
}
