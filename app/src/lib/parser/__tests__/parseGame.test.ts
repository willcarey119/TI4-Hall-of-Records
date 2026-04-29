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

  // ── startswith enrichment from SETUP ADVANCE_PHASE ───────────────────────

  it('populates startingPlanets and startingTechs from the SETUP ADVANCE_PHASE event', () => {
    const input = {
      ...minimalInput(),
      actionLog: [
        {
          timestampMillis: 0,
          gameSeconds: 0,
          data: {
            action: 'ADVANCE_PHASE',
            timestamp: 0,
            event: {
              state: { phase: 'SETUP', round: 1, speaker: 'Vaden Banking Clans', paused: false },
              factions: {
                'Vaden Banking Clans': {
                  startswith: {
                    planets: ['Vaden', 'Arcturus'],
                    techs: ['Sarween Tools', 'Scanlink Drone Network'],
                    units: { Carrier: 2 },
                  },
                },
                "L'tokk Khrask": {
                  startswith: {
                    planets: ['Xxehan', 'Cwehers'],
                    techs: ['Neural Motivator'],
                    units: { Carrier: 2 },
                  },
                },
              },
              strategycards: {},
            },
          },
        },
      ],
    };
    const result = parseGame(input);
    expect(result.factions[0]?.startingPlanets).toEqual(['Vaden', 'Arcturus']);
    expect(result.factions[0]?.startingTechs).toEqual(['Sarween Tools', 'Scanlink Drone Network']);
    expect(result.factions[1]?.startingPlanets).toEqual(['Xxehan', 'Cwehers']);
    expect(result.factions[1]?.startingTechs).toEqual(['Neural Motivator']);
  });

  it('takes initialSpeaker from event.state.speaker in the SETUP ADVANCE_PHASE (more reliable than raw.data.speaker index)', () => {
    const input = {
      ...minimalInput(),
      data: { ...minimalInput().data, speaker: 0 }, // index says Vaden, but event says L'tokk
      actionLog: [
        {
          timestampMillis: 0,
          gameSeconds: 0,
          data: {
            action: 'ADVANCE_PHASE',
            timestamp: 0,
            event: {
              state: { phase: 'SETUP', round: 1, speaker: "L'tokk Khrask", paused: false },
              factions: {},
              strategycards: {},
            },
          },
        },
      ],
    };
    const result = parseGame(input);
    expect(result.initialSpeaker).toBe("L'tokk Khrask");
  });

  it('seeds currentOwners from startingPlanets so first claim on a home system has the correct prevOwner', () => {
    const input = {
      ...minimalInput(),
      actionLog: [
        {
          timestampMillis: 0,
          gameSeconds: 0,
          data: {
            action: 'ADVANCE_PHASE',
            timestamp: 0,
            event: {
              state: { phase: 'SETUP', round: 1, speaker: 'Vaden Banking Clans', paused: false },
              factions: {
                'Vaden Banking Clans': {
                  startswith: { planets: ['Vaden'], techs: [], units: {} },
                },
              },
              strategycards: {},
            },
          },
        },
        // Opponent conquers Vaden mid-game
        {
          timestampMillis: 1000,
          gameSeconds: 500,
          data: {
            action: 'CLAIM_PLANET',
            timestamp: 1000,
            event: { faction: "L'tokk Khrask", planet: 'Vaden' },
          },
        },
      ],
    };
    const result = parseGame(input);
    const claimEvent = result.planetEvents.find((e) => e.planet === 'Vaden');
    expect(claimEvent?.prevOwner).toBe('Vaden Banking Clans'); // not null
  });

  it('falls back to empty arrays when SETUP ADVANCE_PHASE is absent', () => {
    const result = parseGame(minimalInput());
    expect(result.factions[0]?.startingPlanets).toEqual([]);
    expect(result.factions[0]?.startingTechs).toEqual([]);
  });

  it('falls back to raw.data.speaker index when no SETUP ADVANCE_PHASE is present', () => {
    const result = parseGame({
      ...minimalInput(),
      data: { ...minimalInput().data, speaker: 1 },
    });
    expect(result.initialSpeaker).toBe("L'tokk Khrask");
  });

  it('handles SETUP ADVANCE_PHASE with missing factions field gracefully', () => {
    const input = {
      ...minimalInput(),
      actionLog: [
        {
          timestampMillis: 0,
          gameSeconds: 0,
          data: {
            action: 'ADVANCE_PHASE',
            timestamp: 0,
            event: {
              state: { phase: 'SETUP', round: 1, speaker: 'Vaden Banking Clans', paused: false },
              // no 'factions' key
              strategycards: {},
            },
          },
        },
      ],
    };
    const result = parseGame(input);
    expect(result.factions[0]?.startingPlanets).toEqual([]);
    expect(result.factions[0]?.startingTechs).toEqual([]);
    expect(result.initialSpeaker).toBe('Vaden Banking Clans'); // speaker still extracted
  });

  it('data.winner override is used instead of score inference when present', () => {
    // Game has no scoring events so score inference would return null,
    // but data.winner override should return the specified faction.
    const input = {
      ...minimalInput(),
      data: {
        ...minimalInput().data,
        winner: 'Vaden Banking Clans',
      },
    };
    const result = parseGame(input);
    expect(result.winner).toBe('Vaden Banking Clans');
  });

  it('data.winner override takes precedence over score inference even when inference would succeed', () => {
    // Vaden would win by score, but override points to L'tokk.
    const input = {
      ...minimalInput(),
      data: {
        ...minimalInput().data,
        options: { 'victory-points': 1 },
        winner: "L'tokk Khrask",
      },
      actionLog: [
        { timestampMillis: 1000, data: { action: 'SCORE_OBJECTIVE', event: { faction: 'Vaden Banking Clans', objective: 'Lead from the Front' }, timestamp: 1000 } },
      ],
    };
    const result = parseGame(input);
    expect(result.winner).toBe("L'tokk Khrask");
  });

  it('data.winner override is ignored when it is an empty string', () => {
    // Empty string is not a valid factionId — fall back to score inference.
    const input = {
      ...minimalInput(),
      data: {
        ...minimalInput().data,
        options: { 'victory-points': 1 },
        winner: '',
      },
      actionLog: [
        { timestampMillis: 1000, data: { action: 'SCORE_OBJECTIVE', event: { faction: 'Vaden Banking Clans', objective: 'Lead from the Front' }, timestamp: 1000 } },
      ],
    };
    const result = parseGame(input);
    expect(result.winner).toBe('Vaden Banking Clans');
  });
});

