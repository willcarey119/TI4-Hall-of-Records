import React from 'react';

export function BarHistogram({ label, buckets, medianIdx }: {
  label: string;
  buckets: Array<{ label: string; count: number }>;
  medianIdx?: number;
}) {
  const max = Math.max(...buckets.map(b => b.count), 1);
  return (
    <div style={{ border: '1px solid var(--rule)', padding: '10px 12px' }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, color: 'var(--ink-3)', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
        {buckets.map((b, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', height: '100%', justifyContent: 'flex-end' as const }}>
            <div style={{ width: '100%', background: i === medianIdx ? 'var(--accent)' : 'var(--ink-3)', height: `${(b.count / max) * 100}%`, minHeight: b.count > 0 ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        {buckets.map((b, i) => (
          <div key={i} style={{ flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', textAlign: 'center' as const }}>{b.label}</div>
        ))}
      </div>
    </div>
  );
}

// Distinct color per rank. Warm (high pick) → cool → muted (low pick).
const RANK_COLORS = [
  'oklch(0.55 0.22 25)',   // #1 vermillion
  'oklch(0.60 0.20 48)',   // #2 orange-red
  'oklch(0.67 0.17 68)',   // #3 amber
  'oklch(0.74 0.14 88)',   // #4 gold
  'oklch(0.55 0.15 148)',  // #5 forest green
  'oklch(0.52 0.13 210)',  // #6 teal-blue
  'oklch(0.48 0.12 258)',  // #7 indigo
  'oklch(0.80 0.03 60)',   // #8 warm light gray
];

// Dark text on light backgrounds (ranks 4, 8); white on everything else.
const RANK_TEXT_DARK = [false, false, false, true, false, false, false, true];

export function HeatmapGrid({ rowLabels, colLabels, ranks, tooltips, title }: {
  rowLabels: string[];
  colLabels: string[];
  ranks: number[][];
  tooltips?: string[][];
  title?: string;
}) {
  return (
    <div style={{ border: '1px solid var(--rule)', padding: '10px 12px', overflowX: 'auto' as const }}>
      {title && (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, color: 'var(--ink-3)', marginBottom: 8 }}>{title}</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${colLabels.length}, 1fr)`, gap: 2 }}>
        <div />
        {colLabels.map((c, i) => (
          <div key={i} title={c} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', textAlign: 'center' as const, paddingBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {c.slice(0, 4)}
          </div>
        ))}
        {rowLabels.map((r, ri) => (
          <React.Fragment key={ri}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', paddingRight: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r}</div>
            {colLabels.map((col, ci) => {
              const rank = ranks[ri]?.[ci] ?? RANK_COLORS.length;
              const colorIdx = Math.min(rank - 1, RANK_COLORS.length - 1);
              const bg = RANK_COLORS[colorIdx] ?? RANK_COLORS[RANK_COLORS.length - 1];
              const textDark = RANK_TEXT_DARK[colorIdx] ?? false;
              const tipText = tooltips?.[ri]?.[ci] ?? `${r} × ${col}: #${rank}`;
              return (
                <div
                  key={ci}
                  title={tipText}
                  style={{
                    height: 22,
                    background: bg,
                    border: '1px solid var(--paper)',
                    cursor: 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    color: textDark ? 'var(--ink)' : '#fff',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}>
                    {rank}
                  </span>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px 8px', marginTop: 10 }}>
        {RANK_COLORS.map((color, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 16, height: 16,
              background: color,
              border: '1px solid var(--rule)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 700, color: RANK_TEXT_DARK[i] ? 'var(--ink)' : '#fff', lineHeight: 1 }}>{i + 1}</span>
            </div>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', whiteSpace: 'nowrap' as const }}>
              {i === 0 ? '#1 Most Picked' : i === RANK_COLORS.length - 1 ? '#8 Least' : `#${i + 1}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
