import { describe, it, expect } from 'vitest';
import { formatDuration, formatDate, formatGameTitle, formatKicker } from './formatters';

describe('formatDuration', () => {
  it('formats whole hours and zero minutes', () => {
    expect(formatDuration(14400)).toBe('4h 00m');
  });
  it('pads single-digit minutes', () => {
    expect(formatDuration(3660)).toBe('1h 01m');
  });
  it('handles hours + minutes', () => {
    expect(formatDuration(18720)).toBe('5h 12m');
  });
});

describe('formatDate', () => {
  it('returns a human-readable date string', () => {
    // 2023-11-15T00:00:00Z in UTC — locale formatting varies; just check parts
    const result = formatDate(1700006400000);
    expect(result).toMatch(/2023/);
    expect(result).toMatch(/Nov/);
  });
});

describe('formatGameTitle', () => {
  it('names the winner and VP total', () => {
    expect(formatGameTitle('Sol', { Sol: 10, Hacan: 8 })).toBe(
      'Sol Seizes the Throne at 10 VP'
    );
  });
  it('returns fallback for null winner', () => {
    expect(formatGameTitle(null, {})).toBe('Game Concluded');
  });
  it('falls back to 0 when winner score is missing', () => {
    expect(formatGameTitle('Sol', {})).toBe('Sol Seizes the Throne at 0 VP');
  });
});

describe('formatKicker', () => {
  it('combines date and duration', () => {
    const result = formatKicker(1700006400000, 14400);
    expect(result).toMatch(/2023/);
    expect(result).toContain('4h 00m');
  });
});
