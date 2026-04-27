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
  expect(screen.getByText(/Sol ✦/)).toBeInTheDocument();   // winner chip — avoids conflict with title text
  expect(screen.getByText(/Hacan/)).toBeInTheDocument();
});

it('navigates to /games/:gameId on click', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><GameCard game={mockSummary} /></MemoryRouter>);
  await user.click(screen.getByRole('button'));
  expect(mockNavigate).toHaveBeenCalledWith('/games/game-1');
});
