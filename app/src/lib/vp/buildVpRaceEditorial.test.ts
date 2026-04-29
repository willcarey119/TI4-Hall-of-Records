import { describe, it, expect } from 'vitest';
import { buildVpRaceEditorial } from './buildVpRaceEditorial';
import type { FactionSetup } from '../parser/types';

function makeFaction(id: string, pos: number, color = '#aaa'): FactionSetup {
  return {
    factionId: id,
    playerName: 'Player',
    color,
    mapPosition: pos,
    startingTechs: [],
    startingPlanets: [],
  };
}

const FACTIONS: FactionSetup[] = [makeFaction('Sol', 0, 'blue'), makeFaction('Hacan', 1, 'gold')];
const OPTIONS: Record<string, unknown> = { victoryPoints: 10 };

describe('buildVpRaceEditorial', () => {
  it('returns headline / deckText / editorialProse fields', () => {
    const result = buildVpRaceEditorial({
      factions: FACTIONS,
      finalScores: { Sol: 7, Hacan: 10 },
      options: OPTIONS,
      totalRounds: 6,
    });
    expect(typeof result.headline).toBe('string');
    expect(typeof result.deckText).toBe('string');
    expect(typeof result.editorialProse).toBe('string');
  });

  it('headline names the winner when one exists', () => {
    const result = buildVpRaceEditorial({
      factions: FACTIONS,
      finalScores: { Sol: 7, Hacan: 10 },
      options: OPTIONS,
      totalRounds: 6,
    });
    expect(result.headline).toContain('Hacan');
    expect(result.headline.toLowerCase()).toContain('throne');
  });

  it('deckText mentions every faction final score when there is a winner', () => {
    const result = buildVpRaceEditorial({
      factions: FACTIONS,
      finalScores: { Sol: 7, Hacan: 10 },
      options: OPTIONS,
      totalRounds: 6,
    });
    expect(result.deckText).toContain('Sol 7');
    expect(result.deckText).toContain('Hacan 10');
  });

  it('editorialProse is non-trivial (>20 chars) when there is a winner', () => {
    const result = buildVpRaceEditorial({
      factions: FACTIONS,
      finalScores: { Sol: 7, Hacan: 10 },
      options: OPTIONS,
      totalRounds: 6,
    });
    expect(result.editorialProse.length).toBeGreaterThan(20);
  });

  it('reports the VP margin between winner and runner-up', () => {
    const result = buildVpRaceEditorial({
      factions: FACTIONS,
      finalScores: { Sol: 7, Hacan: 10 },
      options: OPTIONS,
      totalRounds: 6,
    });
    // 10 - 7 = 3
    expect(result.editorialProse).toContain('3');
  });

  // I-4: no-winner branch coverage
  it('no-winner branch — headline does not claim victory', () => {
    const result = buildVpRaceEditorial({
      factions: FACTIONS,
      finalScores: { Sol: 7, Hacan: 8 },
      options: OPTIONS,
      totalRounds: 6,
    });
    expect(result.headline.toLowerCase()).not.toContain('throne');
    expect(result.headline.length).toBeGreaterThan(0);
  });

  it('no-winner branch — deckText cites the leader and round count', () => {
    const result = buildVpRaceEditorial({
      factions: FACTIONS,
      finalScores: { Sol: 7, Hacan: 8 },
      options: OPTIONS,
      totalRounds: 6,
    });
    expect(result.deckText).toContain('Hacan');
    expect(result.deckText).toContain('8');
    expect(result.deckText).toContain('6');
  });

  it('no-winner branch — editorialProse mentions the victory threshold', () => {
    const result = buildVpRaceEditorial({
      factions: FACTIONS,
      finalScores: { Sol: 7, Hacan: 8 },
      options: OPTIONS,
      totalRounds: 6,
    });
    expect(result.editorialProse.length).toBeGreaterThan(20);
    expect(result.editorialProse).toContain('10');
  });

  it('zero-faction edge case — does not throw and returns non-empty strings', () => {
    const result = buildVpRaceEditorial({
      factions: [],
      finalScores: {},
      options: OPTIONS,
      totalRounds: 0,
    });
    expect(typeof result.headline).toBe('string');
    expect(typeof result.deckText).toBe('string');
    expect(typeof result.editorialProse).toBe('string');
    expect(result.headline.length).toBeGreaterThan(0);
    expect(result.deckText.length).toBeGreaterThan(0);
    expect(result.editorialProse.length).toBeGreaterThan(0);
  });

  it('reads victoryPoints from options (default 10)', () => {
    // With threshold raised to 14 and Hacan at 10, no winner.
    const result = buildVpRaceEditorial({
      factions: FACTIONS,
      finalScores: { Sol: 7, Hacan: 10 },
      options: { victoryPoints: 14 },
      totalRounds: 6,
    });
    expect(result.headline.toLowerCase()).not.toContain('throne');
    expect(result.editorialProse).toContain('14');
  });
});
