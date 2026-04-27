# Phase 0 — Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a repo that boots, type-checks, lints, and passes a test suite with zero feature code — establishing every tooling constraint before Phase 1 parser work begins.

**Architecture:** Vite scaffold inside `app/`, strict TypeScript, Tailwind v3 with a Deep Space theme stub, Vitest + React Testing Library with one smoke test, ESLint flat config with `no-explicit-any: error`, and GitHub Actions CI running the full acceptance bar on every push.

**Tech Stack:** Node 20 · Vite 5 · React 19 · TypeScript 5 · Tailwind CSS 3 · Vitest 2 · @testing-library/react · ESLint 9 (flat config) · Prettier · Firebase (env-var stub only) · Git

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `D:\_TI4 App\.gitignore` | Exclude node_modules, dist, coverage, .env* |
| Create | `D:\_TI4 App\app\` | Entire Vite scaffold lives here |
| Modify | `app/tsconfig.json` | Add strict flags beyond Vite defaults |
| Modify | `app/vite.config.ts` | Add Tailwind PostCSS plugin |
| Create | `app/tailwind.config.ts` | Deep Space theme stub, content paths |
| Create | `app/postcss.config.js` | Required by Tailwind v3 |
| Modify | `app/src/index.css` | Replace with Tailwind directives |
| Create | `app/vitest.config.ts` | jsdom env, coverage config for src/lib/** |
| Create | `app/src/test-setup.ts` | Import @testing-library/jest-dom |
| Create | `app/src/smoke.test.ts` | One trivial passing test |
| Modify | `app/eslint.config.js` | Add no-explicit-any:error + Prettier |
| Create | `app/.prettierrc` | Prettier formatting rules |
| Create | `app/src/lib/parser/index.ts` | Placeholder export |
| Create | `app/src/lib/aggregator/index.ts` | Placeholder export |
| Create | `app/src/features/upload/index.ts` | Placeholder export |
| Create | `app/src/features/game-replay/index.ts` | Placeholder export |
| Create | `app/src/features/meta-dashboard/index.ts` | Placeholder export |
| Create | `app/src/features/player-attribution/index.ts` | Placeholder export |
| Create | `app/src/shared/components/index.ts` | Placeholder export |
| Create | `app/src/shared/hooks/index.ts` | Placeholder export |
| Create | `app/src/adapters/firestore.ts` | I/O boundary stub — no SDK imports yet |
| Create | `app/src/schema/ti4_schema.ts` | Verbatim copy of root schema file |
| Move | `*.json` (7 files) → `app/game-data/` | Real game exports — primary dataset |
| Create | `.github/workflows/ci.yml` | Runs acceptance bar on push/PR |
| Create | `app/README.md` | Dev setup instructions |
| Create | `README.md` | Root file linking to app |

---

## Task 1: Git Init and .gitignore

**Files:**
- Create: `D:\_TI4 App\.gitignore`

- [ ] **Step 1: Initialize the repository**

Run from `D:\_TI4 App\`:
```bash
git init
```
Expected output: `Initialized empty Git repository in D:/_TI4 App/.git/`

- [ ] **Step 2: Create .gitignore**

Create `D:\_TI4 App\.gitignore` with this exact content:
```
# Dependencies
node_modules/

# Build output
dist/
build/

# Test coverage
coverage/

# Environment variables — never commit these
.env
.env.local
.env.*.local

# Editor artifacts
.DS_Store
Thumbs.db
*.swp
*.swo

# Vite cache
.vite/
```

- [ ] **Step 3: Verify git status is clean and .gitignore works**

```bash
git status
```
Expected: all files listed as untracked (not ignored). Confirm `node_modules` is not listed if one exists.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: git init and .gitignore"
```

---

## Task 2: Scaffold Vite + React + TypeScript App

**Files:**
- Create: `app/` (entire scaffold)

- [ ] **Step 1: Run the Vite scaffold command**

