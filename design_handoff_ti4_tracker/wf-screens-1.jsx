/* global React, FACTIONS, FactionDot, FactionChip, Mast, Kicker, Headline, Deck, Byline, Label, Rule, Placeholder, Note, SketchFrame, InlineBar */

// ──────────────────────────────────────────────────────────────
// SCREEN 1 — ROUND / PHASE TRACKER
// ──────────────────────────────────────────────────────────────

const PHASES = ['Strategy', 'Action', 'Status', 'Agenda'];

const RoundPhase_Broadsheet = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Mast />
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginTop: 12 }}>
      <div>
        <Kicker left="Round V of VII" right="Phase 02 / 04" />
        <Headline size={36} style={{ fontStyle: 'italic' }}>Action Phase opens<br/>over Mecatol Rex.</Headline>
        <Deck style={{ marginTop: 6 }}>Hacan holds Initiative 1; Naalu still pondering. Three players have passed.</Deck>
        <Rule kind="double" />
        <div style={{ display: 'flex', gap: 6 }}>
          {PHASES.map((p, i) => (
            <div key={p} style={{ flex: 1, padding: '6px 8px', border: '1px solid var(--rule)', background: i === 1 ? 'var(--ink)' : 'var(--paper)', color: i === 1 ? 'var(--paper)' : 'var(--ink)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, opacity: 0.7 }}>{String(i+1).padStart(2,'0')}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 13, fontWeight: 700 }}>{p}</div>
            </div>
          ))}
        </div>
        <Rule />
        <div className="col" style={{ fontSize: 10, lineHeight: 1.45 }}>
          <div className="dropcap">In a stunning second-round reversal, the Emirates of Hacan locked the Lazar gate and announced production of two cruisers. Sol fleet repositions toward Quann; Yssaril plays a face-down promissory.</div>
          <div style={{ marginTop: 6 }}>Construction Strategy still on the table. Three players await the Trade secondary.</div>
        </div>
      </div>
      <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 12 }}>
        <Label>Active Player</Label>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, marginTop: 4 }}>Hacan</div>
        <Byline>Initiative 1 · 2 tactic remaining</Byline>
        <Rule />
        <Label>Turn Order This Round</Label>
        <div style={{ marginTop: 4 }}>
          {FACTIONS.map((f, i) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '1px dotted var(--ink-4)', opacity: i > 1 ? 0.55 : 1 }}>
              <span className="num" style={{ width: 14, color: 'var(--ink-3)' }}>{i+1}</span>
              <FactionDot f={f} />
              <span style={{ flex: 1, fontSize: 11 }}>{f.short}</span>
              <span className="label">{i === 0 ? 'ACTIVE' : i === 1 ? 'NEXT' : i > 3 ? 'PASSED' : 'WAITING'}</span>
            </div>
          ))}
        </div>
        <Rule />
        <Label>Inside this issue</Label>
        <ul style={{ margin: '4px 0 0 14px', padding: 0, fontSize: 10, lineHeight: 1.5 }}>
          <li>VP Race · p. 2</li>
          <li>Senate Returns · p. 4</li>
          <li>Combat at Lazar · p. 6</li>
        </ul>
      </div>
    </div>
    <Note style={{ top: 60, right: 20, transform: 'rotate(4deg)' }}>active phase highlight</Note>
  </div>
);

