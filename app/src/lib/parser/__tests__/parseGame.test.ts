import { describe, it, expect } from 'vitest';
import { parseGame } from '../parseGame';

const minimalInput = () => ({
  data: {
    factions: [
      { id: 'Vaden Banking Clans', playerName: 'KP', color: 'Black' },
      { id: "L'tokk Khrask", playerName: 'Paul', color: 'Green' },
    ],
    speaker: 0,
    options: { 'victory-points': 10 },
  },
  timers: {
    game: 7200,
    'Vaden Banking Clans': 3600,
    "L'tokk Khrask": 3600,
    lastUpdate: 1737000000000,
  },
  actionLog: [],
});

describe('parseGame', () => {
  it('returns a ParsedGame with correct shape for minimal input', () => {
    const result = parseGame(minimalInput());
    expect(result.gameId).toBeTypeOf('string');
    expect(result.gameId.length).toBeGreaterThan(0);
    expect(result.factions).toHaveLength(2);
    expect(result.factions[0]?.factionId).toBe('Vaden Banking Clans');
    expect(result.factions[0]?.mapPosition).toBe(0);
    expect(result.factions[1]?.mapPosition).toBe(1);
    expect(result.initialSpeaker).toBe('Vaden Banking Clans');
    expect(result.vpEvents).toHaveLength(0);
    expect(result.finalScores).toEqual({ 'Vaden Banking Clans': 0, "L'tokk Khrask": 0 });
    expect(result.winner).toBeNull();
    expect(result.timers.game).toBe(7200);
    expect(result.timers.factions['Vaden Banking Clans']).toBe(3600);
    expect(result.options).toEqual({ 'victory-points': 10 });
  });

  it('throws when input is not an object', () => {
    expect(() => parseGame('nope')).toThrow('parseGame: expected an object');
    expect(() => parseGame(null)).toThrow('parseGame: expected an object');
    expect(() => parseGame(42)).toThrow('parseGame: expected an object');
  });

  it('normalizes wrapped log entries to flat RawLogEntry shape and sorts ascending by timestamp', () => {
    const input = {
      ...minimalInput(),
      actionLog: [
        { timestampMillis: 2000, data: { action: 'SCORE_OBJECTIVE', event: { faction: 'Vaden Banking Clans', objective: 'Lead from the Front' }, timestamp: 2000 }, gameSeconds: 200 },
        { timestampMillis: 1000, data: { action: 'SCORE_OBJECTIVE', event: { faction: "L'tokk Khrask", objective: 'Lead from the Front' }, timestamp: 1000 }, gameSeconds: 100 },
      ],
    };
    const result = parseGame(input);
    expect(result.vpEvents).toHaveLength(2);
    expect(result.vpEvents[0]?.faction).toBe("L'tokk Khrask"); // earlier timestamp
    expect(result.vpEvents[0]?.gameTime).toBe(100);
    expect(result.vpEvents[1]?.faction).toBe('Vaden Banking Clans');
  });

  it('identifies winner when a faction reaches the VP threshold', () => {
    const input = {
      ...minimalInput(),
      data: {
        ...minimalInput().data,
        options: { 'victory-points': 1 },
      },
      actionLog: [
        { timestampMillis: 1000, data: { action: 'SCORE_OBJECTIVE', event: { faction: 'Vaden Banking Clans', objective: 'Lead from the Front' }, timestamp: 1000 } },
      ],
    };
    const result = parseGame(input);
    expect(result.winner).toBe('Vaden Banking Clans');
  });

  it('returns null winner when no faction reaches the threshold', () => {
    const result = parseGame(minimalInput());
    expect(result.winner).toBeNull();
  });

  it('produces a stable gameId for the same input', () => {
    const a = parseGame(minimalInput());
    const b = parseGame(minimalInput());
    expect(a.gameId).toBe(b.gameId);
  });

  it('initialSpeaker resolves correctly for nonzero index', () => {
    const result = parseGame({
      ...minimalInput(),
      data: { ...minimalInput().data, speaker: 1 },
    });
    expect(result.initialSpeaker).toBe("L'tokk Khrask");
  });

  it('handles missing/malformed log entries gracefully (drops them)', () => {
    const input = {
      ...minimalInput(),
      actionLog: [
        null,
        'not an object',
        { timestampMillis: 1000 }, // missing data
        { data: 'not an object' },
        { data: { action: 'SCORE_OBJECTIVE', event: { faction: 'Vaden Banking Clans', objective: 'Lead from the Front' }, timestamp: 1000 } },
      ],
    };
    const result = parseGame(input);
    expect(result.vpEvents).toHaveLength(1);
  });
});
