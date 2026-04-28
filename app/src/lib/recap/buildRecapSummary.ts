import type { ParsedGame } from '../parser/types';

export interface RecapStanding {
  rank: number;
  factionId: string;
  color: string;
  playerName: string;
  finalVp: number;
  isWinner: boolean;
}

export interface RecapSummary {
  winner: RecapStanding | null;
  standings: RecapStanding[];
  totalRounds: number;
  durationSeconds: number;
  victoryPoints: number;
  vpMargin: number;
  editorialHeadline: string;
  editorialDeck: string;
}

export function buildRecapSummary(game: ParsedGame): RecapSummary {
  const raw = game.options['victoryPoints'];
  const victoryPoints = typeof raw === 'number' ? raw : 10;

  const sortedFactions = game.factions
    .slice()
    .sort((a, b) => (game.finalScores[b.factionId] ?? 0) - (game.finalScores[a.factionId] ?? 0));

  const standings: RecapStanding[] = sortedFactions.map((f, i) => ({
    rank: i + 1,
    factionId: f.factionId,
    color: f.color,
    playerName: f.playerName,
    finalVp: game.finalScores[f.factionId] ?? 0,
    isWinner: f.factionId === game.winner,
  }));

  const winner = standings.find(s => s.isWinner) ?? null;

  const totalRounds =
    game.phaseSnapshots.length > 0
      ? Math.max(...game.phaseSnapshots.map(s => s.round))
      : 0;

  const sortedScores = sortedFactions.map(f => game.finalScores[f.factionId] ?? 0);
  const vpMargin =
    winner !== null && sortedScores.length >= 2
      ? (sortedScores[0] ?? 0) - (sortedScores[1] ?? 0)
      : 0;

  const hours = Math.round((game.durationSeconds / 3600) * 10) / 10;

  const editorialHeadline =
    winner !== null
      ? `${winner.factionId.toUpperCase()} TAKES THE THRONE.`
      : 'THE RACE GOES ON.';

  const editorialDeck =
    winner !== null
      ? `${totalRounds} rounds · ${hours}h · ${game.factions.length} empires · 1 throne`
      : `${totalRounds} rounds · ${hours}h · no victor`;

  return {
    winner,
    standings,
    totalRounds,
    durationSeconds: game.durationSeconds,
    victoryPoints,
    vpMargin,
    editorialHeadline,
    editorialDeck,
  };
}
