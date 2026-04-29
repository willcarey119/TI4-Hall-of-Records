import type { ParsedGame } from '../parser/types';
import { getVictoryPointThreshold } from '../parser/options';

/**
 * Editorial copy block for the VP Race section.
 *
 * Pure function of `factions`, `finalScores`, `options`, and the round count.
 * Lives separately from `buildVpRaceSeries` so the chart-data builder can stay
 * focused on time-series math; this builder owns the prose layer only.
 */
export interface VpRaceEditorial {
  headline: string;
  deckText: string;
  editorialProse: string;
}

export type BuildVpRaceEditorialInput = Pick<ParsedGame, 'factions' | 'finalScores' | 'options'> & {
  totalRounds: number;
};

export function buildVpRaceEditorial(input: BuildVpRaceEditorialInput): VpRaceEditorial {
  const { factions, finalScores, options, totalRounds } = input;
  const victoryPoints = getVictoryPointThreshold(options);

  const ordered = factions
    .slice()
    .sort((a, b) => a.mapPosition - b.mapPosition)
    .map(f => ({
      factionId: f.factionId,
      finalVp: finalScores[f.factionId] ?? 0,
      isWinner: (finalScores[f.factionId] ?? 0) >= victoryPoints,
    }));

  const winner = ordered.find(s => s.isWinner);
  const sortedByVp = [...ordered].sort((a, b) => b.finalVp - a.finalVp);
  const leader = sortedByVp[0];
  const secondVp = sortedByVp[1]?.finalVp ?? 0;

  const roundWord = totalRounds === 1 ? 'round' : 'rounds';

  const headline =
    winner !== undefined
      ? `${winner.factionId} takes the throne.`
      : 'The race is unfinished.';

  const deckText =
    winner !== undefined
      ? `Final scores after ${totalRounds} ${roundWord}: ${ordered.map(s => `${s.factionId} ${s.finalVp}`).join(', ')}.`
      : leader !== undefined
        ? `${leader.factionId} led with ${leader.finalVp} VP after ${totalRounds} ${roundWord}.`
        : `${ordered.length} factions competed.`;

  const editorialProse =
    winner !== undefined
      ? `${winner.factionId} reached ${winner.finalVp} victory points across ${totalRounds} ${roundWord}, claiming the galaxy by a margin of ${winner.finalVp - secondVp}. ${ordered.length} factions contested the stars; the campaign ran its full course before a victor emerged.`
      : leader !== undefined
        ? `After ${totalRounds} ${roundWord}, ${leader.factionId} held the lead with ${leader.finalVp} VP. No empire reached the ${victoryPoints}-point threshold before the game concluded.`
        : `No factions competed; the ${victoryPoints}-point throne stands unclaimed.`;

  return { headline, deckText, editorialProse };
}
