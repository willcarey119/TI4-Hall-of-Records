import type { PlanetEvent, FactionSetup } from '../parser/types';
import type { RoundBoundary } from '../aggregator/deriveRoundBoundaries';

export interface MecatolRoundEntry {
  round: number;
  factionId: string | null;
  color: string | null;
}

export interface MecatolTimeline {
  rounds: MecatolRoundEntry[];
  totalRounds: number;
  claimedInGame: boolean;
}

export function buildMecatolTimeline(
  planetEvents: PlanetEvent[],
  factions: FactionSetup[],
  roundBoundaries: RoundBoundary[],
): MecatolTimeline {
  if (roundBoundaries.length === 0) {
    return { rounds: [], totalRounds: 0, claimedInGame: false };
  }

  const colorLookup: Record<string, string> = {};
  for (const f of factions) {
    colorLookup[f.factionId] = f.color;
  }

  const mecatolEvents = planetEvents
    .filter(e => e.planet === 'Mecatol Rex')
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp);

  const sorted = roundBoundaries.slice().sort((a, b) => a.round - b.round);

  const rounds: MecatolRoundEntry[] = sorted.map(boundary => {
    // Walk all events up to boundary.startTimestamp of the NEXT round (exclusive),
    // i.e. all events that occurred at or before the boundary's own start
    // plus events between this boundary start and the next boundary start.
    // The spec says: find all events with timestamp <= boundary.startTimestamp of THIS
    // round boundary. But boundaries use startTimestamp of each round, not endTimestamp.
    // We need all events that happened before the NEXT round started.
    // Derive endTimestamp: everything up to (but not including) the next boundary's start.
    const nextBoundary = sorted.find(b => b.round === boundary.round + 1);
    const endTimestamp = nextBoundary !== undefined ? nextBoundary.startTimestamp - 1 : Infinity;

    let currentOwner: string | null = null;
    for (const e of mecatolEvents) {
      if (e.timestamp > endTimestamp) break;
      if (e.type === 'claim') {
        currentOwner = e.faction;
      } else {
        currentOwner = null;
      }
    }

    return {
      round: boundary.round,
      factionId: currentOwner,
      color: currentOwner !== null ? (colorLookup[currentOwner] ?? null) : null,
    };
  });

  const claimedInGame = rounds.some(r => r.factionId !== null);

  return { rounds, totalRounds: sorted.length, claimedInGame };
}
