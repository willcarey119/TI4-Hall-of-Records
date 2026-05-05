import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, beforeEach } from 'vitest';
import { GameCard } from './GameCard';
import type { ParsedGameSummary } from '../../adapters/firestore';

vi.mock('../../adapters/firestore', () => ({
  listGames: vi.fn(),
  saveGame: vi.fn().mockResolvedValue('id'),
  deleteGames: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../adapters/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: null, isAuthorized: false, authLoading: false, signIn: vi.fn(), signOut: vi.fn() })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockNavigate = vi.fn();

beforeEach(() => {
  mockNavigate.mockClear();
});

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
  lastPhase: 'status',
};

it('renders the game title', () => {
  render(<MemoryRouter><GameCard game={mockSummary} /></MemoryRouter>);
  expect(screen.getByText(/Sol Seizes the Throne/)).toBeInTheDocument();
});

it('renders faction names', () => {
  render(<MemoryRouter><GameCard game={mockSummary} /></MemoryRouter>);
  expect(screen.getByText(/Sol ✦/)).toBeInTheDocument();   // winner chip — avoids conflict with title text
  expect(screen.getByText(/Hacan/)).toBeInTheDocument();
});

it('navigates to /games/:gameId on click', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><GameCard game={mockSummary} /></MemoryRouter>);
  await user.click(screen.getByRole('button'));
  expect(mockNavigate).toHaveBeenCalledWith('/games/game-1');
});

// Selection mode
it('renders unselected checkbox indicator when onToggle is provided and selected is false', () => {
  render(<MemoryRouter><GameCard game={mockSummary} selected={false} onToggle={() => {}} /></MemoryRouter>);
  expect(screen.getByText('[ ]')).toBeInTheDocument();
});

it('renders selected checkbox indicator when selected is true', () => {
  render(<MemoryRouter><GameCard game={mockSummary} selected={true} onToggle={() => {}} /></MemoryRouter>);
  expect(screen.getByText('[×]')).toBeInTheDocument();
});

it('calls onToggle on click in selection mode, does not navigate', async () => {
  const user = userEvent.setup();
  const onToggle = vi.fn();
  render(<MemoryRouter><GameCard game={mockSummary} selected={false} onToggle={onToggle} /></MemoryRouter>);
  await user.click(screen.getByRole('button'));
  expect(onToggle).toHaveBeenCalledOnce();
  expect(mockNavigate).not.toHaveBeenCalled();
});

// U7 — ending phase callout
it('shows "Ended: Status" when lastPhase is "status"', () => {
  render(<MemoryRouter><GameCard game={mockSummary} /></MemoryRouter>);
  expect(screen.getByText('Ended: Status')).toBeInTheDocument();
});

it('omits ending phase label when lastPhase is absent', () => {
  const noPhase: ParsedGameSummary = { ...mockSummary, lastPhase: undefined };
  render(<MemoryRouter><GameCard game={noPhase} /></MemoryRouter>);
  expect(screen.queryByText(/Ended:/)).not.toBeInTheDocument();
});

// tile variant
test('tile variant shows VP scores', () => {
  render(<MemoryRouter><GameCard game={mockSummary} variant="tile" /></MemoryRouter>);
  expect(screen.getByText('10')).toBeInTheDocument();
  expect(screen.getByText(/–8/)).toBeInTheDocument();
});

test('tile variant shows faction chips', () => {
  render(<MemoryRouter><GameCard game={mockSummary} variant="tile" /></MemoryRouter>);
  expect(screen.getByText(/Sol/)).toBeInTheDocument();
  expect(screen.getByText(/Hacan/)).toBeInTheDocument();
});

// ladder variant
test('ladder variant ranks factions by VP', () => {
  render(<MemoryRouter><GameCard game={mockSummary} variant="ladder" /></MemoryRouter>);
  const cells = screen.getAllByText(/Sol|Hacan/);
  expect(cells.length).toBeGreaterThanOrEqual(2);
  // Rank numbers present
  expect(screen.getByText('1')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
});

test('ladder variant shows VP scores', () => {
  render(<MemoryRouter><GameCard game={mockSummary} variant="ladder" /></MemoryRouter>);
  expect(screen.getByText('10')).toBeInTheDocument();
  expect(screen.getByText('8')).toBeInTheDocument();
});

// storyline variant
test('storyline variant shows PHOTO FINISH for 1-point spread', () => {
  const tightGame: ParsedGameSummary = {
    ...mockSummary,
    finalScores: { Sol: 10, Hacan: 9 },
  };
  render(<MemoryRouter><GameCard game={tightGame} variant="storyline" /></MemoryRouter>);
  expect(screen.getByText('PHOTO FINISH')).toBeInTheDocument();
});

test('storyline variant shows BLOWOUT for 5+ point spread', () => {
  const blowout: ParsedGameSummary = {
    ...mockSummary,
    finalScores: { Sol: 10, Hacan: 4 },
  };
  render(<MemoryRouter><GameCard game={blowout} variant="storyline" /></MemoryRouter>);
  expect(screen.getByText('BLOWOUT')).toBeInTheDocument();
});

test('storyline variant shows CONTESTED for middle spread', () => {
  const contested: ParsedGameSummary = {
    ...mockSummary,
    finalScores: { Sol: 10, Hacan: 7 },
  };
  render(<MemoryRouter><GameCard game={contested} variant="storyline" /></MemoryRouter>);
  expect(screen.getByText('CONTESTED')).toBeInTheDocument();
});

test('storyline variant shows winner faction name in headline', () => {
  render(<MemoryRouter><GameCard game={mockSummary} variant="storyline" /></MemoryRouter>);
  expect(screen.getByText(/Sol takes the throne/)).toBeInTheDocument();
});

it('maps all phase ids to readable labels', () => {
  const phases: Array<[string, string]> = [
    ['strategy', 'Strategy'],
    ['action', 'Action'],
    ['status', 'Status'],
    ['agenda', 'Agenda'],
  ];
  for (const [id, label] of phases) {
    const { unmount } = render(
      <MemoryRouter><GameCard game={{ ...mockSummary, lastPhase: id }} /></MemoryRouter>
    );
    expect(screen.getByText(`Ended: ${label}`)).toBeInTheDocument();
    unmount();
  }
});
