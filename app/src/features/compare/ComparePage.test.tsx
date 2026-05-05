import { render, screen } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { ParsedGame } from '../../lib/parser/types';
import { ComparePage } from './ComparePage';

vi.mock('../../adapters/firestore', () => ({
  loadGame: vi.fn(),
}));

import { loadGame } from '../../adapters/firestore';
const mockLoadGame = loadGame as ReturnType<typeof vi.fn>;

function makeGame(overrides: Partial<ParsedGame> = {}): ParsedGame {
  return {
    gameId: 'g1',
    playedAt: new Date('2026-04-22T12:00:00Z').getTime(),
    durationSeconds: 14400,
    factions: [
      { factionId: 'Sol', playerName: 'Alice', color: '#4477bb', mapPosition: 0, startingTechs: [], startingPlanets: [] },
      { factionId: 'Hacan', playerName: 'Bob', color: '#cc8844', mapPosition: 1, startingTechs: [], startingPlanets: [] },
    ],
    options: {},
    vpThreshold: 10,
    initialSpeaker: 'Sol',
    phaseSnapshots: [
      { round: 1, phase: 'strategy', speaker: 'Sol', strategyCards: {} },
      { round: 5, phase: 'status', speaker: 'Sol', strategyCards: {} },
    ],
    vpEvents: [],
    planetEvents: [
      { faction: 'Sol', planet: 'Jord', prevOwner: null, timestamp: 1, type: 'claim' },
      { faction: 'Hacan', planet: 'Hercant', prevOwner: null, timestamp: 2, type: 'claim' },
    ],
    techEvents: [
      { faction: 'Sol', tech: 'Cruiser II', timestamp: 1, type: 'research' },
      { faction: 'Sol', tech: 'Carrier II', timestamp: 2, type: 'research' },
    ],
    agendaResolutions: [
      { agenda: 'Anti-Intellectual Revolution', outcome: 'Against', round: 2, timestamp: 1, votes: [], riders: [] },
    ],
    strategyCardEvents: [],
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
    finalScores: { Sol: 10, Hacan: 7 },
    winner: 'Sol',
    timers: { game: 14400, factions: {}, secondaries: {}, agendas: { first: 0, second: 0 } },
    warnings: [],
    ...overrides,
  };
}

function renderRoute(idA = 'a1', idB = 'b1') {
  return render(
    <MemoryRouter initialEntries={[`/compare/${idA}/${idB}`]}>
      <Routes>
        <Route path="/compare/:gameA/:gameB" element={<ComparePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockLoadGame.mockReset();
});

it('renders loading state initially', () => {
  mockLoadGame.mockImplementation(() => new Promise(() => {}));
  renderRoute();
  // Mast title still renders alongside skeleton
  expect(screen.getByText('Compared')).toBeInTheDocument();
});

it('renders error state when loading fails', async () => {
  mockLoadGame.mockRejectedValue(new Error('Firestore offline'));
  renderRoute();
  expect(await screen.findByText(/Firestore offline/i)).toBeInTheDocument();
});

it('renders both games winners when both loaded', async () => {
  mockLoadGame
    .mockResolvedValueOnce(makeGame({ gameId: 'a1', winner: 'Sol' }))
    .mockResolvedValueOnce(
      makeGame({
        gameId: 'b1',
        winner: 'Hacan',
        finalScores: { Sol: 6, Hacan: 10 },
      }),
    );
  renderRoute();
  // Each faction may render multiple times (header + chip + comparison rows)
  expect((await screen.findAllByText('Sol')).length).toBeGreaterThan(0);
  expect((await screen.findAllByText('Hacan')).length).toBeGreaterThan(0);
});

it('renders head-to-head comparison rows', async () => {
  mockLoadGame
    .mockResolvedValueOnce(makeGame({ gameId: 'a1' }))
    .mockResolvedValueOnce(makeGame({ gameId: 'b1' }));
  renderRoute();
  expect(await screen.findByText(/Game length \(rounds\)/i)).toBeInTheDocument();
  expect(screen.getByText(/Total VP scored/i)).toBeInTheDocument();
  expect(screen.getByText(/Agendas voted/i)).toBeInTheDocument();
  expect(screen.getByText(/Techs researched/i)).toBeInTheDocument();
  expect(screen.getByText(/Duration \(min\)/i)).toBeInTheDocument();
});

it('shows shared faction rows when factions overlap', async () => {
  mockLoadGame
    .mockResolvedValueOnce(makeGame({ gameId: 'a1' }))
    .mockResolvedValueOnce(makeGame({ gameId: 'b1' }));
  renderRoute();
  // Heading
  expect(await screen.findByText(/Faction-by-faction VP/i)).toBeInTheDocument();
  // Shared faction rows: Sol, Hacan show as metric labels (centered text inside DivergingComparison)
  // Multiple Sol/Hacan elements exist; just confirm at least one of each appears.
  expect(screen.getAllByText('Sol').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Hacan').length).toBeGreaterThan(0);
});

it('shows empty note when no factions overlap', async () => {
  const gameA = makeGame({ gameId: 'a1' });
  const gameB = makeGame({
    gameId: 'b1',
    factions: [
      { factionId: 'Jol-Nar', playerName: 'C', color: '#226699', mapPosition: 0, startingTechs: [], startingPlanets: [] },
      { factionId: "L'tokk Khrask", playerName: 'D', color: '#883322', mapPosition: 1, startingTechs: [], startingPlanets: [] },
    ],
    finalScores: { 'Jol-Nar': 10, "L'tokk Khrask": 6 },
    winner: 'Jol-Nar',
  });
  mockLoadGame.mockResolvedValueOnce(gameA).mockResolvedValueOnce(gameB);
  renderRoute();
  expect(await screen.findByText(/No shared factions between these games/i)).toBeInTheDocument();
});

it('renders the back-to-archive link', async () => {
  mockLoadGame
    .mockResolvedValueOnce(makeGame({ gameId: 'a1' }))
    .mockResolvedValueOnce(makeGame({ gameId: 'b1' }));
  renderRoute();
  const link = await screen.findByRole('link', { name: /Archive/i });
  expect(link).toHaveAttribute('href', '/');
});
