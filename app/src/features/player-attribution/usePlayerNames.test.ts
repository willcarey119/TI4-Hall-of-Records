import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayerNames } from './usePlayerNames';

const STORAGE_KEY = 'attribution.nameMap';

beforeEach(() => {
  localStorage.clear();
});

describe('usePlayerNames', () => {
  it('starts with empty nameMap when localStorage is empty', () => {
    const { result } = renderHook(() => usePlayerNames());
    expect(result.current.nameMap).toEqual({});
  });

  it('initializes from existing localStorage data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ Alice: 'Alice' }));
    const { result } = renderHook(() => usePlayerNames());
    expect(result.current.nameMap['Alice']).toBe('Alice');
  });

  it('setName stores a name and updates nameMap', () => {
    const { result } = renderHook(() => usePlayerNames());
    act(() => { result.current.setName('Tim', 'Tim'); });
    expect(result.current.nameMap['Tim']).toBe('Tim');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({ Tim: 'Tim' });
  });

  it('setName trims whitespace from canonical name', () => {
    const { result } = renderHook(() => usePlayerNames());
    act(() => { result.current.setName('Tim', '  Tim  '); });
    expect(result.current.nameMap['Tim']).toBe('Tim');
  });

  it('setName with blank string removes the entry', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ Tim: 'Tim' }));
    const { result } = renderHook(() => usePlayerNames());
    act(() => { result.current.setName('Tim', '   '); });
    expect(result.current.nameMap).not.toHaveProperty('Tim');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored).not.toHaveProperty('Tim');
  });

  it('clearName removes the specified entry and leaves others', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ Tim: 'Tim', Jake: 'Jake' }));
    const { result } = renderHook(() => usePlayerNames());
    act(() => { result.current.clearName('Tim'); });
    expect(result.current.nameMap).not.toHaveProperty('Tim');
    expect(result.current.nameMap['Jake']).toBe('Jake');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored).not.toHaveProperty('Tim');
    expect(stored).toHaveProperty('Jake');
  });

  it('falls back to empty object when localStorage contains invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{{{');
    const { result } = renderHook(() => usePlayerNames());
    expect(result.current.nameMap).toEqual({});
  });
});
