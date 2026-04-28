import { describe, it, expect } from 'vitest';
import { buildPlayerStats, collectAllRawNames } from './buildPlayerStats';
import type { ParsedGame, FactionSetup } from '../parser/types';

function makeFaction(id: string, playerName: string): FactionSetup {
  return { factionId: id, playerName, color: '#aaa', mapPosition: 0, startingTechs: [], startingPlanets: [] };
}

function makeGame(opts: {
  gameId: string;
  factions: Array<{ id: string; playerName: string }>;
  finalScores: Record<string, number>;
  winner: string | null;
}): ParsedGame {
  return {
    gameId: opts.gameId, playedAt: 0, durationSeconds: 3600,
    factions: opts.factions.map(f => makeFaction(f.id, f.playerName)),
    options: {},
    initialSpeaker: opts.factions[0]?.id ?? '',
    phaseSnapshots: [], vpEvents: [], planetEvents: [], techEvents: [],
    agendaResolutions: [], strategyCardEvents: [], actionCardEvents: [], componentEvents: [],
    relicEvents: [], leaderEvents: [], objectiveReveals: [], speakerEvents: [],
    attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: [],
    expeditionEvents: [], secondaryEvents: [], actionEvents: [],
    finalScores: opts.finalScores, winner: opts.winner,
    timers: { game: 3600, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
  };
}

const g1 = makeGame({
  gameId: 'g1',
  factions: [
    { id: 'Sol', playerName: 'Tim' },
    { id: 'Barony', playerName: 'Jake' },
  ],
  finalScores: { Sol: 10, Barony: 7 },
  winner: 'Sol',
});

const g2 = makeGame({
  gameId: 'g2',
  factions: [
    { id: 'Hacan', playerName: 'Tim' },
    { id: 'Nekro', playerName: 'Jake' },
  ],
  finalScores: { Hacan: 7, Nekro: 10 },
  winner: 'Nekro',
});

const g3 = makeGame({
  gameId: 'g3',
  factions: [
    { id: 'Sol', playerName: 'Tim L' },
    { id: 'Arborec', playerName: 'Steve' },
  ],
  finalScores: { Sol: 10, Arborec: 5 },
  winner: 'Sol',
});

describe('collectAllRawNames', () => {
  it('returns empty array for empty games', () => {
    expect(collectAllRawNames([])).toEqual([]);
  });

  it('returns sorted, deduplicated names', () => {
    const result = collectAllRawNames([g1, g2]);
    expect(result).toEqual(['Jake', 'Tim']);
  });

  it('includes names from multiple games and deduplicates', () => {
    const result = collectAllRawNames([g1, g3]);
    expect(result).toEqual(['Jake', 'Steve', 'Tim', 'Tim L']);
  });
});

describe('buildPlayerStats', () => {
  it('returns no players when nameMap is empty', () => {
    const result = buildPlayerStats([g1, g2], {});
    expect(result.players).toEqual([]);
    expect(result.totalRawNames).toBe(2);
  });

  it('returns empty players for empty games', () => {
    const result = buildPlayerStats([], { Tim: 'Tim' });
    expect(result.players).toEqual([]);
    expect(result.totalRawNames).toBe(0);
  });

  it('aggregates single mapped name correctly', () => {
    const result = buildPlayerStats([g1, g2], { Tim: 'Tim' });
    expect(result.players).toHaveLength(1);
    const tim = result.players[0];
    expect(tim?.canonicalName).toBe('Tim');
    expect(tim?.gamesPlayed).toBe(2);
    expect(tim?.wins).toBe(1);
    expect(tim?.winRate).toBeCloseTo(0.5);
    expect(tim?.rawNames).toContain('Tim');
  });

  it('merges two raw names that map to the same canonical', () => {
    const result = buildPlayerStats([g1, g3], { Tim: 'Tim', 'Tim L': 'Tim' });
    expect(result.players).toHaveLength(1);
    const tim = result.players[0];
    expect(tim?.gamesPlayed).toBe(2);
    expect(tim?.wins).toBe(2);
    expect(tim?.winRate).toBe(1);
    expect(tim?.rawNames).toContain('Tim');
    expect(tim?.rawNames).toContain('Tim L');
  });

  it('determines favoriteFaction as not null when games exist', () => {
    const result = buildPlayerStats([g1, g2], { Tim: 'Tim' });
    expect(result.players[0]?.favoriteFaction).not.toBeNull();
  });

  it('favoriteFaction is the faction with the most appearances', () => {
    const result = buildPlayerStats([g1, g2, g3], { Tim: 'Tim', 'Tim L': 'Tim' });
    const tim = result.players[0];
    expect(tim?.favoriteFaction).toBe('Sol');
  });

  it('winRate is 0 when no wins', () => {
    const noWinGame = makeGame({
      gameId: 'x1',
      factions: [{ id: 'Letnev', playerName: 'Newbie' }],
      finalScores: { Letnev: 3 },
      winner: null,
    });
    const result = buildPlayerStats([noWinGame], { Newbie: 'Newbie' });
    expect(result.players[0]?.winRate).toBe(0);
    expect(result.players[0]?.wins).toBe(0);
  });

  it('ignores nameMap entries with blank canonical names', () => {
    const result = buildPlayerStats([g1], { Tim: '   ' });
    expect(result.players).toHaveLength(0);
  });

  it('totalRawNames counts distinct names across all games', () => {
    const result = buildPlayerStats([g1, g3], {});
    expect(result.totalRawNames).toBe(4);
  });

  it('sorts players by gamesPlayed descending', () => {
    // Tim appears in g1 + g2 + g3 = 3 games; Jake appears only in g1 + g2 = 2 games
    const result = buildPlayerStats([g1, g2, g3], { Tim: 'Tim', 'Tim L': 'Tim', Jake: 'Jake' });
    expect(result.players[0]?.canonicalName).toBe('Tim');
    expect(result.players[0]?.gamesPlayed).toBe(3);
    expect(result.players[1]?.canonicalName).toBe('Jake');
    expect(result.players[1]?.gamesPlayed).toBe(2);
  });
});
