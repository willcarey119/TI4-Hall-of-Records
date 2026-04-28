# Phase 1b: Upload UI + Firestore Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Firestore adapter and upload UI so a JSON game export can be dropped in, parsed, previewed, and saved to Firestore with a single button click.

**Architecture:** A thin Firebase init module (`firebaseInit.ts`) is the only file that touches the Firebase SDK directly; `firestore.ts` imports from it and exports four async functions (`signInAnon`, `saveGame`, `listGames`, `loadGame`). The upload UI is a three-component tree: `DropZone` (file pick/drop) → `UploadPage` (state machine) → `GamePreview` + `WarningList` (display). No router is added in Phase 1b — `App.tsx` renders `UploadPage` directly.

**Tech Stack:** React 19, TypeScript (strict + exactOptionalPropertyTypes + noUncheckedIndexedAccess), Firebase JS SDK v10+, Tailwind CSS, Vitest + RTL + userEvent

---

## File Structure

**Create:**
- `app/src/adapters/firebaseInit.ts` — Firebase app init; exports `db` and `auth`; only `firestore.ts` may import this
- `app/src/adapters/__tests__/firestore.test.ts` — adapter unit tests (vi.mock Firebase)
- `app/src/features/upload/DropZone.tsx` — drag/drop + click-to-select file picker
- `app/src/features/upload/WarningList.tsx` — parser warnings display
- `app/src/features/upload/GamePreview.tsx` — parsed game summary + save button
- `app/src/features/upload/UploadPage.tsx` — page state machine, assembles the above
- `app/src/features/upload/__tests__/DropZone.test.tsx`
- `app/src/features/upload/__tests__/GamePreview.test.tsx`
- `app/src/features/upload/__tests__/UploadPage.test.tsx`

**Overwrite (stub → real):**
- `app/src/adapters/firestore.ts` — full adapter (currently `export {}` stub)
- `app/src/features/upload/index.ts` — barrel export for `UploadPage`

**Modify:**
- `app/index.html` — add Google Fonts preconnect + stylesheet
- `app/src/index.css` — add newspaper design token CSS custom properties
- `app/tailwind.config.ts` — replace stale Deep Space tokens with newspaper tokens
- `app/src/App.tsx` — replace Vite default scaffold with `<UploadPage />`
- `app/firestore.rules` — add real anonymous UID to allowlist (Task 9, after first run)

---

### Task 1: Install Firebase SDK + Firebase initialization module

**Files:**
- Modify: `app/package.json` (via npm install)
- Create: `app/src/adapters/firebaseInit.ts`

- [ ] **Step 1: Install Firebase SDK**

```bash
cd "D:/_TI4 App/app"
npm install firebase
```

Expected: `firebase` added to `dependencies` in `package.json`.

- [ ] **Step 2: Create `src/adapters/firebaseInit.ts`**

```ts
// src/adapters/firebaseInit.ts
// Initializes the Firebase app and exports the Firestore + Auth instances.
// IMPORT RESTRICTION: only src/adapters/firestore.ts may import this file.
// All other code must access Firestore through the adapter, never directly.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const existingApp = getApps()[0];
const app =
  existingApp !== undefined
    ? existingApp
    : initializeApp({
        apiKey: import.meta.env['VITE_FIREBASE_API_KEY'],
        authDomain: import.meta.env['VITE_FIREBASE_AUTH_DOMAIN'],
        projectId: import.meta.env['VITE_FIREBASE_PROJECT_ID'],
        storageBucket: import.meta.env['VITE_FIREBASE_STORAGE_BUCKET'],
        messagingSenderId: import.meta.env['VITE_FIREBASE_MESSAGING_SENDER_ID'],
        appId: import.meta.env['VITE_FIREBASE_APP_ID'],
      });

export const db = getFirestore(app);
export const auth = getAuth(app);
```

- [ ] **Step 3: Verify typecheck passes**

```bash
cd "D:/_TI4 App/app"
npm run typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
cd "D:/_TI4 App"
git add app/package.json app/package-lock.json app/src/adapters/firebaseInit.ts
git commit -m "feat(firebase): install Firebase SDK and add initialization module"
```

---

### Task 2: Firestore adapter — tests (all four functions, all failing)

**Files:**
- Create: `app/src/adapters/__tests__/firestore.test.ts`

