import { useMeta } from './MetaContext';
import { Rule, SectionDesc, Tooltip, HeatmapGrid, Kicker } from '../../shared';
import type { ParsedGame } from '../../lib/parser/types';

const STRATEGY_CARDS = [
  'Leadership', 'Diplomacy', 'Politics', 'Construction',
  'Trade', 'Warfare', 'Technology', 'Imperial',
] as const;

export function buildFactionStrategyHeatmap(games: ParsedGame[]): {
  rowLabels: string[];
  colLabels: string[];
  values: number[][];
} {
  // Count games-played and picks per (faction, card)
  const gamesPlayed = new Map<string, number>();
  const picks = new Map<string, Map<string, number>>(); // factionId -> card -> count
  for (const g of games) {
    for (const f of g.factions) {
      gamesPlayed.set(f.factionId, (gamesPlayed.get(f.factionId) ?? 0) + 1);
      if (!picks.has(f.factionId)) picks.set(f.factionId, new Map());
    }
    for (const e of g.strategyCardEvents) {
      if (e.type !== 'pick') continue;
      const m = picks.get(e.faction);
      if (m === undefined) continue;
      m.set(e.card, (m.get(e.card) ?? 0) + 1);
    }
  }
  const rowLabels = [...gamesPlayed.keys()].sort();
  // Per-faction normalization: each row's max = 1.0, showing relative preference within that faction.
  const values: number[][] = rowLabels.map(fid => {
    const gp = gamesPlayed.get(fid) ?? 1;
    const m = picks.get(fid);
    const rates = STRATEGY_CARDS.map(card => (m?.get(card) ?? 0) / gp);
    const rowMax = Math.max(0.0001, ...rates);
    return rates.map(v => v / rowMax);
  });
  return { rowLabels, colLabels: [...STRATEGY_CARDS], values };
}

const HIGH_FOLLOW = 0.8;

function fmtPct(p: number | null): string {
  return p === null ? 'n/a' : `${Math.round(p * 100)}%`;
}

function fmtPos(p: number | null): string {
  return p === null ? '—' : p.toFixed(1);
}

