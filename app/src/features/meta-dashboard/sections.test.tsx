import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FactionSection } from './FactionSection';
import { StrategyCardSection } from './StrategyCardSection';
import { TechSection } from './TechSection';
import { StatsSection } from './StatsSection';
import { PlayerSection } from './PlayerSection';

const cases = [
  { Component: FactionSection,      id: 'factions' },
  { Component: StrategyCardSection, id: 'strategy' },
  { Component: TechSection,         id: 'techs'    },
  { Component: StatsSection,        id: 'stats'    },
  { Component: PlayerSection,       id: 'players'  },
] as const;

cases.forEach(({ Component, id }) => {
  describe(id, () => {
    it('has the correct id for scroll targeting', () => {
      render(<MemoryRouter><Component /></MemoryRouter>);
      expect(document.getElementById(id)).toBeInTheDocument();
    });

    it('has a data-section attribute matching its id', () => {
      render(<MemoryRouter><Component /></MemoryRouter>);
      expect(document.getElementById(id)).toHaveAttribute('data-section', id);
    });
  });
});
