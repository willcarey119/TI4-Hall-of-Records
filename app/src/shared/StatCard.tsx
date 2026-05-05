import React from 'react';

type Variant = 'anchor' | 'delta' | 'sparkline' | 'rank' | 'stack' | 'hero' | 'rate' | 'quote';

interface StackItem { label: string; value: string | number; }

interface StatCardProps {
  variant: Variant;
  label: string;
  value: string | number;
  caption?: string;
  delta?: number;
  rank?: number;
  percentile?: number;
  numerator?: number;
  denominator?: number;
  footnote?: string;
  stack?: StackItem[];
}

export function StatCard(props: StatCardProps) {
  const { variant, label, value, caption, delta, rank, percentile, numerator, denominator, footnote, stack } = props;

  const base: React.CSSProperties = {
    background: 'var(--paper-2)',
    border: '1px solid var(--rule)',
    padding: '10px 12px',
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 'var(--font-micro)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--ink-3)',
  };
  const bigNum: React.CSSProperties = {
    fontFamily: "'Newsreader', Georgia, serif",
    fontWeight: 800,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--ink)',
  };

  if (variant === 'anchor') return (
    <div style={base}>
      <div style={labelStyle}>{label}</div>
      <div style={{ ...bigNum, fontSize: 'var(--font-display-md)', marginTop: 4 }}>{value}</div>
      {caption && <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 4 }}>{caption}</div>}
    </div>
  );

  if (variant === 'delta') {
    const dir = (delta ?? 0) >= 0 ? '↑' : '↓';
    const col = (delta ?? 0) >= 0 ? 'var(--moss)' : 'var(--accent)';
    return (
      <div style={base}>
        <div style={labelStyle}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <span style={{ ...bigNum, fontSize: 'var(--font-display-md)' }}>{value}</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-sm)', color: col }}>{dir}{Math.abs(delta ?? 0)}</span>
        </div>
      </div>
    );
  }

  if (variant === 'rank') return (
    <div style={base}>
      <div style={labelStyle}>{label}</div>
      <div style={{ ...bigNum, fontSize: 'var(--font-display-lg)', color: 'var(--accent)', marginTop: 4 }}>#{rank}</div>
      {percentile != null && (
        <>
          <div style={{ background: 'var(--rule)', height: 3, marginTop: 8, position: 'relative' as const }}>
            <div style={{ position: 'absolute' as const, left: 0, top: 0, height: '100%', width: `${percentile}%`, background: 'var(--accent)' }} />
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 2 }}>{percentile}th percentile</div>
        </>
      )}
    </div>
  );

  if (variant === 'stack') return (
    <div style={base}>
      <div style={labelStyle}>{label}</div>
      <div style={{ borderTop: '1px solid var(--rule)', marginTop: 4 }}>
        {(stack ?? []).map(({ label: l, value: v }, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0', borderBottom: '1px solid var(--rule)' }}>
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-sm)', color: 'var(--ink-2)' }}>{l}</span>
            <span style={{ ...bigNum, fontSize: 'var(--font-display-sm)' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (variant === 'hero') return (
    <div style={{ ...base, padding: '16px 14px' }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, color: 'var(--accent)', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ ...bigNum, fontSize: 'clamp(var(--font-display-md), 10cqi, 84px)', marginTop: 4 }}>{value}</div>
      {caption && <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-body)', color: 'var(--ink-2)', marginTop: 4 }}>{caption}</div>}
      {footnote && <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 8, borderTop: '1px solid var(--rule)', paddingTop: 4 }}>{footnote}</div>}
    </div>
  );

  if (variant === 'rate') return (
    <div style={base}>
      <div style={labelStyle}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <span style={{ ...bigNum, fontSize: 'var(--font-display-md)' }}>{numerator}</span>
        <span style={{ ...bigNum, fontSize: 'var(--font-display-sm)', color: 'var(--ink-3)' }}>/{denominator}</span>
        {numerator != null && denominator != null && denominator > 0 && (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-sm)', color: 'var(--ink-3)', marginLeft: 8 }}>
            {Math.round((numerator / denominator) * 100)}%
          </span>
        )}
      </div>
    </div>
  );

  if (variant === 'quote') return (
    <div style={base}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, color: 'var(--accent)', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ borderTop: '1px solid var(--rule)', marginTop: 4 }} />
      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 'var(--font-display-sm)', color: 'var(--ink)', marginTop: 4 }}>{value}</div>
      {caption && <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 6 }}>{caption}</div>}
    </div>
  );

  // sparkline variant — label + value + caption; children would be passed externally if needed
  return (
    <div style={base}>
      <div style={labelStyle}>{label}</div>
      <div style={{ ...bigNum, fontSize: 'var(--font-display-md)', marginTop: 4 }}>{value}</div>
      {caption && <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)' }}>{caption}</div>}
    </div>
  );
}
