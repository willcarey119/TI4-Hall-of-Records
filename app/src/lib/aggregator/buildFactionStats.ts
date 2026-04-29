import type { ParsedGame, VpSource } from '../parser/types';
import { getFactionExpansion, type ExpansionTag } from './factionExpansions';
import { deriveRoundBoundaries, type RoundBoundary } from './deriveRoundBoundaries';
import { buildRoundScores } from '../recap/buildRoundScores';

export interface FactionStat {
  factionId: string;
  expansion: ExpansionTag;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  avgFinalVp: number;
  /**
   * Per-round mean cumulative VP across games this faction played. Index 0 = round 1.
   *
   * Aggregation semantic (A): each round N's value averages only over games where
   * this faction reached round N. Games that ended earlier do not contribute to
   * later rounds, so each round's sample size may differ. This keeps the
   * sparkline's shape honest — a round value reflects games actually played
   * through that round, not padded continuations of ended games.
   *
   * Array length equals the maximum round any of this faction's games reached.
   * Empty when no game has derivable round boundaries (e.g. missing strategy
   * card pick events).
   */
  avgVpPerRound: number[];
  distinctVpSources: VpSource[];
  /** Senate Power Index — fraction of agenda votes cast by this faction whose
   *  vote.outcome matched the resolution.outcome. Null if faction never voted. */
  winningVoteRate: number | null;
}

export interface SftTransfer {
  fromFaction: string;
  toFaction: string;
  count: number;
}

export interface FactionStatsSummary {
  totalGames: number;
  factions: FactionStat[];
  sftTransfers: SftTransfer[];
}

const SFT_NOTE = 'Support for the Throne';
/** Pipe is safe — real factionIds may contain spaces, apostrophes, hyphens, and digits, but never `|`. */
const KEY_SEP = '|';

export function buildFactionStats(
  games: ParsedGame[],
  roundBoundariesByGame?: Map<string, RoundBoundary[]>,
): FactionStatsSummary {
  if (games.length === 0) {
    return { totalGames: 0, factions: [], sftTransfers: [] };
  }

  // Per-faction running totals
  const playCount = new Map<string, number>();
  const winCount = new Map<string, number>();
  const vpTotal = new Map<string, number>();
  const sources = new Map<string, Set<VpSource>>();
  const votesCast = new Map<string, number>();
  const votesWith = new Map<string, number>();
  // Per-faction per-round contributions: round-index → list of cumulative-VP samples.
  // After the loop we'll average each list to produce avgVpPerRound (semantic A).
  const vpSamples = new Map<string, number[][]>();

  for (const game of games) {
    for (const faction of game.factions) {
      const id = faction.factionId;
      playCount.set(id, (playCount.get(id) ?? 0) + 1);
      vpTotal.set(id, (vpTotal.get(id) ?? 0) + (game.finalScores[id] ?? 0));
      if (!sources.has(id)) sources.set(id, new Set());
      if (!vpSamples.has(id)) vpSamples.set(id, []);
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
    // Per-game cumulative VP per round, contributed to each faction's sample bucket.
    // Match the sibling-builder pattern (buildStrategyCardStats / buildTechStats / buildGameStats):
    // when MetaContext provides a pre-computed map, look it up; otherwise fall back to
    // inline derivation so unit-test call sites (`buildFactionStats(games)`) keep working.
    const boundaries = roundBoundariesByGame !== undefined
      ? roundBoundariesByGame.get(game.gameId) ?? []
      : deriveRoundBoundaries(game.strategyCardEvents, game.factions.length);
    if (boundaries.length > 0) {
      const rows = buildRoundScores(game.vpEvents, game.factions, boundaries);
      for (const faction of game.factions) {
        const id = faction.factionId;
        const buckets = vpSamples.get(id);
        if (buckets === undefined) continue;
        for (const row of rows) {
          const idx = row.round - 1;
          let bucket = buckets[idx];
          if (bucket === undefined) {
            bucket = [];
            buckets[idx] = bucket;
          }
          bucket.push(row.scores[id] ?? 0);
        }
      }
    }
  }

  // Average each per-round sample list. Sparse rounds (none of this faction's
  // games reached round N) collapse to 0; under semantic A this only happens
  // when no game contributed to that index at all, which is impossible because
  // we contribute every faction-game pair from round 1 up to that game's max.
  const avgVpByFaction = new Map<string, number[]>();
  for (const [id, buckets] of vpSamples.entries()) {
    const out: number[] = buckets.map(samples =>
      samples.length === 0 ? 0 : samples.reduce((a, b) => a + b, 0) / samples.length,
    );
    avgVpByFaction.set(id, out);
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
      avgVpPerRound: avgVpByFaction.get(id) ?? [],
      distinctVpSources: [...(sources.get(id) ?? [])],
      winningVoteRate: cast > 0 ? (votesWith.get(id) ?? 0) / cast : null,
    };
  });
  factions.sort((a, b) => b.winRate - a.winRate || b.gamesPlayed - a.gamesPlayed);

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

  return { totalGames: games.length, factions, sftTransfers };
}
