import { describe, it, expect } from 'vitest';
import { getVictoryPointThreshold } from './options';

describe('getVictoryPointThreshold', () => {
  it('reads kebab-case key from real TI Assistant exports', () => {
    expect(getVictoryPointThreshold({ 'victory-points': 14 })).toBe(14);
  });

  it('reads camelCase key from legacy test fixtures', () => {
    expect(getVictoryPointThreshold({ victoryPoints: 8 })).toBe(8);
  });

  it('defaults to 10 when neither key is present', () => {
    expect(getVictoryPointThreshold({})).toBe(10);
  });

  it('defaults to 10 when value is not a number', () => {
    expect(getVictoryPointThreshold({ 'victory-points': 'ten' })).toBe(10);
  });

  it('prefers kebab-case over camelCase when both present', () => {
    expect(getVictoryPointThreshold({ 'victory-points': 12, victoryPoints: 10 })).toBe(12);
  });
});
