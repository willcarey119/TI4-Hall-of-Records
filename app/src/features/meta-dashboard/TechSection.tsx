import { useState, useMemo } from 'react';
import { useMeta } from './MetaContext';
import { Rule, TechPip, TECH_COLOR_VAR } from '../../shared';
import type { TechColor } from '../../lib/parser/techs';

const COLOR_LABEL: Record<TechColor | 'all', string> = {
  all: 'All', green: 'Biotic', blue: 'Propulsion', yellow: 'Cybernetic', red: 'Warfare', unit: 'Unit',
};

const TABS: ReadonlyArray<TechColor | 'all'> = ['all', 'green', 'blue', 'yellow', 'red', 'unit'];

export function TechSection() {
  const { techStats } = useMeta();
  const [filter, setFilter] = useState<TechColor | 'all'>('all');

  const visibleTechs = useMemo(() => {
    if (techStats === null) return [];
    return filter === 'all' ? techStats.topTechs : techStats.byColor[filter].slice(0, 15);
  }, [techStats, filter]);

  if (techStats === null) {
    return <section id="techs" data-section="techs" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }} />;
  }

  const maxCount = Math.max(1, ...visibleTechs.map(t => t.researchCount));

  return (
    <section id="techs" data-section="techs" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--ink-4)', paddingBottom: 3, marginBottom: 6 }}>
        <span>Techs · Across Games</span>
        <span>{techStats.topTechs.length} top techs</span>
      </div>

      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, fontWeight: 800, lineHeight: 1.1, marginBottom: 8 }}>
        The research log.
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {TABS.map(tab => (
          <button key={tab} type="button" onClick={() => { setFilter(tab); }} style={{ background: filter === tab ? 'var(--ink)' : 'transparent', color: filter === tab ? 'var(--paper)' : 'var(--ink)', border: '1px solid var(--ink)', padding: '2px 6px', cursor: 'pointer' }}>
            {COLOR_LABEL[tab]}
          </button>
        ))}
      </div>

      {visibleTechs.map(t => (
        <div key={t.tech} style={{ display: 'grid', gridTemplateColumns: '8px 1fr 50px 80px 60px', gap: 6, alignItems: 'center', padding: '3px 0', borderBottom: '1px dotted var(--ink-4)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
          <TechPip color={t.color} />
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 10 }}>{t.tech}</span>
          <span style={{ color: 'var(--ink-3)' }}>{t.avgRoundFirstResearched === null ? '—' : `Rnd ${t.avgRoundFirstResearched.toFixed(1)}`}</span>
          <div style={{ background: 'var(--ink-4)', height: 4 }}>
            <div style={{ background: TECH_COLOR_VAR[t.color], height: 4, width: `${(t.researchCount / maxCount) * 100}%` }} />
          </div>
          <span style={{ color: (t.winnerHeldRate ?? 0) >= 0.5 ? 'var(--accent)' : 'var(--ink-3)' }}>
            Won: {t.winnerHeldRate === null ? '—' : `${Math.round(t.winnerHeldRate * 100)}%`}
          </span>
        </div>
      ))}

      <Rule />

      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>
        Winner Possession · Top 10
      </div>
      {[...techStats.topTechs].sort((a, b) => (b.winnerHeldRate ?? 0) - (a.winnerHeldRate ?? 0)).slice(0, 10).map(t => (
        <div key={t.tech} style={{ display: 'flex', gap: 6, padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
          <TechPip color={t.color} />
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 10, flex: 1 }}>{t.tech}</span>
          <span style={{ color: 'var(--ink-3)' }}>{t.winnerHeldCount} of {techStats.totalWinnerGames} winning games</span>
          {(t.winnerHeldRate ?? 0) >= 0.67 && (
            <span style={{ color: 'var(--accent)', textTransform: 'uppercase', fontSize: 7, letterSpacing: '0.1em' }}>★ trend</span>
          )}
        </div>
      ))}
    </section>
  );
}
