/* global React, FACTIONS, FactionDot, Mast, Kicker, Headline, Deck, Byline, Label, Rule, Placeholder, Note, SketchFrame, InlineBar */

// ──────────────────────────────────────────────────────────────
// SCREEN 7 — VP RACE CHART (HERO FEATURE)
// ──────────────────────────────────────────────────────────────

const VP_DATA = [
  { f: FACTIONS[1], pts: [0, 1, 2, 4, 5, 6] }, // Hacan
  { f: FACTIONS[0], pts: [0, 1, 1, 3, 5, 7] }, // Sol — comeback
  { f: FACTIONS[2], pts: [0, 0, 1, 2, 3, 5] },
  { f: FACTIONS[3], pts: [0, 1, 2, 2, 3, 4] },
  { f: FACTIONS[5], pts: [0, 0, 1, 2, 3, 4] },
  { f: FACTIONS[4], pts: [0, 0, 1, 1, 2, 3] },
];

const VP_Slope = () => {
  const W = 360, H = 200, P = 24;
  const max = 10, rounds = 5;
  const x = (r) => P + (r / rounds) * (W - P*2);
  const y = (v) => H - P - (v / max) * (H - P*2);
  return (
    <div className="wf" style={{ padding: 14 }}>
      <Mast title="THE V.P. RACE" date="A 6-round chronicle" />
      <Kicker left="Featured · The Front Page" right="To 10 points" />
      <Headline size={26} style={{ marginTop: 4 }}>Sol's late surge.</Headline>
      <Deck style={{ marginTop: 4 }}>From dead last in round 2 to a single point behind Hacan after round 5.</Deck>
      <Rule kind="double" />
      <div style={{ position: 'relative', marginTop: 8 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
          {[2,4,6,8,10].map((g) => (
            <g key={g}>
              <line x1={P} y1={y(g)} x2={W-P} y2={y(g)} stroke="var(--ink-4)" strokeWidth="0.5" strokeDasharray="2 3" />
              <text x={P-4} y={y(g)+3} textAnchor="end" fontFamily="var(--mono)" fontSize="8" fill="var(--ink-3)">{g}</text>
            </g>
          ))}
          {Array.from({length: rounds+1}).map((_,r) => (
            <g key={r}>
              <line x1={x(r)} y1={H-P} x2={x(r)} y2={P} stroke="var(--ink-4)" strokeWidth="0.5" strokeDasharray="1 4" />
              <text x={x(r)} y={H-P+12} textAnchor="middle" fontFamily="var(--mono)" fontSize="8" fill="var(--ink-3)">R{r}</text>
            </g>
          ))}
          {/* win line */}
          <line x1={P} y1={y(10)} x2={W-P} y2={y(10)} stroke="var(--accent)" strokeWidth="1" />
          <text x={W-P} y={y(10)-4} textAnchor="end" fontFamily="var(--mono)" fontSize="8" fill="var(--accent)">VICTORY · 10</text>
          {VP_DATA.map((d, i) => {
            const path = d.pts.map((v, r) => `${r === 0 ? 'M' : 'L'} ${x(r)} ${y(v)}`).join(' ');
            const last = d.pts[d.pts.length-1];
            const isLeader = d.f === FACTIONS[1];
            const stroke = isLeader ? 'var(--accent)' : i === 1 ? 'var(--cool)' : 'var(--ink-3)';
            const sw = isLeader || i === 1 ? 2 : 1;
            return (
              <g key={i}>
                <path d={path} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
                {d.pts.map((v, r) => <circle key={r} cx={x(r)} cy={y(v)} r={r === rounds ? 3 : 1.6} fill={stroke} />)}
                <text x={x(rounds)+5} y={y(last)+3} fontFamily="var(--serif)" fontSize="9" fontWeight="700" fill={stroke}>{d.f.short} · {last}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <Rule />
      <div className="col" style={{ fontSize: 10, lineHeight: 1.45 }}>
          <div className="dropcap">Hacan held the lead from round one, but Sol's Imperial play in round 5 closed a four-point gap to a single point. With Mecatol Rex changing hands and two stage-two objectives still on the table, the final round will be a knife's-edge finish.</div>
        </div>
      <Note style={{ top: 96, right: 22 }}>Sol's slope ↗ ←<br/>highlight in red?</Note>
    </div>
  );
};

const VP_Bars = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="VP Standings" right="Round V · live" />
    <Headline size={20}>Inches from victory.</Headline>
    <Rule kind="double" />
    <div style={{ marginTop: 8 }}>
      {VP_DATA.slice().sort((a,b) => b.pts[b.pts.length-1] - a.pts[a.pts.length-1]).map((d, i) => {
        const last = d.pts[d.pts.length-1];
        return (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="num" style={{ width: 14, fontWeight: 700, color: 'var(--ink-3)' }}>{i+1}</span>
                <FactionDot f={d.f} size={9} />
                <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 13 }}>{d.f.short}</span>
                {i === 0 && <span className="tag" style={{ background: 'var(--accent)' }}>LEADER</span>}
              </span>
              <span className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 16 }}>{last}<span style={{ color: 'var(--ink-3)', fontSize: 11 }}>/10</span></span>
            </div>
            <div style={{ display: 'flex', gap: 1, height: 14 }}>
              {Array.from({length: 10}).map((_, n) => (
                <div key={n} style={{ flex: 1, background: n < last ? (i === 0 ? 'var(--accent)' : 'var(--ink)') : 'var(--paper-2)', border: '1px solid var(--ink-4)' }} />
              ))}
            </div>
            <div className="byline" style={{ marginTop: 1, fontSize: 8 }}>last scored: R{d.pts.length-1} · {['Pub II', 'Imperial', 'Pub I', 'Secret', 'Pub I', 'Secret'][i]}</div>
          </div>
        );
      })}
    </div>
  </div>
);

const VP_Stadium = () => {
  const W = 320, H = 220;
  return (
    <div className="wf" style={{ padding: 14 }}>
      <Kicker left="The Stadium View" right="6 racers · 10 laps" />
      <Headline size={18}>The home stretch.</Headline>
      <Rule kind="double" />
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ marginTop: 6 }}>
        {VP_DATA.map((d, i) => {
          const trackY = 24 + i * 28;
          const last = d.pts[d.pts.length-1];
          return (
            <g key={i}>
              {/* lane */}
              <rect x={20} y={trackY-8} width={W-60} height={16} fill="var(--paper-2)" stroke="var(--ink-4)" strokeDasharray="2 3" />
              {/* lap markers */}
              {Array.from({length: 9}).map((_, l) => (
                <line key={l} x1={20 + ((l+1)/10) * (W-60)} y1={trackY-8} x2={20 + ((l+1)/10) * (W-60)} y2={trackY+8} stroke="var(--ink-4)" strokeWidth="0.5" />
              ))}
              {/* token */}
              <circle cx={20 + (last/10) * (W-60)} cy={trackY} r="7" fill={i === 0 ? 'var(--accent)' : i === 1 ? 'var(--cool)' : 'var(--ink)'} />
              <text x={20 + (last/10) * (W-60)} y={trackY+3} textAnchor="middle" fontFamily="var(--mono)" fontSize="8" fill="var(--paper)" fontWeight="700">{last}</text>
              {/* name */}
              <text x={12} y={trackY+3} textAnchor="end" fontFamily="var(--serif)" fontSize="10" fontWeight="700">{d.f.short}</text>
              {/* finish */}
              <line x1={W-40} y1={trackY-10} x2={W-40} y2={trackY+10} stroke="var(--accent)" strokeWidth="1.5" />
            </g>
          );
        })}
        <text x={W-40} y={14} textAnchor="middle" fontFamily="var(--mono)" fontSize="8" fill="var(--accent)">10 VP</text>
      </svg>
      <Note style={{ top: 38, left: 12 }} arrow={false}>← lanes ordered<br/>by current standing</Note>
    </div>
  );
};

