# Phase 4a: Robustness + Firebase Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an error boundary, surface MetaDashboard loading/error states, and configure Firebase Hosting so the app can be deployed with one command.

**Architecture:** A single reusable `ErrorBoundary` class component (shared primitive) wraps the router in `App.tsx` to catch any uncaught React render exceptions. `MetaScrollBody` is updated to read `loading` and `error` from `MetaContext` and render appropriate UI instead of silently showing empty sections. Firebase Hosting config is added to `firebase.json` and a `deploy` npm script runs `build && firebase deploy`.

**Tech Stack:** React 19 (class component for error boundary), Vitest + React Testing Library, Firebase Hosting, firebase-tools (already installed as devDependency)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `app/src/shared/ErrorBoundary.tsx` | **Create** | Reusable React error boundary class component |
| `app/src/shared/ErrorBoundary.test.tsx` | **Create** | RTL tests for ErrorBoundary fallback behavior |
| `app/src/shared/index.ts` | **Modify** | Export `ErrorBoundary` |
| `app/src/App.tsx` | **Modify** | Wrap `<Routes>` in `<ErrorBoundary>` |
| `app/src/features/meta-dashboard/MetaDashboardPage.tsx` | **Modify** | Read `loading`/`error` from MetaContext in `MetaScrollBody`; render appropriate state |
| `app/src/features/meta-dashboard/MetaDashboardPage.test.tsx` | **Create** | RTL tests for loading and error states |
| `app/firebase.json` | **Modify** | Add `hosting` block for SPA deploy |
| `app/package.json` | **Modify** | Add `deploy` script |

---

## Task 1: ErrorBoundary shared component

**Files:**
- Create: `app/src/shared/ErrorBoundary.tsx`
- Create: `app/src/shared/ErrorBoundary.test.tsx`
- Modify: `app/src/shared/index.ts`

> **Context:** React error boundaries must be class components — the `getDerivedStateFromError` lifecycle is unavailable to function components. The component accepts an optional `fallback` prop so callers can customize the error UI. The default fallback matches the app's existing error message style (seen in `GameDetailPage.tsx`).

- [ ] **Step 1: Write the failing tests**

Create `app/src/shared/ErrorBoundary.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function Bomb({ shouldThrow }: { shouldThrow: boolean }): React.ReactNode {
  if (shouldThrow) throw new Error('Explosion');
  return <div>Safe content</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress React's console.error output for expected errors in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('renders default fallback when child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('renders custom fallback prop when child throws', () => {
    render(
      <ErrorBoundary fallback={<p>Custom error UI</p>}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```
cd app
npm test -- ErrorBoundary
```

Expected: `FAIL` — `ErrorBoundary` is not defined.

- [ ] **Step 3: Implement ErrorBoundary**

Create `app/src/shared/ErrorBoundary.tsx`:

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      return (
        <main style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 16px' }}>
          <p
            className="font-mono text-xs text-accent"
            style={{ marginBottom: '8px' }}
          >
            Something went wrong.
          </p>
          <p
            className="font-mono text-ink-3"
            style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            Try refreshing the page.
          </p>
        </main>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 4: Export from shared index**

Edit `app/src/shared/index.ts` — add one line at the top:

```ts
export { ErrorBoundary } from './ErrorBoundary';
export { Label } from './Label';
export { Rule } from './Rule';
export { Mast } from './Mast';
export { Kicker } from './Kicker';
export { FactionChip } from './FactionChip';
export {
  formatDate,
  formatDuration,
  formatGameTitle,
  formatKicker,
} from './formatters';
```

- [ ] **Step 5: Run the tests to confirm they pass**

```
cd app
npm test -- ErrorBoundary
```

Expected: `PASS` — 3 tests green.

- [ ] **Step 6: Run full test suite to confirm no regressions**

```
cd app
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add app/src/shared/ErrorBoundary.tsx app/src/shared/ErrorBoundary.test.tsx app/src/shared/index.ts
git commit -m "feat: add ErrorBoundary shared component"
```

---

## Task 2: Wire ErrorBoundary into App

**Files:**
- Modify: `app/src/App.tsx`

> **Context:** Wrapping the entire `<Routes>` block in a single `ErrorBoundary` means any uncaught render exception in any route shows the fallback instead of a blank white screen. A single boundary at this level is sufficient — we don't need per-route isolation for this private app (YAGNI). No new tests needed; the ErrorBoundary is already tested in Task 1.

- [ ] **Step 1: Update App.tsx**

Replace the full contents of `app/src/App.tsx` with:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './shared';
import { HomePage } from './features/home';
import { GameDetailPage } from './features/game-detail';
import { MetaDashboardPage } from './features/meta-dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/games/:gameId" element={<GameDetailPage />} />
          <Route path="/meta" element={<MetaDashboardPage />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Run typecheck**

```
cd app
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Run full test suite**

