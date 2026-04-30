import type { ParsedGame } from '../parser/types';
import { getVictoryPointThreshold } from '../parser/options';
import { deriveRoundBoundaries } from './deriveRoundBoundaries';
import { buildRoundScores } from '../recap/buildRoundScores';

export interface ScoringPaceRoundPoint {
  round: number;
  vp: number;
}

export interface ScoringPaceRoundCurve {
  gameId: string;
  points: ScoringPaceRoundPoint[];
  peakVp: number;
}

export interface ScoringPaceRoundSummary {
  roundCurves: ScoringPaceRoundCurve[];
  maxRounds: number;
  victoryPoints: number;
  /** gameId of the curve with the highest peak VP (highlighted in chart). */
  highlightGameId: string | null;
}

export function buildScoringPaceRounds(games: ParsedGame[]): ScoringPaceRoundSummary {
  let maxRounds = 0;
  let victoryPoints = 0;
  const roundCurves: ScoringPaceRoundCurve[] = [];

  for (const game of games) {
    if (game.winner === null) continue;

    const boundaries = deriveRoundBoundaries(game.strategyCardEvents, game.factions.length);
    if (boundaries.length === 0) continue;

    const vp = getVictoryPointThreshold(game.options);
    if (victoryPoints === 0) victoryPoints = vp;

    const roundScores = buildRoundScores(game.vpEvents, game.factions, boundaries);
    if (roundScores.length === 0) continue;

    const points: ScoringPaceRoundPoint[] = [{ round: 0, vp: 0 }];
    for (const row of roundScores) {
      points.push({ round: row.round, vp: row.scores[game.winner] ?? 0 });
    }

    const peakVp = Math.max(...points.map(p => p.vp));
    roundCurves.push({ gameId: game.gameId, points, peakVp });
    if (roundScores.length > maxRounds) maxRounds = roundScores.length;
  }

  let highlightGameId: string | null = null;
  let highestPeak = -1;
  for (const c of roundCurves) {
    if (c.peakVp > highestPeak) {
      highestPeak = c.peakVp;
      highlightGameId = c.gameId;
    }
  }

  return { roundCurves, maxRounds, victoryPoints, highlightGameId };
}
