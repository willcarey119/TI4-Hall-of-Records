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

Real game exports from the playgroup live in `game-data/`. These are the primary dataset — every parsed game's `finalScores` must match the actual game outcome to pass Phase 1 acceptance.

## Architecture

See [`../SKILLS.md`](../SKILLS.md) for the full engineering playbook and [`../ROADMAP.md`](../ROADMAP.md) for the phased delivery plan.

Key constraint: `src/lib/` is pure TypeScript (no React, no I/O). All Firestore calls go through `src/adapters/firestore.ts` only.
