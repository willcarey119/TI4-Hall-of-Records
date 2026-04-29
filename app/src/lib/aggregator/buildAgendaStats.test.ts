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
  });

  it('counts fail when outcome is Against', () => {
    const r = buildAgendaStats([makeGame([makeResolution('Mutiny', 'Against')])] as ParsedGame[]);
    expect(r.agendas.find(a => a.name === 'Mutiny')?.failCount).toBe(1);
  });

  it('elect-type outcome (non-For/Against) counts as pass', () => {
    const r = buildAgendaStats([makeGame([makeResolution('Elect Officer', 'Hacan')])] as ParsedGame[]);
    expect(r.agendas.find(a => a.name === 'Elect Officer')?.passCount).toBe(1);
    expect(r.agendas.find(a => a.name === 'Elect Officer')?.failCount).toBe(0);
  });

  it('computes overall pass rate', () => {
    const r = buildAgendaStats([
      makeGame([makeResolution('A', 'For'), makeResolution('B', 'Against')]),
    ] as ParsedGame[]);
    expect(r.overallPassRate).toBeCloseTo(0.5);
  });
});
