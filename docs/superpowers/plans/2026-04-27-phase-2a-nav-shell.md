# Phase 2a Navigation Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the routing skeleton, five shared design primitives, home page (upload + game list), and game-detail navigation shell (frozen masthead + scroll-to-section nav with IntersectionObserver).

**Architecture:** React Router v7 provides two routes (`/` and `/games/:gameId`). `GameContext` (scoped to the game-detail feature) holds the loaded `ParsedGame` so `FrozenHeader` and the four section stubs can read it without prop-drilling. `ScrollBody` manages IntersectionObserver to track the active nav section and reports it up to `GameDetailPage` via a callback.

**Tech Stack:** React 19 · TypeScript strict · React Router v7 · Vitest + React Testing Library · Tailwind CSS · CSS custom properties (design tokens) · Firebase Firestore (adapter already built)

---

## File Map

**Create:**
```
app/src/shared/formatters.ts          # formatDate, formatDuration, formatGameTitle, formatKicker
app/src/shared/formatters.test.ts
app/src/shared/Label.tsx
app/src/shared/Label.test.tsx
app/src/shared/Rule.tsx
app/src/shared/Rule.test.tsx
app/src/shared/Mast.tsx
app/src/shared/Mast.test.tsx
app/src/shared/Kicker.tsx
app/src/shared/Kicker.test.tsx
app/src/shared/FactionChip.tsx
app/src/shared/FactionChip.test.tsx
app/src/shared/index.ts

app/src/features/game-detail/GameContext.tsx
app/src/features/game-detail/VpRaceSection.tsx
app/src/features/game-detail/TimelineSection.tsx
app/src/features/game-detail/DashboardSection.tsx
app/src/features/game-detail/PlanetsSection.tsx
app/src/features/game-detail/sections.test.tsx
app/src/features/game-detail/FrozenHeader.tsx
app/src/features/game-detail/FrozenHeader.test.tsx
app/src/features/game-detail/ScrollBody.tsx
app/src/features/game-detail/ScrollBody.test.tsx
app/src/features/game-detail/GameDetailPage.tsx
app/src/features/game-detail/GameDetailPage.test.tsx
app/src/features/game-detail/index.ts

app/src/features/home/GameCard.tsx
app/src/features/home/GameCard.test.tsx
app/src/features/home/HomePage.tsx
app/src/features/home/HomePage.test.tsx
app/src/features/home/index.ts

vercel.json                           # SPA rewrite rule for production
```

**Modify:**
```
app/package.json                      # add react-router-dom
app/src/App.tsx                       # BrowserRouter + Routes
app/src/features/upload/UploadPage.tsx # strip own masthead, add onSaved prop
```

---

## Task 1: Install React Router v7

**Files:**
- Modify: `app/package.json`
- Create: `vercel.json`

- [ ] **Step 1: Install react-router-dom**

```bash
cd app && npm install react-router-dom@^7
```

Expected: package.json now lists `"react-router-dom": "^7.x.x"` under `dependencies`.

- [ ] **Step 2: Create vercel.json for SPA routing**

Create `vercel.json` at the repo root (next to `app/`):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This makes `/games/abc123` serve `index.html` instead of 404 on Vercel.

- [ ] **Step 3: Verify build still passes**

```bash
cd app && npm run typecheck && npm run build
```

Expected: both commands exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/package.json app/package-lock.json vercel.json
git commit -m "feat: install react-router-dom v7, add vercel.json SPA rewrite"
```

---

## Task 2: Shared Formatters

**Files:**
- Create: `app/src/shared/formatters.ts`
- Create: `app/src/shared/formatters.test.ts`

- [ ] **Step 1: Write failing tests**

Create `app/src/shared/formatters.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatDuration, formatDate, formatGameTitle, formatKicker } from './formatters';

describe('formatDuration', () => {
  it('formats whole hours and zero minutes', () => {
    expect(formatDuration(14400)).toBe('4h 00m');
  });
  it('pads single-digit minutes', () => {
    expect(formatDuration(3660)).toBe('1h 01m');
  });
  it('handles hours + minutes', () => {
    expect(formatDuration(18720)).toBe('5h 12m');
  });
});

describe('formatDate', () => {
  it('returns a human-readable date string', () => {
    // 2023-11-15T00:00:00Z in UTC — locale formatting varies; just check parts
    const result = formatDate(1700006400000);
    expect(result).toMatch(/2023/);
    expect(result).toMatch(/Nov/);
  });
});

describe('formatGameTitle', () => {
  it('names the winner and VP total', () => {
    expect(formatGameTitle('Sol', { Sol: 10, Hacan: 8 })).toBe(
      'Sol Seizes the Throne at 10 VP'
    );
  });
  it('returns fallback for null winner', () => {
    expect(formatGameTitle(null, {})).toBe('Game Concluded');
  });
  it('falls back to 0 when winner score is missing', () => {
    expect(formatGameTitle('Sol', {})).toBe('Sol Seizes the Throne at 0 VP');
  });
});