const RoundPhase_Phone = () => (
  <div className="wf" style={{ background: '#000', padding: 0 }}>
    <div className="phone-screen">
      <div style={{ padding: '32px 16px 12px' }}>
        <div className="mast-title" style={{ fontSize: 14, textAlign: 'center' }}>The Chronicle</div>
        <div className="byline" style={{ textAlign: 'center', marginTop: 2 }}>Round V · Live</div>
      </div>
      <hr className="rule-double" style={{ margin: '0 16px' }} />
      <div style={{ padding: 16 }}>
        <Label>Current Phase</Label>
        <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 28, lineHeight: 1, marginTop: 4 }}>Action</div>
        <Byline style={{ marginTop: 4 }}>02 of 04 · ~14 min elapsed</Byline>
        <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
          {PHASES.map((p, i) => (
            <div key={p} style={{ flex: 1, height: 4, background: i <= 1 ? 'var(--ink)' : 'oklch(0.18 0.01 60 / 0.15)' }} />
          ))}
        </div>
        <Rule />
        <Label>On the Clock</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, padding: 8, border: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
          <FactionDot f={FACTIONS[1]} size={14} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 14 }}>Hacan</div>
            <div className="byline">Initiative 1</div>
          </div>
          <div className="tag">ACTIVE</div>
        </div>
        <Rule />
        <Label>Up Next</Label>
        {FACTIONS.slice(2, 5).map((f) => (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
            <FactionDot f={f} size={8} />
            <span style={{ flex: 1, fontSize: 11 }}>{f.short}</span>
            <span className="byline">waiting</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16, padding: 10, background: 'var(--ink)', color: 'var(--paper)', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em' }}>
        ▸ ADVANCE TURN
      </div>
    </div>
  </div>
);

const RoundPhase_Timeline = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Game Timeline · 7 rounds projected" right="Now: R5 / Action" />
    <Headline size={20}>The campaign so far.</Headline>
    <Rule kind="double" />
    <div style={{ position: 'relative', marginTop: 14, paddingBottom: 24 }}>
      <div style={{ height: 2, background: 'var(--ink)', position: 'relative' }}>
        {[1,2,3,4,5,6,7].map((r, i) => (
          <div key={r} style={{ position: 'absolute', left: `${(i/6)*100}%`, top: -6, width: 14, height: 14, marginLeft: -7, borderRadius: '50%', background: r <= 5 ? 'var(--ink)' : 'var(--paper)', border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {r === 5 && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)' }} />}
          </div>
        ))}
        <div style={{ position: 'absolute', left: `${(4/6)*100}%`, top: 18, marginLeft: -40, width: 80, textAlign: 'center' }}>
          <div className="tag" style={{ background: 'var(--accent)' }}>YOU ARE HERE</div>
        </div>
      </div>
      <div style={{ display: 'flex', marginTop: 36 }}>
        {[1,2,3,4,5,6,7].map((r, i) => (
          <div key={r} style={{ flex: 1, paddingRight: 6, borderRight: i < 6 ? '1px dotted var(--ink-4)' : 'none', paddingLeft: i > 0 ? 6 : 0 }}>
            <div className="label">Round {r}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 10, lineHeight: 1.2, marginTop: 3, color: r > 5 ? 'var(--ink-4)' : 'var(--ink-2)' }}>
              {r === 1 && 'Quann captured'}
              {r === 2 && 'Mecatol contested'}
              {r === 3 && 'Senate convenes'}
              {r === 4 && 'Hacan techs Cruiser II'}
              {r === 5 && 'Action in progress…'}
              {r >= 6 && '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
    <Rule />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {PHASES.map((p, i) => (
        <SketchFrame key={p} style={{ borderColor: i === 1 ? 'var(--accent)' : 'var(--rule)', borderWidth: i === 1 ? 2 : 1 }}>
          <div className="label">Phase {String(i+1).padStart(2,'0')}</div>
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 13, marginTop: 2 }}>{p}</div>
          <div className="byline" style={{ marginTop: 4 }}>{i === 0 ? '✓ done · 4m' : i === 1 ? 'in progress · 14m' : '—'}</div>
        </SketchFrame>
      ))}
    </div>
    <Note style={{ bottom: 18, right: 14 }}>swipe to scrub<br/>past rounds</Note>
  </div>
);

const RoundPhase_Radial = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Round V" right="Phase Clock" />
    <Headline size={18}>The cycle continues.</Headline>
    <div style={{ position: 'relative', width: 220, height: 220, margin: '12px auto 0' }}>
      <svg viewBox="0 0 200 200" width="220" height="220" style={{ overflow: 'visible' }}>
        <circle cx="100" cy="100" r="90" fill="none" stroke="var(--rule)" strokeWidth="1" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="var(--ink-4)" strokeWidth="0.5" strokeDasharray="2 3" />
        {PHASES.map((p, i) => {
          const a0 = (i / 4) * Math.PI * 2 - Math.PI/2;
          const a1 = ((i+1) / 4) * Math.PI * 2 - Math.PI/2;
          const x0 = 100 + Math.cos(a0)*90, y0 = 100 + Math.sin(a0)*90;
          const x1 = 100 + Math.cos(a1)*90, y1 = 100 + Math.sin(a1)*90;
          const mid = (a0 + a1) / 2;
          const lx = 100 + Math.cos(mid)*55, ly = 100 + Math.sin(mid)*55;
          const isActive = i === 1;
          return (
            <g key={p}>
              <path d={`M100,100 L${x0},${y0} A90,90 0 0,1 ${x1},${y1} Z`} fill={isActive ? 'var(--ink)' : 'transparent'} stroke="var(--rule)" strokeWidth="1" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--serif)" fontWeight="700" fontSize="11" fill={isActive ? 'var(--paper)' : 'var(--ink)'}>{p}</text>
              <text x={lx} y={ly+12} textAnchor="middle" fontFamily="var(--mono)" fontSize="6" fill={isActive ? 'var(--paper)' : 'var(--ink-3)'} letterSpacing="1">0{i+1}</text>
            </g>
          );
        })}
        <circle cx="100" cy="100" r="22" fill="var(--paper)" stroke="var(--rule)" strokeWidth="1.5" />
        <text x="100" y="96" textAnchor="middle" fontFamily="var(--mono)" fontSize="6" fill="var(--ink-3)">ROUND</text>
        <text x="100" y="110" textAnchor="middle" fontFamily="var(--serif)" fontWeight="800" fontSize="18" fill="var(--accent)">V</text>
        <line x1="100" y1="100" x2="100" y2="35" stroke="var(--accent)" strokeWidth="1.5" />
        <circle cx="100" cy="35" r="3" fill="var(--accent)" />
      </svg>
      <Note style={{ top: -4, right: -10 }} arrow={false}>↻ rotates as<br/>phase advances</Note>
    </div>
    <Rule />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
      <div><Label>Active</Label><div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 13 }}>Action</div></div>
      <div style={{ textAlign: 'center' }}><Label>Player</Label><div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 13 }}>Hacan</div></div>
      <div style={{ textAlign: 'right' }}><Label>Elapsed</Label><div className="num" style={{ fontWeight: 700, fontSize: 13 }}>14:32</div></div>
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────
// SCREEN 2 — INITIATIVE & TURN ORDER
// ──────────────────────────────────────────────────────────────

