import type { ParsedGame, VpSource, PlayerActionType } from '../parser/types';
import { getObjectivePoints } from '../parser/objectives';
import { relicGrantsVp } from '../parser/relicVpRules';
import { assignRound, type RoundBoundary } from './deriveRoundBoundaries';
import { isHeroLeader } from './heroLeaders';

// ── Sub-interfaces ─────────────────────────────────────────────────────────────

export interface MecatolStat {
  /** Rate at which the first Mecatol claimer wins the game. Null if no decided games. */
  firstClaimerWinRate: number | null;
  /** Average round in which Mecatol is first claimed (0 if never, null if no data). */
  avgFirstClaimRound: number | null;
  /** Average number of ownership changes per game. */
  avgTurnover: number;
}

export interface ActionTypeBreakdown {
  tactical: number;
  component: number;
  pass: number;
  tacticalPct: number | null;
  componentPct: number | null;
  passPct: number | null;
  /** Top 3 factions by tactical action count across all games. */
  topTacticalFactions: string[];
  topComponentFactions: string[];
  topPassFactions: string[];
}

export interface HeroActivation {
  leaderName: string;
  /** Number of distinct games in which this hero was played (type === 'play'). */
  gamesActivated: number;
  /** Average round of activation. Null if no round-boundary data for those games. */
  avgActivationRound: number | null;
  activationRate: number | null;
}

export interface RelicStat {
  relic: string;
  drawnCount: number;
  playedCount: number;
  grantsVp: boolean;
}

export interface AgendaStat {
  agenda: string;
  timesResolved: number;
  /** Pass rate for binary (For/Against) agendas. Null for elect-type agendas. */
  passRate: number | null;
  /** Total VP swing: sum of VP gained by any faction attributed to this agenda. */
  netVpSwing: number;
}

export interface VpSourceStat {
  source: VpSource;
  totalPoints: number;
  sharePct: number;
}

export interface ComingFromBehindStat {
  /** Rate at which the round-3 VP leader won the game. Null if not enough data. */
  round3LeaderWinRate: number | null;
  /** Total decided games used in the calculation. */
  decidedGames: number;
  /** Decided games that had VP scored before round 4 (i.e. denominator of round3LeaderWinRate). */
  gamesWithRound3Data: number;
}

export interface ObjectiveTimingStat {
  /** Average VP earned per round across all games/factions. */
  avgVpPerRound: Record<number, number>;
  /** Average round in which the winning faction scored their final VP. */
  avgWinningVpRound: number | null;
}

export interface VpDiversityStat {
  avgWinnerDistinctSources: number | null;
  avgLoserDistinctSources: number | null;
  avgWinnerHHI: number | null;
  avgLoserHHI: number | null;
}

export interface Stage2Stat {
  gamesWithStage2: number;
  firstStage2ScorerWins: number;
  firstStage2ScorerWinRate: number | null;
}

