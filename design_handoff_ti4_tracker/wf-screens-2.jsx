/* global React, FACTIONS, FactionDot, FactionChip, Mast, Kicker, Headline, Deck, Byline, Label, Rule, Placeholder, Note, SketchFrame, InlineBar */

// ──────────────────────────────────────────────────────────────
// SCREEN 3 — PLAYER DASHBOARD (one player's full state)
// 4 variations: full broadsheet · phone scroll · sheet card · split radar
// ──────────────────────────────────────────────────────────────

const TECH_TREE = [
  { color: 'var(--moss)', name: 'Neural Motivator', tier: 1 },
  { color: 'var(--moss)', name: 'Psychoarchaeology', tier: 1 },
  { color: 'var(--gold)', name: 'Sarween Tools', tier: 1 },
  { color: 'var(--cool)', name: 'Antimass Deflectors', tier: 1 },
  { color: 'var(--cool)', name: 'Gravity Drive', tier: 2 },
  { color: 'var(--accent)', name: 'Magen Defense', tier: 1 },
];

const PlayerDash_Broadsheet = () => {
  const f = FACTIONS[0];
  return (
    <div className="wf" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '3px double var(--rule)', borderBottom: '1px solid var(--rule)', padding: '4px 0' }}>
        <span className="byline">DOSSIER · No. 04</span>
        <span className="byline">Round V · Status</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--rule)' }}>
        <div className={f.cls} style={{ width: 60, height: 60, border: '2px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 32 }}>S</div>
        <div>
          <div className="label" style={{ color: 'var(--ink-3)' }}>The Federation of</div>
          <div className="headline" style={{ fontSize: 22 }}>SOL</div>
          <div className="byline">Sarah · seat 3 · Speaker last round</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="label">Victory</div>
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 36, lineHeight: 1, color: 'var(--accent)' }}>7<span style={{ color: 'var(--ink-3)', fontSize: 18 }}>/10</span></div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
        <SketchFrame>
          <Label>Resources</Label>
          <div className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 22 }}>14</div>
          <Byline>9 planets · 5 trade goods</Byline>
        </SketchFrame>
        <SketchFrame>
          <Label>Influence</Label>
          <div className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 22 }}>11</div>
          <Byline>spent 4 last vote</Byline>
        </SketchFrame>
        <SketchFrame>
          <Label>Trade Goods</Label>
          <div className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 22 }}>5</div>
          <Byline>+3 commodities</Byline>
        </SketchFrame>
      </div>
      <Rule />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <Label>Command Pool</Label>
          {[
            { name: 'Tactic', val: 3, max: 5 },
            { name: 'Fleet', val: 4, max: 5 },
            { name: 'Strategy', val: 1, max: 3 },
          ].map((c) => (
            <div key={c.name} style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <span style={{ fontFamily: 'var(--serif)', fontWeight: 600 }}>{c.name}</span>
                <span className="num">{c.val}/{c.max}</span>
              </div>
              <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                {Array.from({ length: c.max }).map((_, j) => (
                  <div key={j} style={{ flex: 1, height: 6, background: j < c.val ? 'var(--ink)' : 'var(--paper-2)', border: '1px solid var(--rule)' }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div>
          <Label>Tech Researched</Label>
          <div style={{ marginTop: 4 }}>
            {TECH_TREE.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, padding: '1px 0' }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, background: t.color }} />
                <span style={{ flex: 1, fontFamily: 'var(--serif)' }}>{t.name}</span>
                <span className="byline">T{t.tier}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Rule />
      <Label>Objectives Scored</Label>
      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
        <span className="tag">PUB-I.1</span>
        <span className="tag">PUB-I.3</span>
        <span className="tag">PUB-II.1</span>
        <span className="tag-outline">SEC ✦</span>
        <span className="tag-outline">SEC ✦</span>
        <span className="tag-outline">IMPERIAL</span>
      </div>
      <Note style={{ top: 30, right: 14 }} arrow={false}>↑ faction crest<br/>placeholder</Note>
    </div>
  );
};

const PlayerDash_Phone = () => {
  const f = FACTIONS[1];
  return (
    <div className="wf" style={{ background: '#000', padding: 0 }}>
      <div className="phone-screen" style={{ overflowY: 'auto' }}>
        <div style={{ padding: '32px 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="byline">‹ All players</span>
        </div>
        <div style={{ padding: 14 }}>
          <div className={f.cls} style={{ width: '100%', height: 50, border: '2px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 800, fontSize: 22, letterSpacing: '0.04em' }}>
            EMIRATES of HACAN
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'baseline' }}>
            <Byline>Init 1 · Trade · Speaker</Byline>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 28, color: 'var(--accent)' }}>6<span style={{ color: 'var(--ink-3)', fontSize: 14 }}>/10</span></span>
          </div>
        </div>
        <hr className="rule" style={{ margin: '0 14px' }} />
        <div className="tabs" style={{ marginLeft: 14, marginRight: 14 }}>
          <div className="tab on">Overview</div>
          <div className="tab">Tech</div>
          <div className="tab">Planets</div>
          <div className="tab">Log</div>
        </div>
        <div style={{ padding: 14 }}>
          {[
            { l: 'Resources', v: 17, sub: '11 planets' },
            { l: 'Influence', v: 13, sub: '8 ready · 3 exhausted' },
            { l: 'Trade Goods', v: 9, sub: 'commodity flip incoming' },
          ].map((s) => (
            <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '1px dotted var(--ink-4)' }}>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 13, fontWeight: 600 }}>{s.l}</div>
                <Byline>{s.sub}</Byline>
              </div>
              <span className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 22 }}>{s.v}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '0 14px 14px' }}>
          <Label>Command</Label>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {[{n:'TAC',v:2},{n:'FLT',v:5},{n:'STR',v:1}].map(c => (
              <SketchFrame key={c.n} style={{ flex: 1, padding: 4, textAlign: 'center' }}>
                <div className="byline">{c.n}</div>
                <div className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 18 }}>{c.v}</div>
              </SketchFrame>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerDash_SheetCard = () => {
  const f = FACTIONS[2];
  return (
    <div className="wf" style={{ padding: 14, background: 'var(--paper-2)' }}>
      <SketchFrame style={{ padding: 12, background: 'var(--paper)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '3px double var(--rule)', paddingBottom: 6 }}>
          <div>
            <div className="label">Player Sheet</div>
            <div className="headline" style={{ fontSize: 18 }}>Xxcha Kingdom</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={f.cls + ' faction-chip'}>{f.short}</div>
            <div className="byline" style={{ marginTop: 4 }}>Diplomatic · Slow</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 8 }}>
          {[
            { l: 'VP', v: 5 }, { l: 'RES', v: 9 }, { l: 'INF', v: 14 }, { l: 'TG', v: 3 },
          ].map((s) => (
            <div key={s.l} style={{ borderTop: '2px solid var(--ink)', padding: '4px 0' }}>
              <div className="byline">{s.l}</div>
              <div className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 20 }}>{s.v}</div>
            </div>
          ))}
        </div>
        <Rule />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <Label>Fleet</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
              {['🜨','🜨','🜨','◆','◆','▲','▲','▲','▲','◌','◌'].map((u, i) => (
                <div key={i} style={{ width: 16, height: 16, border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, background: 'var(--paper)' }}>{u}</div>
              ))}
            </div>
            <Byline style={{ marginTop: 4 }}>3 dreadnoughts · 2 cruisers · 4 fighters · 2 carriers</Byline>
          </div>
          <div>
            <Label>Planets · 8</Label>
            <div style={{ marginTop: 4, fontFamily: 'var(--mono)', fontSize: 9, lineHeight: 1.5 }}>
              {['Archon Ren', 'Archon Tau', 'Hercant', 'Arnor', 'Lor', 'Rigel I', 'Rigel II', 'Rigel III'].map((p, i) => (
                <div key={p} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: i < 7 ? '1px dotted var(--ink-4)' : 'none' }}>
                  <span>{p}</span>
                  <span>{['2/3','1/1','1/0','1/2','0/2','0/1','1/2','1/1'][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SketchFrame>
    </div>
  );
};

const PlayerDash_Radar = () => {
  // 6-axis radar: VP, Resources, Influence, Tech, Fleet, Planets
  const stats = [80, 60, 90, 50, 40, 75];
  const labels = ['VP', 'RES', 'INF', 'TECH', 'FLEET', 'PLAN'];
  const cx = 110, cy = 110, r = 70;
  const points = stats.map((v, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * r * (v/100), cy + Math.sin(a) * r * (v/100)];
  });
  return (
    <div className="wf" style={{ padding: 14 }}>
      <Kicker left="Player Profile" right="Naalu Collective" />
      <Headline size={18}>The Naalu shape.</Headline>
      <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto' }}>
        <svg viewBox="0 0 220 220" width="220" height="220">
          {[20,40,60,80,100].map((g) => (
            <polygon key={g} points={Array.from({length:6}, (_, i) => {
              const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
              return `${cx + Math.cos(a) * r * (g/100)},${cy + Math.sin(a) * r * (g/100)}`;
            }).join(' ')} fill="none" stroke="var(--ink-4)" strokeWidth="0.5" strokeDasharray="2 2" />
          ))}
          {labels.map((l, i) => {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const lx = cx + Math.cos(a) * (r + 16);
            const ly = cy + Math.sin(a) * (r + 16);
            return (
              <g key={l}>
                <line x1={cx} y1={cy} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke="var(--ink-4)" strokeWidth="0.5" />
                <text x={lx} y={ly+3} textAnchor="middle" fontFamily="var(--mono)" fontSize="8" letterSpacing="1" fill="var(--ink-2)">{l}</text>
              </g>
            );
          })}
          <polygon points={points.map(p=>p.join(',')).join(' ')} fill="oklch(0.45 0.08 240 / 0.2)" stroke="var(--cool)" strokeWidth="1.5" />
          {points.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="var(--cool)" />)}
        </svg>
      </div>
      <Rule />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, fontSize: 10 }}>
        {labels.map((l, i) => (
          <div key={l}>
            <Label>{l}</Label>
            <div className="num" style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 14 }}>{stats[i]}</div>
          </div>
        ))}
      </div>
      <Note style={{ top: 38, right: 8 }}>compare overlay<br/>w/ avg</Note>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// SCREEN 4 — COMBAT LOGGER
