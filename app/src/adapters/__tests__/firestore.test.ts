// src/adapters/__tests__/firestore.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DocumentSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { signInAnon, saveGame, listGames, loadGame } from '../firestore';
import { setDoc, getDoc, getDocs } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

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
  query: vi.fn(() => 'query-ref'),
  orderBy: vi.fn(() => 'orderby-ref'),
}));

vi.mock('firebase/auth', () => ({
  signInAnonymously: vi.fn(() =>
    Promise.resolve({ user: { uid: 'uid-test-123' } }),
  ),
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

describe('signInAnon', () => {
  it('calls Firebase signInAnonymously and returns the UID', async () => {
    const uid = await signInAnon();
    expect(signInAnonymously).toHaveBeenCalledTimes(1);
    expect(uid).toBe('uid-test-123');
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
