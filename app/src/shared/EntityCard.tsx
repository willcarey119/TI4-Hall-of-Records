import React from 'react';
import { FactionDot } from './FactionDot';

type Variant = 'newsprint' | 'tabular' | 'player' | 'chip';

interface Props {
  variant: Variant;
  factionId: string;
  color: string;
  gamesPlayed: number;
  wins: number;
  avgVp: number;
  winner?: boolean;
  playerName?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function EntityCard({ variant, factionId, color, gamesPlayed, wins, avgVp, winner, playerName, onClick, children }: Props) {
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

  if (variant === 'newsprint') {
    return (
      <div onClick={onClick} style={{
        border: '1px solid var(--rule)', padding: '10px 12px',
        cursor: onClick ? 'pointer' : 'default',
        background: winner ? 'var(--paper-2)' : 'var(--paper)',
      }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, color: 'var(--accent)', letterSpacing: '0.1em' }}>
          The Throne
        </div>
        <div style={{ borderTop: '1px solid var(--rule)', margin: '4px 0' }} />
        <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontStyle: 'italic', fontSize: 'var(--font-display-sm)', color: 'var(--ink)', lineHeight: 1.05, wordBreak: 'break-word' as const }}>
          {factionId}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 'var(--font-display-sm)', color: 'var(--accent)' }}>{winRate}%</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-2)', textTransform: 'uppercase' as const }}>win rate</span>
        </div>
        <div style={{ marginTop: 4 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-2)' }}>{gamesPlayed} GP · {wins} W · {avgVp.toFixed(1)} avg VP</span>
        </div>
        {children !== undefined && (
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--rule)' }}>
            {children}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'tabular') {
    return (
      <div onClick={onClick} style={{
        display: 'grid', gridTemplateColumns: '24px 1fr 40px 40px 52px',
        alignItems: 'center', gap: 8,
        padding: '5px 8px',
        borderBottom: '1px solid var(--rule)',
        cursor: onClick ? 'pointer' : 'default',
        background: winner ? 'var(--paper-2)' : 'transparent',
      }}>
        <FactionDot color={color} size={14} />
        <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-sm)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{factionId}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-2)', textAlign: 'right' as const }}>{gamesPlayed}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-2)', textAlign: 'right' as const }}>{wins}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-2)', textAlign: 'right' as const }}>{winRate}%</span>
      </div>
    );
  }

  if (variant === 'chip') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 6px', border: '1px solid var(--rule)',
        background: winner ? 'var(--accent)' : 'var(--paper-2)',
      }}>
        <FactionDot color={color} size={8} />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: winner ? 'var(--paper)' : 'var(--ink)' }}>
          {factionId}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: winner ? 'var(--paper)' : 'var(--ink-3)' }}>
          {avgVp.toFixed(1)}
        </span>
      </span>
    );
  }

  // player variant
  return (
    <div style={{ border: '1px solid var(--rule)', padding: '10px 12px' }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>Player</div>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 'var(--font-subhead)', color: 'var(--ink)', marginTop: 2 }}>{playerName ?? '—'}</div>
      <div style={{ borderTop: '1px solid var(--rule)', margin: '6px 0' }} />
      <div style={{ display: 'flex', gap: 12 }}>
        {([['GP', gamesPlayed], ['W', wins], ['Win%', `${winRate}%`]] as [string, string | number][]).map(([k, v]) => (
          <div key={String(k)}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', textTransform: 'uppercase' as const }}>{k}</div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 'var(--font-display-sm)', color: 'var(--ink)' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
