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

function heatColor(intensity: number): string {
  // low (0) → light warm cream; high (1) → dark vermillion accent
  const l = (0.94 - intensity * 0.52).toFixed(2);
  const c = (0.01 + intensity * 0.21).toFixed(2);
  return `oklch(${l} ${c} 25)`;
}

export function HeatmapGrid({ rowLabels, colLabels, values, tooltips, title }: {
  rowLabels: string[];
  colLabels: string[];
  values: number[][];
  tooltips?: string[][];
  title?: string;
}) {
  const LEGEND_STEPS = 8;
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
              const intensity = Math.min(1, Math.max(0, values[ri]?.[ci] ?? 0));
              const tipText = tooltips?.[ri]?.[ci] ?? `${r} × ${col}: ${Math.round(intensity * 100)}%`;
              return (
                <div
                  key={ci}
                  title={tipText}
                  style={{
                    height: 18,
                    background: heatColor(intensity),
                    border: '1px solid var(--paper)',
                    cursor: 'default',
                  }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)' }}>#8</span>
        <div style={{ display: 'flex', flex: 1, height: 8, border: '1px solid var(--rule)', overflow: 'hidden' }}>
          {Array.from({ length: LEGEND_STEPS }, (_, i) => (
            <div key={i} style={{ flex: 1, background: heatColor(i / (LEGEND_STEPS - 1)) }} />
          ))}
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)' }}>#1</span>
      </div>
    </div>
  );
}
