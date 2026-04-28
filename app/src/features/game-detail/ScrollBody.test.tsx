import { render, act } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';
import { ScrollBody } from './ScrollBody';
import { GameContext } from './GameContext';
import type { ParsedGame } from '../../lib/parser/types';

const minimalGame = {
  gameId: 'test', playedAt: 0, durationSeconds: 0,
  factions: [], options: {}, initialSpeaker: '',
  phaseSnapshots: [], vpEvents: [], planetEvents: [],
  techEvents: [], agendaResolutions: [], strategyCardEvents: [],
  actionCardEvents: [], componentEvents: [], relicEvents: [],
  leaderEvents: [], objectiveReveals: [], speakerEvents: [],
  attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: [],
  expeditionEvents: [], secondaryEvents: [], actionEvents: [],
  finalScores: {}, winner: null,
  timers: { game: 0, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
  warnings: [],
} as unknown as ParsedGame;

function renderScrollBody(onSectionChange = vi.fn()) {
  return render(
    <GameContext.Provider value={{ game: minimalGame, loading: false, error: null }}>
      <ScrollBody onSectionChange={onSectionChange} />
    </GameContext.Provider>
  );
}

// IntersectionObserver is not implemented in jsdom — stub it.
let observerCallbacks: IntersectionObserverCallback[] = [];

beforeEach(() => {
  observerCallbacks = [];
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn().mockImplementation(function (cb: IntersectionObserverCallback) {
      observerCallbacks.push(cb);
      return { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it('renders all six section stubs', () => {
  renderScrollBody();
  expect(document.getElementById('vp-race')).toBeInTheDocument();
  expect(document.getElementById('timeline')).toBeInTheDocument();
  expect(document.getElementById('dashboard')).toBeInTheDocument();
  expect(document.getElementById('planets')).toBeInTheDocument();
  expect(document.getElementById('tech')).toBeInTheDocument();
  expect(document.getElementById('agenda')).toBeInTheDocument();
});

it('creates IntersectionObservers on mount', () => {
  renderScrollBody();
  expect(IntersectionObserver).toHaveBeenCalledTimes(6);
});

it('calls onSectionChange when a section enters the viewport', () => {
  const onSectionChange = vi.fn();
  renderScrollBody(onSectionChange);

  // Fire the timeline observer (index 1) with an intersecting entry
  act(() => {
    const fakeEntry = {
      isIntersecting: true,
      target: { dataset: { section: 'timeline' } },
    } as unknown as IntersectionObserverEntry;
    observerCallbacks[1]?.([fakeEntry], {} as IntersectionObserver);
  });

  expect(onSectionChange).toHaveBeenCalledWith('timeline');
});
