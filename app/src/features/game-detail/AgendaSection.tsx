// app/src/features/game-detail/AgendaSection.tsx
import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildAgendaSummary } from '../../lib/agenda/buildAgendaSummary';
import { Label, Rule, SectionDesc } from '../../shared';
import { EffectBlock, VoteColumns } from '../agenda/_shared/AgendaPrimitives';

const INDEX_LABEL = ['I', 'II'] as const;

export function AgendaSection() {
  const { game } = useGame();

  const summary = useMemo(
    () =>
      game
        ? buildAgendaSummary(game.agendaResolutions, game.vpEvents)
        : null,
    [game],
  );

  if (game === null || summary === null) return null;

  const passedCount = summary.entries.filter((e) => e.passed).length;

  return (
    <section
      id="agenda"
      data-section="agenda"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      {/* Kicker */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 'var(--font-micro)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
          borderBottom: '1px solid var(--ink-4)',
          paddingBottom: 3,
          marginBottom: 6,
        }}
      >
        <span>The Galactic Senate · Record</span>
        <span>{summary.entries.length} agendas · {passedCount} passed</span>
      </div>

      {/* Headline + Deck */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 'var(--font-subhead)',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 2,
        }}
      >
        Laws of the Realm.
      </div>
      <div style={{ fontSize: 'var(--font-sm)', color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
        {summary.deckText}
      </div>

      <SectionDesc>
        Political agendas voted on during this game's Galactic Senate phases. Each entry shows how factions voted, what passed or failed, and any VP gained or lost as a result.
      </SectionDesc>

      <Rule weight="double" />

      {summary.entries.length === 0 ? (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            color: 'var(--ink-3)',
            padding: '8px 0',
          }}
        >
          No agendas resolved this game.
        </div>
      ) : (
        summary.entries.map((entry, i) => (
          <div key={`${entry.round}-${entry.indexInRound}-${entry.agenda}`}>
            {/* Round label */}
            <Label>Round {entry.round} · Agenda {INDEX_LABEL[(entry.indexInRound - 1) as 0 | 1]}</Label>

            {/* Agenda name */}
            <div
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: 'var(--font-body)',
                fontWeight: 800,
                fontStyle: 'italic',
                margin: '4px 0 2px',
              }}
            >
              &ldquo;{entry.agenda}.&rdquo;
            </div>

            {/* Status row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 'var(--font-micro)',
                  padding: '0 3px',
                  lineHeight: '11px',
                  display: 'inline-block',
                  height: 11,
                  ...(entry.entry?.type === 'law'
                    ? { background: 'var(--ink)', color: 'var(--paper)' }
                    : { border: '1px solid var(--ink-3)', color: 'var(--ink-3)' }),
                }}
              >
                {entry.entry?.type === 'law' ? 'LAW' : 'DIR'}
              </span>
              {entry.electedFaction !== undefined ? (
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)' }}>
                  Elect: {entry.entry?.elect?.replace(/-/g, ' ')} · <strong style={{ color: 'var(--ink)' }}>{entry.electedFaction} elected</strong>
                </span>
              ) : (
                <>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 'var(--font-micro)',
                      fontWeight: 700,
                      color: entry.passed ? 'var(--ink)' : 'var(--ink-3)',
                    }}
                  >
                    {entry.passed ? 'PASSED' : 'failed'}
                  </span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)' }}>
                    {entry.totalFor} for · {entry.totalAgainst} against
                  </span>
                </>
              )}
            </div>

            {/* Effect block */}
            <EffectBlock entry={entry.entry} />

            {/* Vote breakdown */}
            <VoteColumns agendaEntry={entry} />

            {i < summary.entries.length - 1 && <Rule />}
          </div>
        ))
      )}

      {/* Net Beneficiaries */}
      {summary.netBeneficiaries.length > 0 && (
        <>
          <Rule />
          <Label>Net Beneficiaries (VP)</Label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
            {summary.netBeneficiaries.map(({ factionId, vpDelta }) => (
              <span
                key={factionId}
                style={{
                  background: 'var(--paper-2)',
                  padding: '1px 5px',
                  border: '1px solid var(--ink-4)',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 'var(--font-micro)',
                  opacity: vpDelta < 0 ? 0.6 : 1,
                }}
              >
                {factionId} {vpDelta > 0 ? '+' : ''}{vpDelta}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
