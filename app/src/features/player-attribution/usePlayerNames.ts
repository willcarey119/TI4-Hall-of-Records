import { useState, useCallback } from 'react';

const STORAGE_KEY = 'attribution.nameMap';

function readStored(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export interface UsePlayerNamesResult {
  nameMap: Record<string, string>;
  setName: (rawName: string, canonicalName: string) => void;
  clearName: (rawName: string) => void;
}

export function usePlayerNames(): UsePlayerNamesResult {
  const [nameMap, setNameMap] = useState<Record<string, string>>(readStored);

  const setName = useCallback((rawName: string, canonicalName: string) => {
    setNameMap(prev => {
      const next = { ...prev };
      if (canonicalName.trim() === '') {
        delete next[rawName];
      } else {
        next[rawName] = canonicalName.trim();
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearName = useCallback((rawName: string) => {
    setNameMap(prev => {
      const next = { ...prev };
      delete next[rawName];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { nameMap, setName, clearName };
}
