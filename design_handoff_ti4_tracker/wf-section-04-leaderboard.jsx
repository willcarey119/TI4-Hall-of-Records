/* global React, KitSection, VariantRow, Variant, Display, Headline, Deck, Body, Mono, Num, NumMono, Label, Kicker, Rule, Ph, Chip, Swatch, Bar, StackBar, Sparkline, Card, Tag */
// §04 Leaderboard — sortable rows + table density
const { useState } = React;

const ROWS = [
  { rank: 1,  name: 'Federation of Sol',     gp: 5, w: 2, vp: 7.4, t: [6,8,10,5,9],   pace: 1.48 },
  { rank: 2,  name: 'Emirates of Hacan',     gp: 5, w: 1, vp: 7.0, t: [5,7,8,9,6],    pace: 1.40 },
  { rank: 3,  name: 'Xxcha Kingdom',         gp: 4, w: 1, vp: 6.8, t: [6,7,5,9],      pace: 1.36 },
  { rank: 4,  name: 'Yssaril Tribes',        gp: 4, w: 1, vp: 6.0, t: [4,8,7,5],      pace: 1.20 },
  { rank: 5,  name: 'Naalu Collective',      gp: 3, w: 0, vp: 5.3, t: [4,6,6],        pace: 1.06 },
  { rank: 6,  name: 'Arborec',               gp: 3, w: 0, vp: 4.7, t: [3,5,6],        pace: 0.94 },
  { rank: 7,  name: 'Mentak Coalition',      gp: 2, w: 0, vp: 4.5, t: [4,5],          pace: 0.90 },
];

