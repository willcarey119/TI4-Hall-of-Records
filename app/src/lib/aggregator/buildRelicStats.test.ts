import { describe, it, expect } from 'vitest';
import { buildRelicStats } from './buildRelicStats';
import type { ParsedGame, RelicEvent } from '../parser/types';

function makeGame(relicEvents: RelicEvent[], hasRelicVp = false): Partial<ParsedGame> {
  return {
    gameId: 'g1',
    relicEvents,
    vpEvents: hasRelicVp
      ? [{ faction: 'Sol', objective: 'Shard', points: 1, timestamp: 1, source: 'relic' }]
      : [],
    factions: [],
  };
}

describe('buildRelicStats', () => {
  it('returns empty for no games', () => {
    expect(buildRelicStats([]).relics).toHaveLength(0);
  });

  it('counts gain and play per relic', () => {
    const events: RelicEvent[] = [
      { faction: 'Sol', relic: 'Shard', timestamp: 1, type: 'gain' },
      { faction: 'Sol', relic: 'Shard', timestamp: 2, type: 'play' },
      { faction: 'Hacan', relic: 'Crown', timestamp: 3, type: 'gain' },
    ];
    const r = buildRelicStats([makeGame(events)] as ParsedGame[]);
    const shard = r.relics.find(r => r.relic === 'Shard');
    expect(shard?.gainCount).toBe(1);
    expect(shard?.playCount).toBe(1);
    const crown = r.relics.find(r => r.relic === 'Crown');
    expect(crown?.gainCount).toBe(1);
    expect(crown?.playCount).toBe(0);
  });

  it('counts games with relic VP', () => {
    const r = buildRelicStats([makeGame([], true), makeGame([], false)] as ParsedGame[]);
    expect(r.gamesWithRelicVp).toBe(1);
  });

  it('tracks which factions gained each relic', () => {
    const events: RelicEvent[] = [
      { faction: 'Sol', relic: 'Shard', timestamp: 1, type: 'gain' },
      { faction: 'Sol', relic: 'Shard', timestamp: 2, type: 'gain' },
      { faction: 'Hacan', relic: 'Shard', timestamp: 3, type: 'gain' },
    ];
    const r = buildRelicStats([makeGame(events)] as ParsedGame[]);
    const shard = r.relics.find(r => r.relic === 'Shard');
    const solEntry = shard?.topFactions.find(f => f.factionId === 'Sol');
    expect(solEntry?.gainCount).toBe(2);
  });
});