export function StrategyCardSection() {
  const { strategyCardStats, games } = useMeta();
  if (strategyCardStats === null) {
    return <section id="strategy" data-section="strategy" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }} />;
  }

  const allRounds = new Set<number>();
  for (const c of strategyCardStats.cards) {
    for (const r of Object.keys(c.pickCountByRound)) allRounds.add(Number(r));
  }
  const roundsAsc = [...allRounds].sort((a, b) => a - b);

  return (
    <section id="strategy" data-section="strategy" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--ink-4)', paddingBottom: 3, marginBottom: 6 }}>
        <span>Strategy Cards · Across Games</span>
        <span>{strategyCardStats.cards.length} cards</span>
      </div>

      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-subhead)', fontWeight: 800, lineHeight: 1.1, marginBottom: 8 }}>
        Drafting and follow-through.
      </div>

      <SectionDesc>
        Each of TI4's 8 strategy cards grants a primary ability and a secondary that other players can follow. This section tracks pick frequency by round and how often factions execute the secondary — revealing which cards dominate the draft and which get ignored.
      </SectionDesc>

      {/* Secondary follow rate */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
        Secondary Follow Rate · All Rounds<Tooltip text="How often players other than the card holder used the secondary ability when this card was activated. Measured per activation opportunity. High rates (shown in red) indicate a secondary everyone wants to use." />
      </div>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 6 }}>
        Each card's percentage shown below its name. Pick count is total times drafted across all games. Red = 80%+ follow rate.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
        {[...strategyCardStats.cards].sort((a, b) => (b.secondaryFollowRate ?? -1) - (a.secondaryFollowRate ?? -1)).map(c => {
          const isHigh = c.secondaryFollowRate !== null && c.secondaryFollowRate >= HIGH_FOLLOW;
          return (
            <div key={c.card} style={{ border: '1px solid var(--ink-4)', padding: 6, background: 'var(--paper-2)' }}>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 'var(--font-micro)' }}>{c.card}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginTop: 4, marginBottom: 1 }}>Follow Rate</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-body)', color: isHigh ? 'var(--accent)' : 'var(--ink)' }}>
                {fmtPct(c.secondaryFollowRate)}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)' }}>
                {c.totalPicks} pick{c.totalPicks !== 1 ? 's' : ''}
              </div>
            </div>
          );
        })}
      </div>

      <Rule />

      {/* Most Picked by Round — card grid */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
          Most Picked · By Round<Tooltip text="Top 3 most-drafted strategy cards for each game round. Shows which cards players prioritize depending on what round they're planning for." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6 }}>
          {roundsAsc.map(r => {
            const cardsInRound = [...strategyCardStats.cards]
              .filter(c => (c.pickCountByRound[r] ?? 0) > 0)
              .sort((a, b) => (b.pickCountByRound[r] ?? 0) - (a.pickCountByRound[r] ?? 0))
              .slice(0, 3);
            const maxPicks = cardsInRound[0] ? (cardsInRound[0].pickCountByRound[r] ?? 0) : 1;
            return (
              <div key={r} style={{ border: '1px solid var(--ink-4)', padding: 8, background: 'var(--paper-2)' }}>
                <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-subhead)', fontWeight: 700, color: 'var(--ink-3)', lineHeight: 1, marginBottom: 6 }}>R{r}</div>
                {cardsInRound.map((c, idx) => {
                  const picks = c.pickCountByRound[r] ?? 0;
                  const barPct = maxPicks > 0 ? (picks / maxPicks) * 100 : 0;
                  const barColor = idx === 0 ? 'var(--accent)' : idx === 1 ? 'var(--ink-2)' : 'var(--ink-3)';
                  return (
                    <div key={c.card} style={{ marginBottom: 4 }}>
                      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-sm)', fontWeight: 700 }}>{c.card}</div>
                      <div style={{ background: 'var(--ink-4)', height: 3, marginTop: 2 }}>
                        <div style={{ background: barColor, height: 3, width: `${barPct}%` }} />
                      </div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)' }}>{picks}×</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Draft Position · Most Contested — 8-card grid */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
          Draft Position · Most Contested<Tooltip text="Cards ranked by how early (low pick position) they're consistently grabbed. A low average position means players fight for it every round." />
        </div>
        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 8, fontStyle: 'italic' }}>
          Lower average position = grabbed earlier each round. Bar = pick frequency vs. most-picked card.
        </p>
        {(() => {
          const ranked = [...strategyCardStats.cards]
            .filter(c => c.avgPickPosition !== null)
            .sort((a, b) => (a.avgPickPosition ?? 99) - (b.avgPickPosition ?? 99));
          const maxPicks = Math.max(1, ...ranked.map(c => c.totalPicks));
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {ranked.map((c, i) => {
                const isTop = i < 2;
                const isLast = i === ranked.length - 1;
                const barPct = (c.totalPicks / maxPicks) * 100;
                const posColor = i === 0 ? 'var(--accent)' : isLast ? 'var(--ink-3)' : 'var(--ink)';
                const barColor = i === 0 ? 'var(--accent)' : isLast ? 'var(--ink-3)' : 'var(--ink-2)';
                return (
                  <div key={c.card} style={{ border: `1px solid ${isTop ? 'var(--ink-3)' : 'var(--ink-4)'}`, padding: 8, background: 'var(--paper-2)' }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      #{i + 1}{i === 0 ? ' most contested' : isLast ? ' least' : ''}
                    </div>
                    <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-body)', fontWeight: 700, margin: '2px 0' }}>{c.card}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Avg pick position</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-subhead)', fontWeight: 700, lineHeight: 1, color: posColor }}>
                      {fmtPos(c.avgPickPosition)}
                    </div>
                    <div style={{ marginTop: 4, background: 'var(--ink-4)', height: 3 }}>
                      <div style={{ background: barColor, height: 3, width: `${barPct}%` }} />
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 2 }}>
                      {c.totalPicks} pick{c.totalPicks !== 1 ? 's' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Faction × Strategy Card heatmap (V1.3a) */}
      {games.length > 0 && (() => {
        const heatmap = buildFactionStrategyHeatmap(games);
        if (heatmap.rowLabels.length === 0) return null;
        return (
          <div style={{ marginTop: 16 }}>
            <Kicker text="Heatmap">Faction × strategy card pick rate</Kicker>
            <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, margin: '4px 0 6px', fontStyle: 'italic' }}>
              Each cell = how often that faction drafted that strategy card relative to their own most-picked card. Hover for details.
            </p>
            <HeatmapGrid rowLabels={heatmap.rowLabels} colLabels={heatmap.colLabels} values={heatmap.values} />
          </div>
        );
      })()}
    </section>
  );
}
