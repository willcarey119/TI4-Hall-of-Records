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

  const factions = extractFactions(game);
  const entries = extractLogEntries(game);
  const timers = extractTimers(game, factions);

  const dataObj = (typeof game['data'] === 'object' && game['data'] !== null)
    ? (game['data'] as Record<string, unknown>)
    : {};
  const speakerIdx = typeof dataObj['speaker'] === 'number' ? dataObj['speaker'] : 0;
  const initialSpeaker = factions[speakerIdx]?.factionId ?? '';

  const rawOptions = (typeof dataObj['options'] === 'object' && dataObj['options'] !== null)
    ? (dataObj['options'] as Record<string, unknown>)
    : {};

  const finalState = entries.reduce(gameReducer, createInitialState(factions));

  const firstTimestamp = entries[0]?.timestamp ?? 0;
  const sortedFactionIds = [...factions.map((f) => f.factionId)].sort();
  const gameId = hashGameId(firstTimestamp, sortedFactionIds);

  const vpThreshold = typeof rawOptions['victory-points'] === 'number'
    ? rawOptions['victory-points']
    : 10;
  const scoreEntries = Object.entries(finalState.currentScores);
  const topScore = scoreEntries.reduce((max, [, s]) => Math.max(max, s), 0);
  const winner = topScore >= vpThreshold
    ? (scoreEntries.find(([, s]) => s === topScore)?.[0] ?? null)
    : null;

  return {
    gameId,
    playedAt: firstTimestamp,
    durationSeconds: timers.game,
    factions,
    options: rawOptions,
    initialSpeaker,
    rounds: finalState.rounds,
    vpEvents: finalState.vpEvents,
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
    finalScores: finalState.currentScores,
    winner,
    timers,
    warnings: finalState.warnings,
  };
}
