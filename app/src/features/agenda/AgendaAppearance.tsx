import type { AgendaAppearance as AgendaAppearanceType } from '../../lib/aggregator/buildAgendaCrossGame';
import type { AgendaDisplayEntry } from '../../lib/agenda/buildAgendaSummary';
import { lookupAgenda } from '../../lib/parser/agendas';
import { getFactionBrandColor } from '../../lib/factions/factionBrandColors';
import { formatDate } from '../../shared';
import { EffectBlock, VoteColumns } from './_shared/AgendaPrimitives';

interface AgendaAppearanceProps {
  appearance: AgendaAppearanceType;
}

const monoMicro = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 'var(--font-micro)',
  color: 'var(--ink-3)',
} as const;

export function AgendaAppearance({ appearance }: AgendaAppearanceProps) {
  const catalogEntry = lookupAgenda(appearance.agenda) ?? null;

  const displayEntry: AgendaDisplayEntry = {
    round: appearance.round,
    indexInRound: appearance.indexInRound,
    agenda: appearance.agenda,
    entry: catalogEntry,
    outcome: appearance.outcome,
    passed: appearance.passed ?? false,
    totalFor: appearance.totalFor,
    totalAgainst: appearance.totalAgainst,
    votes: appearance.votes,
    riders: appearance.riders,
    timestamp: appearance.gameDate,
  };

  const winnerLabel = appearance.gameWinner !== null
    ? `Winner: ${appearance.gameWinner}`
    : 'No winner';

  const vpEntries = Object.entries(appearance.vpDeltaByFaction);

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Game label */}
      <div style={monoMicro}>
        {formatDate(appearance.gameDate)} · {winnerLabel}
      </div>

      {/* Round label */}
      <div style={{ ...monoMicro, marginTop: 2 }}>
        Round {appearance.round} · Agenda {appearance.indexInRound}
      </div>

      {/* Status row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0', flexWrap: 'wrap' }}>
        {appearance.passed === null ? (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
              fontWeight: 700,
              padding: '0 3px',
              lineHeight: '11px',
              display: 'inline-block',
              height: 11,
              background: 'var(--accent)',
              color: 'var(--paper)',
            }}
          >
            ELECTED
          </span>
        ) : (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
              fontWeight: 700,
              color: appearance.passed ? 'var(--accent)' : 'var(--ink-3)',
            }}
          >
            {appearance.passed ? 'PASSED' : 'FAILED'}
          </span>
        )}
        <span style={monoMicro}>
          {appearance.totalFor} FOR · {appearance.totalAgainst} AGAINST
        </span>
      </div>

      {/* Effect block */}
      <EffectBlock entry={catalogEntry} />

      {/* Vote breakdown */}
      <VoteColumns agendaEntry={displayEntry} />

      {/* Riders */}
      {appearance.riders.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <span style={{ ...monoMicro, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
            Riders:{' '}
          </span>
          {appearance.riders.map((r, i) => (
            <span key={`${r.faction}-${i}`} style={monoMicro}>
              {r.faction} ({r.outcome}){i < appearance.riders.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}

      {/* VP impact */}
      {vpEntries.length > 0 && (
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ ...monoMicro, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
            VP impact:
          </span>
          {vpEntries.map(([faction, delta]) => (
            <span
              key={faction}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 'var(--font-micro)',
                color: getFactionBrandColor(faction, 'var(--ink)'),
                fontWeight: 700,
              }}
            >
              {faction} {delta > 0 ? '+' : ''}{delta}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
