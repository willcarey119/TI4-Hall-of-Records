import { useState, useEffect, useMemo } from 'react';
import { useMeta } from './MetaContext';
import { Rule, FactionDot, SectionDesc, Tooltip, EntityCard, LeaderboardPodium } from '../../shared';
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

      {/* Top-3 podium strip */}
      {(() => {
        const top3 = [...factionStats.factions]
          .sort((a, b) => b.winRate - a.winRate)
          .slice(0, 3)
          .map(f => ({
            factionId: f.factionId,
            color: getFactionBrandColor(f.factionId, 'var(--ink-4)'),
            wins: Math.round(f.winRate * f.gamesPlayed),
            gamesPlayed: f.gamesPlayed,
            avgVp: f.avgFinalVp,
          }));
        return top3.length >= 3 ? <LeaderboardPodium top3={top3} /> : null;
      })()}

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
          {/* Column headers — matches EntityCard tabular grid: 24px dot · 1fr name · 40px GP · 40px W · 52px Win% */}
          <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 40px 40px 52px', gap: 8, padding: '3px 8px', borderBottom: '1px solid var(--rule)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span />
            <span>Faction</span>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              GP<Tooltip text="Number of games this faction has appeared in." />
            </span>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              W<Tooltip text="Number of wins for this faction." />
            </span>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              Win%<Tooltip text="Wins divided by games played as this faction. Small sample sizes make this highly variable — treat with caution." />
            </span>
          </div>
          {sorted.map(f => (
            <EntityCard
              key={f.factionId}
              variant="tabular"
              factionId={f.factionId}
              color={getFactionBrandColor(f.factionId, 'var(--ink-4)')}
              gamesPlayed={f.gamesPlayed}
              wins={Math.round(f.winRate * f.gamesPlayed)}
              avgVp={f.avgFinalVp}
              winner={f.winRate === topWinRate && f.winRate > 0}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {sorted.map(f => (
            <div key={f.factionId}>
              <EntityCard
                variant="newsprint"
                factionId={f.factionId}
                color={getFactionBrandColor(f.factionId, 'var(--ink-4)')}
                gamesPlayed={f.gamesPlayed}
                wins={Math.round(f.winRate * f.gamesPlayed)}
                avgVp={f.avgFinalVp}
                winner={f.winRate === topWinRate && f.winRate > 0}
              />
              <div style={{ marginTop: 4 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-4)', marginBottom: 2 }}>Avg VP / Round</div>
                <Sparkline values={f.avgVpPerRound} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Rule />

      {/* Senate Power Index — card per faction, ranked */}
      {factionStats.factions.some(f => f.winningVoteRate !== null) && (() => {
        const ranked = [...factionStats.factions]
          .filter(f => f.winningVoteRate !== null)
          .sort((a, b) => (b.winningVoteRate ?? 0) - (a.winningVoteRate ?? 0));
        const sftMap = new Map<string, number>();
        for (const t of factionStats.sftTransfers) {
          sftMap.set(t.toFaction, (sftMap.get(t.toFaction) ?? 0) + t.count);
        }
        const topRate = ranked[0]?.winningVoteRate ?? 0;
        return (
          <>
            <Rule />
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginTop: 8, marginBottom: 4, display: 'flex', alignItems: 'center' }}>
              Senate Power Index<Tooltip text="Ranked by alignment with resolved agenda outcomes — how often each faction's votes backed the winning side. Soft power that doesn't directly measure VP." />
            </div>
            <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 8 }}>
              Factions ranked by share of votes cast in favor of resolved outcomes. SFT received counts how many times this faction was given a Support for the Throne card.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {ranked.map((f, i) => {
                const isTop = i === 0;
                const rate = f.winningVoteRate ?? 0;
                const sftReceived = sftMap.get(f.factionId) ?? 0;
                return (
                  <div
                    key={f.factionId}
                    style={{
                      background: 'var(--paper-2)',
                      border: '1px solid var(--ink-4)',
                      borderLeft: isTop ? '3px solid var(--accent)' : '1px solid var(--ink-4)',
                      padding: '10px 12px',
                      opacity: rate < topRate * 0.5 ? 0.7 : 1,
                    }}
                  >
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginBottom: 2 }}>
                      #{i + 1} Senate Influence
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '4px 0' }}>
                      <FactionDot color={getFactionBrandColor(f.factionId, 'var(--ink-4)')} size={8} />
                      <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 13, lineHeight: 1.1 }}>{f.factionId}</span>
                    </div>
                    <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 22, lineHeight: 1, color: isTop ? 'var(--accent)' : 'var(--ink)' }}>
                      {Math.round(rate * 100)}%
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginTop: 3 }}>
                      Vote alignment · {f.gamesPlayed} game{f.gamesPlayed !== 1 ? 's' : ''}
                    </div>
                    <div style={{ background: 'var(--ink-4)', height: 4, marginTop: 6 }}>
                      <div style={{ background: isTop ? 'var(--accent)' : 'var(--ink-2)', height: 4, width: `${rate * 100}%` }} />
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 6 }}>
                      SFT received: {sftReceived}×
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}

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
