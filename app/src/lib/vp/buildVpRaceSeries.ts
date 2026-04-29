import type { ParsedGame } from '../parser/types';
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

/**
 * Chart-data only. Editorial copy (headline, deck, prose) lives in
 * `buildVpRaceEditorial.ts` — call both and compose at the section level.
 */
export interface VpRaceSummary {
  series: FactionVpSeries[];
  victoryPoints: number;
  totalRounds: number;
}

export type BuildVpRaceSeriesInput = Pick<
  ParsedGame,
  'vpEvents' | 'factions' | 'finalScores' | 'options'
> & {
  roundBoundaries: RoundBoundary[];
};

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
 */
export function buildVpRaceSeries(input: BuildVpRaceSeriesInput): VpRaceSummary {
  const { vpEvents, factions, finalScores, options, roundBoundaries } = input;
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

  return { series, victoryPoints, totalRounds };
}
