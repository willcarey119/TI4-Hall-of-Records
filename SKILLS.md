# SKILLS.md — TI4 Hall of Records

The operational engineering playbook for this project. Every contributor (human or AI) applies these skills on every change. The Master Guidance Document explains *what* we are building and *why*; this file defines *how we work*.

---

## 1. Test-Driven Development (Red → Green → Refactor)

**Rule:** No production logic ships without a failing test that motivated it.

**Workflow:**
1. **Red.** Write the smallest failing test that describes the next behavior. Run it. Confirm it fails for the *right* reason (not a typo, not a missing import).
2. **Green.** Write the minimum production code to make it pass. Hardcoded constants are fine here. Resist generalizing.
3. **Refactor.** With the green bar protecting you, clean up: extract helpers, tighten types, remove duplication. Run tests after each refactor step.

**Test structure:** Arrange → Act → Assert. One logical assertion per test. Test names describe behavior in plain English (`extractVPEvents returns empty array when actionLog has no scoring events`).

**Coverage philosophy:** We measure coverage on the parsing/aggregation layer (`src/lib/**`) and require it to stay ≥ 90%. UI components are tested by behavior (React Testing Library), not by line coverage.

---

## 2. Logic Isolation (Pure-Function Core)

**Rule:** Parsing, aggregation, and statistics live in pure TypeScript modules under `src/lib/`. React components consume the results — they never iterate over `actionLog` themselves.

**Why:** Pure functions are trivially testable, deterministic, and reusable across upload UI, single-game replay, meta-dashboard, and future CLI/batch jobs.

**Checklist for every PR touching parsing:**
- [ ] No `useState`, `useEffect`, or DOM access inside `src/lib/`
- [ ] No mutation of inputs (treat `TI4ExportData` as frozen)
- [ ] No I/O (no `fetch`, no Firestore SDK calls) — that's the adapter layer's job
- [ ] Function returns a new object/array; no shared references with input
- [ ] Test file lives next to the source file (`gameParser.ts` ↔ `gameParser.test.ts`)

---

## 3. Strict TypeScript

**Rule:** `tsconfig.json` runs `"strict": true`, `"noUncheckedIndexedAccess": true`, and `"exactOptionalPropertyTypes": true`. `any` is banned.

**When the schema says `Record<string, any>`** (the `event` field on `GameEventPayload`), use **discriminated union narrowing** at the parser boundary:

```ts
type ScoreObjectiveEvent = { faction: string; objective: string };
function isScoreObjective(e: GameEventPayload): e is GameEventPayload & { event: ScoreObjectiveEvent } {
  return e.action === "SCORE_OBJECTIVE"
    && typeof (e.event as ScoreObjectiveEvent).faction === "string"
    && typeof (e.event as ScoreObjectiveEvent).objective === "string";
}
```

The `any` stays contained inside the schema file; nothing downstream sees it.

**Escape hatch:** If you genuinely need `unknown`, write a comment explaining why and add a type guard.

---

## 4. Negative Testing & Defensive Parsing

**Rule:** Every parser function has at least one test for malformed input alongside the happy path.

**Required negative cases for parsers:**
- Empty `actionLog`
- Missing optional fields (`startswith`, `techs`, `mapPosition`)
- Unknown `action` strings (forward-compat with future TI Assistant versions)
- Reversed/duplicate events (`UNSCORE_OBJECTIVE` undoing a previous `SCORE_OBJECTIVE`; `UNCLAIM_PLANET` reverting ownership)
- Action log in non-chronological order (real exports are reverse-chronological — sort by `gameTime` before reducing)

The parser returns clean data or a typed error result. It never throws on malformed input from a real export.

---

## 5. Feature-Based Folder Structure

```
src/
  lib/                      # Pure logic — no React
    parser/
      gameParser.ts
      gameParser.test.ts
      objectives.ts         # Stage I/II/Secret point dictionary
      vpSources.ts          # Non-objective VP extractors (§1.5a-g)
    aggregator/
  features/                 # UI grouped by user-facing feature
    upload/
    game-replay/
    meta-dashboard/
    player-attribution/     # Phase 3.5 — opt-in first-name tagging only
  shared/                   # Cross-feature UI primitives only
    components/
    hooks/
  schema/
    ti4_schema.ts
  adapters/                 # I/O boundary
    firestore.ts

docs/
  superpowers/
    specs/                  # Design docs: YYYY-MM-DD-<topic>-design.md
```

**Rule:** A feature folder owns its components, hooks, types, and tests. Cross-feature imports go through `src/shared/` or `src/lib/`. Never reach sideways into another feature's internals.

> **Note on `player-attribution/`:** This is Phase 3.5 scope only — opt-in best-effort first-name tagging, not a canonical player identity system. There is no `aliases/` folder and no `players` Firestore collection. If you find yourself building a canonical player ID abstraction, stop — that model was retired 2026-04-26.

---

## 6. React Discipline (Compiler-Ready)

- Components are pure: same props → same output. No external mutation in render.
- Side effects live in `useEffect`, data fetching in custom hooks (`useGameStats`, `useFirestoreGame`).
- No prop drilling past two levels — lift to context or a custom hook.
- Style with Tailwind utility classes. No global CSS except the Tailwind preflight and theme tokens in `tailwind.config.ts`.
- Prefer composition over conditional rendering inside a single component.

---

## 7. Firestore Adapter Pattern

**Rule:** Components and pure logic never import the Firestore SDK directly. All reads/writes go through `src/adapters/firestore.ts`, which exposes typed functions (`saveGame(parsed: ParsedGame): Promise<string>`, `loadGame(id: string): Promise<ParsedGame>`).

**Why:** Lets us swap the backend, mock it in tests, and contain the SDK's `any`-heavy surface in one file.

**Storage shape:** Parse client-side on upload; persist only the cleaned/aggregated result. Raw JSON is uploaded once, parsed, then either discarded or stored in Firebase Storage as cold backup (decide in Phase 1).

---

## 8. Player Anonymization Discipline

Players change every game. **Factions are the primary alignment axis for all aggregates** — never players.

- Every aggregated stat keys on `factionId`, never on raw `playerName`.
- Raw `playerName` strings are stored on each game record but **never displayed in the UI by default**. The default surface shows factions and faction colors only.
- First-name attribution is opt-in, per name, per user action. When opted in, stats display with an explicit "best-effort, N games" qualifier.
- No automatic alias merging. No `players` Firestore collection — first-name views are computed at read time from tagged faction-game records.
- If you find yourself building a "canonical player ID" abstraction, stop. That model was retired on 2026-04-26 — see ROADMAP Phase 3 pivot.

---

## 9. Definition of Done (per PR)

A change is "done" when **all** of these are true:

- [ ] Tests written first, all green (`npm test`)
- [ ] `npm run typecheck` clean (no errors, no `any`)
- [ ] `npm run lint` clean
- [ ] No raw `actionLog` iteration in `src/features/**` or `src/shared/**`
- [ ] If touching parser: at least one negative-path test added
- [ ] If touching UI: behavior verified in browser, not just unit tests
- [ ] Docs updated if a public API in `src/lib/` changed

---

## 10. Tooling

| Concern        | Tool                              |
| -------------- | --------------------------------- |
| Bundler        | Vite                              |
| Test runner    | Vitest + @testing-library/react   |
| Type checker   | `tsc --noEmit`                    |
| Lint/format    | ESLint + Prettier                 |
| Charts         | Recharts                          |
| Backend        | Firebase Firestore (modular SDK)  |
| Deploy         | Vercel                            |
| Pkg manager    | npm (lockfile checked in)         |