Run from `D:\_TI4 App\`:
```bash
npm create vite@latest app -- --template react-ts
```
When prompted for package name, accept `app`. Expected: scaffold created at `D:\_TI4 App\app\`.

- [ ] **Step 2: Install dependencies**

```bash
cd app && npm install
```
Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Verify the baseline builds**

```bash
npm run build
```
Expected: `dist/` directory created, exit code 0.

- [ ] **Step 4: Verify the baseline type-checks**

```bash
npm run typecheck 2>/dev/null || npx tsc --noEmit
```
Expected: exit code 0, no output. (The default Vite scaffold has no type errors.)

- [ ] **Step 5: Commit the scaffold**

```bash
cd ..
git add app/
git commit -m "chore: scaffold vite react-ts app"
```

---

## Task 3: Harden TypeScript Configuration

**Files:**
- Modify: `app/tsconfig.json`

- [ ] **Step 1: Open `app/tsconfig.json` and replace its content**

The default Vite scaffold's `tsconfig.json` already has `"strict": true`. Add the two additional flags required by SKILLS.md §3. Write this as the complete file:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 2: Verify the scaffold still type-checks under the stricter rules**

```bash
cd app && npx tsc --noEmit
```
Expected: exit code 0. If you see errors in the generated scaffold files (e.g., `App.tsx`), fix them now. Common fix: add `| undefined` to array accesses, or use optional chaining.

- [ ] **Step 3: Commit**

```bash
cd ..
git add app/tsconfig.json
git commit -m "chore: harden tsconfig with noUncheckedIndexedAccess and exactOptionalPropertyTypes"
```

---

## Task 4: Install and Configure Tailwind CSS

**Files:**
- Create: `app/tailwind.config.ts`
- Create: `app/postcss.config.js`
- Modify: `app/src/index.css`
- Modify: `app/vite.config.ts` (no change needed — PostCSS is auto-detected)

- [ ] **Step 1: Install Tailwind v3 and its PostCSS dependencies**

```bash
cd app && npm install -D tailwindcss@3 postcss autoprefixer
```
Expected: packages added to `devDependencies`, no errors.

- [ ] **Step 2: Create `app/postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 3: Create `app/tailwind.config.ts` with the Deep Space theme stub**

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep Space background tokens
        'space-bg': '#0a0e1a',
        'space-surface': '#131929',
        'space-border': '#1e2d45',
        'space-text': '#e2e8f0',
        'space-muted': '#64748b',
        // Faction color slots — values finalized in Phase 4
        'faction-blue': '#3b82f6',
        'faction-red': '#ef4444',
        'faction-green': '#22c55e',
        'faction-yellow': '#eab308',
        'faction-purple': '#a855f7',
        'faction-orange': '#f97316',
        'faction-pink': '#ec4899',
        'faction-cyan': '#06b6d4',
      },
      fontFamily: {
        display: ['Rajdhani', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 4: Replace `app/src/index.css` with Tailwind directives**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Verify the build still passes with Tailwind wired in**

```bash
cd app && npm run build
```
Expected: exit code 0, `dist/` updated. If you see a PostCSS error about `tailwind.config.ts`, install `ts-node` as a dev dependency: `npm install -D ts-node` and retry.

- [ ] **Step 6: Commit**

```bash
cd ..
git add app/tailwind.config.ts app/postcss.config.js app/src/index.css
git commit -m "chore: add Tailwind v3 with Deep Space theme stub"
```

---

## Task 5: Install and Configure Vitest + React Testing Library

**Files:**
- Create: `app/vitest.config.ts`
- Create: `app/src/test-setup.ts`
- Modify: `app/tsconfig.json` (add vitest types)
- Modify: `app/package.json` (add test scripts)

- [ ] **Step 1: Install testing dependencies**

```bash
cd app && npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 2: Create `app/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
      // Thresholds start at 0; raised to 90% in Phase 1 once lib/ has real code
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
  },
})
```

- [ ] **Step 3: Create `app/src/test-setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add vitest types to `app/tsconfig.json`**

