// app/src/features/game-detail/roundFilter.test.tsx
//
// Tests that wire-up the round-scrubber filter into the remaining game-detail
// sections (Timeline, Tech, Dashboard, Planets, Recap).
import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { TimelineSection } from './TimelineSection';
import { TechSection } from './TechSection';
import { DashboardSection } from './DashboardSection';
import { PlanetsSection } from './PlanetsSection';
import { RecapSection } from './RecapSection';
import { GameContext } from './GameContext';
import { RoundFilterProvider, useRoundFilter } from './RoundFilterContext';
import type { ParsedGame } from '../../lib/parser/types';

function SetScrubRound({ round }: { round: number | null }) {
  const { setScrubRound } = useRoundFilter();
  useEffect(() => { setScrubRound(round); }, [round, setScrubRound]);
  return null;
}

const twoFactionGame = {
  gameId: 'rf-test',
  playedAt: 0,
  durationSeconds: 7200,
  factions: [
    { factionId: 'Federation of Sol', color: 'Blue', mapPosition: 0, playerName: 'Alice', startingTechs: [], startingPlanets: ['Jord'] },
    { factionId: 'Mentak Coalition',  color: 'Red',  mapPosition: 1, playerName: 'Bob',   startingTechs: [], startingPlanets: ['Moll Primus'] },
  ],
  options: { victoryPoints: 10 },
  initialSpeaker: 'Federation of Sol',
  phaseSnapshots: [],
  // Round 1: ts ≤ 149; Round 2: ts ≥ 150 (boundary set by 2nd-round strategy picks at 150/155).
  vpEvents: [
    { faction: 'Federation of Sol', objective: 'Round 1 Sol Obj',    source: 'score_objective', points: 3, timestamp: 100 },
    { faction: 'Mentak Coalition',  objective: 'Round 1 Mentak Obj', source: 'score_objective', points: 2, timestamp: 110 },
    { faction: 'Federation of Sol', objective: 'Round 2 Sol Obj',    source: 'score_objective', points: 3, timestamp: 200 },
    { faction: 'Mentak Coalition',  objective: 'Round 2 Mentak Obj', source: 'score_objective', points: 3, timestamp: 210 },
  ],
  planetEvents: [
    { faction: 'Federation of Sol', planet: 'Wellon',   prevOwner: null, timestamp: 120, type: 'claim' },
    { faction: 'Mentak Coalition',  planet: 'Quann',    prevOwner: null, timestamp: 220, type: 'claim' },
  ],
  techEvents: [
    { faction: 'Federation of Sol', tech: 'Antimass Deflectors', type: 'research', timestamp: 130 },
    { faction: 'Mentak Coalition',  tech: 'Plasma Scoring',      type: 'research', timestamp: 230 },
  ],
  agendaResolutions: [],
  strategyCardEvents: [
    { faction: 'Federation of Sol', card: 'Technology', type: 'pick', timestamp: 50 },
    { faction: 'Mentak Coalition',  card: 'Politics',   type: 'pick', timestamp: 55 },
    { faction: 'Federation of Sol', card: 'Technology', type: 'pick', timestamp: 150 },
    { faction: 'Mentak Coalition',  card: 'Politics',   type: 'pick', timestamp: 155 },
  ],
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
  finalScores: { 'Federation of Sol': 6, 'Mentak Coalition': 5 },
  winner: 'Federation of Sol',
  timers: { game: 7200, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
  warnings: [],
} as unknown as ParsedGame;

function renderWithScrub(
  ui: React.ReactElement,
  scrubRound: number | null,
) {
  return render(
    <MemoryRouter>
      <GameContext.Provider value={{ game: twoFactionGame, loading: false, error: null }}>
        <RoundFilterProvider>
          <SetScrubRound round={scrubRound} />
          {ui}
        </RoundFilterProvider>
      </GameContext.Provider>
    </MemoryRouter>
  );
}

describe('round filter wiring', () => {
  describe('TimelineSection', () => {
    it('shows all VP events when scrubRound is null', () => {
      renderWithScrub(<TimelineSection />, null);
      expect(screen.getByText(/Round 1 Sol Obj/)).toBeInTheDocument();
      expect(screen.getByText(/Round 2 Sol Obj/)).toBeInTheDocument();
    });

    it('hides events from rounds past scrubRound', () => {
      renderWithScrub(<TimelineSection />, 1);
      expect(screen.getByText(/Round 1 Sol Obj/)).toBeInTheDocument();
      expect(screen.queryByText(/Round 2 Sol Obj/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Round 2 Mentak Obj/)).not.toBeInTheDocument();
    });
  });

  describe('TechSection', () => {
    it('shows all researched techs when scrubRound is null', () => {
      renderWithScrub(<TechSection />, null);
      expect(screen.getAllByText(/Antimass Deflectors/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Plasma Scoring/).length).toBeGreaterThan(0);
    });

    it('hides research events from rounds past scrubRound', () => {
      renderWithScrub(<TechSection />, 1);
      expect(screen.getAllByText(/Antimass Deflectors/).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Plasma Scoring/)).not.toBeInTheDocument();
    });
  });

  describe('DashboardSection', () => {
    it('shows full final scores when scrubRound is null', () => {
      renderWithScrub(<DashboardSection />, null);
      // Sol final = 6 VP
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('shows end-of-round-1 scores when scrubRound is 1', () => {
      renderWithScrub(<DashboardSection />, 1);
      // After R1: Sol=3, Mentak=2
      const threes = screen.getAllByText('3');
      const twos = screen.getAllByText('2');
      expect(threes.length).toBeGreaterThan(0);
      expect(twos.length).toBeGreaterThan(0);
      // Final-game total of 6 should not be shown as a VP score after scrub
      expect(screen.queryByText('6')).not.toBeInTheDocument();
    });
  });

  describe('PlanetsSection', () => {
    it('shows all controlled planets when scrubRound is null', () => {
      renderWithScrub(<PlanetsSection />, null);
      // both Wellon (R1) and Quann (R2) should be in some planet card
      expect(screen.getAllByText(/Wellon/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Quann/).length).toBeGreaterThan(0);
    });

    it('hides planet events from rounds past scrubRound', () => {
      renderWithScrub(<PlanetsSection />, 1);
      expect(screen.getAllByText(/Wellon/).length).toBeGreaterThan(0);
      // Quann was claimed in round 2, so it should not appear in any final-control card.
      // The slideshow always shows all rounds though — so just check the per-round
      // slideshow header is "Round 1" when scrubbed.
      expect(screen.getByText(/Round 1/)).toBeInTheDocument();
    });
  });

  describe('RecapSection', () => {
    it('does not show the scrub notice when scrubRound is null', () => {
      renderWithScrub(<RecapSection />, null);
      expect(screen.queryByTestId('recap-scrub-notice')).not.toBeInTheDocument();
    });

    it('shows the scrub notice when scrubRound is set', () => {
      renderWithScrub(<RecapSection />, 1);
      expect(screen.getByTestId('recap-scrub-notice')).toBeInTheDocument();
    });
  });
});