Write tests for all four adapter functions using `vi.mock` to stub Firebase. `vi.mock` calls are hoisted by Vitest before imports execute, so the imports at the top of the file will resolve to the mocked versions.

- [ ] **Step 1: Create the test file**

```ts
// src/adapters/__tests__/firestore.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DocumentSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { signInAnon, saveGame, listGames, loadGame } from '../firestore';
import { setDoc, getDoc, getDocs } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

// ── Mocks (hoisted by Vitest before imports) ─────────────────────────────────

vi.mock('../firebaseInit', () => ({
  db: { _stub: 'firestore' },
  auth: { _stub: 'auth' },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'col-ref'),
  doc: vi.fn(() => 'doc-ref'),
  setDoc: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(() => 'query-ref'),
  orderBy: vi.fn(() => 'orderby-ref'),
}));

vi.mock('firebase/auth', () => ({
  signInAnonymously: vi.fn(() =>
    Promise.resolve({ user: { uid: 'uid-test-123' } }),
  ),
}));

// ── Minimal ParsedGame fixture ───────────────────────────────────────────────

const mockGame = {
  gameId: 'abc123',
  playedAt: 1700000000000,
  durationSeconds: 14400,
  factions: [
    {
      factionId: 'Sol',
      playerName: 'Tim',
      color: 'Blue',
      mapPosition: 0,
      startingTechs: [],
      startingPlanets: [],
    },
  ],
  options: {},
  initialSpeaker: 'Sol',
  phaseSnapshots: [],
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
  finalScores: { Sol: 10 },
  winner: 'Sol',
  timers: {
    game: 14400,
    factions: { Sol: 7200 },
    secondaries: {},
    agendas: { first: 0, second: 0 },
  },
  warnings: [],
} as const;

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('signInAnon', () => {
  it('calls Firebase signInAnonymously and returns the UID', async () => {
    const uid = await signInAnon();
    expect(signInAnonymously).toHaveBeenCalledTimes(1);
    expect(uid).toBe('uid-test-123');
  });
});

describe('saveGame', () => {
  it('calls setDoc with correct path and game data, returns gameId', async () => {
    const result = await saveGame(mockGame);
    expect(setDoc).toHaveBeenCalledWith(
      'doc-ref',
      expect.objectContaining({ gameId: 'abc123' }),
    );
    expect(result).toBe('abc123');
  });
});

describe('listGames', () => {
  it('returns ParsedGameSummary objects and omits event arrays', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [{ data: () => ({ ...mockGame }) }],
    } as unknown as QuerySnapshot<DocumentData>);

    const result = await listGames();
    expect(result).toHaveLength(1);
    expect(result[0]?.gameId).toBe('abc123');
    expect(result[0]?.winner).toBe('Sol');
    expect(result[0]?.factions[0]?.factionId).toBe('Sol');
    // summaries must not include large event arrays
    expect(result[0]).not.toHaveProperty('vpEvents');
  });

  it('returns an empty array when the collection is empty', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [],
    } as unknown as QuerySnapshot<DocumentData>);

    const result = await listGames();
    expect(result).toEqual([]);
  });
});

describe('loadGame', () => {
  it('returns the ParsedGame when the document exists', async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ ...mockGame }),
    } as unknown as DocumentSnapshot<DocumentData>);

    const result = await loadGame('abc123');
    expect(result.gameId).toBe('abc123');
  });

  it('throws when the document does not exist', async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
      data: () => undefined,
    } as unknown as DocumentSnapshot<DocumentData>);

    await expect(loadGame('missing-id')).rejects.toThrow('Game not found: missing-id');
  });
});
```

- [ ] **Step 2: Run tests to confirm they all fail**

```bash
cd "D:/_TI4 App/app"
npx vitest run src/adapters/__tests__/firestore.test.ts
```

Expected: 6 tests failing (adapter still a stub).

---

### Task 3: Firestore adapter — implementation

**Files:**
- Overwrite: `app/src/adapters/firestore.ts`

- [ ] **Step 1: Replace the stub with the full implementation**

