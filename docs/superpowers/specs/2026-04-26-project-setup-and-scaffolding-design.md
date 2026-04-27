# Design: Project Setup & Scaffolding (Phase 0)

**Date:** 2026-04-26
**Status:** Approved — pending implementation plan

---

## What This Covers

This spec defines the complete state the repository must reach before any feature work begins. It is Phase 0 of the ROADMAP. The result is a repo that boots, type-checks, lints, and passes a test suite — with no business logic yet.

---

## Architecture

**Single-repo structure:**

```
D:\_TI4 App\
  app/                        ← all runnable code
    src/
      lib/parser/
      lib/aggregator/
      features/upload/
      features/game-replay/
      features/meta-dashboard/
      features/player-attribution/
      shared/components/
      shared/hooks/
      schema/ti4_schema.ts
      adapters/firestore.ts
      smoke.test.ts
    game-data/               ← 7 JSON exports moved here
    tailwind.config.ts
    vite.config.ts
    vitest.config.ts
    tsconfig.json
    package.json
  docs/superpowers/specs/      ← design docs
  CLAUDE.md
  ROADMAP.md
  SKILLS.md
  Development Guidelines.md
  ti-assistant TI4 Schema Definitions.ts
```

**What does NOT exist in Phase 0:** no parser logic, no UI components, no Firestore calls. Only the scaffold, the schema copy, and placeholder `index.ts` files in each `src/` subdirectory.

---

## Components

### 1. Vite + React + TypeScript scaffold
Standard `npm create vite@latest app -- --template react-ts`. No modifications to generated files beyond what's required for Tailwind and Vitest wiring.

### 2. TypeScript configuration
`tsconfig.json` must include:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```
No `any` anywhere outside `src/schema/ti4_schema.ts`.

### 3. Tailwind CSS
`tailwind.config.ts` with a `deepSpace` theme stub — dark background token, faction color palette slots (filled in Phase 4). Content paths cover `src/**/*.{ts,tsx}`.

### 4. Vitest + React Testing Library
`vitest.config.ts` with `environment: 'jsdom'`. One passing smoke test at `app/src/smoke.test.ts`:
```ts
it('smoke', () => expect(1 + 1).toBe(2));
```
Coverage reporter configured; threshold set to 0% for Phase 0 (raised to 90% in Phase 1 when parser code exists).

### 5. ESLint + Prettier
`no-explicit-any: error` in ESLint config. Prettier defaults. Single config file (flat config `eslint.config.js`).

### 6. Folder placeholders
Every `src/` subdirectory in the structure above gets a minimal `index.ts` that exports nothing:
```ts
// placeholder
export {};
```
This makes the folder structure visible in the repo without dead imports.

### 7. Schema copy
`app/src/schema/ti4_schema.ts` is a verbatim copy of `D:\_TI4 App\ti-assistant TI4 Schema Definitions.ts`. This is the only source of truth for raw data shapes; the Master Guidance Document's interfaces are deprecated.

### 8. Game data migration
The 7 real game JSON exports move from `D:\_TI4 App\` to `D:\_TI4 App\app\game-data\`. These are actual playgroup records and the primary dataset for Phase 1 acceptance testing.

### 9. npm scripts
```json
{
  "dev": "vite",
  "build": "vite build",
  "typecheck": "tsc --noEmit",
  "lint": "eslint src",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

## Data Flow

Phase 0 has no data flow — it is scaffolding only. Data flow begins in Phase 1 with the parser.

---

## Error Handling

Not applicable for Phase 0 (no business logic). The acceptance bar is a clean CI run; any error in `typecheck`, `lint`, `test`, or `build` is a blocker.

---

## Testing Strategy

- One smoke test to prove Vitest is wired correctly.
- TypeScript strict mode is itself a test suite — the schema copy must type-check cleanly.
- Manual verification: `npm run dev` opens a browser with the default Vite React starter page.

---

## Acceptance Bar

From `D:\_TI4 App\app\`:
```
npm install && npm run typecheck && npm run lint && npm test && npm run build
```
All commands exit 0. Phase 1 does not begin until this passes.

---

## Open Questions (resolved)

1. **Git init location:** Root `D:\_TI4 App\` (not inside `app/`). `.gitignore` at root.
2. **Firebase project:** Stubbed behind env vars in Phase 0; actual Firebase Console project creation is a manual step before Phase 1.7/1.8.
3. **CI/CD:** GitHub Actions workflow (`ci.yml`) added in Phase 0 — runs the acceptance bar on every push/PR. Vercel preview deploys configured in Phase 4.