```
cd app
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/src/App.tsx
git commit -m "feat: wrap routes in ErrorBoundary"
```

---

## Task 3: MetaDashboard loading and error states

**Files:**
- Modify: `app/src/features/meta-dashboard/MetaDashboardPage.tsx`
- Create: `app/src/features/meta-dashboard/MetaDashboardPage.test.tsx`

> **Context:** `MetaContext` already sets `loading: true` initially and catches errors into `error: string | null`. However, `MetaDashboardPage` never reads these fields — so during load, all 5 sections silently render as empty `<section>` tags, and a Firestore error is completely invisible to the user. The fix: `MetaScrollBody` calls `useMeta()` and conditionally renders a loading or error state instead of the section list. The IntersectionObserver setup must not run during loading/error (it would find no elements anyway), so we guard it with an early return inside the effect.

- [ ] **Step 1: Write the failing tests**

Create `app/src/features/meta-dashboard/MetaDashboardPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MetaDashboardPage } from './MetaDashboardPage';

// Mock the Firestore adapter so tests don't make real network calls.
// MetaContext (imported transitively) calls loadAllGames() on mount.
vi.mock('../../adapters/firestore', () => ({
  loadAllGames: vi.fn(),
}));

import { loadAllGames } from '../../adapters/firestore';
const mockLoad = vi.mocked(loadAllGames);

describe('MetaDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading indicator while data is fetching', () => {
    // Never resolves — page stays in loading state
    mockLoad.mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <MetaDashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error message when Firestore load fails', async () => {
    mockLoad.mockRejectedValue(new Error('Network failure'));

    render(
      <MemoryRouter>
        <MetaDashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Network failure')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```
cd app
npm test -- MetaDashboardPage
```

Expected: `FAIL` — loading indicator and error message not found in DOM.

- [ ] **Step 3: Update MetaScrollBody in MetaDashboardPage.tsx**

The current `MetaScrollBody` does not call `useMeta()`. Edit it to add loading and error states. Also add `import { useMeta } from './MetaContext';` if not already imported (it is not in the current file — `MetaDashboardPage` only imports `MetaProvider`).

Replace the `MetaScrollBody` function and the relevant import in `app/src/features/meta-dashboard/MetaDashboardPage.tsx`:

**At the top of the file**, add `useMeta` to the import from `./MetaContext`:

```tsx
import { MetaProvider, useMeta } from './MetaContext';
```

**Replace the entire `MetaScrollBody` function** with this:

```tsx
function MetaScrollBody({ onSectionChange }: { onSectionChange: (id: string) => void }) {
  const { loading, error } = useMeta();
  const callbackRef = useRef(onSectionChange);

  useEffect(() => {
    callbackRef.current = onSectionChange;
  });

  useEffect(() => {
    // Skip observer setup until sections are actually rendered
    if (loading || error !== null) return;

    const observers: IntersectionObserver[] = [];

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el === null) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const sectionId =
                (entry.target as HTMLElement).dataset['section'] ?? id;
              callbackRef.current(sectionId);
            }
          });
        },
        { threshold: 0.4 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((o) => { o.disconnect(); });
    };
  }, [loading, error]);

  if (loading) {
    return (
      <div style={{ overflowY: 'scroll', flex: 1, padding: '32px 16px' }}>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--ink-3)',
          }}
        >
          Loading…
        </p>
      </div>
    );
  }

  if (error !== null) {
    return (
      <div style={{ overflowY: 'scroll', flex: 1, padding: '32px 16px' }}>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color: 'var(--accent)',
            marginBottom: 8,
          }}
        >
          {error}
        </p>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color: 'var(--ink-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'scroll', flex: 1 }}>
      <FactionSection />
      <StrategyCardSection />
      <TechSection />
      <StatsSection />
      <PlayerSection />
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

```
cd app
npm test -- MetaDashboardPage
```

Expected: `PASS` — 2 tests green.

- [ ] **Step 5: Run full test suite**

