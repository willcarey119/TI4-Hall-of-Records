import type { VpEvent, FactionSetup } from '../parser/types';
import type { RoundBoundary } from '../aggregator/deriveRoundBoundaries';
import { getVictoryPointThreshold } from '../parser/options';
import { buildRoundScores } from '../recap/buildRoundScores';

/**
 * A single point on a faction's VP-Race line.
 *  - `round === 0` → the chart anchor (every game starts at 0 VP).
 *  - `round >= 1`  → cumulative VP at the END of that round (matches the
 *                    round-by-round scores table in RecapSection).
 */
export interface VpRacePoint {
  round: number;
  cumulativeVp: number;
}

export interface FactionVpSeries {
  factionId: string;
  color: string;
  points: VpRacePoint[];
  finalVp: number;
  isWinner: boolean;
}

export interface VpRaceSummary {
  series: FactionVpSeries[];
  victoryPoints: number;
  totalRounds: number;
  headline: string;
  deckText: string;
  editorialProse: string;
}

/**
 * Builds round-aligned VP-Race series for the chart.
 *
 * Drives off the same `buildRoundScores(...)` logic that powers the round-by-round
 * scores table in RecapSection, ensuring chart and table stay in lockstep.
 *
 * Each series gets:
 *   - An anchor point at round 0 with 0 VP (so the chart line starts at the origin).
 *   - One point per round in `roundBoundaries`, with cumulativeVp matching that
 *     row of `buildRoundScores`. The terminal round's value equals
 *     finalScores[factionId] for any faction whose VP events all fall before the
 *     end of play.
 *
 * Editorial text (headline / deckText / editorialProse) is computed from
 * finalScores + factions only — it does not depend on the time series.
 */
export function buildVpRaceSeries(
  vpEvents: VpEvent[],
  factions: FactionSetup[],
  finalScores: Record<string, number>,
  options: Record<string, unknown>,
  roundBoundaries: RoundBoundary[],
): VpRaceSummary {
  const victoryPoints = getVictoryPointThreshold(options);
  const roundScores = buildRoundScores(vpEvents, factions, roundBoundaries);
  const totalRounds = roundScores.length;

  const orderedFactions = factions
    .slice()
    .sort((a, b) => a.mapPosition - b.mapPosition);

  const series: FactionVpSeries[] = orderedFactions.map(f => {
    const points: VpRacePoint[] = [{ round: 0, cumulativeVp: 0 }];
    for (const row of roundScores) {
      points.push({ round: row.round, cumulativeVp: row.scores[f.factionId] ?? 0 });
    }
    const finalVp = finalScores[f.factionId] ?? 0;
    return {
      factionId: f.factionId,
      color: f.color,
      points,
      finalVp,
      isWinner: finalVp >= victoryPoints,
    };
  });

  // Editorial text — same wording as the previous time-aligned implementation.
  const winner = series.find(s => s.isWinner);
  const sortedByVp = [...series].sort((a, b) => b.finalVp - a.finalVp);
  const leader = sortedByVp[0];
  const secondVp = sortedByVp[1]?.finalVp ?? 0;

  const headline = winner !== undefined
    ? `${winner.factionId} takes the throne.`
    : 'The race is unfinished.';

  const deckText = winner !== undefined
    ? `Final scores after ${totalRounds} round${totalRounds === 1 ? '' : 's'}: ${series.map(s => `${s.factionId} ${s.finalVp}`).join(', ')}.`
    : leader !== undefined
      ? `${leader.factionId} led with ${leader.finalVp} VP after ${totalRounds} round${totalRounds === 1 ? '' : 's'}.`
      : `${series.length} factions competed.`;

  const editorialProse = winner !== undefined
    ? `${winner.factionId} reached ${winner.finalVp} victory points across ${totalRounds} round${totalRounds === 1 ? '' : 's'}, claiming the galaxy by a margin of ${winner.finalVp - secondVp}. ${series.length} factions contested the stars; the campaign ran its full course before a victor emerged.`
    : leader !== undefined
      ? `After ${totalRounds} round${totalRounds === 1 ? '' : 's'}, ${leader.factionId} held the lead with ${leader.finalVp} VP. No empire reached the ${victoryPoints}-point threshold before the game concluded.`
      : `${series.length} factions competed without a decisive conclusion.`;

  return { series, victoryPoints, totalRounds, headline, deckText, editorialProse };
}
