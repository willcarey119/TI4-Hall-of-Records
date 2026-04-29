import { useState, useLayoutEffect } from 'react';

const STEPS = [0.85, 1.0, 1.2] as const;
const LS_KEY = 'ti4-font-scale';

function clampStep(idx: number): number {
  return Math.max(0, Math.min(STEPS.length - 1, idx));
}

function applyScale(scale: number): void {
  document.documentElement.style.setProperty('--font-scale', scale.toString());
}

function readStoredIndex(): number {
  const stored = localStorage.getItem(LS_KEY);
  const parsed = stored !== null ? parseFloat(stored) : NaN;
  if (isNaN(parsed)) return 1; // default: index 1 = scale 1.0
  return clampStep(parsed);
}

export function useFontScale(): { scale: number; atMin: boolean; atMax: boolean; up: () => void; down: () => void } {
  const [stepIdx, setStepIdx] = useState<number>(() => readStoredIndex());

  useLayoutEffect(() => {
    localStorage.setItem(LS_KEY, stepIdx.toString());
    applyScale(STEPS[stepIdx] ?? 1.0);
  }, [stepIdx]);

  return {
    scale: STEPS[stepIdx] ?? 1.0,
    atMin: stepIdx === 0,
    atMax: stepIdx === STEPS.length - 1,
    up:   () => setStepIdx(i => clampStep(i + 1)),
    down: () => setStepIdx(i => clampStep(i - 1)),
  };
}
