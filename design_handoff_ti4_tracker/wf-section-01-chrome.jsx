/* global React, KitSection, VariantRow, Variant, Display, Headline, Deck, Body, Mono, Num, NumMono, Label, Kicker, Rule, Ph, Chip, Swatch, Bar, StackBar, Card, Tag, SAMPLE_FACTIONS */
// §01 Page chrome — masthead + nav + filter/control bar + breadcrumb
// All variations stay within the existing newspaper masthead idiom; what changes
// is the density and how dynamic chrome (filters, scrubbers, view-mode toggles) is exposed.

const PageChromeSection = () => (
  <KitSection
    num="01"
    title="Page Chrome — masthead, nav, breadcrumb, filter bar"
    deck={`Today the masthead is anchored at the top of every page but doesn't expose page-level state.
           These variants explore tighter density and surfacing the controls (round/season/faction filter)
           the data deserves.`}>

    <VariantRow cols={3}>
      <Variant id="01-A" title="Current — masthead + tab strip"
        when="Brand-forward landing chrome. Best when the user is arriving fresh and you want the editorial identity to set the tone."
        avoid="Wastes ~120px of vertical real estate on every interior page; no surface for filters or scrubbers.">
        <div style={{ borderTop: '3px double var(--rule)', borderBottom: '3px double var(--rule)', padding: '8px 0' }}>
          <Display size={22}>TI4 · Hall of Records</Display>
          <Mono size={9} style={{ color: 'var(--ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Twilight Imperium IV · Private League Archive
          </Mono>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--rule)', marginTop: 0, gap: 0 }}>
          {['Games', 'League', 'Agenda'].map((t, i) => (
            <div key={t} className="wf-mono" style={{
              fontSize: 10, padding: '8px 14px',
              borderBottom: i === 0 ? '2px solid var(--ink)' : '2px solid transparent',
              color: i === 0 ? 'var(--ink)' : 'var(--ink-3)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: -1,
            }}>{t}</div>
          ))}
          <div style={{ flex: 1 }} />
          <div className="wf-mono" style={{ fontSize: 10, padding: '8px 6px', color: 'var(--ink-4)' }}>A− A+ · Archivist→</div>
        </div>
        <div style={{ marginTop: 14 }}>
          <Ph style={{ height: 80 }}>page body</Ph>
        </div>
      </Variant>

      <Variant id="01-B" title="Compact — single rule, inline nav, breadcrumb crawl"
        when="Default for interior pages. Halves the chrome height and adds a breadcrumb so deep-linked pages have orientation."
        avoid="Loses the editorial 'feel' of the home page — pair this with variant A on landing only.">
        <div style={{
          borderBottom: '2px solid var(--rule)',
          padding: '8px 0', display: 'flex', alignItems: 'baseline', gap: 16,
        }}>
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontStyle: 'italic', fontSize: 17, letterSpacing: '-0.01em' }}>
            Hall of Records
          </div>
          <div style={{ display: 'flex', gap: 14, flex: 1 }}>
            {['Games', 'League', 'Agenda', 'Players'].map((t, i) => (
              <span key={t} className="wf-mono" style={{
                fontSize: 10, color: i === 1 ? 'var(--ink)' : 'var(--ink-3)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                borderBottom: i === 1 ? '1px solid var(--ink)' : 'none',
                paddingBottom: 2,
              }}>{t}</span>
            ))}
          </div>
          <Mono size={9} style={{ color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>A− A+ · ↑ Upload</Mono>
        </div>
        {/* breadcrumb crawl */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--ink-4)' }}>
          <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>League</Mono>
          <Mono size={9} style={{ color: 'var(--ink-4)' }}>›</Mono>
          <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Factions</Mono>
          <Mono size={9} style={{ color: 'var(--ink-4)' }}>›</Mono>
          <Mono size={9} style={{ color: 'var(--ink) ', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Federation of Sol</Mono>
        </div>
        <div style={{ marginTop: 12 }}><Ph style={{ height: 76 }}>page body</Ph></div>
      </Variant>

      <Variant id="01-C" title="Dense — slate header w/ live filter rail"
        when="Stats-heavy pages (League, Agenda). Dock filters into the chrome so they're always reachable; scrubber line is fixed under the rule."
        avoid="Don't use on pages with no filterable state — empty rail looks broken.">
        <div style={{
          borderBottom: '1px solid var(--rule)',
          padding: '6px 0', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <Display size={14} style={{ fontStyle: 'italic' }}>HoR</Display>
          <div style={{ display: 'flex', gap: 10 }}>
            {['Games', 'League', 'Agenda', 'Players'].map((t, i) => (
              <span key={t} className="wf-mono" style={{
                fontSize: 10, color: i === 1 ? 'var(--ink)' : 'var(--ink-3)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                fontWeight: i === 1 ? 600 : 400,
              }}>{t}</span>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <Mono size={9} style={{ color: 'var(--ink-4)' }}>↑ Upload · A−A+</Mono>
        </div>
        {/* filter rail */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--ink-4)', flexWrap: 'wrap' }}>
          <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filter</Mono>
          <Tag kind="outline">All seasons ▾</Tag>
          <Tag kind="outline">All factions ▾</Tag>
          <Tag kind="outline">Player count: any ▾</Tag>
          <Tag kind="outline">10VP only</Tag>
          <div style={{ flex: 1 }} />
          <Mono size={9} style={{ color: 'var(--ink-3)' }}>7 games · 42 faction-games</Mono>
        </div>
        <div style={{ marginTop: 8 }}><Ph style={{ height: 80 }}>filterable page body</Ph></div>
      </Variant>
    </VariantRow>

    <div style={{ height: 12 }} />

    <VariantRow cols={3}>
      <Variant id="01-D" title="Game-detail header w/ scrubber"
        when="Game detail pages. Replaces the wall of section anchors with a single round-by-round scrubber that drives ALL widgets."
        avoid="Requires every widget on the page to accept a `roundCutoff` prop — significant refactor.">
        <div style={{ borderBottom: '1px solid var(--rule)', padding: '6px 0', display: 'flex', gap: 8, alignItems: 'baseline' }}>
          <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Game</Mono>
          <span className="wf-headline" style={{ fontSize: 14 }}>w8k93c · 2025-01-19</span>
          <div style={{ flex: 1 }} />
          <Mono size={9} style={{ color: 'var(--ink-4)' }}>5h 24m · 6 empires · 10VP</Mono>
        </div>
        {/* scrubber */}
        <div style={{ padding: '10px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Mono size={9}>R1</Mono>
            <div style={{ flex: 1, position: 'relative', height: 14 }}>
              <div style={{ position: 'absolute', top: 6, left: 0, right: 0, height: 1, background: 'var(--ink-4)' }} />
              {[0, 1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{
                  position: 'absolute', left: `${(i / 6) * 100}%`,
                  top: i === 4 ? 1 : 4, transform: 'translateX(-50%)',
                  width: i === 4 ? 12 : 6, height: i === 4 ? 12 : 6,
                  background: i === 4 ? 'var(--accent)' : (i < 4 ? 'var(--ink)' : 'var(--paper)'),
                  border: '1px solid var(--ink)', borderRadius: '50%',
                }} />
              ))}
            </div>
            <Mono size={9}>R7</Mono>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <Mono size={9} style={{ color: 'var(--ink-3)' }}>Strategy · Action · Status · Agenda</Mono>
            <Mono size={9} style={{ color: 'var(--accent)' }}>VIEWING ROUND 5 — ACTION PHASE</Mono>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--rule)', borderTop: '1px solid var(--ink-4)', padding: '4px 0' }}>
          {['Recap', 'VP Race', 'Timeline', 'Dashboard', 'Planets', 'Tech', 'Agenda'].map((t, i) => (
            <span key={t} className="wf-mono" style={{ fontSize: 9, padding: '2px 6px', color: i === 0 ? 'var(--ink)' : 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: i === 0 ? '2px solid var(--accent)' : 'none' }}>
              {t}
            </span>
          ))}
        </div>
      </Variant>

      <Variant id="01-E" title="Quick-jump command palette"
        when="Power-user shortcut. Press / or click; surfaces every game, faction, agenda, and tech as searchable rows."
        avoid="Hidden affordance — keep it as ENHANCEMENT, not the primary way to navigate.">
        <div style={{ borderBottom: '2px solid var(--rule)', padding: '6px 0', display: 'flex', alignItems: 'baseline' }}>
          <Display size={14} style={{ fontStyle: 'italic' }}>Hall of Records</Display>
          <div style={{ flex: 1 }} />
          <div style={{ border: '1px solid var(--ink-4)', padding: '4px 8px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Mono size={10} style={{ color: 'var(--ink-3)' }}>⌕</Mono>
            <Mono size={10} style={{ color: 'var(--ink-3)' }}>Search games, factions, agendas…</Mono>
            <Tag kind="outline" style={{ marginLeft: 12 }}>/</Tag>
          </div>
        </div>
        {/* expanded palette */}
        <Card tight style={{ marginTop: 6, padding: 6 }}>
          <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 4px 4px' }}>Recent</Mono>
          {['Game · w8k93c — 2025-01-19', 'Faction · Federation of Sol', 'Agenda · Mutiny', 'League · Strategy Card win-rate'].map((s, i) => (
            <div key={i} style={{ padding: '5px 4px', borderTop: '1px solid var(--ink-5)', display: 'flex', alignItems: 'center', gap: 8, background: i === 0 ? 'var(--paper-2)' : 'transparent' }}>
              <Swatch shade={i} />
              <Mono size={10} style={{ color: i === 0 ? 'var(--ink)' : 'var(--ink-2)' }}>{s}</Mono>
              <div style={{ flex: 1 }} />
              {i === 0 && <Tag kind="outline">↵</Tag>}
            </div>
          ))}
        </Card>
        <Mono size={9} style={{ color: 'var(--ink-4)', marginTop: 8, display: 'block' }}>↑↓ navigate · ↵ open · esc close</Mono>
      </Variant>

      <Variant id="01-F" title="Sub-section nav (within page)"
        when="Long pages with 5+ sections (Game detail, League). A sticky sub-nav reduces ‘where am I?’ scroll fatigue."
        avoid="Two layers of nav can compete with the masthead — keep this VERY low contrast.">
        <Mono size={9} style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Page · League — Faction Stats</Mono>
        <div style={{ marginTop: 8, display: 'flex', borderTop: '1px solid var(--ink-4)', borderBottom: '1px solid var(--ink-4)', position: 'sticky', top: 0, background: 'var(--paper)' }}>
          {['§1 Win Rate', '§2 Pick Rate', '§3 Avg VP', '§4 Tech Mix', '§5 Strategy Mix', '§6 Per-Player'].map((t, i) => (
            <div key={t} className="wf-mono" style={{
              fontSize: 9, padding: '5px 8px', flex: 1,
              borderRight: i < 5 ? '1px solid var(--ink-5)' : 'none',
              color: i === 2 ? 'var(--ink)' : 'var(--ink-3)',
              background: i === 2 ? 'var(--paper-2)' : 'transparent',
              fontWeight: i === 2 ? 600 : 400,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{t}</div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}><Ph style={{ height: 70 }}>scrolling page · sub-nav highlights as you pass each anchor</Ph></div>
        <Mono size={9} style={{ color: 'var(--ink-4)', marginTop: 6, display: 'block' }}>(uses existing useScrollSpy hook)</Mono>
      </Variant>
    </VariantRow>
  </KitSection>
);

window.PageChromeSection = PageChromeSection;
