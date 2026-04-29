import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, beforeEach } from 'vitest';
import { GameCard } from './GameCard';
import type { ParsedGameSummary } from '../../adapters/firestore';

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