```ts
// src/adapters/firestore.ts
// ALL Firestore and Firebase Auth SDK calls live here.
// No other file in the codebase may import firebase/firestore or firebase/auth.

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from './firebaseInit';
import type { ParsedGame, FactionSetup } from '../lib/parser/types';

export interface ParsedGameSummary {
  gameId: string;
  playedAt: number;
  durationSeconds: number;
  factions: Pick<FactionSetup, 'factionId' | 'color' | 'playerName'>[];
  finalScores: Record<string, number>;
  winner: string | null;
}

/** Signs in anonymously. Logs the UID to the console on first call —
 *  copy it into firestore.rules to allow writes from this browser. */
export async function signInAnon(): Promise<string> {
  const cred = await signInAnonymously(auth);
  console.info('[TI4] anonymous UID:', cred.user.uid);
  return cred.user.uid;
}

/** Saves a ParsedGame to /games/{gameId}. Returns the gameId.
 *  JSON round-trip strips undefined optional fields that Firestore rejects. */
export async function saveGame(game: ParsedGame): Promise<string> {
  const data = JSON.parse(JSON.stringify(game)) as ParsedGame;
  const ref = doc(db, 'games', game.gameId);
  await setDoc(ref, data);
  return game.gameId;
}

/** Lists all saved games ordered by playedAt descending.
 *  Returns lightweight summaries — not full ParsedGame objects. */
export async function listGames(): Promise<ParsedGameSummary[]> {
  const q = query(collection(db, 'games'), orderBy('playedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const game = d.data() as ParsedGame;
    return {
      gameId: game.gameId,
      playedAt: game.playedAt,
      durationSeconds: game.durationSeconds,
      factions: game.factions.map((f) => ({
        factionId: f.factionId,
        color: f.color,
        playerName: f.playerName,
      })),
      finalScores: game.finalScores,
      winner: game.winner,
    };
  });
}

/** Loads a full ParsedGame by gameId. Throws if the document does not exist. */
export async function loadGame(gameId: string): Promise<ParsedGame> {
  const ref = doc(db, 'games', gameId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error(`Game not found: ${gameId}`);
  }
  return snap.data() as ParsedGame;
}
```

- [ ] **Step 2: Run tests to confirm all 6 pass**

```bash
cd "D:/_TI4 App/app"
npx vitest run src/adapters/__tests__/firestore.test.ts
```

Expected: 6 tests passing.

- [ ] **Step 3: Typecheck**

```bash
cd "D:/_TI4 App/app"
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd "D:/_TI4 App"
git add app/src/adapters/firestore.ts app/src/adapters/__tests__/firestore.test.ts
git commit -m "feat(adapter): implement Firestore adapter — signInAnon, saveGame, listGames, loadGame"
```

---

### Task 4: Design tokens + Google Fonts

**Files:**
- Modify: `app/index.html`
- Modify: `app/src/index.css`
- Modify: `app/tailwind.config.ts`

No unit tests — verify with `npm run build`.

- [ ] **Step 1: Update `index.html`**

Add inside `<head>`, replacing `<title>app</title>`:

```html
    <title>TI4 Hall of Records</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;0,6..72,800;1,6..72,400;1,6..72,600;1,6..72,700;1,6..72,800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&family=Caveat:wght@400;700&display=swap"
      rel="stylesheet"
    />
```

- [ ] **Step 2: Replace `src/index.css` contents**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Newspaper / Almanac design tokens ────────────────────────────────────── */
/* Source: design_handoff_ti4_tracker/wireframes.css                           */
:root {
  --paper:   oklch(0.97 0.012 80);   /* warm newsprint background */
  --paper-2: oklch(0.94 0.014 80);   /* slightly darker fill */
  --rule:    oklch(0.18 0.01 60);    /* rule lines */
  --ink:     oklch(0.18 0.01 60);    /* primary text */
  --ink-2:   oklch(0.34 0.01 60);    /* secondary text */
  --ink-3:   oklch(0.52 0.01 60);    /* tertiary / captions */
  --ink-4:   oklch(0.72 0.01 60);    /* dividers, disabled */
  --accent:  oklch(0.45 0.12 25);    /* faded vermillion — "stop press" */
  --cool:    oklch(0.45 0.08 240);   /* faded ink-blue — secondary accent */
  --gold:    oklch(0.62 0.10 75);    /* tech color: yellow */
  --moss:    oklch(0.45 0.06 145);   /* tech color: green */
}

