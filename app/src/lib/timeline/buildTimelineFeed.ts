import type { VpEvent, AgendaResolution, ObjectiveReveal, PlanetEvent } from '../parser/types';

export type TimelineEventType = 'vp' | 'agenda' | 'objective' | 'planet';

export interface TimelineFeedItem {
  timestamp: number;
  type: TimelineEventType;
  factionId: string | null; // null for agenda/objective events
  label: string;
  subLabel: string | null;
  isHighlight: boolean;
}

export interface TimelineSummary {
  items: TimelineFeedItem[];
  highlightCount: number;
  deckText: string;
}

export function buildTimelineFeed(
  vpEvents: VpEvent[],
  agendaResolutions: AgendaResolution[],
  objectiveReveals: ObjectiveReveal[],
  planetEvents: PlanetEvent[],
): TimelineSummary {
  const items: TimelineFeedItem[] = [];

  // VP scoring events — always highlight
  for (const e of vpEvents) {
    items.push({
      timestamp: e.timestamp,
      type: 'vp',
      factionId: e.faction,
      label: `+${e.points} VP — ${e.objective}`,
      subLabel: null,
      isHighlight: true,
    });
  }

  // Agenda resolutions — always highlight
  // 'Against' = failed; everything else (For, elected name) = PASSED
  for (const e of agendaResolutions) {
    const passed = e.outcome !== 'Against';
    const totalFor = e.votes
      .filter(v => v.outcome === 'For')
      .reduce((s, v) => s + v.votes, 0);
    const totalAgainst = e.votes
      .filter(v => v.outcome === 'Against')
      .reduce((s, v) => s + v.votes, 0);
    items.push({
      timestamp: e.timestamp,
      type: 'agenda',
      factionId: null,
      label: `${e.agenda} — ${passed ? 'PASSED' : 'failed'}`,
      subLabel: totalFor + totalAgainst > 0 ? `${totalFor} for · ${totalAgainst} against` : null,
      isHighlight: true,
    });
  }

  // Objective reveals — not highlight (informational)
  for (const e of objectiveReveals) {
    items.push({
      timestamp: e.timestamp,
      type: 'objective',
      factionId: null,
      label: `Revealed: ${e.objective}`,
      subLabel: `Stage ${e.stage} · Round ${e.round}`,
      isHighlight: false,
    });
  }

  // Planet events — only Mecatol Rex claims (highlight)
  for (const e of planetEvents) {
    if (e.planet !== 'Mecatol Rex') continue;
    if (e.type !== 'claim') continue;
    items.push({
      timestamp: e.timestamp,
      type: 'planet',
      factionId: e.faction,
      label: `${e.faction} claimed Mecatol Rex`,
      subLabel: null,
      isHighlight: true,
    });
  }

  // Sort ascending by timestamp
  items.sort((a, b) => a.timestamp - b.timestamp);

  const highlightCount = items.filter(i => i.isHighlight).length;

  const vpCount = vpEvents.length;
  const agendaCount = agendaResolutions.length;
  const deckText =
    items.length > 0
      ? `${vpCount} VP events · ${agendaCount} agendas · ${items.length} total entries`
      : 'No events recorded.';

  return { items, highlightCount, deckText };
}
