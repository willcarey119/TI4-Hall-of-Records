import type { ParsedGame } from '../parser/types';
import { getVictoryPointThreshold } from '../parser/options';
import { deriveRoundBoundaries } from './deriveRoundBoundaries';
import { buildRoundScores } from '../recap/buildRoundScores';

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

// ─── Round-based scoring pace ────────────────────────────────────────────────

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
  let victoryPoints = 10;
  const roundCurves: ScoringPaceRoundCurve[] = [];

  for (const game of games) {
    if (game.winner === null) continue;

    const boundaries = deriveRoundBoundaries(game.strategyCardEvents, game.factions.length);
    if (boundaries.length === 0) continue;

    const vp = getVictoryPointThreshold(game.options);
    victoryPoints = vp;

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

// ─── Time-normalized scoring pace (legacy) ───────────────────────────────────

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