const STRATEGY_CARDS = [
  { n: 1, name: 'Leadership' }, { n: 2, name: 'Diplomacy' }, { n: 3, name: 'Politics' },
  { n: 4, name: 'Construction' }, { n: 5, name: 'Trade' }, { n: 6, name: 'Warfare' },
  { n: 7, name: 'Technology' }, { n: 8, name: 'Imperial' },
];

const TurnOrder_Slate = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Initiative Slate · Round V" right="6 players" />
    <Headline size={20}>Order of Battle.</Headline>
    <Deck>Strategy cards drafted. Pass tokens count toward next round's Speaker.</Deck>
    <Rule kind="double" />
    <div>
      {[
        { f: FACTIONS[1], card: STRATEGY_CARDS[0], status: 'active' },
        { f: FACTIONS[5], card: STRATEGY_CARDS[1], status: 'next' },
        { f: FACTIONS[0], card: STRATEGY_CARDS[3], status: 'wait' },
        { f: FACTIONS[2], card: STRATEGY_CARDS[4], status: 'wait' },
        { f: FACTIONS[3], card: STRATEGY_CARDS[5], status: 'passed' },
        { f: FACTIONS[4], card: STRATEGY_CARDS[7], status: 'passed' },
      ].map((row, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 80px 60px', gap: 8, alignItems: 'center', padding: '7px 4px', borderBottom: '1px solid var(--ink-4)', opacity: row.status === 'passed' ? 0.45 : 1, background: row.status === 'active' ? 'var(--paper-2)' : 'transparent' }}>
          <div className="num" style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 800, color: row.status === 'active' ? 'var(--accent)' : 'var(--ink)' }}>{row.card.n}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FactionDot f={row.f} size={9} />
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 13 }}>{row.f.name}</span>
            </div>
            <div className="byline">{row.card.name}</div>
          </div>
          <div className="label">{row.card.name}</div>
          <div style={{ textAlign: 'right' }}>
            <span className={row.status === 'active' ? 'tag' : 'tag-outline'} style={{ background: row.status === 'active' ? 'var(--accent)' : undefined, borderColor: row.status === 'passed' ? 'var(--ink-3)' : 'var(--ink)', color: row.status === 'active' ? 'var(--paper)' : row.status === 'passed' ? 'var(--ink-3)' : 'var(--ink)' }}>
              {row.status.toUpperCase()}
            </span>
          </div>
        </div>
      ))}
    </div>
    <Note style={{ top: 84, right: 14 }}>tap row to drill<br/>into player</Note>
  </div>
);

