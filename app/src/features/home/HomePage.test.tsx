import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import type { ParsedGameSummary } from '../../adapters/firestore';

vi.mock('../../adapters/firestore', () => ({
  listGames: vi.fn(),
  saveGame: vi.fn().mockResolvedValue('id'),
  deleteGames: vi.fn().mockResolvedValue(undefined),
}));

// Render as an authorized archivist so write controls are visible in all tests.
// Tests that need to verify the unauthorized state can override this mock.
vi.mock('../../adapters/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { email: 'willcarey119@gmail.com' },
    isAuthorized: true,
    authLoading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../../lib/parser/parseGame', () => ({
  parseGame: vi.fn(),
}));

import { listGames, deleteGames } from '../../adapters/firestore';
const mockListGames = listGames as ReturnType<typeof vi.fn>;
const mockDeleteGames = deleteGames as ReturnType<typeof vi.fn>;

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

it('renders the welcome blurb', async () => {
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  expect(await screen.findByText(/Hall of Records/i)).toBeInTheDocument();
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
  expect(await screen.findByText(/No games on record/i)).toBeInTheDocument();
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

// Selection / delete flow
it('shows Manage button when games are loaded', async () => {
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  expect(await screen.findByRole('button', { name: /manage/i })).toBeInTheDocument();
});

it('enters selection mode and shows Cancel when Manage is clicked', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  await user.click(await screen.findByRole('button', { name: /manage/i }));
  expect(screen.getByText(/select games to remove/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
});

it('exits selection mode when Cancel is clicked', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  await user.click(await screen.findByRole('button', { name: /manage/i }));
  await user.click(screen.getByRole('button', { name: /cancel/i }));
  expect(screen.getByText(/Archive — 1 game/i)).toBeInTheDocument();
});

it('shows unselected checkbox on game cards in selection mode', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  await user.click(await screen.findByRole('button', { name: /manage/i }));
  expect(screen.getByText('[ ]')).toBeInTheDocument();
});

it('shows Delete button after selecting a game', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  await user.click(await screen.findByRole('button', { name: /manage/i }));
  // Click the game card checkbox (the one with the [ ] indicator)
  await user.click(screen.getByText('[ ]').closest('button')!);
  expect(screen.getByRole('button', { name: /delete 1 game/i })).toBeInTheDocument();
});

it('shows confirmation prompt when Delete is clicked', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  await user.click(await screen.findByRole('button', { name: /manage/i }));
  await user.click(screen.getByText('[ ]').closest('button')!);
  await user.click(screen.getByRole('button', { name: /delete 1 game/i }));
  expect(screen.getByText(/remove 1 game permanently/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
});

it('calls deleteGames and exits select mode on Confirm', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  await user.click(await screen.findByRole('button', { name: /manage/i }));
  await user.click(screen.getByText('[ ]').closest('button')!);
  await user.click(screen.getByRole('button', { name: /delete 1 game/i }));
  await user.click(screen.getByRole('button', { name: /confirm/i }));
  expect(mockDeleteGames).toHaveBeenCalledWith(['game-1']);
  // After deletion the archive label should return (no longer in select mode)
  expect(await screen.findByText(/Archive —/i)).toBeInTheDocument();
});
