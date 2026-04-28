import type { VpEvent, FactionSetup } from '../parser/types';

export interface VpPoint {
  timestamp: number;
  gameTimeSeconds: number;
  cumulativeVp: number;
}

export interface FactionVpSeries {
  factionId: string;
  color: string;
  points: VpPoint[];
  finalVp: number;
  isWinner: boolean;
}

export interface VpTimelineSummary {
  series: FactionVpSeries[];
  victoryPoints: number;
  gameDurationSeconds: number;
  headline: string;
  deckText: string;
}

export function buildVpTimeline(
  vpEvents: VpEvent[],
  factions: FactionSetup[],
  finalScores: Record<string, number>,
  options: Record<string, unknown>,
  gameDurationSeconds: number,
): VpTimelineSummary {
  const raw = options['victoryPoints'];
  const victoryPoints = typeof raw === 'number' ? raw : 10;
  const firstTimestamp = vpEvents[0]?.timestamp ?? 0;

  // Initialize running totals and series maps
  const running: Record<string, number> = {};
  const pointsMap: Record<string, VpPoint[]> = {};
  for (const f of factions) {
    running[f.factionId] = 0;
    pointsMap[f.factionId] = [{ timestamp: firstTimestamp, gameTimeSeconds: 0, cumulativeVp: 0 }];
  }

  // Process events in chronological order
  for (const event of vpEvents) {
    const prev = running[event.faction] ?? 0;
    running[event.faction] = prev + event.points;
    const arr = pointsMap[event.faction];
    if (arr !== undefined) {
      const cumulative = running[event.faction] ?? 0;
      arr.push({
        timestamp: event.timestamp,
        gameTimeSeconds: event.timestamp - firstTimestamp,
        cumulativeVp: cumulative,
      });
    }
  }

  // Build series ordered by mapPosition
  const series: FactionVpSeries[] = factions
    .slice()
    .sort((a, b) => a.mapPosition - b.mapPosition)
    .map(f => ({
      factionId: f.factionId,
      color: f.color,
      points: pointsMap[f.factionId] ?? [],
      finalVp: finalScores[f.factionId] ?? 0,
      isWinner: (finalScores[f.factionId] ?? 0) >= victoryPoints,
    }));

  // Editorial text — winner or leader
  const winner = series.find(s => s.isWinner);
  const leader = [...series].sort((a, b) => b.finalVp - a.finalVp)[0];
  const hours = Math.round((gameDurationSeconds / 3600) * 10) / 10;

  const headline = winner !== undefined
    ? `${winner.factionId} wins.`
    : 'The race is unfinished.';

  const deckText = winner !== undefined
    ? `Victory in ${hours}h. Final scores: ${series.map(s => `${s.factionId} ${s.finalVp}`).join(', ')}.`
    : leader !== undefined
      ? `${leader.factionId} led with ${leader.finalVp} VP after ${hours}h.`
      : `${series.length} factions competed over ${hours}h.`;

  return { series, victoryPoints, gameDurationSeconds, headline, deckText };
}
