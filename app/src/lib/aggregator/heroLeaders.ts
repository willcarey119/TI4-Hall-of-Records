/** Manually classified hero leader names from the playgroup's game-data corpus.
 *  TI Assistant exports do not tag leaders by tier — heroes must be enumerated
 *  by name. Update this set when a new hero appears in an upload.
 *
 *  Discovery (2026-04-28): the six-game corpus only contains `unlock` events;
 *  all unlocked leaders are Discordant Stars faction heroes. Standard TI4/PoK
 *  hero names are included proactively for future games.
 *
 *  Classification rule: in TI4, heroes have a unique "Hero" card back and are
 *  one-time-use (purged after activation). When in doubt, include the name —
 *  false positives just show activation stats for non-hero leaders, which is
 *  harmless.
 */
export const HERO_LEADERS: ReadonlySet<string> = new Set<string>([
  // ── Base TI4 + PoK heroes ──────────────────────────────────────────────
  'Jace X. 4th Air Legion',   // Federation of Sol
  'Iperia',                   // Mentak Coalition
  'Brother Omar',             // Yin Brotherhood
  'The Cavalry',              // Embers of Muaat
  'The Zeal',                 // Arborec
  "Rin, the Master's Legacy", // L1Z1X Mindnet
  'Mathis',                   // Winnu
  'The Oracle',               // Naalu Collective (also Nekro Virus uses same name in some versions)
  'Viscount Unlenn',          // Barony of Letnev
  'Gurno Aggero',             // Clan of Saar
  'I. I. Headlint',           // Universities of Jol-Nar
  'The Antikythera',          // Sardakk N'orr
  'Xxcha Hero',               // Xxcha Kingdom
  'Kyver, Blade and Key',     // Yssaril Tribes
  'Jae Mir Kan',              // Emirates of Hacan
  'Emissary Taivra',          // Ghosts of Creuss
  // PoK faction heroes
  'Mirik Aun Sissiri',        // Argent Flight
  'Xuange',                   // Empyrean
  'Rin, Master\'s Legacy',    // L1Z1X (alternate spelling)
  'The Nomad',                // Nomad
  'Rin',                      // L1Z1X short form
  'Acidos',                   // Naaz-Rokha Alliance
  'The Titans',               // Titans of Ul
  'The Nomad (Hero)',         // Nomad alternate
  'Adjudicator Baal',         // Mahact Gene-Sorcerers
  'Suffi An',                 // Mahact Gene-Sorcerers (Genetic Recorder)
  'Ggrucoto Ransen',          // Vuil'raith Cabal
  // ── Discordant Stars heroes (discovered in 6-game corpus) ──────────────
  '2RAM',                     // DS faction hero
  'Aello',                    // DS faction hero
  'Ahk Siever',               // DS faction hero
  'Dhume Tathu',              // DS faction hero
  'Elder Qanoj',              // DS faction hero
  'Gila the Silvertongue',    // DS faction hero
  'Kado Smah-Qar',           // DS faction hero
  'Queen Lorena',             // DS faction hero
  "S'Ula Mentarion",          // DS faction hero
  'So Ata',                   // DS faction hero
  'That Which Molds Flesh',   // DS faction hero
  'Vera Khage',               // DS faction hero
]);

export function isHeroLeader(name: string): boolean {
  return HERO_LEADERS.has(name);
}
