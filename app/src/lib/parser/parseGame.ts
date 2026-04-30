// src/lib/parser/parseGame.ts
// Top-level parser: extracts and normalizes a raw TI Assistant export
// into a typed ParsedGame, then reduces all log entries through gameReducer.

import type { ParsedGame, FactionSetup, GameTimers, RawLogEntry } from './types';
import { createInitialState, gameReducer } from './gameReducer';

function hashGameId(firstTimestamp: number, sortedFactionIds: string[]): string {
  const input = `${firstTimestamp}:${sortedFactionIds.join(',')}`;
  let hash = 2166136261; // FNV-1a 32-bit offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(36);
}

function extractFactions(raw: Record<string, unknown>): FactionSetup[] {
  const dataObj = (typeof raw['data'] === 'object' && raw['data'] !== null)
    ? (raw['data'] as Record<string, unknown>)
    : {};
  const rawFactions = Array.isArray(dataObj['factions']) ? dataObj['factions'] : [];
  return rawFactions.map((f, idx): FactionSetup => {
    const faction = (typeof f === 'object' && f !== null) ? (f as Record<string, unknown>) : {};
    return {
      factionId: typeof faction['id'] === 'string' ? faction['id'] : '',
      playerName: typeof faction['playerName'] === 'string' ? faction['playerName'] : '',
      color: typeof faction['color'] === 'string' ? faction['color'] : '',
      mapPosition: idx,
      startingTechs: [],
      startingPlanets: [],
    };
  });
}

/** Scans sorted log entries for the first ADVANCE_PHASE at phase "SETUP" (gameSeconds=0).
 *  Extracts per-faction startswith data and the initial speaker.
 *  This is more reliable than the raw.data.speaker index and gives us the
 *  actual starting planets/techs that were not in the raw faction list. */
function enrichFactionsFromSetupPhase(
  entries: RawLogEntry[],
  factions: FactionSetup[],
): { enrichedFactions: FactionSetup[]; setupSpeaker: string | null } {
  const setupEntry = entries.find(
    (e) =>
      e.action === 'ADVANCE_PHASE' &&
      typeof e.event['state'] === 'object' &&
      e.event['state'] !== null &&
      (e.event['state'] as Record<string, unknown>)['phase'] === 'SETUP',
  );

  if (setupEntry === undefined) {
    return { enrichedFactions: factions, setupSpeaker: null };
  }

  const stateData = setupEntry.event['state'] as Record<string, unknown>;
  const setupSpeaker =
    typeof stateData['speaker'] === 'string' ? stateData['speaker'] : null;

  const rawFactionData = setupEntry.event['factions'];
  if (typeof rawFactionData !== 'object' || rawFactionData === null) {
    return { enrichedFactions: factions, setupSpeaker };
  }
  const factionsData = rawFactionData as Record<string, unknown>;

  const enrichedFactions = factions.map((faction): FactionSetup => {
    const factionRaw = factionsData[faction.factionId];
    if (typeof factionRaw !== 'object' || factionRaw === null) return faction;
    const factionObj = factionRaw as Record<string, unknown>;
    const startswith = factionObj['startswith'];
    if (typeof startswith !== 'object' || startswith === null) return faction;
    const sw = startswith as Record<string, unknown>;
    const startingPlanets = Array.isArray(sw['planets'])
      ? sw['planets'].filter((p): p is string => typeof p === 'string')
      : faction.startingPlanets;
    const startingTechs = Array.isArray(sw['techs'])
      ? sw['techs'].filter((t): t is string => typeof t === 'string')
      : faction.startingTechs;
    return { ...faction, startingPlanets, startingTechs };
  });

  return { enrichedFactions, setupSpeaker };
}

