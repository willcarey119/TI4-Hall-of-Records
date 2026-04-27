// src/lib/parser/gameReducer.ts
// Single-pass stateful reducer. Tasks 4–12 add cases to the switch.

import type {
  RawLogEntry,
  FactionSetup,
  VpEvent,
  PlanetEvent,
  TechEvent,
  AgendaResolution,
  AgendaVote,
  AgendaRider,
  StrategyCardEvent,
  ActionCardEvent,
  ComponentEvent,
  RelicEvent,
  LeaderEvent,
  ObjectiveReveal,
  SpeakerEvent,
  AttachmentEvent,
  AllianceEvent,
  PromissoryNoteEvent,
  ExpeditionEvent,
  SecondaryEvent,
  ActionEvent,
  RoundState,
} from './types';
import { getObjectivePoints } from './objectives';

export interface ReducerState {
  // Output event arrays
  vpEvents: VpEvent[];
  planetEvents: PlanetEvent[];
  techEvents: TechEvent[];
  agendaResolutions: AgendaResolution[];
  strategyCardEvents: StrategyCardEvent[];
  actionCardEvents: ActionCardEvent[];
  componentEvents: ComponentEvent[];
  relicEvents: RelicEvent[];
  leaderEvents: LeaderEvent[];
  objectiveReveals: ObjectiveReveal[];
  speakerEvents: SpeakerEvent[];
  attachmentEvents: AttachmentEvent[];
  allianceEvents: AllianceEvent[];
  promissoryNoteEvents: PromissoryNoteEvent[];
  expeditionEvents: ExpeditionEvent[];
  secondaryEvents: SecondaryEvent[];
  actionEvents: ActionEvent[];
  rounds: RoundState[];
  // Live game state
  currentScores: Record<string, number>;
  currentOwners: Record<string, string>; // planet → faction ID
  currentRelics: Record<string, string>; // relic name → faction ID
  currentRound: number;
  currentPhase: string;
  currentSpeaker: string;
  currentTurnFaction: string; // updated by END_TURN.prevFaction
  revealedObjectives: string[];
  custodiansTaken: boolean;
  // Pending agenda buffers — drained at RESOLVE_AGENDA
  pendingAgenda: string | null;
  pendingVotes: AgendaVote[];
  pendingRiders: AgendaRider[];
  // Diagnostics
  warnings: string[];
}

export function createInitialState(factions: FactionSetup[]): ReducerState {
  const currentScores: Record<string, number> = {};
  const currentOwners: Record<string, string> = {};
  for (const faction of factions) {
    currentScores[faction.factionId] = 0;
    for (const planet of faction.startingPlanets) {
      currentOwners[planet] = faction.factionId;
    }
  }
  return {
    vpEvents: [],
    planetEvents: [],
    techEvents: [],
    agendaResolutions: [],
    strategyCardEvents: [],
    actionCardEvents: [],
    componentEvents: [],
    relicEvents: [],
    leaderEvents: [],
    objectiveReveals: [],
    speakerEvents: [],
    attachmentEvents: [],
    allianceEvents: [],
    promissoryNoteEvents: [],
    expeditionEvents: [],
    secondaryEvents: [],
    actionEvents: [],
    rounds: [],
    currentScores,
    currentOwners,
    currentRelics: {},
    currentRound: 1,
    currentPhase: 'strategy',
    currentSpeaker: '',
    currentTurnFaction: '',
    revealedObjectives: [],
    custodiansTaken: false,
    pendingAgenda: null,
    pendingVotes: [],
    pendingRiders: [],
    warnings: [],
  };
}

