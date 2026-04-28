export const FACTION_BRAND_COLORS: Record<string, string> = {
  // Base game (17)
  'Arborec':                   '#2d6a4f',
  'Barony of Letnev':          '#7a1c1c',
  'Clan of Saar':              '#8b7d2a',
  'Embers of Muaat':           '#d44418',
  'Emirates of Hacan':         '#c8900c',
  'Federation of Sol':         '#1a5eb0',
  'Ghosts of Creuss':          '#1a4ab5',
  'L1Z1X Mindnet':             '#3a0c14',
  'Mentak Coalition':          '#8a4c10',
  'Naalu Collective':          '#1a8a3a',
  'Nekro Virus':               '#a01010',
  "Sardakk N'orr":             '#3a1010',
  'Universities of Jol-Nar':  '#1a30a0',
  'Winnu':                     '#c07a18',
  'Xxcha Kingdom':             '#1a7a6a',
  'Yin Brotherhood':           '#50188a',
  'Yssaril Tribes':            '#5a7820',

  // PoK (7 + Council Keleres)
  'Argent Flight':             '#d97c2b',
  'Council Keleres':           '#9a7840',
  'Empyrean':                  '#6b2fb0',
  'Mahact Gene-Sorcerers':     '#c8b010',
  'Mahact Gene Sorcerers':     '#c8b010',
  'Naaz-Rokha Alliance':       '#5a8a18',
  'Nomad':                     '#3030a0',
  'Titans of Ul':              '#c04a7a',
  "Vuil'raith Cabal":          '#6a0c18',

  // Discordant Stars factions seen in playgroup corpus
  'Augurs of Ilyxum':          '#9a7030',
  'Crimson Rebellion':         '#a01818',
  'Deepwrought Scholarate':    '#1a3a8a',
  'Firmament':                 '#3a90c8',
  'Free Systems Compact':      '#2a8a5a',
  'Kollecc Society':           '#7a3a2a',
  'Kortali Tribunal':          '#5a3a7a',
  "L'tokk Khrask":             '#7a5a2a',
  'Li-Zho Dynasty':            '#c83a1a',
  'Nivyn Star Kings':          '#c8a020',
  'Ral Nel Consortium':        '#5a8a3a',
  'Vaden Banking Clans':       '#9a8a1a',
  'Veldyr Sovereignty':        '#3a1a6a',
};

export function getFactionBrandColor(factionId: string, fallback: string): string {
  return FACTION_BRAND_COLORS[factionId] ?? fallback;
}