describe('formatKicker', () => {
  it('combines date and duration', () => {
    const result = formatKicker(1700006400000, 14400);
    expect(result).toMatch(/2023/);
    expect(result).toContain('4h 00m');
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd app && npm test -- formatters
```

Expected: FAIL — `formatters` module not found.

- [ ] **Step 3: Implement formatters**

Create `app/src/shared/formatters.ts`:

```ts
export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function formatGameTitle(
  winner: string | null,
  finalScores: Record<string, number>
): string {
  if (winner === null) return 'Game Concluded';
  const score = finalScores[winner] ?? 0;
  return `${winner} Seizes the Throne at ${score} VP`;
}

export function formatKicker(playedAt: number, durationSeconds: number): string {
  return `${formatDate(playedAt)} · ${formatDuration(durationSeconds)}`;
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd app && npm test -- formatters
```

Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/shared/formatters.ts app/src/shared/formatters.test.ts
git commit -m "feat: add shared formatter utilities (formatDate, formatDuration, formatGameTitle)"
```

---

## Task 3: Label + Rule Primitives

**Files:**
- Create: `app/src/shared/Label.tsx`, `app/src/shared/Label.test.tsx`
- Create: `app/src/shared/Rule.tsx`, `app/src/shared/Rule.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `app/src/shared/Label.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Label } from './Label';

it('renders children', () => {
  render(<Label>Round</Label>);
  expect(screen.getByText('Round')).toBeInTheDocument();
});

it('uses a span element', () => {
  const { container } = render(<Label>VP</Label>);
  expect(container.querySelector('span')).toBeInTheDocument();
});
```

Create `app/src/shared/Rule.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { Rule } from './Rule';

it('renders an hr element', () => {
  const { container } = render(<Rule />);
  expect(container.querySelector('hr')).toBeInTheDocument();
});

it('applies thin border by default', () => {
  const { container } = render(<Rule />);
  const hr = container.querySelector('hr') as HTMLElement;
  expect(hr.style.borderTop).toBe('1px solid var(--rule)');
});

it('applies thick border', () => {
  const { container } = render(<Rule weight="thick" />);
  const hr = container.querySelector('hr') as HTMLElement;
  expect(hr.style.borderTop).toBe('2px solid var(--rule)');
});

it('applies double border', () => {
  const { container } = render(<Rule weight="double" />);
  const hr = container.querySelector('hr') as HTMLElement;
  expect(hr.style.borderTop).toContain('double');
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd app && npm test -- "Label|Rule"
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement Label**

Create `app/src/shared/Label.tsx`:

```tsx
import type { ReactNode } from 'react';

interface LabelProps {
  children: ReactNode;
}

export function Label({ children }: LabelProps) {
  return (
    <span
      className="font-mono uppercase tracking-widest text-ink-3"
      style={{ fontSize: '9px' }}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Implement Rule**

Create `app/src/shared/Rule.tsx`:

```tsx
interface RuleProps {
  weight?: 'thin' | 'thick' | 'double';
}

export function Rule({ weight = 'thin' }: RuleProps) {
  const borderTop =
    weight === 'double'
      ? '3px double var(--rule)'
      : weight === 'thick'
        ? '2px solid var(--rule)'
        : '1px solid var(--rule)';

  return <hr style={{ border: 'none', margin: 0, borderTop }} />;
}
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
cd app && npm test -- "Label|Rule"
```

Expected: PASS — 6 tests.

- [ ] **Step 6: Commit**

```bash
git add app/src/shared/Label.tsx app/src/shared/Label.test.tsx \
        app/src/shared/Rule.tsx app/src/shared/Rule.test.tsx
git commit -m "feat: add Label and Rule shared primitives"
```

---

## Task 4: Mast Primitive

**Files:**
- Create: `app/src/shared/Mast.tsx`, `app/src/shared/Mast.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `app/src/shared/Mast.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Mast } from './Mast';

it('renders the title as an h1', () => {
  render(<Mast title="Hall of Records" subtitle="TI4 · Archive" />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hall of Records');
});

it('renders the subtitle', () => {
  render(<Mast title="Hall of Records" subtitle="TI4 · Archive" />);
  expect(screen.getByText('TI4 · Archive')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd app && npm test -- Mast
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement Mast**

Create `app/src/shared/Mast.tsx`:

```tsx
interface MastProps {
  title: string;
  subtitle: string;
}

export function Mast({ title, subtitle }: MastProps) {
  return (
    <div
      style={{
        borderTop: '3px double var(--rule)',
        borderBottom: '3px double var(--rule)',
        padding: '10px 0',
        marginBottom: '16px',
      }}
    >
      <h1
        className="font-display font-extrabold italic text-ink"
        style={{ fontSize: '28px', lineHeight: 1.05, margin: 0 }}
      >
        {title}
      </h1>
      <p
        className="font-mono text-ink-3"
        style={{
          fontSize: '9px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginTop: '3px',
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd app && npm test -- Mast
```

Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/shared/Mast.tsx app/src/shared/Mast.test.tsx
git commit -m "feat: add Mast shared primitive"
```

---

## Task 5: Kicker Primitive

**Files:**
- Create: `app/src/shared/Kicker.tsx`, `app/src/shared/Kicker.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `app/src/shared/Kicker.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Kicker } from './Kicker';

it('renders the kicker text', () => {
  render(<Kicker text="VP Race" />);
  expect(screen.getByText('VP Race')).toBeInTheDocument();
});

it('renders headline children when provided', () => {
  render(<Kicker text="Nov 15, 2023">Sol Seizes the Throne</Kicker>);
  expect(screen.getByText('Sol Seizes the Throne')).toBeInTheDocument();
});

it('renders without children', () => {
  const { container } = render(<Kicker text="Label only" />);
  // Only the label span — no headline div
  expect(container.querySelectorAll('div').length).toBe(1); // outer wrapper only
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd app && npm test -- Kicker
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement Kicker**

Create `app/src/shared/Kicker.tsx`:

```tsx
import type { ReactNode } from 'react';

interface KickerProps {
  text: string;
  children?: ReactNode;
}

export function Kicker({ text, children }: KickerProps) {
  return (
    <div>
      <span
        className="font-mono text-accent"
        style={{
          fontSize: '9px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          borderBottom: '1px solid var(--accent)',
          paddingBottom: '1px',
          display: 'inline-block',
        }}
      >
        {text}
      </span>
      {children !== undefined && (
        <div
          className="font-display font-extrabold italic text-ink"
          style={{ fontSize: '20px', lineHeight: 1.1, marginTop: '4px' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd app && npm test -- Kicker
```

Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/shared/Kicker.tsx app/src/shared/Kicker.test.tsx
git commit -m "feat: add Kicker shared primitive"
```

---

## Task 6: FactionChip Primitive + Shared Barrel

**Files:**
- Create: `app/src/shared/FactionChip.tsx`, `app/src/shared/FactionChip.test.tsx`
- Create: `app/src/shared/index.ts`

- [ ] **Step 1: Write failing tests**

Create `app/src/shared/FactionChip.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { FactionChip } from './FactionChip';

it('renders faction name', () => {
  const { container } = render(
    <FactionChip factionId="Sol" color="#4477bb" />
  );
  expect(container.textContent).toContain('Sol');
});

it('renders score when provided', () => {
  const { container } = render(
    <FactionChip factionId="Hacan" color="#ddaa22" score={8} />
  );
  expect(container.textContent).toContain('8');
});

it('shows ✦ indicator for winner', () => {
  const { container } = render(
    <FactionChip factionId="Sol" color="#4477bb" score={10} winner />
  );
  expect(container.textContent).toContain('✦');
});

it('does not show ✦ for non-winner', () => {
  const { container } = render(
    <FactionChip factionId="Sol" color="#4477bb" score={10} />
  );
  expect(container.textContent).not.toContain('✦');
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd app && npm test -- FactionChip
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement FactionChip**

Create `app/src/shared/FactionChip.tsx`:

```tsx
interface FactionChipProps {
  factionId: string;
  color: string;
  score?: number;
  winner?: boolean;
}

export function FactionChip({
  factionId,
  color,
  score,
  winner = false,
}: FactionChipProps) {
  return (
    <span
      className="font-mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '10px',
        border: `1px solid ${winner ? 'var(--accent)' : '#ccc'}`,
        padding: '2px 6px',
        margin: '2px',
        color: winner ? 'var(--accent)' : 'var(--ink)',
        fontWeight: winner ? 600 : 400,
        background: 'var(--paper)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      {factionId}
      {score !== undefined && (
        <>{winner ? ` ✦${score}` : ` ${score}`}</>
      )}
    </span>
  );
}
```

- [ ] **Step 4: Create shared/index.ts barrel**

Create `app/src/shared/index.ts`:

```ts
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

- [ ] **Step 5: Run tests — confirm they pass**

```bash
cd app && npm test -- FactionChip
```

Expected: PASS — 4 tests.

- [ ] **Step 6: Commit**

```bash
git add app/src/shared/FactionChip.tsx app/src/shared/FactionChip.test.tsx \
        app/src/shared/index.ts
git commit -m "feat: add FactionChip primitive and shared/index.ts barrel"
```

---

## Task 7: GameContext

**Files:**
- Create: `app/src/features/game-detail/GameContext.tsx`

No direct tests — the context is tested through `GameDetailPage` in Task 11.

- [ ] **Step 1: Create GameContext**

Create `app/src/features/game-detail/GameContext.tsx`:

```tsx
import { createContext, useContext } from 'react';
import type { ParsedGame } from '../../lib/parser/types';

export interface GameContextValue {
  game: ParsedGame | null;
  loading: boolean;
  error: string | null;
}

export const GameContext = createContext<GameContextValue>({
  game: null,
  loading: true,
  error: null,
});

export function useGame(): GameContextValue {
  return useContext(GameContext);
}
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
cd app && npm run typecheck
```

Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add app/src/features/game-detail/GameContext.tsx
git commit -m "feat: add GameContext and useGame hook for game-detail feature"
```

---

## Task 8: Section Placeholder Stubs

**Files:**
- Create: `app/src/features/game-detail/VpRaceSection.tsx`
- Create: `app/src/features/game-detail/TimelineSection.tsx`
- Create: `app/src/features/game-detail/DashboardSection.tsx`
- Create: `app/src/features/game-detail/PlanetsSection.tsx`
- Create: `app/src/features/game-detail/sections.test.tsx`

Each section needs a stable `id` and `data-section` attribute so `ScrollBody`'s IntersectionObserver can target it.

- [ ] **Step 1: Write failing tests**

Create `app/src/features/game-detail/sections.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { VpRaceSection } from './VpRaceSection';
import { TimelineSection } from './TimelineSection';
import { DashboardSection } from './DashboardSection';
import { PlanetsSection } from './PlanetsSection';

const cases = [
  { Component: VpRaceSection, id: 'vp-race' },
  { Component: TimelineSection, id: 'timeline' },
  { Component: DashboardSection, id: 'dashboard' },
  { Component: PlanetsSection, id: 'planets' },
] as const;

cases.forEach(({ Component, id }) => {
  describe(id, () => {
    it('has the correct id for scroll targeting', () => {
      render(<Component />);
      expect(document.getElementById(id)).toBeInTheDocument();
    });

    it('has a data-section attribute matching its id', () => {
      render(<Component />);
      expect(document.getElementById(id)).toHaveAttribute('data-section', id);
    });
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd app && npm test -- sections
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement VpRaceSection**

Create `app/src/features/game-detail/VpRaceSection.tsx`:

```tsx
import { Kicker } from '../../shared';

export function VpRaceSection() {
  return (
    <section
      id="vp-race"
      data-section="vp-race"
      style={{ padding: '14px 16px', borderBottom: '1px solid #ddd' }}
    >
      <Kicker text="VP Race">Victory Point Race</Kicker>
      <div
        style={{
          marginTop: '12px',
          border: '1px dashed var(--ink-4)',
          padding: '32px 16px',
          textAlign: 'center',
        }}
      >
        <span
          className="font-mono text-ink-4"
          style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
        >
          Slope chart — Phase 2b
        </span>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Implement TimelineSection**

Create `app/src/features/game-detail/TimelineSection.tsx`:

```tsx
import { Kicker } from '../../shared';

export function TimelineSection() {
  return (
    <section
      id="timeline"
      data-section="timeline"
      style={{ padding: '14px 16px', borderBottom: '1px solid #ddd' }}
    >
      <Kicker text="Timeline">Game Timeline</Kicker>
      <div
        style={{
          marginTop: '12px',
          border: '1px dashed var(--ink-4)',
          padding: '32px 16px',
          textAlign: 'center',
        }}
      >
        <span
          className="font-mono text-ink-4"
          style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
        >
          Action feed — Phase 2c
        </span>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Implement DashboardSection**

Create `app/src/features/game-detail/DashboardSection.tsx`:

```tsx
import { Kicker } from '../../shared';

export function DashboardSection() {
  return (
    <section
      id="dashboard"
      data-section="dashboard"
      style={{ padding: '14px 16px', borderBottom: '1px solid #ddd' }}
    >
      <Kicker text="Dashboard">Faction Dashboard</Kicker>
      <div
        style={{
          marginTop: '12px',
          border: '1px dashed var(--ink-4)',
          padding: '32px 16px',
          textAlign: 'center',
        }}
      >
        <span
          className="font-mono text-ink-4"
          style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
        >
          Faction dossier — Phase 2c
        </span>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Implement PlanetsSection**

Create `app/src/features/game-detail/PlanetsSection.tsx`:

```tsx
import { Kicker } from '../../shared';

export function PlanetsSection() {
  return (
    <section
      id="planets"
      data-section="planets"
      style={{ padding: '14px 16px' }}
    >
      <Kicker text="Planets">Planet Ledger</Kicker>
      <div
        style={{
          marginTop: '12px',
          border: '1px dashed var(--ink-4)',
          padding: '32px 16px',
          textAlign: 'center',
        }}
      >
        <span
          className="font-mono text-ink-4"
          style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
        >
          Planet ledger — Phase 2c
        </span>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Run tests — confirm they pass**

```bash
cd app && npm test -- sections
```

Expected: PASS — 8 tests.

- [ ] **Step 8: Commit**

```bash
git add app/src/features/game-detail/VpRaceSection.tsx \
        app/src/features/game-detail/TimelineSection.tsx \
        app/src/features/game-detail/DashboardSection.tsx \
        app/src/features/game-detail/PlanetsSection.tsx \
        app/src/features/game-detail/sections.test.tsx
git commit -m "feat: add four section placeholder stubs for game detail page"
```

---

## Task 9: FrozenHeader

**Files:**
- Create: `app/src/features/game-detail/FrozenHeader.tsx`
- Create: `app/src/features/game-detail/FrozenHeader.test.tsx`

`FrozenHeader` reads from `GameContext` (game data) and receives `activeSection` as a prop (managed by `GameDetailPage`). Nav buttons call `scrollIntoView` on the section elements by id.

- [ ] **Step 1: Write failing tests**

Create `app/src/features/game-detail/FrozenHeader.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { GameContext } from './GameContext';
import { FrozenHeader } from './FrozenHeader';
import type { ParsedGame } from '../../lib/parser/types';

const mockGame = {
  gameId: 'test-1',
  playedAt: 1700006400000,
  durationSeconds: 14400,
  factions: [
    {
      factionId: 'Sol',
      color: '#4477bb',
      playerName: 'Alice',
      mapPosition: 0,
      startingTechs: [],
      startingPlanets: [],
    },
    {
      factionId: 'Hacan',
      color: '#ddaa22',
      playerName: 'Bob',
      mapPosition: 1,
      startingTechs: [],
      startingPlanets: [],
    },
  ],
  winner: 'Sol',
  finalScores: { Sol: 10, Hacan: 8 },
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
  options: {},
  initialSpeaker: 'Sol',
  timers: { game: 0, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
  warnings: [],
} as unknown as ParsedGame;

function renderHeader(activeSection = 'vp-race') {
  return render(
    <MemoryRouter>
      <GameContext.Provider value={{ game: mockGame, loading: false, error: null }}>
        <FrozenHeader activeSection={activeSection} />
      </GameContext.Provider>
    </MemoryRouter>
  );
}

it('shows the game title', () => {
  renderHeader();
  expect(screen.getByText(/Sol Seizes the Throne/)).toBeInTheDocument();
});

it('shows faction chips for all factions', () => {
  renderHeader();
  expect(screen.getByText(/Sol/)).toBeInTheDocument();
  expect(screen.getByText(/Hacan/)).toBeInTheDocument();
});

it('renders all four nav buttons', () => {
  renderHeader();
  expect(screen.getByRole('button', { name: /VP Race/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Timeline/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Planets/i })).toBeInTheDocument();
});

it('highlights the active section nav button with heavier font weight', () => {
  renderHeader('timeline');
  const active = screen.getByRole('button', { name: /Timeline/i }) as HTMLElement;
  const inactive = screen.getByRole('button', { name: /VP Race/i }) as HTMLElement;
  expect(active.style.fontWeight).toBe('600');
  expect(inactive.style.fontWeight).toBe('400');
});

it('renders a back button', () => {
  renderHeader();
  expect(screen.getByRole('button', { name: /Archive/i })).toBeInTheDocument();
});

it('returns null when game is null', () => {
  const { container } = render(
    <MemoryRouter>
      <GameContext.Provider value={{ game: null, loading: true, error: null }}>
        <FrozenHeader activeSection="vp-race" />
      </GameContext.Provider>
    </MemoryRouter>
  );
  expect(container.firstChild).toBeNull();
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd app && npm test -- FrozenHeader
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement FrozenHeader**

Create `app/src/features/game-detail/FrozenHeader.tsx`:

```tsx
import { useNavigate } from 'react-router-dom';
import { Kicker, FactionChip, Rule } from '../../shared';
import { formatKicker, formatGameTitle } from '../../shared';
import { useGame } from './GameContext';

const SECTIONS = [
  { id: 'vp-race', label: 'VP Race' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'planets', label: 'Planets' },
] as const;

interface FrozenHeaderProps {
  activeSection: string;
}

export function FrozenHeader({ activeSection }: FrozenHeaderProps) {
  const navigate = useNavigate();
  const { game } = useGame();

  if (game === null) return null;

  function scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div
      style={{
        background: 'var(--paper)',
        borderBottom: '2px solid var(--rule)',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Back link */}
      <div style={{ padding: '10px 16px 4px' }}>
        <button
          type="button"
          onClick={() => { navigate(-1); }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--ink-3)',
            padding: 0,
          }}
        >
          ← Archive
        </button>
      </div>

      {/* Masthead */}
      <div style={{ padding: '0 16px 8px' }}>
        <Rule weight="double" />
        <div style={{ paddingTop: '8px' }}>
          <Kicker text={formatKicker(game.playedAt, game.durationSeconds)}>
            {formatGameTitle(game.winner, game.finalScores)}
          </Kicker>
          <div style={{ marginTop: '6px' }}>
            {game.factions.map((f) => (
              <FactionChip
                key={f.factionId}
                factionId={f.factionId}
                color={f.color}
                score={game.finalScores[f.factionId]}
                winner={f.factionId === game.winner}
              />
            ))}
          </div>
        </div>
        <div style={{ marginTop: '8px' }}>
          <Rule weight="double" />
        </div>
      </div>

      {/* Nav bar */}
      <nav style={{ display: 'flex', overflowX: 'auto', padding: '0 12px' }}>
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => { scrollTo(id); }}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '7px 12px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              color: activeSection === id ? 'var(--ink)' : 'var(--ink-3)',
              borderBottom:
                activeSection === id
                  ? '2px solid var(--ink)'
                  : '2px solid transparent',
              fontWeight: activeSection === id ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd app && npm test -- FrozenHeader
```

Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/features/game-detail/FrozenHeader.tsx \
        app/src/features/game-detail/FrozenHeader.test.tsx
git commit -m "feat: add FrozenHeader with frozen masthead and scroll-to-section nav"
```

---

## Task 10: ScrollBody

**Files:**
- Create: `app/src/features/game-detail/ScrollBody.tsx`
- Create: `app/src/features/game-detail/ScrollBody.test.tsx`

`ScrollBody` renders the four section stubs in a scrollable container. It sets up one `IntersectionObserver` per section on mount to track which section is most visible and calls `onSectionChange` when one enters the viewport at ≥40% threshold.

- [ ] **Step 1: Write failing tests**

Create `app/src/features/game-detail/ScrollBody.test.tsx`:

```tsx
import { render, act } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';
import { ScrollBody } from './ScrollBody';

// IntersectionObserver is not implemented in jsdom — stub it.
let observerCallback: IntersectionObserverCallback | null = null;

beforeEach(() => {
  observerCallback = null;
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn().mockImplementation((cb: IntersectionObserverCallback) => {
      observerCallback = cb;
      return { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it('renders all four section stubs', () => {
  render(<ScrollBody onSectionChange={vi.fn()} />);
  expect(document.getElementById('vp-race')).toBeInTheDocument();
  expect(document.getElementById('timeline')).toBeInTheDocument();
  expect(document.getElementById('dashboard')).toBeInTheDocument();
  expect(document.getElementById('planets')).toBeInTheDocument();
});

it('creates IntersectionObservers on mount', () => {
  render(<ScrollBody onSectionChange={vi.fn()} />);
  expect(IntersectionObserver).toHaveBeenCalledTimes(4);
});

it('calls onSectionChange when a section enters the viewport', () => {
  const onSectionChange = vi.fn();
  render(<ScrollBody onSectionChange={onSectionChange} />);

  // Simulate the observer firing for the timeline section
  act(() => {
    const fakeEntry = {
      isIntersecting: true,
      target: { dataset: { section: 'timeline' } },
    } as unknown as IntersectionObserverEntry;
    observerCallback?.([fakeEntry], {} as IntersectionObserver);
  });

  expect(onSectionChange).toHaveBeenCalledWith('timeline');
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd app && npm test -- ScrollBody
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement ScrollBody**

Create `app/src/features/game-detail/ScrollBody.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { VpRaceSection } from './VpRaceSection';
import { TimelineSection } from './TimelineSection';
import { DashboardSection } from './DashboardSection';
import { PlanetsSection } from './PlanetsSection';

interface ScrollBodyProps {
  onSectionChange: (sectionId: string) => void;
}

const SECTION_IDS = ['vp-race', 'timeline', 'dashboard', 'planets'] as const;

export function ScrollBody({ onSectionChange }: ScrollBodyProps) {
  // Stable ref so the effect closure always calls the latest callback
  // without needing to re-create observers when the parent re-renders.
  const callbackRef = useRef(onSectionChange);
  useEffect(() => {
    callbackRef.current = onSectionChange;
  });

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el === null) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              callbackRef.current(id);
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
  }, []); // run once on mount; cleanup on unmount

  return (
    <div style={{ overflowY: 'scroll', flex: 1 }}>
      <VpRaceSection />
      <TimelineSection />
      <DashboardSection />
      <PlanetsSection />
    </div>
  );
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd app && npm test -- ScrollBody
```

Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/features/game-detail/ScrollBody.tsx \
        app/src/features/game-detail/ScrollBody.test.tsx
git commit -m "feat: add ScrollBody with IntersectionObserver section tracking"
```

---

## Task 11: GameDetailPage

**Files:**
- Create: `app/src/features/game-detail/GameDetailPage.tsx`
- Create: `app/src/features/game-detail/GameDetailPage.test.tsx`
- Create: `app/src/features/game-detail/index.ts`

`GameDetailPage` fetches the game via `loadGame(gameId)`, manages loading/error state, provides `GameContext`, and orchestrates `FrozenHeader` + `ScrollBody`.

- [ ] **Step 1: Write failing tests**

Create `app/src/features/game-detail/GameDetailPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { GameDetailPage } from './GameDetailPage';
import type { ParsedGame } from '../../lib/parser/types';

vi.mock('../../adapters/firestore', () => ({
  loadGame: vi.fn(),
}));

import { loadGame } from '../../adapters/firestore';
const mockLoadGame = loadGame as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const mockGame = {
  gameId: 'test-1',
  playedAt: 1700006400000,
  durationSeconds: 14400,
  factions: [
    {
      factionId: 'Sol',
      color: '#4477bb',
      playerName: 'Alice',
      mapPosition: 0,
      startingTechs: [],
      startingPlanets: [],
    },
  ],
  winner: 'Sol',
  finalScores: { Sol: 10 },
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
  options: {},
  initialSpeaker: 'Sol',
  timers: { game: 0, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
  warnings: [],
} as unknown as ParsedGame;

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/games/test-1']}>
      <Routes>
        <Route path="/games/:gameId" element={<GameDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

it('shows loading state before the game loads', () => {
  mockLoadGame.mockImplementation(() => new Promise(() => {})); // never resolves
  renderPage();
  expect(screen.getByText(/Loading/i)).toBeInTheDocument();
});

it('renders game title after loading', async () => {
  mockLoadGame.mockResolvedValue(mockGame);
  renderPage();
  expect(await screen.findByText(/Sol Seizes the Throne/i)).toBeInTheDocument();
});

it('shows error message when loadGame rejects', async () => {
  mockLoadGame.mockRejectedValue(new Error('Game not found: test-1'));
  renderPage();
  expect(await screen.findByText(/Game not found: test-1/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Back to Archive/i })).toBeInTheDocument();
});

it('calls loadGame with the gameId from the route', async () => {
  mockLoadGame.mockResolvedValue(mockGame);
  renderPage();
  await screen.findByText(/Sol Seizes the Throne/i);
  expect(mockLoadGame).toHaveBeenCalledWith('test-1');
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd app && npm test -- GameDetailPage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement GameDetailPage**

Create `app/src/features/game-detail/GameDetailPage.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadGame } from '../../adapters/firestore';
import type { ParsedGame } from '../../lib/parser/types';
import { GameContext } from './GameContext';
import { FrozenHeader } from './FrozenHeader';
import { ScrollBody } from './ScrollBody';

export function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<ParsedGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('vp-race');

  useEffect(() => {
    if (gameId === undefined) {
      setError('No game ID in URL');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadGame(gameId)
      .then((g) => {
        if (!cancelled) {
          setGame(g);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load game');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  if (loading) {
    return (
      <main
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '48px 16px',
        }}
      >
        <p
          className="font-mono text-ink-3"
          style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
        >
          Loading…
        </p>
      </main>
    );
  }

  if (error !== null) {
    return (
      <main
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '48px 16px',
        }}
      >
        <p className="font-mono text-xs text-accent" style={{ marginBottom: '16px' }}>
          {error}
        </p>
        <button
          type="button"
          onClick={() => { navigate(-1); }}
          className="font-mono text-ink-3"
          style={{
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            textDecoration: 'underline',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ← Back to Archive
        </button>
      </main>
    );
  }

  return (
    <GameContext.Provider value={{ game, loading, error }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: 'var(--paper)',
        }}
      >
        <FrozenHeader activeSection={activeSection} />
        <ScrollBody onSectionChange={setActiveSection} />
      </div>
    </GameContext.Provider>
  );
}
```

- [ ] **Step 4: Create game-detail barrel**

Create `app/src/features/game-detail/index.ts`:

```ts
export { GameDetailPage } from './GameDetailPage';
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
cd app && npm test -- GameDetailPage
```

Expected: PASS — 4 tests.

- [ ] **Step 6: Commit**

```bash
git add app/src/features/game-detail/GameDetailPage.tsx \
        app/src/features/game-detail/GameDetailPage.test.tsx \
        app/src/features/game-detail/index.ts
git commit -m "feat: add GameDetailPage with loading/error states and GameContext"
```

---

## Task 12: GameCard

**Files:**
- Create: `app/src/features/home/GameCard.tsx`
- Create: `app/src/features/home/GameCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `app/src/features/home/GameCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { GameCard } from './GameCard';
import type { ParsedGameSummary } from '../../adapters/firestore';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockSummary: ParsedGameSummary = {
  gameId: 'game-1',
  playedAt: 1700006400000,
  durationSeconds: 14400,
  factions: [
    { factionId: 'Sol', color: '#4477bb', playerName: 'Alice' },
    { factionId: 'Hacan', color: '#ddaa22', playerName: 'Bob' },
  ],
  finalScores: { Sol: 10, Hacan: 8 },
  winner: 'Sol',
};

it('renders the game title', () => {
  render(<MemoryRouter><GameCard game={mockSummary} /></MemoryRouter>);
  expect(screen.getByText(/Sol Seizes the Throne/)).toBeInTheDocument();
});

it('renders faction names', () => {
  render(<MemoryRouter><GameCard game={mockSummary} /></MemoryRouter>);
  expect(screen.getByText(/Sol/)).toBeInTheDocument();
  expect(screen.getByText(/Hacan/)).toBeInTheDocument();
});

it('navigates to /games/:gameId on click', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><GameCard game={mockSummary} /></MemoryRouter>);
  await user.click(screen.getByRole('button'));
  expect(mockNavigate).toHaveBeenCalledWith('/games/game-1');
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd app && npm test -- GameCard
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement GameCard**

Create `app/src/features/home/GameCard.tsx`:

```tsx
import { useNavigate } from 'react-router-dom';
import type { ParsedGameSummary } from '../../adapters/firestore';
import { Kicker, FactionChip, formatGameTitle, formatKicker } from '../../shared';

interface GameCardProps {
  game: ParsedGameSummary;
}

export function GameCard({ game }: GameCardProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => { navigate(`/games/${game.gameId}`); }}
      style={{
        width: '100%',
        textAlign: 'left',
        border: '1px solid #d0cbc5',
        padding: '12px',
        background: 'var(--paper)',
        cursor: 'pointer',
        display: 'block',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper-2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper)';
      }}
    >
      <Kicker text={formatKicker(game.playedAt, game.durationSeconds)}>
        {formatGameTitle(game.winner, game.finalScores)}
      </Kicker>
      <div style={{ marginTop: '8px' }}>
        {game.factions.map((f) => (
          <FactionChip
            key={f.factionId}
            factionId={f.factionId}
            color={f.color}
            score={game.finalScores[f.factionId]}
            winner={f.factionId === game.winner}
          />
        ))}
      </div>
    </button>
  );
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd app && npm test -- GameCard
```

Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/features/home/GameCard.tsx app/src/features/home/GameCard.test.tsx
git commit -m "feat: add GameCard component for archive list"
```

---

## Task 13: Modify UploadPage

**Files:**
- Modify: `app/src/features/upload/UploadPage.tsx`

Strip the hardcoded masthead header and root `<main>` layout (those move to `HomePage`). Add an `onSaved?: () => void` prop so `HomePage` can refresh the game list after a successful upload.

- [ ] **Step 1: Write tests for UploadPage**

Create `app/src/features/upload/UploadPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { UploadPage } from './UploadPage';

vi.mock('../../adapters/firestore', () => ({
  signInAnon: vi.fn().mockResolvedValue('uid-123'),
  saveGame: vi.fn().mockResolvedValue('game-id'),
}));

vi.mock('../../lib/parser/parseGame', () => ({
  parseGame: vi.fn().mockReturnValue({
    gameId: 'game-id',
    playedAt: 1700006400000,
    durationSeconds: 14400,
    factions: [],
    winner: null,
    finalScores: {},
    warnings: [],
  }),
}));

it('renders the drop zone', () => {
  render(<UploadPage />);
  expect(screen.getByText(/Drop JSON export here/i)).toBeInTheDocument();
});

it('does NOT render a Hall of Records heading', () => {
  render(<UploadPage />);
  expect(screen.queryByText(/Hall of Records/i)).not.toBeInTheDocument();
});

it('calls onSaved after a successful upload and save', async () => {
  const user = userEvent.setup();
  const onSaved = vi.fn();
  render(<UploadPage onSaved={onSaved} />);

  const file = new File(['{}'], 'game.json', { type: 'application/json' });
  const input = screen.getByTestId('file-input');
  await user.upload(input, file);

  // Click save
  const saveBtn = await screen.findByRole('button', { name: /Save to Records/i });
  await user.click(saveBtn);

  await screen.findByText(/Saved to the Archive/i);
  expect(onSaved).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run tests — confirm the "no Hall of Records" test fails and onSaved test will fail**

```bash
cd app && npm test -- UploadPage
```

Expected: "does NOT render Hall of Records" FAIL (current UploadPage still has the masthead).

- [ ] **Step 3: Modify UploadPage**

Replace `app/src/features/upload/UploadPage.tsx` with:

```tsx
// src/features/upload/UploadPage.tsx
import { useState } from 'react';
import type { ParsedGame } from '../../lib/parser/types';
import { parseGame } from '../../lib/parser/parseGame';
import { signInAnon, saveGame } from '../../adapters/firestore';
import { DropZone } from './DropZone';
import { GamePreview } from './GamePreview';

type Status = 'idle' | 'parsing' | 'preview' | 'saving' | 'saved' | 'error';

interface UploadPageProps {
  onSaved?: () => void;
}

export function UploadPage({ onSaved }: UploadPageProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [game, setGame] = useState<ParsedGame | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File): Promise<void> {
    setStatus('parsing');
    setError(null);
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
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
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
      setStatus('error');
    }
  }

  return (
    <div>
      {(status === 'idle' || status === 'parsing' || status === 'error') && (
        <div className="space-y-4">
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
        </div>
      )}

      {(status === 'preview' || status === 'saving') && game !== null && (
        <div className="space-y-4">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
            Press Check
          </h2>
          <GamePreview
            game={game}
            onSave={() => { void handleSave(); }}
            saving={status === 'saving'}
          />
        </div>
      )}

      {status === 'saved' && (
        <div className="space-y-4">
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
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd app && npm test -- UploadPage
```

Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/features/upload/UploadPage.tsx \
        app/src/features/upload/UploadPage.test.tsx
git commit -m "feat: strip UploadPage masthead, add onSaved callback prop"
```

---

## Task 14: HomePage

**Files:**
- Create: `app/src/features/home/HomePage.tsx`
- Create: `app/src/features/home/HomePage.test.tsx`
- Create: `app/src/features/home/index.ts`

`HomePage` renders the `Mast`, then the `UploadPage` (for uploads), then a game archive list populated from `listGames()`. Re-fetches the list after a successful save.

- [ ] **Step 1: Write failing tests**

Create `app/src/features/home/HomePage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import type { ParsedGameSummary } from '../../adapters/firestore';

vi.mock('../../adapters/firestore', () => ({
  listGames: vi.fn(),
  signInAnon: vi.fn().mockResolvedValue('uid'),
  saveGame: vi.fn().mockResolvedValue('id'),
}));

vi.mock('../../lib/parser/parseGame', () => ({
  parseGame: vi.fn(),
}));

import { listGames } from '../../adapters/firestore';
const mockListGames = listGames as ReturnType<typeof vi.fn>;

const mockSummaries: ParsedGameSummary[] = [
  {
    gameId: 'game-1',
    playedAt: 1700006400000,
    durationSeconds: 14400,
    factions: [{ factionId: 'Sol', color: '#4477bb', playerName: 'Alice' }],
    finalScores: { Sol: 10 },
    winner: 'Sol',
  },
];

beforeEach(() => {
  mockListGames.mockResolvedValue(mockSummaries);
});

it('renders the Hall of Records masthead', async () => {
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
    'Hall of Records'
  );
});

it('shows loading state initially', () => {
  mockListGames.mockImplementation(() => new Promise(() => {}));
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  expect(screen.getByText(/Loading/i)).toBeInTheDocument();
});

it('renders game cards after loading', async () => {
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  expect(await screen.findByText(/Sol Seizes the Throne/)).toBeInTheDocument();
});

it('shows empty state when no games in archive', async () => {
  mockListGames.mockResolvedValue([]);
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  expect(await screen.findByText(/No games yet/i)).toBeInTheDocument();
});

it('shows error state when listGames rejects', async () => {
  mockListGames.mockRejectedValue(new Error('Firestore offline'));
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  expect(await screen.findByText(/Firestore offline/i)).toBeInTheDocument();
});

it('shows archive count in label', async () => {
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  expect(await screen.findByText(/Archive — 1 game/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd app && npm test -- HomePage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement HomePage**

Create `app/src/features/home/HomePage.tsx`:

```tsx
import { useState, useEffect, useCallback } from 'react';
import { listGames } from '../../adapters/firestore';
import type { ParsedGameSummary } from '../../adapters/firestore';
import { Mast, Rule, Label } from '../../shared';
import { UploadPage } from '../upload';
import { GameCard } from './GameCard';

export function HomePage() {
  const [games, setGames] = useState<ParsedGameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listGames();
      setGames(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load archive');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchGames();
  }, [fetchGames]);

  return (
    <main
      style={{
        maxWidth: '640px',
        margin: '0 auto',
        padding: '48px 16px',
      }}
    >
      <Mast
        title="Hall of Records"
        subtitle="Twilight Imperium IV · Game Archive"
      />

      {/* Upload section */}
      <section style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '8px' }}>
          <Label>File Dispatch</Label>
        </div>
        <UploadPage onSaved={() => { void fetchGames(); }} />
      </section>

      <Rule weight="thick" />

      {/* Archive section */}
      <section style={{ marginTop: '24px' }}>
        <div style={{ marginBottom: '12px' }}>
          <Label>
            {loading
              ? 'Archive'
              : `Archive — ${games.length} game${games.length !== 1 ? 's' : ''}`}
          </Label>
        </div>

        {loading && (
          <p
            className="font-mono text-ink-3"
            style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            Loading…
          </p>
        )}

        {!loading && error !== null && (
          <p className="font-mono text-xs text-accent">{error}</p>
        )}

        {!loading && error === null && games.length === 0 && (
          <p className="font-mono text-xs text-ink-3">
            No games yet — upload one above.
          </p>
        )}

        {!loading && error === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {games.map((game) => (
              <GameCard key={game.gameId} game={game} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Create home/index.ts barrel**

Create `app/src/features/home/index.ts`:

```ts
export { HomePage } from './HomePage';
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
cd app && npm test -- HomePage
```

Expected: PASS — 6 tests.

- [ ] **Step 6: Commit**

```bash
git add app/src/features/home/HomePage.tsx \
        app/src/features/home/HomePage.test.tsx \
        app/src/features/home/index.ts
git commit -m "feat: add HomePage with archive list and upload integration"
```

---

## Task 15: Wire Up Routing in App.tsx

**Files:**
- Modify: `app/src/App.tsx`

Replace the direct `<UploadPage />` render with `<BrowserRouter>` + `<Routes>`.

- [ ] **Step 1: Write failing test**

Create `app/src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

vi.mock('./adapters/firestore', () => ({
  listGames: vi.fn().mockResolvedValue([]),
  loadGame: vi.fn(),
  signInAnon: vi.fn(),
  saveGame: vi.fn(),
}));

vi.mock('./lib/parser/parseGame', () => ({
  parseGame: vi.fn(),
}));

it('renders the home page at /', async () => {
  render(<App />);
  expect(
    await screen.findByRole('heading', { level: 1, name: /Hall of Records/i })
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd app && npm test -- "App.test"
```

Expected: FAIL — App still renders `<UploadPage />` directly, which no longer shows the masthead.

- [ ] **Step 3: Rewrite App.tsx**

Replace `app/src/App.tsx` with:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './features/home';
import { GameDetailPage } from './features/game-detail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/games/:gameId" element={<GameDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
cd app && npm test -- "App.test"
```

Expected: PASS — 1 test.

- [ ] **Step 5: Run full test suite — confirm nothing is broken**

```bash
cd app && npm test
```

Expected: all tests pass. Check that no pre-existing tests regressed.

- [ ] **Step 6: Run typecheck and build**

```bash
cd app && npm run typecheck && npm run build
```

Expected: both exit 0.

- [ ] **Step 7: Commit**

```bash
git add app/src/App.tsx app/src/App.test.tsx
git commit -m "feat: wire up React Router v7 routing in App.tsx (phase 2a complete)"
```

---

## Acceptance Check

After all 15 tasks, verify the following manually in the browser (`npm run dev` from `app/`):

1. `http://localhost:5173/` — shows "Hall of Records" masthead, drop zone, game archive list
2. Upload a real JSON export — list refreshes automatically, new game card appears
3. Click a game card — navigates to `/games/:gameId` with frozen header + four scrollable sections
4. Scroll down the game detail page — nav button highlights update as sections enter view
5. Click a nav button — page smooth-scrolls to that section
6. Click "← Archive" — navigates back to home
7. Navigate directly to `http://localhost:5173/games/nonexistent` — error state with "← Back to Archive" button appears
