/* global React, FACTIONS, FactionDot, Mast, Kicker, Headline, Deck, Byline, Label, Rule, Placeholder, Note, SketchFrame, InlineBar */

// ──────────────────────────────────────────────────────────────
// SCREEN 9 — FACTION PICKER / DRAFT
// ──────────────────────────────────────────────────────────────

const ALL_FACTIONS = [
  'Sol','Hacan','Xxcha','Arborec','Yssaril','Naalu','Jol-Nar','Mahact','Mentak','Argent',
  'L1Z1X','Saar','Letnev','Winnu','N\'orr','Nekro','Empyrean','Naaz-Rokha','Titans','Ghosts',
  'Vuil\'raith','Cabal','Yin','Muaat','Keleres'
];

const Draft_Carousel = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Faction Draft · 25 Civilizations" right="Pick 1 of 5 in your pool" />
    <Headline size={20}>Choose your empire.</Headline>
    <Deck>Snake-draft order: Sarah → Mike → Liz → Tom → Jane → Pat. Currently on pick 3 of 6.</Deck>
    <Rule kind="double" />
    <div style={{ display: 'flex', gap: 6, overflow: 'hidden', marginTop: 8 }}>
      {[FACTIONS[0], FACTIONS[1], FACTIONS[2], FACTIONS[3], FACTIONS[4]].map((f, i) => (
        <SketchFrame key={i} style={{ flex: i === 1 ? 1.4 : 1, padding: 8, borderColor: i === 1 ? 'var(--accent)' : 'var(--rule)', borderWidth: i === 1 ? 2 : 1, position: 'relative', height: 200 }}>
          <div className={f.cls} style={{ width: '100%', height: 50, background: 'currentColor', opacity: 0.15, marginBottom: 4 }} />
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: i === 1 ? 14 : 11, lineHeight: 1.1 }}>{f.name}</div>
          <Byline style={{ marginTop: 2 }}>{['Diplomatic','Trade Empire','Slow burn','Robotic horde','Sneak'][i]}</Byline>
          <Rule />
          <div style={{ fontFamily: 'var(--mono)', fontSize: 8, lineHeight: 1.4 }}>
            <div>2 starting tech</div>
            <div>Flagship: <i>placeholder</i></div>
            <div>3 commodities</div>
          </div>
          {i === 1 && <div className="tag" style={{ position: 'absolute', top: 4, right: 4, background: 'var(--accent)' }}>HOVER</div>}
        </SketchFrame>
      ))}
    </div>
    <Rule />
    <Label>Drafted</Label>
    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
      <span className="faction-chip f-sol">Sarah · Sol</span>
      <span className="faction-chip f-hac">Mike · Hacan</span>
      <span className="tag-outline" style={{ borderStyle: 'dashed' }}>Liz · ?</span>
    </div>
    <Note style={{ top: 60, right: 14 }}>tap card to lock<br/>swipe to compare</Note>
  </div>
);

const Draft_Roster = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Faction Roster · 25 entries" right="Filter · Sort · Compare" />
    <Headline size={18}>The full almanac.</Headline>
    <Rule kind="double" />
    <div style={{ display: 'flex', gap: 4, marginTop: 4, fontFamily: 'var(--mono)', fontSize: 9 }}>
      {['ALL','BASE','POK','CODEX'].map((t, i) => (
        <div key={t} className={i === 0 ? 'tab on' : 'tab'} style={{ padding: '2px 6px' }}>{t}</div>
      ))}
      <span style={{ flex: 1 }} />
      <span className="tab">↕ Tier</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, marginTop: 8 }}>
      {ALL_FACTIONS.slice(0, 25).map((name, i) => (
        <div key={i} style={{ border: '1px solid var(--ink-4)', padding: '4px 4px', position: 'relative', background: i < 6 ? 'var(--paper-2)' : 'var(--paper)' }}>
          <div style={{ height: 18, background: `oklch(${0.5+(i%5)*0.04} 0.1 ${(i*45)%360})`, opacity: 0.5, marginBottom: 3 }} />
          <div style={{ fontFamily: 'var(--serif)', fontSize: 8.5, fontWeight: 600, lineHeight: 1.05 }}>{name}</div>
          <Byline style={{ fontSize: 7, marginTop: 1 }}>tier {['A','B','S','C','A'][i%5]}</Byline>
          {i < 6 && <div style={{ position: 'absolute', top: 2, right: 2, fontSize: 8, color: 'var(--accent)' }}>✓</div>}
        </div>
      ))}
    </div>
    <Rule />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
      <span><Label>Drafted</Label> 6 / 6</span>
      <span><Label>Banned</Label> 3</span>
      <span><Label>Pool</Label> 16 remaining</span>
    </div>
  </div>
);

