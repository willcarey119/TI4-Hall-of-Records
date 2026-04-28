import { describe, it, expect } from 'vitest';
import { buildAgendaSummary } from './buildAgendaSummary';
import type { AgendaResolution, VpEvent } from '../parser/types';

const makeResolution = (
  overrides: Partial<AgendaResolution> = {},
): AgendaResolution => ({
  agenda: 'Mutiny',
  outcome: 'For',
  round: 2,
  timestamp: 1000,
  votes: [
    { faction: 'Sol', outcome: 'For', votes: 8 },
    { faction: 'Hacan', outcome: 'Against', votes: 5 },
  ],
  riders: [],
  ...overrides,
});

describe('buildAgendaSummary', () => {
  it('returns one entry per resolution', () => {
    const result = buildAgendaSummary(
      [
        makeResolution(),
        makeResolution({
          agenda: 'Incentive Program',
          round: 2,
          timestamp: 2000,
        }),
      ],
      [],
    );
    expect(result.entries).toHaveLength(2);
  });

  it('assigns indexInRound 1 and 2 for two agendas in the same round', () => {
    const result = buildAgendaSummary(
      [
        makeResolution({ timestamp: 1000, round: 2 }),
        makeResolution({ timestamp: 2000, round: 2 }),
      ],
      [],
    );
    expect(result.entries[0]?.indexInRound).toBe(1);
    expect(result.entries[1]?.indexInRound).toBe(2);
  });

  it('sets passed=true when outcome is "For"', () => {
    const result = buildAgendaSummary(
      [makeResolution({ outcome: 'For' })],
      [],
    );
    expect(result.entries[0]?.passed).toBe(true);
  });

  it('sets passed=false when outcome is "Against"', () => {
    const result = buildAgendaSummary(
      [makeResolution({ outcome: 'Against' })],
      [],
    );
    expect(result.entries[0]?.passed).toBe(false);
  });

  it('computes totalFor and totalAgainst from votes', () => {
    const result = buildAgendaSummary(
      [makeResolution()],
      [],
    );
    const entry = result.entries[0]!;
    expect(entry.totalFor).toBe(8);
    expect(entry.totalAgainst).toBe(5);
  });

  it('attaches agenda dictionary entry when known', () => {
    const result = buildAgendaSummary(
      [makeResolution({ agenda: 'Mutiny' })],
      [],
    );
    expect(result.entries[0]?.entry).not.toBeNull();
    expect(result.entries[0]?.entry?.type).toBe('directive');
  });

  it('sets entry to null for unknown agenda names', () => {
    const result = buildAgendaSummary(
      [makeResolution({ agenda: 'Future Expansion Agenda XYZ' })],
      [],
    );
    expect(result.entries[0]?.entry).toBeNull();
  });

  it('sets electedFaction for elect-player agendas', () => {
    const result = buildAgendaSummary(
      [
        makeResolution({
          agenda: 'Imperial Arbiter',
          outcome: 'Hacan',
          votes: [
            { faction: 'Sol', outcome: 'Hacan', votes: 10 },
            { faction: 'Naal', outcome: 'Sol', votes: 4 },
          ],
        }),
      ],
      [],
    );
    expect(result.entries[0]?.electedFaction).toBe('Hacan');
  });

  it('computes net beneficiaries from agenda-sourced vp events', () => {
    const vpEvents: VpEvent[] = [
      {
        faction: 'Hacan',
        objective: 'Mutiny',
        points: 1,
        timestamp: 1000,
        source: 'agenda',
      },
      {
        faction: 'Sol',
        objective: 'Mutiny',
        points: -1,
        timestamp: 1000,
        source: 'agenda',
      },
    ];
    const result = buildAgendaSummary(
      [makeResolution()],
      vpEvents,
    );
    const hacan = result.netBeneficiaries.find(
      (b) => b.factionId === 'Hacan',
    );
    const sol = result.netBeneficiaries.find((b) => b.factionId === 'Sol');
    expect(hacan?.vpDelta).toBe(1);
    expect(sol?.vpDelta).toBe(-1);
  });

  it('omits factions with zero agenda VP delta from netBeneficiaries', () => {
    const result = buildAgendaSummary(
      [makeResolution()],
      [],
    );
    expect(result.netBeneficiaries).toHaveLength(0);
  });

  it('generates a deckText string', () => {
    const result = buildAgendaSummary(
      [makeResolution()],
      [],
    );
    expect(typeof result.deckText).toBe('string');
    expect(result.deckText.length).toBeGreaterThan(0);
  });

  it('sorts entries ascending by timestamp', () => {
    const result = buildAgendaSummary(
      [makeResolution({ timestamp: 5000 }), makeResolution({ timestamp: 1000 })],
      [],
    );
    expect(result.entries[0]?.timestamp).toBe(1000);
    expect(result.entries[1]?.timestamp).toBe(5000);
  });

  it('deckText includes agenda counts when there are no agenda VP events', () => {
    const result = buildAgendaSummary(
      [makeResolution(), makeResolution({ timestamp: 2000 })],
      [],
    );
    expect(result.deckText).toContain('2');
    expect(result.deckText).toContain('resolved');
  });

  it('deckText shows negative VP delta without a + sign', () => {
    const vpEvents: VpEvent[] = [
      { faction: 'Sol', objective: 'Mutiny', points: -1, timestamp: 1000, source: 'agenda' },
    ];
    const result = buildAgendaSummary([makeResolution()], vpEvents);
    expect(result.deckText).toContain('-1');
    expect(result.deckText).not.toContain('+-1');
  });
});
