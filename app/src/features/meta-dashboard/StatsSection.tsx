import { useMeta } from './MetaContext';
import { Rule, formatDuration } from '../../shared';

const SOURCE_LABEL: Record<string, string> = {
  score_objective: 'OBJ', custodians: 'CUST', imperial_point: 'IMP', support_for_throne: 'SFT',
  relic: 'RELIC', agenda: 'AGD', rider: 'RIDER', legendary_planet: 'LGND', manual: 'MAN',
};

function fmtPct(p: number | null): string {
  return p === null ? 'n/a' : `${Math.round(p * 100)}%`;
}

export function StatsSection() {
  const { gameStats } = useMeta();
  if (gameStats === null) {
    return <section id="stats" data-section="stats" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }} />;
  }

  const maxVpRound = Math.max(1, ...Object.values(gameStats.objectiveTiming.vpByRound));

  return (
    <section id="stats" data-section="stats" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--ink-4)', paddingBottom: 3, marginBottom: 6 }}>
        <span>Game Stats · Aggregate</span>
        <span>{gameStats.totalGames} games</span>
      </div>

      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, fontWeight: 800, lineHeight: 1.1, marginBottom: 8 }}>
        The almanac.
      </div>

      {/* Headline grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Total games',    value: String(gameStats.totalGames) },
          { label: 'Avg duration',   value: formatDuration(Math.round(gameStats.avgDurationSeconds)) },
          { label: 'Avg winning VP', value: gameStats.avgWinningVp === null ? '—' : gameStats.avgWinningVp.toFixed(1) },
          { label: 'Avg players',    value: gameStats.avgPlayersPerGame.toFixed(1) },
        ].map(cell => (
          <div key={cell.label} style={{ background: 'var(--paper-2)', padding: 8, border: '1px solid var(--ink-4)' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)' }}>{cell.label}</div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 18, fontWeight: 800 }}>{cell.value}</div>
          </div>
        ))}
      </div>

      {/* Mecatol Rex */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 4 }}>Mecatol Rex</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
        <div><span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 16, fontWeight: 800 }}>{fmtPct(gameStats.mecatol.firstClaimerWinRate)}</span><div style={{ color: 'var(--ink-3)', fontSize: 7 }}>FIRST CLAIMER WINS</div></div>
        <div><span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 16, fontWeight: 800 }}>{gameStats.mecatol.avgFirstClaimRound === null ? '—' : `Rnd ${gameStats.mecatol.avgFirstClaimRound.toFixed(1)}`}</span><div style={{ color: 'var(--ink-3)', fontSize: 7 }}>AVG FIRST CLAIM</div></div>
        <div><span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 16, fontWeight: 800 }}>{gameStats.mecatol.avgTurnoverPerGame.toFixed(1)}×</span><div style={{ color: 'var(--ink-3)', fontSize: 7 }}>AVG TURNOVERS / GAME</div></div>
      </div>

      <Rule />

      {/* Action types */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Action Type Breakdown</div>
      {gameStats.actionTypes.tacticalPct === null ? (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)' }}>
          Re-upload game files to enable action tracking.
        </div>
      ) : (
        <>
          {([['Tactical', gameStats.actionTypes.tacticalPct], ['Component', gameStats.actionTypes.componentPct], ['Pass', gameStats.actionTypes.passPct]] as const).map(([label, pct]) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 40px', gap: 6, alignItems: 'center', padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
              <span>{label}</span>
              <div style={{ background: 'var(--ink-4)', height: 6 }}>
                <div style={{ background: 'var(--cool)', height: 6, width: `${(pct ?? 0) * 100}%` }} />
              </div>
              <span style={{ textAlign: 'right' }}>{Math.round((pct ?? 0) * 100)}%</span>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Tactical Leaders</div>
              {gameStats.actionTypes.topTactical.map(t => (
                <div key={t.factionId} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>{t.factionId} · {t.avgPerGame.toFixed(1)}/game</div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Component Leaders</div>
              {gameStats.actionTypes.topComponent.map(t => (
                <div key={t.factionId} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>{t.factionId} · {t.avgPerGame.toFixed(1)}/game</div>
              ))}
            </div>
          </div>
        </>
      )}

      <Rule />

      {/* VP source breakdown */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>VP Source Breakdown</div>
      {gameStats.vpSources.map(src => (
        <div key={src.source} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 40px', gap: 6, alignItems: 'center', padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
          <span>{SOURCE_LABEL[src.source] ?? src.source}</span>
          <div style={{ background: 'var(--ink-4)', height: 4 }}>
            <div style={{ background: 'var(--accent)', height: 4, width: `${src.sharePct * 100}%` }} />
          </div>
          <span style={{ textAlign: 'right' }}>{Math.round(src.sharePct * 100)}%</span>
        </div>
      ))}

      <Rule />

      {/* VP Source Diversity */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>VP Diversity · Winners vs. Losers</div>
      {gameStats.vpDiversity.avgWinnerDistinctSources === null ? (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)' }}>Requires at least one decided game.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
          <div>
            <div style={{ color: 'var(--ink-3)', fontSize: 7, textTransform: 'uppercase' }}>Avg Distinct Sources</div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, fontWeight: 800 }}>
              <span style={{ color: 'var(--accent)' }}>{(gameStats.vpDiversity.avgWinnerDistinctSources ?? 0).toFixed(1)}</span>
              <span style={{ color: 'var(--ink-3)' }}> winners · </span>
              <span>{(gameStats.vpDiversity.avgLoserDistinctSources ?? 0).toFixed(1)}</span>
              <span style={{ color: 'var(--ink-3)' }}> losers</span>
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--ink-3)', fontSize: 7, textTransform: 'uppercase' }}>Concentration (HHI)</div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14, fontWeight: 800 }}>
              <span style={{ color: 'var(--accent)' }}>{(gameStats.vpDiversity.avgWinnerHHI ?? 0).toFixed(2)}</span>
              <span style={{ color: 'var(--ink-3)' }}> winners · </span>
              <span>{(gameStats.vpDiversity.avgLoserHHI ?? 0).toFixed(2)}</span>
              <span style={{ color: 'var(--ink-3)' }}> losers</span>
            </div>
          </div>
        </div>
      )}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: 'var(--ink-3)', marginTop: 4 }}>
        Lower HHI = points spread across more sources. Higher = concentrated on one engine.
      </div>

      <Rule />

      {/* Comeback */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Comeback / Collapse</div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
        {gameStats.comingFromBehind.gamesWithRound3Data === 0
          ? <span style={{ color: 'var(--ink-3)' }}>Requires 3+ rounds of data.</span>
          : <span>Round 3 leader wins: <strong>{gameStats.comingFromBehind.round3LeaderWins} of {gameStats.comingFromBehind.gamesWithRound3Data}</strong> ({fmtPct(gameStats.comingFromBehind.round3LeaderWinRate)})</span>
        }
      </div>

      <Rule />

      {/* Stage II first scorer */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Stage II First Scorer</div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
        {gameStats.stage2.gamesWithStage2 === 0
          ? <span style={{ color: 'var(--ink-3)' }}>No Stage II scoring data yet.</span>
          : <span>First Stage II scorer wins: <strong>{gameStats.stage2.firstStage2ScorerWins} of {gameStats.stage2.gamesWithStage2}</strong> ({fmtPct(gameStats.stage2.firstStage2ScorerWinRate)})</span>
        }
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: 'var(--ink-3)', marginTop: 4 }}>
        Whether the first faction to crack a Stage II objective tends to close out the game.
      </div>

      <Rule />

      {/* Objective timing */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Objective Timing — VP per Round</div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 50, marginBottom: 12 }}>
        {Object.entries(gameStats.objectiveTiming.vpByRound).sort(([a], [b]) => Number(a) - Number(b)).map(([round, vp]) => (
          <div key={round} style={{ flex: 1, textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: 8 }}>
            <div style={{ background: 'var(--ink)', width: '100%', height: (vp / maxVpRound) * 40 }} />
            <div style={{ color: 'var(--ink-3)' }}>R{round}</div>
            <div>{vp}</div>
          </div>
        ))}
      </div>

      <Rule />

      {/* Hero activations */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Hero Activations</div>
      {gameStats.heroActivations.length === 0 ? (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)' }}>No hero activation data recorded.</div>
      ) : gameStats.heroActivations.map(h => (
        <div key={`${h.factionId}::${h.leaderName}`} style={{ display: 'flex', gap: 6, padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 10 }}>{h.factionId} · {h.leaderName}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--ink-3)' }}>
            {h.avgActivationRound === null ? '—' : `Rnd ${h.avgActivationRound.toFixed(1)} avg`} · {h.gamesActivated}/{h.gamesPlayed} games
          </span>
        </div>
      ))}

      <Rule />

      {/* Relics */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Relic Activity</div>
      {gameStats.relics.map(r => (
        <div key={r.relic} style={{ display: 'flex', gap: 6, padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 10 }}>{r.relic}</span>
          <span style={{ color: 'var(--ink-3)' }}>Drawn {r.drawnCount}× · Played {r.playedCount}×</span>
          {r.grantsVp && <span style={{ color: 'var(--accent)', textTransform: 'uppercase', fontSize: 7, letterSpacing: '0.1em' }}>VP</span>}
        </div>
      ))}

      <Rule />

      {/* Agenda analysis */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Agenda Analysis · Top 5 by Impact</div>
      {gameStats.agendas.slice(0, 5).map(a => (
        <div key={a.agenda} style={{ display: 'flex', gap: 6, padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 10, flex: 1 }}>{a.agenda}</span>
          <span style={{ color: 'var(--ink-3)' }}>Pass {fmtPct(a.passRate)}</span>
          <span style={{ color: a.netVpSwing >= 0 ? 'var(--accent)' : 'var(--cool)' }}>
            {a.netVpSwing >= 0 ? '+' : ''}{a.netVpSwing} VP
          </span>
        </div>
      ))}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: 'var(--ink-3)', marginTop: 4 }}>
        Elect-type agendas excluded from pass rate.
      </div>
    </section>
  );
}
