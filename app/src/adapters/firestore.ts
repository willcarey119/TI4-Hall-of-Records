// All Firestore SDK calls live here. No other file imports firebase/firestore.
// Implemented in Phase 1.8. Auth upgraded to Google Sign-In in v1.06.

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, auth } from './firebaseInit';
import type { FactionSetup, ParsedGame } from '../lib/parser/types';

// Emails permitted to perform writes and deletes. Reads remain unrestricted.
// Server-side enforcement lives in firestore.rules — this list is a client-side
// UX gate that hides write controls from unauthorized visitors.
export const AUTHORIZED_EMAILS: readonly string[] = [
  'willcarey119@gmail.com',
  // Add further playgroup archivists here as needed.
];

/** Opens a Google Sign-In popup. Resolves when the user has authenticated. */
export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, new GoogleAuthProvider());
}

/** Signs out the current user. */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Subscribes to auth state changes. Returns the unsubscribe function. */
export function onAuthChanged(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export interface ParsedGameSummary {
  gameId: string;
  playedAt: number;
  durationSeconds: number;
  factions: Pick<FactionSetup, 'factionId' | 'color' | 'playerName'>[];
  finalScores: Record<string, number>;
  winner: string | null;
  /** Phase the game ended in, derived from the last PhaseSnapshot. Absent for documents
   *  uploaded before this field was added. */
  lastPhase?: string;
}

/** Deletes one or more games from Firestore by gameId. Runs in parallel — safe for small sets. */
export async function deleteGames(gameIds: string[]): Promise<void> {
  await Promise.all(gameIds.map((id) => deleteDoc(doc(db, 'games', id))));
}

export async function saveGame(game: ParsedGame): Promise<string> {
  const data = JSON.parse(JSON.stringify(game)) as unknown as ParsedGame;
  // setDoc overwrites any existing document with this gameId — re-uploading the same export is idempotent.
  await setDoc(doc(db, 'games', game.gameId), data);
  return game.gameId;
}

export async function listGames(): Promise<ParsedGameSummary[]> {
  const q = query(collection(db, 'games'), orderBy('playedAt', 'desc'));
  const snap = await getDocs(q);

  // If any document is malformed, the entire call rejects. Acceptable for a private playgroup dataset.
  return snap.docs.map((docSnap) => {
    const game = docSnap.data() as unknown as ParsedGame;
    return {
      gameId: game.gameId,
      playedAt: game.playedAt,
      durationSeconds: game.durationSeconds,
      factions: game.factions.map((f) => ({
        factionId: f.factionId,
        color: f.color,
        playerName: f.playerName,
      })),
      finalScores: game.finalScores,
      winner: game.winner,
      ...(game.phaseSnapshots.at(-1)?.phase !== undefined
        ? { lastPhase: game.phaseSnapshots.at(-1)!.phase }
        : {}),
    };
  });
}

export async function loadGame(gameId: string): Promise<ParsedGame> {
  const snap = await getDoc(doc(db, 'games', gameId));
  if (!snap.exists()) {
    throw new Error(`Game not found: ${gameId}`);
  }
  return snap.data() as unknown as ParsedGame;
}

/** Returns all stored games ordered by playedAt descending. */
export async function loadAllGames(): Promise<ParsedGame[]> {
  const q = query(collection(db, 'games'), orderBy('playedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(docSnap => docSnap.data() as unknown as ParsedGame);
}
