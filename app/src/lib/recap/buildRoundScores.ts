import type { VpEvent, FactionSetup } from '../parser/types';
import type { RoundBoundary } from '../aggregator/deriveRoundBoundaries';

export interface RoundScoreRow {
  round: number;
  scores: Record<string, number>;
}

export function buildRoundScores(
  vpEvents: VpEvent[],
  factions: FactionSetup[],
  roundBoundaries: RoundBoundary[],
): RoundScoreRow[] {
  if (roundBoundaries.length === 0) return [];

  const maxRound = Math.max(...roundBoundaries.map(b => b.round));
  const rows: RoundScoreRow[] = [];

  for (let r = 1; r <= maxRound; r++) {
    const nextBoundary = roundBoundaries.find(b => b.round === r + 1);
    const cutoff = nextBoundary?.startTimestamp ?? Infinity;

    const scores: Record<string, number> = {};
    for (const f of factions) {
      scores[f.factionId] = vpEvents
        .filter(e => e.faction === f.factionId && e.timestamp < cutoff)
        .reduce((sum, e) => sum + e.points, 0);
    }
    rows.push({ round: r, scores });
  }
  return rows;
}
