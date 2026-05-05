/* global React, KitSection, VariantRow, Variant, Display, Headline, Deck, Body, Mono, Num, NumMono, Label, Kicker, Rule, Ph, Chip, Swatch, Bar, StackBar, Sparkline, Card, Tag */
// §09 Faction breakdown · §10 Filter/control bar · §11 Empty/loading/error · §12 Mobile

const { useState: useStateBD } = React;

const BreakdownSection = () => (
  <KitSection
    num="09"
    title="Categorical Breakdown — Faction & Tech Mix"
    deck={`When the answer is a composition, not a number. Ten variants across the section
           cluster into two strategies: dominate-the-axis (treemap, donut) vs explain-the-mix (stacked rows).`}>

    <VariantRow cols={3}>
      <Variant id="09-A" title="Stacked row breakdown"
        when="Default for ‘who scored what’. Linear, easy to scan, prints well." height={210}
        avoid="Loses faction order if not sorted — pick by-VP or by-rank consistently.">
        <Label>VP by source · all factions, this game</Label>
        <Rule style={{ margin: '6px 0' }} />
        {['SOL','HAC','XXC','ARB','YSS','NAA'].map((f, i) => (
          <div key={f} style={{ display: 'grid', gridTemplateColumns: '36px 1fr 28px', gap: 6, alignItems: 'center', padding: '3px 0' }}>
            <Mono size={10}>{f}</Mono>
            <StackBar height={9} segments={[
              { value: [4,3,2,2,1,1][i], fill: 'var(--ink)' },
              { value: [3,2,3,1,2,1][i], fill: 'var(--ink-3)' },
              { value: [2,3,2,2,1,1][i], fill: 'var(--accent)' },
              { value: [1,1,1,1,1,1][i], fill: 'var(--ink-4)' },
            ]} />
            <NumMono size={10} style={{ textAlign: 'right' }}>{[10,9,8,6,5,4][i]}</NumMono>
          </div>
        ))}
      </Variant>

      <Variant id="09-B" title="Donut + legend"
        when="Single-entity composition (one faction's tech mix). Eye reads donut as ‘share of whole’." height={210}
        avoid="Don't use for 6+ slices; gets unreadable.">
        <Label>Tech mix · Hacan</Label>
        <div style={{ display: 'flex', gap: 14, marginTop: 8, alignItems: 'center' }}>
          <svg width={100} height={100}>
            <circle cx={50} cy={50} r={36} fill="none" stroke="var(--ink-4)" strokeWidth={16} />
            <circle cx={50} cy={50} r={36} fill="none" stroke="var(--ink)"   strokeWidth={16} strokeDasharray="80 226" transform="rotate(-90 50 50)" />
            <circle cx={50} cy={50} r={36} fill="none" stroke="var(--ink-3)" strokeWidth={16} strokeDasharray="60 226" strokeDashoffset="-80" transform="rotate(-90 50 50)" />
            <circle cx={50} cy={50} r={36} fill="none" stroke="var(--accent)" strokeWidth={16} strokeDasharray="50 226" strokeDashoffset="-140" transform="rotate(-90 50 50)" />
          </svg>
          <div style={{ flex: 1 }}>
            {[['Cyber', 6, 'var(--ink)'], ['Bio', 4, 'var(--ink-3)'], ['Warfare', 3, 'var(--accent)'], ['Prop', 2, 'var(--ink-4)']].map(([n, v, c], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', borderBottom: '1px solid var(--ink-5)' }}>
                <span style={{ width: 8, height: 8, background: c, display: 'inline-block' }} />
                <Mono size={10}>{n}</Mono>
                <div style={{ flex: 1 }} />
                <NumMono size={10}>{v}</NumMono>
              </div>
            ))}
          </div>
        </div>
      </Variant>

      <Variant id="09-C" title="Treemap (boxed proportions)"
        when="When you want at-a-glance dominance — biggest box wins. Faction prevalence across season." height={210}
        avoid="Bad at small differences — top 2 boxes look ~the same.">
        <Label>Faction prevalence · season I</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1.6fr 1.4fr', gridTemplateRows: '1.2fr 1fr', gap: 2, height: 130, marginTop: 6 }}>
          <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 4, gridRow: 'span 2' }}>
            <Mono size={10} style={{ color: 'var(--paper)' }}>SOL</Mono>
            <Num size={20} style={{ color: 'var(--paper)' }}>5</Num>
          </div>
          <div style={{ background: 'var(--ink-3)', color: 'var(--paper)', padding: 4 }}>
            <Mono size={9} style={{ color: 'var(--paper)' }}>HACAN</Mono>
            <Num size={16} style={{ color: 'var(--paper)' }}>5</Num>
          </div>
          <div style={{ background: 'var(--ink-3)', color: 'var(--paper)', padding: 4 }}>
            <Mono size={9} style={{ color: 'var(--paper)' }}>XXCHA</Mono>
            <Num size={16} style={{ color: 'var(--paper)' }}>4</Num>
          </div>
          <div style={{ background: 'var(--ink-4)', padding: 4 }}>
            <Mono size={9}>YSS · 4</Mono>
          </div>
          <div style={{ background: 'var(--ink-4)', padding: 4 }}>
            <Mono size={9}>NAA · 3</Mono>
          </div>
        </div>
        <Mono size={9} style={{ color: 'var(--ink-3)', marginTop: 6, display: 'block' }}>Box size = games played · 7 games · 6 unique factions</Mono>
      </Variant>
    </VariantRow>
  </KitSection>
);

