/* global React, FACTIONS, FactionDot, Mast, Kicker, Headline, Deck, Byline, Label, Rule, Placeholder, Note, SketchFrame, InlineBar */

// ──────────────────────────────────────────────────────────────
// SCREEN 5 — VOTING / AGENDA DASHBOARD
// ──────────────────────────────────────────────────────────────

const Agenda_Senate = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="The Galactic Senate · in session" right="Round V · Agenda I of II" />
    <Headline size={22} style={{ fontStyle: 'italic' }}>"Anti-Intellectual Revolution."</Headline>
    <Deck>Law · For: destroy 1 non-fighter ship per technology owner. Against: gain a trade good per tech.</Deck>
    <Rule kind="double" />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {[
        { side: 'FOR', total: 14, voters: [{ f: FACTIONS[1], v: 8 }, { f: FACTIONS[5], v: 6 }] },
        { side: 'AGAINST', total: 19, voters: [{ f: FACTIONS[0], v: 7 }, { f: FACTIONS[2], v: 9 }, { f: FACTIONS[3], v: 3 }] },
      ].map((side, i) => (
        <div key={i}>
          <div className="label" style={{ color: i === 0 ? 'var(--accent)' : 'var(--cool)' }}>{side.side}</div>
          <div className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 30, color: i === 0 ? 'var(--accent)' : 'var(--cool)' }}>{side.total}</div>
          <Rule />
          {side.voters.map((v, j) => (
            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0', fontSize: 10 }}>
              <FactionDot f={v.f} size={8} />
              <span style={{ flex: 1 }}>{v.f.short}</span>
              <span className="num" style={{ fontWeight: 700 }}>{v.v}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
    <Rule />
    <Label>Yet to Vote</Label>
    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
      <span className="faction-chip f-emir">Yssaril · 7 inf available</span>
      <span className="byline" style={{ marginLeft: 'auto', color: 'var(--accent)' }}>Speaker votes last</span>
    </div>
    <Rule />
    <Label>Active Laws</Label>
    <div style={{ marginTop: 4, fontFamily: 'var(--serif)', fontSize: 10, lineHeight: 1.4 }}>
      <div style={{ borderLeft: '2px solid var(--ink)', paddingLeft: 6 }}>· <i>Mining Initiative</i> — passed R2 (benefits Hacan)</div>
      <div style={{ borderLeft: '2px solid var(--ink)', paddingLeft: 6, marginTop: 2 }}>· <i>Public Execution</i> — passed R3 (target: Sol)</div>
    </div>
    <Note style={{ top: 32, right: 14 }}>tally bars + names<br/>scrub timeline ↓</Note>
  </div>
);

const Agenda_Tally = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Vote Tally · Live" right="∑ available 64 inf" />
    <Headline size={18}>Cast your influence.</Headline>
    <Rule kind="double" />
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 9 }}>
        <span style={{ color: 'var(--accent)' }}>FOR · 14</span>
        <span style={{ color: 'var(--ink-3)' }}>33 cast / 64 max</span>
        <span style={{ color: 'var(--cool)' }}>AGAINST · 19</span>
      </div>
      <div style={{ height: 24, display: 'flex', border: '1px solid var(--rule)', marginTop: 4 }}>
        <div style={{ width: '22%', background: 'var(--accent)' }} />
        <div style={{ flex: 1, background: 'var(--paper-2)' }} />
        <div style={{ width: '30%', background: 'var(--cool)' }} />
      </div>
    </div>
    <Rule />
    {FACTIONS.map((f, i) => {
      const v = [0, 8, 9, 3, 0, 6][i];
      const max = [12, 11, 14, 7, 7, 13][i];
      const side = [null, 'for', 'against', 'against', null, 'for'][i];
      return (
        <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 60px', gap: 6, alignItems: 'center', padding: '4px 0', borderBottom: '1px dotted var(--ink-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <FactionDot f={f} size={8} /><span style={{ fontSize: 10 }}>{f.short}</span>
          </div>
          <div style={{ position: 'relative', height: 10, background: 'var(--paper-2)', border: '1px solid var(--ink-4)' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(v/max)*100}%`, background: side === 'for' ? 'var(--accent)' : side === 'against' ? 'var(--cool)' : 'var(--ink-4)' }} />
          </div>
          <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 9 }}>
            <span className="num" style={{ fontWeight: 700 }}>{v}</span>/<span style={{ color: 'var(--ink-3)' }}>{max}</span>
            <span style={{ marginLeft: 4, fontSize: 8 }}>{side ? side.toUpperCase() : 'ABS'}</span>
          </div>
        </div>
      );
    })}
    <Rule />
    <div style={{ display: 'flex', gap: 6 }}>
      <div style={{ flex: 1, padding: 6, background: 'var(--accent)', color: 'var(--paper)', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9 }}>+ FOR</div>
      <div style={{ flex: 1, padding: 6, background: 'var(--cool)', color: 'var(--paper)', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9 }}>+ AGAINST</div>
    </div>
  </div>
);

const Agenda_Phone = () => (
  <div className="wf" style={{ background: '#000', padding: 0 }}>
    <div className="phone-screen">
      <div style={{ padding: '32px 14px 8px' }}>
        <Byline>‹ Senate</Byline>
        <Headline size={16} style={{ marginTop: 4, fontStyle: 'italic' }}>Anti-Intellectual<br/>Revolution.</Headline>
      </div>
      <hr className="rule-double" style={{ margin: '0 14px' }} />
      <div style={{ padding: 14 }}>
        <SketchFrame>
          <Label>Your influence</Label>
          <div className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 28 }}>14</div>
          <Byline>9 planets ready · 5 exhausted</Byline>
        </SketchFrame>
        <Rule />
        <Label>Slide to allocate</Label>
        <div style={{ position: 'relative', height: 36, background: 'var(--paper-2)', border: '1px solid var(--rule)', marginTop: 6 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', borderRight: '2px solid var(--ink)' }} />
          <div style={{ position: 'absolute', left: '40%', top: -3, bottom: -3, width: 16, background: 'var(--ink)', cursor: 'grab' }} />
          <div style={{ position: 'absolute', left: 4, top: 4, fontSize: 9, color: 'var(--accent)' }}>FOR</div>
          <div style={{ position: 'absolute', right: 4, top: 4, fontSize: 9, color: 'var(--cool)' }}>AGAINST</div>
          <div style={{ position: 'absolute', left: 4, bottom: 2, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700 }}>6</div>
          <div style={{ position: 'absolute', right: 4, bottom: 2, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700 }}>8</div>
        </div>
        <Rule />
        <Label>Running tally</Label>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <div><div className="byline">FOR</div><div className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 22, color: 'var(--accent)' }}>20</div></div>
          <div style={{ textAlign: 'right' }}><div className="byline">AGAINST</div><div className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 22, color: 'var(--cool)' }}>27</div></div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, padding: 10, background: 'var(--ink)', color: 'var(--paper)', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10 }}>CAST VOTE ▸</div>
    </div>
  </div>
);

const Agenda_History = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Senate Almanac" right="14 agendas, 11 passed" />
    <Headline size={18}>Laws of the Realm.</Headline>
    <Rule kind="double" />
    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, lineHeight: 1.4, marginTop: 6 }}>
      {[
        { r: 'R2', name: 'Mining Initiative', kind: 'LAW', side: 'for', won: true, ben: FACTIONS[1] },
        { r: 'R2', name: 'Wormhole Reconst.', kind: 'DIR', side: 'against', won: false },
        { r: 'R3', name: 'Public Execution', kind: 'LAW', side: 'for', won: true, ben: FACTIONS[5], hurt: FACTIONS[0] },
        { r: 'R3', name: 'Classified Docs', kind: 'DIR', side: 'for', won: true, ben: FACTIONS[4] },
        { r: 'R4', name: 'Imperial Arbiter', kind: 'LAW', side: 'against', won: false },
        { r: 'R4', name: 'Min. of Industry', kind: 'LAW', side: 'for', won: true, ben: FACTIONS[2] },
        { r: 'R5', name: 'Anti-Intel. Rev.', kind: 'LAW', side: '?', won: null },
      ].map((row, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 36px 1fr 60px', gap: 4, padding: '3px 0', borderBottom: '1px dotted var(--ink-4)', opacity: row.won === null ? 1 : 0.9 }}>
          <span style={{ color: 'var(--ink-3)' }}>{row.r}</span>
          <span className={row.kind === 'LAW' ? 'tag' : 'tag-outline'} style={{ fontSize: 7, padding: '0 3px', height: 11, lineHeight: '11px' }}>{row.kind}</span>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 11 }}>{row.name}{row.won === null && <span style={{ color: 'var(--accent)' }}> · in vote</span>}</span>
          <span style={{ textAlign: 'right' }}>
            {row.won === true ? <span style={{ color: 'var(--ink)', fontWeight: 700 }}>PASSED</span> :
             row.won === false ? <span style={{ color: 'var(--ink-3)' }}>failed</span> :
             <span style={{ color: 'var(--accent)' }}>active</span>}
          </span>
        </div>
      ))}
    </div>
    <Rule />
    <Label>Net Beneficiaries</Label>
    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', fontSize: 10 }}>
      <span className="faction-chip f-hac">Hacan +3</span>
      <span className="faction-chip f-xxc">Xxcha +2</span>
      <span className="faction-chip f-emir">Yssaril +1</span>
      <span className="faction-chip f-sol" style={{ opacity: 0.6 }}>Sol −1</span>
    </div>
    <Note style={{ top: 32, right: 14 }} arrow={false}>net effect bars<br/>per faction →</Note>
  </div>
);

// ──────────────────────────────────────────────────────────────
// SCREEN 6 — ECONOMY RADAR / PLANET BOARD
// ──────────────────────────────────────────────────────────────

const Economy_Radar = () => {
  const cx = 110, cy = 110, r = 70;
  const axes = ['Resource', 'Influence', 'Tech', 'Fleet', 'Planets', 'TG'];
  const data = [
    { f: FACTIONS[1], color: 'oklch(0.55 0.14 25)', vals: [80, 70, 50, 60, 75, 90] },
    { f: FACTIONS[0], color: 'oklch(0.55 0.13 250)', vals: [70, 60, 80, 75, 65, 50] },
    { f: FACTIONS[2], color: 'oklch(0.6 0.14 130)', vals: [55, 90, 65, 40, 70, 30] },
  ];
  const poly = (vals) => Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return `${cx + Math.cos(a) * r * (vals[i]/100)},${cy + Math.sin(a) * r * (vals[i]/100)}`;
  }).join(' ');
  return (
    <div className="wf" style={{ padding: 14 }}>
      <Kicker left="Economic Pulse" right="Top 3 plotted" />
      <Headline size={18}>Spend vs. Sway.</Headline>
      <div style={{ position: 'relative', width: 220, height: 220, margin: '4px auto 0' }}>
        <svg viewBox="0 0 220 220" width="220" height="220">
          {[25,50,75,100].map((g) => (
            <polygon key={g} points={Array.from({length:6}, (_, i) => {
              const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
              return `${cx + Math.cos(a) * r * (g/100)},${cy + Math.sin(a) * r * (g/100)}`;
            }).join(' ')} fill="none" stroke="var(--ink-4)" strokeWidth="0.5" strokeDasharray="2 2" />
          ))}
          {axes.map((l, i) => {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const lx = cx + Math.cos(a) * (r + 16);
            const ly = cy + Math.sin(a) * (r + 16);
            return (
              <g key={l}>
                <line x1={cx} y1={cy} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke="var(--ink-4)" strokeWidth="0.5" />
                <text x={lx} y={ly+3} textAnchor="middle" fontFamily="var(--mono)" fontSize="8" fill="var(--ink-2)">{l}</text>
              </g>
            );
          })}
          {data.map((d, i) => (
            <polygon key={i} points={poly(d.vals)} fill={d.color} fillOpacity="0.12" stroke={d.color} strokeWidth="1.4" />
          ))}
        </svg>
      </div>
      <Rule />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', fontSize: 10 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 3, background: d.color }} />
            <span>{d.f.short}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Economy_PlanetBoard = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="The Planet Board" right="36 controlled · 4 contested" />
    <Headline size={18}>Hex by hex.</Headline>
    <Rule kind="double" />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, marginTop: 6 }}>
      {Array.from({ length: 32 }).map((_, i) => {
        const ownerIdx = [1,1,0,0,2,5,5,3,1,1,0,0,2,5,3,3,1,4,0,2,2,5,3,3,4,4,2,2,5,3,3,3][i];
        const f = FACTIONS[ownerIdx];
        const isMecatol = i === 18;
        return (
          <div key={i} className={f.cls} style={{ aspectRatio: '1.15 / 1', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', background: isMecatol ? 'var(--accent)' : 'currentColor', opacity: isMecatol ? 1 : 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--paper)', fontWeight: 700 }}>
            {isMecatol ? 'MR' : ''}
          </div>
        );
      })}
    </div>
    <Rule />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
      {[
        { f: FACTIONS[1], n: 11, r: 17, inf: 13 },
        { f: FACTIONS[0], n: 9, r: 14, inf: 11 },
        { f: FACTIONS[2], n: 8, r: 9, inf: 14 },
      ].map((row, i) => (
        <SketchFrame key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <FactionDot f={row.f} size={9} />
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 11 }}>{row.f.short}</span>
          </div>
          <div className="num" style={{ fontSize: 9, marginTop: 4 }}>
            <div>Planets · <b>{row.n}</b></div>
            <div>Res · <b>{row.r}</b></div>
            <div>Inf · <b>{row.inf}</b></div>
          </div>
        </SketchFrame>
      ))}
    </div>
    <Note style={{ top: 80, right: 14 }}>red hex = Mecatol</Note>
  </div>
);

const Economy_Stacks = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Coffers" right="Resources vs. Influence" />
    <Headline size={18}>Two currencies, one race.</Headline>
    <Rule kind="double" />
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 12, height: 220, paddingBottom: 22 }}>
      {FACTIONS.map((f, i) => {
        const r = [17, 14, 9, 11, 8, 12][i];
        const inf = [13, 11, 14, 7, 7, 9][i];
        return (
          <div key={f.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', height: '100%' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 2, width: '100%', justifyContent: 'center' }}>
              <div style={{ width: 12, height: `${r * 7}px`, background: 'var(--ink)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -12, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700 }}>{r}</div>
              </div>
              <div style={{ width: 12, height: `${inf * 7}px`, background: 'var(--paper)', border: '1px solid var(--ink)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -12, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9 }}>{inf}</div>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: -18, left: 0, right: 0, textAlign: 'center' }}>
              <FactionDot f={f} size={7} />
              <div className="byline" style={{ fontSize: 8, marginTop: 1 }}>{f.short}</div>
            </div>
          </div>
        );
      })}
    </div>
    <Rule />
    <div style={{ display: 'flex', gap: 12, fontSize: 10 }}>
      <span><span style={{ display: 'inline-block', width: 10, height: 8, background: 'var(--ink)', verticalAlign: 'middle' }} /> Resources (build)</span>
      <span><span style={{ display: 'inline-block', width: 10, height: 8, background: 'var(--paper)', border: '1px solid var(--ink)', verticalAlign: 'middle' }} /> Influence (vote)</span>
    </div>
  </div>
);

const Economy_Sankey = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Trade Flow · This Round" right="Commodities · TGs" />
    <Headline size={18}>Where the money moved.</Headline>
    <Rule kind="double" />
    <div style={{ position: 'relative', height: 200, marginTop: 10 }}>
      <svg viewBox="0 0 320 200" width="100%" height="200" preserveAspectRatio="none">
        {/* left column factions */}
        {[0,1,2,3].map((i) => (
          <g key={i}>
            <rect x="0" y={i*48} width="60" height="36" fill="var(--paper-2)" stroke="var(--rule)" />
            <text x="6" y={i*48+14} fontFamily="var(--serif)" fontSize="10" fontWeight="700">{FACTIONS[i].short}</text>
            <text x="6" y={i*48+28} fontFamily="var(--mono)" fontSize="8" fill="var(--ink-3)">paid {[3,5,2,4][i]} TG</text>
          </g>
        ))}
        {/* right column factions */}
        {[0,1,2,3].map((i) => (
          <g key={i}>
            <rect x="260" y={i*48} width="60" height="36" fill="var(--paper-2)" stroke="var(--rule)" />
            <text x="266" y={i*48+14} fontFamily="var(--serif)" fontSize="10" fontWeight="700">{FACTIONS[(i+2)%6].short}</text>
            <text x="266" y={i*48+28} fontFamily="var(--mono)" fontSize="8" fill="var(--ink-3)">recv {[6,2,4,2][i]} TG</text>
          </g>
        ))}
        {/* flows */}
        {[
          { y0: 18, y1: 18, w: 6, c: 'var(--ink)' },
          { y0: 66, y1: 18, w: 4, c: 'var(--accent)' },
          { y0: 66, y1: 66, w: 3, c: 'var(--ink-3)' },
          { y0: 114, y1: 66, w: 2, c: 'var(--cool)' },
          { y0: 162, y1: 114, w: 5, c: 'var(--ink)' },
          { y0: 18, y1: 162, w: 2, c: 'var(--ink-3)' },
        ].map((f, i) => (
          <path key={i} d={`M 60 ${f.y0} C 160 ${f.y0}, 160 ${f.y1}, 260 ${f.y1}`} stroke={f.c} strokeWidth={f.w} fill="none" opacity="0.5" />
        ))}
      </svg>
    </div>
    <Note style={{ top: 80, right: 14 }} arrow={false}>thicker line<br/>= bigger deal</Note>
  </div>
);

Object.assign(window, {
  Agenda_Senate, Agenda_Tally, Agenda_Phone, Agenda_History,
  Economy_Radar, Economy_PlanetBoard, Economy_Stacks, Economy_Sankey,
});
