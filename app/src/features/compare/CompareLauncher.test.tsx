import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import type { ParsedGameSummary } from '../../adapters/firestore';
import { CompareLauncher } from './CompareLauncher';

const games: ParsedGameSummary[] = [
  {
    gameId: 'g1',
    playedAt: new Date('2026-04-22').getTime(),
    durationSeconds: 14400,
    factions: [{ factionId: 'Sol', color: '#4477bb' }],
    finalScores: { Sol: 10 },
    winner: 'Sol',
  },
  {
    gameId: 'g2',
    playedAt: new Date('2026-04-15').getTime(),
    durationSeconds: 14400,
    factions: [{ factionId: 'Hacan', color: '#cc8844' }],
    finalScores: { Hacan: 10 },
    winner: 'Hacan',
  },
  {
    gameId: 'g3',
    playedAt: new Date('2026-04-08').getTime(),
    durationSeconds: 14400,
    factions: [{ factionId: 'Jol-Nar', color: '#226699' }],
    finalScores: { 'Jol-Nar': 10 },
    winner: 'Jol-Nar',
  },
];

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="location">{loc.pathname}</div>;
}

it('renders two selects with all games as options', () => {
  render(
    <MemoryRouter>
      <CompareLauncher games={games} />
    </MemoryRouter>,
  );
  const selectA = screen.getByLabelText(/Game A/i);
  const selectB = screen.getByLabelText(/Game B/i);
  expect(selectA).toBeInTheDocument();
  expect(selectB).toBeInTheDocument();
  // Each select has 3 <option> elements
  expect(selectA.querySelectorAll('option').length).toBe(3);
  expect(selectB.querySelectorAll('option').length).toBe(3);
});

it('disables compare button when same game selected in both', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <CompareLauncher games={games} />
    </MemoryRouter>,
  );
  const selectB = screen.getByLabelText(/Game B/i) as HTMLSelectElement;
  // Default A=g1, B=g2 → enabled
  const button = screen.getByRole('button', { name: /Compare/i });
  expect(button).not.toBeDisabled();
  // Set B to g1 (same as A)
  await user.selectOptions(selectB, 'g1');
  expect(button).toBeDisabled();
});

it('navigates to /compare/:a/:b on click', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<><CompareLauncher games={games} /><LocationProbe /></>} />
        <Route path="/compare/:a/:b" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
  await user.click(screen.getByRole('button', { name: /Compare/i }));
  expect(screen.getByTestId('location').textContent).toBe('/compare/g1/g2');
});
