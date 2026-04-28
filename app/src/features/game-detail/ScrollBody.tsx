import { useEffect, useRef } from 'react';
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
  // Stable ref so the effect closure always calls the latest callback
  // without needing to re-create observers when the parent re-renders.
  const callbackRef = useRef(onSectionChange);
  useEffect(() => {
    callbackRef.current = onSectionChange;
  });

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el === null) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const sectionId =
                (entry.target as HTMLElement).dataset['section'] ?? id;
              callbackRef.current(sectionId);
            }
          });
        },
        { threshold: 0.4 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((o) => { o.disconnect(); });
    };
  }, []); // run once on mount; cleanup on unmount

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
