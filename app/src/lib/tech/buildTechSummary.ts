import { lookupTechColor } from '../parser/techs';
import type { TechColor } from '../parser/techs';
import type { TechEvent, FactionSetup, PhaseSnapshot } from '../parser/types';

export interface TechTimelineEntry {
  round: number;
  factionId: string;
  tech: string;
  color: TechColor;
  type: 'research';
}

export interface FactionTechInventoryItem {
  tech: string;
  color: TechColor;
  origin: 'research' | 'starting';
}

export interface FactionTechInventory {
  factionId: string;
  techs: FactionTechInventoryItem[];
}

export interface TechSummary {
  timeline: TechTimelineEntry[];
  inventories: FactionTechInventory[];
  totalResearched: number;
  totalStarting: number;
  deckText: string;
}

export interface RoundBoundary {
  round: number;
  phaseStartTimestamp: number;
}

/** Derive round boundaries from phaseSnapshots.
 *  PhaseSnapshot has no timestamp — this is an extension point for callers
 *  that have timestamp-augmented snapshots. Returns empty array as default. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function deriveRoundBoundaries(_snapshots: PhaseSnapshot[]): RoundBoundary[] {
  return [];
}

function assignRound(timestamp: number, boundaries: RoundBoundary[]): number {
  if (boundaries.length === 0) return 0;
  let round = boundaries[0]?.round ?? 0;
  for (const b of boundaries) {
    if (b.phaseStartTimestamp <= timestamp) round = b.round;
    else break;
  }
  return round;
}

export function buildTechSummary(
  techEvents: TechEvent[],
  factions: FactionSetup[],
  _phaseSnapshots: PhaseSnapshot[],
  roundBoundaries: RoundBoundary[] = [],
): TechSummary {
  const sorted = [...techEvents].sort((a, b) => a.timestamp - b.timestamp);

  // Build timeline: research events only
  const timeline: TechTimelineEntry[] = sorted
    .filter((e) => e.type === 'research')
    .map((e) => ({
      round: assignRound(e.timestamp, roundBoundaries),
      factionId: e.faction,
      tech: e.tech,
      color: lookupTechColor(e.tech),
      type: 'research' as const,
    }));

  // Build per-faction inventories ordered by mapPosition
  const factionsSorted = [...factions].sort((a, b) => a.mapPosition - b.mapPosition);
  const inventories: FactionTechInventory[] = factionsSorted.map((faction) => {
    const techs: FactionTechInventoryItem[] = sorted
      .filter((e): e is TechEvent & { type: 'research' | 'starting' } =>
        e.faction === faction.factionId && (e.type === 'research' || e.type === 'starting')
      )
      .map((e) => ({
        tech: e.tech,
        color: lookupTechColor(e.tech),
        origin: e.type,
      }));
    return { factionId: faction.factionId, techs };
  });

  const totalResearched = sorted.filter((e) => e.type === 'research').length;
  const totalStarting   = sorted.filter((e) => e.type === 'starting').length;

  // Deck text: faction with most researched techs leads
  const researchCounts: Record<string, number> = {};
  for (const e of sorted.filter((e) => e.type === 'research')) {
    researchCounts[e.faction] = (researchCounts[e.faction] ?? 0) + 1;
  }
  const sortedFactions = Object.entries(researchCounts).sort(([, a], [, b]) => b - a);
  let deckText: string;
  if (sortedFactions.length === 0) {
    deckText = 'No technologies researched this game.';
  } else if (sortedFactions.length >= 2 && sortedFactions[0]![1] === sortedFactions[1]![1]) {
    deckText = `${totalResearched} technologies researched across ${factions.length} factions.`;
  } else {
    const [leader, count] = sortedFactions[0]!;
    deckText = `${leader} led the tech race with ${count} technolog${count === 1 ? 'y' : 'ies'} researched.`;
  }

  return { timeline, inventories, totalResearched, totalStarting, deckText };
}
