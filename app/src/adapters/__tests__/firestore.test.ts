// src/adapters/__tests__/firestore.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DocumentSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';
import {
  signInWithGoogle,
  signOut,
  onAuthChanged,
  AUTHORIZED_EMAILS,
  saveGame,
  listGames,
  loadGame,
  loadAllGames,
  deleteGames,
} from '../firestore';
import { setDoc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';

// ── Mocks (hoisted by Vitest before imports) ─────────────────────────────────

vi.mock('../firebaseInit', () => ({
  db: { _stub: 'firestore' },
  auth: { _stub: 'auth' },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'col-ref'),
  doc: vi.fn(() => 'doc-ref'),
  setDoc: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  deleteDoc: vi.fn(() => Promise.resolve()),
  query: vi.fn(() => 'query-ref'),
  orderBy: vi.fn(() => 'orderby-ref'),
}));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class {}, // class so `new GoogleAuthProvider()` is valid
  signInWithPopup: vi.fn(() => Promise.resolve({ user: { uid: 'uid-test-123', email: 'willcarey119@gmail.com' } })),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn(() => vi.fn()), // returns unsubscribe fn
}));

// ── Minimal ParsedGame fixture ───────────────────────────────────────────────

const mockGame = {
  gameId: 'abc123',
  playedAt: 1700000000000,
  durationSeconds: 14400,
  factions: [
    {
      factionId: 'Sol',
      playerName: 'Tim',
      color: 'Blue',
      mapPosition: 0,
      startingTechs: [],
      startingPlanets: [],
    },
  ],
  options: {},
  initialSpeaker: 'Sol',
  phaseSnapshots: [],
  vpEvents: [],
  planetEvents: [],
  techEvents: [],
  agendaResolutions: [],
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
  finalScores: { Sol: 10 },
  winner: 'Sol',
  timers: {
    game: 14400,
    factions: { Sol: 7200 },
    secondaries: {},
    agendas: { first: 0, second: 0 },
  },
  warnings: [],
} as const;

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('signInWithGoogle', () => {
  it('calls Firebase signInWithPopup with a GoogleAuthProvider', async () => {
    await signInWithGoogle();
    expect(signInWithPopup).toHaveBeenCalledTimes(1);
    // First arg is auth stub; second should be a GoogleAuthProvider instance
    expect(signInWithPopup).toHaveBeenCalledWith({ _stub: 'auth' }, expect.any(Object));
  });
});

describe('signOut', () => {
  it('calls Firebase signOut with the auth instance', async () => {
    await signOut();
    expect(firebaseSignOut).toHaveBeenCalledWith({ _stub: 'auth' });
  });
});

describe('onAuthChanged', () => {
  it('calls onAuthStateChanged and returns the unsubscribe function', () => {
    const callback = vi.fn();
    const unsub = onAuthChanged(callback);
    expect(onAuthStateChanged).toHaveBeenCalledWith({ _stub: 'auth' }, callback);
    expect(typeof unsub).toBe('function');
  });
});

describe('AUTHORIZED_EMAILS', () => {
  it('includes willcarey119@gmail.com', () => {
    expect(AUTHORIZED_EMAILS).toContain('willcarey119@gmail.com');
  });

  it('is a non-empty readonly array', () => {
    expect(AUTHORIZED_EMAILS.length).toBeGreaterThan(0);
  });
});

describe('saveGame', () => {
  it('calls setDoc with correct path and game data, returns gameId', async () => {
    const result = await saveGame(mockGame);
    expect(setDoc).toHaveBeenCalledWith(
      'doc-ref',
      expect.objectContaining({ gameId: 'abc123' }),
    );
    expect(result).toBe('abc123');
  });
});

describe('listGames', () => {
  it('returns ParsedGameSummary objects and omits event arrays', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [{ data: () => ({ ...mockGame }) }],
    } as unknown as QuerySnapshot<DocumentData>);

    const result = await listGames();
    expect(result).toHaveLength(1);
    expect(result[0]?.gameId).toBe('abc123');
    expect(result[0]?.winner).toBe('Sol');
    expect(result[0]?.factions[0]?.factionId).toBe('Sol');
    // summaries must not include large event arrays
    expect(result[0]).not.toHaveProperty('vpEvents');
  });

  it('returns an empty array when the collection is empty', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [],
    } as unknown as QuerySnapshot<DocumentData>);

    const result = await listGames();
    expect(result).toEqual([]);
  });
});

describe('loadAllGames', () => {
  it('returns all ParsedGame objects when docs are present', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [
        { data: () => ({ ...mockGame }) },
        { data: () => ({ ...mockGame, gameId: 'xyz789' }) },
      ],
    } as unknown as QuerySnapshot<DocumentData>);

    const result = await loadAllGames();
    expect(result).toHaveLength(2);
    expect(result[0]?.gameId).toBe('abc123');
    expect(result[1]?.gameId).toBe('xyz789');
  });

  it('returns an empty array when the collection is empty', async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [],
    } as unknown as QuerySnapshot<DocumentData>);

    const result = await loadAllGames();
    expect(result).toEqual([]);
  });
});

describe('loadGame', () => {
  it('returns the ParsedGame when the document exists', async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ ...mockGame }),
    } as unknown as DocumentSnapshot<DocumentData>);

    const result = await loadGame('abc123');
    expect(result.gameId).toBe('abc123');
  });

  it('throws when the document does not exist', async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
      data: () => undefined,
    } as unknown as DocumentSnapshot<DocumentData>);

    await expect(loadGame('missing-id')).rejects.toThrow('Game not found: missing-id');
  });
});

describe('deleteGames', () => {
  it('calls deleteDoc once per id', async () => {
    await deleteGames(['abc123', 'def456', 'ghi789']);
    expect(deleteDoc).toHaveBeenCalledTimes(3);
  });

  it('resolves without calling deleteDoc when given an empty array', async () => {
    await expect(deleteGames([])).resolves.toBeUndefined();
    expect(deleteDoc).not.toHaveBeenCalled();
  });

  it('rejects if any underlying deleteDoc rejects (Promise.all semantics)', async () => {
    vi.mocked(deleteDoc)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Permission denied'));
    await expect(deleteGames(['ok-id', 'bad-id'])).rejects.toThrow('Permission denied');
  });
});
