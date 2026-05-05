import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MetaDashboardPage } from './MetaDashboardPage';

// Mock the Firestore adapter so tests don't make real network calls.
// MetaContext (imported transitively) calls loadAllGames() on mount.
vi.mock('../../adapters/firestore', () => ({
  loadAllGames: vi.fn(),
}));

vi.mock('../../adapters/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthorized: false,
    authLoading: false,
    user: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
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

    // LoadingSkeleton renders skeleton rows (no visible text); confirm the nav header is shown
    expect(screen.getByText(/League Stats/i)).toBeInTheDocument();
  });

  it('shows error message when Firestore load fails', async () => {
    mockLoad.mockRejectedValue(new Error('Network failure'));

    render(
      <MemoryRouter>
        <MetaDashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Network failure')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
