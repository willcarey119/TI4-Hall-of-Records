import type { PlanetEvent, FactionSetup } from '../parser/types';
import type { RoundBoundary } from './deriveRoundBoundaries';

export interface FactionRoundTerritory {
  factionId: string;
  planets: string[];
  planetCount: number;
  /** Planets newly held this round (not held at end of previous round). */
  gained: string[];
  /** Planets held at end of previous round but not at end of this round. */
  lost: string[];
}

export interface RoundTerritory {
  round: number;
  factions: FactionRoundTerritory[];
}

/**
 * Reconstructs per-faction planet holdings at the end of each round.
 *
 * For each round boundary, replays all planetEvents with timestamp < nextRoundStart
 * (or all events for the last round). Then diffs against the previous round's state
 * to compute gained / lost arrays.
 *
 * Round 1 includes the initial startingPlanets PLUS any events that fired before
 * round 2 begins.
 */
export function buildTerritoryByRound(
  planetEvents: PlanetEvent[],
  factions: FactionSetup[],
  roundBoundaries: RoundBoundary[],
): RoundTerritory[] {
  if (roundBoundaries.length === 0) return [];

  const sortedEvents = planetEvents.slice().sort((a, b) => a.timestamp - b.timestamp);
  const sortedRounds = roundBoundaries.slice().sort((a, b) => a.startTimestamp - b.startTimestamp);

  // Initialize current owners from starting planets
  const currentOwners: Record<string, string | null> = {};
  for (const f of factions) {
    for (const planet of f.startingPlanets) {
      currentOwners[planet] = f.factionId;
    }
  }

  const results: RoundTerritory[] = [];
  // Round 1's "previous" state is the starting setup (so starting planets aren't
  // counted as gained in R1; only events that fire during R1 count as gained).
  let prevSnapshot: Record<string, Set<string>> = {};
  for (const f of factions) {
    prevSnapshot[f.factionId] = new Set(f.startingPlanets);
  }

  let eventIdx = 0;

  for (let i = 0; i < sortedRounds.length; i++) {
    const nextRound = sortedRounds[i + 1];
    // Inclusive upper bound for "events that have fired by end of this round"
    // = all events up to (but not including) the next round's startTimestamp
    const upperExclusive = nextRound !== undefined ? nextRound.startTimestamp : Infinity;

    while (eventIdx < sortedEvents.length) {
      const ev = sortedEvents[eventIdx];
      if (ev === undefined || ev.timestamp >= upperExclusive) break;
      if (ev.type === 'claim') {
        currentOwners[ev.planet] = ev.faction;
      } else {
        currentOwners[ev.planet] = null;
      }
      eventIdx++;
    }

    // Build per-faction snapshot from currentOwners
    const factionPlanets: Record<string, string[]> = {};
    for (const f of factions) {
      factionPlanets[f.factionId] = [];
    }
    for (const [planet, owner] of Object.entries(currentOwners)) {
      if (owner === null) continue;
      const arr = factionPlanets[owner];
      if (arr !== undefined) arr.push(planet);
    }

    // Diff against prevSnapshot
    const factionEntries: FactionRoundTerritory[] = factions.map(f => {
      const planets = factionPlanets[f.factionId] ?? [];
      const planetSet = new Set(planets);
      const prev = prevSnapshot[f.factionId] ?? new Set();
      const gained = planets.filter(p => !prev.has(p));
      const lost = [...prev].filter(p => !planetSet.has(p));
      return {
        factionId: f.factionId,
        planets: planets.slice().sort(),
        planetCount: planets.length,
        gained,
        lost,
      };
    });

    const round = sortedRounds[i];
    if (round !== undefined) {
      results.push({ round: round.round, factions: factionEntries });
    }

    // Update prevSnapshot for next iteration
    const newSnapshot: Record<string, Set<string>> = {};
    for (const f of factions) {
      newSnapshot[f.factionId] = new Set(factionPlanets[f.factionId] ?? []);
    }
    prevSnapshot = newSnapshot;
  }

  return results;
}
