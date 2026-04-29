import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

vi.mock('./adapters/firestore', () => ({
  listGames: vi.fn().mockResolvedValue([]),
  loadGame: vi.fn(),
  saveGame: vi.fn(),
}));

vi.mock('./adapters/AuthContext', () => ({
  AuthProvider: ({ children }: { children: unknown }) => children,
  useAuth: () => ({ isAuthorized: false, authLoading: false, signIn: vi.fn(), signOut: vi.fn(), user: null }),
}));

vi.mock('./lib/parser/parseGame', () => ({
  parseGame: vi.fn(),
}));

it('renders the home page at /', async () => {
  render(<App />);
  expect(
    await screen.findByRole('heading', { level: 1, name: /Hall of Records/i })
  ).toBeInTheDocument();
});
