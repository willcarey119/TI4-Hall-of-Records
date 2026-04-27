# Handoff: TI4 Tracker — Wireframe Exploration

## Overview

A post-game stat tracker / shareable infographic app for **Twilight Imperium 4th Edition**. The app ingests JSON exports from `ti-assistant.com` and renders a "newspaper / almanac" style recap of the game — initiative, VP race, combats, agendas, objectives, and an end-game broadsheet.

This bundle contains **wireframe exploration** for ten screens, with four variations each, presented on a pan/zoom design canvas.

## About the Design Files

The files in this bundle are **design references created in HTML/JSX** — prototypes showing intended look, structure, and feel. They are **not production code to copy directly**.

Your task is to **recreate these designs in the target codebase's environment** (React + your existing styling system, Next.js, Vue, SwiftUI, etc.) using established patterns and libraries. If no framework exists yet, React + Vite + CSS Modules (or Tailwind) is a reasonable default given the design's typographic density.

The wireframes use inline React (Babel standalone) for fast iteration — production code should split components properly, type props, and replace placeholder data with real shapes from `ti-assistant.com` exports.

## Fidelity

**Mid-fidelity wireframes.** Real type hierarchy, real layout, real data viz — but:
- Faction colors are placeholders (oklch values, not the official palette)
- Iconography is text/SVG glyphs (`✦`, `♔`, `⚔`, `⚖`) — replace with proper SVG icons or faction crests
- Sample data is illustrative ("Hacan", "Sol", round 5 of 7); real data comes from JSON
- Hex planet board is decorative — needs real hex grid logic
- "Sketchy" dashed-border placeholders mark slots for hi-fi assets (faction art, flagship images)

Treat the wireframes as the **structural blueprint and aesthetic direction**. A second hi-fi pass is recommended once data shapes are wired up.

## Aesthetic Direction

**Newspaper / almanac post-game recap.** Editorial broadsheet vibe — masthead, ruled dividers, drop caps, multi-column body, small-caps labels, hand-annotated margin notes. Dense but legible, inspired by historical almanacs and modern editorial design (think *The Economist* or *NYT* opinion-section data viz, not flashy gamer UIs).

### Type System

| Role | Family | Source |
|---|---|---|
| Display / headlines | **Newsreader** | Google Fonts |
| Body / UI | **IBM Plex Sans** | Google Fonts |
| Data captions, labels, mono | **IBM Plex Mono** | Google Fonts |
| Margin annotations (dev/comment notes) | **Caveat** | Google Fonts |

Specimen weights actually used: Newsreader 400/600/700/800 + italic; Plex Sans 400/500/600/700; Plex Mono 400/600; Caveat 400/700.

### Color Tokens

All defined as CSS custom properties in `wireframes.css`:

```css
--paper:   oklch(0.97 0.012 80);    /* warm newsprint */
--paper-2: oklch(0.94 0.014 80);    /* slightly darker fill */
--rule:    oklch(0.18 0.01 60);     /* rule lines */
--ink:     oklch(0.18 0.01 60);     /* primary text */
--ink-2:   oklch(0.34 0.01 60);     /* secondary text */
--ink-3:   oklch(0.52 0.01 60);     /* tertiary / captions */
--ink-4:   oklch(0.72 0.01 60);     /* dividers, disabled */
--accent:  oklch(0.45 0.12 25);     /* faded vermillion — "stop press" */
--cool:    oklch(0.45 0.08 240);    /* faded ink-blue — secondary accent */
--gold:    oklch(0.62 0.10 75);     /* tech color: yellow */
--moss:    oklch(0.45 0.06 145);    /* tech color: green */
```

Faction placeholder colors live as `.f-sol`, `.f-hac`, `.f-xxc`, `.f-arb`, `.f-emir`, `.f-naal`, `.f-jol`, `.f-mahact` — replace with the official 25-faction palette.

### Spacing & Rules

- Base unit: 4px. Common values: 4, 6, 8, 10, 12, 14, 16.
- Three rule weights: thin (`1px solid`), thick (`2px solid`), double (`3px double`). All use `var(--rule)`.
- Drop caps: 3.2em, float-left, colored with `--accent`.
- Two-column body: `columns: 2; column-gap: 12px; column-rule: 1px solid var(--ink-4);`

## Screens

Each section in `TI4 Tracker Wireframes.html` is one screen with four variations (A–D). Variations escalate left-to-right from "conventional newspaper layout" to "novel data-viz / interaction".