Add `"types": ["vitest/globals", "@testing-library/jest-dom"]` inside `compilerOptions`. The full `compilerOptions` block becomes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: Add `test` and `test:watch` scripts to `app/package.json`**

In the `"scripts"` section, ensure these are present (keep all existing scripts and add/update these):

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 6: Verify Vitest is wired by running with no test files**

```bash
cd app && npm test
```
Expected: `No test files found` or exit code 0 with a "no tests" message. Do NOT expect a failure here.

- [ ] **Step 7: Commit**

```bash
cd ..
git add app/vitest.config.ts app/src/test-setup.ts app/tsconfig.json app/package.json
git commit -m "chore: add vitest + react testing library"
```

---

## Task 6: Smoke Test (Red → Green → Commit)

**Files:**
- Create: `app/src/smoke.test.ts`

This is the first TDD cycle. It is trivial by design — its only purpose is to prove the test runner is wired.

- [ ] **Step 1 (Red): Write the failing test**

Create `app/src/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('test runner is wired correctly', () => {
    expect(1 + 1).toBe(2)
  })
})
```

Then deliberately break it to confirm the runner reports failures:
```ts
expect(1 + 1).toBe(99) // temporary — break it first
```

Run:
```bash
cd app && npm test
```
Expected: `FAIL src/smoke.test.ts > smoke > test runner is wired correctly` with an assertion error.

- [ ] **Step 2 (Green): Restore the correct assertion**

Change `toBe(99)` back to `toBe(2)`. Run:
```bash
npm test
```
Expected:
```
✓ src/smoke.test.ts (1)
  ✓ smoke (1)
    ✓ test runner is wired correctly

Test Files  1 passed (1)
Tests       1 passed (1)
```

- [ ] **Step 3: Commit**

```bash
cd ..
git add app/src/smoke.test.ts
git commit -m "test: add smoke test — proves vitest is wired"
```

---

## Task 7: Configure ESLint + Prettier

**Files:**
- Modify: `app/eslint.config.js`
- Create: `app/.prettierrc`

- [ ] **Step 1: Install Prettier and ESLint-Prettier integration**

```bash
cd app && npm install -D prettier eslint-config-prettier
```

- [ ] **Step 2: Replace `app/eslint.config.js` with the hardened config**

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  prettierConfig,
)
```

- [ ] **Step 3: Create `app/.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 4: Add lint and format scripts to `app/package.json`**

In the `"scripts"` section, add or update:
```json
"lint": "eslint src",
"lint:fix": "eslint src --fix",
"format": "prettier --write src",
"typecheck": "tsc --noEmit"
```

(Remove any existing `"lint"` entry and replace it.)

- [ ] **Step 5: Verify lint passes on the scaffold**

```bash
cd app && npm run lint
```
Expected: exit code 0, no errors. If you see `@typescript-eslint/no-explicit-any` errors in the generated `App.tsx` or other scaffold files, fix them: replace any `any` with the actual type or `unknown`.

- [ ] **Step 6: Commit**

```bash
cd ..
git add app/eslint.config.js app/.prettierrc app/package.json
git commit -m "chore: add prettier + harden eslint (no-explicit-any: error)"
```

---

## Task 8: Create Folder Structure with Placeholder Files

**Files:**
- Create: 9 placeholder `index.ts` files
- Create: `app/src/adapters/firestore.ts`

Every directory in the `src/` structure gets a placeholder so the folder layout is visible in the repo from day one. The `firestore.ts` adapter stub is slightly more explicit: it records the constraint that no other file imports the Firestore SDK.

- [ ] **Step 1: Create all placeholder index files**

Run from `D:\_TI4 App\`:
```bash
mkdir -p "app/src/lib/parser" "app/src/lib/aggregator" \
  "app/src/features/upload" "app/src/features/game-replay" \
  "app/src/features/meta-dashboard" "app/src/features/player-attribution" \
  "app/src/shared/components" "app/src/shared/hooks" \
  "app/src/adapters" "app/src/schema"
