import type { ParsedGame } from '../parser/types';
import type { RoundBoundary } from '../aggregator/deriveRoundBoundaries';
import { buildRoundScores } from '../recap/buildRoundScores';

export function buildGameCsv(game: ParsedGame, roundBoundaries: RoundBoundary[]): string {
  const factions = game.factions.slice().sort((a, b) => a.mapPosition - b.mapPosition);

  if (roundBoundaries.length === 0) {
    const lines = ['Faction,FinalVP'];
    for (const f of factions) {
      lines.push(`${f.factionId},${game.finalScores[f.factionId] ?? 0}`);
    }
    return lines.join('\n');
  }

  const header = ['Round', ...factions.map(f => f.factionId)].join(',');
  const roundScores = buildRoundScores(game.vpEvents, factions, roundBoundaries);

  const anchorRow = ['0', ...factions.map(() => '0')].join(',');
  const dataRows = roundScores.map(row =>
    [row.round, ...factions.map(f => row.scores[f.factionId] ?? 0)].join(',')
  );

  return [header, anchorRow, ...dataRows].join('\n');
}
