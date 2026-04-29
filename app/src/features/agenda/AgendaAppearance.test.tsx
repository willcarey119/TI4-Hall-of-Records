import { render, screen } from '@testing-library/react';
import { AgendaAppearance } from './AgendaAppearance';
import type { AgendaAppearance as AgendaAppearanceType } from '../../lib/aggregator/buildAgendaCrossGame';

const sampleAppearance: AgendaAppearanceType = {
  gameId: 'g1',
  gameDate: new Date('2025-01-19T12:00:00Z').getTime(),
  gameWinner: 'Hacan',
  round: 2,
  indexInRound: 1,
  agenda: 'Mutiny',
  outcome: 'For',
  passed: true,
  totalFor: 8,
  totalAgainst: 3,
  votes: [
    { faction: 'Hacan', outcome: 'For', votes: 8 },
    { faction: 'Sol', outcome: 'Against', votes: 3 },
  ],
  riders: [],
  vpDeltaByFaction: {},
};

it('renders game label with date and winner', () => {
  render(<AgendaAppearance appearance={sampleAppearance} />);
  expect(screen.getByText(/Jan 19, 2025/)).toBeInTheDocument();
  expect(screen.getByText(/Winner: Hacan/)).toBeInTheDocument();
});

it('renders round and agenda index', () => {
  render(<AgendaAppearance appearance={sampleAppearance} />);
  expect(screen.getByText(/Round 2/)).toBeInTheDocument();
});

it('renders PASSED badge when passed is true', () => {
  render(<AgendaAppearance appearance={sampleAppearance} />);
  expect(screen.getByText('PASSED')).toBeInTheDocument();
});

it('renders FAILED badge when passed is false', () => {
  render(<AgendaAppearance appearance={{ ...sampleAppearance, passed: false, outcome: 'Against' }} />);
  expect(screen.getByText('FAILED')).toBeInTheDocument();
});

it('renders ELECTED badge when passed is null', () => {
  render(<AgendaAppearance appearance={{ ...sampleAppearance, passed: null, outcome: 'Hacan' }} />);
  expect(screen.getByText('ELECTED')).toBeInTheDocument();
});

it('renders riders section when riders present', () => {
  render(<AgendaAppearance appearance={{
    ...sampleAppearance,
    riders: [{ faction: 'Sol', outcome: 'For', votes: 0 }],
  }} />);
  expect(screen.getByText(/Riders/i)).toBeInTheDocument();
});

it('renders VP impact when vpDeltaByFaction non-empty', () => {
  render(<AgendaAppearance appearance={{
    ...sampleAppearance,
    vpDeltaByFaction: { 'Sol': 1 },
  }} />);
  expect(screen.getByText(/VP impact/i)).toBeInTheDocument();
});
