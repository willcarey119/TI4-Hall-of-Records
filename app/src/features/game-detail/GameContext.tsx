import { createContext, useContext } from 'react';
import type { ParsedGame } from '../../lib/parser/types';

export interface GameContextValue {
  game: ParsedGame | null;
  loading: boolean;
  error: string | null;
}

export const GameContext = createContext<GameContextValue>({
  game: null,
  loading: true,
  error: null,
});

export function useGame(): GameContextValue {
  return useContext(GameContext);
}
