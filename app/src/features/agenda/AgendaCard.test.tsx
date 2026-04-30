import { render, screen } from '@testing-library/react';
import type { AgendaCrossGameStat } from '../../lib/aggregator/buildAgendaCrossGame';
import { AgendaCard } from './AgendaCard';

const sampleStat: AgendaCrossGameStat = {
  name: 'Mutiny',
  appearances: 2,
  passCount: 1,
  failCount: 1,
  electCount: 0,
  passRate: 0.5,
  avgForVotes: 8,
  avgAgainstVotes: 3,
  vpDeltaByFaction: {},
  roundDistribution: { 2: 2 },
  appearances_list: [
    {
      gameId: 'g1', gameDate: new Date('2025-01-19T12:00:00Z').getTime(),
      gameWinner: 'Hacan', round: 2, indexInRound: 1 as const,
      agenda: 'Mutiny', outcome: 'For', passed: true,
      totalFor: 8, totalAgainst: 3, votes: [], riders: [], vpDeltaByFaction: {},
    },
    {
      gameId: 'g2', gameDate: new Date('2025-01-26T12:00:00Z').getTime(),
      gameWinner: null, round: 2, indexInRound: 1 as const,
      agenda: 'Mutiny', outcome: 'Against', passed: false,
      totalFor: 2, totalAgainst: 7, votes: [], riders: [], vpDeltaByFaction: {},
    },
  ],
};

it('renders agenda name', () => {
  render(<AgendaCard stat={sampleStat} />);
  expect(screen.getAllByText(/Mutiny/)[0]).toBeInTheDocument();
});

it('renders appearance count', () => {
  render(<AgendaCard stat={sampleStat} />);
  expect(screen.getByText(/2 appearances/)).toBeInTheDocument();
});

it('renders pass rate', () => {
  render(<AgendaCard stat={sampleStat} />);
  expect(screen.getByText(/50%/)).toBeInTheDocument();
});

it('renders all appearances', () => {
  render(<AgendaCard stat={sampleStat} />);
  expect(screen.getByText(/Jan 19, 2025/)).toBeInTheDocument();
  expect(screen.getByText(/Jan 26, 2025/)).toBeInTheDocument();
});

it('renders — for null passRate (elect-type agenda)', () => {
  const electStat = { ...sampleStat, passRate: null };
  render(<AgendaCard stat={electStat} />);
  expect(screen.getByText(/— pass rate/)).toBeInTheDocument();
});

it('renders VP net row when vpDeltaByFaction is non-empty', () => {
  const statWithVp = { ...sampleStat, vpDeltaByFaction: { Hacan: 2, 'Sol Federation': -1 } };
  render(<AgendaCard stat={statWithVp} />);
  expect(screen.getByText(/Net VP impact/)).toBeInTheDocument();
  expect(screen.getByText(/\+2/)).toBeInTheDocument();
});

it('does not render VP net row when vpDeltaByFaction is empty', () => {
  render(<AgendaCard stat={sampleStat} />);
  expect(screen.queryByText(/Net VP impact/)).not.toBeInTheDocument();
});
