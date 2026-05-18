# Research Bank E — Feature-Module Architecture & Code-Size Governance (H-ARCH)

> Scope: feature-based / vertical-slice front-end structure; module boundary contracts & encapsulation; colocation; design-token enforcement at lint level; file/feature size-ceiling enforcement in CI/lint; dependency-direction rules; barrel/public-API patterns; provider/hook/constant separation for HMR stability.
> Research date: 2026-05-18. All sources opened and verified during this session.

---

## Sources

S1. **Feature-Sliced Design — Reference: Layers** — https://feature-sliced.design/docs/reference/layers — (T2) — Canonical FSD methodology spec: 7-layer hierarchy, unidirectional dependency rule ("a module can only import slices located on layers strictly below"), isolation rule, `@x` cross-entity notation.

S2. **Feature-Sliced Design — Reference: Public API** — https://feature-sliced.design/docs/reference/public-api — (T2) — Defines slice public API contract: explicit re-exports only (no wildcard `export *`), internal paths off-limits to consumers; rationale: "the rest of the application must be protected from structural changes to the slice."

S3. **Steiger — Universal file-structure & architecture linter (feature-sliced/steiger)** — https://github.com/feature-sliced/steiger — (T2) — Standalone CLI linter for FSD; built-in rules: `fsd/no-cross-imports`, `fsd/no-higher-level-imports`, `fsd/public-api` (requires index.ts per slice), `fsd/no-public-api-sidestep` (blocks deep imports); integrates into CI as `npx steiger ./src`.

S4. **ESLint — `max-lines` rule** — https://eslint.org/docs/latest/rules/max-lines — (T1) — Official ESLint built-in: enforces a per-file line ceiling; options `max` (default 300), `skipBlankLines`, `skipComments`; rationale: "large files tend to do a lot of things and can make it hard following what's going"; industry guidance 100–500 lines.

S5. **ESLint — `no-restricted-imports` rule** — https://github.com/eslint/eslint/blob/main/docs/src/rules/no-restricted-imports.md — (T1) — Official ESLint built-in: bans named imports or glob path patterns with custom error messages; `patterns` array with `group` + `importNamePattern` supports cross-feature deep-import prevention without a third-party plugin.

S6. **Kent C. Dodds — "Colocation"** — https://kentcdodds.com/blog/colocation — (T2) — Named practitioner principle: "place code as close to where it's relevant as possible"; colocate tests, styles, hooks, and utilities with the component they serve; move up the tree only when genuinely shared.

S7. **Jeremy Richardson — "Optimizing HMR in React with Vite: One Component Export Per File"** — https://jeremyrichardson.dev/blog/optimizing-hot-module-replacement-hmr-in-react-with-vite-the-importance-of-one-component-export-per-file — (T3) — Documents the Vite/React Fast Refresh constraint: a `.tsx` file exporting non-component symbols (hooks, constants) degrades to a full page reload; solution is one component per `.tsx` file with hooks in `.ts` files; cites `eslint-plugin-react-refresh` for enforcement.

S8. **`eslint-plugin-boundaries` (javierbrea)** — https://github.com/javierbrea/eslint-plugin-boundaries — (T2) — Maintained ESLint plugin; define element types by path pattern, declare allowed dependency graph via `boundaries/dependencies` rule with `default: disallow` + explicit allow list; works without monorepo tooling; real-time lint errors on cross-boundary imports.

---

## Extracted Heuristics

- **H-ARCH01** A feature module exposes only the symbols listed in its `index.ts` barrel; any import that bypasses the barrel to reach an internal path (`features/foo/model/store.ts`) is a lint error enforced by `no-restricted-imports` patterns or Steiger's `fsd/no-public-api-sidestep` rule. [S2, S3, S5]

- **H-ARCH02** Feature modules must not import from sibling feature modules at the same architectural layer; allowed dependencies flow strictly downward (features → entities → shared), enforced at lint time via `eslint-plugin-boundaries` or Steiger's `fsd/no-cross-imports` rule. [S1, S3, S8]

- **H-ARCH03** Every file that is part of a feature module — component, hook, test, style, type declaration — lives inside that feature's directory (colocation); a file moves to a higher shared layer only when two or more distinct features actually consume it. [S6]