// ── imperialVPOverrides ──────────────────────────────────────────────────────
// data.imperialVPOverrides: Record<factionId, number>
// Lets game JSON correct the parser when TI Assistant records an eligible
// Imperial use (faction owned Mecatol Rex) but the table did not apply the VP.
// Adjusts both finalScores AND vpEvents to stay consistent.

/** Builds a wrapped END_TURN action log entry for an Imperial card use. */
function makeImperialTurn(faction: string, ts: number) {
  return {
    timestampMillis: ts,
    gameSeconds: ts / 100,
    data: {
      action: 'END_TURN',
      timestamp: ts,
      event: { prevFaction: faction, selectedAction: 'Imperial', secondaries: {} },
    },
  };
}

/** Builds a SETUP ADVANCE_PHASE entry that seeds Mecatol Rex as a starting planet
 *  for the given faction.  Using startingPlanets avoids firing a CLAIM_PLANET event,
 *  so the Custodians Token VP is NOT granted — tests stay focused on Imperial VP only. */
function setupWithMecatol(faction: string) {
  return {
    timestampMillis: 0,
    gameSeconds: 0,
    data: {
      action: 'ADVANCE_PHASE',
      timestamp: 0,
      event: {
        state: { phase: 'SETUP', round: 1, speaker: faction, paused: false },
        factions: {
          [faction]: { startswith: { planets: ['Mecatol Rex'], techs: [], units: {} } },
        },
        strategycards: {},
      },
    },
  };
}

