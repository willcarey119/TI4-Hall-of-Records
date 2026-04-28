import { lookupAgenda } from '../parser/agendas';
import type { AgendaEntry } from '../parser/agendas';
import type {
  AgendaResolution,
  AgendaVote,
  AgendaRider,
  VpEvent,
} from '../parser/types';

export interface AgendaDisplayEntry {
  round: number;
  indexInRound: 1 | 2;
  agenda: string;
  entry: AgendaEntry | null;
  outcome: string;
  passed: boolean;
  electedFaction?: string;
  totalFor: number;
  totalAgainst: number;
  votes: AgendaVote[];
  riders: AgendaRider[];
  timestamp: number;
}

export interface AgendaSummary {
  entries: AgendaDisplayEntry[];
  netBeneficiaries: Array<{ factionId: string; vpDelta: number }>;
  deckText: string;
}

export function buildAgendaSummary(
  agendaResolutions: AgendaResolution[],
  vpEvents: VpEvent[],
): AgendaSummary {
  // Sort ascending by timestamp
  const sorted = [...agendaResolutions].sort((a, b) => a.timestamp - b.timestamp);

  // Track how many agendas we have seen per round for indexInRound
  const roundCount: Record<number, number> = {};

  const entries: AgendaDisplayEntry[] = sorted.map((res) => {
    roundCount[res.round] = (roundCount[res.round] ?? 0) + 1;
    const rawIndex = roundCount[res.round] ?? 1;
    const indexInRound: 1 | 2 = rawIndex <= 1 ? 1 : 2;

    const dictEntry = lookupAgenda(res.agenda);

    // FOR/AGAINST totals: group by outcome string
    const forOutcome = 'For';
    const totalFor = res.votes
      .filter((v) => v.outcome === forOutcome)
      .reduce((sum, v) => sum + v.votes, 0);
    const totalAgainst = res.votes
      .filter((v) => v.outcome !== forOutcome)
      .reduce((sum, v) => sum + v.votes, 0);

    // passed: true when outcome matches the FOR side
    const passed = res.outcome === forOutcome;

    // electedFaction: the outcome string for elect-player agendas
    let electedFaction: string | undefined;
    if (dictEntry !== null && dictEntry.elect === 'player') {
      electedFaction = res.outcome;
    }

    return {
      round: res.round,
      indexInRound,
      agenda: res.agenda,
      entry: dictEntry,
      outcome: res.outcome,
      passed,
      ...(electedFaction !== undefined ? { electedFaction } : {}),
      totalFor,
      totalAgainst,
      votes: res.votes,
      riders: res.riders,
      timestamp: res.timestamp,
    };
  });

  // Net beneficiaries: VP deltas from agenda-sourced events only
  const deltaMap: Record<string, number> = {};
  for (const event of vpEvents) {
    if (event.source !== 'agenda') continue;
    deltaMap[event.faction] = (deltaMap[event.faction] ?? 0) + event.points;
  }
  const netBeneficiaries = Object.entries(deltaMap)
    .filter(([, delta]) => delta !== 0)
    .map(([factionId, vpDelta]) => ({ factionId, vpDelta }))
    .sort((a, b) => Math.abs(b.vpDelta) - Math.abs(a.vpDelta));

  // Deck text
  const passedCount = entries.filter((e) => e.passed).length;
  const topBeneficiary = netBeneficiaries[0];
  let deckText: string;
  if (topBeneficiary !== undefined) {
    const sign = topBeneficiary.vpDelta > 0 ? '+' : '';
    deckText = `${topBeneficiary.factionId} the net agenda beneficiary at ${sign}${topBeneficiary.vpDelta} VP.`;
  } else {
    deckText = `${entries.length} agendas resolved, ${passedCount} passed.`;
  }

  return { entries, netBeneficiaries, deckText };
}
