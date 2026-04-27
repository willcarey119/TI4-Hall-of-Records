// Reads the 6 real TI Assistant exports and asserts Phase 1a smoke acceptance.
// NOT exact-score matching — that gating test happens in Phase 1 combined.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parseGame } from '../parseGame';

const GAME_DATA = join(process.cwd(), 'game-data');
const files = readdirSync(GAME_DATA).filter((f) => f.endsWith('.json'));

describe('parseGame integration — all 6 real game exports', () => {
  it('finds at least 6 game files', () => {
    expect(files.length).toBeGreaterThanOrEqual(6);
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
