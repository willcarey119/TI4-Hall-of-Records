import { describe, it, expect } from 'vitest';
import { buildTechSummary } from './buildTechSummary';
import type { TechEvent, FactionSetup } from '../parser/types';

const makeFaction = (id: string, map = 0): FactionSetup => ({
  factionId: id, playerName: 'P', color: '#aaa',
  mapPosition: map, startingTechs: [], startingPlanets: [],
});

const makeTechEvent = (
  faction: string,
  tech: string,
  type: TechEvent['type'],
  timestamp: number,
): TechEvent => ({ faction, tech, type, timestamp });

describe('buildTechSummary', () => {
  it('timeline contains only "research" type events, sorted by timestamp', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Neural Motivator', 'research', 2000),
      makeTechEvent('Hacan', 'Sarween Tools', 'starting', 100),
      makeTechEvent('Sol', 'Bio-Stims', 'research', 1000),
    ];
    const result = buildTechSummary(events, [makeFaction('Sol'), makeFaction('Hacan')], []);
    expect(result.timeline).toHaveLength(2);
    expect(result.timeline[0]?.tech).toBe('Bio-Stims');
    expect(result.timeline[1]?.tech).toBe('Neural Motivator');
  });

  it('timeline entries have correct factionId', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Bio-Stims', 'research', 1000),
    ];
    const result = buildTechSummary(events, [makeFaction('Sol')], []);
    expect(result.timeline[0]?.factionId).toBe('Sol');
  });

  it('assigns tech color via lookupTechColor', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Sarween Tools', 'research', 1000),
    ];
    const result = buildTechSummary(events, [makeFaction('Sol')], []);
    expect(result.timeline[0]?.color).toBe('yellow');
  });

  it('inventories include both research and starting techs', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Neural Motivator', 'starting', 100),
      makeTechEvent('Sol', 'Bio-Stims', 'research', 1000),
    ];
    const result = buildTechSummary(events, [makeFaction('Sol')], []);
    expect(result.inventories[0]?.techs).toHaveLength(2);
  });

  it('inventory techs carry origin field', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Neural Motivator', 'starting', 100),
      makeTechEvent('Sol', 'Bio-Stims', 'research', 1000),
    ];
    const result = buildTechSummary(events, [makeFaction('Sol')], []);
    const techs = result.inventories[0]?.techs ?? [];
    expect(techs.find(t => t.tech === 'Neural Motivator')?.origin).toBe('starting');
    expect(techs.find(t => t.tech === 'Bio-Stims')?.origin).toBe('research');
  });

  it('inventories are ordered by faction mapPosition', () => {
    const events: TechEvent[] = [
      makeTechEvent('Hacan', 'Sarween Tools', 'research', 1000),
      makeTechEvent('Sol', 'Bio-Stims', 'research', 2000),
    ];
    const result = buildTechSummary(
      events,
      [makeFaction('Sol', 1), makeFaction('Hacan', 0)],
      [],
    );
    expect(result.inventories[0]?.factionId).toBe('Hacan');
    expect(result.inventories[1]?.factionId).toBe('Sol');
  });

  it('totalResearched counts only research events', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Neural Motivator', 'starting', 100),
      makeTechEvent('Sol', 'Bio-Stims', 'research', 1000),
      makeTechEvent('Sol', 'Sarween Tools', 'research', 2000),
    ];
    const result = buildTechSummary(events, [makeFaction('Sol')], []);
    expect(result.totalResearched).toBe(2);
  });

  it('totalStarting counts only starting events', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Neural Motivator', 'starting', 100),
      makeTechEvent('Hacan', 'Sarween Tools', 'starting', 101),
      makeTechEvent('Sol', 'Bio-Stims', 'research', 1000),
    ];
    const result = buildTechSummary(
      events,
      [makeFaction('Sol'), makeFaction('Hacan')],
      [],
    );
    expect(result.totalStarting).toBe(2);
  });

  it('ignores remove and purge events in timeline and totals', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Bio-Stims', 'research', 1000),
      makeTechEvent('Sol', 'Bio-Stims', 'purge', 2000),
    ];
    const result = buildTechSummary(events, [makeFaction('Sol')], []);
    expect(result.totalResearched).toBe(1);
    expect(result.timeline).toHaveLength(1);
  });

  it('deckText is a non-empty string', () => {
    const events: TechEvent[] = [
      makeTechEvent('Sol', 'Bio-Stims', 'research', 1000),
    ];
    const result = buildTechSummary(events, [makeFaction('Sol')], []);
    expect(typeof result.deckText).toBe('string');
    expect(result.deckText.length).toBeGreaterThan(0);
  });
});
