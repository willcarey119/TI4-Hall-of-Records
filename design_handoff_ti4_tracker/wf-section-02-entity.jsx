/* global React, KitSection, VariantRow, Variant, Display, Headline, Deck, Body, Mono, Num, NumMono, Label, Kicker, Rule, Ph, Chip, Swatch, Bar, StackBar, Sparkline, Card, Tag, SAMPLE_FACTIONS */
// §02 Faction / Player entity cards — the primary entity in the app.
// In the existing app these are scattered as inline lists of FactionChips.
// Here we explore the entity card as a first-class atom.

const FactionEntitySection = () => (
  <KitSection
    num="02"
    title="Faction Entity Cards"
    deck={`Faction is the primary axis. The card needs to surface identity, headline performance,
           and 1-2 distinguishing stats — and compose into a 6-up grid for League pages without
           breaking type rhythm. Lo-fi swatches stand in for brand color blocks.`}>

    <VariantRow cols={3}>
      <Variant id="02-A" title="Index card — short stack"
        when="Default. Compact, prints well in a 3-column grid; gives identity + W/L + 1 stat without overwhelming."
        avoid="Looks austere on its own — needs to live in a grid of siblings.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8, borderBottom: '1px solid var(--rule)' }}>
          <div style={{ width: 36, height: 36, background: 'var(--ink-3)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Headline size={15}>Federation of Sol</Headline>
            <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Base · Soldier archetype</Mono>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '10px 0' }}>
          <div>
            <Label>Played</Label>
            <Num size={26}>5</Num>
          </div>
          <div>
            <Label>Wins</Label>
            <Num size={26} style={{ color: 'var(--accent)' }}>2</Num>
          </div>
          <div>
            <Label>Avg VP</Label>
            <Num size={26}>7.4</Num>
          </div>
        </div>
        <Rule kind="soft" />
        <Mono size={10} style={{ color: 'var(--ink-3)', marginTop: 6, display: 'block' }}>Last seen — Game w8k93c · 2 wks ago →</Mono>
      </Variant>

      <Variant id="02-B" title="Dossier — sparkline-led"
        when="When you want to communicate trajectory at a glance — recent VP per game as a sparkline beats any summary number."
        avoid="Sparkline needs ≥3 games of data to be meaningful. Hide for cold-start factions.">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--rule)', paddingBottom: 4 }}>
          <Mono size={9} style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Dossier · No. 04</Mono>
          <Mono size={9} style={{ color: 'var(--ink-3)' }}>5 GAMES · 2W</Mono>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '10px 0', alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, background: 'var(--ink-3)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Headline size={14}>Federation of Sol</Headline>
            <Body size={11} style={{ marginTop: 2 }}>“Soldier archetype — flexible carrier, infantry-focused.”</Body>
          </div>
          <Num size={22} style={{ color: 'var(--accent)' }}>40%</Num>
        </div>
        <Rule kind="soft" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 6 }}>
          <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>VP per game</Mono>
          <Sparkline values={[6, 8, 10, 5, 9]} width={120} height={22} />
          <NumMono size={11} style={{ color: 'var(--ink-3)' }}>last 5</NumMono>
        </div>
      </Variant>

      <Variant id="02-C" title="Newsprint headline card"
        when="Editorial pages — when the faction IS the story (faction profile pages, ‘faction of the week’)."
        avoid="Too much chrome for a 6-up grid; reserve for full-bleed faction pages.">
        <Mono size={9} style={{ color: 'var(--accent)', letterSpacing: '0.14em', textTransform: 'uppercase', borderBottom: '1px solid var(--accent)', paddingBottom: 2 }}>The Throne · Profile</Mono>
        <div className="wf-display" style={{ fontSize: 22, marginTop: 6, fontStyle: 'italic' }}>Federation of Sol</div>
        <Deck size={11} style={{ marginTop: 2 }}>
          The galaxy’s carrier-fleet generalists. Two thrones in five outings.
        </Deck>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'flex-end' }}>
          <Num size={36} style={{ color: 'var(--accent)' }}>2</Num>
          <Mono size={10} style={{ color: 'var(--ink-3)', paddingBottom: 4 }}>thrones / 5 outings</Mono>
        </div>
        <Rule kind="thick" style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}><Label>Avg VP</Label><NumMono size={14}>7.4</NumMono></div>
          <div style={{ flex: 1 }}><Label>Best Finish</Label><NumMono size={14}>1st</NumMono></div>
          <div style={{ flex: 1 }}><Label>Pick Rate</Label><NumMono size={14}>71%</NumMono></div>
        </div>
      </Variant>
    </VariantRow>

    <div style={{ height: 12 }} />

    <VariantRow cols={3}>
      <Variant id="02-D" title="Tabular row (for /league/factions list)"
        when="Sortable index page. Wider than tall, repeats cleanly, sortable by every column. Goes hand-in-hand with the table-row leaderboard from §04."
        avoid="Visual identity is muted — pair with a row hover that opens a Dossier (variant B) drawer.">
        <div style={{ display: 'grid', gridTemplateColumns: '14px 1.6fr 0.8fr 0.8fr 0.8fr 1fr 0.6fr', gap: 8, padding: '0 0 4px', borderBottom: '1px solid var(--ink-4)' }}>
          {['', 'FACTION', 'GP', 'W', 'AVG VP', 'TREND', ''].map(h => (
            <Mono key={h} size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</Mono>
          ))}
        </div>
        {[
          { name: 'Federation of Sol',     gp: 5, w: 2, avg: 7.4, t: [6,8,10,5,9] },
          { name: 'Emirates of Hacan',     gp: 5, w: 1, avg: 7.0, t: [5,7,8,9,6] },
          { name: 'Xxcha Kingdom',         gp: 4, w: 1, avg: 6.8, t: [6,7,5,9] },
          { name: 'Yssaril Tribes',        gp: 4, w: 1, avg: 6.0, t: [4,8,7,5] },
          { name: 'Naalu Collective',      gp: 3, w: 0, avg: 5.3, t: [4,6,6] },
        ].map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '14px 1.6fr 0.8fr 0.8fr 0.8fr 1fr 0.6fr', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--ink-5)', alignItems: 'center' }}>
            <Swatch shade={i} />
            <span className="wf-mono" style={{ fontSize: 11, color: 'var(--ink)' }}>{r.name}</span>
            <NumMono size={11}>{r.gp}</NumMono>
            <NumMono size={11} style={{ color: r.w > 0 ? 'var(--accent)' : 'var(--ink-3)' }}>{r.w}</NumMono>
            <NumMono size={11}>{r.avg.toFixed(1)}</NumMono>
            <Sparkline values={r.t} width={90} height={16} />
            <Mono size={9} style={{ color: 'var(--ink-3)' }}>→</Mono>
          </div>
        ))}
      </Variant>

      <Variant id="02-E" title="Per-player attribution card"
        when="Player profile pages. Folds the (opt-in) first-name attribution into the same shape — same bones, swap entity type."
        avoid="Player names are anonymized by default — keep the masked state legible (Anon-7).">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid var(--rule)', paddingBottom: 8 }}>
          <Ph style={{ width: 36, height: 36, fontSize: 8 }}>P</Ph>
          <div style={{ flex: 1 }}>
            <Headline size={15}>Tim</Headline>
            <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>3 known aliases · 7 games</Mono>
          </div>
          <Tag kind="outline">Player</Tag>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, padding: '10px 0' }}>
          {[['7','Games'], ['3','Wins'], ['7.6','Avg VP'], ['43%','Win Rate']].map(([n, l], i) => (
            <div key={i}><Label>{l}</Label><Num size={20} style={{ color: l === 'Wins' ? 'var(--accent)' : 'var(--ink)' }}>{n}</Num></div>
          ))}
        </div>
        <Rule kind="soft" />
        <Mono size={9} style={{ color: 'var(--ink-3)', marginTop: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Most-played factions</Mono>
        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
          <Chip name="YSSARIL" vp={3} shade={4} />
          <Chip name="HACAN" vp={2} shade={1} />
          <Chip name="SOL" vp={2} shade={0} />
        </div>
      </Variant>

      <Variant id="02-F" title="Mini chip — atomic pill"
        when="Inline references inside body copy, table cells, agenda voter lists. Anywhere the entity is a citation, not the subject."
        avoid="No room for stats; if you need a number besides VP, escalate to variant A.">
        <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Inline citation chip</Mono>
        <Body size={12} style={{ marginTop: 6 }}>
          The agenda passed thanks to <Chip name="SOL" vp={6} shade={0} /> swinging late, with <Chip name="HACAN" vp={3} shade={1} /> and <Chip name="XXCHA" vp={2} shade={2} /> joining for influence ride-alongs. Only <Chip name="YSSARIL" vp={1} shade={4} /> abstained.
        </Body>
        <Rule kind="soft" style={{ margin: '12px 0 8px' }} />
        <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cluster — voters list</Mono>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
          {SAMPLE_FACTIONS.map((f, i) => (
            <Chip key={f.id} name={f.short} vp={f.vp} shade={f.shade} winner={i === 0} />
          ))}
        </div>
        <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 8, display: 'block' }}>Cluster — winner-prefixed</Mono>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
          <Chip name="SOL" vp={10} shade={0} winner />
          <Chip name="HACAN" vp={9} shade={1} />
          <Chip name="XXCHA" vp={8} shade={2} />
        </div>
      </Variant>
    </VariantRow>
  </KitSection>
);

window.FactionEntitySection = FactionEntitySection;
