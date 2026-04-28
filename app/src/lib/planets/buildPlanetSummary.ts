import type { PlanetEvent, FactionSetup } from '../parser/types';

export interface PlanetControlEntry {
  planet: string;
  factionId: string;
  changeCount: number;
  isMecatol: boolean;
}

export interface FactionPlanetInventory {
  factionId: string;
  color: string;
  planets: PlanetControlEntry[];
  totalPlanets: number;
}

export interface PlanetSummary {
  inventories: FactionPlanetInventory[];
  mecatol: PlanetControlEntry | null;
  contested: PlanetControlEntry[];
  totalControlled: number;
  deckText: string;
}

export function buildPlanetSummary(
  planetEvents: PlanetEvent[],
  factions: FactionSetup[],
): PlanetSummary {
  const finalOwner: Record<string, string | null> = {};
  const changeCounts: Record<string, number> = {};

  for (const event of planetEvents) {
    if (event.type === 'claim') {
      // prevOwner not null means it transferred between factions
      if (event.prevOwner !== null) {
        changeCounts[event.planet] = (changeCounts[event.planet] ?? 0) + 1;
      }
      finalOwner[event.planet] = event.faction;
    } else {
      // unclaim — planet returns to neutral
      if (finalOwner[event.planet] !== undefined && finalOwner[event.planet] !== null) {
        changeCounts[event.planet] = (changeCounts[event.planet] ?? 0) + 1;
      }
      finalOwner[event.planet] = null;
    }
  }

  // Bucket planets per faction
  const factionPlanets: Record<string, PlanetControlEntry[]> = {};
  for (const f of factions) {
    factionPlanets[f.factionId] = [];
  }

  for (const [planet, owner] of Object.entries(finalOwner)) {
    if (owner === null) continue;
    const arr = factionPlanets[owner];
    if (arr !== undefined) {
      arr.push({
        planet,
        factionId: owner,
        changeCount: changeCounts[planet] ?? 0,
        isMecatol: planet === 'Mecatol Rex',
      });
    }
  }

  // Sort each faction's list: Mecatol first, then alpha
  for (const arr of Object.values(factionPlanets)) {
    arr.sort((a, b) => {
      if (a.isMecatol) return -1;
      if (b.isMecatol) return 1;
      return a.planet.localeCompare(b.planet);
    });
  }

  // Build inventories ordered by mapPosition, exclude factions with 0 planets
  const inventories: FactionPlanetInventory[] = factions
    .slice()
    .sort((a, b) => a.mapPosition - b.mapPosition)
    .filter(f => (factionPlanets[f.factionId]?.length ?? 0) > 0)
    .map(f => {
      const planets = factionPlanets[f.factionId] ?? [];
      return { factionId: f.factionId, color: f.color, planets, totalPlanets: planets.length };
    });

  const allPlanets = inventories.flatMap(inv => inv.planets);
  const mecatol = allPlanets.find(p => p.isMecatol) ?? null;
  const contested = allPlanets.filter(p => p.changeCount >= 2);
  const totalControlled = allPlanets.length;

  const leader = inventories.reduce<FactionPlanetInventory | undefined>(
    (max, inv) => (max === undefined || inv.totalPlanets > max.totalPlanets ? inv : max),
    undefined,
  );
  const deckText =
    leader !== undefined
      ? `${leader.factionId} controlled the most territory with ${leader.totalPlanets} planets.`
      : `${totalControlled} planets controlled across ${inventories.length} factions.`;

  return { inventories, mecatol, contested, totalControlled, deckText };
}
