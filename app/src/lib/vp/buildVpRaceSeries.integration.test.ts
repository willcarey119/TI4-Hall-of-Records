// Integration test: for every real game export, the VP-Race chart series
// must agree, round-by-round, with the round-by-round scores table that
// RecapSection renders. Both must be driven by `buildRoundScores`.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parseGame } from '../parser/parseGame';
import { buildVpRaceSeries } from './buildVpRaceSeries';
import { buildRoundScores } from '../recap/buildRoundScores';
import { deriveRoundBoundaries } from '../aggregator/deriveRoundBoundaries';

const GAME_DATA = join(process.cwd(), 'game-data');
const files = readdirSync(GAME_DATA).filter(f => f.endsWith('.json'));

describe('buildVpRaceSeries integration — round-aligned chart matches scores table', () => {
  it.each(files)('%s — series points match buildRoundScores rows', (file) => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));
    const game = parseGame(raw);
    const boundaries = deriveRoundBoundaries(game.strategyCardEvents, game.factions.length);

    // Skip games where no boundaries could be derived — chart will only show
    // anchor points, which is correct behavior, but there's nothing to compare.
    if (boundaries.length === 0) return;

    const rows = buildRoundScores(game.vpEvents, game.factions, boundaries);
    const summary = buildVpRaceSeries(
      game.vpEvents,
      game.factions,
      game.finalScores,
      game.options,
      boundaries,
    );

    expect(summary.totalRounds).toBe(rows.length);

    for (const s of summary.series) {
      // First point is the anchor at round 0, 0 VP — the rest must mirror rows.
      expect(s.points[0]).toEqual({ round: 0, cumulativeVp: 0 });
      expect(s.points.length).toBe(rows.length + 1);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const point = s.points[i + 1];
        expect(point).toBeDefined();
        expect(row).toBeDefined();
        if (row === undefined || point === undefined) continue;
        expect(point.round).toBe(row.round);
        expect(point.cumulativeVp).toBe(row.scores[s.factionId] ?? 0);
      }
    }
  });

  it.each(files)('%s — terminal point cumulativeVp matches finalScores', (file) => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));
    const game = parseGame(raw);
    const boundaries = deriveRoundBoundaries(game.strategyCardEvents, game.factions.length);
    if (boundaries.length === 0) return;

    const summary = buildVpRaceSeries(
      game.vpEvents,
      game.factions,
      game.finalScores,
      game.options,
      boundaries,
    );

    for (const s of summary.series) {
      const last = s.points[s.points.length - 1];
      expect(last?.cumulativeVp).toBe(game.finalScores[s.factionId] ?? 0);
      expect(s.finalVp).toBe(game.finalScores[s.factionId] ?? 0);
    }
  });

  it.each(files)('%s — at least one faction has non-zero VP progression (no flat-line bug)', (file) => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));
    const game = parseGame(raw);
    const boundaries = deriveRoundBoundaries(game.strategyCardEvents, game.factions.length);
    if (boundaries.length === 0) return;

    const summary = buildVpRaceSeries(
      game.vpEvents,
      game.factions,
      game.finalScores,
      game.options,
      boundaries,
    );

    // For a real completed game, at least one faction must show VP gained between
    // adjacent rounds — i.e. the chart line must NOT be flat for everyone.
    const hasMovement = summary.series.some(s => {
      for (let i = 1; i < s.points.length; i++) {
        const prev = s.points[i - 1];
        const cur = s.points[i];
        if (prev !== undefined && cur !== undefined && cur.cumulativeVp !== prev.cumulativeVp) {
          return true;
        }
      }
      return false;
    });
    expect(hasMovement).toBe(true);
  });
});
