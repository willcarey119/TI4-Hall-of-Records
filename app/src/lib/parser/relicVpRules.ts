// Single source of truth for which relics grant or remove victory points.
// Both gameReducer.ts (which actually applies the score change) and
// buildGameStats.ts (which displays the "grants VP" badge) consume these sets,
// so they cannot drift out of sync — a relic's UI flag and its score
// behaviour will always agree.

/** Relics that grant +1 VP at the moment of GAIN_RELIC. */
export const VP_ON_GAIN_RELICS: ReadonlySet<string> = new Set([
  'Shard of the Throne',
]);

/** Relics that grant +1 VP at the moment of PLAY_RELIC. */
export const VP_ON_PLAY_RELICS: ReadonlySet<string> = new Set([
  'Crown of Emphidia',
  'The Crown of Emphidia',
]);

/** Relics that remove 1 VP at the moment of LOSE_RELIC.
 *  (Shard transfers between players — the loser drops the +1 they received on gain.) */
export const VP_ON_LOSE_RELICS: ReadonlySet<string> = new Set([
  'Shard of the Throne',
]);

/** Convenience predicate used by aggregators to flag VP-granting relics in UI lists. */
export function relicGrantsVp(relicName: string): boolean {
  return VP_ON_GAIN_RELICS.has(relicName) || VP_ON_PLAY_RELICS.has(relicName);
}
