import React from 'react';
import { FactionDot } from './FactionDot';

interface PodiumEntry {
  factionId: string;
  color: string;
  wins: number;
  gamesPlayed: number;
  avgVp: number;
}

interface Props { top3: PodiumEntry[]; }

export function LeaderboardPodium({ top3 }: Props) {
  // border thickness decreases by rank: 1st=4px, 2nd=2px, 3rd=1px
  const topBorders = ['4px', '2px', '1px'];
  const labels = ['1st', '2nd', '3rd'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
      {top3.slice(0, 3).map((entry, i) => {
        const winRate = entry.gamesPlayed > 0 ? Math.round((entry.wins / entry.gamesPlayed) * 100) : 0;
        return (
          <div
            key={entry.factionId}
            style={{
              borderTop: `${topBorders[i]} solid ${i === 0 ? 'var(--ink)' : 'var(--rule)'}`,
              border: '1px solid var(--rule)',
              borderTopWidth: topBorders[i],
              borderTopColor: i === 0 ? 'var(--ink)' : 'var(--rule)',
              padding: '10px 12px',
              background: i === 0 ? 'var(--paper-2)' : 'var(--paper)',
            }}
          >
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, color: 'var(--ink-2)', letterSpacing: '0.1em' }}>
              {labels[i]}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <FactionDot color={entry.color} size={14} />
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 'var(--font-body)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {entry.factionId}
              </span>
            </div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 'var(--font-display-sm)', color: i === 0 ? 'var(--accent)' : 'var(--ink)', marginTop: 6 }}>
              {winRate}%
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-2)' }}>
              {entry.wins}W · {entry.gamesPlayed}GP · {entry.avgVp.toFixed(1)} avg VP
            </div>
            <div style={{ height: 3, background: 'var(--rule)', marginTop: 8 }}>
              <div style={{ height: '100%', width: `${winRate}%`, background: i === 0 ? 'var(--accent)' : 'var(--ink-3)' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
