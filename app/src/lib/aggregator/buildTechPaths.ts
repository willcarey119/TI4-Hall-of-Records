import type { ParsedGame } from '../parser/types';
import { lookupTechColor } from '../parser/techs';
import type { TechColor } from '../parser/techs';

const MAX_POSITIONS = 4;
const MIN_GAMES = 2;

export interface TechPathEntry {
  position: number;
  topTechs: Array<{ tech: string; count: number; color: TechColor }>;
}

export interface FactionTechPath {
  factionId: string;
  gamesAnalyzed: number;
  pathByPosition: TechPathEntry[];
}

export interface TechPathSummary {
  factions: FactionTechPath[];
}

export function buildTechPaths(games: ParsedGame[]): TechPathSummary {
  const data = new Map<string, Map<number, Map<string, number>>>();
  const gameCounts = new Map<string, number>();

  for (const game of games) {
    const factionsSeen = new Set<string>();
    for (const f of game.factions) {
      factionsSeen.add(f.factionId);
    }

    for (const factionId of factionsSeen) {
      const researched = game.techEvents
        .filter(e => e.faction === factionId && e.type === 'research')
        .sort((a, b) => a.timestamp - b.timestamp);

      gameCounts.set(factionId, (gameCounts.get(factionId) ?? 0) + 1);

      let posMap = data.get(factionId);
      if (posMap === undefined) {
        posMap = new Map();
        data.set(factionId, posMap);
      }

      for (let i = 0; i < Math.min(researched.length, MAX_POSITIONS); i++) {
        const tech = researched[i]?.tech;
        if (tech === undefined) continue;
        let techMap = posMap.get(i);
        if (techMap === undefined) {
          techMap = new Map();
          posMap.set(i, techMap);
        }
        techMap.set(tech, (techMap.get(tech) ?? 0) + 1);
      }
    }
  }

  const factions: FactionTechPath[] = [];

  for (const [factionId, posMap] of data) {
    const gamesAnalyzed = gameCounts.get(factionId) ?? 0;
    if (gamesAnalyzed < MIN_GAMES) continue;

    const pathByPosition: TechPathEntry[] = [];
    for (let pos = 0; pos < MAX_POSITIONS; pos++) {
      const techMap = posMap.get(pos);
      if (techMap === undefined || techMap.size === 0) continue;
      const topTechs = Array.from(techMap.entries())
        .map(([tech, count]) => ({ tech, count, color: lookupTechColor(tech) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      pathByPosition.push({ position: pos + 1, topTechs });
    }

    if (pathByPosition.length > 0) {
      factions.push({ factionId, gamesAnalyzed, pathByPosition });
    }
  }

  return { factions: factions.sort((a, b) => b.gamesAnalyzed - a.gamesAnalyzed) };
}
