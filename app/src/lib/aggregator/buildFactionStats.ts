import type { ParsedGame, VpSource } from '../parser/types';
import { getFactionExpansion, type ExpansionTag } from './factionExpansions';

export interface FactionStat {
  factionId: string;
  expansion: ExpansionTag;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  avgFinalVp: number;
  /** Reserved for future use: per-round average VP. Empty until wired up. */
  avgVpPerRound: number[];
  distinctVpSources: VpSource[];
  /** Senate Power Index — fraction of agenda votes cast by this faction whose
   *  vote.outcome matched the resolution.outcome. Null if faction never voted. */
  winningVoteRate: number | null;
}

export interface FactionPairing {
  factionA: string;
  factionB: string;
  coAppearances: number;
}

export interface SftTransfer {
  fromFaction: string;
  toFaction: string;
  count: number;
}

export interface FactionStatsSummary {
  totalGames: number;
  factions: FactionStat[];
  topPairings: FactionPairing[];
  sftTransfers: SftTransfer[];
}

const SFT_NOTE = 'Support for the Throne';
/** Pipe is safe — real factionIds may contain spaces, apostrophes, hyphens, and digits, but never `|`. */
const KEY_SEP = '|';

export function buildFactionStats(games: ParsedGame[]): FactionStatsSummary {
  if (games.length === 0) {
    return { totalGames: 0, factions: [], topPairings: [], sftTransfers: [] };
  }

  // Per-faction running totals
  const playCount = new Map<string, number>();
  const winCount = new Map<string, number>();
  const vpTotal = new Map<string, number>();
  const sources = new Map<string, Set<VpSource>>();
  const votesCast = new Map<string, number>();
  const votesWith = new Map<string, number>();

  for (const game of games) {
    for (const faction of game.factions) {
      const id = faction.factionId;
      playCount.set(id, (playCount.get(id) ?? 0) + 1);
      vpTotal.set(id, (vpTotal.get(id) ?? 0) + (game.finalScores[id] ?? 0));
      if (!sources.has(id)) sources.set(id, new Set());
    }
    for (const ev of game.vpEvents) {
      const set = sources.get(ev.faction);
      if (set !== undefined) set.add(ev.source);
    }
    if (game.winner !== null) {
      winCount.set(game.winner, (winCount.get(game.winner) ?? 0) + 1);
    }
    // Senate Power Index: count votes whose outcome matched the resolved outcome.
    for (const res of game.agendaResolutions) {
      for (const v of res.votes) {
        votesCast.set(v.faction, (votesCast.get(v.faction) ?? 0) + 1);
        if (v.outcome === res.outcome) {
          votesWith.set(v.faction, (votesWith.get(v.faction) ?? 0) + 1);
        }
      }
    }
  }

  const factions: FactionStat[] = [...playCount.entries()].map(([id, gp]) => {
    const wins = winCount.get(id) ?? 0;
    const cast = votesCast.get(id) ?? 0;
    return {
      factionId: id,
      expansion: getFactionExpansion(id),
      gamesPlayed: gp,
      wins,
      winRate: gp > 0 ? wins / gp : 0,
      avgFinalVp: gp > 0 ? (vpTotal.get(id) ?? 0) / gp : 0,
      avgVpPerRound: [],
      distinctVpSources: [...(sources.get(id) ?? [])],
      winningVoteRate: cast > 0 ? (votesWith.get(id) ?? 0) / cast : null,
    };
  });
  factions.sort((a, b) => b.winRate - a.winRate || b.gamesPlayed - a.gamesPlayed);

  // Pairings — key on lex-sorted pair separated by `|` so multi-word factionIds round-trip.
  const pairCounts = new Map<string, number>();
  for (const game of games) {
    const ids = game.factions.map(f => f.factionId).sort();
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i];
        const b = ids[j];
        if (a === undefined || b === undefined) continue;
        const key = `${a}${KEY_SEP}${b}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }
  const topPairings: FactionPairing[] = [...pairCounts.entries()]
    .map(([key, coAppearances]) => {
      const [factionA, factionB] = key.split(KEY_SEP);
      return { factionA: factionA ?? '', factionB: factionB ?? '', coAppearances };
    })
    .sort((a, b) => b.coAppearances - a.coAppearances)
    .slice(0, 10);

  // Support for the Throne — count distinct game-direction occurrences.
  // Uses `|` separator so multi-word factionIds (e.g. "Federation of Sol") round-trip cleanly.
  const sftCounts = new Map<string, number>();
  for (const game of games) {
    const seenInGame = new Set<string>();
    for (const note of game.promissoryNoteEvents) {
      if (note.note !== SFT_NOTE || note.type !== 'play') continue;
      const key = `${note.fromFaction}${KEY_SEP}${note.toFaction}`;
      if (seenInGame.has(key)) continue;
      seenInGame.add(key);
      sftCounts.set(key, (sftCounts.get(key) ?? 0) + 1);
    }
  }
  const sftTransfers: SftTransfer[] = [...sftCounts.entries()].map(([key, count]) => {
    const [fromFaction, toFaction] = key.split(KEY_SEP);
    return { fromFaction: fromFaction ?? '', toFaction: toFaction ?? '', count };
  });

  return { totalGames: games.length, factions, topPairings, sftTransfers };
}
