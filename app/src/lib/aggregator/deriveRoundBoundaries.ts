import type { StrategyCardEvent } from '../parser/types';

export interface RoundBoundary {
  round: number;
  /** Timestamp of the first strategy card pick in this round. */
  startTimestamp: number;
}

/**
 * Returns round boundaries derived from strategy card pick timestamps.
 *
 * Every faction picks exactly one strategy card per round during the strategy
 * phase. Sorting all 'pick' events by timestamp ascending and chunking into
 * groups of factionCount produces one chunk per round. The minimum timestamp
 * in each chunk is that round's startTimestamp.
 *
 * Initial setup events (starting techs/planets) carry timestamps before the
 * first pick; assignRound() correctly maps them to round 1.
 */
export function deriveRoundBoundaries(
  strategyCardEvents: StrategyCardEvent[],
  factionCount: number,
): RoundBoundary[] {
  if (factionCount <= 0) return [];
  const picks = strategyCardEvents
    .filter(e => e.type === 'pick')
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp);

  const boundaries: RoundBoundary[] = [];
  for (let i = 0; i < picks.length; i += factionCount) {
    const chunk = picks.slice(i, i + factionCount);
    const first = chunk[0];
    if (first === undefined) continue;
    boundaries.push({
      round: boundaries.length + 1,
      startTimestamp: first.timestamp,
    });
  }
  return boundaries;
}

/**
 * Returns the round a given timestamp belongs to.
 * Falls back to round 1 for timestamps before the first boundary (setup events)
 * or when boundaries is empty.
 */
export function assignRound(timestamp: number, boundaries: RoundBoundary[]): number {
  if (boundaries.length === 0) return 1;
  let assigned = boundaries[0]?.round ?? 1;
  for (const b of boundaries) {
    if (b.startTimestamp <= timestamp) assigned = b.round;
    else break;
  }
  return assigned;
}
