import type { VpEvent, PlanetEvent, TechEvent, FactionSetup, VpSource } from '../parser/types';
import { lookupTechColor } from '../parser/techs';
import type { TechColor } from '../parser/techs';
import { getVictoryPointThreshold } from '../parser/options';

export interface ObjectiveScoredEntry {
  objective: string;
  points: number;
  source: VpSource;
}

export interface TechEntry {
  tech: string;
  color: TechColor;
}

export interface FactionDashboard {
  factionId: string;
  color: string;
  finalVp: number;
  isWinner: boolean;
  objectivesScored: ObjectiveScoredEntry[];
  techsResearched: TechEntry[];
  startingTechs: TechEntry[];
  planetsControlled: number;
}

export interface DashboardSummary {
  factions: FactionDashboard[];  // sorted by finalVp desc
  winner: string | null;         // factionId of winner, or null
  totalVpAwarded: number;
}

export function buildDashboardSummary(
  vpEvents: VpEvent[],
  planetEvents: PlanetEvent[],
  techEvents: TechEvent[],
  factions: FactionSetup[],
  finalScores: Record<string, number>,
  options: Record<string, unknown>,
): DashboardSummary {
  const victoryPoints = getVictoryPointThreshold(options);

  // Final planet ownership (last event per planet wins)
  const finalPlanetOwner: Record<string, string | null> = {};
  for (const event of planetEvents) {
    finalPlanetOwner[event.planet] =
      event.type === 'claim' ? event.faction : null;
  }
  const planetCounts: Record<string, number> = {};
  for (const owner of Object.values(finalPlanetOwner)) {
    if (owner !== null) {
      planetCounts[owner] = (planetCounts[owner] ?? 0) + 1;
    }
  }

  const factionDashboards: FactionDashboard[] = factions.map(f => {
    const finalVp = finalScores[f.factionId] ?? 0;
    const isWinner = finalVp >= victoryPoints;

    const objectivesScored: ObjectiveScoredEntry[] = vpEvents
      .filter(e => e.faction === f.factionId)
      .map(e => ({ objective: e.objective, points: e.points, source: e.source }));

    const techsResearched: TechEntry[] = techEvents
      .filter(e => e.faction === f.factionId && e.type === 'research')
      .map(e => ({ tech: e.tech, color: lookupTechColor(e.tech) }));

    const startingTechs: TechEntry[] = f.startingTechs.map(t => ({
      tech: t,
      color: lookupTechColor(t),
    }));

    return {
      factionId: f.factionId,
      color: f.color,
      finalVp,
      isWinner,
      objectivesScored,
      techsResearched,
      startingTechs,
      planetsControlled: planetCounts[f.factionId] ?? 0,
    };
  });

  factionDashboards.sort((a, b) => b.finalVp - a.finalVp);

  const winner = factionDashboards.find(d => d.isWinner)?.factionId ?? null;
  const totalVpAwarded = factionDashboards.reduce((sum, d) => sum + d.finalVp, 0);

  return { factions: factionDashboards, winner, totalVpAwarded };
}