const LeaderboardSection = () => {
  const [sortKey, setSortKey] = useState('rank');

  return (
    <KitSection
      num="04"
      title="Leaderboard — Row & Table"
      deck={`Three densities of the same data: an editorial podium, a sortable table, and a
             deeply dense BR-style ledger. Pick by page intent — celebrate, compare, or audit.`}>

      <VariantRow cols={2}>
        <Variant id="04-A" title="Podium — top 3 then list"
          when="Hero of the League page. Treat the top 3 as the lede; the rest demote to a clean list."
          avoid="Hides ties — when 3-way tie at top, fall back to variant B." height={300}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: 8, alignItems: 'flex-end', height: 110 }}>
            {/* 2nd */}
            <div style={{ borderTop: '2px solid var(--ink)', paddingTop: 6 }}>
              <Mono size={9} style={{ color: 'var(--ink-3)' }}>2ND</Mono>
              <Headline size={12}>Hacan</Headline>
              <Num size={20}>1</Num><Mono size={9} style={{ color: 'var(--ink-3)' }}> wins</Mono>
              <Bar pct={50} height={3} style={{ marginTop: 4 }} />
            </div>
            {/* 1st (taller) */}
            <div style={{ borderTop: '4px solid var(--accent)', paddingTop: 6 }}>
              <Mono size={9} style={{ color: 'var(--accent)' }}>1ST · THE THRONE</Mono>
              <Display size={20}>Federation of Sol</Display>
              <Num size={32} style={{ color: 'var(--accent)' }}>2</Num><Mono size={11} style={{ color: 'var(--ink-3)' }}> wins / 5</Mono>
              <Bar pct={100} height={4} fill="var(--accent)" style={{ marginTop: 4 }} />
            </div>
            {/* 3rd */}
            <div style={{ borderTop: '1px solid var(--ink)', paddingTop: 6 }}>
              <Mono size={9} style={{ color: 'var(--ink-3)' }}>3RD</Mono>
              <Headline size={12}>Xxcha</Headline>
              <Num size={20}>1</Num><Mono size={9} style={{ color: 'var(--ink-3)' }}> wins</Mono>
              <Bar pct={40} height={3} style={{ marginTop: 4 }} />
            </div>
          </div>
          <Rule kind="thick" style={{ margin: '12px 0 6px' }} />
          {ROWS.slice(3, 7).map(r => (
            <div key={r.name} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--ink-5)' }}>
              <Mono size={11} style={{ color: 'var(--ink-3)', width: 16 }}>{r.rank}</Mono>
              <Swatch shade={r.rank - 1} />
              <span className="wf-mono" style={{ fontSize: 11, flex: 1 }}>{r.name}</span>
              <NumMono size={11} style={{ color: 'var(--ink-3)' }}>{r.w}W</NumMono>
              <NumMono size={11}>{r.vp.toFixed(1)}</NumMono>
            </div>
          ))}
        </Variant>

        <Variant id="04-B" title="Sortable table — column headers click"
          when="Default League/Faction list. Every column is a sort key — chevron shows current sort."
          avoid="On mobile, this becomes a vertical card list (see §11)." height={300}>
          <div style={{ display: 'grid', gridTemplateColumns: '24px 18px 2fr 0.7fr 0.7fr 0.9fr 1.1fr 0.9fr', columnGap: 8, padding: '0 0 4px', borderBottom: '2px solid var(--rule)' }}>
            {[['', ''], ['#', 'rank'], ['FACTION', 'name'], ['GP', 'gp'], ['W', 'w'], ['AVG VP', 'vp'], ['LAST 5', 't'], ['PACE', 'pace']].map(([h, k]) => (
              <button key={h} type="button" onClick={() => setSortKey(k)} style={{
                background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer',
              }}>
                <span className="wf-mono" style={{
                  fontSize: 9, color: sortKey === k ? 'var(--ink)' : 'var(--ink-3)',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  fontWeight: sortKey === k ? 600 : 400,
                }}>
                  {h}{sortKey === k ? ' ▼' : ''}
                </span>
              </button>
            ))}
          </div>
          {ROWS.map((r, i) => (
            <div key={r.name} style={{
              display: 'grid', gridTemplateColumns: '24px 18px 2fr 0.7fr 0.7fr 0.9fr 1.1fr 0.9fr',
              columnGap: 8, padding: '5px 0',
              borderBottom: '1px solid var(--ink-5)',
              alignItems: 'center',
              background: r.rank === 1 ? 'var(--paper-2)' : 'transparent',
            }}>
              <Swatch shade={i} />
              <NumMono size={11} style={{ color: r.rank <= 3 ? 'var(--ink)' : 'var(--ink-3)', fontWeight: r.rank <= 3 ? 700 : 400 }}>{r.rank}</NumMono>
              <span className="wf-mono" style={{ fontSize: 11 }}>{r.name}</span>
              <NumMono size={11}>{r.gp}</NumMono>
              <NumMono size={11} style={{ color: r.w > 0 ? 'var(--accent)' : 'var(--ink-3)', fontWeight: r.w > 0 ? 700 : 400 }}>{r.w}</NumMono>
              <NumMono size={11}>{r.vp.toFixed(1)}</NumMono>
              <Sparkline values={r.t} width={80} height={14} />
              <NumMono size={11} style={{ color: 'var(--ink-3)' }}>{r.pace.toFixed(2)}</NumMono>
            </div>
          ))}
          <Mono size={9} style={{ color: 'var(--ink-3)', marginTop: 6, display: 'block' }}>Click a row → faction profile.</Mono>
        </Variant>
      </VariantRow>

      <div style={{ height: 12 }} />

      <VariantRow cols={2}>
        <Variant id="04-C" title="Dense ledger — Baseball Reference style"
          when="Power-user statistics page. Many columns, tabular nums, alternating row tint, pinned header."
          avoid="Way too dense for casual viewing — gate behind a ‘Detailed view’ toggle." height={320}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--rule)' }}>
                  {['#', 'FACTION', 'GP', 'W', 'L', 'WIN%', 'AVG VP', 'PACE', 'PUB', 'SEC', 'IMP', 'AGD', 'BEST'].map(h => (
                    <th key={h} style={{ padding: '4px 5px', fontSize: 9, textAlign: h === 'FACTION' ? 'left' : 'right', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, i) => (
                  <tr key={r.name} style={{
                    borderBottom: '1px solid var(--ink-5)',
                    background: i % 2 ? 'var(--paper-2)' : 'transparent',
                  }}>
                    <td style={{ padding: '4px 5px', fontSize: 10, color: 'var(--ink-3)' }}>{r.rank}</td>
                    <td style={{ padding: '4px 5px', fontSize: 10 }}>
                      <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                        <Swatch shade={i} size={7} />{r.name}
                      </span>
                    </td>
                    <td style={{ padding: '4px 5px', fontSize: 10, textAlign: 'right' }}>{r.gp}</td>
                    <td style={{ padding: '4px 5px', fontSize: 10, textAlign: 'right', color: r.w > 0 ? 'var(--accent)' : 'var(--ink)', fontWeight: r.w > 0 ? 700 : 400 }}>{r.w}</td>
                    <td style={{ padding: '4px 5px', fontSize: 10, textAlign: 'right' }}>{r.gp - r.w}</td>
                    <td style={{ padding: '4px 5px', fontSize: 10, textAlign: 'right' }}>.{Math.round((r.w / r.gp) * 1000).toString().padStart(3, '0')}</td>
                    <td style={{ padding: '4px 5px', fontSize: 10, textAlign: 'right' }}>{r.vp.toFixed(1)}</td>
                    <td style={{ padding: '4px 5px', fontSize: 10, textAlign: 'right', color: 'var(--ink-3)' }}>{r.pace.toFixed(2)}</td>
                    <td style={{ padding: '4px 5px', fontSize: 10, textAlign: 'right' }}>{Math.max(2, r.w + 2)}</td>
                    <td style={{ padding: '4px 5px', fontSize: 10, textAlign: 'right' }}>{r.w + 1}</td>
                    <td style={{ padding: '4px 5px', fontSize: 10, textAlign: 'right' }}>{r.w}</td>
                    <td style={{ padding: '4px 5px', fontSize: 10, textAlign: 'right' }}>0</td>
                    <td style={{ padding: '4px 5px', fontSize: 10, textAlign: 'right', color: 'var(--accent)' }}>{r.w > 0 ? '1st' : `${r.rank}th`}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--rule)' }}>
                  <td colSpan={2} style={{ padding: '4px 5px', fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>League avg</td>
                  <td style={{ padding: '4px 5px', fontSize: 9, textAlign: 'right', color: 'var(--ink-3)' }}>3.7</td>
                  <td style={{ padding: '4px 5px', fontSize: 9, textAlign: 'right', color: 'var(--ink-3)' }}>0.6</td>
                  <td colSpan={9} />
                </tr>
              </tfoot>
            </table>
          </div>
        </Variant>

        <Variant id="04-D" title="Inline-bar leaderboard"
          when="When the magnitude IS the story — tech research counts, planet captures. Bar makes ranking feel physical."
          avoid="Hides numeric precision; pair with hover-to-see-number for power users." height={320}>
          <Label>Strategy card — pick rate (League)</Label>
          <Rule style={{ margin: '6px 0' }} />
          {[
            ['Imperial',     0.84, 21],
            ['Politics',     0.62, 16],
            ['Warfare',      0.58, 15],
            ['Technology',   0.54, 14],
            ['Construction', 0.50, 13],
            ['Trade',        0.46, 12],
            ['Diplomacy',    0.42, 11],
            ['Leadership',   0.38, 10],
          ].map(([name, pct, count], i) => (
            <div key={name} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 2.4fr 36px', gap: 8, alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--ink-5)' }}>
              <NumMono size={11} style={{ color: 'var(--ink-3)' }}>{i + 1}</NumMono>
              <span className="wf-mono" style={{ fontSize: 11 }}>{name}</span>
              <Bar pct={pct * 100} height={8} fill={i === 0 ? 'var(--accent)' : 'var(--ink)'} />
              <NumMono size={11} style={{ textAlign: 'right' }}>{count}×</NumMono>
            </div>
          ))}
          <Mono size={9} style={{ color: 'var(--ink-3)', marginTop: 6, display: 'block' }}>n = 25 strategy phases · 7 games</Mono>
        </Variant>
      </VariantRow>
    </KitSection>
  );
};

window.LeaderboardSection = LeaderboardSection;