// 4 variations: ledger · roll-by-roll feed · battle splits · phone
// ──────────────────────────────────────────────────────────────

const Combat_Ledger = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="The Battle of Lazar" right="Round IV · Activation 7" />
    <Headline size={20} style={{ fontStyle: 'italic' }}>"Three dreadnoughts, lost to the void."</Headline>
    <Deck>Hacan offensive into Sol-held Lazar. Two rounds of space combat, then assault.</Deck>
    <Rule kind="double" />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 1fr', gap: 8, alignItems: 'flex-start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <FactionDot f={FACTIONS[1]} size={12} />
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 14 }}>HACAN <span style={{ color: 'var(--accent)' }}>·attacker</span></span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, lineHeight: 1.5 }}>
          {[
            ['2 Cruiser II', '7×2', '+2'],
            ['1 Dreadnought', '5', '−1'],
            ['3 Fighter', '9×3', '+0'],
            ['1 Carrier', '9', '+0'],
          ].map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 36px 24px', borderBottom: '1px dotted var(--ink-4)', padding: '2px 0' }}>
              <span>{r[0]}</span><span className="num">{r[1]}</span><span style={{ color: r[2] === '−1' ? 'var(--accent)' : 'var(--ink-3)' }}>{r[2]}</span>
            </div>
          ))}
        </div>
        <Rule />
        <Label>Result · −2 Cruiser, −1 Fighter</Label>
      </div>
      <div style={{ textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--accent)' }}>vs.</div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <FactionDot f={FACTIONS[0]} size={12} />
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 14 }}>SOL <span style={{ color: 'var(--cool)' }}>·defender</span></span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, lineHeight: 1.5 }}>
          {[
            ['2 Dreadnought', '5×2', '+0'],
            ['1 Cruiser', '7', '+0'],
            ['4 Fighter', '9×4', '+0'],
            ['Magen Defense', 'PDS', '6'],
          ].map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 36px 24px', borderBottom: '1px dotted var(--ink-4)', padding: '2px 0' }}>
              <span>{r[0]}</span><span className="num">{r[1]}</span><span>{r[2]}</span>
            </div>
          ))}
        </div>
        <Rule />
        <Label>Result · −1 Dread, −2 Fighter</Label>
      </div>
    </div>
    <hr className="rule-thick" />
    <Label>Roll Log · Round 2 of combat</Label>
    <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap', fontFamily: 'var(--mono)', fontSize: 10 }}>
      {['9','3','7','10','4','6','8','9','2','5','9','7','3','8'].map((d, i) => (
        <div key={i} style={{ width: 18, height: 18, border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: ['7','8','9','10'].includes(d) ? 'var(--ink)' : 'var(--paper)', color: ['7','8','9','10'].includes(d) ? 'var(--paper)' : 'var(--ink)' }}>{d}</div>
      ))}
    </div>
    <Note style={{ top: 30, right: 14 }}>filled = hit</Note>
  </div>
);

