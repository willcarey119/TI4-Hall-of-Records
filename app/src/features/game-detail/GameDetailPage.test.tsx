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
    vi.fn().mockImplementation(function () {
      return { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
    })
  );
});

afterEach(async () => {
  await new Promise((r) => { setTimeout(r, 0); });
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
