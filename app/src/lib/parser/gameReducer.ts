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
      if (typeof factionRaw !== 'string' || typeof riderRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `PLAY_RIDER missing fields at ${entry.timestamp}`] };
      }
      const outcome = typeof outcomeRaw === 'string' ? outcomeRaw : '';
      const rider: AgendaRider = { faction: factionRaw, rider: riderRaw, outcome };
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
    case 'CHOOSE_STARTING_TECH': {
      const factionRaw = entry.event['faction'];
      const techRaw = entry.event['tech'];
      if (typeof factionRaw !== 'string' || typeof techRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `${entry.action} missing faction/tech at ${entry.timestamp}`] };
      }
      const techType: TechEvent['type'] =
        entry.action === 'ADD_TECH' ? 'research'
        : entry.action === 'REMOVE_TECH' ? 'remove'
        : 'starting';
      const techEvent: TechEvent = {
        faction: factionRaw,
        tech: techRaw,
        timestamp: entry.timestamp,
        type: techType,
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return { ...state, techEvents: [...state.techEvents, techEvent] };
    }

    case 'PURGE_TECH': {
      // Real payload: { techId: string } — uses techId (not tech) and has no faction.
      const techRaw = entry.event['techId'];
      if (typeof techRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `PURGE_TECH missing techId at ${entry.timestamp}`] };
      }
      const techEvent: TechEvent = {
        faction: state.currentTurnFaction,
        tech: techRaw,
        timestamp: entry.timestamp,
        type: 'purge',
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
      // Real payload: { completed: boolean }. No faction field — use currentTurnFaction.
      const completed = entry.event['completed'];
      if (completed !== true) return state; // false or missing → no-op
      const ev: StrategyCardEvent = {
        faction: state.currentTurnFaction,
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

    case 'PLAY_COMPONENT': {
      const factionRaw = entry.event['factionId'];
      const nameRaw = entry.event['name'];
      if (typeof factionRaw !== 'string' || typeof nameRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `PLAY_COMPONENT missing fields at ${entry.timestamp}`] };
      }
      const ev: ComponentEvent = {
        faction: factionRaw,
        component: nameRaw,
        timestamp: entry.timestamp,
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return { ...state, componentEvents: [...state.componentEvents, ev] };
    }

    case 'END_TURN': {
      const prevRaw = entry.event['prevFaction'];
      if (typeof prevRaw !== 'string') return state;
      return { ...state, currentTurnFaction: prevRaw };
    }

    case 'SELECT_ACTION':
      return state;

    case 'PLAY_ACTION_CARD': {
      const cardRaw = entry.event['card'];
      if (typeof cardRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `PLAY_ACTION_CARD missing card at ${entry.timestamp}`] };
      }
      const targetRaw = entry.event['target'];
      const faction = state.currentTurnFaction;
      const warnings = faction === ''
        ? [...state.warnings, `PLAY_ACTION_CARD with no known turn faction at ${entry.timestamp}`]
        : state.warnings;
      const ev: ActionCardEvent = {
        faction,
        card: cardRaw,
        timestamp: entry.timestamp,
        type: 'play',
        ...(typeof targetRaw === 'string' ? { target: targetRaw } : {}),
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return {
        ...state,
        actionCardEvents: [...state.actionCardEvents, ev],
        warnings,
      };
    }

    case 'SET_SPEAKER': {
      const newSpeakerRaw = entry.event['newSpeaker'];
      const prevSpeakerRaw = entry.event['prevSpeaker'];
      if (typeof newSpeakerRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `SET_SPEAKER missing newSpeaker at ${entry.timestamp}`] };
      }
      const ev: SpeakerEvent = {
        newSpeaker: newSpeakerRaw,
        prevSpeaker: typeof prevSpeakerRaw === 'string' ? prevSpeakerRaw : '',
        timestamp: entry.timestamp,
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return {
        ...state,
        speakerEvents: [...state.speakerEvents, ev],
        currentSpeaker: newSpeakerRaw,
      };
    }

    case 'UPDATE_LEADER_STATE': {
      const leaderRaw = entry.event['leaderId'];
      const stateRaw = entry.event['state'];
      const prevStateRaw = entry.event['prevState'];
      if (typeof leaderRaw !== 'string' || typeof stateRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `UPDATE_LEADER_STATE missing fields at ${entry.timestamp}`] };
      }
      let leaderType: LeaderEvent['type'];
      if (prevStateRaw === 'locked') leaderType = 'unlock';
      else if (stateRaw === 'exhausted') leaderType = 'exhaust';
      else if (stateRaw === 'purged') leaderType = 'purge';
      else leaderType = 'state_change';
      const ev: LeaderEvent = {
        faction: state.currentTurnFaction,
        leader: leaderRaw,
        timestamp: entry.timestamp,
        type: leaderType,
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return { ...state, leaderEvents: [...state.leaderEvents, ev] };
    }

    case 'ADD_ATTACHMENT': {
      const attachmentRaw = entry.event['attachment'];
      const planetRaw = entry.event['planet'];
      if (typeof attachmentRaw !== 'string' || typeof planetRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `ADD_ATTACHMENT missing fields at ${entry.timestamp}`] };
      }
      const planet = planetRaw;
      const ownerOrNull: string | null = state.currentOwners[planet] ?? null;
      const ev: AttachmentEvent = {
        faction: ownerOrNull,
        planet,
        attachment: attachmentRaw,
        timestamp: entry.timestamp,
        type: 'attach',
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return { ...state, attachmentEvents: [...state.attachmentEvents, ev] };
    }

    case 'GAIN_ALLIANCE': {
      const factionRaw = entry.event['faction'];
      const fromRaw = entry.event['fromFaction'];
      if (typeof factionRaw !== 'string' || typeof fromRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `GAIN_ALLIANCE missing fields at ${entry.timestamp}`] };
      }
      const ev: AllianceEvent = {
        faction1: factionRaw,
        faction2: fromRaw,
        timestamp: entry.timestamp,
        type: 'form',
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return { ...state, allianceEvents: [...state.allianceEvents, ev] };
    }

    case 'COMMIT_TO_EXPEDITION': {
      // Real payload usually { expedition, factionId }, but undo entries have prevFaction instead.
      const factionIdRaw = entry.event['factionId'];
      const prevFactionRaw = entry.event['prevFaction'];
      const factionRaw = typeof factionIdRaw === 'string' ? factionIdRaw
        : typeof prevFactionRaw === 'string' ? prevFactionRaw
        : null;
      const expRaw = entry.event['expedition'];
      if (factionRaw === null || typeof expRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `COMMIT_TO_EXPEDITION missing fields at ${entry.timestamp}`] };
      }
      const ev: ExpeditionEvent = {
        faction: factionRaw,
        planet: expRaw,
        timestamp: entry.timestamp,
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return { ...state, expeditionEvents: [...state.expeditionEvents, ev] };
    }

    case 'PLAY_PROMISSORY_NOTE': {
      const cardRaw = entry.event['card'];
      const targetRaw = entry.event['target'];
      if (typeof cardRaw !== 'string' || typeof targetRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `PLAY_PROMISSORY_NOTE missing fields at ${entry.timestamp}`] };
      }
      const fromFaction = state.currentTurnFaction;
      const warnings = fromFaction === ''
        ? [...state.warnings, `PLAY_PROMISSORY_NOTE with no known turn faction at ${entry.timestamp}`]
        : state.warnings;
      const ev: PromissoryNoteEvent = {
        fromFaction,
        toFaction: targetRaw,
        note: cardRaw,
        timestamp: entry.timestamp,
        type: 'play',
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return { ...state, promissoryNoteEvents: [...state.promissoryNoteEvents, ev], warnings };
    }

    case 'REVEAL_OBJECTIVE': {
      const objRaw = entry.event['objective'];
      if (typeof objRaw !== 'string') {
        return { ...state, warnings: [...state.warnings, `REVEAL_OBJECTIVE missing objective at ${entry.timestamp}`] };
      }
      const objective = objRaw;
      const def = getObjectivePoints(objective);
      const newRevealed = [...state.revealedObjectives, objective];
      if (def === null) {
        return {
          ...state,
          revealedObjectives: newRevealed,
          warnings: [...state.warnings, `REVEAL_OBJECTIVE for unknown objective "${objective}" at ${entry.timestamp}`],
        };
      }
      if (def.stage !== 'I' && def.stage !== 'II') {
        return {
          ...state,
          revealedObjectives: newRevealed,
          warnings: [...state.warnings, `REVEAL_OBJECTIVE for non-public objective "${objective}" (stage=${def.stage}) at ${entry.timestamp}`],
        };
      }
      const reveal: ObjectiveReveal = {
        objective,
        stage: def.stage,
        round: state.currentRound,
        timestamp: entry.timestamp,
      };
      return {
        ...state,
        objectiveReveals: [...state.objectiveReveals, reveal],
        revealedObjectives: newRevealed,
      };
    }

    case 'ADVANCE_PHASE': {
      const skipAgendaRaw = entry.event['skipAgenda'];
      const skipAgenda = skipAgendaRaw === true;
      const PHASE_ORDER = ['strategy', 'action', 'status', 'agenda'] as const;
      const currentIdx = PHASE_ORDER.indexOf(state.currentPhase as typeof PHASE_ORDER[number]);
      let nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1);
      if (skipAgenda && PHASE_ORDER[nextIdx] === 'agenda') nextIdx += 1;
      const wrapped = nextIdx >= PHASE_ORDER.length;
      const nextPhase = wrapped ? 'strategy' : (PHASE_ORDER[nextIdx] ?? 'strategy');
      const nextRound = wrapped ? state.currentRound + 1 : state.currentRound;
      const roundState: RoundState = {
        round: state.currentRound,
        phase: state.currentPhase,
        speaker: state.currentSpeaker,
        strategyCards: {},
      };
      return {
        ...state,
        rounds: [...state.rounds, roundState],
        currentPhase: nextPhase,
        currentRound: nextRound,
      };
    }

    case 'REPEAL_AGENDA':
    case 'UNPASS':
    case 'SWAP_MAP_TILES':
    case 'SWAP_STRATEGY_CARDS':
    case 'CHOOSE_SUB_FACTION':
    case 'SELECT_SUB_AGENDA':
    case 'SELECT_SUB_COMPONENT':
    case 'PLAY_ADJUDICATOR_BAAL':
    case 'END_GAME': {
      const ev: ActionEvent = {
        faction: state.currentTurnFaction,
        action: entry.action,
        timestamp: entry.timestamp,
        ...(entry.gameTime !== undefined ? { gameTime: entry.gameTime } : {}),
      };
      return { ...state, actionEvents: [...state.actionEvents, ev] };
    }

    // Cases added in Tasks 5–12
    default:
      return {
        ...state,
        warnings: [...state.warnings, `Unknown action: ${entry.action}`],
      };
  }
}
