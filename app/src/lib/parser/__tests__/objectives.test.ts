import { describe, it, expect } from 'vitest';
import { getObjectivePoints } from '../objectives';

describe('getObjectivePoints', () => {
  describe('Stage I public objectives', () => {
    it('returns 1 VP for "Lead from the Front" (Base)', () => {
      expect(getObjectivePoints('Lead from the Front')).toEqual({ stage: 'I', points: 1 });
    });
    it('returns 1 VP for "Expand Borders" (Base)', () => {
      expect(getObjectivePoints('Expand Borders')).toEqual({ stage: 'I', points: 1 });
    });
    it('returns 1 VP for "Sway the Council" (Base)', () => {
      expect(getObjectivePoints('Sway the Council')).toEqual({ stage: 'I', points: 1 });
    });
    it('returns 1 VP for "Amass Wealth" (PoK)', () => {
      expect(getObjectivePoints('Amass Wealth')).toEqual({ stage: 'I', points: 1 });
    });
  });

  describe('Stage II public objectives', () => {
    it('returns 2 VP for "Construct Massive Cities" (PoK)', () => {
      expect(getObjectivePoints('Construct Massive Cities')).toEqual({ stage: 'II', points: 2 });
    });
    it('returns 2 VP for "Conquer the Weak" (Base)', () => {
      expect(getObjectivePoints('Conquer the Weak')).toEqual({ stage: 'II', points: 2 });
    });
    it('returns 2 VP for "Master the Sciences" (Base)', () => {
      expect(getObjectivePoints('Master the Sciences')).toEqual({ stage: 'II', points: 2 });
    });
  });

  describe('secret objectives', () => {
    it('returns 1 VP for "Become a Martyr" (PoK action-phase secret)', () => {
      expect(getObjectivePoints('Become a Martyr')).toEqual({ stage: 'secret', points: 1 });
    });
    it('returns 1 VP for "Dictate Policy" (PoK agenda-phase secret, not Stage II)', () => {
      expect(getObjectivePoints('Dictate Policy')).toEqual({ stage: 'secret', points: 1 });
    });
    it('returns 1 VP for "Establish Hegemony" (PoK status-phase secret, not Stage II)', () => {
      expect(getObjectivePoints('Establish Hegemony')).toEqual({ stage: 'secret', points: 1 });
    });
  });

  describe('special VP sources', () => {
    it('returns 1 VP for "Support for the Throne"', () => {
      expect(getObjectivePoints('Support for the Throne')).toEqual({ stage: 'support', points: 1 });
    });
    it('returns 1 VP for "Custodians Token"', () => {
      expect(getObjectivePoints('Custodians Token')).toEqual({ stage: 'other', points: 1 });
    });
    it('returns 1 VP for "Shard of the Throne"', () => {
      expect(getObjectivePoints('Shard of the Throne')).toEqual({ stage: 'relic', points: 1 });
    });
    it('returns 1 VP for "Crown of Emphidia"', () => {
      expect(getObjectivePoints('Crown of Emphidia')).toEqual({ stage: 'relic', points: 1 });
    });
    it('returns 1 VP for "Imperial Rider"', () => {
      expect(getObjectivePoints('Imperial Rider')).toEqual({ stage: 'agenda', points: 1 });
    });
    it('returns 1 VP for "Styx" (Discordant Stars legendary planet)', () => {
      expect(getObjectivePoints('Styx')).toEqual({ stage: 'legendary', points: 1 });
    });
  });

  describe('unknown objectives', () => {
    it('returns null for an unrecognised string', () => {
      expect(getObjectivePoints('This Objective Does Not Exist XYZ')).toBeNull();
    });
    it('is case-sensitive', () => {
      expect(getObjectivePoints('lead from the front')).toBeNull();
      expect(getObjectivePoints('LEAD FROM THE FRONT')).toBeNull();
    });
  });
});
