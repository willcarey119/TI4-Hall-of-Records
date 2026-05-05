/* global React */
// Shared lo-fi wireframe primitives for the TI4 Hall of Records element kit.
// Every artboard is monochrome ink-on-paper, dashed placeholders, mono labels.

const { useState } = React;

// ── Type primitives ─────────────────────────────────────────────────────────
const Display = ({ size = 28, children, style }) => (
  <div className="wf-display" style={{ fontSize: size, ...style }}>{children}</div>
);
const Headline = ({ size = 18, children, style }) => (
  <div className="wf-headline" style={{ fontSize: size, ...style }}>{children}</div>
);
const Deck = ({ size = 13, children, style }) => (
  <div className="wf-deck" style={{ fontSize: size, ...style }}>{children}</div>
);
const Body = ({ size = 13, children, style }) => (
  <div className="wf-body" style={{ fontSize: size, ...style }}>{children}</div>
);
const Mono = ({ size = 11, children, style }) => (
  <span className="wf-mono" style={{ fontSize: size, ...style }}>{children}</span>
);
const Num = ({ size = 32, children, style }) => (
  <span className="wf-num" style={{ fontSize: size, ...style }}>{children}</span>
);
const NumMono = ({ size = 13, children, style }) => (
  <span className="wf-num-mono" style={{ fontSize: size, ...style }}>{children}</span>
);
const Label = ({ children, style }) => (
  <div className="wf-label" style={style}>{children}</div>
);
const Kicker = ({ children, style }) => (
  <div className="wf-kicker" style={style}>{children}</div>
);

// ── Rules ───────────────────────────────────────────────────────────────────
const Rule = ({ kind = 'thin', style }) => {
  const cls = kind === 'double' ? 'wf-rule-double'
            : kind === 'thick'  ? 'wf-rule-thick'
            : kind === 'soft'   ? 'wf-rule-soft'
            : 'wf-rule';
  return <hr className={cls} style={{ margin: '6px 0', ...style }} />;
};

// ── Placeholders ────────────────────────────────────────────────────────────
const Ph = ({ children, style, solid = false }) => (
  <div className={solid ? 'wf-ph-solid' : 'wf-ph'} style={style}>{children}</div>
);

// ── Faction chip ────────────────────────────────────────────────────────────
// In lo-fi, all swatches are ink-tone (no faction color). A small visual variant
// is encoded by ink shade so 3-4 factions can be differentiated by eye.
const INK_SHADES = [
  'var(--ink)',
  'var(--ink-2)',
  'var(--ink-3)',
  'var(--ink-4)',
  'oklch(0.42 0.01 60)',
  'oklch(0.6 0.01 60)',
];
const Chip = ({ name, vp, winner = false, shade = 0, style }) => (
  <span className={'wf-chip' + (winner ? ' wf-chip-winner' : '')} style={style}>
    <span className="wf-swatch" style={{ background: INK_SHADES[shade % INK_SHADES.length] }} />
    {name}
    {vp !== undefined && (
      <span className="wf-mono" style={{ marginLeft: 2, color: winner ? 'var(--accent)' : 'var(--ink)' }}>
        {winner ? '✦' : ''}{vp}
      </span>
    )}
  </span>
);

// Inline color swatch only (for tables / leaderboards)
const Swatch = ({ shade = 0, size = 10, style }) => (
  <span className="wf-swatch" style={{ width: size, height: size, background: INK_SHADES[shade % INK_SHADES.length], ...style }} />
);

// ── Bars ────────────────────────────────────────────────────────────────────
const Bar = ({ pct, height = 6, fill = 'var(--ink)', track = 'oklch(0.18 0.01 60 / 0.08)', style }) => (
  <div style={{ width: '100%', height, background: track, ...style }}>
    <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', background: fill }} />
  </div>
);
// Stacked segment bar (segments share total = 100)
const StackBar = ({ segments, height = 8, style }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div style={{ display: 'flex', width: '100%', height, ...style }}>
      {segments.map((s, i) => (
        <div key={i} title={s.label} style={{
          flex: s.value / total,
          background: s.fill || INK_SHADES[i % INK_SHADES.length],
          borderRight: i < segments.length - 1 ? '1px solid var(--paper)' : 'none',
        }} />
      ))}
    </div>
  );
};