export interface GameStatsSummary {
  totalGames: number;
  avgDurationSeconds: number;
  avgPlayersPerGame: number;
  avgWinningVp: number | null;
  mecatol: MecatolStat;
  actionTypes: ActionTypeBreakdown;
  heroActivations: HeroActivation[];
  relics: RelicStat[];
  agendas: AgendaStat[];
  vpSources: VpSourceStat[];
  comingFromBehind: ComingFromBehindStat;
  objectiveTiming: ObjectiveTimingStat;
  vpDiversity: VpDiversityStat;
  stage2: Stage2Stat;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function avg(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

function avgOrZero(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

/** Herfindahl-Hirschman Index for a distribution of VP across sources.
 *  Returns 1 when all VP comes from a single source (maximum concentration),
 *  and 1/n for a perfectly even n-source split. */
function hhi(pointsBySource: Map<VpSource, number>): number {
  const total = [...pointsBySource.values()].reduce((s, n) => s + n, 0);
  if (total === 0) return 0;
  let sum = 0;
  for (const pts of pointsBySource.values()) {
    const share = pts / total;
    sum += share * share;
  }
  return sum;
}

// ── Sub-builders ──────────────────────────────────────────────────────────────

function buildMecatol(
  games: ParsedGame[],
  roundBoundariesByGame: Map<string, RoundBoundary[]>,
): MecatolStat {
  let firstClaimerWins = 0;
  let decidedWithMecatol = 0;
  const firstClaimRounds: number[] = [];
  let totalTurnover = 0;
  let gamesWithMecatol = 0;

  for (const game of games) {
    const claims = game.planetEvents.filter(
      e => e.planet === 'Mecatol Rex' && e.type === 'claim',
    );
    if (claims.length === 0) continue;
    gamesWithMecatol += 1;

    // Count ownership changes (each re-claim after the first is a turnover)
    totalTurnover += claims.length - 1;

    // First claim
    const first = claims.reduce(
      (min, e) => (e.timestamp < min.timestamp ? e : min),
      claims[0]!,
    );

    // Round of first claim
    const boundaries = roundBoundariesByGame.get(game.gameId) ?? [];
    if (boundaries.length > 0) {
      firstClaimRounds.push(assignRound(first.timestamp, boundaries));
    }

    // Win rate — only decided games count
    if (game.winner !== null) {
      decidedWithMecatol += 1;
      if (first.faction === game.winner) {
        firstClaimerWins += 1;
      }
    }
  }

  return {
    firstClaimerWinRate: decidedWithMecatol > 0 ? firstClaimerWins / decidedWithMecatol : null,
    avgFirstClaimRound: avg(firstClaimRounds),
    avgTurnover: gamesWithMecatol > 0 ? totalTurnover / gamesWithMecatol : 0,
  };
}

function buildActionTypes(games: ParsedGame[]): ActionTypeBreakdown {
  let tactical = 0;
  let component = 0;
  let pass = 0;
  let hasAnyData = false;

  const byFaction = new Map<string, Record<PlayerActionType, number>>();
  const getFaction = (id: string): Record<PlayerActionType, number> => {
    let cur = byFaction.get(id);
    if (cur === undefined) {
      cur = { tactical: 0, component: 0, pass: 0 };
      byFaction.set(id, cur);
    }
    return cur;
  };

  for (const game of games) {
    if (game.actionTypeEvents !== undefined && game.actionTypeEvents.length > 0) {
      hasAnyData = true;
      for (const ev of game.actionTypeEvents) {
        if (ev.actionType === 'tactical')  { tactical++;  getFaction(ev.faction).tactical++; }
        if (ev.actionType === 'component') { component++; getFaction(ev.faction).component++; }
        if (ev.actionType === 'pass')      { pass++;      getFaction(ev.faction).pass++; }
      }
    }
  }

  const total = tactical + component + pass;
  const tacticalPct = hasAnyData && total > 0 ? tactical / total : null;
  const componentPct = hasAnyData && total > 0 ? component / total : null;
  const passPct = hasAnyData && total > 0 ? pass / total : null;

  const topN = (type: PlayerActionType): string[] =>
    [...byFaction.entries()]
      .map(([id, counts]) => ({ id, n: counts[type] }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 3)
      .filter(x => x.n > 0)
      .map(x => x.id);

  return {
    tactical, component, pass,
    tacticalPct, componentPct, passPct,
    topTacticalFactions: topN('tactical'),
    topComponentFactions: topN('component'),
    topPassFactions: topN('pass'),
  };
}

function buildHeroes(
  games: ParsedGame[],
  roundBoundariesByGame: Map<string, RoundBoundary[]>,
): HeroActivation[] {
  interface HeroAcc {
    gamesActivated: number;
    activationRounds: number[];
    gamesPresent: number; // games where faction played
  }
  const acc = new Map<string, HeroAcc>();
  const get = (name: string): HeroAcc => {
    let cur = acc.get(name);
    if (cur === undefined) {
      cur = { gamesActivated: 0, activationRounds: [], gamesPresent: 0 };
      acc.set(name, cur);
    }
    return cur;
  };

  for (const game of games) {
    const boundaries = roundBoundariesByGame.get(game.gameId) ?? [];
    for (const ev of game.leaderEvents) {
      if (!isHeroLeader(ev.leader)) continue;
      if (ev.type === 'play') {
        const a = get(ev.leader);
        a.gamesActivated += 1;
        if (boundaries.length > 0) {
          a.activationRounds.push(assignRound(ev.timestamp, boundaries));
        }
      }
    }
    // Track factions present in this game for activation rate denominator
    const heroesUnlocked = new Set<string>();
    for (const ev of game.leaderEvents) {
      if (isHeroLeader(ev.leader) && ev.type === 'unlock') {
        heroesUnlocked.add(ev.leader);
      }
    }
    for (const name of heroesUnlocked) {
      get(name).gamesPresent += 1;
    }
  }

  return [...acc.entries()].map(([leaderName, a]) => ({
    leaderName,
    gamesActivated: a.gamesActivated,
    avgActivationRound: avg(a.activationRounds),
    activationRate: a.gamesPresent > 0
      ? Math.min(1, a.gamesActivated / a.gamesPresent)
      : a.gamesActivated > 0 ? 1 : 0,
  }));
}

function buildRelics(games: ParsedGame[]): RelicStat[] {
  const acc = new Map<string, { drawn: number; played: number }>();
  const get = (relic: string) => {
    let cur = acc.get(relic);
    if (cur === undefined) { cur = { drawn: 0, played: 0 }; acc.set(relic, cur); }
    return cur;
  };

  for (const game of games) {
    for (const ev of game.relicEvents) {
      if (ev.type === 'gain') get(ev.relic).drawn += 1;
      if (ev.type === 'play') get(ev.relic).played += 1;
    }
  }

  return [...acc.entries()].map(([relic, a]) => ({
    relic,
    drawnCount: a.drawn,
    playedCount: a.played,
    grantsVp: relicGrantsVp(relic),
  }));
}

function buildAgendas(games: ParsedGame[]): AgendaStat[] {
  interface AgendaAcc {
    forCount: number;
    againstCount: number;
    electedCount: number;  // non-binary resolutions
    vpSwing: number;
  }
  const acc = new Map<string, AgendaAcc>();
  const get = (name: string): AgendaAcc => {
    let cur = acc.get(name);
    if (cur === undefined) {
      cur = { forCount: 0, againstCount: 0, electedCount: 0, vpSwing: 0 };
      acc.set(name, cur);
    }
    return cur;
  };

  // VP attributed to each agenda (from vpEvents with source === 'agenda')
  const vpByAgenda = new Map<string, number>();
  for (const game of games) {
    for (const ev of game.vpEvents) {
      if (ev.source === 'agenda') {
        vpByAgenda.set(ev.objective, (vpByAgenda.get(ev.objective) ?? 0) + ev.points);
      }
    }
    for (const res of game.agendaResolutions) {
      const a = get(res.agenda);
      if (res.outcome === 'For')     a.forCount += 1;
      else if (res.outcome === 'Against') a.againstCount += 1;
      else a.electedCount += 1;
    }
  }

  return [...acc.entries()].map(([agenda, a]) => {
    const binaryTotal = a.forCount + a.againstCount;
    const timesResolved = binaryTotal + a.electedCount;
    const passRate = binaryTotal > 0 ? a.forCount / binaryTotal : null;
    return {
      agenda,
      timesResolved,
      passRate,
      netVpSwing: vpByAgenda.get(agenda) ?? 0,
    };
  });
}

function buildVpSources(games: ParsedGame[]): VpSourceStat[] {
  const totals = new Map<VpSource, number>();
  let grandTotal = 0;

  for (const game of games) {
    for (const ev of game.vpEvents) {
      let source: VpSource = ev.source;
      if (ev.source === 'score_objective') {
        const def = getObjectivePoints(ev.objective);
        if (def?.stage === 'II') source = 'score_objective_stage2';
        else if (def?.stage === 'secret') source = 'score_objective_secret';
        else source = 'score_objective_stage1';
      }
      totals.set(source, (totals.get(source) ?? 0) + ev.points);
      grandTotal += ev.points;
    }
  }

  return [...totals.entries()].map(([source, totalPoints]) => ({
    source,
    totalPoints,
    sharePct: grandTotal > 0 ? totalPoints / grandTotal : 0,
  }));
}

function buildComingFromBehind(
  games: ParsedGame[],
  roundBoundariesByGame: Map<string, RoundBoundary[]>,
): ComingFromBehindStat {
  const TARGET_ROUND = 3;
  let decidedGames = 0;
  let leaderWins = 0;

  for (const game of games) {
    if (game.winner === null) continue;
    const boundaries = roundBoundariesByGame.get(game.gameId) ?? [];
    if (boundaries.length < TARGET_ROUND) continue;

    // Sum VP per faction up through end of round 3
    const vpByFaction = new Map<string, number>();
    for (const ev of game.vpEvents) {
      const round = assignRound(ev.timestamp, boundaries);
      if (round > TARGET_ROUND) continue;
      vpByFaction.set(ev.faction, (vpByFaction.get(ev.faction) ?? 0) + ev.points);
    }

    // Skip games where no VP was scored before round 4 — can't identify a leader.
    if (vpByFaction.size === 0) continue;
    const maxVp = Math.max(...vpByFaction.values());
    const leaders = [...vpByFaction.entries()]
      .filter(([, vp]) => vp === maxVp)
      .map(([faction]) => faction);

    decidedGames += 1;
    if (leaders.includes(game.winner)) {
      leaderWins += 1;
    }
  }

  return {
    round3LeaderWinRate: decidedGames > 0 ? leaderWins / decidedGames : null,
    decidedGames,
    gamesWithRound3Data: decidedGames,
  };
}

function buildObjectiveTiming(
  games: ParsedGame[],
  roundBoundariesByGame: Map<string, RoundBoundary[]>,
): ObjectiveTimingStat {
  const vpByRound = new Map<number, number[]>();
  const winningVpRounds: number[] = [];

  for (const game of games) {
    const boundaries = roundBoundariesByGame.get(game.gameId) ?? [];

    for (const ev of game.vpEvents) {
      const round = assignRound(ev.timestamp, boundaries);
      const arr = vpByRound.get(round) ?? [];
      arr.push(ev.points);
      vpByRound.set(round, arr);
    }

    // Find the last VP event for the winner
    if (game.winner !== null && boundaries.length > 0) {
      const winnerEvents = game.vpEvents.filter(e => e.faction === game.winner);
      if (winnerEvents.length > 0) {
        const lastWinnerEv = winnerEvents.reduce(
          (latest, e) => (e.timestamp > latest.timestamp ? e : latest),
          winnerEvents[0]!,
        );
        winningVpRounds.push(assignRound(lastWinnerEv.timestamp, boundaries));
      }
    }
  }

  const avgVpPerRound: Record<number, number> = {};
  for (const [round, arr] of vpByRound) {
    avgVpPerRound[round] = avgOrZero(arr);
  }

  return {
    avgVpPerRound,
    avgWinningVpRound: avg(winningVpRounds),
  };
}

function buildVpDiversity(games: ParsedGame[]): VpDiversityStat {
  const winnerDistinct: number[] = [];
  const loserDistinct: number[] = [];
  const winnerHhis: number[] = [];
  const loserHhis: number[] = [];

  for (const game of games) {
    const byFaction = new Map<string, Map<VpSource, number>>();
    for (const ev of game.vpEvents) {
      let fMap = byFaction.get(ev.faction);
      if (fMap === undefined) { fMap = new Map(); byFaction.set(ev.faction, fMap); }
      fMap.set(ev.source, (fMap.get(ev.source) ?? 0) + ev.points);
    }

    for (const [faction, sourceMap] of byFaction) {
      const distinctSources = sourceMap.size;
      const h = hhi(sourceMap);
      const isWinner = game.winner !== null && faction === game.winner;
      if (game.winner === null) continue; // skip undecided games
      if (isWinner) {
        winnerDistinct.push(distinctSources);
        winnerHhis.push(h);
      } else {
        loserDistinct.push(distinctSources);
        loserHhis.push(h);
      }
    }
  }

  return {
    avgWinnerDistinctSources: avg(winnerDistinct),
    avgLoserDistinctSources: avg(loserDistinct),
    avgWinnerHHI: avg(winnerHhis),
    avgLoserHHI: avg(loserHhis),
  };
}

function buildStage2(games: ParsedGame[]): Stage2Stat {
  let gamesWithStage2 = 0;
  let firstStage2ScorerWins = 0;

  for (const game of games) {
    if (game.winner === null) continue;

    // Find the first VP event that is a Stage II objective (2 points, source: score_objective)
    const stage2Events = game.vpEvents
      .filter(ev => {
        if (ev.source !== 'score_objective') return false;
        const def = getObjectivePoints(ev.objective);
        return def !== null && def.stage === 'II';
      })
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp);

    if (stage2Events.length === 0) continue;
    gamesWithStage2 += 1;

    const first = stage2Events[0]!;
    if (first.faction === game.winner) {
      firstStage2ScorerWins += 1;
    }
  }

  return {
    gamesWithStage2,
    firstStage2ScorerWins,
    firstStage2ScorerWinRate: gamesWithStage2 > 0 ? firstStage2ScorerWins / gamesWithStage2 : null,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildGameStats(
  games: ParsedGame[],
  roundBoundariesByGame: Map<string, RoundBoundary[]>,
): GameStatsSummary {
  if (games.length === 0) {
    return {
      totalGames: 0,
      avgDurationSeconds: 0,
      avgPlayersPerGame: 0,
      avgWinningVp: null,
      mecatol: { firstClaimerWinRate: null, avgFirstClaimRound: null, avgTurnover: 0 },
      actionTypes: {
        tactical: 0, component: 0, pass: 0,
        tacticalPct: null, componentPct: null, passPct: null,
        topTacticalFactions: [], topComponentFactions: [], topPassFactions: [],
      },
      heroActivations: [],
      relics: [],
      agendas: [],
      vpSources: [],
      comingFromBehind: { round3LeaderWinRate: null, decidedGames: 0, gamesWithRound3Data: 0 },
      objectiveTiming: { avgVpPerRound: {}, avgWinningVpRound: null },
      vpDiversity: {
        avgWinnerDistinctSources: null,
        avgLoserDistinctSources: null,
        avgWinnerHHI: null,
        avgLoserHHI: null,
      },
      stage2: { gamesWithStage2: 0, firstStage2ScorerWins: 0, firstStage2ScorerWinRate: null },
    };
  }

  const totalDuration = games.reduce((s, g) => s + g.durationSeconds, 0);
  const avgDurationSeconds = totalDuration / games.length;
  const avgPlayersPerGame = games.reduce((s, g) => s + g.factions.length, 0) / games.length;

  const winningVps = games
    .filter(g => g.winner !== null)
    .map(g => g.finalScores[g.winner!] ?? 0);
  const avgWinningVp = winningVps.length > 0
    ? winningVps.reduce((s, n) => s + n, 0) / winningVps.length
    : null;

  return {
    totalGames: games.length,
    avgDurationSeconds,
    avgPlayersPerGame,
    avgWinningVp,
    mecatol: buildMecatol(games, roundBoundariesByGame),
    actionTypes: buildActionTypes(games),
    heroActivations: buildHeroes(games, roundBoundariesByGame),
    relics: buildRelics(games),
    agendas: buildAgendas(games),
    vpSources: buildVpSources(games),
    comingFromBehind: buildComingFromBehind(games, roundBoundariesByGame),
    objectiveTiming: buildObjectiveTiming(games, roundBoundariesByGame),
    vpDiversity: buildVpDiversity(games),
    stage2: buildStage2(games),
  };
}
