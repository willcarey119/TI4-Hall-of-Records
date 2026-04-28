# **TI4 "Hall of Records" \- Master Guidance Document**

> **DEPRECATED as of 2026-04-26.**
> This document is superseded by [`ROADMAP.md`](ROADMAP.md) (phased delivery plan) and [`SKILLS.md`](SKILLS.md) (engineering playbook). Key decisions here have been overridden:
> - Phase 3 alias resolution engine → **retired**; factions are the primary axis (see ROADMAP §3 pivot)
> - Player-centric `players` Firestore collection → **retired**; no canonical player IDs
> - TypeScript interfaces in §5 → **outdated**; use `ti-assistant TI4 Schema Definitions.ts` as the source of truth
>
> Kept for historical context only. Do not use as a reference for implementation decisions.

## **1\. Executive Summary**

The TI4 "Hall of Records" is a lightweight, high-performance web application designed to parse, store, and visualize Twilight Imperium 4th Edition (with PoK & Discordant Stars) game logs exported from TI Assistant. The app will provide an interactive Single-Game Replay dashboard and an aggregate Meta-Dashboard for long-term playgroup statistics.

## **2\. Technology Stack & Architecture**

* **Frontend:** React.js (with TypeScript) for component-driven UI.  
* **Styling:** Tailwind CSS for rapid, utility-based "Deep Space" dark mode styling.  
* **Data Visualization:** Recharts or Chart.js for responsive SVG/Canvas graphs.  
* **Backend / Database:** Firebase Firestore (NoSQL).  
  * *Architecture (Parse on Upload):* Raw JSON files are parsed client-side upon upload. Only the clean, extracted, and aggregated data is saved to Firestore.  
* **Hosting:** Vercel. Chosen for its tier-1 edge caching, ensuring the dashboard loads instantly for all users.

## **3\. Development Phasing & Roadmap**

### **Phase 1: Setup & The Ingestion Engine**

* **Goal:** Create the React project, configure Firebase, and build the parser.  
* **Key Features:**  
  * File dropzone UI.  
  * Data Parser: Extracts VP events, planet control events, and tech acquisitions from the raw actionLog.  
  * Firestore Writes: Saves the parsed game data to the database.

### **Phase 2: Single Game Replay (The MVP)**

* **Goal:** Visualize a single match from start to finish.  
* **Key Features:**  
  * **The VP Race:** A line chart plotting Victory Points over time for all factions.  
  * **Action Timeline:** A scrolling, chronological feed of major game events.  
  * **Planet Control Ledger (Map Prototype):** A UI component that tracks the ownership of planets. Includes special visual highlights for **Mecatol Rex** and Legendary Planets (e.g., Hope's End, Primor, Discordant Stars legendaries) changing hands.

### **Phase 3: The Meta-Dashboard & Alias Engine**

* **Goal:** Aggregate data across all uploaded games.  
* **Key Features:**  
  * **Alias Resolution UI:** A tool to merge inconsistent player names (e.g., linking "Tim L", "Tim", and "Yssaril \- Tim" into one unified "Tim" player profile).  
  * **Group Analytics:** Faction win/pick rates (bar charts).  
  * **Tech & Strategy Trends:** Visual representations of the most picked Strategy Cards and most researched technologies across the playgroup's history.

### **Phase 4: Polish & Optimization**

* **Goal:** Finalize UI/UX and deploy.  
* **Key Features:**  
  * Apply the cohesive "Deep Space" dark mode aesthetic.  
  * Optimize queries and add loading skeletons.  
  * Deploy live via Vercel.

## **4\. Engineering Standards & TDD**

### **TDD (Red-Green-Refactor)**

All data-parsing utility functions must be written using Test-Driven Development.

1. Write a test asserting the expected output of a parsed TI Assistant event.  
2. Write the minimum logic to extract that data.  
3. Refactor for performance and type safety.

### **Core Rules**

1. **Strict TypeScript:** No any types. Everything must conform to the Data Dictionary below.  
2. **Pure Components:** React components should primarily handle rendering. Complex parsing loops should live in isolated, testable pure functions (e.g., parseVpEvents(actionLog)).  
3. **Feature-Based Routing:** Organize files by feature (e.g., /features/upload, /features/game-view) rather than by type (/components, /hooks).

## **5\. Data Dictionary (TypeScript Interfaces)**

The following schema defines the raw data structure ingested from the TI Assistant JSON, which forms the basis for our parsing engine.

// Core Data Dictionary

export interface FactionSetup {  
    id: string;  
    color: string;  
    playerName: string; // Used for Alias matching  
    mapPosition?: number;  
    order?: number;  
    startswith?: {  
        planets?: string\[\];  
        techs?: string\[\];  
        units?: Record\<string, number\>;  
    };  
    techs?: Record\<string, { state: string }\>;  
}

export interface GameOptions {  
    expansions: string\[\];  
    "game-variant": string;  
    "map-string": string;  
    "victory-points": number;  
}

export interface GameEventPayload {  
    action: string; // e.g., "SCORE\_OBJECTIVE", "CLAIM\_PLANET", "ADD\_TECH"  
    event: Record\<string, any\>; // Variable payload  
    gameTime: number;  
    timestamp: number;  
}

export interface ActionLogEntry {  
    timestampMillis: number;  
    gameSeconds: number;  
    schema: string;  
    data: GameEventPayload;  
}

export interface TI4ExportData {  
    data: {  
        factions: FactionSetup\[\];  
        speaker: number;  
        options: GameOptions;  
    };  
    timers: Record\<string, number\>;  
    actionLog: ActionLogEntry\[\];  
}

### **Proposed Firestore Structure (Post-Parsing)**

* **Collection games**:  
  * Document ID: \[game\_timestamp\]  
  * Contains: Arrays of vpEvents, planetEvents, techEvents, and participants.  
* **Collection players**:  
  * Document ID: \[unified\_player\_name\]  
  * Contains: knownAliases: string\[\], aggregate stats.