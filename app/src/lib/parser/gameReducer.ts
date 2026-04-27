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

    case 'REVEAL_AGENDA': {
      const agendaRaw = entry.event['agenda'];
      const agenda = typeof agendaRaw === 'string' ? agendaRaw : '';
      return {
        ...state,
        pendingAgenda: agenda,
        pendingVotes: [],
        pendingRiders: [],
      };
    }

    case 'CAST_VOTES': {
      if (state.pendingAgenda === null) {
        return { ...state, warnings: [...state.warnings, `CAST_VOTES with no pending agenda at ${entry.timestamp}`] };
      }
      const factionRaw = entry.event['faction'];
      const targetRaw = entry.event['target'];
      const votesRaw = entry.event['votes'];
      const extraRaw = entry.event['extraVotes'];
      if (typeof factionRaw !== 'string' || typeof targetRaw !== 'string' || typeof votesRaw !== 'number') {
        return { ...state, warnings: [...state.warnings, `CAST_VOTES missing fields at ${entry.timestamp}`] };
      }
      const totalVotes = votesRaw + (typeof extraRaw === 'number' ? extraRaw : 0);
      const vote: AgendaVote = { faction: factionRaw, outcome: targetRaw, votes: totalVotes };
      return { ...state, pendingVotes: [...state.pendingVotes, vote] };
    }

    case 'PLAY_RIDER': {
      if (state.pendingAgenda === null) {
        return { ...state, warnings: [...state.warnings, `PLAY_RIDER with no pending agenda at ${entry.timestamp}`] };
      }
      const factionRaw = entry.event['faction'];
      const riderRaw = entry.event['rider'];
      const outcomeRaw = entry.event['outcome'];
      if (typeof factionRaw !== 'string' || typeof riderRaw !== 'string' || typeof outcomeRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `PLAY_RIDER missing fields at ${entry.timestamp}`] };
      }
      const rider: AgendaRider = { faction: factionRaw, rider: riderRaw, outcome: outcomeRaw };
      return { ...state, pendingRiders: [...state.pendingRiders, rider] };
    }

    case 'HIDE_AGENDA':
      return {
        ...state,
        pendingAgenda: null,
        pendingVotes: [],
        pendingRiders: [],
      };

    case 'RESOLVE_AGENDA': {
      const agendaRaw = entry.event['agenda'];
      const targetRaw = entry.event['target'];
      if (typeof agendaRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `RESOLVE_AGENDA missing agenda at ${entry.timestamp}`] };
      }
      const agenda = agendaRaw;
      const outcome = typeof targetRaw === 'string' ? targetRaw : '';
      const resolution: AgendaResolution = {
        agenda,
        outcome,
        round: state.currentRound,
        timestamp: entry.timestamp,
        votes: state.pendingVotes,
        riders: state.pendingRiders,
      };

      // Apply agenda-specific VP rules
      const newVpEvents: VpEvent[] = [];
      let newScores = { ...state.currentScores };

      // Rider VPs: Imperial Rider grants +1 VP if its predicted outcome matches the resolved target.
      const VP_RIDERS = new Set(['Imperial Rider']);
      for (const r of state.pendingRiders) {
        if (VP_RIDERS.has(r.rider) && r.outcome === outcome) {
          newVpEvents.push({
            faction: r.faction,
            objective: r.rider,
            points: 1,
            timestamp: entry.timestamp,
            source: 'rider',
            ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
          });
          newScores = { ...newScores, [r.faction]: (newScores[r.faction] ?? 0) + 1 };
        }
      }

      if (agenda === 'Seed of an Empire') {
        const scoreEntries = Object.entries(state.currentScores);
        if (scoreEntries.length > 0) {
          const scoreValues = scoreEntries.map(([, s]) => s);
          const maxScore = Math.max(...scoreValues);
          const minScore = Math.min(...scoreValues);
          if (maxScore !== minScore) {
            for (const [f, score] of scoreEntries) {
              if (score === maxScore) {
                newVpEvents.push({
                  faction: f,
                  objective: agenda,
                  points: 1,
                  timestamp: entry.timestamp,
                  source: 'agenda',
                  ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
                });
                newScores = { ...newScores, [f]: (newScores[f] ?? 0) + 1 };
              } else if (score === minScore) {
                newVpEvents.push({
                  faction: f,
                  objective: agenda,
                  points: -1,
                  timestamp: entry.timestamp,
                  source: 'agenda',
                  ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
                });
                newScores = { ...newScores, [f]: (newScores[f] ?? 0) - 1 };
              }
            }
          }
        }
      }

      return {
        ...state,
        agendaResolutions: [...state.agendaResolutions, resolution],
        vpEvents: [...state.vpEvents, ...newVpEvents],
        currentScores: newScores,
        pendingAgenda: null,
        pendingVotes: [],
        pendingRiders: [],
      };
    }

    case 'START_VOTING':
    case 'SELECT_ELIGIBLE_OUTCOMES':
    case 'SPEAKER_TIE_BREAK':
      return state;

    case 'ADD_TECH':
    case 'REMOVE_TECH':
    case 'CHOOSE_STARTING_TECH':
    case 'PURGE_TECH': {
      const factionRaw = entry.event['faction'];
      const techRaw = entry.event['tech'];
      if (typeof factionRaw !== 'string' || typeof techRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `${entry.action} missing faction/tech at ${entry.timestamp}`] };
      }
      const techType: TechEvent['type'] =
        entry.action === 'ADD_TECH' ? 'research'
        : entry.action === 'REMOVE_TECH' ? 'remove'
        : entry.action === 'CHOOSE_STARTING_TECH' ? 'starting'
        : 'purge';
      const techEvent: TechEvent = {
        faction: factionRaw,
        tech: techRaw,
        timestamp: entry.timestamp,
        type: techType,
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return { ...state, techEvents: [...state.techEvents, techEvent] };
    }

    case 'ASSIGN_STRATEGY_CARD': {
      const assignedRaw = entry.event['assignedTo'];
      const idRaw = entry.event['id'];
      if (typeof assignedRaw !== 'string' || typeof idRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `ASSIGN_STRATEGY_CARD missing fields at ${entry.timestamp}`] };
      }
      const ev: StrategyCardEvent = {
        faction: assignedRaw,
        card: idRaw,
        timestamp: entry.timestamp,
        type: 'pick',
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return { ...state, strategyCardEvents: [...state.strategyCardEvents, ev] };
    }

    case 'MARK_PRIMARY': {
      const factionRaw = entry.event['faction'];
      const stateRaw = entry.event['state'];
      if (typeof factionRaw !== 'string' || typeof stateRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `MARK_PRIMARY missing fields at ${entry.timestamp}`] };
      }
      if (stateRaw !== 'DONE') {
        return state; // SKIPPED or other → no-op
      }
      const ev: StrategyCardEvent = {
        faction: factionRaw,
        card: '',
        timestamp: entry.timestamp,
        type: 'play_primary',
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return { ...state, strategyCardEvents: [...state.strategyCardEvents, ev] };
    }

    case 'MARK_SECONDARY': {
      const factionRaw = entry.event['faction'];
      const stateRaw = entry.event['state'];
      if (typeof factionRaw !== 'string' || typeof stateRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `MARK_SECONDARY missing fields at ${entry.timestamp}`] };
      }
      let secondaryType: SecondaryEvent['type'];
      if (stateRaw === 'DONE') {
        secondaryType = 'follow';
      } else if (stateRaw === 'SKIPPED') {
        secondaryType = 'abstain';
      } else {
        return { ...state, warnings: [...state.warnings, `MARK_SECONDARY unknown state "${stateRaw}" at ${entry.timestamp}`] };
      }
      const ev: SecondaryEvent = {
        faction: factionRaw,
        strategyCard: '',
        timestamp: entry.timestamp,
        type: secondaryType,
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return { ...state, secondaryEvents: [...state.secondaryEvents, ev] };
    }

    // Cases added in Tasks 5–12
    default:
      return {
        ...state,
        warnings: [...state.warnings, `Unknown action: ${entry.action}`],
      };
  }
}