const Combat_Feed = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Combat Feed · Live" right="Lazar · ATK Hacan" />
    <Headline size={18}>Roll-by-roll.</Headline>
    <Rule kind="double" />
    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, lineHeight: 1.6 }}>
      {[
        ['14:32', 'HAC', 'Cruiser fires (7,2)', '7,9 → 1 hit'],
        ['14:32', 'HAC', 'Dread fires (5,1)', '4 → miss'],
        ['14:33', 'HAC', 'Fighters x3 (9,3)', '8,3,9 → 2 hit'],
        ['14:34', 'SOL', 'PDS Magen (6,1)', '7 → 1 hit'],
        ['14:34', 'SOL', 'Dread fires (5,2)', '6,4 → 1 hit'],
        ['14:35', 'SOL', 'Fighters x4 (9,4)', '9,2,9,3 → 2 hit'],
        ['14:36', '—', 'Casualties assigned', 'HAC −1F −1C  SOL −1D −2F'],
        ['14:36', '—', 'Round 2 begins', '—'],
        ['14:37', 'HAC', 'Cruiser fires (7,1)', '8 → 1 hit'],
      ].map((row, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 26px 1fr auto', gap: 6, padding: '2px 0', borderBottom: '1px dotted var(--ink-4)' }}>
          <span style={{ color: 'var(--ink-3)' }}>{row[0]}</span>
          <span style={{ background: row[1] === 'HAC' ? 'var(--accent)' : row[1] === 'SOL' ? 'var(--cool)' : 'var(--ink-3)', color: 'var(--paper)', textAlign: 'center', fontSize: 8, padding: '1px 0' }}>{row[1]}</span>
          <span>{row[2]}</span>
          <span style={{ color: row[3].includes('hit') ? 'var(--ink)' : 'var(--ink-3)', fontWeight: 600 }}>{row[3]}</span>
        </div>
      ))}
    </div>
    <Note style={{ top: 56, right: 8 }}>scrolls live<br/>during combat</Note>
  </div>
);