const VP_Stream = () => {
  const W = 340, H = 180, P = 18;
  const max = 6, rounds = 5;
  return (
    <div className="wf" style={{ padding: 14 }}>
      <Kicker left="VP Earned per Round" right="Stacked stream" />
      <Headline size={18}>Who scored when.</Headline>
      <Rule kind="double" />
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ marginTop: 6 }}>
        {Array.from({length: rounds+1}).map((_, r) => {
          let acc = 0;
          return VP_DATA.map((d, i) => {
            const v = (d.pts[r] || 0) - (d.pts[r-1] || 0);
            const x = P + (r / rounds) * (W - P*2) - 12;
            const totalH = (H - P*2) / max * v;
            const yPos = H - P - acc - totalH;
            acc += totalH;
            const colors = ['var(--accent)', 'var(--cool)', 'var(--moss)', 'var(--gold)', 'var(--ink)', 'var(--ink-3)'];
            return v > 0 ? <rect key={`${r}-${i}`} x={x} y={yPos} width={24} height={totalH} fill={colors[i]} stroke="var(--paper)" strokeWidth="0.5" /> : null;
          });
        })}
        {Array.from({length: rounds+1}).map((_, r) => (
          <text key={r} x={P + (r/rounds)*(W-P*2)} y={H-4} textAnchor="middle" fontFamily="var(--mono)" fontSize="8" fill="var(--ink-3)">R{r}</text>
        ))}
      </svg>
      <Rule />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 9 }}>
        {VP_DATA.map((d, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, background: ['var(--accent)','var(--cool)','var(--moss)','var(--gold)','var(--ink)','var(--ink-3)'][i] }} />
            {d.f.short}
          </span>
        ))}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// SCREEN 8 — OBJECTIVE MATRIX