const Draft_Compare = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Compare · 3 factions" right="Side by side" />
    <Headline size={18}>Sol · Hacan · Xxcha.</Headline>
    <Rule kind="double" />
    <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(3, 1fr)', gap: 0, marginTop: 6, fontSize: 10 }}>
      {[null, FACTIONS[0], FACTIONS[1], FACTIONS[2]].map((f, i) => (
        <div key={i} style={{ borderBottom: '2px solid var(--ink)', padding: '4px 4px' }}>
          {f ? <><FactionDot f={f} size={8} /> <span style={{ fontFamily: 'var(--serif)', fontWeight: 700 }}>{f.short}</span></> : <Label>Stat</Label>}
        </div>
      ))}
      {[
        ['Win rate', '52%', '57%', '48%'],
        ['Tier', 'A', 'S', 'B+'],
        ['Start tech', '2', '1', '1'],
        ['Commodities', '4', '6', '4'],
        ['Flagship cost', '8', '8', '8'],
        ['Difficulty', 'medium', 'low', 'high'],
        ['Pace', 'aggro', 'eco', 'slow'],
      ].map((row, ri) => row.map((c, ci) => (
        <div key={`${ri}-${ci}`} style={{ padding: '5px 4px', borderBottom: '1px dotted var(--ink-4)', borderLeft: ci > 0 ? '1px dotted var(--ink-4)' : 'none', fontFamily: ci === 0 ? 'var(--sans)' : 'var(--mono)', fontWeight: ci === 0 ? 600 : 400 }}>
          {c}
        </div>
      )))}
    </div>
    <Rule />
    <Byline>Tap any cell to see source data</Byline>
  </div>
);

