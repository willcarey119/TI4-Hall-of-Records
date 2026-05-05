/* global React, KitSection, VariantRow, Variant, Display, Headline, Deck, Body, Mono, Num, NumMono, Label, Kicker, Rule, Ph, Chip, Swatch, Bar, StackBar, Sparkline, Card, Tag */
// §03 Stat cards — single metric, with deltas, sparks, footnotes.
// This is the FiveThirtyEight bread-and-butter atom. Used everywhere on League page.

const StatCardSection = () => (
  <KitSection
    num="03"
    title="Stat Cards"
    deck={`A single number is rarely enough — what changed, vs what, where it ranks. These atoms
           let the League page surface ten facts on one screen without becoming a brochure.`}>

    <VariantRow cols={4}>
      <Variant id="03-A" title="Anchor — number + label"
        when="When you have one or two cards on a page and want the number to read like a verdict. Game detail Recap section."
        avoid="Lonely without context — pair with at least one supporting card.">
        <Label>Margin of Victory</Label>
        <Num size={56} style={{ color: 'var(--accent)' }}>4</Num>
        <Mono size={10} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Victory points</Mono>
        <Rule style={{ margin: '10px 0 6px' }} />
        <Body size={11}>Sol over Hacan · 10–6.</Body>
      </Variant>

      <Variant id="03-B" title="With delta vs prior"
        when="Time-comparison metrics — ‘this season vs last’. League → Stats."
        avoid="Need ≥2 seasons of data, otherwise the delta reads as noise.">
        <Label>Avg game length</Label>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <Num size={36}>5h 42m</Num>
          <Mono size={11} style={{ color: 'var(--moss)', fontWeight: 700 }}>↓ 28m</Mono>
        </div>
        <Mono size={10} style={{ color: 'var(--ink-3)' }}>vs. season I avg of 6h 10m</Mono>
        <Rule style={{ margin: '10px 0 6px' }} />
        <Bar pct={68} height={4} />
        <Mono size={9} style={{ color: 'var(--ink-3)', marginTop: 4, display: 'block' }}>Faster than 68% of recorded games</Mono>
      </Variant>

      <Variant id="03-C" title="Number + sparkline + range"
        when="Trend-aware metrics. The sparkline is the second sentence."
        avoid="Sparkline must be ≥4 data points; with fewer, fall back to variant A.">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Label>Mecatol holds</Label>
          <Mono size={9} style={{ color: 'var(--ink-3)' }}>last 7 games</Mono>
        </div>
        <Num size={36}>4.3</Num>
        <Mono size={10} style={{ color: 'var(--ink-3)' }}>avg rounds held</Mono>
        <div style={{ marginTop: 8 }}><Sparkline values={[2, 5, 4, 7, 3, 5, 4]} width={200} height={32} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Mono size={9} style={{ color: 'var(--ink-3)' }}>min 2 (G3)</Mono>
          <Mono size={9} style={{ color: 'var(--ink-3)' }}>max 7 (G4)</Mono>
        </div>
      </Variant>

      <Variant id="03-D" title="Rank + percentile"
        when="‘Where does this rank?’ stats — most-played faction, biggest blowout, etc. The rank IS the headline."
        avoid="Skip the percentile when n &lt; 10 — it's not statistically meaningful.">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <Num size={48} style={{ color: 'var(--accent)' }}>#2</Num>
          <Mono size={10} style={{ color: 'var(--ink-3)' }}>of 25 factions</Mono>
        </div>
        <Headline size={13} style={{ marginTop: 4 }}>Sol — by win rate</Headline>
        <Rule style={{ margin: '10px 0 6px' }} />
        <Bar pct={92} height={4} fill="var(--accent)" />
        <Mono size={9} style={{ color: 'var(--ink-3)', marginTop: 4, display: 'block' }}>92nd percentile · 0.40 vs league 0.16</Mono>
      </Variant>
    </VariantRow>

    <div style={{ height: 12 }} />

    <VariantRow cols={4}>
      <Variant id="03-E" title="Stack of three (compact KPI tile)"
        when="Top-of-page summary tiles. Three numbers stacked = one ‘where do we stand’ glance."
        avoid="Don't stack &gt;3; reads as a list, not a snapshot.">
        <Label>This Season</Label>
        <Rule style={{ margin: '4px 0' }} />
        {[['7', 'games played'], ['25', 'unique factions'], ['10VP', 'standard target']].map(([n, l], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '6px 0', borderBottom: i < 2 ? '1px solid var(--ink-5)' : 'none' }}>
            <Num size={26} style={{ minWidth: 70 }}>{n}</Num>
            <Mono size={10} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</Mono>
          </div>
        ))}
      </Variant>

      <Variant id="03-F" title="Hero with byline + footnote"
        when="The marquee number on a page — make it BIG, frame with reasoning, footnote the source data."
        avoid="One per page max — anchors the visual hierarchy.">
        <Mono size={9} style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Headline figure</Mono>
        <Num size={84} style={{ display: 'block', marginTop: 4, lineHeight: 0.9 }}>347</Num>
        <Headline size={14} style={{ marginTop: 4 }}>Combats logged across the season</Headline>
        <Rule kind="soft" style={{ margin: '10px 0 6px' }} />
        <Mono size={9} style={{ color: 'var(--ink-3)', display: 'block' }}>† All 7 games · roll-by-roll combats from action_log</Mono>
      </Variant>

      <Variant id="03-G" title="Inline split — numerator / denominator"
        when="Rate metrics where both halves are interesting. ‘14 of 32 agendas passed’ reads better than ‘44%’ alone."
        avoid="Don't pair with a sparkline — too much going on.">
        <Label>Agenda pass rate</Label>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
          <Num size={36}>14</Num>
          <Mono size={18} style={{ color: 'var(--ink-3)' }}>/</Mono>
          <Num size={28} style={{ color: 'var(--ink-3)' }}>32</Num>
          <span style={{ flex: 1 }} />
          <Num size={20}>44%</Num>
        </div>
        <Rule style={{ margin: '8px 0 4px' }} />
        <StackBar segments={[
          { value: 14, fill: 'var(--ink)' },
          { value: 18, fill: 'var(--ink-4)' },
        ]} height={6} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <Mono size={9} style={{ color: 'var(--ink-3)' }}>passed</Mono>
          <Mono size={9} style={{ color: 'var(--ink-3)' }}>failed/abstained</Mono>
        </div>
      </Variant>

      <Variant id="03-H" title="Quote / superlative card"
        when="‘Awards’ pattern — superlatives across the season. End-game recap & League highlights."
        avoid="More editorial than analytical — keep to ≤4 per page.">
        <Mono size={9} style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>The Throne</Mono>
        <div className="wf-display" style={{ fontSize: 24, fontStyle: 'italic', marginTop: 6, lineHeight: 1.05 }}>
          Most thrones,<br/>any season
        </div>
        <Rule style={{ margin: '8px 0 6px' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <Chip name="HACAN" shade={1} />
          <Mono size={11} style={{ color: 'var(--ink-2)' }}>3 wins, season I</Mono>
        </div>
      </Variant>
    </VariantRow>
  </KitSection>
);

window.StatCardSection = StatCardSection;
