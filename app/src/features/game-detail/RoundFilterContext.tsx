import { createContext, useContext, useState, type ReactNode } from 'react';

interface RoundFilterValue {
  scrubRound: number | null;
  setScrubRound: (r: number | null) => void;
}

const RoundFilterContext = createContext<RoundFilterValue>({
  scrubRound: null,
  setScrubRound: () => {},
});

export function RoundFilterProvider({ children }: { children: ReactNode }) {
  const [scrubRound, setScrubRound] = useState<number | null>(null);
  return (
    <RoundFilterContext.Provider value={{ scrubRound, setScrubRound }}>
      {children}
    </RoundFilterContext.Provider>
  );
}

export function useRoundFilter(): RoundFilterValue {
  return useContext(RoundFilterContext);
}
