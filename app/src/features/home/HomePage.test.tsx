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
