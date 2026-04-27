// src/lib/parser/objectives.ts
// Static dictionary of objectives known to appear in TI Assistant exports.
// Keys are EXACT strings as they appear in real game data (case-sensitive).
// Built from Task 0 discover-data output (60 unique objective strings)
// cross-referenced with the official TI4 wiki classifications.

import type { ObjectiveStage } from './types';

export interface ObjectiveDefinition {
  stage: ObjectiveStage;
  points: number;
}

const OBJECTIVES: Record<string, ObjectiveDefinition> = {
  // ── Stage I Public — Base TI4 (10 × 1 VP) ─────────────────────────────
  'Corner the Market': { stage: 'I', points: 1 },
  'Develop Weaponry': { stage: 'I', points: 1 },
  'Diversify Research': { stage: 'I', points: 1 },
  'Erect a Monument': { stage: 'I', points: 1 },
  'Expand Borders': { stage: 'I', points: 1 },
  'Found Research Outposts': { stage: 'I', points: 1 },
  'Intimidate Council': { stage: 'I', points: 1 },
  'Lead from the Front': { stage: 'I', points: 1 },
  'Negotiate Trade Routes': { stage: 'I', points: 1 },
  'Sway the Council': { stage: 'I', points: 1 },

  // ── Stage I Public — PoK (10 × 1 VP) ──────────────────────────────────
  'Amass Wealth': { stage: 'I', points: 1 },
  'Build Defenses': { stage: 'I', points: 1 },
  'Discover Lost Outposts': { stage: 'I', points: 1 },
  'Engineer a Marvel': { stage: 'I', points: 1 },
  'Explore Deep Space': { stage: 'I', points: 1 },
  'Improve Infrastructure': { stage: 'I', points: 1 },
  'Make History': { stage: 'I', points: 1 },
  'Populate the Outer Rim': { stage: 'I', points: 1 },
  'Push Boundaries': { stage: 'I', points: 1 },
  'Raise a Fleet': { stage: 'I', points: 1 },

  // ── Stage II Public — Base TI4 (10 × 2 VP) ────────────────────────────
  'Centralize Galactic Trade': { stage: 'II', points: 2 },
  'Conquer the Weak': { stage: 'II', points: 2 },
  'Form Galactic Brain Trust': { stage: 'II', points: 2 },
  'Found a Golden Age': { stage: 'II', points: 2 },
  'Galvanize the People': { stage: 'II', points: 2 },
  'Manipulate Galactic Law': { stage: 'II', points: 2 },
  'Master the Sciences': { stage: 'II', points: 2 },
  'Revolutionize Warfare': { stage: 'II', points: 2 },
  'Subdue the Galaxy': { stage: 'II', points: 2 },
  'Unify the Colonies': { stage: 'II', points: 2 },

  // ── Stage II Public — PoK (10 × 2 VP) ─────────────────────────────────
  'Achieve Supremacy': { stage: 'II', points: 2 },
  'Become a Legend': { stage: 'II', points: 2 },
  'Command an Armada': { stage: 'II', points: 2 },
  'Construct Massive Cities': { stage: 'II', points: 2 },
  'Control the Borderlands': { stage: 'II', points: 2 },
  'Hold Vast Reserves': { stage: 'II', points: 2 },
  'Patrol Vast Territories': { stage: 'II', points: 2 },
  'Protect the Border': { stage: 'II', points: 2 },
  'Reclaim Ancient Monuments': { stage: 'II', points: 2 },
  'Rule Distant Lands': { stage: 'II', points: 2 },

  // ── Secret — Action Phase, Base TI4 (5 × 1 VP) ────────────────────────
  'Destroy Their Greatest Ship': { stage: 'secret', points: 1 },
  'Make an Example of Their World': { stage: 'secret', points: 1 },
  'Spark a Rebellion': { stage: 'secret', points: 1 },
  'Turn Their Fleets to Dust': { stage: 'secret', points: 1 },
  'Unveil Flagship': { stage: 'secret', points: 1 },

  // ── Secret — Action Phase, PoK (7 × 1 VP) ─────────────────────────────
  'Become a Martyr': { stage: 'secret', points: 1 },
  'Betray a Friend': { stage: 'secret', points: 1 },
  'Brave the Void': { stage: 'secret', points: 1 },
  'Darken the Skies': { stage: 'secret', points: 1 },
  'Demonstrate Your Power': { stage: 'secret', points: 1 },
  'Fight With Precision': { stage: 'secret', points: 1 },
  'Prove Endurance': { stage: 'secret', points: 1 },

  // ── Secret — Status Phase, Base TI4 (15 × 1 VP) ───────────────────────
  'Adapt New Strategies': { stage: 'secret', points: 1 },
  'Become the Gatekeeper': { stage: 'secret', points: 1 },
  'Control the Region': { stage: 'secret', points: 1 },
  'Cut Supply Lines': { stage: 'secret', points: 1 },
  'Establish a Perimeter': { stage: 'secret', points: 1 },
  'Forge an Alliance': { stage: 'secret', points: 1 },
  'Form a Spy Network': { stage: 'secret', points: 1 },
  'Fuel the War Machine': { stage: 'secret', points: 1 },
  'Gather a Mighty Fleet': { stage: 'secret', points: 1 },
  'Learn the Secrets of the Cosmos': { stage: 'secret', points: 1 },
  'Master the Laws of Physics': { stage: 'secret', points: 1 },
  'Mine Rare Metals': { stage: 'secret', points: 1 },
  'Monopolize Production': { stage: 'secret', points: 1 },
  'Occupy the Seat of the Empire': { stage: 'secret', points: 1 },
  'Threaten Enemies': { stage: 'secret', points: 1 },

  // ── Secret — Status Phase, PoK (11 × 1 VP) ────────────────────────────
  'Defy Space and Time': { stage: 'secret', points: 1 },
  'Destroy Heretical Works': { stage: 'secret', points: 1 },
  'Establish Hegemony': { stage: 'secret', points: 1 },
  'Foster Cohesion': { stage: 'secret', points: 1 },
  'Hoard Raw Materials': { stage: 'secret', points: 1 },
  'Mechanize the Military': { stage: 'secret', points: 1 },
  'Occupy the Fringe': { stage: 'secret', points: 1 },
  'Produce En Masse': { stage: 'secret', points: 1 },
  'Seize an Icon': { stage: 'secret', points: 1 },
  'Stake your Claim': { stage: 'secret', points: 1 },
  'Strengthen Bonds': { stage: 'secret', points: 1 },

  // ── Secret — Agenda Phase, PoK (2 × 1 VP) ─────────────────────────────
  'Dictate Policy': { stage: 'secret', points: 1 },
  'Drive the Debate': { stage: 'secret', points: 1 },

  // ── Special VP Sources ────────────────────────────────────────────────
  'Support for the Throne': { stage: 'support', points: 1 },
  'Custodians Token': { stage: 'other', points: 1 },
  'Shard of the Throne': { stage: 'relic', points: 1 },
  'Crown of Emphidia': { stage: 'relic', points: 1 },
  'Imperial Rider': { stage: 'agenda', points: 1 },
  // Seed of an Empire: in some TI Assistant versions this is emitted as a
  // SCORE_OBJECTIVE (1 VP to the winning faction) rather than RESOLVE_AGENDA.
  // The RESOLVE_AGENDA handler in gameReducer.ts handles the leader/trailer
  // VP swap when the full agenda resolution is present; this entry covers the
  // simpler SCORE_OBJECTIVE representation.
  'Seed of an Empire': { stage: 'agenda', points: 1 },

  // ── Discordant Stars (proactively added; not yet seen in 6 exports) ──
  'Styx': { stage: 'legendary', points: 1 },
};

/** Returns the definition for a known objective, or null if unrecognised.
 *  Caller is responsible for appending a warning when null is returned. */
export function getObjectivePoints(name: string): ObjectiveDefinition | null {
  return OBJECTIVES[name] ?? null;
}
