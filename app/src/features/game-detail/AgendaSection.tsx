// app/src/features/game-detail/AgendaSection.tsx
import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildAgendaSummary, type AgendaDisplayEntry } from '../../lib/agenda/buildAgendaSummary';
import { Label, Rule } from '../../shared';

const INDEX_LABEL = ['I', 'II'] as const;

function EffectBlock({ entry }: { entry: AgendaDisplayEntry['entry'] }) {
  if (entry === null) return null;

  const blockStyle: React.CSSProperties = {
    background: 'var(--paper-2)',
    borderLeft: '2px solid var(--ink-4)',
    padding: '6px 8px',
    margin: '6px 0',
    fontSize: 10,
    lineHeight: 1.5,
  };
  const labelStyle = (color: string): React.CSSProperties => ({
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color,
    display: 'block',
  });
  const textStyle: React.CSSProperties = {
    color: 'var(--ink-2)',
    fontFamily: "'Newsreader', Georgia, serif",
    display: 'block',
    marginTop: 1,
    marginBottom: 4,
  };

  if (entry.elect === null) {
    return (
      <div style={blockStyle}>
        {entry.forEffect && (
          <>
            <span style={labelStyle('var(--accent)')}>For:</span>
            <span style={textStyle}>{entry.forEffect}</span>
          </>
        )}
        {entry.againstEffect && (
          <>
            <span style={labelStyle('var(--cool)')}>Against:</span>
            <span style={{ ...textStyle, marginBottom: 0 }}>{entry.againstEffect}</span>
          </>
        )}
      </div>
    );
  }

  const electLabel = `Elect ${entry.elect.replace(/-/g, ' ')} · Effect:`;
  return (
    <div style={blockStyle}>
      {entry.trigger && (
        <span style={{ ...textStyle, color: 'var(--ink-3)', fontStyle: 'italic', marginBottom: 6 }}>
          {entry.trigger}
        </span>
      )}
      <span style={labelStyle('var(--ink-3)')}>{electLabel}</span>
      {entry.effect && (
        <span style={{ ...textStyle, marginBottom: 0 }}>{entry.effect}</span>
      )}
    </div>
  );
}

function VoteColumns({ agendaEntry }: { agendaEntry: AgendaDisplayEntry }) {
  const { votes, entry, totalFor, totalAgainst, electedFaction } = agendaEntry;
  const isElect = entry !== null && entry.elect !== null;

  if (isElect && electedFaction !== undefined) {
    // Group votes by candidate
    const byCandidate: Record<string, Array<{ faction: string; votes: number }>> = {};
    for (const v of votes) {
      if (!byCandidate[v.outcome]) byCandidate[v.outcome] = [];
      byCandidate[v.outcome]!.push({ faction: v.faction, votes: v.votes });
    }
    const candidateEntries = Object.entries(byCandidate).sort(([, a], [, b]) => {
      const sumA = a.reduce((s, x) => s + x.votes, 0);
      const sumB = b.reduce((s, x) => s + x.votes, 0);
      return sumB - sumA;
    });

    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(candidateEntries.length, 3)}, 1fr)`, gap: 8 }}>
        {candidateEntries.map(([candidate, voters]) => {
          const total = voters.reduce((s, v) => s + v.votes, 0);
          const isWinner = candidate === electedFaction;
          return (
            <div key={candidate}>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 8,
                  fontWeight: 700,
                  color: isWinner ? 'var(--accent)' : 'var(--ink-3)',
                  marginBottom: 3,
                }}
              >
                {candidate} · {total}
              </div>
              <Rule />
              {voters.map((v) => (
                <div
                  key={v.faction}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '1px 0' }}
                >
                  <span style={{ flex: 1 }}>{v.faction}</span>
                  <strong>{v.votes}</strong>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  // FOR / AGAINST layout
  const forVoters  = votes.filter((v) => v.outcome === 'For');
  const againstVoters = votes.filter((v) => v.outcome !== 'For');

  const colLabel = (label: string, total: number, color: string) => (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 8,
        fontWeight: 700,
        color,
        marginBottom: 3,
      }}
    >
      {label} · {total}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <div>
        {colLabel('For', totalFor, 'var(--accent)')}
        <Rule />
        {forVoters.map((v) => (
          <div key={v.faction} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '1px 0' }}>
            <span style={{ flex: 1 }}>{v.faction}</span>
            <strong>{v.votes}</strong>
          </div>
        ))}
      </div>
      <div>
        {colLabel('Against', totalAgainst, 'var(--cool)')}
        <Rule />
        {againstVoters.map((v) => (
          <div key={v.faction} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '1px 0' }}>
            <span style={{ flex: 1 }}>{v.faction}</span>
            <strong>{v.votes}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

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
          fontSize: 8,
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
          fontSize: 17,
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 2,
        }}
      >
        Laws of the Realm.
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
        {summary.deckText}
      </div>

      <Rule weight="double" />

      {summary.entries.length === 0 ? (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color: 'var(--ink-3)',
            padding: '8px 0',
          }}
        >
          No agendas resolved this game.
        </div>
      ) : (
        summary.entries.map((entry, i) => (
          <div key={i}>
            {/* Round label */}
            <Label>Round {entry.round} · Agenda {INDEX_LABEL[(entry.indexInRound - 1) as 0 | 1]}</Label>

            {/* Agenda name */}
            <div
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: 15,
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
                  fontSize: 7,
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
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'var(--ink-3)' }}>
                  Elect: {entry.entry?.elect?.replace(/-/g, ' ')} · <strong style={{ color: 'var(--ink)' }}>{entry.electedFaction} elected</strong>
                </span>
              ) : (
                <>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 8,
                      fontWeight: 700,
                      color: entry.passed ? 'var(--ink)' : 'var(--ink-3)',
                    }}
                  >
                    {entry.passed ? 'PASSED' : 'failed'}
                  </span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'var(--ink-3)' }}>
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
                  fontSize: 9,
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
