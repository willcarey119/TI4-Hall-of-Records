import { render, screen } from '@testing-library/react';
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
  expect(screen.getByText(/Sol ✦/)).toBeInTheDocument();
  expect(screen.getByText(/Hacan/)).toBeInTheDocument();
});

it('renders all seven nav buttons', () => {
  renderHeader();
  expect(screen.getByRole('button', { name: /Recap/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /VP Race/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Timeline/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Planets/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Tech/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Agenda/i })).toBeInTheDocument();
});

it('highlights the active section nav button with heavier font weight', () => {
  renderHeader('timeline');
  const active = screen.getByRole('button', { name: /Timeline/i }) as HTMLElement;
  const inactive = screen.getByRole('button', { name: /VP Race/i }) as HTMLElement;
  expect(active.style.fontWeight).toBe('600');
  expect(inactive.style.fontWeight).toBe('400');
});

it('renders a back link to the archive', () => {
  renderHeader();
  expect(screen.getByRole('link', { name: /Archive/i })).toBeInTheDocument();
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
