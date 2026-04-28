// app/src/features/game-detail/sections.test.tsx
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VpRaceSection } from './VpRaceSection';
import { TimelineSection } from './TimelineSection';
import { DashboardSection } from './DashboardSection';
import { PlanetsSection } from './PlanetsSection';
import { TechSection } from './TechSection';
import { AgendaSection } from './AgendaSection';
import { GameContext } from './GameContext';
import type { ParsedGame } from '../../lib/parser/types';

const minimalGame = {
  gameId: 'test', playedAt: 0, durationSeconds: 0,
  factions: [], options: {}, initialSpeaker: '',
  phaseSnapshots: [], vpEvents: [], planetEvents: [],
  techEvents: [], agendaResolutions: [], strategyCardEvents: [],
  actionCardEvents: [], componentEvents: [], relicEvents: [],
  leaderEvents: [], objectiveReveals: [], speakerEvents: [],
  attachmentEvents: [], allianceEvents: [], promissoryNoteEvents: [],
  expeditionEvents: [], secondaryEvents: [], actionEvents: [],
  finalScores: {}, winner: null,
  timers: { game: 0, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
  warnings: [],
} as unknown as ParsedGame;

function withGame(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <GameContext.Provider value={{ game: minimalGame, loading: false, error: null }}>
        {ui}
      </GameContext.Provider>
    </MemoryRouter>
  );
}

const cases = [
  { Component: VpRaceSection,    id: 'vp-race',   needsGame: true },
  { Component: TimelineSection,  id: 'timeline',  needsGame: true },
  { Component: DashboardSection, id: 'dashboard', needsGame: true },
  { Component: PlanetsSection,   id: 'planets',   needsGame: true },
  { Component: TechSection,      id: 'tech',      needsGame: true  },
  { Component: AgendaSection,    id: 'agenda',    needsGame: true  },
] as const;

cases.forEach(({ Component, id, needsGame }) => {
  describe(id, () => {
    it('has the correct id for scroll targeting', () => {
      if (needsGame) {
        withGame(<Component />);
      } else {
        render(<Component />);
      }
      expect(document.getElementById(id)).toBeInTheDocument();
    });

    it('has a data-section attribute matching its id', () => {
      if (needsGame) {
        withGame(<Component />);
      } else {
        render(<Component />);
      }
      expect(document.getElementById(id)).toHaveAttribute('data-section', id);
    });
  });
});
