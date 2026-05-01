import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { AgendaPage } from './AgendaPage';

vi.mock('../../adapters/firestore', () => ({
  loadAllGames: vi.fn().mockResolvedValue([]),
}));

it('renders the masthead', async () => {
  render(<AgendaPage />);
  expect(await screen.findByText(/Senate Almanac/i)).toBeInTheDocument();
});

it('renders the definitions section', async () => {
  render(<AgendaPage />);
  const matches = await screen.findAllByText(/binary agenda/i);
  expect(matches.length).toBeGreaterThan(0);
});

it('renders top stats row', async () => {
  render(<AgendaPage />);
  const passRateEls = await screen.findAllByText(/Pass Rate/i);
  expect(passRateEls.length).toBeGreaterThan(0);
  const resolutionEls = await screen.findAllByText(/Resolutions/i);
  expect(resolutionEls.length).toBeGreaterThan(0);
});

it('renders FactionVotingPanel', async () => {
  render(<AgendaPage />);
  expect(await screen.findByText(/Faction Voting Patterns/i)).toBeInTheDocument();
});
