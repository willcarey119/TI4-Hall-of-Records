import { useScrollSpy } from '../../shared';
import { RecapSection } from './RecapSection';
import { VpRaceSection } from './VpRaceSection';
import { TimelineSection } from './TimelineSection';
import { DashboardSection } from './DashboardSection';
import { PlanetsSection } from './PlanetsSection';
import { TechSection } from './TechSection';
import { AgendaSection } from './AgendaSection';

interface ScrollBodyProps {
  onSectionChange: (sectionId: string) => void;
}

const SECTION_IDS = ['recap', 'vp-race', 'timeline', 'dashboard', 'planets', 'tech', 'agenda'] as const;

export function ScrollBody({ onSectionChange }: ScrollBodyProps) {
  useScrollSpy(SECTION_IDS, onSectionChange);

  return (
    <div style={{ overflowY: 'scroll', flex: 1 }}>
      <RecapSection />
      <VpRaceSection />
      <TimelineSection />
      <DashboardSection />
      <PlanetsSection />
      <TechSection />
      <AgendaSection />
    </div>
  );
}
