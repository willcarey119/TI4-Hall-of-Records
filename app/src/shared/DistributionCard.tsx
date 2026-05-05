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

export function HeatmapGrid({ rowLabels, colLabels, values }: {
  rowLabels: string[];
  colLabels: string[];
  values: number[][];
}) {
  return (
    <div style={{ border: '1px solid var(--rule)', padding: '10px 12px', overflowX: 'auto' as const }}>
      <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${colLabels.length}, 1fr)`, gap: 2 }}>
        <div />
        {colLabels.map((c, i) => (
          <div key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', textAlign: 'center' as const, paddingBottom: 2 }}>{c}</div>
        ))}
        {rowLabels.map((r, ri) => (
          <React.Fragment key={ri}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', paddingRight: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r}</div>
            {colLabels.map((_, ci) => {
              const intensity = Math.min(1, Math.max(0, values[ri]?.[ci] ?? 0));
              return (
                <div key={ci} style={{
                  height: 18,
                  background: `oklch(0.18 0.01 60 / ${intensity})`,
                  border: '1px solid var(--paper)',
                }} />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