// ── Sparkline (CSS-only, no SVG path complexity beyond a polyline) ─────────
const Sparkline = ({ values, width = 120, height = 28, stroke = 'var(--ink)', strokeWidth = 1.2 }) => {
  if (!values || values.length === 0) return <div style={{ width, height }} />;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

// Multi-line sparkline (for VP race style)
const MultiSpark = ({ series, width = 220, height = 80, highlight = 0 }) => {
  const all = series.flatMap(s => s.values);
  const max = Math.max(...all, 10);
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {/* baseline grid */}
      <line x1="0" y1={height - 0.5} x2={width} y2={height - 0.5} stroke="var(--ink-4)" strokeWidth="1" />
      <line x1="0.5" y1="0" x2="0.5" y2={height} stroke="var(--ink-4)" strokeWidth="1" />
      {series.map((s, i) => {
        const pts = s.values.map((v, idx) => {
          const x = (idx / (s.values.length - 1 || 1)) * width;
          const y = height - (v / max) * (height - 4) - 2;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
        const isHi = i === highlight;
        return (
          <polyline key={i} points={pts}
            fill="none"
            stroke={isHi ? 'var(--accent)' : INK_SHADES[i % INK_SHADES.length]}
            strokeWidth={isHi ? 1.8 : 1}
            strokeLinejoin="round" />
        );
      })}
    </svg>
  );
};

// ── Card wrapper ────────────────────────────────────────────────────────────
const Card = ({ children, tight = false, loose = false, style, ...rest }) => (
  <div className={'wf-card' + (tight ? ' wf-card-tight' : '') + (loose ? ' wf-card-loose' : '')} style={style} {...rest}>
    {children}
  </div>
);

// ── Tag ─────────────────────────────────────────────────────────────────────
const Tag = ({ kind = 'solid', children, style }) => {
  const cls = kind === 'outline' ? 'wf-tag-outline'
            : kind === 'accent'  ? 'wf-tag wf-tag-accent'
            : 'wf-tag';
  return <span className={cls} style={style}>{children}</span>;
};

// ── Section + variant chrome (used inside the kit page itself) ──────────────
const KitSection = ({ num, title, deck, children }) => (
  <div style={{ padding: '24px 28px 32px' }}>
    <div className="kit-section-head">
      <div className="kit-num">§ {num}</div>
      <h2>{title}</h2>
      <div className="kit-deck">{deck}</div>
    </div>
    <div style={{ marginTop: 16 }}>{children}</div>
  </div>
);

const VariantRow = ({ children, cols = 3, gap = 16 }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gap,
    alignItems: 'start',
  }}>
    {children}
  </div>
);

const Variant = ({ id, title, when, avoid, children, height = 240, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span className="wf-mono" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{id}</span>
      <span className="wf-headline" style={{ fontSize: 14 }}>{title}</span>
    </div>
    <div className="wf" style={{ height, border: '1px solid var(--ink-4)', padding: 12, overflow: 'hidden' }}>
      {children}
    </div>
    <div className="kit-rationale">
      {when && <span className="kr-when use">When to use</span>}{when}
      {avoid && <><span className="kr-when avoid" style={{ marginTop: 6 }}>Watch out</span>{avoid}</>}
    </div>
  </div>
);

// Sample data shapes that mirror the parsed game shape
const SAMPLE_FACTIONS = [
  { id: 'sol',   short: 'SOL',     name: 'Federation of Sol',     shade: 0, vp: 10 },
  { id: 'hac',   short: 'HACAN',   name: 'Emirates of Hacan',     shade: 1, vp: 9 },
  { id: 'xxc',   short: 'XXCHA',   name: 'Xxcha Kingdom',         shade: 2, vp: 8 },
  { id: 'arb',   short: 'ARBOREC', name: 'Arborec',               shade: 3, vp: 6 },
  { id: 'yss',   short: 'YSSARIL', name: 'Yssaril Tribes',        shade: 4, vp: 5 },
  { id: 'naa',   short: 'NAALU',   name: 'Naalu Collective',      shade: 5, vp: 4 },
];

// expose
Object.assign(window, {
  Display, Headline, Deck, Body, Mono, Num, NumMono, Label, Kicker,
  Rule, Ph, Chip, Swatch, Bar, StackBar, Sparkline, MultiSpark, Card, Tag,
  KitSection, VariantRow, Variant,
  SAMPLE_FACTIONS, INK_SHADES,
});
