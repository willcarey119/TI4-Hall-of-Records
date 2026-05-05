/* global React, KitSection, VariantRow, Variant, Display, Headline, Deck, Body, Mono, Num, NumMono, Label, Kicker, Rule, Ph, Chip, Swatch, Bar, StackBar, Sparkline, MultiSpark, Card, Tag */
// §06 Comparison block — A vs B (factions, players, seasons)

const ComparisonSection = () => (
  <KitSection
    num="06"
    title="Comparison Block — A vs B"
    deck={`Head-to-head is one of the most-requested data shapes (player vs player, faction vs
           faction, this game vs the last). The block needs a clear axis: 1-2 entities,
           N rows of paired metrics, a winner indicator per row.`}>

    <VariantRow cols={2}>
      <Variant id="06-A" title="Mirrored ledger"
        when="Default head-to-head. Mirror lets the eye snap to which side wins each row; centerline carries the metric label."
        avoid="Doesn't scale beyond 2 entities — for 3+ use variant D." height={300}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'baseline', borderBottom: '2px solid var(--rule)', paddingBottom: 6 }}>
          <div style={{ textAlign: 'right' }}>
            <Headline size={14}>Federation of Sol</Headline>
            <Mono size={9} style={{ color: 'var(--ink-3)' }}>5 GAMES</Mono>
          </div>
          <Mono size={11} style={{ color: 'var(--accent)' }}>VS</Mono>
          <div>
            <Headline size={14}>Emirates of Hacan</Headline>
            <Mono size={9} style={{ color: 'var(--ink-3)' }}>5 GAMES</Mono>
          </div>
        </div>
        {[
          ['7.4', 'avg VP',           '7.0', 'L'],
          ['2',   'wins',             '1',   'L'],
          ['68%', 'objectives scored','61%', 'L'],
          ['12',  'tech researched',  '17',  'R'],
          ['4.2', 'planets/round',    '5.8', 'R'],
          ['11',  'agendas voted ‘for’', '14','R'],
        ].map(([l, m, r, w], i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--ink-5)' }}>
            <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: 6 }}>
              {w === 'L' && <Mono size={9} style={{ color: 'var(--accent)' }}>◀</Mono>}
              <NumMono size={14} style={{ color: w === 'L' ? 'var(--accent)' : 'var(--ink)', fontWeight: w === 'L' ? 700 : 400 }}>{l}</NumMono>
            </div>
            <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{m}</Mono>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <NumMono size={14} style={{ color: w === 'R' ? 'var(--accent)' : 'var(--ink)', fontWeight: w === 'R' ? 700 : 400 }}>{r}</NumMono>
              {w === 'R' && <Mono size={9} style={{ color: 'var(--accent)' }}>▶</Mono>}
            </div>
          </div>
        ))}
      </Variant>

      <Variant id="06-B" title="Diverging bars (relative)"
        when="When the absolute numbers matter less than the GAP. Quick visual ‘which side over-indexes on what’."
        avoid="Loses absolute values; pair with hover tooltips for actual numbers." height={300}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 6, borderBottom: '2px solid var(--rule)' }}>
          <Headline size={13} style={{ textAlign: 'right' }}>Sol</Headline>
          <Headline size={13}>Hacan</Headline>
        </div>
        {[
          ['Avg VP',          7.4, 7.0],
          ['Tech rate',       2.4, 3.4],
          ['Planet capture',  4.2, 5.8],
          ['Combat wins',     6.0, 3.5],
          ['Strategy: Trade', 0.2, 0.8],
          ['Strategy: War',   0.6, 0.2],
        ].map(([m, a, b], i) => {
          const max = Math.max(a, b);
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 0, padding: '5px 0', borderBottom: '1px solid var(--ink-5)' }}>
              {/* left bar (right-aligned, grows leftward) */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, paddingRight: 6, borderRight: '1px solid var(--ink-3)' }}>
                <NumMono size={10} style={{ color: a >= b ? 'var(--accent)' : 'var(--ink-3)' }}>{a}</NumMono>
                <div style={{ width: `${(a / max) * 100}%`, height: 6, background: a >= b ? 'var(--accent)' : 'var(--ink-3)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 6 }}>
                <div style={{ width: `${(b / max) * 100}%`, height: 6, background: b >= a ? 'var(--accent)' : 'var(--ink-3)' }} />
                <NumMono size={10} style={{ color: b >= a ? 'var(--accent)' : 'var(--ink-3)' }}>{b}</NumMono>
              </div>
              <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', gridColumn: '1 / 3', textAlign: 'center', marginTop: 2 }}>{m}</Mono>
            </div>
          );
        })}
      </Variant>
    </VariantRow>

    <div style={{ height: 12 }} />

    <VariantRow cols={2}>
      <Variant id="06-C" title="Synced trend overlay"
        when="When you want to compare TRAJECTORIES, not just totals. Two factions across same N games."
        avoid="3+ overlapping lines becomes spaghetti — limit to 2 here." height={260}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div>
            <Mono size={9} style={{ color: 'var(--ink-3)' }}>VP per game · last 5</Mono>
            <Headline size={14}>Sol vs Hacan</Headline>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Mono size={10}><span style={{ color: 'var(--accent)', fontSize: 14 }}>━</span> Sol</Mono>
            <Mono size={10}><span style={{ color: 'var(--ink)', fontSize: 14 }}>━</span> Hacan</Mono>
          </div>
        </div>
        <Card style={{ padding: 12 }}>
          <MultiSpark series={[
            { values: [6, 8, 10, 5, 9] },
            { values: [5, 7, 8, 9, 6] },
          ]} width={360} height={120} highlight={0} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <Mono size={9} style={{ color: 'var(--ink-3)' }}>Game 1</Mono>
            <Mono size={9} style={{ color: 'var(--ink-3)' }}>Game 5</Mono>
          </div>
        </Card>
        <Body size={11} style={{ marginTop: 8 }}>
          Sol is more volatile (σ 1.9) but higher peak. Hacan is steady (σ 1.4).
        </Body>
      </Variant>

      <Variant id="06-D" title="Multi-entity (3-up)"
        when="When the user picks 3+ entities to compare. Same shape as A but pivots to columns; first column is metric labels."
        avoid="Beyond 4-5 columns, type breaks at this width — switch to scrollable table." height={260}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 10, paddingBottom: 6, borderBottom: '2px solid var(--rule)', alignItems: 'baseline' }}>
          <span />
          <Headline size={13}>Sol</Headline>
          <Headline size={13}>Hacan</Headline>
          <Headline size={13}>Xxcha</Headline>
        </div>
        {[
          ['Games',           ['5', '5', '4']],
          ['Wins',            ['2', '1', '1']],
          ['Avg VP',          ['7.4', '7.0', '6.8']],
          ['Pace (VP/round)', ['1.48', '1.40', '1.36']],
          ['Tech avg',        ['4.0', '5.6', '3.8']],
          ['Best',            ['1st', '1st', '1st']],
        ].map(([label, vals], i) => {
          const nums = vals.map(v => parseFloat(v)).filter(n => !isNaN(n));
          const best = nums.length ? Math.max(...nums) : null;
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 10, padding: '5px 0', borderBottom: '1px solid var(--ink-5)' }}>
              <Mono size={10} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</Mono>
              {vals.map((v, j) => {
                const isWin = best !== null && parseFloat(v) === best;
                return <NumMono key={j} size={12} style={{ color: isWin ? 'var(--accent)' : 'var(--ink)', fontWeight: isWin ? 700 : 400 }}>{v}</NumMono>;
              })}
            </div>
          );
        })}
      </Variant>
    </VariantRow>
  </KitSection>
);

window.ComparisonSection = ComparisonSection;