// ──────────────────────────────────────────────────────────────

const PUBLIC_OBJ = [
  { id: 'I.1', name: 'Spend 8 resources', vp: 1, who: [0, 1] },
  { id: 'I.2', name: 'Control 4 planets in other systems', vp: 1, who: [1] },
  { id: 'I.3', name: 'Have 2 tech of same color', vp: 1, who: [0, 2] },
  { id: 'I.4', name: 'Spend 8 influence', vp: 1, who: [1, 3] },
  { id: 'II.1', name: 'Control 6 planets w/ tech', vp: 2, who: [0] },
  { id: 'II.2', name: 'Win combat in 5 systems', vp: 2, who: [1] },
  { id: 'II.3', name: 'Build 8 production units', vp: 2, who: [] },
  { id: 'II.4', name: 'Control Mecatol Rex', vp: 2, who: [] },
];

const Obj_Matrix = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="The Objective Matrix" right="Public · Stage I + II" />
    <Headline size={18}>Who scored what.</Headline>
    <Rule kind="double" />
    <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(6, 1fr)', gap: 0, marginTop: 6, fontSize: 10 }}>
      <div style={{ padding: '4px 0', borderBottom: '2px solid var(--ink)' }}><Label>Objective</Label></div>
      {FACTIONS.map((f) => (
        <div key={f.id} style={{ padding: '4px 2px', borderBottom: '2px solid var(--ink)', textAlign: 'center' }}>
          <FactionDot f={f} size={7} />
          <div className="byline" style={{ fontSize: 7 }}>{f.short}</div>
        </div>
      ))}
      {PUBLIC_OBJ.map((obj, i) => (
        <React.Fragment key={obj.id}>
          <div style={{ padding: '5px 4px 5px 0', borderBottom: '1px dotted var(--ink-4)', display: 'flex', gap: 4, alignItems: 'baseline' }}>
            <span className="byline" style={{ fontSize: 8 }}>{obj.id}</span>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 10, flex: 1 }}>{obj.name}</span>
            <span className={obj.vp === 2 ? 'tag' : 'tag-outline'} style={{ fontSize: 7 }}>{obj.vp}VP</span>
          </div>
          {FACTIONS.map((_, fi) => (
            <div key={fi} style={{ padding: '5px 0', borderBottom: '1px dotted var(--ink-4)', borderLeft: '1px dotted var(--ink-4)', textAlign: 'center', fontFamily: 'var(--serif)', fontWeight: 800, color: obj.who.includes(fi) ? 'var(--accent)' : 'var(--ink-4)', fontSize: 12 }}>
              {obj.who.includes(fi) ? '✦' : '·'}
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
    <Rule />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
      <span><Label>Scored Total</Label> 11 of 24</span>
      <span><Label>Avg per player</Label> 1.8 obj</span>
      <span><Label>Unscored II</Label> 2 remaining</span>
    </div>
  </div>
);

const Obj_Cards = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Public Objective Deck" right="4 stage-I revealed · 4 stage-II" />
    <Headline size={18}>The bounty board.</Headline>
    <Rule kind="double" />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 6 }}>
      {PUBLIC_OBJ.slice(0, 6).map((obj) => (
        <div key={obj.id} style={{ border: '1px solid var(--rule)', padding: 8, position: 'relative', background: obj.who.length ? 'var(--paper-2)' : 'var(--paper)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="byline">{obj.id} · STAGE {obj.id.startsWith('II') ? 'II' : 'I'}</span>
            <span className={obj.vp === 2 ? 'tag' : 'tag-outline'} style={{ fontSize: 8 }}>{obj.vp} VP</span>
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 11, fontWeight: 600, marginTop: 4, lineHeight: 1.15 }}>{obj.name}</div>
          <Rule />
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', minHeight: 14 }}>
            {obj.who.length === 0 ? <span className="byline" style={{ fontStyle: 'italic' }}>unscored</span> :
              obj.who.map((wi) => <span key={wi} className={'faction-chip ' + FACTIONS[wi].cls} style={{ fontSize: 8 }}>{FACTIONS[wi].short}</span>)
            }
          </div>
        </div>
      ))}
    </div>
    <Note style={{ top: 60, right: 14 }} arrow={false}>cards stack →<br/>flip on score</Note>
  </div>
);

