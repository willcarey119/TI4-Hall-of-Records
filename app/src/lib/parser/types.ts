// src/lib/parser/types.ts
// All exported TypeScript interfaces for the ParsedGame output contract.
// Zero runtime code — pure type definitions.

export type VpSource =
  | 'score_objective'
  | 'custodians'
  | 'support_for_throne'
  | 'imperial_point'
  | 'relic'
  | 'agenda'
  | 'rider'
  | 'legendary_planet' // e.g. Styx (Discordant Stars)
  | 'manual';

export type ObjectiveStage =
  | 'I'
  | 'II'
  | 'secret'
  | 'support'
  | 'imperial'
  | 'agenda'
  | 'relic'
  | 'legendary'
  | 'other';

/** Internal flat log entry. parseGame normalizes the wrapped raw export entries
 *  ({ timestampMillis, data: { action, event, timestamp }, gameSeconds }) into this shape. */
export interface RawLogEntry {
  action: string;
  event: Record<string, unknown>;
  timestamp: number;
  gameTime?: number;
}

export interface FactionSetup {
  factionId: string;
  playerName: string;
  color: string;
  mapPosition: number;
  startingTechs: string[];
  startingPlanets: string[];
}

export interface GameTimers {
  game: number;
  factions: Record<string, number>;
  secondaries: Record<string, number>;
  agendas: { first: number; second: number };
}

export interface RoundState {
  round: number;
  phase: string;
  speaker: string;
  strategyCards: Record<string, string>;
}

export interface VpEvent {
  faction: string;
  objective: string;
  points: number;
  timestamp: number;
  gameTime?: number;
  source: VpSource;
}

export interface PlanetEvent {
  faction: string;
  planet: string;
  prevOwner: string | null;
  timestamp: number;
  gameTime?: number;
  type: 'claim' | 'unclaim';
}

export interface TechEvent {
  faction: string;
  tech: string;
  timestamp: number;
  gameTime?: number;
  type: 'research' | 'remove' | 'starting' | 'purge';
}

export interface AgendaVote {
  faction: string;
  outcome: string;
  votes: number;
}

export interface AgendaRider {
  faction: string;
  rider: string;
  outcome: string;
}

export interface AgendaResolution {
  agenda: string;
  outcome: string;
  round: number;
  timestamp: number;
  votes: AgendaVote[];
  riders: AgendaRider[];
}

export interface StrategyCardEvent {
  faction: string;
  card: string;
  timestamp: number;
  gameTime?: number;
  type: 'pick' | 'play_primary' | 'play_secondary' | 'pass_secondary';
}

export interface ActionCardEvent {
  faction: string;
  card: string;
  timestamp: number;
  gameTime?: number;
  type: 'play' | 'discard';
  target?: string;
}

export interface ComponentEvent {
  faction: string;
  component: string;
  timestamp: number;
  gameTime?: number;
}

export interface RelicEvent {
  faction: string;
  relic: string;
  timestamp: number;
  gameTime?: number;
  type: 'gain' | 'play' | 'lose';
}

export interface LeaderEvent {
  faction: string;
  leader: string;
  timestamp: number;
  gameTime?: number;
  type: 'unlock' | 'play' | 'exhaust' | 'purge' | 'state_change';
}

export interface ObjectiveReveal {
  objective: string;
  stage: 'I' | 'II';
  round: number;
  timestamp: number;
}

export interface SpeakerEvent {
  prevSpeaker: string;
  newSpeaker: string;
  timestamp: number;
  gameTime?: number;
}

export interface AttachmentEvent {
  faction: string | null;
  planet: string;
  attachment: string;
  timestamp: number;
  gameTime?: number;
  type: 'attach' | 'detach';
}

export interface AllianceEvent {
  faction1: string;
  faction2: string;
  timestamp: number;
  gameTime?: number;
  type: 'form' | 'break';
}

export interface PromissoryNoteEvent {
  fromFaction: string;
  toFaction: string;
  note: string;
  timestamp: number;
  gameTime?: number;
  type: 'play' | 'return';
}

export interface ExpeditionEvent {
  faction: string;
  planet: string;
  timestamp: number;
  gameTime?: number;
}

export interface SecondaryEvent {
  faction: string;
  strategyCard: string;
  timestamp: number;
  gameTime?: number;
  type: 'follow' | 'abstain';
}

export interface ActionEvent {
  faction: string;
  action: string;
  timestamp: number;
  gameTime?: number;
}

export interface ParsedGame {
  // Identity
  gameId: string;
  playedAt: number;
  durationSeconds: number;
  // Setup
  factions: FactionSetup[];
  options: Record<string, unknown>;
  initialSpeaker: string;
  rounds: RoundState[];
  // Event arrays — all sorted ascending by timestamp
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
  // Aggregates
  finalScores: Record<string, number>;
  winner: string | null;
  // Diagnostics
  timers: GameTimers;
  warnings: string[];
}
