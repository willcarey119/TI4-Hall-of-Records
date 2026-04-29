# Phase 4b: Route-Level Code Splitting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the 719 kB monolithic JS bundle by lazy-loading each route as a separate chunk, so Firebase Hosting only serves the code each page actually needs.

**Architecture:** `React.lazy` + `<Suspense>` at the route level in `App.tsx`. Each page component (`HomePage`, `GameDetailPage`, `MetaDashboardPage`) is converted to a dynamic import, which causes Vite to emit three separate JS chunks instead of one. `MetaContext`'s static import of `firestore.ts` (which previously anchored the entire Firebase SDK in the main bundle) moves into the Meta chunk. The `<Suspense>` fallback sits inside the `<ErrorBoundary>` so that chunk-load failures (network error fetching a JS chunk) are caught and shown as a recoverable error rather than a crash.

**Tech Stack:** React 19 `lazy`/`Suspense` (built-in, no new dependencies), Vite 8 (automatic chunk splitting on dynamic imports)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `app/src/App.tsx` | **Modify** | Convert page imports to `React.lazy`, add `<Suspense>` wrapper |

No other files need to change. The page components themselves stay exactly as-is. No new tests are needed — the page components are already tested by importing them directly, and the lazy-loading is a bundler-level split that doesn't change component behavior.

---

## Task 1: Lazy-load all routes

**Files:**
- Modify: `app/src/App.tsx`

> **Context:** The current `App.tsx` statically imports all three page components. Static imports mean every page's code (including `MetaContext` → `firestore.ts` → the full Firebase SDK) is bundled into a single `index-XXX.js` file, currently 719 kB. Converting to `React.lazy` tells Vite to split each page into its own chunk. The first-time cost of loading any page stays the same, but navigating between pages only downloads the new page's chunk — and critically, the home page no longer carries the Firebase SDK weight at all.
>
> **Why `.then(m => ({ default: m.X }))` is needed:** `React.lazy` requires a module with a `default` export, but all three feature index files use named exports (`export { HomePage }`). The `.then()` call wraps the named export in a synthetic default without modifying any source file.
>
> **Suspense placement:** `<Suspense>` must sit _inside_ `<ErrorBoundary>` (which is already inside `<BrowserRouter>`). If a JS chunk fails to load (network offline, CDN error), React re-throws the import rejection from inside `<Suspense>`, and the `<ErrorBoundary>` catches it and shows the fallback UI.

- [ ] **Step 1: Verify the current bundle baseline**

```
cd "D:\_TI4 App\app"
npm run build 2>&1 | grep "index-"
```

Expected output (approximate):
```
dist/assets/index-XXXXXXXX.js   719.16 kB │ gzip: 211.27 kB
```

Note the exact sizes — you'll compare against these after the change.

- [ ] **Step 2: Replace App.tsx with the lazy-loaded version**

Replace the full contents of `app/src/App.tsx` with:

```tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './shared';

const HomePage = lazy(() =>
  import('./features/home').then(m => ({ default: m.HomePage }))
);
const GameDetailPage = lazy(() =>
  import('./features/game-detail').then(m => ({ default: m.GameDetailPage }))
);
const MetaDashboardPage = lazy(() =>
  import('./features/meta-dashboard').then(m => ({ default: m.MetaDashboardPage }))
);

function RouteLoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--paper)',
      }}
    >
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '9px',
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

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/games/:gameId" element={<GameDetailPage />} />
            <Route path="/meta" element={<MetaDashboardPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Run typecheck**

```
cd "D:\_TI4 App\app"
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Run the full test suite**

```
cd "D:\_TI4 App\app"
npm test
```

Expected: all 423 tests pass. The tests import page components directly (not through `App.tsx`), so lazy loading doesn't affect them.

- [ ] **Step 5: Build and verify chunk splitting**

```
cd "D:\_TI4 App\app"
npm run build 2>&1 | grep "dist/assets"
```

Expected: multiple JS chunks instead of one monolithic file. You should see something like:

```
dist/assets/index-XXXXXXXX.js      ~20–40 kB   (main: App + React + Router only)
dist/assets/HomePage-XXXXXXXX.js   ~XXX kB
dist/assets/GameDetailPage-XXXXXXXX.js  ~XXX kB
dist/assets/MetaDashboardPage-XXXXXXXX.js  ~XXX kB
```

The main `index-` chunk should be dramatically smaller than 719 kB. The INEFFECTIVE_DYNAMIC_IMPORT warning from the previous build should be gone (or reduced).

- [ ] **Step 6: Preview the production build locally and verify navigation**

```
cd "D:\_TI4 App\app"
npm run preview
```

Open `http://localhost:4173` in a browser and check:
- Home page loads — shows game archive
- Clicking "League Stats →" navigates to `/meta` (Meta Dashboard loads)
- Clicking a game card navigates to `/games/:id` (Game Detail loads)
- Refreshing on `/meta` works (Firebase Hosting SPA rewrite is still configured)

Stop the server with `Ctrl+C`.

- [ ] **Step 7: Commit**

```bash
git add app/src/App.tsx
git commit -m "perf: lazy-load routes to split Firebase SDK out of main bundle"
```

- [ ] **Step 8: Deploy and verify live**

```
cd "D:\_TI4 App\app"
npm run deploy
```

Wait for deploy to complete, then open `https://ti4-hall-of-records-da562.web.app` and verify the app loads.

- [ ] **Step 9: Run Lighthouse on the home page**

In Chrome DevTools (F12 → Lighthouse tab) or via the CLI:

```
npx lighthouse https://ti4-hall-of-records-da562.web.app --only-categories=performance --output=json --output-path=./lighthouse-report.json
node -e "const r = require('./lighthouse-report.json'); console.log('Performance:', Math.round(r.categories.performance.score * 100))"
```

Note the score. Target is ≥ 90. If below 90, record the specific failing audits — those become the next optimization targets.

---

## Self-Review

### Spec Coverage

| Requirement (from ROADMAP Phase 4) | Task |
|---|---|
| Performance: code-split by route | Task 1 (all routes lazy-loaded) |
| Lazy-load chart libraries | N/A — no external chart libraries exist; all charts are inline SVG |
| Lighthouse ≥ 90 | Task 1, Step 9 (measured post-deploy) |

### Placeholder Scan

No TBD, TODO, or incomplete steps. All code is complete.

### Type Consistency

- `lazy()` imported from `'react'` — correct (React 19 exports it from the main package)
- `Suspense` imported from `'react'` — correct
- `RouteLoadingFallback` returns JSX — no props, no type annotation needed
- `ErrorBoundary` imported from `'./shared'` — matches Task 1's export in Phase 4a
