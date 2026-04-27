// src/features/upload/__tests__/GamePreview.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ParsedGame } from '../../../lib/parser/types';
import { GamePreview } from '../GamePreview';

const mockGame: ParsedGame = {
  gameId: 'abc123',
  playedAt: 1700000000000,
  durationSeconds: 14400,
  factions: [
    { factionId: 'Sol', playerName: 'Tim', color: 'Blue', mapPosition: 0, startingTechs: [], startingPlanets: [] },
    { factionId: 'Hacan', playerName: 'Kim', color: 'Yellow', mapPosition: 1, startingTechs: [], startingPlanets: [] },
  ],
  options: {},
  initialSpeaker: 'Sol',
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
  finalScores: { Sol: 10, Hacan: 8 },
  winner: 'Sol',
  timers: {
    game: 14400,
    factions: { Sol: 7200, Hacan: 7200 },
    secondaries: {},
    agendas: { first: 0, second: 0 },
  },
  warnings: [],
};

describe('GamePreview', () => {
  it('shows both faction names', () => {
    render(<GamePreview game={mockGame} onSave={vi.fn()} saving={false} />);
    expect(screen.getByText('Sol')).toBeInTheDocument();
    expect(screen.getByText('Hacan')).toBeInTheDocument();
  });

  it('shows final scores for each faction', () => {
    render(<GamePreview game={mockGame} onSave={vi.fn()} saving={false} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('calls onSave when Save to Records is clicked', async () => {
    const onSave = vi.fn();
    render(<GamePreview game={mockGame} onSave={onSave} saving={false} />);
    await userEvent.click(screen.getByRole('button', { name: /save to records/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('disables the save button and shows Saving… while saving', () => {
    render(<GamePreview game={mockGame} onSave={vi.fn()} saving={true} />);
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('shows warning count and each warning text when warnings are present', () => {
    const gameWithWarnings: ParsedGame = {
      ...mockGame,
      warnings: ['Unknown objective: "Foo" at 1000', 'RESOLVE_AGENDA "Mutiny" may affect VP'],
    };
    render(<GamePreview game={gameWithWarnings} onSave={vi.fn()} saving={false} />);
    expect(screen.getByText(/2 warning/i)).toBeInTheDocument();
    expect(screen.getByText(/Unknown objective: "Foo"/)).toBeInTheDocument();
  });

  it('does not show a warnings section when there are none', () => {
    render(<GamePreview game={mockGame} onSave={vi.fn()} saving={false} />);
    expect(screen.queryByText(/warning/i)).not.toBeInTheDocument();
  });

  it('does not show a winner label when winner is null', () => {
    const noWinner: ParsedGame = { ...mockGame, winner: null };
    render(<GamePreview game={noWinner} onSave={vi.fn()} saving={false} />);
    expect(screen.queryByText(/winner/i)).not.toBeInTheDocument();
  });
});
