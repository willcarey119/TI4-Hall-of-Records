import type { ParsedGame } from '../parser/types';

export interface PlayerStat {
  canonicalName: string;
  rawNames: string[];
  gamesPlayed: number;
  wins: number;
  winRate: number;
  favoriteFaction: string | null;
}

export interface PlayerStatsSummary {
  players: PlayerStat[];
  totalRawNames: number;
}

/**
 * Scans all games and collects every distinct non-empty playerName string
 * from each faction. Returns them sorted alphabetically and deduplicated.
 */
export function collectAllRawNames(games: ParsedGame[]): string[] {
  const names = new Set<string>();

  for (const game of games) {
    for (const faction of game.factions) {
      const trimmed = faction.playerName.trim();
      if (trimmed !== '') {
        names.add(trimmed);
      }
    }
  }

  return [...names].sort();
}

/**
 * Groups raw playerNames by their canonical first-name mapping, computes
 * statistics (games played, wins, win rate, favorite faction), and returns
 * a summary sorted by gamesPlayed descending, then winRate descending.
 *
 * @param games - Array of parsed games to analyze
 * @param nameMap - Maps raw playerName → canonical first name (e.g., { "Tim L": "Tim" })
 * @returns Summary with aggregated player stats and total distinct raw names
 */
export function buildPlayerStats(
  games: ParsedGame[],
  nameMap: Record<string, string>
): PlayerStatsSummary {
  // Compute total raw names count first
  const totalRawNames = collectAllRawNames(games).length;

  // Filter nameMap to only valid canonical names (non-empty after trim)
  const validNameMap = new Map<string, string>();
  for (const [rawName, canonical] of Object.entries(nameMap)) {
    const trimmedCanonical = canonical.trim();
    if (trimmedCanonical !== '') {
      validNameMap.set(rawName, trimmedCanonical);
    }
  }

  // Group data by canonical name
  const playerData = new Map<
    string,
    {
      rawNames: Set<string>;
      gamesPlayed: number;
      wins: number;
      factionAppearances: Map<string, number>;
    }
  >();

  for (const game of games) {
    for (const faction of game.factions) {
      const trimmedPlayerName = faction.playerName.trim();
      const canonical = validNameMap.get(trimmedPlayerName);
      if (!canonical) continue; // Skip names not in the map

      let player = playerData.get(canonical);
      if (player === undefined) {
        player = {
          rawNames: new Set<string>(),
          gamesPlayed: 0,
          wins: 0,
          factionAppearances: new Map<string, number>(),
        };
        playerData.set(canonical, player);
      }

      player.rawNames.add(trimmedPlayerName);
      player.gamesPlayed += 1;

      if (game.winner === faction.factionId) {
        player.wins += 1;
      }

      const count = player.factionAppearances.get(faction.factionId) ?? 0;
      player.factionAppearances.set(faction.factionId, count + 1);
    }
  }

  // Build PlayerStat array
  const players: PlayerStat[] = [];

  for (const [canonicalName, data] of playerData) {
    const winRate = data.wins / data.gamesPlayed;

    // Find the faction with the most appearances; break ties alphabetically by factionId
    let favoriteFaction: string | null = null;
    let maxAppearances = 0;
    for (const [factionId, count] of data.factionAppearances) {
      if (count > maxAppearances || (count === maxAppearances && favoriteFaction !== null && factionId < favoriteFaction)) {
        maxAppearances = count;
        favoriteFaction = factionId;
      }
    }

    players.push({
      canonicalName,
      rawNames: [...data.rawNames].sort(),
      gamesPlayed: data.gamesPlayed,
      wins: data.wins,
      winRate,
      favoriteFaction,
    });
  }

  // Sort: gamesPlayed descending, then winRate descending
  players.sort((a, b) => {
    if (a.gamesPlayed !== b.gamesPlayed) {
      return b.gamesPlayed - a.gamesPlayed;
    }
    return b.winRate - a.winRate;
  });

  return { players, totalRawNames };
}
