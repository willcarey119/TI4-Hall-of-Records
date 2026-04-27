/* global React */
// Tiny shared wireframe primitives used across all artboards.

const Mast = ({ title = 'THE GALACTIC CHRONICLE', vol = 'Vol. IV', issue = 'No. 1', date = 'Round V · Tue 26 Apr' }) => (
  <div className="mast">
    <div style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.12em' }}>{vol} · {issue}</div>
    <div className="mast-title">{title}</div>
    <div className="mast-meta">{date}</div>
  </div>
);

const Kicker = ({ left, right }) => (
  <div className="kicker"><span>{left}</span><span>{right}</span></div>
);

const Headline = ({ children, size = 24, style }) => (
  <div className="headline" style={{ fontSize: size, ...style }}>{children}</div>
);

const Deck = ({ children, style }) => (
  <div className="deck" style={{ fontSize: 11, ...style }}>{children}</div>
);

const Byline = ({ children, style }) => (
  <div className="byline" style={style}>{children}</div>
);

const Label = ({ children, style }) => (
  <span className="label" style={style}>{children}</span>
);

const Rule = ({ kind = 'thin', style }) => (
  <hr className={kind === 'double' ? 'rule-double' : kind === 'thick' ? 'rule-thick' : 'rule'} style={style} />
);

const Box = ({ children, style, ...rest }) => (
  <div style={style} {...rest}>{children}</div>
);

const Placeholder = ({ children, style }) => (
  <div className="placeholder" style={style}>{children}</div>
);

const Note = ({ children, style, arrow = true }) => (
  <div className={'note' + (arrow ? ' note-arrow' : '')} style={style}>{children}</div>
);

// 6 sample factions used across artboards
const FACTIONS = [
  { id: 'sol', name: 'Federation of Sol', short: 'Sol', cls: 'f-sol' },
  { id: 'hac', name: 'Emirates of Hacan', short: 'Hacan', cls: 'f-hac' },
  { id: 'xxc', name: "Xxcha Kingdom", short: 'Xxcha', cls: 'f-xxc' },
  { id: 'arb', name: 'Arborec', short: 'Arborec', cls: 'f-arb' },
  { id: 'emir', name: 'Yssaril Tribes', short: 'Yssaril', cls: 'f-emir' },
  { id: 'naal', name: 'Naalu Collective', short: 'Naalu', cls: 'f-naal' },
];

const FactionDot = ({ f, size = 8 }) => (
  <span className={f.cls} style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: 'currentColor', verticalAlign: 'middle' }} />
);

const FactionChip = ({ f, vp }) => (
  <span className={'faction-chip ' + f.cls}>{f.short}{vp != null && <span className="num" style={{ color: 'var(--ink)', marginLeft: 4 }}>{vp}</span>}</span>
);

// Sketchy/dashed-edge frame for a content card
const SketchFrame = ({ children, style }) => (
  <div style={{
    border: '1px solid var(--rule)',
    background: 'var(--paper)',
    padding: 8,
    position: 'relative',
    ...style,
  }}>{children}</div>
);

// Tiny inline bar — used in lots of places for small bar charts
const InlineBar = ({ pct, color = 'var(--ink)', height = 5, style }) => (
  <div style={{ width: '100%', height, background: 'oklch(0.18 0.01 60 / 0.08)', ...style }}>
    <div style={{ width: `${pct}%`, height: '100%', background: color }} />
  </div>
);

Object.assign(window, { Mast, Kicker, Headline, Deck, Byline, Label, Rule, Box, Placeholder, Note, FACTIONS, FactionDot, FactionChip, SketchFrame, InlineBar });
