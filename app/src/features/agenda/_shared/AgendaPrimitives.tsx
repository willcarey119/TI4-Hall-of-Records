import type { CSSProperties } from 'react';
import { type AgendaDisplayEntry } from '../../../lib/agenda/buildAgendaSummary';
import { Rule } from '../../../shared';

export function EffectBlock({ entry }: { entry: AgendaDisplayEntry['entry'] }) {
  if (entry === null) return null;

  const blockStyle: CSSProperties = {
    background: 'var(--paper-2)',
    borderLeft: '2px solid var(--ink-4)',
    padding: '6px 8px',
    margin: '6px 0',
    fontSize: 'var(--font-sm)',
    lineHeight: 1.5,
  };
  const labelStyle = (color: string): CSSProperties => ({
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 'var(--font-micro)',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color,
    display: 'block',
  });
  const textStyle: CSSProperties = {
    color: 'var(--ink-2)',
    fontFamily: "'Newsreader', Georgia, serif",
    display: 'block',
    marginTop: 1,
    marginBottom: 4,
  };

  if (entry.elect === null) {
    // The discriminated union requires forEffect and againstEffect when elect === null.
    // The `!== ''` guard surfaces missing catalog data instead of silently rendering
    // an empty effect line under the "For:" / "Against:" label.
    return (
      <div style={blockStyle}>
        {entry.forEffect !== '' && (
          <>
            <span style={labelStyle('var(--accent)')}>For:</span>
            <span style={textStyle}>{entry.forEffect}</span>
          </>
        )}
        {entry.againstEffect !== '' && (
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
      <span style={{ ...textStyle, marginBottom: 0 }}>{entry.effect}</span>
    </div>
  );
}

export function VoteColumns({ agendaEntry }: { agendaEntry: AgendaDisplayEntry }) {
  const { votes, entry, totalFor, totalAgainst, electedFaction } = agendaEntry;
  const isElect = entry !== null && entry.elect !== null;

  if (isElect && electedFaction !== undefined) {
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
                  fontSize: 'var(--font-micro)',
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
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-sm)', padding: '1px 0' }}
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

  const forVoters  = votes.filter((v) => v.outcome === 'For');
  const againstVoters = votes.filter((v) => v.outcome !== 'For');

  const colLabel = (label: string, total: number, color: string) => (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 'var(--font-micro)',
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
          <div key={v.faction} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-sm)', padding: '1px 0' }}>
            <span style={{ flex: 1 }}>{v.faction}</span>
            <strong>{v.votes}</strong>
          </div>
        ))}
      </div>
      <div>
        {colLabel('Against', totalAgainst, 'var(--cool)')}
        <Rule />
        {againstVoters.map((v) => (
          <div key={v.faction} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-sm)', padding: '1px 0' }}>
            <span style={{ flex: 1 }}>{v.faction}</span>
            <strong>{v.votes}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
