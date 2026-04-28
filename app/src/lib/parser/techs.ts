// Maps TI4 + PoK tech names to their color category.
// Colors correspond to TI4 tech schools:
//   green  = Biotic   (green prerequisite symbol)
//   blue   = Propulsion (blue prerequisite symbol)
//   yellow = Cybernetics (yellow prerequisite symbol)
//   red    = Warfare   (red prerequisite symbol)
//   unit   = Unit upgrade (no single color) or unknown
//
// IMPORTANT: Keys must match EXACTLY what TI Assistant exports in techEvents[i].tech.
// Unknown names gracefully return 'unit'.

export type TechColor = 'green' | 'blue' | 'yellow' | 'red' | 'unit';

const TECH_COLORS: Record<string, TechColor> = {
  // ── Biotic (green) ────────────────────────────────────────────────────────
  'Neural Motivator': 'green',
  'Psychoarchaeology': 'green',
  'Dacxive Animators': 'green',
  'Bio-Stims': 'green',
  'Hyper Metabolism': 'green',
  'Mageon Implants': 'green',
  'Neuroglaive': 'green',
  'Spacial Conduit Cylinder': 'green',
  'Instinct Training': 'green',
  'AI Development Algorithm': 'green',
  'Transparasteel Plating': 'green',
  'E-res Siphons': 'green',
  'Vortex': 'green',
  'Bioplasmics': 'green',
  'Genetic Recombination': 'green',
  'Production Biomes': 'green',
  'Valefar Assimilator X': 'green',
  'Valefar Assimilator Y': 'green',
  'Quantum Entanglement': 'green',
  'Wormhole Generator': 'green',
  'Pre-Fab Arcologies': 'green',
  'Hegemonic Trade Policy': 'green',

  // ── Propulsion (blue) ─────────────────────────────────────────────────────
  'Sling Relay': 'blue',
  'Fleet Logistics': 'blue',
  'Light-Wave Deflector': 'blue',
  'Aetherpassage': 'blue',
  'Mirror Computing': 'blue',
  'Transit Diodes': 'blue',
  'Impulse Core': 'blue',
  'Lazax Gate Folding': 'blue',
  'Aerie Hololattice': 'blue',
  'Chaos Mapping': 'blue',
  'Nullification Field': 'blue',
  'Wormhole Generator (Creuss)': 'blue',
  'Non-Euclidean Shielding': 'blue',
  'Quantum Datahub Node': 'blue',
  'Graviton Laser System': 'blue',

  // ── Cybernetics (yellow) ──────────────────────────────────────────────────
  'Sarween Tools': 'yellow',
  'Scanlink Drone Network': 'yellow',
  'Integrated Economy': 'yellow',
  'Predictive Intelligence': 'yellow',
  'Inheritance Systems': 'yellow',
  'Salvage Operations': 'yellow',
  'Yin Spinner': 'yellow',
  'L4 Disruptors': 'yellow',
  'Crimson Legionnaire II': 'yellow',
  'Memoria II': 'yellow',
  'Agency Supply Network': 'yellow',
  'Bio-Stims (Yin)': 'yellow',
  'Dimora Initiative': 'yellow',
  'Wormhole Generator II': 'yellow',
  'Encryption Codes': 'yellow',

  // ── Warfare (red) ─────────────────────────────────────────────────────────
  'Magen Defense Grid': 'red',
  'Duranium Armor': 'red',
  'Supercharge': 'red',
  'Plasma Scoring': 'red',
  'Assault Cannon': 'red',
  'Self-Assembly Routines': 'red',
  'Iff System': 'red',
  'Magmus Reactor': 'red',
  'Magmus Reactor II': 'red',
  'Valiant-Class Cruiser': 'red',
  'Strike Wing Ambuscade': 'red',
  'Tyrant': 'red',
  'Vortex (Yin)': 'red',
  'X-89 Bacterial Weapon': 'red',
  'Wormhole Generator (Mendak)': 'red',

  // ── Unit Upgrades (unit) ──────────────────────────────────────────────────
  'Carrier II': 'unit',
  'Cruiser II': 'unit',
  'Destroyer II': 'unit',
  'Dreadnought II': 'unit',
  'Fighter II': 'unit',
  'Infantry II': 'unit',
  'PDS II': 'unit',
  'Space Dock II': 'unit',
  'War Sun': 'unit',
  // Faction-specific unit upgrades
  'Exotrireme II': 'unit',
  'Memoria II (ship)': 'unit',
  'Saturn Engine II': 'unit',
  'Spec Ops II': 'unit',
  'Hybrid Crystal Fighter II': 'unit',
  'Super-Dreadnought II': 'unit',
  'Prototype War Sun II': 'unit',
  'Strike Wing Alpha II': 'unit',
  'Eidolon': 'unit',
  'Tyrant (unit)': 'unit',
  'Advance Carrier II': 'unit',
  'Floating Factory II': 'unit',
  'Hel-Titan II': 'unit',
  'Crimson Legionnaire II (unit)': 'unit',
  'Valiant-Class Cruiser (unit)': 'unit',
};

export function lookupTechColor(tech: string): TechColor {
  return TECH_COLORS[tech] ?? 'unit';
}