body {
  background-color: var(--paper);
  color: var(--ink);
  font-family: 'IBM Plex Sans', system-ui, sans-serif;
}
```

- [ ] **Step 3: Replace `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper:      'var(--paper)',
        'paper-2':  'var(--paper-2)',
        rule:       'var(--rule)',
        ink:        'var(--ink)',
        'ink-2':    'var(--ink-2)',
        'ink-3':    'var(--ink-3)',
        'ink-4':    'var(--ink-4)',
        accent:     'var(--accent)',
        cool:       'var(--cool)',
        gold:       'var(--gold)',
        moss:       'var(--moss)',
      },
      fontFamily: {
        display:    ['Newsreader', 'Georgia', 'serif'],
        body:       ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono:       ['IBM Plex Mono', 'monospace'],
        annotation: ['Caveat', 'cursive'],
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 4: Verify build passes**

```bash
cd "D:/_TI4 App/app"
npm run build
```

Expected: build succeeds, no errors.

- [ ] **Step 5: Commit**

```bash
cd "D:/_TI4 App"
git add app/index.html app/src/index.css app/tailwind.config.ts
git commit -m "style: port newspaper/almanac design tokens and add Google Fonts"
```

---

### Task 5: DropZone component

**Files:**
- Create: `app/src/features/upload/DropZone.tsx`
- Create: `app/src/features/upload/__tests__/DropZone.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/features/upload/__tests__/DropZone.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropZone } from '../DropZone';

describe('DropZone', () => {
  it('renders a drop zone with instructional text', () => {
    render(<DropZone onFile={vi.fn()} />);
    expect(screen.getByText(/drop.*json/i)).toBeInTheDocument();
  });

  it('calls onFile when a file is selected via the input', async () => {
    const onFile = vi.fn();
    render(<DropZone onFile={onFile} />);
    const input = screen.getByTestId('file-input');
    const file = new File(['{}'], 'game.json', { type: 'application/json' });
    await userEvent.upload(input, file);
    expect(onFile).toHaveBeenCalledWith(file);
    expect(onFile).toHaveBeenCalledTimes(1);
  });

  it('calls onFile when a file is dropped onto the zone', () => {
    const onFile = vi.fn();
    render(<DropZone onFile={onFile} />);
    const zone = screen.getByRole('button');
    const file = new File(['{}'], 'game.json', { type: 'application/json' });
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('does not call onFile when disabled', async () => {
    const onFile = vi.fn();
    render(<DropZone onFile={onFile} disabled />);
    const input = screen.getByTestId('file-input');
    const file = new File(['{}'], 'game.json', { type: 'application/json' });
    await userEvent.upload(input, file);
    expect(onFile).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd "D:/_TI4 App/app"
npx vitest run src/features/upload/__tests__/DropZone.test.tsx
```

Expected: 4 tests failing (module not found).

- [ ] **Step 3: Create `DropZone.tsx`**

```tsx
// src/features/upload/DropZone.tsx
import { useRef, useState } from 'react';

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ onFile, disabled = false }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (file !== undefined) onFile(file);
    e.target.value = ''; // reset so the same file can be re-uploaded
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file !== undefined) onFile(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { if (!disabled) inputRef.current?.click(); }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        disabled={disabled}
        className={[
          'w-full border-2 border-dashed px-8 py-12 text-center transition-colors',
          'font-mono text-xs uppercase tracking-widest',
          dragging
            ? 'border-accent bg-paper-2 text-accent'
            : 'border-ink-4 text-ink-3 hover:border-ink-3 hover:bg-paper-2',
          disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
        ].join(' ')}
      >
        <span className="block">Drop JSON export here</span>
        <span className="mt-1 block text-[10px] text-ink-4">
          or click to browse · .json files only
        </span>
      </button>
      <input
        ref={inputRef}
        data-testid="file-input"
        type="file"
        accept=".json"
        disabled={disabled}
        onChange={handleChange}
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 h-0 w-0 overflow-hidden opacity-0"
      />
    </div>
  );
}
```

- [ ] **Step 4: Run tests to confirm all 4 pass**

```bash
cd "D:/_TI4 App/app"
npx vitest run src/features/upload/__tests__/DropZone.test.tsx
```

Expected: 4 tests passing.

- [ ] **Step 5: Commit**

```bash
cd "D:/_TI4 App"
git add app/src/features/upload/DropZone.tsx "app/src/features/upload/__tests__/DropZone.test.tsx"
git commit -m "feat(upload): add DropZone component with drag-drop and click-to-browse"
```

---

### Task 6: WarningList + GamePreview components

**Files:**
- Create: `app/src/features/upload/WarningList.tsx`
- Create: `app/src/features/upload/GamePreview.tsx`
- Create: `app/src/features/upload/__tests__/GamePreview.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/features/upload/__tests__/GamePreview.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ParsedGame } from '../../../lib/parser/types';
import { GamePreview } from '../GamePreview';

const mockGame: ParsedGame = {
  gameId: 'abc123',
  playedAt: 1700000000000,
  durationSeconds: 14400,
  factions: [
    { factionId: 'Sol', playerName: 'Tim', color: 'Blue', mapPosition: 0, startingTechs: [], startingPlanets: [] },
    { factionId: 'Hacan', playerName: 'Kim', color: 'Yellow', mapPosition: 1, startingTechs: [], startingPlanets: [] },
  ],
  options: {},
  initialSpeaker: 'Sol',
  phaseSnapshots: [],
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
  finalScores: { Sol: 10, Hacan: 8 },
  winner: 'Sol',
  timers: {
    game: 14400,
    factions: { Sol: 7200, Hacan: 7200 },
    secondaries: {},
    agendas: { first: 0, second: 0 },
  },
  warnings: [],
};

describe('GamePreview', () => {
  it('shows both faction names', () => {
    render(<GamePreview game={mockGame} onSave={vi.fn()} saving={false} />);
    expect(screen.getByText('Sol')).toBeInTheDocument();
    expect(screen.getByText('Hacan')).toBeInTheDocument();
  });

  it('shows final scores for each faction', () => {
    render(<GamePreview game={mockGame} onSave={vi.fn()} saving={false} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('calls onSave when Save to Records is clicked', async () => {
    const onSave = vi.fn();
    render(<GamePreview game={mockGame} onSave={onSave} saving={false} />);
    await userEvent.click(screen.getByRole('button', { name: /save to records/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('disables the save button and shows Saving… while saving', () => {
    render(<GamePreview game={mockGame} onSave={vi.fn()} saving={true} />);
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('shows warning count and each warning text when warnings are present', () => {
    const gameWithWarnings: ParsedGame = {
      ...mockGame,
      warnings: ['Unknown objective: "Foo" at 1000', 'RESOLVE_AGENDA "Mutiny" may affect VP'],
    };
    render(<GamePreview game={gameWithWarnings} onSave={vi.fn()} saving={false} />);
    expect(screen.getByText(/2 warning/i)).toBeInTheDocument();
    expect(screen.getByText(/Unknown objective: "Foo"/)).toBeInTheDocument();
  });

  it('does not show a warnings section when there are none', () => {
    render(<GamePreview game={mockGame} onSave={vi.fn()} saving={false} />);
    expect(screen.queryByText(/warning/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd "D:/_TI4 App/app"
npx vitest run "src/features/upload/__tests__/GamePreview.test.tsx"
```

Expected: 6 tests failing (module not found).

- [ ] **Step 3: Create `WarningList.tsx`**

```tsx
// src/features/upload/WarningList.tsx
interface WarningListProps {
  warnings: string[];
}

export function WarningList({ warnings }: WarningListProps) {
  if (warnings.length === 0) return null;
  return (
    <div className="border border-accent/40 bg-accent/5 p-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
        {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
      </p>
      <ul className="mt-2 space-y-1">
        {warnings.map((w) => (
          <li key={w} className="font-mono text-xs text-ink-3">
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Create `GamePreview.tsx`**

```tsx
// src/features/upload/GamePreview.tsx
import type { ParsedGame } from '../../lib/parser/types';
import { WarningList } from './WarningList';

interface GamePreviewProps {
  game: ParsedGame;
  onSave: () => void;
  saving: boolean;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function GamePreview({ game, onSave, saving }: GamePreviewProps) {
  return (
    <div className="space-y-4 border-2 border-ink p-6">
      {/* Header */}
      <div className="border-b-2 border-ink pb-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
          Game Preview
        </p>
        <p className="font-display text-xl font-bold text-ink">
          {formatDate(game.playedAt)}
        </p>
        <p className="font-mono text-xs text-ink-3">
          Duration: {formatDuration(game.durationSeconds)}
        </p>
      </div>

      {/* Score table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-4">
            <th className="pb-1 text-left font-mono text-[10px] uppercase tracking-widest text-ink-3">
              Faction
            </th>
            <th className="pb-1 text-right font-mono text-[10px] uppercase tracking-widest text-ink-3">
              VP
            </th>
          </tr>
        </thead>
        <tbody>
          {game.factions.map((f) => {
            const score = game.finalScores[f.factionId] ?? 0;
            const isWinner = f.factionId === game.winner;
            return (
              <tr key={f.factionId} className="border-b border-ink-4/40">
                <td className={['py-1', isWinner ? 'font-semibold text-accent' : 'text-ink'].join(' ')}>
                  {f.factionId}
                  {isWinner && (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-accent">
                      winner
                    </span>
                  )}
                </td>
                <td className="py-1 text-right font-mono text-ink">{score}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Warnings */}
      <WarningList warnings={game.warnings} />

      {/* Save button */}
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className={[
          'w-full border-2 py-3 font-mono text-xs uppercase tracking-widest transition-colors',
          saving
            ? 'cursor-not-allowed border-ink-4 text-ink-4'
            : 'border-ink bg-ink text-paper hover:border-accent hover:bg-accent',
        ].join(' ')}
      >
        {saving ? 'Saving…' : 'Save to Records'}
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to confirm all 6 pass**

```bash
cd "D:/_TI4 App/app"
npx vitest run "src/features/upload/__tests__/GamePreview.test.tsx"
```

Expected: 6 tests passing.

- [ ] **Step 6: Commit**

```bash
cd "D:/_TI4 App"
git add app/src/features/upload/WarningList.tsx app/src/features/upload/GamePreview.tsx "app/src/features/upload/__tests__/GamePreview.test.tsx"
git commit -m "feat(upload): add WarningList and GamePreview components"
```

---

### Task 7: UploadPage assembly

**Files:**
- Create: `app/src/features/upload/UploadPage.tsx`
- Create: `app/src/features/upload/__tests__/UploadPage.test.tsx`
- Overwrite: `app/src/features/upload/index.ts`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/features/upload/__tests__/UploadPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ParsedGame } from '../../../lib/parser/types';
import { parseGame } from '../../../lib/parser/parseGame';
import { saveGame, signInAnon } from '../../../adapters/firestore';
import { UploadPage } from '../UploadPage';

// ── Mocks (hoisted by Vitest) ─────────────────────────────────────────────────

vi.mock('../../../lib/parser/parseGame', () => ({
  parseGame: vi.fn(),
}));

vi.mock('../../../adapters/firestore', () => ({
  signInAnon: vi.fn(() => Promise.resolve('uid-test')),
  saveGame: vi.fn(() => Promise.resolve('abc123')),
}));

// ── Fixture ───────────────────────────────────────────────────────────────────

const mockGame: ParsedGame = {
  gameId: 'abc123',
  playedAt: 1700000000000,
  durationSeconds: 14400,
  factions: [
    { factionId: 'Sol', playerName: 'Tim', color: 'Blue', mapPosition: 0, startingTechs: [], startingPlanets: [] },
  ],
  options: {},
  initialSpeaker: 'Sol',
  phaseSnapshots: [],
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
  finalScores: { Sol: 10 },
  winner: 'Sol',
  timers: { game: 14400, factions: { Sol: 7200 }, secondaries: {}, agendas: { first: 0, second: 0 } },
  warnings: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(parseGame).mockReturnValue(mockGame);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('UploadPage', () => {
  it('renders the drop zone on initial load', () => {
    render(<UploadPage />);
    expect(screen.getByText(/drop.*json/i)).toBeInTheDocument();
  });

  it('shows the game preview after a valid JSON file is uploaded', async () => {
    render(<UploadPage />);
    const file = new File(['{}'], 'game.json', { type: 'application/json' });
    await userEvent.upload(screen.getByTestId('file-input'), file);
    expect(await screen.findByRole('button', { name: /save to records/i })).toBeInTheDocument();
  });

  it('shows an error message for a file that fails to parse', async () => {
    vi.mocked(parseGame).mockImplementationOnce(() => {
      throw new Error('Unexpected token at position 3');
    });
    render(<UploadPage />);
    const file = new File(['not valid {{{'], 'bad.json', { type: 'application/json' });
    await userEvent.upload(screen.getByTestId('file-input'), file);
    expect(await screen.findByText(/unexpected token at position 3/i)).toBeInTheDocument();
  });

  it('calls signInAnon then saveGame when the save button is clicked', async () => {
    render(<UploadPage />);
    await userEvent.upload(
      screen.getByTestId('file-input'),
      new File(['{}'], 'game.json', { type: 'application/json' }),
    );
    await userEvent.click(await screen.findByRole('button', { name: /save to records/i }));
    expect(signInAnon).toHaveBeenCalledTimes(1);
    expect(saveGame).toHaveBeenCalledWith(mockGame);
  });

  it('shows a success confirmation after saving', async () => {
    render(<UploadPage />);
    await userEvent.upload(
      screen.getByTestId('file-input'),
      new File(['{}'], 'game.json', { type: 'application/json' }),
    );
    await userEvent.click(await screen.findByRole('button', { name: /save to records/i }));
    expect(await screen.findByText(/saved to the archive/i)).toBeInTheDocument();
  });

  it('shows a save error message if saveGame rejects', async () => {
    vi.mocked(saveGame).mockRejectedValueOnce(new Error('Firestore write failed'));
    render(<UploadPage />);
    await userEvent.upload(
      screen.getByTestId('file-input'),
      new File(['{}'], 'game.json', { type: 'application/json' }),
    );
    await userEvent.click(await screen.findByRole('button', { name: /save to records/i }));
    expect(await screen.findByText(/firestore write failed/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd "D:/_TI4 App/app"
npx vitest run "src/features/upload/__tests__/UploadPage.test.tsx"
```

Expected: 6 tests failing (module not found).

- [ ] **Step 3: Create `UploadPage.tsx`**

```tsx
// src/features/upload/UploadPage.tsx
import { useState } from 'react';
import type { ParsedGame } from '../../lib/parser/types';
import { parseGame } from '../../lib/parser/parseGame';
import { signInAnon, saveGame } from '../../adapters/firestore';
import { DropZone } from './DropZone';
import { GamePreview } from './GamePreview';

type Status = 'idle' | 'parsing' | 'preview' | 'saving' | 'saved' | 'error';

export function UploadPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [game, setGame] = useState<ParsedGame | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File): Promise<void> {
    setStatus('parsing');
    setError(null);
    try {
      const text = await file.text();
      const raw: unknown = JSON.parse(text);
      const parsed = parseGame(raw);
      setGame(parsed);
      setStatus('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse file');
      setStatus('error');
    }
  }

  async function handleSave(): Promise<void> {
    if (game === null) return;
    setStatus('saving');
    setError(null);
    try {
      await signInAnon();
      await saveGame(game);
      setStatus('saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
      setStatus('error');
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      {/* Masthead */}
      <header className="mb-8 border-b-[3px] border-double border-ink pb-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
          Est. 2026
        </p>
        <h1 className="font-display text-4xl font-extrabold italic text-ink">
          Hall of Records
        </h1>
        <p className="font-mono text-xs text-ink-3">
          Twilight Imperium IV · Game Archive
        </p>
      </header>

      {/* Upload / error states */}
      {(status === 'idle' || status === 'parsing' || status === 'error') && (
        <section className="space-y-4">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
            File Dispatch
          </h2>
          <DropZone
            onFile={(f) => { void handleFile(f); }}
            disabled={status === 'parsing'}
          />
          {status === 'parsing' && (
            <p className="font-mono text-xs text-ink-3">Parsing…</p>
          )}
          {status === 'error' && error !== null && (
            <p className="border border-accent/40 bg-accent/5 p-3 font-mono text-xs text-accent">
              {error}
            </p>
          )}
        </section>
      )}

      {/* Preview / saving states */}
      {(status === 'preview' || status === 'saving') && game !== null && (
        <section className="space-y-4">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
            Press Check
          </h2>
          <GamePreview
            game={game}
            onSave={() => { void handleSave(); }}
            saving={status === 'saving'}
          />
        </section>
      )}

      {/* Success state */}
      {status === 'saved' && (
        <section className="space-y-4">
          <div className="border-2 border-ink p-6">
            <p className="font-display text-2xl font-bold text-ink">
              Saved to the Archive.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setStatus('idle'); setGame(null); }}
            className="font-mono text-xs uppercase tracking-widest text-ink-3 underline"
          >
            Upload another game
          </button>
        </section>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Update `src/features/upload/index.ts`**

```ts
export { UploadPage } from './UploadPage';
```

- [ ] **Step 5: Run the upload feature tests**

```bash
cd "D:/_TI4 App/app"
npx vitest run "src/features/upload/__tests__/UploadPage.test.tsx"
```

Expected: 6 tests passing.

- [ ] **Step 6: Run the full test suite**

```bash
cd "D:/_TI4 App/app"
npm test
```

Expected: all tests passing (157+ from lib, plus the new adapter + upload tests).

- [ ] **Step 7: Commit**

```bash
cd "D:/_TI4 App"
git add app/src/features/upload/UploadPage.tsx "app/src/features/upload/__tests__/UploadPage.test.tsx" app/src/features/upload/index.ts
git commit -m "feat(upload): add UploadPage — parse → preview → save flow"
```

---

### Task 8: Wire up App.tsx

**Files:**
- Overwrite: `app/src/App.tsx`

- [ ] **Step 1: Replace App.tsx**

```tsx
// src/App.tsx
import { UploadPage } from './features/upload';

export default function App() {
  return <UploadPage />;
}
```

- [ ] **Step 2: Run typecheck + build**

```bash
cd "D:/_TI4 App/app"
npm run typecheck && npm run build
```

Expected: no errors, clean build. (App.css is now unused — TypeScript may warn if it is still imported. Delete any remaining `import './App.css'` lines if present.)

- [ ] **Step 3: Smoke test in browser**

```bash
cd "D:/_TI4 App/app"
npm run dev
```

Open `http://localhost:5173`. Confirm:
- The masthead "Hall of Records" appears with newspaper styling
- The drop zone is visible
- Dropping a file from `app/game-data/` shows the preview (factions + scores)
- (Save will fail with a permissions error until Task 9)

- [ ] **Step 4: Commit**

```bash
cd "D:/_TI4 App"
git add app/src/App.tsx
git commit -m "feat: wire UploadPage as the main app entry point"
```

---

### Task 9: Capture UID and deploy Firestore rules

The Firestore security rules currently have `'REPLACE_WITH_YOUR_UID'` as a placeholder. Writes will fail until the real anonymous UID is in the allowlist.

**Files:**
- Modify: `app/firestore.rules`

- [ ] **Step 1: Open the app and sign in**

```bash
cd "D:/_TI4 App/app"
npm run dev
```

Open `http://localhost:5173`, drop in any game JSON from `app/game-data/`, and click **Save to Records**. The save will fail — that's expected.

- [ ] **Step 2: Get the anonymous UID from the browser console**

Open DevTools → Console. Look for the line printed by `signInAnon()`:

```
[TI4] anonymous UID: <your-uid-here>
```

Copy that string (it looks like `abc123XYZdef456...`).

- [ ] **Step 3: Update `firestore.rules` with the real UID**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{gameId} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.uid in [
          'PASTE_YOUR_UID_HERE'
        ];
    }
  }
}
```

- [ ] **Step 4: Deploy the rules**

```bash
cd "D:/_TI4 App/app"
npx firebase deploy --only firestore:rules
```

Expected output includes:
```
✔  firestore: released rules firestore.rules to cloud.firestore
```

- [ ] **Step 5: Test the full round-trip**

In the browser, drop in a game JSON and click **Save to Records**. Should show "Saved to the Archive."

Open the Firebase Console → Firestore Database → `games` collection and confirm the document appeared with the correct `gameId`.

- [ ] **Step 6: Commit**

```bash
cd "D:/_TI4 App"
git add app/firestore.rules
git commit -m "chore(firestore): add anonymous UID to write allowlist"
```

---

## Phase 1b Acceptance Checklist

Before calling Phase 1b done, verify each item:

- [ ] `npm run typecheck` — clean
- [ ] `npm run lint` — clean
- [ ] `npm test` — all tests passing
- [ ] `npm run build` — clean build
- [ ] Drop a real game JSON → preview shows correct factions and scores
- [ ] Click Save → Firestore document appears in the Firebase Console
- [ ] Reload page → drop same file → same gameId document is overwritten (not duplicated)
- [ ] Parser warnings (if any) are visible in the preview before saving
