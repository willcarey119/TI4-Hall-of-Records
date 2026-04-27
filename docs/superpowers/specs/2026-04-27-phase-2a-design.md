# Phase 2a Design — Navigation Shell & Shared Primitives

**Status:** Approved  
**Date:** 2026-04-27  
**Scope:** Phase 2a of the TI4 Hall of Records. Builds the routing skeleton, shared design primitives, home-page layout (upload + game list), and game-detail navigation shell. No VP chart yet (Phase 2b); no Timeline/Dashboard/Planets content yet (Phase 2c).

---

## 1. Goals

- Two working routes: `/` (home) and `/games/:gameId` (game detail)
- Home page combines the existing `UploadPage` upload zone with a new game archive list below it
- Game detail page has a frozen masthead + nav bar and four scrollable sections: VP Race, Timeline, Dashboard, Planets
- Five shared primitives extracted into `src/shared/` and used consistently across both pages
- All Phase 2b/2c sections exist as visible placeholders — the shell is navigable before the content is built

---

## 2. Architecture

### Routing

React Router v7. Two routes:

| Path | Component |
|------|-----------|
| `/` | `HomePage` |
| `/games/:gameId` | `GameDetailPage` |

`App.tsx` becomes a router root (`<BrowserRouter>` wrapping `<Routes>`). The current `<UploadPage />` render moves inside `HomePage`.

### Game state across sections

`GameDetailPage` fetches the game via `loadGame(gameId)` from the Firestore adapter on mount. The loaded `ParsedGame` is placed in a `GameContext` so any section component can call `useGame()` without prop-drilling.

```
GameDetailPage
  └─ GameContext.Provider (value = { game, loading, error })
       ├─ FrozenHeader (masthead + nav bar)
       └─ ScrollBody
            ├─ VpRaceSection    (reads game via useGame())
            ├─ TimelineSection
            ├─ DashboardSection
            └─ PlanetsSection
```

`GameContext` lives at `src/features/game-detail/GameContext.tsx` — co-located with its only consumer, not in a global `src/context/` folder. It is **not** a global app context.

### Scroll-to-section navigation

The scroll container is a single `<div>` with `overflow-y: scroll`. Each section has a stable `id` (`vp-race`, `timeline`, `dashboard`, `planets`). Clicking a nav button calls `element.scrollIntoView({ behavior: 'smooth' })`.

Active nav button tracking uses `IntersectionObserver` — one observer per section, threshold `0.4`. The button whose section is most in view gets the `active` style. On mount, the first section (`VP Race`) is active.

---

## 3. Page Designs

### 3.1 Home Page (`/`)

```
┌─────────────────────────────────────┐
│  Hall of Records                    │  ← Mast primitive
│  Twilight Imperium IV · Game Archive│
├─────────────────────────────────────┤
│  FILE DISPATCH                      │  ← Label
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│      Drop JSON export here          │  ← DropZone (existing)
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│  ══════════════════════════════════ │  ← Rule (thick)
│  ARCHIVE — N GAMES                  │  ← Label
│  ┌────────────────────────────────┐ │
│  │ Nov 15, 2023 · 4h 00m          │ │  ← Kicker
│  │ Sol Seizes the Throne at 10 VP │ │  ← bold italic Newsreader headline
│  │ [Sol ✦10] [Hacan 8] [Xxcha 7]  │ │  ← FactionChips
│  └────────────────────────────────┘ │
│  ... more cards                     │
└─────────────────────────────────────┘
```

- `HomePage` calls `listGames()` on mount; shows a loading state while fetching, error state if it rejects.
- Each game card is clickable → navigates to `/games/:gameId` via React Router `useNavigate`.
- The upload zone still works as in Phase 1b. After a successful save, the game list refreshes (re-calls `listGames()`).
- No delete / sort / filter in Phase 2 (YAGNI).

### 3.2 Game Detail Page (`/games/:gameId`)

```
┌─────────────────────────────────────┐  ← frozen, z-index above scroll
│  ← Archive                          │  ← back link (useNavigate(-1))
│  ══════════════════════════════════ │
│  Game Dispatch · Nov 15, 2023       │  ← Kicker
│  Sol Seizes the Throne at 10 VP     │  ← bold italic Newsreader
│  [Sol ✦10] [Hacan 8] [Xxcha 7]     │  ← FactionChips
│  ══════════════════════════════════ │
│  [VP RACE] [TIMELINE] [DASHBOARD]   │  ← nav bar (active underline)
│  [PLANETS]                          │
├─────────────────────────────────────┤  ← scroll container starts here
│  VP RACE ─────────────────────────  │
│  [placeholder: slope chart — 2b]    │
│                                     │
│  TIMELINE ─────────────────────────  │
│  [placeholder: action feed — 2c]    │
│                                     │
│  DASHBOARD ────────────────────────  │
│  [placeholder: faction dossier — 2c]│
│                                     │
│  PLANETS ──────────────────────────  │
│  [placeholder: planet ledger — 2c]  │
└─────────────────────────────────────┘
```

