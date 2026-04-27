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
    // Cases added in Tasks 4–12
    default:
      return {
        ...state,
        warnings: [...state.warnings, `Unknown action: ${entry.action}`],
      };
  }
}