export function gameReducer(state: ReducerState, entry: RawLogEntry): ReducerState {
  switch (entry.action) {
    case 'SCORE_OBJECTIVE': {
      const factionRaw = entry.event['faction'];
      const objectiveRaw = entry.event['objective'];
      if (typeof factionRaw !== 'string' || typeof objectiveRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `SCORE_OBJECTIVE missing faction/objective at ${entry.timestamp}`] };
      }
      const faction = factionRaw;
      const objective = objectiveRaw;
      const def = getObjectivePoints(objective);
      if (def === null) {
        return { ...state, warnings: [...state.warnings, `Unknown objective: "${objective}" at ${entry.timestamp}`] };
      }
      const prevScore = state.currentScores[faction] ?? 0;
      const newVpEvent: VpEvent = {
        faction,
        objective,
        points: def.points,
        timestamp: entry.timestamp,
        source: 'score_objective',
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return {
        ...state,
        vpEvents: [...state.vpEvents, newVpEvent],
        currentScores: { ...state.currentScores, [faction]: prevScore + def.points },
      };
    }

    case 'UNSCORE_OBJECTIVE': {
      const factionRaw = entry.event['faction'];
      const objectiveRaw = entry.event['objective'];
      if (typeof factionRaw !== 'string' || typeof objectiveRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `UNSCORE_OBJECTIVE missing faction/objective at ${entry.timestamp}`] };
      }
      const faction = factionRaw;
      const objective = objectiveRaw;
      const def = getObjectivePoints(objective);
      if (def === null) {
        return { ...state, warnings: [...state.warnings, `Unknown objective (unscore): "${objective}" at ${entry.timestamp}`] };
      }
      const prevScore = state.currentScores[faction] ?? 0;
      const newVpEvent: VpEvent = {
        faction,
        objective,
        points: -def.points,
        timestamp: entry.timestamp,
        source: 'score_objective',
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return {
        ...state,
        vpEvents: [...state.vpEvents, newVpEvent],
        currentScores: { ...state.currentScores, [faction]: prevScore - def.points },
      };
    }

    case 'CLAIM_PLANET': {
      const factionRaw = entry.event['faction'];
      const planetRaw = entry.event['planet'];
      if (typeof factionRaw !== 'string' || typeof planetRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `CLAIM_PLANET missing faction/planet at ${entry.timestamp}`] };
      }
      const faction = factionRaw;
      const planet = planetRaw;
      const payloadPrevOwner = entry.event['prevOwner'];
      const prevOwner = typeof payloadPrevOwner === 'string'
        ? payloadPrevOwner
        : (state.currentOwners[planet] ?? null);
      const planetEvent: PlanetEvent = {
        faction,
        planet,
        prevOwner,
        timestamp: entry.timestamp,
        type: 'claim',
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      const isCustodians = planet === 'Mecatol Rex' && !state.custodiansTaken;
      const custVpEvent: VpEvent | null = isCustodians
        ? {
            faction,
            objective: 'Custodians Token',
            points: 1,
            timestamp: entry.timestamp,
            source: 'custodians',
            ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
          }
        : null;
      const prevScore = state.currentScores[faction] ?? 0;
      return {
        ...state,
        planetEvents: [...state.planetEvents, planetEvent],
        vpEvents: custVpEvent ? [...state.vpEvents, custVpEvent] : state.vpEvents,
        currentOwners: { ...state.currentOwners, [planet]: faction },
        currentScores: isCustodians
          ? { ...state.currentScores, [faction]: prevScore + 1 }
          : state.currentScores,
        custodiansTaken: state.custodiansTaken || isCustodians,
      };
    }

    case 'UNCLAIM_PLANET': {
      const factionRaw = entry.event['faction'];
      const planetRaw = entry.event['planet'];
      if (typeof factionRaw !== 'string' || typeof planetRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `UNCLAIM_PLANET missing faction/planet at ${entry.timestamp}`] };
      }
      const faction = factionRaw;
      const planet = planetRaw;
      const newOwners = { ...state.currentOwners };
      delete newOwners[planet];
      const planetEvent: PlanetEvent = {
        faction,
        planet,
        prevOwner: state.currentOwners[planet] ?? null,
        timestamp: entry.timestamp,
        type: 'unclaim',
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return {
        ...state,
        planetEvents: [...state.planetEvents, planetEvent],
        currentOwners: newOwners,
      };
    }

    case 'GAIN_RELIC': {
      const factionRaw = entry.event['faction'];
      const relicRaw = entry.event['relic'];
      if (typeof factionRaw !== 'string' || typeof relicRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `GAIN_RELIC missing faction/relic at ${entry.timestamp}`] };
      }
      const faction = factionRaw;
      const relic = relicRaw;
      const relicEvent: RelicEvent = {
        faction,
        relic,
        timestamp: entry.timestamp,
        type: 'gain',
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      const VP_ON_GAIN = new Set(['Shard of the Throne']);
      const grantsVp = VP_ON_GAIN.has(relic);
      const prevScore = state.currentScores[faction] ?? 0;
      const vpEvent: VpEvent | null = grantsVp
        ? {
            faction,
            objective: relic,
            points: 1,
            timestamp: entry.timestamp,
            source: 'relic',
            ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
          }
        : null;
      return {
        ...state,
        relicEvents: [...state.relicEvents, relicEvent],
        vpEvents: vpEvent ? [...state.vpEvents, vpEvent] : state.vpEvents,
        currentRelics: { ...state.currentRelics, [relic]: faction },
        currentScores: grantsVp
          ? { ...state.currentScores, [faction]: prevScore + 1 }
          : state.currentScores,
      };
    }

    case 'PLAY_RELIC': {
      const relicRaw = entry.event['relic'];
      if (typeof relicRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `PLAY_RELIC missing relic at ${entry.timestamp}`] };
      }
      const relic = relicRaw;
      const owner = state.currentRelics[relic];
      if (owner === undefined) {
        return { ...state, warnings: [...state.warnings, `PLAY_RELIC for "${relic}" has no known owner at ${entry.timestamp}`] };
      }
      const faction = owner;
      const relicEvent: RelicEvent = {
        faction,
        relic,
        timestamp: entry.timestamp,
        type: 'play',
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      const VP_ON_PLAY = new Set(['Crown of Emphidia', 'The Crown of Emphidia']);
      const grantsVp = VP_ON_PLAY.has(relic);
      const prevScore = state.currentScores[faction] ?? 0;
      const vpEvent: VpEvent | null = grantsVp
        ? {
            faction,
            objective: relic,
            points: 1,
            timestamp: entry.timestamp,
            source: 'relic',
            ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
          }
        : null;
      return {
        ...state,
        relicEvents: [...state.relicEvents, relicEvent],
        vpEvents: vpEvent ? [...state.vpEvents, vpEvent] : state.vpEvents,
        currentScores: grantsVp
          ? { ...state.currentScores, [faction]: prevScore + 1 }
          : state.currentScores,
      };
    }

    case 'LOSE_RELIC': {
      const factionRaw = entry.event['faction'];
      const relicRaw = entry.event['relic'];
      if (typeof factionRaw !== 'string' || typeof relicRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `LOSE_RELIC missing faction/relic at ${entry.timestamp}`] };
      }
      const faction = factionRaw;
      const relic = relicRaw;
      const relicEvent: RelicEvent = {
        faction,
        relic,
        timestamp: entry.timestamp,
        type: 'lose',
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      const VP_ON_LOSE = new Set(['Shard of the Throne']);
      const losesVp = VP_ON_LOSE.has(relic);
      const prevScore = state.currentScores[faction] ?? 0;
      const vpEvent: VpEvent | null = losesVp
        ? {
            faction,
            objective: relic,
            points: -1,
            timestamp: entry.timestamp,
            source: 'relic',
            ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
          }
        : null;
      const newRelics = { ...state.currentRelics };
      delete newRelics[relic];
      return {
        ...state,
        relicEvents: [...state.relicEvents, relicEvent],
        vpEvents: vpEvent ? [...state.vpEvents, vpEvent] : state.vpEvents,
        currentRelics: newRelics,
        currentScores: losesVp
          ? { ...state.currentScores, [faction]: prevScore - 1 }
          : state.currentScores,
      };
    }

    // Cases added in Tasks 5–12
    default:
      return {
        ...state,
        warnings: [...state.warnings, `Unknown action: ${entry.action}`],
      };
  }
}