const TurnOrder_Queue = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Up Now → Up Next" right="Drag to re-seat" />
    <Headline size={18}>The Queue.</Headline>
    <Rule kind="double" />
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', marginTop: 6 }}>
      {[
        { f: FACTIONS[1], card: 1, big: true, label: 'NOW' },
        { f: FACTIONS[5], card: 2, label: 'NEXT' },
        { f: FACTIONS[0], card: 4 },
        { f: FACTIONS[2], card: 5 },
        { f: FACTIONS[3], card: 6, passed: true },
        { f: FACTIONS[4], card: 8, passed: true },
      ].map((p, i) => (
        <div key={i} style={{ flex: p.big ? 1.6 : 1, opacity: p.passed ? 0.4 : 1 }}>
          <div className="label" style={{ height: 12 }}>{p.label || ''}</div>
          <SketchFrame style={{ padding: 6, height: p.big ? 110 : 88, borderColor: p.big ? 'var(--accent)' : 'var(--rule)', borderWidth: p.big ? 2 : 1, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <FactionDot f={p.f} size={p.big ? 14 : 10} />
              <span className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: p.big ? 22 : 14 }}>{p.card}</span>
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: p.big ? 14 : 11, marginTop: 8, lineHeight: 1.05 }}>{p.f.short}</div>
            <div className="byline" style={{ position: 'absolute', bottom: 6, left: 6 }}>{p.passed ? 'passed' : '⋮⋮'}</div>
          </SketchFrame>
        </div>
      ))}
    </div>
    <Rule />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
      <span><Label>Actions Taken</Label> <span className="num" style={{ fontWeight: 700 }}>11</span></span>
      <span><Label>Passes</Label> <span className="num" style={{ fontWeight: 700 }}>2 / 6</span></span>
      <span><Label>Avg Turn</Label> <span className="num" style={{ fontWeight: 700 }}>1m 47s</span></span>
    </div>
    <Note style={{ top: 72, left: 8 }} arrow={false}>← swipe ←<br/>to reorder</Note>
  </div>
);

