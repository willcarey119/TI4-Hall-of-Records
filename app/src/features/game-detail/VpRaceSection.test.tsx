// app/src/features/game-detail/VpRaceSection.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VpRaceSection } from './VpRaceSection';
import { GameContext } from './GameContext';
import type { ParsedGame } from '../../lib/parser/types';

// A minimal game with two factions and two rounds of VP events so the
// chart has enough points to render polylines (needs ≥ 2 points per series).
const twoFactionGame = {
  gameId: 'test-vp',
  playedAt: 0,
  durationSeconds: 7200,
  factions: [
    { factionId: 'Federation of Sol', color: 'Blue', mapPosition: 0, playerName: 'Alice', startingTechs: [], startingPlanets: [] },
    { factionId: 'Mentak Coalition',  color: 'Red',  mapPosition: 1, playerName: 'Bob',   startingTechs: [], startingPlanets: [] },
  ],
  options: { victoryPoints: 10 },
  initialSpeaker: 'Federation of Sol',
  phaseSnapshots: [
    // Two rounds: STATUS_SCORING events give us two ADVANCE_PHASE snapshots
    // (the deriveRoundBoundaries fallback uses strategyCardEvents.length / factions.length)
  ],
  vpEvents: [
    // Round 1: Sol scores 3, Mentak scores 2 (before round-2 strategy pick at timestamp 150)
    { faction: 'Federation of Sol', objective: 'obj-a', source: 'score_objective', points: 3, timestamp: 100 },
    { faction: 'Mentak Coalition',  objective: 'obj-b', source: 'score_objective', points: 2, timestamp: 110 },
    // Round 2: Sol scores 3 more (reaches 6), Mentak scores 3 (reaches 5)
    { faction: 'Federation of Sol', objective: 'obj-c', source: 'score_objective', points: 3, timestamp: 200 },
    { faction: 'Mentak Coalition',  objective: 'obj-d', source: 'score_objective', points: 3, timestamp: 210 },
  ],
  planetEvents: [],
  techEvents: [],
  agendaResolutions: [],
  strategyCardEvents: [
    // 4 'pick' events = 2 rounds * 2 factions → deriveRoundBoundaries returns 2 rounds
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

function withGame(game: ParsedGame | null) {
  return render(
    <MemoryRouter>
      <GameContext.Provider value={{ game, loading: false, error: null }}>
        <VpRaceSection />
      </GameContext.Provider>
    </MemoryRouter>
  );
}

describe('VpRaceSection', () => {
  it('renders one <path> element per faction', () => {
    const { container } = withGame(twoFactionGame);
    const paths = container.querySelectorAll('svg path');
    // Each faction that has ≥2 points gets a path; our two factions both qualify
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });

  it('each faction path d attribute starts with M', () => {
    const { container } = withGame(twoFactionGame);
    const paths = container.querySelectorAll('svg path');
    paths.forEach(path => {
      const d = path.getAttribute('d');
      expect(d).toMatch(/^M/);
    });
  });

  it('renders at least one <circle> terminal dot per faction', () => {
    const { container } = withGame(twoFactionGame);
    const circles = container.querySelectorAll('svg circle');
    // Each faction has one terminal dot (r=3) plus intermediate dots
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the VICTORY threshold line text', () => {
    withGame(twoFactionGame);
    expect(screen.getByText(/VICTORY/)).toBeInTheDocument();
  });

  it('renders nothing when game is null', () => {
    const { container } = withGame(null);
    const section = container.querySelector('[data-section="vp-race"]');
    // Section element is always rendered, but its content should be empty
    expect(section).toBeInTheDocument();
    expect(section?.querySelector('svg')).toBeNull();
  });
});
