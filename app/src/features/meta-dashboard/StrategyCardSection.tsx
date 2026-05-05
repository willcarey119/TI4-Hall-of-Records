import { useMeta } from './MetaContext';
import { Rule, SectionDesc, Tooltip } from '../../shared';

const HIGH_FOLLOW = 0.8;

function fmtPct(p: number | null): string {
  return p === null ? 'n/a' : `${Math.round(p * 100)}%`;
}

function fmtPos(p: number | null): string {
  return p === null ? '—' : p.toFixed(1);
}

export function StrategyCardSection() {
  const { strategyCardStats } = useMeta();
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 8 }}>
        {/* Most Picked by Round */}
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
            Most Picked · By Round<Tooltip text="Top 3 most-drafted strategy cards for each game round. Shows which cards players prioritize depending on what round they're currently planning for." />
          </div>
          {roundsAsc.map(r => {
            const cardsInRound = [...strategyCardStats.cards]
              .filter(c => (c.pickCountByRound[r] ?? 0) > 0)
              .sort((a, b) => (b.pickCountByRound[r] ?? 0) - (a.pickCountByRound[r] ?? 0))
              .slice(0, 3);
            return (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>
                <span style={{ width: 32, color: 'var(--ink-3)' }}>R{r}</span>
                {cardsInRound.map(c => (
                  <span key={c.card} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--ink-4)', padding: '1px 6px' }}>
                    <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-micro)' }}>{c.card}</span>
                    <span style={{ color: 'var(--ink-3)' }}>{c.pickCountByRound[r] ?? 0}×</span>
                  </span>
                ))}
              </div>
            );
          })}
        </div>

        {/* Draft Position */}
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
            Draft Position · Most Contested<Tooltip text="Cards ranked by how early (low pick position) they're consistently grabbed. A low average position means players fight for it every round — signaling a highly valued primary or secondary ability." />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', marginBottom: 4 }}>
            {strategyCardStats.mostContested.map((card, i) => {
              const stat = strategyCardStats.cards.find(c => c.card === card);
              return (
                <span key={card} style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ color: 'var(--ink-3)' }}>{i + 1}.</span>
                  <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-micro)' }}>{card}</span>
                  <span style={{ color: 'var(--ink-3)' }}>(avg {fmtPos(stat?.avgPickPosition ?? null)})</span>
                </span>
              );
            })}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)' }}>
            Lower = grabbed earlier in strategy phase.
          </div>
        </div>
      </div>
    </section>
  );
}
