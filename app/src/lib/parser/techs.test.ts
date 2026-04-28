import { describe, it, expect } from 'vitest';
import { lookupTechColor } from './techs';

describe('lookupTechColor', () => {
  it('returns "green" for a known Biotic tech', () => {
    expect(lookupTechColor('Neural Motivator')).toBe('green');
  });

  it('returns "blue" for a known Propulsion tech', () => {
    expect(lookupTechColor('Sling Relay')).toBe('blue');
  });

  it('returns "yellow" for a known Cybernetics tech', () => {
    expect(lookupTechColor('Sarween Tools')).toBe('yellow');
  });

  it('returns "red" for a known Warfare tech', () => {
    expect(lookupTechColor('Magen Defense Grid')).toBe('red');
  });

  it('returns "unit" for a known unit upgrade', () => {
    expect(lookupTechColor('Dreadnought II')).toBe('unit');
  });

  it('returns "unit" for an unknown tech name (graceful fallback)', () => {
    expect(lookupTechColor('Some Future Expansion Tech')).toBe('unit');
  });
});