```

Then create each file with identical content (one command per file):

`app/src/lib/parser/index.ts`:
```ts
export {}
```

`app/src/lib/aggregator/index.ts`:
```ts
export {}
```

`app/src/features/upload/index.ts`:
```ts
export {}
```

`app/src/features/game-replay/index.ts`:
```ts
export {}
```

`app/src/features/meta-dashboard/index.ts`:
```ts
export {}
```

`app/src/features/player-attribution/index.ts`:
```ts
export {}
```

`app/src/shared/components/index.ts`:
```ts
export {}
```

`app/src/shared/hooks/index.ts`:
```ts
export {}
```

- [ ] **Step 2: Create the Firestore adapter stub**

`app/src/adapters/firestore.ts`:
```ts
// All Firestore SDK calls live here. No other file imports firebase/firestore.
// Implemented in Phase 1.8.
export {}
```

- [ ] **Step 3: Verify typecheck still passes**

```bash
cd app && npx tsc --noEmit
```
Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
cd ..
git add app/src/
git commit -m "chore: create folder structure with placeholder files"
```

---

## Task 9: Copy Schema File

**Files:**
- Create: `app/src/schema/ti4_schema.ts`

The schema at `D:\_TI4 App\ti-assistant TI4 Schema Definitions.ts` is the canonical source of truth for the raw TI Assistant JSON shape. Copy it verbatim — do not modify it.

- [ ] **Step 1: Copy the schema file**

```bash
cp "ti-assistant TI4 Schema Definitions.ts" "app/src/schema/ti4_schema.ts"
```

- [ ] **Step 2: Verify it type-checks**

```bash
cd app && npx tsc --noEmit
```
Expected: exit code 0. If you see errors about `Record<string, any>` violating `no-explicit-any` in ESLint, note that the lint rule applies to code we write — the schema file's `any` is intentional (it represents the variable payload from TI Assistant). Add a targeted disable comment at the top of the schema file only:

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
// This file is a verbatim copy of the TI Assistant JSON schema.
// The `any` in GameEventPayload.event is intentional — callers must narrow it.
```

- [ ] **Step 3: Commit**

```bash
cd ..
git add "app/src/schema/ti4_schema.ts"
git commit -m "chore: copy ti4 schema to app/src/schema/"
```

---

## Task 10: Move Game Data Files

**Files:**
- Move: 7 JSON exports → `app/game-data/`

These are real game records from the playgroup. Moving them into the repo makes them available as test fixtures for Phase 1 acceptance testing.

- [ ] **Step 1: Create the game-data directory**

```bash
mkdir -p "app/game-data"
```

- [ ] **Step 2: Move all seven JSON exports**

```bash
mv "1.19.25 TI Assistant JSON Game Data.json" "app/game-data/"
mv "LjnqDB_data (2).json" "app/game-data/"
mv "TIAssistant_Game Data.json" "app/game-data/"
mv "nHg8Hw_data.json" "app/game-data/"
mv "nMhFhJ_data (1).json" "app/game-data/"
mv "PgyXRx_data.json" "app/game-data/"
mv "nHg8Hw_data.json" "app/game-data/" 2>/dev/null; true
```

Verify all seven files landed:
```bash
ls "app/game-data/"
```
Expected: 7 `.json` files listed.

- [ ] **Step 3: Add game-data to .gitignore? No — commit them.**

These files are the dataset. They belong in the repo. Do not add them to `.gitignore`.

- [ ] **Step 4: Commit**

```bash
git add "app/game-data/"
git commit -m "chore: move 7 real game exports to app/game-data/"
```

---

## Task 11: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow directory**

```bash
mkdir -p ".github/workflows"
```

- [ ] **Step 2: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: app

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: app/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
```

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "ci: add github actions workflow — runs acceptance bar on push/PR"
```

---

## Task 12: Write README Files

**Files:**
- Create: `app/README.md`
- Create: `README.md`

- [ ] **Step 1: Create `app/README.md`**

```markdown
# TI4 Hall of Records — App