- **H-ARCH04** A `.tsx` file must export exactly one React component and nothing else (no hooks, constants, or utility exports alongside a component); hooks and constants go in separate `.ts` files to preserve Vite Fast Refresh hot-module-replacement without full page reloads. [S7]

- **H-ARCH05** Each feature's context/reducer provider is defined in a dedicated `*Context.tsx` file alongside custom hooks (`use*.ts`) that expose the context value; components import the hooks, never `useContext` directly, keeping context wiring colocated but separable from view files. [S6, S7] — and supported by the React docs pattern: [https://react.dev/learn/scaling-up-with-reducer-and-context]

- **H-ARCH06** Per-file line count is enforced by ESLint's `max-lines` rule (recommended ceiling 200–300 lines with `skipBlankLines: true, skipComments: true`); exceeding the ceiling is a lint error that fails CI, structurally preventing god-files without manual code-review discipline. [S4]

- **H-ARCH07** Raw hex color literals (e.g. `#3B82F6`) and raw pixel values used as design decisions must not appear in component files; they are banned via a custom ESLint rule or `no-restricted-syntax` AST selector targeting string/numeric literals in style props, with a message directing authors to the design-token file (`tokens.css` / Tailwind config). [S5] — corroborated by design-token enforcement survey: [https://medium.com/@barshaya97_76274/design-tokens-enforcement-977310b2788e] ⚠ adjudicate

- **H-ARCH08** Barrel exports (`index.ts`) at the feature root are the only stable cross-feature import surface; the barrel lists explicit named re-exports (never `export * from`), so the public API is self-documenting and rename-safe. [S2, S3]

- **H-ARCH09** Architectural boundary rules (which feature types may import which) are declared once in a project-level ESLint config (via `eslint-plugin-boundaries` element definitions or Steiger's `steiger.config.ts`) rather than repeated in per-directory `tsconfig` paths hacks, so the rule set is the single source of truth checked in CI. [S3, S8]

---

## Notes / Concerns

### Realistic per-file / per-feature LOC ceiling enforcement mechanisms

Three viable mechanisms exist for this project (ESLint + Vite + TS, no monorepo):

1. **ESLint `max-lines` (T1 — recommended):** Zero additional dependencies; configure `"max-lines": ["error", { "max": 250, "skipBlankLines": true, "skipComments": true }]` in `eslint.config.ts`. Fails `npm run lint` (and therefore CI) on overage. Can be overridden per-file with `/* eslint-disable max-lines */` which is self-documenting. This is the lowest-friction option for this stack.

2. **Steiger CLI (T2 — additive):** Run `npx steiger ./src` as a separate CI step. Enforces FSD structural rules (layer names, public API presence, cross-imports) that `max-lines` doesn't cover. Not a replacement for `max-lines` — the two are complementary. Adds a new config file (`steiger.config.ts`) but no ESLint changes.

3. **Custom CI script (ad-hoc):** A short Node/PowerShell script that counts lines per file and exits non-zero above a threshold, added as a CI check. More flexible (can apply different ceilings per directory) but requires maintenance and is invisible to the editor. Prefer `max-lines` for editor integration.

**Recommended for this project:** Start with ESLint `max-lines` at 250 lines (strict enough to prevent god-files; permissive enough to not split small utility files artificially), plus Steiger for architectural boundary enforcement. Add `eslint-plugin-boundaries` if/when Steiger's CLI-only model is inconvenient for editor inline feedback.

### Concerns

- **H-ARCH07 is T3-corroborated only** for the specific "ban raw hex in JSX" enforcement pattern. The underlying tools (`no-restricted-syntax`, custom ESLint rules) are T1, but no official style guide or widely-cited practitioner source mandates this specific configuration — mark for adjudication before treating it as a hard rule.

- **Steiger is FSD-specific:** Teams not adopting the full FSD layer naming convention cannot use Steiger out of the box; `eslint-plugin-boundaries` is the more portable alternative for projects with a simpler feature-folder structure.

- **`max-lines` does not enforce per-feature aggregate size** — only per-file. A feature that splits one 500-line file into five 100-line files satisfies the rule while still being a large feature. If per-feature ceiling governance is desired, it requires a custom CI script or directory-size check.

- **One component per `.tsx` file (H-ARCH04):** Vite's `eslint-plugin-react-refresh` enforces this as a warning by default; elevate to `"error"` in `eslint.config.ts` to make it a hard gate.
