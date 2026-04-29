// src/adapters/AuthContext.tsx
// Provides Firebase auth state to the component tree.
// Components read auth state via useAuth() — they never import Firebase directly.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { AUTHORIZED_EMAILS, signInWithGoogle, signOut, onAuthChanged } from './firestore';

interface AuthState {
  user: User | null;
  /** True only when signed in with an email in AUTHORIZED_EMAILS. */
  isAuthorized: boolean;
  /** True while the initial auth state is being resolved from Firebase. */
  authLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isAuthorized: false,
  authLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // onAuthChanged returns the Firebase unsubscribe function, so this effect
    // cleans up correctly when the component unmounts.
    return onAuthChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  const isAuthorized =
    user !== null && AUTHORIZED_EMAILS.includes(user.email ?? '');

  return (
    <AuthContext.Provider
      value={{ user, isAuthorized, authLoading, signIn: signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
