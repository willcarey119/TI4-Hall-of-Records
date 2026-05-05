import { FactionDot } from './FactionDot';

interface Category { label: string; color: string; value: number; }

export function StackedRowBreakdown({ title, categories }: { title: string; categories: Category[] }) {
  const total = categories.reduce((s, c) => s + c.value, 0) || 1;
  return (
    <div style={{ border: '1px solid var(--rule)', padding: '10px 12px' }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, color: 'var(--ink-3)', marginBottom: 8 }}>{title}</div>
      {categories.map((c, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 36px', alignItems: 'center', gap: 8, padding: '3px 0', borderBottom: '1px solid var(--rule)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
            <FactionDot color={c.color} size={10} />
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-sm)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.label}</span>
          </div>
          <div style={{ background: 'var(--paper-2)', height: 6, position: 'relative' as const }}>
            <div style={{ position: 'absolute' as const, left: 0, top: 0, height: '100%', width: `${(c.value / total) * 100}%`, background: c.color }} />
          </div>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 'var(--font-sm)', textAlign: 'right' as const }}>{c.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Treemap({ title, categories }: { title: string; categories: Category[] }) {
  const total = categories.reduce((s, c) => s + c.value, 0) || 1;
  const sorted = [...categories].sort((a, b) => b.value - a.value);
  const top3 = sorted.slice(0, 3);
  const colTemplate = top3.map(c => `${(c.value / total * 100).toFixed(1)}fr`).join(' ');

  return (
    <div style={{ border: '1px solid var(--rule)', padding: '10px 12px' }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, color: 'var(--ink-3)', marginBottom: 8 }}>{title}</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: top3.length > 0 ? colTemplate : '1fr',
        gap: 2,
        height: 120,
      }}>
        {sorted.map((c, i) => (
          <div
            key={i}
            style={{
              background: c.color,
              padding: 6,
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'flex-end' as const,
              opacity: i === 0 ? 1 : 0.75,
              overflow: 'hidden',
            }}
          >
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: '#fff', textTransform: 'uppercase' as const, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.label}</div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 'var(--font-sm)', color: '#fff' }}>{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
