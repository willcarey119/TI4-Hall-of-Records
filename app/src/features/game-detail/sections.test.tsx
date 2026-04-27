import { render } from '@testing-library/react';
import { VpRaceSection } from './VpRaceSection';
import { TimelineSection } from './TimelineSection';
import { DashboardSection } from './DashboardSection';
import { PlanetsSection } from './PlanetsSection';

const cases = [
  { Component: VpRaceSection, id: 'vp-race' },
  { Component: TimelineSection, id: 'timeline' },
  { Component: DashboardSection, id: 'dashboard' },
  { Component: PlanetsSection, id: 'planets' },
] as const;

cases.forEach(({ Component, id }) => {
  describe(id, () => {
    it('has the correct id for scroll targeting', () => {
      render(<Component />);
      expect(document.getElementById(id)).toBeInTheDocument();
    });

    it('has a data-section attribute matching its id', () => {
      render(<Component />);
      expect(document.getElementById(id)).toHaveAttribute('data-section', id);
    });
  });
});
