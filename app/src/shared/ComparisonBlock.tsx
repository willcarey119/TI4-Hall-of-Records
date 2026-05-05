import React from 'react';
import { FactionDot } from './FactionDot';

interface CompEntity { label: string; color?: string; }
interface CompRow { metric: string; a: number; b: number; }

export function DivergingComparison({ entityA, entityB, rows }: {
  entityA: CompEntity; entityB: CompEntity; rows: CompRow[];
}) {
  return (
    <div style={{ border: '1px solid var(--rule)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid var(--rule)' }}>
        {[entityA, entityB].map((e, i) => (
          <div key={i} style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, justifyContent: i === 1 ? 'flex-end' as const : 'flex-start' as const }}>
            {e.color !== undefined && <FactionDot color={e.color} size={10} />}
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 'var(--font-sm)' }}>{e.label}</span>
          </div>
        ))}
      </div>
      {rows.map(({ metric, a, b }) => {
        const total = a + b || 1;
        const aFrac = a / total;
        const bFrac = b / total;
        const winner = a > b ? 'a' : b > a ? 'b' : 'tie';
        return (
          <div key={metric} style={{ padding: '6px 10px', borderBottom: '1px solid var(--rule)' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, color: 'var(--ink-3)', textAlign: 'center' as const, marginBottom: 4 }}>{metric}</div>
            <div style={{ display: 'flex', height: 6, gap: 2 }}>
              <div style={{ flex: aFrac, background: winner === 'a' ? 'var(--accent)' : 'var(--ink-4)' }} />
              <div style={{ flex: bFrac, background: winner === 'b' ? 'var(--accent)' : 'var(--ink-4)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' as const, marginTop: 2 }}>
              <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 'var(--font-sm)', color: winner === 'a' ? 'var(--accent)' : 'var(--ink)' }}>{a}</span>
              <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 'var(--font-sm)', color: winner === 'b' ? 'var(--accent)' : 'var(--ink)' }}>{b}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MultiEntityComparison({ metrics, entities }: {
  metrics: string[];
  entities: Array<{ label: string; color?: string; values: number[] }>;
}) {
  return (
    <div style={{ border: '1px solid var(--rule)', overflowX: 'auto' as const }}>
      <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${entities.length}, 1fr)` }}>
        <div />
        {entities.map((e, i) => (
          <div key={i} style={{ padding: '6px 8px', fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: 'var(--font-sm)', borderLeft: '1px solid var(--rule)', textAlign: 'center' as const, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            {e.color !== undefined && <FactionDot color={e.color} size={9} />}
            {e.label}
          </div>
        ))}
        {metrics.map((metric, mi) => {
          const vals = entities.map(e => e.values[mi] ?? 0);
          const best = Math.max(...vals);
          return (
            <React.Fragment key={metric}>
              <div style={{ padding: '5px 8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, color: 'var(--ink-3)', borderTop: '1px solid var(--rule)' }}>{metric}</div>
              {entities.map((e, ei) => {
                const v = e.values[mi] ?? 0;
                return (
                  <div key={ei} style={{ padding: '5px 8px', textAlign: 'center' as const, borderTop: '1px solid var(--rule)', borderLeft: '1px solid var(--rule)', fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 'var(--font-sm)', color: v === best && best > 0 ? 'var(--accent)' : 'var(--ink)' }}>
                    {v}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