const Combat_Splits = () => (
  <div className="wf" style={{ padding: 14 }}>
    <Kicker left="Battle Splits" right="Round V · 4 engagements" />
    <Headline size={18}>The Quann Theatre.</Headline>
    <Rule kind="double" />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
      {[
        { atk: FACTIONS[1], def: FACTIONS[0], where: 'Lazar', win: 'atk', a: 70, d: 30 },
        { atk: FACTIONS[5], def: FACTIONS[2], where: 'Quann', win: 'def', a: 25, d: 75 },
        { atk: FACTIONS[0], def: FACTIONS[3], where: 'Mecatol Rex', win: 'tie', a: 50, d: 50 },
        { atk: FACTIONS[2], def: FACTIONS[4], where: 'Dal Bootha', win: 'atk', a: 88, d: 12 },
      ].map((b, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 10 }}>
            <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><FactionDot f={b.atk} size={8} /> {b.atk.short}</span>
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-3)' }}>{b.where}</span>
            <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>{b.def.short} <FactionDot f={b.def} size={8} /></span>
          </div>
          <div style={{ display: 'flex', height: 12, marginTop: 2, border: '1px solid var(--rule)' }}>
            <div className={b.atk.cls} style={{ width: `${b.a}%`, background: 'currentColor' }} />
            <div className={b.def.cls} style={{ width: `${b.d}%`, background: 'currentColor', opacity: 0.8 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 8, marginTop: 1 }}>
            <span>units: 8 · hits dealt: 4</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{b.win === 'atk' ? '◀ ATK WINS' : b.win === 'def' ? 'DEF WINS ▶' : '— TIE —'}</span>
            <span>units: 7 · hits dealt: 2</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Combat_Phone = () => (
  <div className="wf" style={{ background: '#000', padding: 0 }}>
    <div className="phone-screen">
      <div style={{ padding: '32px 14px 0' }}>
        <Byline>‹ Battle Log</Byline>
        <Headline size={18} style={{ marginTop: 4 }}>Lazar.</Headline>
        <Byline>R5 · Activation 4 · Hacan ▶ Sol</Byline>
      </div>
      <hr className="rule-double" style={{ margin: '8px 14px' }} />
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, background: 'var(--paper-2)' }}>
          <div className="f-hac" style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 22, color: 'currentColor' }}>4</div>
            <div className="byline">HACAN hits</div>
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)' }}>vs</div>
          <div className="f-sol" style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 22, color: 'currentColor' }}>3</div>
            <div className="byline">SOL hits</div>
          </div>
        </div>
        <Rule />
        <Label>Tap a unit to log a roll</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
          {['Dread (5)', 'Cruiser (7)', 'Fighter (9)', 'Carrier (9)', 'Destroyer (9)', 'PDS (6)'].map((u, i) => (
            <SketchFrame key={u} style={{ padding: 6, fontSize: 10, fontFamily: 'var(--serif)', textAlign: 'center', fontWeight: 600 }}>{u}</SketchFrame>
          ))}
        </div>
        <Rule />
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1, padding: 6, background: 'var(--ink)', color: 'var(--paper)', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em' }}>+ ROLL</div>
          <div style={{ flex: 1, padding: 6, border: '1px solid var(--ink)', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em' }}>NEXT RD</div>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, {
  PlayerDash_Broadsheet, PlayerDash_Phone, PlayerDash_SheetCard, PlayerDash_Radar,
  Combat_Ledger, Combat_Feed, Combat_Splits, Combat_Phone,
});
