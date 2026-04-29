import type { ParsedGame, PhaseSnapshot } from '../parser/types';

export interface SpeakerStats {
  gamesAnalyzed: number;
  initialSpeakerWinCount: number;
  initialSpeakerWinRate: number;
  avgRoundsAsSpeakerWinner: number;
  avgRoundsAsSpeakerNonWinner: number;
}

function speakerByRound(snapshots: PhaseSnapshot[]): Record<number, string> {
  const result: Record<number, string> = {};
  for (const snap of snapshots) {
    if (snap.phase.toLowerCase().includes('strategy') && result[snap.round] === undefined) {
      result[snap.round] = snap.speaker;
    }
  }
  return result;
}

export function buildSpeakerStats(games: ParsedGame[]): SpeakerStats {
  let gamesAnalyzed = 0;
  let initialSpeakerWinCount = 0;
  let totalWinnerRounds = 0;
  let totalNonWinnerRounds = 0;
  let nonWinnerFactionRoundPairs = 0;

  for (const game of games) {
    if (game.winner === null) continue;
    gamesAnalyzed++;

    if (game.winner === game.initialSpeaker) initialSpeakerWinCount++;

    const byRound = speakerByRound(game.phaseSnapshots);
    const rounds = Object.keys(byRound).map(Number);
    if (rounds.length === 0) continue;

    let winnerRounds = 0;
    for (const r of rounds) {
      if (byRound[r] === game.winner) winnerRounds++;
    }
    totalWinnerRounds += winnerRounds;

    for (const f of game.factions) {
      if (f.factionId === game.winner) continue;
      let fRounds = 0;
      for (const r of rounds) {
        if (byRound[r] === f.factionId) fRounds++;
      }
      totalNonWinnerRounds += fRounds;
      nonWinnerFactionRoundPairs++;
    }
  }

  return {
    gamesAnalyzed,
    initialSpeakerWinCount,
    initialSpeakerWinRate: gamesAnalyzed > 0 ? initialSpeakerWinCount / gamesAnalyzed : 0,
    avgRoundsAsSpeakerWinner: gamesAnalyzed > 0 ? totalWinnerRounds / gamesAnalyzed : 0,
    avgRoundsAsSpeakerNonWinner: nonWinnerFactionRoundPairs > 0 ? totalNonWinnerRounds / nonWinnerFactionRoundPairs : 0,
  };
}
