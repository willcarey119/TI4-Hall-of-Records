import { render, screen } from '@testing-library/react';
import { FactionVotingPanel } from './FactionVotingPanel';
import type { AgendaCrossGameSummary } from '../../lib/aggregator/buildAgendaCrossGame';

const emptySummary: AgendaCrossGameSummary = {
  agendas: [],
  totalResolutions: 0,
  overallPassRate: null,
  gamesAnalyzed: 0,
  factionVotingByAgenda: {},
};

it('renders the panel header', () => {
  render(<FactionVotingPanel summary={emptySummary} />);
  expect(screen.getByText(/Faction Voting Patterns/i)).toBeInTheDocument();
});

it('renders no-data message when empty', () => {
  render(<FactionVotingPanel summary={emptySummary} />);
  expect(screen.getByText(/No voting data/i)).toBeInTheDocument();
});

it('renders agenda column headers when data present', () => {
  const summary: AgendaCrossGameSummary = {
    ...emptySummary,
    agendas: [
      {
        name: 'Mutiny',
        appearances: 3,
        passCount: 2,
        failCount: 1,
        electCount: 0,
        passRate: 0.67,
        avgForVotes: null,
        avgAgainstVotes: null,
        vpDeltaByFaction: {},
        roundDistribution: {},
        appearances_list: [],
      },
    ],
    factionVotingByAgenda: {
      Mutiny: {
        agenda: 'Mutiny',
        factions: [
          { factionId: 'Sol', forCount: 2, againstCount: 1, electCount: 0, abstainCount: 0 },
        ],
      },
    },
  };
  render(<FactionVotingPanel summary={summary} />);
  expect(screen.getByText(/Mutiny/)).toBeInTheDocument();
  expect(screen.getByText(/Sol/)).toBeInTheDocument();
  expect(screen.getAllByText(/FOR/)[0]).toBeInTheDocument();
});

it('shows AGN when againstCount dominates', () => {
  const summary: AgendaCrossGameSummary = {
    ...emptySummary,
    agendas: [
      {
        name: 'Nexus',
        appearances: 2,
        passCount: 0,
        failCount: 2,
        electCount: 0,
        passRate: 0,
        avgForVotes: null,
        avgAgainstVotes: null,
        vpDeltaByFaction: {},
        roundDistribution: {},
        appearances_list: [],
      },
    ],
    factionVotingByAgenda: {
      Nexus: {
        agenda: 'Nexus',
        factions: [
          { factionId: 'Hacan', forCount: 0, againstCount: 3, electCount: 0, abstainCount: 0 },
        ],
      },
    },
  };
  render(<FactionVotingPanel summary={summary} />);
  expect(screen.getAllByText(/AGN/)[0]).toBeInTheDocument();
});

it('shows ELC when electCount dominates', () => {
  const summary: AgendaCrossGameSummary = {
    ...emptySummary,
    agendas: [
      {
        name: 'Arbiter',
        appearances: 1,
        passCount: 0,
        failCount: 0,
        electCount: 1,
        passRate: null,
        avgForVotes: null,
        avgAgainstVotes: null,
        vpDeltaByFaction: {},
        roundDistribution: {},
        appearances_list: [],
      },
    ],
    factionVotingByAgenda: {
      Arbiter: {
        agenda: 'Arbiter',
        factions: [
          { factionId: 'Arborec', forCount: 0, againstCount: 0, electCount: 2, abstainCount: 0 },
        ],
      },
    },
  };
  render(<FactionVotingPanel summary={summary} />);
  expect(screen.getAllByText(/ELC/)[0]).toBeInTheDocument();
});

it('shows dash when faction has no votes on an agenda', () => {
  const summary: AgendaCrossGameSummary = {
    ...emptySummary,
    agendas: [
      {
        name: 'Mutiny',
        appearances: 1,
        passCount: 1,
        failCount: 0,
        electCount: 0,
        passRate: 1,
        avgForVotes: null,
        avgAgainstVotes: null,
        vpDeltaByFaction: {},
        roundDistribution: {},
        appearances_list: [],
      },
    ],
    factionVotingByAgenda: {
      Mutiny: {
        agenda: 'Mutiny',
        factions: [
          { factionId: 'Sol', forCount: 0, againstCount: 0, electCount: 0, abstainCount: 0 },
        ],
      },
    },
  };
  render(<FactionVotingPanel summary={summary} />);
  expect(screen.getAllByText('—')[0]).toBeInTheDocument();
});

it('limits columns to topN', () => {
  const makeAgenda = (name: string, n: number) => ({
    name,
    appearances: n,
    passCount: 0,
    failCount: 0,
    electCount: 0,
    passRate: null,
    avgForVotes: null,
    avgAgainstVotes: null,
    vpDeltaByFaction: {} as Record<string, number>,
    roundDistribution: {} as Record<number, number>,
    appearances_list: [] as [],
  });
  const summary: AgendaCrossGameSummary = {
    ...emptySummary,
    agendas: [
      makeAgenda('Agenda One', 10),
      makeAgenda('Agenda Two', 9),
      makeAgenda('Agenda Three', 8),
    ],
    factionVotingByAgenda: {},
  };
  render(<FactionVotingPanel summary={summary} topN={2} />);
  expect(screen.getByText(/Agenda One/)).toBeInTheDocument();
  expect(screen.getByText(/Agenda Two/)).toBeInTheDocument();
  expect(screen.queryByText(/Agenda Three/)).not.toBeInTheDocument();
});

it('renders legend', () => {
  const summary: AgendaCrossGameSummary = {
    ...emptySummary,
    agendas: [
      {
        name: 'Mutiny',
        appearances: 1,
        passCount: 1,
        failCount: 0,
        electCount: 0,
        passRate: 1,
        avgForVotes: null,
        avgAgainstVotes: null,
        vpDeltaByFaction: {},
        roundDistribution: {},
        appearances_list: [],
      },
    ],
    factionVotingByAgenda: {
      Mutiny: {
        agenda: 'Mutiny',
        factions: [
          { factionId: 'Sol', forCount: 2, againstCount: 0, electCount: 0, abstainCount: 0 },
        ],
      },
    },
  };
  render(<FactionVotingPanel summary={summary} />);
  expect(screen.getByText(/voted For/i, { hidden: true })).toBeInTheDocument();
});
