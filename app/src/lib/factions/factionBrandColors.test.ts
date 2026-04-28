import { describe, it, expect } from 'vitest';
import { getFactionBrandColor, FACTION_BRAND_COLORS } from './factionBrandColors';

describe('FACTION_BRAND_COLORS', () => {
  const STANDARD_FACTIONS = [
    'Arborec', 'Argent Flight', 'Barony of Letnev', 'Clan of Saar',
    'Council Keleres', 'Embers of Muaat', 'Emirates of Hacan', 'Empyrean',
    'Federation of Sol', 'Ghosts of Creuss', 'L1Z1X Mindnet', 'Mahact Gene-Sorcerers',
    'Mentak Coalition', 'Naalu Collective', 'Naaz-Rokha Alliance', 'Nekro Virus',
    'Nomad', "Sardakk N'orr", 'Titans of Ul', 'Universities of Jol-Nar',
    "Vuil'raith Cabal", 'Winnu', 'Xxcha Kingdom', 'Yin Brotherhood', 'Yssaril Tribes',
  ];

  it('has an entry for every standard TI4 faction', () => {
    for (const id of STANDARD_FACTIONS) {
      expect(FACTION_BRAND_COLORS[id], `missing color for ${id}`).toBeDefined();
    }
  });

  it('all color values are valid 6-digit hex strings', () => {
    for (const [id, color] of Object.entries(FACTION_BRAND_COLORS)) {
      expect(color, `invalid hex for ${id}`).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('getFactionBrandColor', () => {
  it('returns the brand color for a known faction', () => {
    expect(getFactionBrandColor('Arborec', '#ffffff')).toBe('#2d6a4f');
  });

  it('returns the fallback for an unknown faction', () => {
    expect(getFactionBrandColor('Unknown Faction', '#abcdef')).toBe('#abcdef');
  });

  it('handles Mahact with hyphen variant', () => {
    expect(getFactionBrandColor('Mahact Gene-Sorcerers', '#ffffff')).toBe('#c8b010');
  });

  it('handles Mahact without hyphen variant', () => {
    expect(getFactionBrandColor('Mahact Gene Sorcerers', '#ffffff')).toBe('#c8b010');
  });
});