- Loading state: spinner/skeleton in place of the frozen header and sections while `loadGame()` resolves.
- Error state: friendly message + "← Back to Archive" link if `loadGame()` rejects (game not found or network error).
- The frozen header does **not** re-render on scroll — it is a sibling to the scroll container, not inside it.

---

## 4. Shared Primitives (`src/shared/`)

Five components. All are purely presentational (no state, no side effects).

| Component | Props | Notes |
|-----------|-------|-------|
| `Mast` | `title: string`, `subtitle: string` | 3px double-rule top and bottom; Newsreader bold italic title; IBM Plex Mono subtitle |
| `Kicker` | `text: string`, `children?: ReactNode` | Accent-colored mono label with underline; optional headline `children` rendered below |
| `Rule` | `weight?: 'thin' \| 'thick' \| 'double'` | Default `'thin'`. Horizontal divider using `--rule` token |
| `FactionChip` | `factionId: string`, `color: string`, `score?: number`, `winner?: boolean` | Colored dot + name + score; `winner` variant uses `--accent` border and text |
| `Label` | `children: ReactNode` | 9px IBM Plex Mono, uppercase, `--ink-3` color |

All five use CSS custom properties from `src/index.css` (the design tokens established in Phase 1b). No Tailwind utility classes for color — only `var(--paper)`, `var(--ink)`, `var(--accent)`, etc.

---

## 5. File Structure

**New files to create:**

```
app/src/
  features/
    home/
      index.ts               # barrel
      HomePage.tsx           # route component: Mast + DropZone + game list
      GameCard.tsx           # single archive card (Kicker + headline + FactionChips)
    game-detail/
      index.ts               # barrel
      GameContext.tsx         # GameContext + useGame() hook (scoped to this feature)
      GameDetailPage.tsx     # route component: fetches game, provides GameContext
      FrozenHeader.tsx       # frozen masthead + nav bar (reads GameContext)
      ScrollBody.tsx         # scroll container + section layout
      VpRaceSection.tsx      # placeholder for Phase 2b chart
      TimelineSection.tsx    # placeholder for Phase 2c
      DashboardSection.tsx   # placeholder for Phase 2c
      PlanetsSection.tsx     # placeholder for Phase 2c
  shared/
    index.ts                 # barrel
    Mast.tsx
    Kicker.tsx
    Rule.tsx
    FactionChip.tsx
    Label.tsx
```

**Files to modify:**

```
app/src/
  App.tsx                    # replace <UploadPage/> with BrowserRouter + Routes
  main.tsx                   # no change expected
```

**Tests:** Each shared primitive gets a `.test.tsx` alongside it. `HomePage` and `GameDetailPage` get feature-level tests using React Testing Library + mock adapter calls.

---

## 6. Data Flow

```
App.tsx (BrowserRouter)
  /  → HomePage
       listGames() → ParsedGameSummary[]
       GameCard[] → navigate('/games/:id')

  /games/:gameId → GameDetailPage
       loadGame(gameId) → ParsedGame
       GameContext.Provider
         FrozenHeader (useGame → title, factions, winner)
         ScrollBody
           VpRaceSection (useGame → phaseSnapshots for chart — Phase 2b)
           TimelineSection (placeholder)
           DashboardSection (placeholder)
           PlanetsSection (placeholder)
```

`GameDetailPage` is the only component that calls `loadGame()`. Sections read the already-loaded game from context — they never call the adapter directly.

---

## 7. Design Token Usage

All styling uses the CSS custom properties from `src/index.css`. Typography:

- Headlines: `font-family: 'Newsreader', serif; font-weight: 800; font-style: italic`
- Body: `font-family: 'IBM Plex Sans', sans-serif`
- Labels / mono: `font-family: 'IBM Plex Mono', monospace`

Fonts are loaded via Google Fonts import already in `index.css`. No Tailwind color utilities — only design token vars.

---

## 8. Out of Scope for Phase 2a

- VP Race slope chart (Phase 2b)
- Timeline / Dashboard / Planets content (Phase 2c)
- Delete or re-upload a game
- Sort or filter the game list
- Player name display (Phase 3.5)
- Responsive / mobile breakpoints (private playgroup app — desktop-first is fine)
- Animations beyond `scroll-behavior: smooth`

---

## 9. Key Decisions

| Decision | Rationale |
|----------|-----------|
| Single scrolling page (not tabs) | Preserves scroll position when navigating back; sections remain visible even when "inactive"; more browsable feel |
| IntersectionObserver for active nav | Pure scroll-event approaches require measuring offsets — brittle on resize. IntersectionObserver is declarative and handles edge cases (fast scroll, resize) automatically |
| GameContext scoped to game-detail feature | Only the game detail page needs it. A global app context for a single route's data would be over-engineering |
| `loadGame()` in GameDetailPage, not sections | Sections are display components — they should never know where data comes from. Single fetch point also prevents duplicate Firestore reads |
| Primitives use CSS vars, not Tailwind utilities | Design tokens are already in `index.css`. Keeping color/font purely in CSS vars makes it easy to theme later without touching component files |
| No delete/sort/filter | YAGNI — we have 6 games and a private playgroup. Add when actually needed |
