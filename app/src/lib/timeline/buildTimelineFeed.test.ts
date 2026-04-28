import { describe, it, expect } from 'vitest';
import { buildTimelineFeed } from './buildTimelineFeed';
import type { VpEvent, AgendaResolution, ObjectiveReveal, PlanetEvent } from '../parser/types';

function makeVp(faction: string, points: number, ts: number): VpEvent {
  return { faction, objective: 'Pub-I', points, timestamp: ts, source: 'objective' };
}

function makeAgenda(agenda: string, outcome: string, ts: number): AgendaResolution {
  return { agenda, outcome, round: 2, timestamp: ts, votes: [], riders: [] };
}

function makeReveal(objective: string, ts: number): ObjectiveReveal {
  return { objective, stage: 'I', round: 2, timestamp: ts };
}

function makePlanetClaim(faction: string, planet: string, ts: number): PlanetEvent {
  return { faction, planet, prevOwner: null, timestamp: ts, type: 'claim' };
}

describe('buildTimelineFeed', () => {
  it('returns items sorted ascending by timestamp', () => {
    const events = [makeVp('Sol', 1, 300), makeVp('Hacan', 1, 100), makeReveal('Obj', 200)];
    const result = buildTimelineFeed(events, [], [], []);
    const timestamps = result.items.map(i => i.timestamp);
    expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));
  });

  it('VP events produce highlight items', () => {
    const result = buildTimelineFeed([makeVp('Sol', 1, 100)], [], [], []);
    expect(result.items[0]?.isHighlight).toBe(true);
    expect(result.items[0]?.type).toBe('vp');
  });

  it('agenda resolutions produce highlight items', () => {
    const result = buildTimelineFeed([], [makeAgenda('Mining Initiative', 'For', 100)], [], []);
    expect(result.items[0]?.isHighlight).toBe(true);
    expect(result.items[0]?.type).toBe('agenda');
  });

  it('FOR agenda outcome label is PASSED', () => {
    const result = buildTimelineFeed([], [makeAgenda('Mining Initiative', 'For', 100)], [], []);
    expect(result.items[0]?.label).toContain('PASSED');
  });

  it('AGAINST agenda outcome label is failed', () => {
    const result = buildTimelineFeed([], [makeAgenda('Wormhole Recon', 'Against', 100)], [], []);
    expect(result.items[0]?.label).toContain('failed');
  });

  it('elect agenda outcome (non-For/Against string) is treated as PASSED', () => {
    const result = buildTimelineFeed([], [makeAgenda('Imperial Arbiter', 'Sol', 100)], [], []);
    expect(result.items[0]?.label).toContain('PASSED');
  });

  it('objective reveals produce non-highlight items with type "objective"', () => {
    const result = buildTimelineFeed([], [], [makeReveal('Spend 8 Resources', 100)], []);
    expect(result.items[0]?.type).toBe('objective');
    expect(result.items[0]?.isHighlight).toBe(false);
  });

  it('Mecatol Rex claims produce highlight items with type "planet"', () => {
    const result = buildTimelineFeed([], [], [], [makePlanetClaim('Sol', 'Mecatol Rex', 100)]);
    expect(result.items[0]?.type).toBe('planet');
    expect(result.items[0]?.isHighlight).toBe(true);
  });

  it('non-Mecatol planet claims are excluded from the feed', () => {
    const result = buildTimelineFeed([], [], [], [makePlanetClaim('Sol', 'Vefut II', 100)]);
    expect(result.items).toHaveLength(0);
  });

  it('highlightCount matches items with isHighlight true', () => {
    const events = [makeVp('Sol', 1, 100), makeReveal('Obj', 200)];
    const result = buildTimelineFeed(events, [], [], []);
    expect(result.highlightCount).toBe(result.items.filter(i => i.isHighlight).length);
  });

  it('deckText is a non-empty string', () => {
    const result = buildTimelineFeed([makeVp('Sol', 1, 100)], [], [], []);
    expect(result.deckText.length).toBeGreaterThan(0);
  });

  it('handles empty inputs without throwing', () => {
    expect(() => buildTimelineFeed([], [], [], [])).not.toThrow();
  });
});