```
cd app
npm test
```

Expected: all tests pass. (The existing `sections.test.tsx` renders each section with a real `MetaProvider` — those sections already handle `null` data gracefully, so they will still pass.)

- [ ] **Step 6: Run typecheck**

```
cd app
npm run typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/src/features/meta-dashboard/MetaDashboardPage.tsx \
        app/src/features/meta-dashboard/MetaDashboardPage.test.tsx
git commit -m "feat: show loading and error states in MetaDashboard"
```

---

## Task 4: Firebase Hosting config and deploy script

**Files:**
- Modify: `app/firebase.json`
- Modify: `app/package.json`

> **Context:** Firebase Hosting is a separate product — it must be explicitly opted into in `firebase.json` by adding a `hosting` block. The `public` field must point to `dist` (Vite's build output directory), not the `public/` source directory. The SPA rewrite rule sends all unknown paths to `/index.html` so React Router can handle client-side navigation. The Firebase project is already set to `ti4-hall-of-records-da562` in `.firebaserc`. The `.env` file already contains the `VITE_FIREBASE_*` values used by the Vite build — they get baked into the JS bundle at build time, so no special CI environment variable setup is needed for a local deploy.

- [ ] **Step 1: Add hosting block to firebase.json**

Replace the full contents of `app/firebase.json` with:

```json
{
  "firestore": {
    "database": "(default)",
    "location": "nam5",
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "auth": {
    "providers": {
      "anonymous": true
    }
  },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

- [ ] **Step 2: Add deploy script to package.json**

In `app/package.json`, add `"deploy"` to the `"scripts"` object (after `"preview"`):

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint src",
  "lint:fix": "eslint src --fix",
  "format": "prettier --write src",
  "typecheck": "tsc --noEmit",
  "preview": "vite preview",
  "deploy": "npm run build && firebase deploy --only hosting",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "discover": "tsx scripts/discover-data.ts"
},
```

- [ ] **Step 3: Verify firebase-tools is logged in**

```
cd app
npx firebase login --reauth
```

If already logged in, this confirms your credentials. If not, it opens a browser auth flow. Complete it before proceeding.

- [ ] **Step 4: Test the build locally before deploying**

```
cd app
npm run build
```

Expected: `dist/` directory created with `index.html`, `assets/` folder, and JS/CSS bundles. No TypeScript or Vite errors.

- [ ] **Step 5: Preview the production build locally**

```
cd app
npm run preview
```

Open `http://localhost:4173` in a browser. Verify:
- Home page loads and shows the game archive
- Navigating to `/meta` loads the League Stats dashboard
- Navigating to a game detail URL works (e.g., `/games/<some-id>`)
- Refreshing on `/meta` does NOT 404 (this would mean the SPA rewrite isn't working — but it's only testable after deploy)

Stop the preview server with `Ctrl+C`.

- [ ] **Step 6: Deploy to Firebase Hosting**

```
cd app
npm run deploy
```

Expected output includes:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/ti4-hall-of-records-da562/overview
Hosting URL: https://ti4-hall-of-records-da562.web.app
```

- [ ] **Step 7: Smoke-test the live URL**

Open `https://ti4-hall-of-records-da562.web.app` in a browser. Verify:
- App loads (not a blank page or 404)
- Home page shows game archive
- `/meta` route loads
- Refreshing on `/meta` returns the app (not a 404 — confirms SPA rewrite is working)

- [ ] **Step 8: Commit**

```bash
git add app/firebase.json app/package.json
git commit -m "feat: configure Firebase Hosting, add deploy script"
```

---

## Self-Review

### Spec Coverage

| Requirement | Task |
|---|---|
| Error boundary for uncaught render exceptions | Task 1 + 2 |
| MetaDashboard shows loading state | Task 3 |
| MetaDashboard shows error state | Task 3 |
| Firebase Hosting deploy config | Task 4 |
| One-command deploy script | Task 4 |

### Placeholder Scan

No TBD, TODO, or incomplete steps. All code is complete and exact.

### Type Consistency

- `ErrorBoundary` props: `children: ReactNode`, `fallback?: ReactNode` — consistent across Task 1, 2.
- `useMeta()` returns `MetaState` with `loading: boolean`, `error: string | null` — consistent with existing `MetaContext.tsx` interface.
- `loadAllGames` mock typed via `vi.mocked()` — consistent with adapter signature `() => Promise<ParsedGame[]>`.
