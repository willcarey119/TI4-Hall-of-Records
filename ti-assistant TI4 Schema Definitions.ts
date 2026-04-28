// ti4_schema.ts
// This file contains the TypeScript interfaces for the TI Assistant JSON export.

/** * Represents a single Faction's setup configuration.
 */
export interface FactionSetup {
    id: string;
    color: string;
    playerName: string;
    mapPosition?: number;
    order?: number;
    commandCounters?: number;
    startswith?: {
        planets?: string[];
        techs?: string[];
        units?: Record<string, number>;
        choice?: {
            description: string;
            options: string[];
            select: number;
        };
    };
    techs?: Record<string, { state: string }>;
    breakthrough?: { state: string };
    passed?: boolean;
}

/** * Represents the initial game configuration and map.
 */
export interface GameOptions {
    expansions: string[];
    events: string[];
    "game-variant": string;
    "map-style": string;
    "map-string": string;
    "processed-map-string": string;
    "hide-objectives": boolean;
    "hide-planets": boolean;
    "hide-techs": boolean;
    hide: string[];
    "victory-points": number;
    "secondary-victory-points": number;
}

/**
 * Represents the core event payload. The structure of 'event' 
 * changes drastically based on the 'action' type.
 */
export interface GameEventPayload {
    action: string; // e.g., "SCORE_OBJECTIVE", "CLAIM_PLANET", "END_TURN"
    event: Record<string, any>; // The specific details of the action
    gameTime: number;
    timestamp: number;
}

/**
 * Represents a single chronological entry in the action log.
 */
export interface ActionLogEntry {
    timestampMillis: number;
    gameSeconds: number;
    schema: string;
    data: GameEventPayload;
}

/**
 * The Root Object of the exported JSON file.
 */
export interface TI4ExportData {
    data: {
        factions: FactionSetup[];
        speaker: number;
        options: GameOptions;
    };
    timers: Record<string, number>; // Maps player/game names to elapsed seconds
    actionLog: ActionLogEntry[];
}