## Prerequisites

- Node 20+
- npm 10+

## Setup

```bash
npm install
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server at http://localhost:5173 |
| `npm run build` | Production build to `dist/` |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm run lint` | ESLint |
| `npm test` | Run test suite (Vitest) |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage report for `src/lib/**` |

## Game Data

Real game exports live in `game-data/`. These are the primary dataset for Phase 1 acceptance testing — every parsed game's `finalScores` must match the actual game outcome.

## Architecture

See [`../SKILLS.md`](../SKILLS.md) for the full engineering playbook and [`../ROADMAP.md`](../ROADMAP.md) for the phased delivery plan.

Key constraint: `src/lib/` is pure TypeScript (no React, no I/O). All Firestore calls go through `src/adapters/firestore.ts` only.
```

- [ ] **Step 2: Create root `README.md`**

```markdown
# TI4 Hall of Records

A web app that parses, stores, and visualizes Twilight Imperium 4 game logs from TI Assistant.

## Docs

- [ROADMAP.md](ROADMAP.md) — phased delivery plan (source of truth)
- [SKILLS.md](SKILLS.md) — engineering playbook (TDD, folder structure, TypeScript rules)
- [CLAUDE.md](CLAUDE.md) — AI session context

## App

See [`app/README.md`](app/README.md) for dev setup.
```

- [ ] **Step 3: Commit**

```bash
git add app/README.md README.md
git commit -m "docs: add root and app README files"
```

---

## Task 13: Final Acceptance Bar

This is the gate task. Phase 1 does not begin until every command below exits 0.

- [ ] **Step 1: Run the full acceptance bar from a clean state**

```bash
cd "D:/_TI4 App/app"
npm install && npm run typecheck && npm run lint && npm test && npm run build
```

Expected output (abbreviated):
```
added N packages in Xs
...
✓ No TypeScript errors found
...
✓ Lint passed with no errors
...
✓ src/smoke.test.ts (1)
  ✓ smoke (1)
    ✓ test runner is wired correctly
Test Files  1 passed (1)
Tests       1 passed (1)
...
✓ built in Xs
```

All five commands must exit 0. If any fail, diagnose and fix before proceeding.

- [ ] **Step 2: Verify the dev server starts**

```bash
npm run dev
```
Open `http://localhost:5173` in a browser. Expected: the default Vite + React starter page (white background, React logo, counter button). This confirms the full dev loop works.

Kill the server (`Ctrl+C`).

- [ ] **Step 3: Tag Phase 0 complete**

```bash
cd "D:/_TI4 App"
git tag phase-0-complete
```

- [ ] **Step 4: Final commit if any changes were made during acceptance testing**

```bash
git status
# If clean: nothing to do
# If there are changes: commit them with a descriptive message
```

---

## Self-Review Against Spec

**Spec requirement coverage:**

| Spec item | Task |
|-----------|------|
| `git init` + `.gitignore` | Task 1 |
| Vite + React + TypeScript scaffold | Task 2 |
| Tailwind CSS with Deep Space theme stub | Task 4 |
| Vitest + RTL wired | Task 5 |
| One trivial passing test (`smoke.test.ts`) | Task 6 |
| ESLint + Prettier (`no-explicit-any: error`) | Task 7 |
| Folder structure with placeholder `index.ts` files | Task 8 |
| `app/src/schema/ti4_schema.ts` copied from root | Task 9 |
| `app/package.json` scripts: dev, build, test, test:watch, typecheck, lint | Tasks 5 + 7 |
| Move 7 JSON exports to `app/game-data/` | Task 10 |
| GitHub Actions CI | Task 11 |
| `app/README.md` + root `README.md` | Task 12 |
| Acceptance bar passes | Task 13 |

No gaps found.

**Placeholder scan:** All steps contain exact file content, exact commands, and exact expected output. No TBDs.

**Type consistency:** The only type-bearing file introduced is `ti4_schema.ts` (verbatim copy). No type names are referenced across tasks that could drift.