function extractLogEntries(raw: Record<string, unknown>): RawLogEntry[] {
  const rawLog = Array.isArray(raw['actionLog']) ? raw['actionLog'] : [];
  return rawLog
    .flatMap((entry): RawLogEntry[] => {
      if (typeof entry !== 'object' || entry === null) return [];
      const e = entry as Record<string, unknown>;
      const inner = (typeof e['data'] === 'object' && e['data'] !== null)
        ? (e['data'] as Record<string, unknown>)
        : null;
      if (inner === null) return [];
      const action = inner['action'];
      if (typeof action !== 'string') return [];
      const ts = typeof inner['timestamp'] === 'number'
        ? inner['timestamp']
        : (typeof e['timestampMillis'] === 'number' ? e['timestampMillis'] : 0);
      return [{
        action,
        event: (typeof inner['event'] === 'object' && inner['event'] !== null)
          ? (inner['event'] as Record<string, unknown>)
          : {},
        timestamp: ts,
        ...(typeof e['gameSeconds'] === 'number' ? { gameTime: e['gameSeconds'] } : {}),
      }];
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

function extractTimers(raw: Record<string, unknown>, factions: FactionSetup[]): GameTimers {
  const rawTimers = (typeof raw['timers'] === 'object' && raw['timers'] !== null)
    ? (raw['timers'] as Record<string, unknown>)
    : {};
  const factionTimers: Record<string, number> = {};
  for (const { factionId } of factions) {
    const v = rawTimers[factionId];
    factionTimers[factionId] = typeof v === 'number' ? v : 0;
  }
  const game = typeof rawTimers['game'] === 'number' ? rawTimers['game'] : 0;
  return {
    game,
    factions: factionTimers,
    secondaries: {},
    agendas: { first: 0, second: 0 },
  };
}

export function parseGame(raw: unknown): ParsedGame {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('parseGame: expected an object');
  }
  const game = raw as Record<string, unknown>;

  const rawFactions = extractFactions(game);
  const entries = extractLogEntries(game);
  const { enrichedFactions: factions, setupSpeaker } = enrichFactionsFromSetupPhase(entries, rawFactions);
  const timers = extractTimers(game, factions);

  const dataObj = (typeof game['data'] === 'object' && game['data'] !== null)
    ? (game['data'] as Record<string, unknown>)
    : {};
  const speakerIdx = typeof dataObj['speaker'] === 'number' ? dataObj['speaker'] : 0;
  // Prefer the speaker declared in the SETUP ADVANCE_PHASE event (faction ID string),
  // falling back to the raw.data.speaker array index for older exports.
  const initialSpeaker = setupSpeaker ?? (factions[speakerIdx]?.factionId ?? '');

  const rawOptions = (typeof dataObj['options'] === 'object' && dataObj['options'] !== null)
    ? (dataObj['options'] as Record<string, unknown>)
    : {};

  const finalState = entries.reduce(gameReducer, createInitialState(factions));

  // data.imperialVPOverrides: Record<factionId, number>
  // Corrects cases where TI Assistant records an eligible Imperial Strategy Card use
  // (faction held Mecatol Rex at the time) but the table did not actually apply the VP.
  // TI Assistant has no explicit "VP claimed" event, so we can't auto-detect this.
  // The override specifies the EXACT number of Imperial Point VPs for each named faction.
  // Both finalScores and vpEvents are adjusted together to stay consistent.
  const imperialVPOverridesRaw =
    typeof dataObj['imperialVPOverrides'] === 'object' && dataObj['imperialVPOverrides'] !== null
      ? (dataObj['imperialVPOverrides'] as Record<string, unknown>)
      : {};

  let adjustedVpEvents = finalState.vpEvents;
  const adjustedScores: Record<string, number> = { ...finalState.currentScores };
  const overrideWarnings: string[] = [];

  for (const [faction, targetRaw] of Object.entries(imperialVPOverridesRaw)) {
    if (typeof targetRaw !== 'number') continue;
    const target = Math.max(0, Math.floor(targetRaw));
    const existing = adjustedVpEvents.filter(
      (e) => e.faction === faction && e.source === 'imperial_point',
    ).length;
    if (existing === target) continue;

    const delta = target - existing;

    if (delta < 0) {
      // Remove the |delta| most-recent imperial_point events for this faction.
      let toRemove = -delta;
      const removeIndices = new Set<number>();
      for (let i = adjustedVpEvents.length - 1; i >= 0 && toRemove > 0; i--) {
        const e = adjustedVpEvents[i];
        if (e !== undefined && e.faction === faction && e.source === 'imperial_point') {
          removeIndices.add(i);
          toRemove--;
        }
      }
      adjustedVpEvents = adjustedVpEvents.filter((_, i) => !removeIndices.has(i));
      adjustedScores[faction] = (adjustedScores[faction] ?? 0) + delta;
    } else {
      // Positive delta (target > parser count): unsupported because synthesizing
      // imperial_point events would require fabricated timestamps. Skip the
      // adjustment to preserve the invariant `finalScores ≡ Σ vpEvents.points`
      // and emit a warning so the unhandled override is visible. Use `data.winner`
      // to record the actual winner if the parser undercounts.
      overrideWarnings.push(
        `imperialVPOverrides: positive delta for "${faction}" (target ${target}, parser count ${existing}) is unsupported; finalScores left unchanged`,
      );
    }
  }

  // finalScoreOverrides: directly patch finalScores for games where the log is incomplete
  // (events were never recorded by TI Assistant). vpEvents are NOT modified — the VP Race
  // chart shows logged progression; only finalScores and winner inference use these values.
  const finalScoreOverridesRaw = dataObj['finalScoreOverrides'];
  if (typeof finalScoreOverridesRaw === 'object' && finalScoreOverridesRaw !== null) {
    for (const [faction, target] of Object.entries(finalScoreOverridesRaw as Record<string, unknown>)) {
      if (typeof target === 'number') {
        adjustedScores[faction] = target;
      }
    }
  }

  const firstTimestamp = entries[0]?.timestamp ?? 0;
  const sortedFactionIds = [...factions.map((f) => f.factionId)].sort();
  const gameId = hashGameId(firstTimestamp, sortedFactionIds);

  const vpThreshold = typeof rawOptions['victory-points'] === 'number'
    ? rawOptions['victory-points']
    : 10;
  const scoreEntries = Object.entries(adjustedScores);
  const topScore = scoreEntries.reduce((max, [, s]) => Math.max(max, s), 0);
  const inferredWinner = topScore >= vpThreshold
    ? (scoreEntries.find(([, s]) => s === topScore)?.[0] ?? null)
    : null;
  // data.winner overrides score inference for games where the parser undercounts VP
  // (e.g. unhandled agenda VP sources, Imperial Strategy Card primary).
  // The override must be a non-empty string matching an actual factionId.
  const winnerOverride = typeof dataObj['winner'] === 'string' && dataObj['winner'].length > 0
    ? dataObj['winner']
    : null;
  const winner = winnerOverride ?? inferredWinner;

  return {
    gameId,
    playedAt: firstTimestamp,
    durationSeconds: timers.game,
    factions,
    options: rawOptions,
    initialSpeaker,
    phaseSnapshots: finalState.phaseSnapshots,
    vpEvents: adjustedVpEvents,
    planetEvents: finalState.planetEvents,
    techEvents: finalState.techEvents,
    agendaResolutions: finalState.agendaResolutions,
    strategyCardEvents: finalState.strategyCardEvents,
    actionCardEvents: finalState.actionCardEvents,
    componentEvents: finalState.componentEvents,
    relicEvents: finalState.relicEvents,
    leaderEvents: finalState.leaderEvents,
    objectiveReveals: finalState.objectiveReveals,
    speakerEvents: finalState.speakerEvents,
    attachmentEvents: finalState.attachmentEvents,
    allianceEvents: finalState.allianceEvents,
    promissoryNoteEvents: finalState.promissoryNoteEvents,
    expeditionEvents: finalState.expeditionEvents,
    secondaryEvents: finalState.secondaryEvents,
    actionEvents: finalState.actionEvents,
    actionTypeEvents: finalState.actionTypeEvents,
    finalScores: adjustedScores,
    winner,
    timers,
    warnings: [...finalState.warnings, ...overrideWarnings],
  };
}