const TurnOrder_Grid = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Initiative · Strategy Card Draft" right="Round V" />
    <Headline size={18}>Eight Cards. Six Hands.</Headline>
    <Rule kind="double" />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, marginTop: 6 }}>
      {STRATEGY_CARDS.map((c, i) => {
        const owner = [FACTIONS[1], FACTIONS[5], null, FACTIONS[0], FACTIONS[2], FACTIONS[3], null, FACTIONS[4]][i];
        return (
          <div key={c.n} style={{ border: owner ? '1px solid var(--rule)' : '1px dashed var(--ink-4)', padding: 6, position: 'relative', background: owner ? 'var(--paper-2)' : 'transparent' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 18 }}>{c.n}</span>
              {owner && <FactionDot f={owner} size={8} />}
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 10, fontWeight: 600 }}>{c.name}</div>
            <div className="byline" style={{ marginTop: 2 }}>{owner ? owner.short : 'unclaimed'}</div>
          </div>
        );
      })}
    </div>
    <Rule />
    <Label>Resolved Order</Label>
    <div style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
      {[
        { n: 1, f: FACTIONS[1] }, { n: 2, f: FACTIONS[5] }, { n: 4, f: FACTIONS[0] },
        { n: 5, f: FACTIONS[2] }, { n: 6, f: FACTIONS[3] }, { n: 8, f: FACTIONS[4] },
      ].map((x, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 4px', border: '1px solid var(--rule)', fontSize: 10 }}>
            <span className="num" style={{ fontWeight: 800 }}>{x.n}</span>
            <FactionDot f={x.f} size={7} />
            <span>{x.f.short}</span>
          </div>
          {i < 5 && <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>→</span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const TurnOrder_Round = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Round Table" right="Speaker rotates ↻" />
    <Headline size={18}>The Galactic Council, in session.</Headline>
    <div style={{ position: 'relative', width: 220, height: 220, margin: '8px auto 0' }}>
      <svg viewBox="0 0 220 220" width="220" height="220">
        <ellipse cx="110" cy="110" rx="60" ry="35" fill="var(--paper-2)" stroke="var(--rule)" strokeDasharray="3 2" />
        <text x="110" y="106" textAnchor="middle" fontFamily="var(--mono)" fontSize="6" letterSpacing="1.5" fill="var(--ink-3)">ROUND V</text>
        <text x="110" y="118" textAnchor="middle" fontFamily="var(--serif)" fontSize="9" fontStyle="italic" fill="var(--ink-2)">Action Phase</text>
        {[
          { f: FACTIONS[1], n: 1, active: true },
          { f: FACTIONS[5], n: 2 },
          { f: FACTIONS[0], n: 4 },
          { f: FACTIONS[2], n: 5 },
          { f: FACTIONS[3], n: 6, passed: true },
          { f: FACTIONS[4], n: 8, passed: true },
        ].map((p, i, arr) => {
          const a = (i / arr.length) * Math.PI * 2 - Math.PI / 2;
          const x = 110 + Math.cos(a) * 92;
          const y = 110 + Math.sin(a) * 92;
          return (
            <g key={i} opacity={p.passed ? 0.4 : 1}>
              <circle cx={x} cy={y} r={p.active ? 16 : 12} fill={p.active ? 'var(--accent)' : 'var(--paper)'} stroke="var(--rule)" strokeWidth="1.5" />
              <text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--serif)" fontWeight="800" fontSize={p.active ? 13 : 10} fill={p.active ? 'var(--paper)' : 'var(--ink)'}>{p.n}</text>
              <text x={x} y={y + (i < 3 ? -22 : 24)} textAnchor="middle" fontFamily="var(--mono)" fontSize="7" letterSpacing="0.5" fill="var(--ink-2)">{p.f.short.toUpperCase()}</text>
            </g>
          );
        })}
        <path d="M 110 50 L 105 60 L 115 60 Z" fill="var(--accent)" />
      </svg>
    </div>
    <Rule />
    <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, textAlign: 'center', color: 'var(--ink-2)' }}>
      "Hacan opens. Yssaril considers a sabotage."
    </div>
    <Note style={{ top: 28, right: 14 }} arrow={false}>↑ active player<br/>at top of table</Note>
  </div>
);

Object.assign(window, {
  RoundPhase_Broadsheet, RoundPhase_Phone, RoundPhase_Timeline, RoundPhase_Radial,
  TurnOrder_Slate, TurnOrder_Queue, TurnOrder_Grid, TurnOrder_Round,
});
