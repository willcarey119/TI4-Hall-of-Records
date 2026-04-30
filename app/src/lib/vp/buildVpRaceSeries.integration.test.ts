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
  // Shared setup per game: parse + derive boundaries + build summary ONCE per file.
  // Three `it` blocks below assert against the same materialized objects.
  describe.each(files)('%s', (file) => {
    const raw = JSON.parse(readFileSync(join(GAME_DATA, file), 'utf-8'));
    const game = parseGame(raw);
    const boundaries = deriveRoundBoundaries(game.strategyCardEvents, game.factions.length);
    const hasBoundaries = boundaries.length > 0;
    const rows = hasBoundaries ? buildRoundScores(game.vpEvents, game.factions, boundaries) : [];
    const summary = buildVpRaceSeries({
      vpEvents: game.vpEvents,
      factions: game.factions,
      finalScores: game.finalScores,
      options: game.options,
      roundBoundaries: boundaries,
    });

    it('series points match buildRoundScores rows', () => {
      // Skip games where no boundaries could be derived — chart will only show
      // anchor points, which is correct behavior, but there's nothing to compare.
      if (!hasBoundaries) return;

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

    it('terminal point cumulativeVp matches last round logged score; finalVp matches finalScores', () => {
      if (!hasBoundaries) return;

      // cumulativeVp comes from buildRoundScores (vpEvents — logged data).
      // finalVp comes from game.finalScores (may include finalScoreOverrides for data-gap games).
      // These two intentionally diverge when finalScoreOverrides are applied.
      for (const s of summary.series) {
        const last = s.points[s.points.length - 1];
        const loggedScore = rows[rows.length - 1]?.scores[s.factionId] ?? 0;
        expect(last?.cumulativeVp).toBe(loggedScore);
        expect(s.finalVp).toBe(game.finalScores[s.factionId] ?? 0);
      }
    });

    it('at least one faction has non-zero VP progression (no flat-line bug)', () => {
      if (!hasBoundaries) return;

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
});