const Obj_Timeline = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Scoring Timeline" right="Public + Secret + Imperial" />
    <Headline size={18}>The drumbeat of points.</Headline>
    <Rule kind="double" />
    <div style={{ position: 'relative', marginTop: 12 }}>
      {VP_DATA.map((d, i) => {
        const events = [];
        for (let r = 1; r <= 5; r++) {
          const delta = d.pts[r] - d.pts[r-1];
          if (delta > 0) events.push({ r, delta });
        }
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 6, alignItems: 'center', padding: '4px 0', borderBottom: '1px dotted var(--ink-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FactionDot f={d.f} size={8} />
              <span style={{ fontFamily: 'var(--serif)', fontSize: 11, fontWeight: 600 }}>{d.f.short}</span>
            </div>
            <div style={{ position: 'relative', height: 16 }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 7, height: 2, background: 'var(--ink-4)' }} />
              {events.map((e, ei) => (
                <div key={ei} style={{ position: 'absolute', left: `${((e.r-0.5)/5)*100}%`, top: 0, transform: 'translateX(-50%)', width: 16, height: 16, borderRadius: '50%', background: 'var(--accent)', color: 'var(--paper)', fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, textAlign: 'center', lineHeight: '16px' }}>+{e.delta}</div>
              ))}
            </div>
          </div>
        );
      })}
      <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 6, marginTop: 4 }}>
        <span></span>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--ink-3)' }}>
          {[1,2,3,4,5].map(r => <span key={r}>R{r}</span>)}
        </div>
      </div>
    </div>
  </div>
);

const Obj_Heatmap = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Objective Density" right="Heat by player × type" />
    <Headline size={18}>Where each empire scores.</Headline>
    <Rule kind="double" />
    <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(5, 1fr)', gap: 1, marginTop: 8 }}>
      <div></div>
      {['Pub I', 'Pub II', 'Secret', 'Imperial', 'Support'].map(c => (
        <div key={c} style={{ padding: 4, textAlign: 'center' }}><Label>{c}</Label></div>
      ))}
      {FACTIONS.map((f, fi) => {
        const row = [
          [2, 1, 2, 1, 0],
          [2, 1, 1, 0, 1],
          [1, 1, 0, 1, 0],
          [1, 0, 1, 0, 1],
          [1, 0, 1, 0, 0],
          [0, 0, 1, 0, 0],
        ][fi];
        return (
          <React.Fragment key={f.id}>
            <div style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FactionDot f={f} size={7} />
              <span style={{ fontSize: 10 }}>{f.short}</span>
            </div>
            {row.map((v, ci) => (
              <div key={ci} style={{ aspectRatio: '1.6/1', background: `oklch(0.18 0.01 60 / ${v * 0.25})`, border: '1px solid var(--ink-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: v > 1 ? 'var(--paper)' : 'var(--ink)' }}>
                {v || ''}
              </div>
            ))}
          </React.Fragment>
        );
      })}
    </div>
    <Rule />
    <Byline>Darker = more points scored from that source</Byline>
  </div>
);

Object.assign(window, {
  VP_Slope, VP_Bars, VP_Stadium, VP_Stream,
  Obj_Matrix, Obj_Cards, Obj_Timeline, Obj_Heatmap,
});
