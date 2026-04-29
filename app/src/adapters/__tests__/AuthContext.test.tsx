// src/adapters/__tests__/AuthContext.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock firestore so AuthProvider's useEffect doesn't try to talk to Firebase.
// onAuthChanged is invoked at mount; we return a no-op unsubscribe.
vi.mock('../firestore', () => ({
  AUTHORIZED_EMAILS: ['willcarey119@gmail.com'],
  signInWithGoogle: vi.fn(() => Promise.resolve()),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthChanged: vi.fn(() => () => {}),
}));

describe('useAuth', () => {
  it('throws a descriptive error when called outside an AuthProvider', () => {
    // Suppress React's automatic error logging for this expected-throw test.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(/must be called inside an <AuthProvider>/);
    errorSpy.mockRestore();
  });

  it('returns the auth state when called inside an AuthProvider', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthorized).toBe(false);
    // signIn / signOut are wired to the firestore module functions.
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
  });
});
