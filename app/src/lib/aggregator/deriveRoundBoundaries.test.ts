import { describe, it, expect } from 'vitest';
import { deriveRoundBoundaries, assignRound } from './deriveRoundBoundaries';
import type { StrategyCardEvent } from '../parser/types';

function pick(faction: string, card: string, timestamp: number): StrategyCardEvent {
  return { faction, card, timestamp, type: 'pick' };
}

describe('deriveRoundBoundaries', () => {
  it('returns one boundary per chunk of factionCount picks', () => {
    const events: StrategyCardEvent[] = [
      pick('A', 'Lead', 100), pick('B', 'Tech', 110), pick('C', 'War', 120),
      pick('A', 'Imp', 1000), pick('B', 'Pol', 1010), pick('C', 'Diplo', 1020),
    ];
    const result = deriveRoundBoundaries(events, 3);
    expect(result).toEqual([
      { round: 1, startTimestamp: 100 },
      { round: 2, startTimestamp: 1000 },
    ]);
  });

  it('sorts pick events by timestamp before chunking', () => {
    const events: StrategyCardEvent[] = [
      pick('B', 'Tech', 110), pick('C', 'War', 120), pick('A', 'Lead', 100),
    ];
    const result = deriveRoundBoundaries(events, 3);
    expect(result[0]?.startTimestamp).toBe(100);
  });

  it('ignores non-pick strategy card events', () => {
    const events: StrategyCardEvent[] = [
      { faction: 'A', card: 'Lead', timestamp: 50, type: 'play_primary' },
      pick('A', 'Lead', 100), pick('B', 'Tech', 110),
    ];
    const result = deriveRoundBoundaries(events, 2);
    expect(result).toEqual([{ round: 1, startTimestamp: 100 }]);
  });

  it('returns [] for empty events', () => {
    expect(deriveRoundBoundaries([], 4)).toEqual([]);
  });

  it('emits a final boundary even when last chunk is smaller than factionCount', () => {
    const events: StrategyCardEvent[] = [
      pick('A', 'Lead', 100), pick('B', 'Tech', 110), pick('C', 'War', 120),
      pick('A', 'Imp', 1000), // partial round 2
    ];
    const result = deriveRoundBoundaries(events, 3);
    expect(result).toEqual([
      { round: 1, startTimestamp: 100 },
      { round: 2, startTimestamp: 1000 },
    ]);
  });
});

describe('assignRound', () => {
  const boundaries = [
    { round: 1, startTimestamp: 100 },
    { round: 2, startTimestamp: 1000 },
    { round: 3, startTimestamp: 2000 },
  ];

  it('returns round 1 for timestamps before all boundaries (setup events)', () => {
    expect(assignRound(50, boundaries)).toBe(1);
  });

  it('returns the latest round whose startTimestamp <= timestamp', () => {
    expect(assignRound(100, boundaries)).toBe(1);
    expect(assignRound(500, boundaries)).toBe(1);
    expect(assignRound(1000, boundaries)).toBe(2);
    expect(assignRound(1500, boundaries)).toBe(2);
    expect(assignRound(2500, boundaries)).toBe(3);
  });

  it('returns final round for post-game timestamps', () => {
    expect(assignRound(99999, boundaries)).toBe(3);
  });

  it('returns 1 for any timestamp when boundaries are empty', () => {
    expect(assignRound(500, [])).toBe(1);
  });
});
