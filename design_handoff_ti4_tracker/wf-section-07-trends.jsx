/* global React, KitSection, VariantRow, Variant, Display, Headline, Deck, Body, Mono, Num, NumMono, Label, Kicker, Rule, Ph, Chip, Swatch, Bar, StackBar, Sparkline, MultiSpark, Card, Tag */
// §07 Trend / sparkline cards & §08 Distribution / histogram cards combined

const TrendDistSection = () => (
  <>
    <KitSection
      num="07"
      title="Trend & Sparkline Cards"
      deck={`Time series across rounds, games, or seasons. Lo-fi line shapes — accuracy isn't the point;
             communicating direction-of-travel is.`}>

      <VariantRow cols={3}>
        <Variant id="07-A" title="Sparkline tile"
          when="In-grid trend at glance. Same dimensions as a stat card; reads as one of N tiles." height={180}
          avoid="Don't add axis labels — keep it loose. If user needs precision, link to full chart.">
          <Label>VP pace · last 7 games</Label>
          <Num size={28} style={{ marginTop: 2 }}>1.42</Num>
          <Mono size={10} style={{ color: 'var(--moss)' }}>↑ 0.08 vs prior</Mono>
          <Sparkline values={[1.2, 1.3, 1.5, 1.1, 1.4, 1.6, 1.5]} width={220} height={36} stroke="var(--ink)" />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Mono size={9} style={{ color: 'var(--ink-3)' }}>G1</Mono>
            <Mono size={9} style={{ color: 'var(--ink-3)' }}>G7</Mono>
          </div>
        </Variant>

        <Variant id="07-B" title="Multi-line chart card"
          when="Hero VP race chart on game-detail page. 3-7 lines, leader highlighted in vermillion." height={180}
          avoid="Beyond 7 lines, segment in a small-multiples grid (variant C).">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Headline size={13}>VP race · w8k93c</Headline>
            <Mono size={9} style={{ color: 'var(--ink-3)' }}>0 → 10 VP · 7 rounds</Mono>
          </div>
          <MultiSpark series={[
            { values: [0, 1, 3, 5, 7, 8, 10] },
            { values: [0, 2, 3, 4, 6, 8, 9] },
            { values: [0, 1, 2, 4, 5, 7, 8] },
            { values: [0, 1, 2, 3, 4, 5, 6] },
            { values: [0, 1, 1, 2, 3, 4, 5] },
            { values: [0, 0, 1, 2, 2, 3, 4] },
          ]} width={300} height={110} highlight={0} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {[0,1,2,3,4,5].map(i => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 2, background: i === 0 ? 'var(--accent)' : 'var(--ink-3)' }} />
                <Mono size={9}>{['SOL','HAC','XXC','ARB','YSS','NAA'][i]}</Mono>
              </span>
            ))}
          </div>
        </Variant>

        <Variant id="07-C" title="Small multiples"
          when="Per-faction trend, side-by-side. The faceting IS the comparison." height={180}
          avoid="Each tile must keep same Y-axis scale or it lies — annotate ‘scale: 0–10VP’.">
          <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>VP per round, by faction · scale 0–10</Mono>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 6 }}>
            {[
              { n: 'SOL', v: [0,1,3,5,7,8,10], hi: true },
              { n: 'HAC', v: [0,2,3,4,6,8,9] },
              { n: 'XXC', v: [0,1,2,4,5,7,8] },
              { n: 'ARB', v: [0,1,2,3,4,5,6] },
              { n: 'YSS', v: [0,1,1,2,3,4,5] },
              { n: 'NAA', v: [0,0,1,2,2,3,4] },
            ].map((f, i) => (
              <div key={i} style={{ borderTop: '1px solid var(--ink-4)', paddingTop: 4 }}>
                <Mono size={9}>{f.n}</Mono>
                <Sparkline values={f.v} width={80} height={28} stroke={f.hi ? 'var(--accent)' : 'var(--ink)'} strokeWidth={f.hi ? 1.6 : 1} />
                <NumMono size={10} style={{ color: 'var(--ink-3)' }}>final {f.v[f.v.length - 1]}</NumMono>
              </div>
            ))}
          </div>
        </Variant>
      </VariantRow>
    </KitSection>

    <KitSection
      num="08"
      title="Distribution & Histogram Cards"
      deck={`How is a value spread? Game-length histogram, VP-margin distribution, agenda-pass distribution.
             Lo-fi: simple bar columns, no axis chrome unless density demands it.`}>

      <VariantRow cols={3}>
        <Variant id="08-A" title="Bar histogram"
          when="Default distribution. Bins along X, count up Y. Cheap & honest." height={200}
          avoid="Bin choice matters — annotate bin width.">
          <Label>Game length distribution</Label>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80, marginTop: 8, borderBottom: '1px solid var(--ink)' }}>
            {[8, 14, 22, 30, 26, 18, 12, 6, 4, 2].map((v, i) => (
              <div key={i} style={{ flex: 1, height: `${v * 2.6}px`, background: i === 3 ? 'var(--accent)' : 'var(--ink)' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <Mono size={9} style={{ color: 'var(--ink-3)' }}>2h</Mono>
            <Mono size={9} style={{ color: 'var(--ink-3)' }}>median 5h 30m</Mono>
            <Mono size={9} style={{ color: 'var(--ink-3)' }}>11h+</Mono>
          </div>
          <Mono size={9} style={{ color: 'var(--ink-3)', marginTop: 4, display: 'block' }}>n = 142 · bin = 1h</Mono>
        </Variant>

        <Variant id="08-B" title="Stacked breakdown"
          when="Distribution-by-category. ‘VP source breakdown across games’." height={200}
          avoid="Hard to compare cross-segment — ok for ‘what's the mix’, not ‘who's biggest at X’.">
          <Label>Final VP — by source</Label>
          <div style={{ marginTop: 10 }}>
            {['SOL', 'HAC', 'XXC', 'ARB'].map((n, i) => (
              <div key={n} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Mono size={10}>{n}</Mono>
                  <NumMono size={10} style={{ color: 'var(--ink-3)' }}>{[10, 9, 8, 6][i]} VP</NumMono>
                </div>
                <StackBar height={10} segments={[
                  { value: [4,3,3,2][i], label: 'pub',  fill: 'var(--ink)' },
                  { value: [3,2,2,2][i], label: 'sec',  fill: 'var(--ink-3)' },
                  { value: [2,3,2,1][i], label: 'imp',  fill: 'var(--accent)' },
                  { value: [1,1,1,1][i], label: 'agd',  fill: 'var(--ink-4)' },
                ]} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Mono size={9}><span style={{ background: 'var(--ink)', padding: '0 4px', color: 'var(--paper)' }}>PUB</span></Mono>
              <Mono size={9}><span style={{ background: 'var(--ink-3)', padding: '0 4px', color: 'var(--paper)' }}>SEC</span></Mono>
              <Mono size={9}><span style={{ background: 'var(--accent)', padding: '0 4px', color: 'var(--paper)' }}>IMP</span></Mono>
              <Mono size={9}><span style={{ background: 'var(--ink-4)', padding: '0 4px', color: 'var(--paper)' }}>AGD</span></Mono>
            </div>
          </div>
        </Variant>

        <Variant id="08-C" title="Heatmap density"
          when="2D distribution — faction × strategy card pick rates. Color blocks read fast." height={200}
          avoid="In greyscale you lose half the encoding — keep cell count low (≤8×8).">
          <Label>Faction × strategy card · pick density</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(8, 1fr)', columnGap: 1, marginTop: 6 }}>
            <div />
            {['LD','DI','PO','CO','TR','WA','TE','IM'].map(s => <Mono key={s} size={8} style={{ textAlign: 'center', color: 'var(--ink-3)' }}>{s}</Mono>)}
            {['SOL','HAC','XXC','ARB','YSS','NAA'].map((f, fi) => (
              <React.Fragment key={f}>
                <Mono size={9}>{f}</Mono>
                {[0.1, 0.2, 0.6, 0.4, 0.3, 0.5, 0.7, 0.9].map((v, i) => {
                  const intensity = (v + (fi * 0.07) % 0.4);
                  return <div key={i} style={{ height: 16, background: `oklch(0.18 0.01 60 / ${intensity.toFixed(2)})` }} />;
                })}
              </React.Fragment>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Mono size={9} style={{ color: 'var(--ink-3)' }}>0%</Mono>
            <div style={{ flex: 1, height: 6, background: 'linear-gradient(to right, oklch(0.97 0.012 80), var(--ink))' }} />
            <Mono size={9} style={{ color: 'var(--ink-3)' }}>100%</Mono>
          </div>
        </Variant>
      </VariantRow>
    </KitSection>
  </>
);

window.TrendDistSection = TrendDistSection;
