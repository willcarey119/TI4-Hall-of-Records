import { describe, it, expect } from 'vitest';
import { buildAgendaStats } from './buildAgendaStats';
import type { ParsedGame, AgendaResolution } from '../parser/types';

function makeResolution(agenda: string, outcome: string): AgendaResolution {
  return { agenda, outcome, round: 1, timestamp: 0, votes: [], riders: [] };
}
function makeGame(resolutions: AgendaResolution[]): Partial<ParsedGame> {
  return { gameId: 'g1', agendaResolutions: resolutions, vpEvents: [], factions: [] };
}

describe('buildAgendaStats', () => {
  it('returns empty for no games', () => {
    const r = buildAgendaStats([]);
    expect(r.agendas).toHaveLength(0);
    expect(r.totalResolutions).toBe(0);
    expect(r.overallPassRate).toBeNull();
  });

  it('counts appearances per agenda name', () => {
    const r = buildAgendaStats([
      makeGame([makeResolution('Mutiny', 'For'), makeResolution('Mutiny', 'Against')]),
    ] as ParsedGame[]);
    expect(r.agendas.find(a => a.name === 'Mutiny')?.appearances).toBe(2);
  });

  it('counts pass when outcome is For', () => {
    const r = buildAgendaStats([makeGame([makeResolution('Mutiny', 'For')])] as ParsedGame[]);
    expect(r.agendas.find(a => a.name === 'Mutiny')?.passCount).toBe(1);
    expect(r.agendas.find(a => a.name === 'Mutiny')?.failCount).toBe(0);
    expect(r.agendas.find(a => a.name === 'Mutiny')?.electCount).toBe(0);
  });

  it('counts fail when outcome is Against', () => {
    const r = buildAgendaStats([makeGame([makeResolution('Mutiny', 'Against')])] as ParsedGame[]);
    expect(r.agendas.find(a => a.name === 'Mutiny')?.failCount).toBe(1);
    expect(r.agendas.find(a => a.name === 'Mutiny')?.electCount).toBe(0);
  });

  it('elect-type outcome (non-For/Against) counts as electCount, NOT as pass', () => {
    // Elect-type resolutions have no pass/fail semantics — the "outcome" is the elected entity.
    // Counting them as passes inflates passRate and overallPassRate.
    const r = buildAgendaStats([makeGame([makeResolution('Elect Officer', 'Hacan')])] as ParsedGame[]);
    const stat = r.agendas.find(a => a.name === 'Elect Officer');
    expect(stat?.electCount).toBe(1);
    expect(stat?.passCount).toBe(0);
    expect(stat?.failCount).toBe(0);
    // Pass rate is null for an agenda with no binary outcomes.
    expect(stat?.passRate).toBeNull();
  });

  it('passRate is passes / (passes + fails), excluding elect outcomes', () => {
    // 1 For + 1 Against + 1 elect = 50% pass rate (not 67% — the elect doesn\'t count).
    const r = buildAgendaStats([makeGame([
      makeResolution('Mixed', 'For'),
      makeResolution('Mixed', 'Against'),
      makeResolution('Mixed', 'Hacan'),
    ])] as ParsedGame[]);
    const stat = r.agendas.find(a => a.name === 'Mixed');
    expect(stat?.passRate).toBeCloseTo(0.5);
    expect(stat?.appearances).toBe(3);
  });

  it('computes overallPassRate excluding elect outcomes', () => {
    const r = buildAgendaStats([
      makeGame([
        makeResolution('A', 'For'),
        makeResolution('B', 'Against'),
        makeResolution('C', 'Hacan'),
      ]),
    ] as ParsedGame[]);
    // 1 pass / (1 pass + 1 fail) = 0.5. The elect resolution is excluded from both.
    expect(r.overallPassRate).toBeCloseTo(0.5);
  });

  it('overallPassRate is null when no binary resolutions exist', () => {
    const r = buildAgendaStats([
      makeGame([makeResolution('Elect A', 'Hacan'), makeResolution('Elect B', 'Sol')]),
    ] as ParsedGame[]);
    expect(r.overallPassRate).toBeNull();
  });
});
