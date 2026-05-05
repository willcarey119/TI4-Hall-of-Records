import React from 'react';

interface Series { label: string; color: string; values: number[]; }

export function MultiLineChart({ title, series, height = 110, yMax }: {
  title: string; series: Series[]; height?: number; yMax?: number;
}) {
  const n = Math.max(...series.map(s => s.values.length), 1);
  const max = yMax ?? Math.max(...series.flatMap(s => s.values), 1);
  const W = 300;
  const xStep = W / Math.max(n - 1, 1);

  const toPoints = (vals: number[]) =>
    vals.map((v, i) => `${i * xStep},${height - (v / max) * height}`).join(' ');

  return (
    <div style={{ border: '1px solid var(--rule)', padding: '10px 12px' }}>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--ink)', marginBottom: 6 }}>{title}</div>
      <svg viewBox={`0 0 ${W} ${height}`} style={{ width: '100%', height }}>
        {series.map((s, i) => (
          s.values.length > 1 ? (
            <polyline key={i} points={toPoints(s.values)}
              fill="none" stroke={s.color}
              strokeWidth={i === 0 ? 1.8 : 1}
              strokeLinecap="round" strokeLinejoin="round" />
          ) : null
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' as const }}>
        {series.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 2, background: s.color }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-2)' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SmallMultiples({ title, series, yMax }: {
  title: string; series: Series[]; yMax?: number;
}) {
  const max = yMax ?? Math.max(...series.flatMap(s => s.values), 1);
  const W = 80; const H = 28;

  const toPoints = (vals: number[]) => {
    if (vals.length < 2) return '';
    const xStep = W / Math.max(vals.length - 1, 1);
    return vals.map((v, i) => `${i * xStep},${H - (v / max) * H}`).join(' ');
  };

  return (
    <div style={{ border: '1px solid var(--rule)', padding: '10px 12px' }}>
      {title !== '' && (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, color: 'var(--ink-3)', marginBottom: 8 }}>
          {title} · scale 0–{max}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
        {series.map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
              {s.values.length > 1 && (
                <polyline points={toPoints(s.values)} fill="none" stroke={s.color} strokeWidth={1.2} strokeLinecap="round" />
              )}
            </svg>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-2)' }}>{s.label}</div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 'var(--font-sm)', color: 'var(--ink)' }}>
              {s.values.length > 0 ? (s.values[s.values.length - 1]?.toFixed(1) ?? '—') : '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