const Draft_Phone = () => (
  <div className="wf" style={{ background: '#000', padding: 0 }}>
    <div className="phone-screen">
      <div style={{ padding: '32px 14px 8px', textAlign: 'center' }}>
        <Byline>Pick 3 of 6 · Mike's turn</Byline>
        <Headline size={18} style={{ marginTop: 4 }}>Your pool.</Headline>
      </div>
      <hr className="rule-double" style={{ margin: '0 14px' }} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[FACTIONS[1], FACTIONS[3], FACTIONS[4], FACTIONS[5]].map((f, i) => (
          <SketchFrame key={f.id} style={{ padding: 8, borderColor: i === 0 ? 'var(--accent)' : 'var(--rule)', borderWidth: i === 0 ? 2 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className={f.cls} style={{ width: 30, height: 30, background: 'currentColor', opacity: 0.5 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 14, fontWeight: 700 }}>{f.name}</div>
                <Byline>{['Trade · S-tier','Robot · A','Sneak · A','Slow · B'][i]}</Byline>
              </div>
              {i === 0 ? <div className="tag" style={{ background: 'var(--accent)' }}>PICK</div> : <span style={{ fontSize: 16, color: 'var(--ink-3)' }}>›</span>}
            </div>
          </SketchFrame>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, padding: 10, background: 'var(--ink)', color: 'var(--paper)', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10 }}>LOCK PICK ▸</div>
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────
// SCREEN 10 — END-GAME RECAP INFOGRAPHIC
// ──────────────────────────────────────────────────────────────

const Recap_Front = () => (
  <div className="wf" style={{ padding: 14 }}>
    <div style={{ borderTop: '4px double var(--rule)', borderBottom: '1px solid var(--rule)', padding: '4px 0', fontFamily: 'var(--mono)', fontSize: 8, display: 'flex', justifyContent: 'space-between' }}>
      <span>FINAL EDITION</span><span>Vol. IV · No. VII</span><span>26 Apr 2026</span>
    </div>
    <div className="mast-title" style={{ fontSize: 30, textAlign: 'center', padding: '8px 0', borderBottom: '3px double var(--rule)', fontStyle: 'italic' }}>The Galactic Chronicle</div>
    <Kicker left="The Final Tally · Round VII" right="6 hours · 4 wars · 1 throne" />
    <Headline size={28} style={{ marginTop: 6, textAlign: 'center' }}>SOL TAKES THE THRONE.</Headline>
    <Deck style={{ textAlign: 'center', marginTop: 4 }}>Imperial play in the final round seals a one-point victory over Hacan.</Deck>
    <Rule kind="double" />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, alignItems: 'flex-start' }}>
      <div>
        <Label>Winner</Label>
        <div className="f-sol" style={{ width: 40, height: 40, background: 'currentColor', opacity: 0.5, margin: '4px 0' }} />
        <div style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 16 }}>Sol</div>
        <div className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 26, color: 'var(--accent)' }}>10 VP</div>
        <Byline>Sarah · seat 3</Byline>
      </div>
      <div className="col-3" style={{ fontSize: 9, lineHeight: 1.4, columns: 1 }}>
        <div className="dropcap">After six rounds of stalemate over Mecatol Rex, the Federation of Sol's Imperial gambit in round seven sealed a one-point victory. Hacan's economic empire ends second after dominating four of seven rounds.</div>
      </div>
      <div>
        <Label>Margin</Label>
        <div className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 26 }}>1 VP</div>
        <Byline>closest in 12 games</Byline>
        <Rule />
        <Label>Length</Label>
        <div className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 18 }}>6h 14m</div>
        <Byline>54 turns total</Byline>
      </div>
    </div>
    <Rule />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3 }}>
      {FACTIONS.map((f, i) => (
        <div key={f.id} style={{ textAlign: 'center', padding: '4px 0', background: i === 0 ? 'var(--paper-2)' : 'transparent', border: i === 0 ? '1px solid var(--accent)' : '1px solid var(--ink-4)' }}>
          <FactionDot f={f} size={6} />
          <div className="byline" style={{ fontSize: 7 }}>{f.short}</div>
          <div className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 14 }}>{[10, 9, 6, 5, 4, 3][i]}</div>
        </div>
      ))}
    </div>
    <Note style={{ top: 80, right: 8, transform: 'rotate(-3deg)' }}>front-page<br/>shareable!</Note>
  </div>
);

const Recap_Stats = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="By the Numbers" right="A statistical post-mortem" />
    <Headline size={20}>The game in 12 numbers.</Headline>
    <Rule kind="double" />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 8 }}>
      {[
        { v: '347', l: 'Dice rolled', s: 'across 14 combats' },
        { v: '23', l: 'Ships destroyed', s: '11 dread, 5 cruiser…' },
        { v: '87', l: 'Trade goods', s: 'changed hands' },
        { v: '14', l: 'Tech researched', s: '4 unit upgrades' },
        { v: '7', l: 'Agendas voted', s: '5 passed as law' },
        { v: '6h 14m', l: 'Real-time', s: 'turn avg 6m 56s' },
        { v: '54', l: 'Turns', s: '11 passes' },
        { v: '36', l: 'Planets ctrl', s: '4 contested at end' },
        { v: '11 → 6', l: 'Power swing', s: 'Hacan → Sol' },
      ].map((s, i) => (
        <div key={i} style={{ borderTop: '2px solid var(--ink)', paddingTop: 4 }}>
          <div className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 22, lineHeight: 1, color: i % 4 === 0 ? 'var(--accent)' : 'var(--ink)' }}>{s.v}</div>
          <div className="label" style={{ marginTop: 2 }}>{s.l}</div>
          <Byline style={{ marginTop: 1 }}>{s.s}</Byline>
        </div>
      ))}
    </div>
    <Note style={{ bottom: 12, right: 14 }} arrow={false}>shareable image<br/>1080×1080 export</Note>
  </div>
);

