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
const EXPECTED_WINNERS: Record<string, string | null> = {
  '1.11.25 Twilight Imperium Game.json': 'Universities of Jol-Nar',
  '1.19.25 TI Assistant JSON Game Data.json': "L'tokk Khrask",
  'LjnqDB_data (2).json': 'Council Keleres',       // Keleres 8 VP + 2 Imperial = 10 = threshold; override redundant
  // Winner confirmed from TIAssistant_VP Chart.png + Objectives.png screenshots.
  // Log is missing some VP events; data.winner override in the JSON carries the ground truth.
  'TIAssistant_Game Data.json': 'Kollecc Society',
  'nHg8Hw_data.json': 'Emirates of Hacan',
  'nMhFhJ_data (1).json': 'Crimson Rebellion',     // 12 VP = threshold; Prophecy of Ixth + Imperial now handled
  'PgyXRx_data.json': 'Titans of Ul',              // imperialVPOverrides:{Titans:0} — table didn't apply the 2 eligible Imperial VPs
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

  it('PgyXRx_data.json — confirmed final scores from screenshot', () => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, 'PgyXRx_data.json'), 'utf-8'));
    const result = parseGame(raw);
    // All confirmed from TI Assistant Objectives screenshot (6-player 14-pt game)
    expect(result.finalScores['Titans of Ul']).toBe(14);       // ✓ log-derived (was 15 before SFT fix)
    expect(result.finalScores['Yssaril Tribes']).toBe(5);      // ✓ log-derived
    expect(result.finalScores['Arborec']).toBe(10);            // finalScoreOverride (log incomplete)
    expect(result.finalScores['Naaz-Rokha Alliance']).toBe(13); // finalScoreOverride
    expect(result.finalScores["Sardakk N'orr"]).toBe(13);      // finalScoreOverride
    expect(result.finalScores['Ral Nel Consortium']).toBe(12); // finalScoreOverride
  });

  it('TIAssistant_Game Data.json — confirmed final scores from screenshot', () => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, 'TIAssistant_Game Data.json'), 'utf-8'));
    const result = parseGame(raw);
    // All confirmed from TIAssistant_VP Chart.png + Objectives.png screenshots (6-player 14-pt game)
    expect(result.finalScores['Kollecc Society']).toBe(14);    // finalScoreOverride (log missing VP)
    expect(result.finalScores['Xxcha Kingdom']).toBe(12);      // ✓ log-derived
    expect(result.finalScores['Kortali Tribunal']).toBe(12);   // ✓ log-derived
    expect(result.finalScores['Li-Zho Dynasty']).toBe(12);     // finalScoreOverride (parser overcounted)
    expect(result.finalScores['Nivyn Star Kings']).toBe(11);   // finalScoreOverride (parser overcounted)
    expect(result.finalScores['Veldyr Sovereignty']).toBe(10); // ✓ log-derived
  });

  it('produces at least one source: support_for_throne VpEvent across the dataset (V1.1 B4 regression guard)', () => {
    let total = 0;
    for (const file of files) {
      const raw = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));
      const result = parseGame(raw);
      total += result.vpEvents.filter((e) => e.source === 'support_for_throne').length;
    }
    // 6 of the 7 games contain Support for the Throne plays in the raw log; combined the
    // dataset must surface a healthy non-zero count rather than the pre-fix 0.
    expect(total).toBeGreaterThan(10);
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
