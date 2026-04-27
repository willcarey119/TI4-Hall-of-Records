import { describe, it, expect } from 'vitest';
import { lookupAgenda, AGENDAS } from './agendas';

describe('lookupAgenda', () => {
  it('returns null for an unknown agenda name', () => {
    expect(lookupAgenda('Unknown Agenda That Does Not Exist')).toBeNull();
  });

  it('returns the entry for a known base-game FOR/AGAINST law', () => {
    const entry = lookupAgenda('Anti-Intellectual Revolution');
    expect(entry).not.toBeNull();
    expect(entry?.type).toBe('law');
    expect(entry?.elect).toBeNull();
    expect(entry?.forEffect).toContain('destroy 1 of their non-fighter ships');
    expect(entry?.againstEffect).toContain('exhausts 1 planet for each technology');
    expect(entry?.expansion).toBe('base');
    expect(entry?.removedInPok).toBeUndefined();
  });

  it('returns the entry for an elect-player law', () => {
    const entry = lookupAgenda('Imperial Arbiter');
    expect(entry).not.toBeNull();
    expect(entry?.type).toBe('law');
    expect(entry?.elect).toBe('player');
    expect(entry?.effect).toContain('swap 1 of their strategy cards');
    expect(entry?.forEffect).toBeUndefined();
  });

  it('returns the entry for a base-game directive', () => {
    const entry = lookupAgenda('Mutiny');
    expect(entry).not.toBeNull();
    expect(entry?.type).toBe('directive');
    expect(entry?.elect).toBeNull();
    expect(entry?.forEffect).toContain('gains 1 victory point');
    expect(entry?.againstEffect).toContain('loses 1 victory point');
  });

  it('returns a PoK law', () => {
    const entry = lookupAgenda('Political Censure');
    expect(entry).not.toBeNull();
    expect(entry?.expansion).toBe('pok');
    expect(entry?.elect).toBe('player');
  });

  it('flags base-game cards removed in PoK', () => {
    const entry = lookupAgenda('Shard of the Throne');
    expect(entry?.removedInPok).toBe(true);
    expect(entry?.expansion).toBe('base');
  });

  it('covers all 63 entries (50 base + 13 PoK)', () => {
    const entries = Object.entries(AGENDAS);
    const base = entries.filter(([, e]) => e.expansion === 'base');
    const pok  = entries.filter(([, e]) => e.expansion === 'pok');
    expect(base.length).toBe(50);
    expect(pok.length).toBe(13);
  });

  it('every FOR/AGAINST entry has both forEffect and againstEffect', () => {
    Object.entries(AGENDAS).forEach(([name, entry]) => {
      if (entry.elect === null) {
        expect(entry.forEffect, `${name} missing forEffect`).toBeTruthy();
        expect(entry.againstEffect, `${name} missing againstEffect`).toBeTruthy();
      }
    });
  });

  it('every elect entry has effect and no forEffect/againstEffect', () => {
    Object.entries(AGENDAS).forEach(([name, entry]) => {
      if (entry.elect !== null) {
        expect(entry.effect, `${name} missing effect`).toBeTruthy();
        expect(entry.forEffect, `${name} should not have forEffect`).toBeUndefined();
        expect(entry.againstEffect, `${name} should not have againstEffect`).toBeUndefined();
      }
    });
  });
});