### 01 · Round / Phase Tracker
**Purpose:** Where in the game are we? (Round N of 7, Phase X of 4, who's active.)
- **A** Broadsheet front page — masthead + 2-col body + initiative sidebar
- **B** Phone live-glance — minimal, single-active-player card, advance-turn FAB
- **C** Horizontal timeline strip — 7-round dot timeline + phase status row
- **D** Radial phase clock — 4-quadrant SVG clock, needle rotates with phase

### 02 · Initiative & Turn Order
**Purpose:** Drafted strategy cards, current turn position, who's passed.
- **A** Numbered slate — vertical list, big initiative number, status pills
- **B** Up-now → Up-next queue — horizontal cards, hero "NOW" card 1.6× larger, drag to reorder
- **C** Strategy card grid — 4×2 grid of all 8 cards, owner dots, unclaimed = dashed border
- **D** Round table — radial SVG with players seated around an oval table

### 03 · Player Dashboard
**Purpose:** One faction's complete state — VP, currencies, command pool, tech, planets.
- **A** Broadsheet dossier — "DOSSIER No. 04" header, big VP number, 3-col currency cards
- **B** Phone tabbed scroll — Overview / Tech / Planets / Log tabs
- **C** Tactile sheet card — looks like a printed scoresheet inside a paper card
- **D** 6-axis radar profile — VP / RES / INF / TECH / FLEET / PLAN polygon

### 04 · Combat Logger
**Purpose:** Roll-by-roll combat, units lost, who won where.
- **A** Two-column ledger — Attacker | vs. | Defender, unit table + roll log
- **B** Live roll feed — terminal-style monospace log, time-stamped rolls
- **C** Battle splits — multi-engagement view, win-share bars per battle
- **D** Phone tap-to-roll — unit grid, big hit-counter, ROLL button

### 05 · Voting / Agenda Dashboard
**Purpose:** Galactic Senate — for/against tallies, voter breakdown, law history.
- **A** Senate broadsheet — italic agenda title, FOR/AGAINST columns with voter rows
- **B** Per-player tally bars — horizontal bars showing influence-spent per side
- **C** Phone slide-to-vote — slider control to allocate influence between sides
- **D** Senate almanac — historical log of all agendas, pass/fail, beneficiaries

### 06 · Economy / Planet Board
**Purpose:** Resources vs. Influence vs. Tech vs. Fleet across all players.
- **A** Multi-faction radar — overlay 3 polygons on a 6-axis chart
- **B** Hex planet board — 8×4 hex grid colored by owner, Mecatol Rex highlighted
- **C** Paired column stacks — solid bar (resources) + outlined bar (influence) per faction
- **D** Trade flow sankey — flows of trade-goods between factions this round

### 07 · VP Race ★ HERO
**Purpose:** The single most important visualization — the race to 10 (or 14) VP.
- **A** Slope chart — 6 lines on a round × VP grid, leader highlighted in vermillion, 10VP win-line, two-column editorial dropcap explaining the story
- **B** Standings bars — sorted leaderboard, 10-segment progress bars, "LEADER" pill
- **C** Stadium / lane race — racing-stripes lanes, big tokens, finish line
- **D** Stacked stream — stacked bars per round showing who scored what when

### 08 · Objective Matrix
**Purpose:** Public objectives × players grid.
- **A** Classic checkmark grid — Y-axis objectives, X-axis players, ✦ marks scored
- **B** Bounty cards — each objective as a stamp-style card with scorer chips
- **C** Per-player score timeline — horizontal lane per player, +N circles at scoring rounds
- **D** Density heatmap — players × score-source (Pub I, Pub II, Secret, Imperial, Support)

### 09 · Faction Picker / Draft
**Purpose:** Pre-game faction selection across all 25 civilizations.
- **A** Carousel pool — 5 cards visible, hovered card 1.4× wider, "HOVER" tag
- **B** Full roster grid — 5×5 grid, drafted faded out, ✓ checkmark, filter tabs
- **C** 3-up compare — table comparing 3 factions across 7 stats
- **D** Phone snake-draft — vertical card list, current pick highlighted, LOCK button

### 10 · End-Game Recap Infographic
**Purpose:** The shareable centerpiece — final-edition broadsheet.
- **A** Front-page final edition — "SOL TAKES THE THRONE", winner block, full standings strip
- **B** By-the-numbers — 9-tile stat block ("347 dice rolled", "23 ships destroyed")
- **C** Awards ceremony — 6 superlatives ("The Throne", "Master of Coin", "God of War"…)
- **D** Round-by-round narrative — vertical timeline with roman-numeral rounds, italic descriptions

## Data Source — ti-assistant.com Exports

The user is currently building the JSON ingestion. Plan the component props around the `ti-assistant.com` export schema — most components in this wireframe accept faction objects shaped like `{ id, name, short, cls }` and game state at the top level. Replace `FACTIONS` array in `wf-primitives.jsx` with a typed `Faction` interface populated from the import.

Likely top-level shape (verify against actual exports):
```ts
type GameLog = {
  factions: Faction[];
  rounds: Round[];        // strategy phase, action phase events, status, agenda
  combats: Combat[];
  votes: AgendaVote[];
  objectives: { public: Obj[]; secret: Record<FactionId, Obj[]> };
  vpHistory: { round: number; faction: FactionId; delta: number; source: string }[];
  meta: { startedAt, endedAt, winner, pointsToWin }
};
```

## Interactions

- **Pan/zoom canvas** (in the wireframe shell only — won't be in production): trackpad scroll/pinch, drag to pan, click artboard to focus.
- **Tab controls** (Player Dashboard B, Draft B): standard tabbed view.
- **Drag to reorder** (Turn Order B): drag-drop on initiative cards.
- **Slider** (Agenda C): drag handle splits influence between FOR/AGAINST.
- **Round scrubber** (Round Tracker C): horizontal swipe to scrub past rounds — animate VP race + objective matrix to past states.
- **Hover-to-grow** (Draft A): hovered faction card scales 1.4×.
- **Focus mode** (canvas-only): Esc/dot navigation.

## Animations & Transitions

Wireframes are static, but the production app should add:
- VP slope chart: animate path on round change (1.2s cubic-bezier).
- Round dot timeline: pulse on active round.
- Recap front page: stagger-in stats (newspaper-print feel).
- Combat feed: new-roll fade-in + auto-scroll.
- Phase clock needle: rotate on phase change.

## State Management

- **Source of truth:** parsed `ti-assistant` JSON in a single store (Zustand / Redux / signals — pick to match codebase).
- **Selected round:** scrubber state for replaying past states.
- **Selected player:** drives the Player Dashboard.
- **Filters:** faction filter, objective-type filter on heatmap and matrix.

The app is read-only over a finished game log — no live mutation needed unless a "live tracking" mode is added later.

## Design Tokens — Quick Reference

```
Colors:    --paper, --paper-2, --rule, --ink, --ink-{2,3,4}, --accent, --cool, --gold, --moss
Spacing:   4 / 6 / 8 / 10 / 12 / 14 / 16  (px, base 4)
Radius:    0 (sharp newspaper edges) — soft only on phone screens (24px) and pills (no radius, hard edges)
Rules:     1px solid · 2px solid · 3px double · 1px dashed (placeholders)
Drop cap:  3.2em, font-weight 800, color --accent, line-height 0.85, mt 4px, mr 6px, float left
Headlines: Newsreader 700–800, letter-spacing -0.015em, line-height 1.05, text-wrap balance
Labels:    Plex Mono 9px uppercase letter-spacing 0.10em, color --ink-3
Kicker:    Plex Mono 9px uppercase, accent color, 1px bottom rule
Mast:      3px double rule top + bottom, italic Newsreader title 22px
```

## Assets

No image assets required. Replace these placeholders with real ones when available:
- Faction crests / sigils (currently solid color blocks)
- Strategy card numerals (currently text)
- Unit icons (currently glyphs: `🜨`, `◆`, `▲`, `◌`, `⌖`, `⚔`)
- Award icons (currently glyphs: `♔`, `⌖`, `⚔`, `⚖`, `⚛`, `✦`)

If you want to ship without custom art, the [Icomoon TI4 fan icon set] or community SVG packs work well; otherwise commission per-faction crests.

## Files in This Bundle

```
TI4 Tracker Wireframes.html   — entry point, all 10 sections wired into the design canvas
wireframes.css                — design tokens, masthead, kicker, rules, dropcap, placeholder utilities
design-canvas.jsx             — pan/zoom canvas shell (NOT for production — wireframe scaffolding only)
wf-primitives.jsx             — Mast, Kicker, Headline, Deck, Label, Rule, FactionDot, FactionChip, SketchFrame, InlineBar, FACTIONS
wf-screens-1.jsx              — Round/Phase tracker · Initiative & Turn Order
wf-screens-2.jsx              — Player Dashboard · Combat Logger
wf-screens-3.jsx              — Agenda · Economy/Planet Board
wf-screens-4.jsx              — VP Race (hero) · Objective Matrix
wf-screens-5.jsx              — Faction Draft · End-Game Recap
```

`design-canvas.jsx` is exploration-only scaffolding (Figma-style frame). Production code should drop it entirely and route between screens normally.

## Suggested Implementation Order

1. **Tokens + type system first** — port `wireframes.css` to your styling layer (CSS Modules / Tailwind config / styled-system theme). Get Newsreader + Plex Sans + Plex Mono loaded.
2. **Primitives** — `Mast`, `Kicker`, `Headline`, `Deck`, `Label`, `Rule`, `FactionDot`, `FactionChip`, `SketchFrame`. These appear everywhere.
3. **Hero — VP Race slope chart (Screen 7A)** — biggest payoff, validates the data ingestion shape.
4. **End-game recap (Screen 10A)** — the shareable infographic; an early hi-fi version unlocks user feedback.
5. **Round tracker + initiative + player dashboard** — the always-visible chrome.
6. Combat / Agenda / Economy / Objectives / Draft — order by which JSON fields land first.

## Open Questions

- Confirm `ti-assistant` JSON shape — drop a sample export in the repo so component props can be typed against it.
- Pick the variation per row (currently 4 options each); some rows want two combined (e.g., 7A + 7C as a tabbed widget).
- Mobile vs. desktop priority — current wireframes mix phone/tablet/desktop frames; settle on a primary form factor.
- Decide on faction crest source (commissioned, fan icon set, or solid-color crests with letter monogram).
