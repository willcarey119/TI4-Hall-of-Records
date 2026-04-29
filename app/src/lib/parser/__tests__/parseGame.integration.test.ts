// Reads all real TI Assistant exports and asserts Phase 1a smoke acceptance.
// NOT exact-score matching — that gating test happens in Phase 1 combined.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parseGame } from '../parseGame';

const GAME_DATA = join(process.cwd(), 'game-data');
const files = readdirSync(GAME_DATA).filter((f) => f.endsWith('.json'));

// V1.1 data triage: confirmed winners for all 7 games.
// All winners are now score-inferred. JSON files for LjnqDB/nMhFhJ/PgyXRx still contain
// a data.winner override field as a safety net, but score inference reaches the correct
// result on its own after V1.1 parser fixes (Imperial VP + agenda VP handlers).
const EXPECTED_WINNERS: Record<string, string> = {
  '1.11.25 Twilight Imperium Game.json': 'Universities of Jol-Nar',
  '1.19.25 TI Assistant JSON Game Data.json': "L'tokk Khrask",
  'LjnqDB_data (2).json': 'Council Keleres',       // Keleres 8 VP + 2 Imperial = 10 = threshold; override redundant
  'TIAssistant_Game Data.json': 'Kollecc Society',
  'nHg8Hw_data.json': 'Emirates of Hacan',
  'nMhFhJ_data (1).json': 'Crimson Rebellion',     // 12 VP = threshold; Prophecy of Ixth + Imperial now handled
  'PgyXRx_data.json': 'Titans of Ul',              // Covert Legislation + Imperial now handled; override redundant
};

describe('parseGame integration — all real game exports', () => {
  it('finds at least 7 game files', () => {
    expect(files.length).toBeGreaterThanOrEqual(7);
  });

  it.each(files)('%s — parses without throwing', (file) => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));
    expect(() => parseGame(raw)).not.toThrow();
  });

  it.each(files)('%s — vpEvents is non-empty', (file) => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));
    const result = parseGame(raw);
    expect(result.vpEvents.length).toBeGreaterThan(0);
  });

  it.each(files)('%s — finalScores has an entry for each faction', (file) => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));
    const result = parseGame(raw);
    expect(Object.keys(result.finalScores).length).toBe(result.factions.length);
  });

  it.each(files)('%s — agendaResolutions is structurally valid (votes/riders are arrays)', (file) => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));
    const result = parseGame(raw);
    for (const res of result.agendaResolutions) {
      expect(Array.isArray(res.votes)).toBe(true);
      expect(Array.isArray(res.riders)).toBe(true);
    }
  });

  it.each(files)('%s — winner matches confirmed ground truth', (file) => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));
    const result = parseGame(raw);
    const expected = EXPECTED_WINNERS[file];
    if (expected === undefined) {
      throw new Error(
        `No expected winner entry for "${file}" — add it to EXPECTED_WINNERS in the integration test.`,
      );
    }
    expect(result.winner).toBe(expected);
  });

  it.each(files)('%s — no "Unknown objective" warnings (dictionary is complete for real data)', (file) => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));
    const result = parseGame(raw);
    const objectiveWarnings = result.warnings.filter((w) => w.startsWith('Unknown objective'));
    if (objectiveWarnings.length > 0) {
      throw new Error(
        `Missing objective(s) for ${file}:\n${objectiveWarnings.join('\n')}\nAdd to src/lib/parser/objectives.ts`,
      );
    }
  });
});
