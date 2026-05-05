import { useState, useEffect, useMemo } from 'react';
import { useMeta } from './MetaContext';
import { Rule, FactionDot, SectionDesc, Tooltip } from '../../shared';
import { getFactionBrandColor } from '../../lib/factions/factionBrandColors';

type ViewMode = 'table' | 'cards';
type SortKey = 'winRate' | 'gamesPlayed' | 'avgFinalVp';

const STORAGE_KEY = 'meta.factionViewMode';

function readStoredView(): ViewMode {
  if (typeof window === 'undefined') return 'cards';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'table' || stored === 'cards' ? stored : 'cards';
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) {
    return <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--ink-3)' }}>—</span>;
  }
  const max = Math.max(...values, 1);
  const w = 56, h = 14, gap = 1;
  const barW = (w - gap * (values.length - 1)) / values.length;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {values.map((v, i) => {
        const bh = (v / max) * h;
        return <rect key={i} x={i * (barW + gap)} y={h - bh} width={barW} height={bh} fill="var(--ink-3)" />;
      })}
    </svg>
  );
}

export function FactionSection() {
  const { factionStats } = useMeta();
  const [view, setView] = useState<ViewMode>(readStoredView);
  const [sort, setSort] = useState<SortKey>('winRate');

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, view);
  }, [view]);

  const sorted = useMemo(() => {
    if (factionStats === null) return [];
    const arr = [...factionStats.factions];
    if (sort === 'winRate')      arr.sort((a, b) => b.winRate - a.winRate);
    if (sort === 'gamesPlayed')  arr.sort((a, b) => b.gamesPlayed - a.gamesPlayed);
    if (sort === 'avgFinalVp')   arr.sort((a, b) => b.avgFinalVp - a.avgFinalVp);
    return arr;
  }, [factionStats, sort]);

  if (factionStats === null) {
    return <section id="factions" data-section="factions" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }} />;
  }

  const topWinRate = sorted[0]?.winRate ?? 0;

  return (
    <section id="factions" data-section="factions" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}>
      {/* Kicker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--ink-4)', paddingBottom: 3, marginBottom: 6 }}>
        <span>Factions · League Standings</span>
        <span>{factionStats.totalGames} games · {factionStats.factions.length} factions</span>
      </div>

      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-subhead)', fontWeight: 800, lineHeight: 1.1, marginBottom: 2 }}>
        The leaderboard.
      </div>
      <div style={{ fontSize: 'var(--font-micro)', color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 6 }}>
        Sample sizes are small — based on {factionStats.totalGames} game{factionStats.totalGames !== 1 ? 's' : ''}.
      </div>

      <SectionDesc>
        Win rates, average scores, and performance history for each faction played across all recorded sessions. Toggle between cards (visual) and table (sortable) views to compare factions.
      </SectionDesc>

      {/* View / sort toggles */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        <span style={{ color: 'var(--ink-3)' }}>View</span>
        <button type="button" onClick={() => { setView('table'); }} style={{ background: view === 'table' ? 'var(--ink)' : 'transparent', color: view === 'table' ? 'var(--paper)' : 'var(--ink)', border: '1px solid var(--ink)', padding: '2px 6px', cursor: 'pointer' }}>Table</button>
        <button type="button" onClick={() => { setView('cards'); }} style={{ background: view === 'cards' ? 'var(--ink)' : 'transparent', color: view === 'cards' ? 'var(--paper)' : 'var(--ink)', border: '1px solid var(--ink)', padding: '2px 6px', cursor: 'pointer' }}>Cards</button>
        {view === 'table' && (
          <>
            <span style={{ marginLeft: 12, color: 'var(--ink-3)' }}>Sort</span>
            <button type="button" onClick={() => { setSort('winRate'); }}     style={{ background: 'transparent', color: sort === 'winRate' ? 'var(--accent)' : 'var(--ink-3)', border: 'none', cursor: 'pointer' }}>Win%</button>
            <button type="button" onClick={() => { setSort('gamesPlayed'); }} style={{ background: 'transparent', color: sort === 'gamesPlayed' ? 'var(--accent)' : 'var(--ink-3)', border: 'none', cursor: 'pointer' }}>Pick</button>
            <button type="button" onClick={() => { setSort('avgFinalVp'); }}  style={{ background: 'transparent', color: sort === 'avgFinalVp' ? 'var(--accent)' : 'var(--ink-3)', border: 'none', cursor: 'pointer' }}>Avg VP</button>
          </>
        )}
      </div>

      {view === 'table' ? (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 72px 64px 80px', gap: 8, padding: '3px 0', borderBottom: '1px solid var(--rule)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span>Faction</span>
            <span style={{ display: 'flex', alignItems: 'center' }}>Picks<Tooltip text="Number of games this faction has appeared in vs. total games on record." /></span>
            <span style={{ display: 'flex', alignItems: 'center' }}>Win%<Tooltip text="Wins divided by games played as this faction. Small sample sizes make this highly variable — treat with caution." /></span>
            <span style={{ display: 'flex', alignItems: 'center' }}>Avg VP<Tooltip text="Mean final victory point total across all appearances for this faction." /></span>
            <span style={{ display: 'flex', alignItems: 'center' }}>By Round<Tooltip text="Sparkline: average VP accumulated by end of each round. Taller bars = more scoring in that round on average." /></span>
          </div>
          {sorted.map(f => (
            <div key={f.factionId} style={{ display: 'grid', gridTemplateColumns: '1fr 72px 72px 64px 80px', gap: 8, padding: '3px 0', borderBottom: '1px dotted var(--ink-4)' }}>
              <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-micro)', fontWeight: 700 }}>
                {f.factionId} <span style={{ fontSize: 'var(--font-micro)', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{f.expansion}</span>
              </span>
              <span style={{ color: 'var(--ink-3)' }}>{f.gamesPlayed}/{factionStats.totalGames}</span>
              <span>{Math.round(f.winRate * 100)}%</span>
              <span>{f.avgFinalVp.toFixed(1)}</span>
              <Sparkline values={f.avgVpPerRound} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {sorted.map(f => (
            <div key={f.factionId} style={{ border: f.winRate === topWinRate && f.winRate > 0 ? '2px solid var(--rule)' : '1px solid var(--ink-4)', padding: 8, background: 'var(--paper-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <FactionDot color={getFactionBrandColor(f.factionId, 'var(--ink-4)')} size={8} />
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 'var(--font-micro)' }}>{f.factionId}</span>
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 2 }}>{f.expansion}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4, marginBottom: 1 }}>Win Rate</div>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-display-sm)', fontWeight: 800, color: f.winRate === topWinRate && f.winRate > 0 ? 'var(--accent)' : 'var(--ink)', lineHeight: 1.1 }}>
                {Math.round(f.winRate * 100)}%
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)' }}>
                {f.gamesPlayed} game{f.gamesPlayed !== 1 ? 's' : ''} · {f.avgFinalVp.toFixed(1)} avg final VP
              </div>
              <div style={{ marginTop: 6 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-4)', marginBottom: 2 }}>Avg VP / Round</div>
                <Sparkline values={f.avgVpPerRound} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Rule />

      {/* Senate Power Index */}
      {factionStats.factions.some(f => f.winningVoteRate !== null) && (
        <>
          <Rule />
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 8, marginBottom: 4, display: 'flex', alignItems: 'center' }}>
            Senate Power · Voted with Outcome<Tooltip text="Percentage of agenda votes where this faction voted for the outcome that actually resolved. Measures political alignment, not agenda strength." />
          </div>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 6 }}>
            How often each faction cast their votes in favor of whichever side won the agenda — a proxy for political influence and deal-making without directly measuring VP.
          </div>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 50px', gap: 6, alignItems: 'center', padding: '2px 0', borderBottom: '1px solid var(--rule)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
            <span>Faction</span>
            <span>Alignment</span>
            <span style={{ textAlign: 'right' }}>Rate</span>
          </div>
          {[...factionStats.factions]
            .filter(f => f.winningVoteRate !== null)
            .sort((a, b) => (b.winningVoteRate ?? 0) - (a.winningVoteRate ?? 0))
            .map(f => (
              <div key={f.factionId} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 50px', gap: 6, alignItems: 'center', padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-micro)' }}>{f.factionId}</span>
                <div style={{ background: 'var(--ink-4)', height: 4 }}>
                  <div style={{ background: 'var(--cool)', height: 4, width: `${(f.winningVoteRate ?? 0) * 100}%` }} />
                </div>
                <span style={{ textAlign: 'right' }}>{Math.round((f.winningVoteRate ?? 0) * 100)}%</span>
              </div>
            ))}
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 4 }}>
            Share of votes cast that backed the resolved outcome. Soft power without VP.
          </div>
        </>
      )}

      {/* Support for the Throne */}
      {factionStats.sftTransfers.length > 0 && (
        <>
          <Rule />
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 8, marginBottom: 4, display: 'flex', alignItems: 'center' }}>
            Support for the Throne<Tooltip text="A political deal: one faction gives their flagship's system card to another, granting that faction 1 VP. The giver gains nothing directly — it's a concession in exchange for a favor or to block someone else from winning." />
          </div>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 6 }}>
            Faction-to-faction VP transfers where the giver cedes their flagship card as a political concession. Arrow shows direction of the VP transfer.
          </div>
          {factionStats.sftTransfers.map((t, i) => (
            <div key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', padding: '2px 0' }}>
              {t.fromFaction} → {t.toFaction} <span style={{ color: 'var(--ink-3)', marginLeft: 4 }}>({t.count} game{t.count !== 1 ? 's' : ''})</span>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
