export type ExpansionTag = 'base' | 'pok' | 'ds' | 'te';

/** Manually classified for the playgroup's 6-game corpus. Defaults to 'base'.
 *
 * Expansion guide:
 *  - base: 17 factions in the original TI4 box
 *  - pok:  Prophecy of Kings adds 7 factions (Argent, Empyrean, Mahact, Naaz-Rokha, Nomad, Titans, Vuil'raith).
 *          Council Keleres (PoK Codex III) is also tagged 'pok' — it's official content built on the PoK chassis
 *          rather than a base-game faction.
 *  - ds:   Discordant Stars adds ~34 fan-made factions
 *  - te:   Thunder's Edge / additional codex content (not yet seen in corpus)
 *
 * For unknown factions encountered in new uploads, default 'base' is fine — UI shows tag but does not change behavior. */
const EXPANSIONS: Record<string, ExpansionTag> = {
  // base (original 17)
  Arborec: 'base',
  'Barony of Letnev': 'base',
  'Embers of Muaat': 'base',
  'Emirates of Hacan': 'base',
  'Federation of Sol': 'base',
  'Ghosts of Creuss': 'base',
  'L1Z1X Mindnet': 'base',
  'Mentak Coalition': 'base',
  "Sardakk N'orr": 'base',
  'Universities of Jol-Nar': 'base',
  'Xxcha Kingdom': 'base',
  'Yssaril Tribes': 'base',
  // (Clan of Saar, Naalu Collective, Nekro Virus, Winnu, Yin Brotherhood — base factions not in corpus)

  // pok (Prophecy of Kings + Codex III)
  'Argent Flight': 'pok',
  'Naaz-Rokha Alliance': 'pok',
  'Titans of Ul': 'pok',
  "Vuil'raith Cabal": 'pok',
  'Council Keleres': 'pok', // PoK Codex III — classified pok rather than base
  // (Empyrean, Mahact Gene-Sorcerers, Nomad — pok factions not in corpus)

  // ds (Discordant Stars — fan-made)
  'Augurs of Ilyxum': 'ds',
  'Crimson Rebellion': 'ds',
  'Deepwrought Scholarate': 'ds',
  Firmament: 'ds',
  'Free Systems Compact': 'ds',
  'Kollecc Society': 'ds',
  'Kortali Tribunal': 'ds',
  "L'tokk Khrask": 'ds',
  'Li-Zho Dynasty': 'ds',
  'Nivyn Star Kings': 'ds',
  'Ral Nel Consortium': 'ds',
  'Vaden Banking Clans': 'ds',
  'Veldyr Sovereignty': 'ds',
};

export function getFactionExpansion(factionId: string): ExpansionTag {
  return EXPANSIONS[factionId] ?? 'base';
}
