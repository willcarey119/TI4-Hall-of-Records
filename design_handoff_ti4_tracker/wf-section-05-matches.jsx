/* global React, KitSection, VariantRow, Variant, Display, Headline, Deck, Body, Mono, Num, NumMono, Label, Kicker, Rule, Ph, Chip, Swatch, Bar, StackBar, Sparkline, Card, Tag, SAMPLE_FACTIONS */
// §05 Match / game result cards — the home page lives or dies here.

const MatchResultSection = () => (
  <KitSection
    num="05"
    title="Match / Game Result Cards"
    deck={`The home page is currently a vertical list of these. Each variant trades density vs.
           narrative — the goal is for any user to know who won, in how long, and what was strange about
           the game, in one glance.`}>

    <VariantRow cols={3}>
      <Variant id="05-A" title="Current — winner-led list row"
        when="Baseline. One line per game; cheap to scan. Use when the homepage = chronological archive."
        avoid="No sense of the game's shape; every game looks the same." height={170}>
          <Mono size={9} style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.14em', borderBottom: '1px solid var(--accent)', paddingBottom: 2, display: 'inline-block' }}>SUN · 19 JAN 25 · 5h 24m · ROUND 7</Mono>
          <Display size={18} style={{ marginTop: 4 }}>Sol takes the throne · 10–9</Display>
          <div style={{ marginTop: 8 }}>
            {SAMPLE_FACTIONS.map((f, i) => (
              <Chip key={f.id} name={f.short} vp={f.vp} shade={f.shade} winner={i === 0} />
            ))}
          </div>
          <Mono size={9} style={{ color: 'var(--ink-3)', marginTop: 8, display: 'block' }}>Ended: Status →</Mono>
      </Variant>

      <Variant id="05-B" title="Card with VP race spark"
        when="Adds the SHAPE of the game. Did the leader run away? Was it a comeback? The spark answers."
        avoid="Spark requires VP-by-round data — hide for partial games." height={170}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>19 Jan 25 · 5h 24m</Mono>
          <Mono size={9} style={{ color: 'var(--accent)' }}>R7 · 10VP</Mono>
        </div>
        <Headline size={16} style={{ marginTop: 4 }}>Sol over Hacan, by 1</Headline>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginTop: 6 }}>
          <div style={{ flex: 1 }}>
            <Sparkline values={[0,2,4,6,7,9,10]} width={140} height={28} stroke="var(--accent)" strokeWidth={1.6} />
            <Sparkline values={[0,1,3,5,6,7,9]}  width={140} height={28} stroke="var(--ink)" />
          </div>
          <Mono size={9} style={{ color: 'var(--ink-3)' }}>VP race</Mono>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
          <Chip name="SOL" vp={10} shade={0} winner />
          <Chip name="HAC" vp={9} shade={1} />
          <Chip name="XXC" vp={8} shade={2} />
          <Mono size={9} style={{ color: 'var(--ink-3)', alignSelf: 'center' }}>+ 3 more</Mono>
        </div>
      </Variant>

      <Variant id="05-C" title="Headline + dropcap recap"
        when="Editorial hero — the most recent or most-discussed game. Makes the home page feel like a paper."
        avoid="Burns ~280px of vertical space; one per page max." height={250}>
        <Mono size={9} style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>The Final Edition · w8k93c</Mono>
        <Display size={26} style={{ marginTop: 4 }}>Sol takes the throne</Display>
        <Deck size={12} style={{ marginTop: 2 }}>
          A four-VP swing in round 6 turned a Hacan-led race into a Sol coronation.
        </Deck>
        <p className="wf-body" style={{ fontSize: 11, marginTop: 8, columns: 2, columnGap: 12, columnRule: '1px solid var(--ink-5)' }}>
          <span style={{ float: 'left', fontFamily: 'var(--serif)', fontWeight: 800, fontSize: '2.6em', lineHeight: 0.85, marginRight: 4, marginTop: 2, color: 'var(--accent)' }}>S</span>
          ol entered round six trailing by three. Then Imperial flipped twice, a public objective scored, and a successful Mutiny vote handed the table its winner. Hacan's late-game tech rush could not match the carrier-fleet attrition Sol traded for victory points, and the scoreline closed at ten to nine.
        </p>
      </Variant>
    </VariantRow>

    <div style={{ height: 12 }} />

    <VariantRow cols={3}>
      <Variant id="05-D" title="Result tile (grid-friendly)"
        when="Home page in 2- or 3-column grid mode. Wider than tall; thumb-and-glance."
        avoid="No room for spark or detail — pair with hover-to-expand." height={170}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Mono size={9} style={{ color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>2025-01-19 · w8k93c</Mono>
          <Tag>R7</Tag>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
          <Num size={36} style={{ color: 'var(--accent)' }}>10</Num>
          <Mono size={11} style={{ color: 'var(--ink-3)' }}>—</Mono>
          <Num size={28} style={{ color: 'var(--ink-3)' }}>9</Num>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Chip name="SOL" shade={0} winner />
          <Mono size={11} style={{ color: 'var(--ink-3)', alignSelf: 'center' }}>over</Mono>
          <Chip name="HACAN" shade={1} />
        </div>
        <Rule kind="soft" style={{ margin: '8px 0 4px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Mono size={9} style={{ color: 'var(--ink-3)' }}>5h 24m · 6 empires</Mono>
          <Mono size={9} style={{ color: 'var(--ink-3)' }}>Open →</Mono>
        </div>
      </Variant>

      <Variant id="05-E" title="Race ladder (final standings strip)"
        when="When you want every faction's final position visible at once. Good detail-page header."
        avoid="At 8+ players the chips wrap — handle responsively." height={170}>
        <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Final standings · w8k93c</Mono>
        <Rule style={{ margin: '6px 0' }} />
        {SAMPLE_FACTIONS.map((f, i) => (
          <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '18px 14px 1.5fr 2fr 32px', gap: 6, alignItems: 'center', padding: '3px 0', borderBottom: '1px solid var(--ink-5)' }}>
            <Mono size={10} style={{ color: 'var(--ink-3)' }}>{i + 1}</Mono>
            <Swatch shade={f.shade} size={8} />
            <span className="wf-mono" style={{ fontSize: 10 }}>{f.short}</span>
            <Bar pct={(f.vp / 10) * 100} height={6} fill={i === 0 ? 'var(--accent)' : 'var(--ink)'} />
            <NumMono size={11} style={{ textAlign: 'right' }}>{f.vp}</NumMono>
          </div>
        ))}
      </Variant>

      <Variant id="05-F" title="Storyline card — annotated"
        when="When the game has a notable beat — comeback, blowout, photo finish — surface that as a tag + caption."
        avoid="Requires server-side storyline detection; ship behind a feature flag." height={170}>
        <div style={{ display: 'flex', gap: 6 }}>
          <Tag kind="accent">PHOTO FINISH</Tag>
          <Tag kind="outline">7 ROUNDS</Tag>
          <Tag kind="outline">FULL TABLE</Tag>
        </div>
        <Headline size={15} style={{ marginTop: 6 }}>Sol over Hacan · won on the final agenda</Headline>
        <Mono size={10} style={{ color: 'var(--ink-3)', marginTop: 4, display: 'block' }}>
          † Closest finish on record · 1 VP margin
        </Mono>
        <Rule kind="soft" style={{ margin: '8px 0 6px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Mono size={9} style={{ color: 'var(--ink-3)' }}>2025-01-19 · 5h 24m</Mono>
          <div style={{ display: 'flex', gap: 4 }}>
            <Chip name="SOL" vp={10} shade={0} winner />
            <Chip name="HAC" vp={9} shade={1} />
          </div>
        </div>
      </Variant>
    </VariantRow>
  </KitSection>
);

window.MatchResultSection = MatchResultSection;
