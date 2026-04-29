import { render, screen } from '@testing-library/react';
import { EffectBlock, VoteColumns } from './AgendaPrimitives';

describe('EffectBlock', () => {
  it('renders nothing when entry is null', () => {
    const { container } = render(<EffectBlock entry={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders For/Against effects when elect is null and effects are non-empty', () => {
    render(<EffectBlock entry={{
      type: 'directive', elect: null, expansion: 'base',
      forEffect: 'Top scores +1.', againstEffect: 'Bottom loses 1.',
    }} />);
    expect(screen.getByText(/Top scores \+1\./)).toBeInTheDocument();
    expect(screen.getByText(/Bottom loses 1\./)).toBeInTheDocument();
  });

  it('renders effect text for elect-type entry', () => {
    render(<EffectBlock entry={{
      type: 'directive', elect: 'player', expansion: 'base',
      effect: 'Elected player draws 1 secret objective.',
    }} />);
    expect(screen.getByText(/Elected player draws 1 secret objective\./)).toBeInTheDocument();
  });
});

describe('VoteColumns', () => {
  it('renders For/Against columns for binary agenda', () => {
    render(<VoteColumns agendaEntry={{
      round: 1, indexInRound: 1, agenda: 'Mutiny', entry: null,
      outcome: 'For', passed: true, totalFor: 5, totalAgainst: 3,
      votes: [
        { faction: 'Sol', outcome: 'For', votes: 5 },
        { faction: 'Hacan', outcome: 'Against', votes: 3 },
      ],
      riders: [], timestamp: 0,
    }} />);
    expect(screen.getByText(/For · 5/)).toBeInTheDocument();
    expect(screen.getByText(/Against · 3/)).toBeInTheDocument();
  });

  it('renders candidate columns for elect-type agenda', () => {
    render(<VoteColumns agendaEntry={{
      round: 2, indexInRound: 1, agenda: 'Committee Formation',
      entry: { type: 'law', elect: 'player', expansion: 'base', effect: 'The elected player gains this card.' },
      outcome: 'Sol', passed: true, electedFaction: 'Sol',
      totalFor: 4, totalAgainst: 2,
      votes: [
        { faction: 'Hacan', outcome: 'Sol', votes: 4 },
        { faction: 'Yssaril', outcome: 'Nekro', votes: 2 },
      ],
      riders: [], timestamp: 0,
    }} />);
    expect(screen.getByText(/Sol · 4/)).toBeInTheDocument();
    expect(screen.getByText(/Nekro · 2/)).toBeInTheDocument();
  });
});