const Recap_Awards = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Superlatives · Round of Applause" right="Six trophies, six hands" />
    <Headline size={20}>Awards Ceremony.</Headline>
    <Rule kind="double" />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
      {[
        { t: 'The Throne', who: FACTIONS[0], sub: 'first to 10 VP', icon: '♔' },
        { t: 'Master of Coin', who: FACTIONS[1], sub: 'most resources spent · 71', icon: '⌖' },
        { t: 'God of War', who: FACTIONS[5], sub: 'most kills · 9 ships', icon: '⚔' },
        { t: 'The Senator', who: FACTIONS[2], sub: '38 influence in votes', icon: '⚖' },
        { t: 'Mad Scientist', who: FACTIONS[3], sub: '5 tech researched', icon: '⚛' },
        { t: 'The Survivor', who: FACTIONS[4], sub: 'last to lose a ship', icon: '✦' },
      ].map((a, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px', gap: 8, alignItems: 'center', padding: '6px 8px', border: '1px solid var(--rule)', background: i === 0 ? 'var(--paper-2)' : 'var(--paper)' }}>
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 22, textAlign: 'center', color: i === 0 ? 'var(--accent)' : 'var(--ink)' }}>{a.icon}</div>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 14 }}>{a.t}</div>
            <Byline>{a.sub}</Byline>
          </div>
          <div style={{ textAlign: 'right' }}>
            <FactionDot f={a.who} size={9} />
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 12 }}>{a.who.short}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Recap_Story = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="The Narrative" right="A round-by-round retelling" />
    <Headline size={20} style={{ fontStyle: 'italic' }}>Seven rounds, one throne.</Headline>
    <Rule kind="double" />
    <div style={{ position: 'relative', paddingLeft: 60, marginTop: 8 }}>
      <div style={{ position: 'absolute', left: 28, top: 0, bottom: 0, width: 2, background: 'var(--ink)' }} />
      {[
        { r: 'I', t: 'First Blood at Quann', who: FACTIONS[1], txt: 'Hacan claims the wormhole and opens trade routes; Sol fortifies the home system.' },
        { r: 'II', t: 'Mecatol Contested', who: FACTIONS[0], txt: 'Three fleets converge over the imperial throne; Sol takes it on initiative 1.' },
        { r: 'III', t: 'The Senate Convenes', who: FACTIONS[2], txt: 'Mining Initiative passes 4-2. Xxcha rises in the standings.' },
        { r: 'IV', t: 'War over Lazar', who: FACTIONS[1], txt: 'Hacan loses 3 dreadnoughts but secures the lane.' },
        { r: 'V', t: 'Imperial Pivot', who: FACTIONS[0], txt: 'Sol picks Imperial, scores Public-II, pulls within striking distance.' },
        { r: 'VI · VII', t: 'The Final Stretch', who: FACTIONS[0], txt: 'Sol scores ten on the final activation. The Chronicle goes to press.' },
      ].map((e, i) => (
        <div key={i} style={{ position: 'relative', paddingBottom: 10 }}>
          <div style={{ position: 'absolute', left: -38, top: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--paper)', border: '2px solid var(--ink)', textAlign: 'center', fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 11, lineHeight: '20px' }}>{e.r}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 12 }}>{e.t}</span>
            <span><FactionDot f={e.who} size={7} /> <span className="byline">{e.who.short}</span></span>
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 10, fontStyle: 'italic', color: 'var(--ink-2)', lineHeight: 1.3, marginTop: 2 }}>{e.txt}</div>
        </div>
      ))}
    </div>
  </div>
);

Object.assign(window, {
  Draft_Carousel, Draft_Roster, Draft_Compare, Draft_Phone,
  Recap_Front, Recap_Stats, Recap_Awards, Recap_Story,
});