describe('parseGame — imperialVPOverrides', () => {
  it('overriding to 0 removes all imperial_point vpEvents and adjusts finalScores', () => {
    const input = {
      ...minimalInput(),
      data: { ...minimalInput().data, imperialVPOverrides: { 'Vaden Banking Clans': 0 } },
      actionLog: [
        setupWithMecatol('Vaden Banking Clans'),
        makeImperialTurn('Vaden Banking Clans', 200),
      ],
    };
    const result = parseGame(input);
    expect(result.vpEvents.filter((e) => e.source === 'imperial_point')).toHaveLength(0);
    expect(result.finalScores['Vaden Banking Clans']).toBe(0);
  });

  it('overriding to 0 removes only imperial_point events, leaving other VP sources intact', () => {
    const input = {
      ...minimalInput(),
      data: { ...minimalInput().data, imperialVPOverrides: { 'Vaden Banking Clans': 0 } },
      actionLog: [
        setupWithMecatol('Vaden Banking Clans'),
        { timestampMillis: 150, gameSeconds: 1, data: { action: 'SCORE_OBJECTIVE', timestamp: 150, event: { faction: 'Vaden Banking Clans', objective: 'Lead from the Front' } } },
        makeImperialTurn('Vaden Banking Clans', 200),
      ],
    };
    const result = parseGame(input);
    expect(result.finalScores['Vaden Banking Clans']).toBe(1); // objective only, not Imperial
    expect(result.vpEvents.filter((e) => e.source === 'imperial_point')).toHaveLength(0);
    expect(result.vpEvents.filter((e) => e.source === 'score_objective')).toHaveLength(1);
  });

  it('overriding to 1 when 2 exist removes the most recent imperial_point event', () => {
    const input = {
      ...minimalInput(),
      data: { ...minimalInput().data, imperialVPOverrides: { 'Vaden Banking Clans': 1 } },
      actionLog: [
        setupWithMecatol('Vaden Banking Clans'),
        makeImperialTurn('Vaden Banking Clans', 200),
        makeImperialTurn('Vaden Banking Clans', 300),
      ],
    };
    const result = parseGame(input);
    expect(result.vpEvents.filter((e) => e.source === 'imperial_point')).toHaveLength(1);
    expect(result.finalScores['Vaden Banking Clans']).toBe(1);
  });

  it('override is a no-op when the computed count already matches', () => {
    const input = {
      ...minimalInput(),
      data: { ...minimalInput().data, imperialVPOverrides: { 'Vaden Banking Clans': 1 } },
      actionLog: [
        setupWithMecatol('Vaden Banking Clans'),
        makeImperialTurn('Vaden Banking Clans', 200),
      ],
    };
    const result = parseGame(input);
    expect(result.vpEvents.filter((e) => e.source === 'imperial_point')).toHaveLength(1);
    expect(result.finalScores['Vaden Banking Clans']).toBe(1);
  });

  it('does not affect other factions when only one faction is overridden', () => {
    const input = {
      ...minimalInput(),
      data: { ...minimalInput().data, imperialVPOverrides: { 'Vaden Banking Clans': 0 } },
      actionLog: [
        setupWithMecatol('Vaden Banking Clans'),
        makeImperialTurn('Vaden Banking Clans', 200),
      ],
    };
    const result = parseGame(input);
    expect(result.finalScores["L'tokk Khrask"]).toBe(0); // untouched
  });

  it('absent imperialVPOverrides field leaves normal Imperial VP computation unchanged', () => {
    const input = {
      ...minimalInput(),
      actionLog: [
        setupWithMecatol('Vaden Banking Clans'),
        makeImperialTurn('Vaden Banking Clans', 200),
      ],
    };
    const result = parseGame(input);
    expect(result.finalScores['Vaden Banking Clans']).toBe(1);
    expect(result.vpEvents.filter((e) => e.source === 'imperial_point')).toHaveLength(1);
  });

  it('positive-delta override (target > parser count) does NOT modify scores and emits a warning', () => {
    // Parser computes 1 Imperial VP for Vaden. Override asks for 3 (delta = +2).
    // Positive delta is currently unsupported because synthesizing VP events would
    // require fabricated timestamps; instead we preserve the invariant
    // (finalScores ≡ Σ vpEvents.points per faction) and warn loudly.
    const input = {
      ...minimalInput(),
      data: { ...minimalInput().data, imperialVPOverrides: { 'Vaden Banking Clans': 3 } },
      actionLog: [
        setupWithMecatol('Vaden Banking Clans'),
        makeImperialTurn('Vaden Banking Clans', 200),
      ],
    };
    const result = parseGame(input);
    // Score and vpEvents are both unchanged from the parser's natural count of 1.
    expect(result.finalScores['Vaden Banking Clans']).toBe(1);
    expect(result.vpEvents.filter((e) => e.source === 'imperial_point')).toHaveLength(1);
    // A warning is emitted so the unsupported case is visible.
    expect(
      result.warnings.some(
        (w) => w.includes('imperialVPOverrides') && w.includes('Vaden Banking Clans'),
      ),
    ).toBe(true);
  });

  it('winner computed from adjusted scores (not raw computed scores)', () => {
    // Vaden gets 2 Imperial VPs → score=2, threshold=2 → normally wins.
    // Override to 1 → score=1 < 2 → no winner.
    const input = {
      ...minimalInput(),
      data: {
        ...minimalInput().data,
        options: { 'victory-points': 2 },
        imperialVPOverrides: { 'Vaden Banking Clans': 1 },
      },
      actionLog: [
        setupWithMecatol('Vaden Banking Clans'),
        makeImperialTurn('Vaden Banking Clans', 200),
        makeImperialTurn('Vaden Banking Clans', 300),
      ],
    };
    const result = parseGame(input);
    expect(result.winner).toBeNull(); // adjusted score (1) doesn't reach threshold (2)
  });
});
