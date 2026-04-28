import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MetaDashboardPage } from './MetaDashboardPage';

// Mock the Firestore adapter so tests don't make real network calls.
// MetaContext (imported transitively) calls loadAllGames() on mount.
vi.mock('../../adapters/firestore', () => ({
  loadAllGames: vi.fn(),
}));

import { loadAllGames } from '../../adapters/firestore';
const mockLoad = vi.mocked(loadAllGames);

describe('MetaDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading indicator while data is fetching', () => {
    // Never resolves — page stays in loading state
    mockLoad.mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <MetaDashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error message when Firestore load fails', async () => {
    mockLoad.mockRejectedValue(new Error('Network failure'));

    render(
      <MemoryRouter>
        <MetaDashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Network failure')).toBeInTheDocument();
  });
});
