// All Firestore SDK calls live here. No other file imports firebase/firestore.
// Implemented in Phase 1.8.

import { signInAnonymously } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, auth } from './firebaseInit';
import type { FactionSetup, ParsedGame } from '../lib/parser/types';

export interface ParsedGameSummary {
  gameId: string;
  playedAt: number;
  durationSeconds: number;
  factions: Pick<FactionSetup, 'factionId' | 'color' | 'playerName'>[];
  finalScores: Record<string, number>;
  winner: string | null;
}

export async function signInAnon(): Promise<string> {
  const result = await signInAnonymously(auth);
  const { user } = result;
  console.log('Signed in anonymously, uid:', user.uid);
  return user.uid;
}

export async function saveGame(game: ParsedGame): Promise<string> {
  const data = JSON.parse(JSON.stringify(game)) as ParsedGame;
  await setDoc(doc(db, 'games', game.gameId), data);
  return game.gameId;
}

export async function listGames(): Promise<ParsedGameSummary[]> {
  const q = query(collection(db, 'games'), orderBy('playedAt', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => {
    const game = docSnap.data() as ParsedGame;
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
    };
  });
}

export async function loadGame(gameId: string): Promise<ParsedGame> {
  const snap = await getDoc(doc(db, 'games', gameId));
  if (!snap.exists()) {
    throw new Error(`Game not found: ${gameId}`);
  }
  return snap.data() as ParsedGame;
}