const FilterEmptySection = () => (
  <>
    <KitSection
      num="10"
      title="Filter & Control Bar"
      deck={`Surface state. Default chips ride above any filterable list. Three densities map to
             three contexts: glance, configure, and tinker.`}>

      <VariantRow cols={3}>
        <Variant id="10-A" title="Inline chip filter"
          when="Lightweight, low-stakes filters (faction shortcuts). Each chip toggles a state." height={130}
          avoid="Limit to ≤8 chips; otherwise wraps awkwardly.">
          <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filter by faction</Mono>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
            {['ALL','SOL','HACAN','XXCHA','ARBOREC','YSSARIL','NAALU','+ MORE'].map((c, i) => (
              <span key={c} className="wf-mono" style={{
                fontSize: 10, padding: '3px 7px',
                border: '1px solid ' + (i === 0 ? 'var(--ink)' : 'var(--ink-4)'),
                background: i === 0 ? 'var(--ink)' : 'var(--paper)',
                color:      i === 0 ? 'var(--paper)' : 'var(--ink)',
              }}>{c}</span>
            ))}
          </div>
        </Variant>

        <Variant id="10-B" title="Segmented control + dropdown"
          when="View-mode + scoped filter. ‘View as: cards | table | dense’ + season picker." height={130}
          avoid="Mix of mode-toggle and filter is hard to learn — label both clearly.">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <Mono size={9} style={{ color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>VIEW</Mono>
              <div style={{ display: 'flex', border: '1px solid var(--ink)' }}>
                {['Cards', 'Table', 'Dense'].map((m, i) => (
                  <span key={m} className="wf-mono" style={{
                    fontSize: 10, padding: '4px 10px',
                    background: i === 1 ? 'var(--ink)' : 'transparent',
                    color: i === 1 ? 'var(--paper)' : 'var(--ink)',
                    borderRight: i < 2 ? '1px solid var(--ink)' : 'none',
                  }}>{m}</span>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <Mono size={9} style={{ color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>SEASON</Mono>
              <div style={{ border: '1px solid var(--ink-4)', padding: '4px 8px', display: 'flex', justifyContent: 'space-between' }}>
                <Mono size={11}>All seasons</Mono>
                <Mono size={11} style={{ color: 'var(--ink-3)' }}>▾</Mono>
              </div>
            </div>
            <div>
              <Mono size={9} style={{ color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>SORT</Mono>
              <div style={{ border: '1px solid var(--ink-4)', padding: '4px 8px' }}>
                <Mono size={11}>Most recent ▾</Mono>
              </div>
            </div>
          </div>
        </Variant>

        <Variant id="10-D" title="Drawer / advanced filters"
          when="Heavy filtering — all factions × seasons × player count × outcome. Hidden by default." height={130}
          avoid="Don't dump every filter open; surface 3 inline + ‘More filters →’.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag>2 active</Tag>
            <Tag kind="outline">Season I ✕</Tag>
            <Tag kind="outline">Sol ✕</Tag>
            <div style={{ flex: 1 }} />
            <Mono size={10} style={{ color: 'var(--accent)' }}>More filters →</Mono>
          </div>
          <Card tight style={{ marginTop: 8, padding: 8 }}>
            <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active filters · 2</Mono>
            <Rule kind="soft" style={{ margin: '4px 0' }} />
            <Mono size={10} style={{ display: 'block' }}>SEASON · I</Mono>
            <Mono size={10} style={{ display: 'block', color: 'var(--ink-3)' }}>FACTION · Federation of Sol</Mono>
            <Mono size={10} style={{ display: 'block', color: 'var(--ink-4)' }}>PLAYER COUNT · any</Mono>
            <Rule kind="soft" style={{ margin: '4px 0' }} />
            <Mono size={9} style={{ color: 'var(--accent)' }}>Reset all · Save preset</Mono>
          </Card>
        </Variant>
      </VariantRow>
    </KitSection>

    <KitSection
      num="11"
      title="Empty · Loading · Error States"
      deck={`Lo-fi pass on the un-fun moments. Match the rest of the system: mono labels, dashed
             slots for empty, animated rules for loading.`}>

      <VariantRow cols={3}>
        <Variant id="11-A" title="Empty state — Hall of Records"
          when="No games uploaded yet. Editorial about it — invitation, not error." height={170}
          avoid="No friendly mascot. Stay newsroom-formal.">
          <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Vol. 0 · No. 0</Mono>
          <Display size={20} style={{ marginTop: 4 }}>The presses await ink.</Display>
          <Deck size={11} style={{ marginTop: 4 }}>
            No games on record. Upload a TI Assistant export to begin the league archive.
          </Deck>
          <Rule style={{ margin: '12px 0' }} />
          <Ph style={{ height: 60 }}>↑ drag a .json export here</Ph>
        </Variant>

        <Variant id="11-B" title="Loading skeleton"
          when="While Firestore round-trips. Match the shape that's coming so layout doesn't jump." height={170}
          avoid="Don't use a generic spinner — breaks the editorial vibe.">
          <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Loading archive…</Mono>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ borderTop: i === 0 ? '1px solid var(--rule)' : '1px solid var(--ink-5)', padding: '8px 0' }}>
              <div style={{ height: 10, width: '40%', background: 'var(--ink-5)' }} />
              <div style={{ height: 14, width: '70%', background: 'var(--ink-4)', marginTop: 4 }} />
              <div style={{ height: 8, width: '90%', background: 'var(--ink-5)', marginTop: 6 }} />
            </div>
          ))}
        </Variant>

        <Variant id="11-C" title="Error / parse failure"
          when="Upload could not parse. Identify which event was malformed; offer a copy-paste support line." height={170}
          avoid="Don't show a stack trace by default — collapse it.">
          <Mono size={9} style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Stop the press</Mono>
          <Display size={20} style={{ marginTop: 4, color: 'var(--accent)' }}>Could not parse export.</Display>
          <Card tight style={{ marginTop: 8, background: 'var(--paper-2)' }}>
            <Mono size={10} style={{ color: 'var(--ink-2)' }}>
              Unknown action ‘ASSIGN_RELIC’ at log entry #142.<br />
              File: TIAssistant_Game Data.json
            </Mono>
          </Card>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <Mono size={10} style={{ color: 'var(--accent)' }}>Retry</Mono>
            <Mono size={10} style={{ color: 'var(--ink-3)' }}>Show details ▸</Mono>
            <div style={{ flex: 1 }} />
            <Mono size={10} style={{ color: 'var(--ink-3)' }}>Copy log →</Mono>
          </div>
        </Variant>
      </VariantRow>
    </KitSection>

    <KitSection
      num="12"
      title="Mobile Variants"
      deck={`Same atoms, restacked. Phone-frame mocks at the screen widths users actually have.`}>

      <VariantRow cols={3}>
        <Variant id="12-A" title="Game card · phone"
          when="Stacks the row layout vertically; chips wrap to multi-row. Tap-target ≥ 44px." height={420} avoid="">
          <div className="wf-phone" style={{ padding: 6 }}>
            <div className="wf-phone-screen" style={{ padding: 10 }}>
              <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>2025-01-19 · 5h 24m</Mono>
              <Headline size={16} style={{ marginTop: 4 }}>Sol takes the throne · 10–9</Headline>
              <Sparkline values={[0,2,4,6,7,9,10]} width={260} height={40} stroke="var(--accent)" strokeWidth={1.6} />
              <Rule kind="soft" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                <Chip name="SOL" vp={10} shade={0} winner />
                <Chip name="HACAN" vp={9} shade={1} />
                <Chip name="XXCHA" vp={8} shade={2} />
                <Chip name="ARBOREC" vp={6} shade={3} />
                <Chip name="YSSARIL" vp={5} shade={4} />
                <Chip name="NAALU" vp={4} shade={5} />
              </div>
              <Rule />
              <Mono size={10} style={{ color: 'var(--accent)' }}>Open game →</Mono>
            </div>
          </div>
        </Variant>

        <Variant id="12-B" title="League · phone (segmented)"
          when="Tabbed sections collapse League's 5 sub-sections into a horizontal segmented control." height={420} avoid="">
          <div className="wf-phone" style={{ padding: 6 }}>
            <div className="wf-phone-screen" style={{ padding: 10 }}>
              <Display size={16}>League</Display>
              <div style={{ display: 'flex', borderTop: '1px solid var(--ink)', borderBottom: '1px solid var(--ink)', marginTop: 8 }}>
                {['Factions','Strategy','Tech','Stats'].map((t, i) => (
                  <span key={t} className="wf-mono" style={{ flex: 1, fontSize: 9, padding: '6px 0', textAlign: 'center', background: i === 0 ? 'var(--ink)' : 'transparent', color: i === 0 ? 'var(--paper)' : 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {t}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                {[
                  ['Federation of Sol', 5, 2, 7.4],
                  ['Emirates of Hacan', 5, 1, 7.0],
                  ['Xxcha Kingdom', 4, 1, 6.8],
                  ['Yssaril Tribes', 4, 1, 6.0],
                  ['Naalu Collective', 3, 0, 5.3],
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', borderBottom: '1px solid var(--ink-5)' }}>
                    <Mono size={10} style={{ color: 'var(--ink-3)', width: 14 }}>{i + 1}</Mono>
                    <Swatch shade={i} />
                    <span className="wf-mono" style={{ fontSize: 11, flex: 1 }}>{r[0]}</span>
                    <NumMono size={10} style={{ color: 'var(--ink-3)' }}>{r[1]}GP</NumMono>
                    <NumMono size={10} style={{ color: r[2] > 0 ? 'var(--accent)' : 'var(--ink-3)' }}>{r[2]}W</NumMono>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Variant>

        <Variant id="12-C" title="Game-detail · phone w/ scrubber"
          when="Round scrubber proves out on phone first — vertical real estate is precious." height={420} avoid="">
          <div className="wf-phone" style={{ padding: 6 }}>
            <div className="wf-phone-screen" style={{ padding: 10 }}>
              <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>w8k93c · 5h 24m</Mono>
              <Headline size={14}>Sol over Hacan, by 1</Headline>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 0', borderTop: '1px solid var(--ink-4)', borderBottom: '1px solid var(--ink-4)', marginTop: 6 }}>
                <Mono size={9}>R1</Mono>
                <div style={{ flex: 1, position: 'relative', height: 12 }}>
                  <div style={{ position: 'absolute', top: 5, left: 0, right: 0, height: 1, background: 'var(--ink-4)' }} />
                  {[0,1,2,3,4,5,6].map(i => (
                    <div key={i} style={{ position: 'absolute', left: `${(i / 6) * 100}%`, top: i === 4 ? 1 : 3, transform: 'translateX(-50%)', width: i === 4 ? 10 : 6, height: i === 4 ? 10 : 6, background: i === 4 ? 'var(--accent)' : (i < 4 ? 'var(--ink)' : 'var(--paper)'), border: '1px solid var(--ink)', borderRadius: '50%' }} />
                  ))}
                </div>
                <Mono size={9}>R7</Mono>
              </div>
              <Mono size={9} style={{ color: 'var(--accent)', textAlign: 'center', display: 'block', padding: '4px 0' }}>VIEWING ROUND 5 — ACTION PHASE</Mono>
              <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--ink-4)', overflowX: 'auto' }}>
                {['Recap','VP','Time','Dash','Plnt','Tech','Agda'].map((t, i) => (
                  <span key={t} className="wf-mono" style={{ fontSize: 9, padding: '5px 7px', whiteSpace: 'nowrap', borderBottom: i === 1 ? '2px solid var(--accent)' : 'none', color: i === 1 ? 'var(--ink)' : 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {t}
                  </span>
                ))}
              </div>
              <Card tight style={{ marginTop: 8, padding: 8 }}>
                <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>VP race · through R5</Mono>
                <Sparkline values={[0,2,4,6,7]} width={240} height={40} stroke="var(--accent)" strokeWidth={1.6} />
                <Sparkline values={[0,1,3,5,6]} width={240} height={30} stroke="var(--ink)" />
              </Card>
            </div>
          </div>
        </Variant>
      </VariantRow>
    </KitSection>
  </>
);

window.BreakdownSection = BreakdownSection;
window.FilterEmptySection = FilterEmptySection;
