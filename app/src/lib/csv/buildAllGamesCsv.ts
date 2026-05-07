import type { ParsedGame } from '../parser/types';

const HEADER = 'GameId,Date,DurationMinutes,VPThreshold,FactionId,FinalVP,IsWinner';

function formatDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function buildAllGamesCsv(games: ParsedGame[]): string {
  if (games.length === 0) return '';

  const rows: string[] = [HEADER];
  for (const game of games) {
    const date = formatDate(game.playedAt);
    const duration = Math.round(game.durationSeconds / 60);
    for (const faction of game.factions) {
      const finalVp = game.finalScores[faction.factionId] ?? 0;
      const isWinner = faction.factionId === game.winner;
      rows.push(`${game.gameId},${date},${duration},${game.vpThreshold},${faction.factionId},${finalVp},${isWinner}`);
    }
  }
  return rows.join('\n');
}
