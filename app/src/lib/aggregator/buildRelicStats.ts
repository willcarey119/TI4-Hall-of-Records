import type { ParsedGame } from '../parser/types';

export interface RelicStatEntry {
  relic: string;
  gainCount: number;
  playCount: number;
  topFactions: Array<{ factionId: string; gainCount: number }>;
}

export interface RelicStatsSummary {
  relics: RelicStatEntry[];
  gamesWithRelicVp: number;
  totalGames: number;
}

export function buildRelicStats(games: ParsedGame[]): RelicStatsSummary {
  const relicMap = new Map<string, { gains: number; plays: number; factions: Map<string, number> }>();
  let gamesWithRelicVp = 0;

  for (const game of games) {
    if (game.vpEvents.some(e => e.source === 'relic')) gamesWithRelicVp++;

    for (const e of game.relicEvents) {
      let entry = relicMap.get(e.relic);
      if (entry === undefined) {
        entry = { gains: 0, plays: 0, factions: new Map() };
        relicMap.set(e.relic, entry);
      }
      if (e.type === 'gain') {
        entry.gains++;
        entry.factions.set(e.faction, (entry.factions.get(e.faction) ?? 0) + 1);
      } else if (e.type === 'play') {
        entry.plays++;
      }
    }
  }

  const relics: RelicStatEntry[] = Array.from(relicMap.entries()).map(([relic, data]) => ({
    relic,
    gainCount: data.gains,
    playCount: data.plays,
    topFactions: Array.from(data.factions.entries())
      .map(([factionId, gainCount]) => ({ factionId, gainCount }))
      .sort((a, b) => b.gainCount - a.gainCount)
      .slice(0, 3),
  }));

  return {
    relics: relics.sort((a, b) => b.gainCount - a.gainCount),
    gamesWithRelicVp,
    totalGames: games.length,
  };
}
