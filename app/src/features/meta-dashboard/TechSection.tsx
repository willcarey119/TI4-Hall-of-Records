import { useState, useMemo } from 'react';
import { useMeta } from './MetaContext';
import { Rule, TechPip, TECH_COLOR_VAR, SectionDesc, Tooltip } from '../../shared';
import type { TechColor } from '../../lib/parser/techs';

const COLOR_LABEL: Record<TechColor | 'all', string> = {
  all: 'All', green: 'Biotic', blue: 'Propulsion', yellow: 'Cybernetic', red: 'Warfare', unit: 'Unit',
};

const TABS: ReadonlyArray<TechColor | 'all'> = ['all', 'green', 'blue', 'yellow', 'red', 'unit'];

export function TechSection() {
  const { techStats, techPaths } = useMeta();
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
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--ink-4)', paddingBottom: 3, marginBottom: 6 }}>
        <span>Techs · Across Games</span>
        <span>{techStats.topTechs.length} top techs</span>
      </div>

      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-subhead)', fontWeight: 800, lineHeight: 1.1, marginBottom: 8 }}>
        The research log.
      </div>

      <SectionDesc>
        Most-researched technologies across all sessions — how many times each tech was acquired, which round it typically appears, and how often the game's winner held it. Filter by tech color to isolate a research path.
      </SectionDesc>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {TABS.map(tab => (
          <button key={tab} type="button" onClick={() => { setFilter(tab); }} style={{ background: filter === tab ? 'var(--ink)' : 'transparent', color: filter === tab ? 'var(--paper)' : 'var(--ink)', border: '1px solid var(--ink)', padding: '2px 6px', cursor: 'pointer' }}>
            {COLOR_LABEL[tab]}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '8px 1fr 50px 80px 60px', gap: 6, alignItems: 'center', padding: '3px 0', borderBottom: '1px solid var(--rule)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        <span />
        <span>Tech</span>
        <span style={{ display: 'flex', alignItems: 'center' }}>Avg Rnd<Tooltip text="Average round number when this tech was first researched across all games where it appeared." /></span>
        <span style={{ display: 'flex', alignItems: 'center' }}>Frequency<Tooltip text="Bar width = research count relative to the most-researched tech in this view. Wider = researched more often." /></span>
        <span style={{ display: 'flex', alignItems: 'center' }}>Won%<Tooltip text="Percentage of winning games where the winner held this tech at game end. Red = 50%+. Does not imply causation." /></span>
      </div>
      {visibleTechs.map(t => (
        <div key={t.tech} style={{ display: 'grid', gridTemplateColumns: '8px 1fr 50px 80px 60px', gap: 6, alignItems: 'center', padding: '3px 0', borderBottom: '1px dotted var(--ink-4)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>
          <TechPip color={t.color} />
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-micro)' }}>{t.tech}</span>
          <span style={{ color: 'var(--ink-3)' }}>{t.avgRoundFirstResearched === null ? '—' : `Rnd ${t.avgRoundFirstResearched.toFixed(1)}`}</span>
          <div style={{ background: 'var(--ink-4)', height: 4 }}>
            <div style={{ background: TECH_COLOR_VAR[t.color], height: 4, width: `${(t.researchCount / maxCount) * 100}%` }} />
          </div>
          <span style={{ color: (t.winnerHeldRate ?? 0) >= 0.5 ? 'var(--accent)' : 'var(--ink-3)' }}>
            {t.winnerHeldRate === null ? '—' : `${Math.round(t.winnerHeldRate * 100)}%`}
          </span>
        </div>
      ))}

      <Rule />

      {/* Winner Tech Possession — card per tech */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px', display: 'flex', alignItems: 'center' }}>
        Winner Tech Possession · Top 10<Tooltip text="Technologies most often held by the winning faction at game end. ★ = held in 67%+ of winning games where it appeared. Correlation, not causation." />
      </div>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 8 }}>
        Each card shows winner-held %, average research round, and the bar fills relative to the highest winner-hold rate in the top 10.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 12 }}>
        {[...techStats.topTechs].sort((a, b) => (b.winnerHeldRate ?? 0) - (a.winnerHeldRate ?? 0)).slice(0, 10).map(t => {
          const heldPct = t.winnerHeldRate === null ? 0 : Math.round(t.winnerHeldRate * 100);
          const isStar = (t.winnerHeldRate ?? 0) >= 0.67;
          return (
            <div
              key={t.tech}
              style={{
                background: 'var(--paper-2)',
                border: '1px solid var(--ink-4)',
                borderLeft: isStar ? '3px solid var(--accent)' : '1px solid var(--ink-4)',
                padding: '10px 12px',
              }}
            >
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.08em', color: isStar ? 'var(--accent)' : 'var(--ink-4)', marginBottom: 2 }}>
                {isStar ? '★ ' : ''}Held by winner {heldPct}%
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <TechPip color={t.color} size={8} />
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 'var(--font-sm)', lineHeight: 1.1 }}>{t.tech}</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 'var(--font-sm)', lineHeight: 1, color: isStar ? 'var(--accent)' : 'var(--ink)' }}>
                    {heldPct}%
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>winner held</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 'var(--font-sm)', lineHeight: 1 }}>
                    {t.avgRoundFirstResearched === null ? '—' : `R${t.avgRoundFirstResearched.toFixed(1)}`}
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>avg research</div>
                </div>
              </div>
              <div style={{ background: 'var(--ink-4)', height: 4, marginTop: 6 }}>
                <div style={{ background: isStar ? 'var(--accent)' : 'var(--ink-2)', height: 4, width: `${heldPct}%` }} />
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 5 }}>
                {t.winnerHeldCount} of {techStats.totalWinnerGames} winning games
              </div>
            </div>
          );
        })}
      </div>

      {techPaths !== null && techPaths.factions.length > 0 && (
        <>
          <Rule />
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
            Research Openings<Tooltip text="The most common techs each faction researches for their 1st, 2nd, and 3rd picks (excluding starting techs)." />
          </div>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 8 }}>
            One card per faction showing their top 1st / 2nd / 3rd research picks. ×N = number of games this opening was used.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {techPaths.factions.map(f => (
              <div key={f.factionId} style={{ background: 'var(--paper-2)', border: '1px solid var(--ink-4)', padding: '10px 12px' }}>
                <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 'var(--font-sm)', lineHeight: 1.2, marginBottom: 6 }}>{f.factionId}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {f.pathByPosition.map(pos => (
                    <div key={pos.position} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 18, flexShrink: 0 }}>
                        #{pos.position}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                        {pos.topTechs.length === 0 ? (
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-4)' }}>—</span>
                        ) : pos.topTechs.map(t => (
                          <div key={t.tech} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <TechPip color={t.color} size={6} />
                            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-2)' }}>
                              {t.tech} <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--ink-4)', fontSize: 'var(--font-micro)' }}>×{t.count}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 6 }}>
                  {f.gamesAnalyzed} game{f.gamesAnalyzed !== 1 ? 's' : ''} sampled
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
