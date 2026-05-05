import React from 'react';
import { useMeta } from './MetaContext';
import { Rule, formatDuration, SectionDesc, Tooltip } from '../../shared';

const SOURCE_LABEL: Record<string, string> = {
  score_objective_stage1: 'Obj · Stage I',
  score_objective_stage2: 'Obj · Stage II',
  score_objective_secret: 'Obj · Secret',
  custodians: 'CUST', imperial_point: 'IMP', support_for_throne: 'SFT',
  relic: 'RELIC', agenda: 'AGD', rider: 'RIDER', legendary_planet: 'LGND', manual: 'MAN',
};

function fmtPct(p: number | null): string {
  return p === null ? 'n/a' : `${Math.round(p * 100)}%`;
}

export function StatsSection() {
  const { gameStats, speakerStats, relicStats } = useMeta();
  if (gameStats === null) {
    return <section id="stats" data-section="stats" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }} />;
  }

  const maxVpRound = Math.max(1, ...Object.values(gameStats.objectiveTiming.avgVpPerRound));

  return (
    <section id="stats" data-section="stats" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--ink-4)', paddingBottom: 3, marginBottom: 6 }}>
        <span>Game Stats · Aggregate</span>
        <span>{gameStats.totalGames} games</span>
      </div>

      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-subhead)', fontWeight: 800, lineHeight: 1.1, marginBottom: 8 }}>
        The almanac.
      </div>

      <SectionDesc>
        Aggregate stats across all recorded sessions — total games, average duration, average winning VP, speaker outcomes, and relic fragment trends. A quick-reference almanac for the league.
      </SectionDesc>

      {/* Headline grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Total games',    value: String(gameStats.totalGames),    tip: 'Count of complete game sessions with valid parsed data in this archive.' },
          { label: 'Avg duration',   value: formatDuration(Math.round(gameStats.avgDurationSeconds)), tip: 'Mean wall-clock time per game from session start to final score, as recorded by TI Assistant.' },
          { label: 'Avg winning VP', value: gameStats.avgWinningVp === null ? '—' : gameStats.avgWinningVp.toFixed(1), tip: 'Mean final victory point total of the winning faction across all games.' },
          { label: 'Avg players',    value: gameStats.avgPlayersPerGame.toFixed(1), tip: 'Mean number of factions per game. TI4 supports 3–8 players.' },
        ].map(cell => (
          <div key={cell.label} style={{ background: 'var(--paper-2)', padding: 8, border: '1px solid var(--ink-4)' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', display: 'flex', alignItems: 'center' }}>
              {cell.label}<Tooltip text={cell.tip} />
            </div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-subhead)', fontWeight: 800 }}>{cell.value}</div>
          </div>
        ))}
      </div>

      {/* VP Threshold segmentation table */}
      {gameStats.byThreshold.length > 0 && (() => {
        const mostGames = Math.max(...gameStats.byThreshold.map(s => s.gameCount));
        const threshCols = gameStats.byThreshold.map(s => ({
          label: `${s.vpThreshold} pt`,
          segment: s,
          isMost: s.gameCount === mostGames,
        }));
        const totalCols = 1 + threshCols.length;
        const gridCols = `110px repeat(${totalCols}, 1fr)`;
        const cellStyle = (highlight?: boolean): React.CSSProperties => ({
          padding: '5px 6px',
          background: highlight ? 'var(--paper-2)' : 'var(--paper)',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 'var(--font-micro)',
        });
        const valStyle: React.CSSProperties = {
          fontFamily: "'Newsreader', Georgia, serif",
          fontWeight: 800,
          fontSize: 15,
          textAlign: 'center',
          display: 'block',
        };
        const rows: Array<{ label: string; all: string; byThresh: string[] }> = [
          {
            label: 'Avg Win VP',
            all: gameStats.avgWinningVp === null ? '—' : gameStats.avgWinningVp.toFixed(1),
            byThresh: threshCols.map(c => c.segment.avgWinningVp === null ? '—' : c.segment.avgWinningVp.toFixed(1)),
          },
          {
            label: 'Avg Duration',
            all: formatDuration(Math.round(gameStats.avgDurationSeconds)),
            byThresh: threshCols.map(c => formatDuration(Math.round(c.segment.avgDurationSeconds))),
          },
          {
            label: '1st Claimer Win%',
            all: gameStats.mecatol.firstClaimerWinRate === null ? '—' : `${Math.round(gameStats.mecatol.firstClaimerWinRate * 100)}%`,
            byThresh: threshCols.map(c => c.segment.mecatol.firstClaimerWinRate === null ? '—' : `${Math.round(c.segment.mecatol.firstClaimerWinRate * 100)}%`),
          },
          {
            label: 'Avg Players',
            all: gameStats.avgPlayersPerGame.toFixed(1),
            byThresh: threshCols.map(c => c.segment.avgPlayers.toFixed(1)),
          },
        ];
        return (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 4 }}>
              Key Stats · By Victory Point Threshold
            </div>
            <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 6, fontStyle: 'italic' }}>
              One column per VP goal played in this dataset. ★ = most games at that threshold.
            </p>
            <div style={{ border: '1px solid var(--rule)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '1px', background: 'var(--rule)' }}>
                <div style={{ ...cellStyle(), background: 'var(--paper-2)' }} />
                <div style={{ ...cellStyle(), background: 'var(--paper-2)', textAlign: 'center', color: 'var(--ink-3)', fontSize: 9, textTransform: 'uppercase' as const }}>
                  All<br /><span style={{ color: 'var(--ink-4)' }}>{gameStats.totalGames} games</span>
                </div>
                {threshCols.map(c => (
                  <div key={c.label} style={{ ...cellStyle(c.isMost), textAlign: 'center', color: c.isMost ? 'var(--ink-2)' : 'var(--ink-3)', fontSize: 9, textTransform: 'uppercase' as const }}>
                    {c.segment.vpThreshold} pt {c.isMost ? '★' : ''}<br /><span style={{ color: 'var(--ink-4)' }}>{c.segment.gameCount} game{c.segment.gameCount !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
              {rows.map(row => (
                <div key={row.label} style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '1px', background: 'var(--rule)' }}>
                  <div style={{ ...cellStyle(), color: 'var(--ink-3)', fontSize: 9, textTransform: 'uppercase' as const }}>{row.label}</div>
                  <div style={cellStyle()}><span style={valStyle}>{row.all}</span></div>
                  {threshCols.map((c, i) => (
                    <div key={c.label} style={cellStyle(c.isMost)}>
                      <span style={{ ...valStyle, color: c.isMost ? 'var(--ink-2)' : 'var(--ink)' }}>{row.byThresh[i]}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Mecatol Rex */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 4 }}>Mecatol Rex</div>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 8 }}>
        The galaxy's central planet. Capturing it claims the Custodians token — one point, awarded once per game. Holding it at round end grants influence over the agenda phase. Contested aggressively — and frequently traded.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>
        <div>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-subhead)', fontWeight: 800 }}>{fmtPct(gameStats.mecatol.firstClaimerWinRate)}</span>
          <div style={{ color: 'var(--ink-3)', fontSize: 'var(--font-micro)', display: 'flex', alignItems: 'center' }}>
            FIRST CLAIMER WINS<Tooltip text="How often the faction that first captures Mecatol Rex goes on to win the game." />
          </div>
        </div>
        <div>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-subhead)', fontWeight: 800 }}>{gameStats.mecatol.avgFirstClaimRound === null ? '—' : `Rnd ${gameStats.mecatol.avgFirstClaimRound.toFixed(1)}`}</span>
          <div style={{ color: 'var(--ink-3)', fontSize: 'var(--font-micro)', display: 'flex', alignItems: 'center' }}>
            AVG FIRST CLAIM<Tooltip text="Average round number when Mecatol Rex is first captured across all games." />
          </div>
        </div>
        <div>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-subhead)', fontWeight: 800 }}>{gameStats.mecatol.avgTurnover.toFixed(1)}×</span>
          <div style={{ color: 'var(--ink-3)', fontSize: 'var(--font-micro)', display: 'flex', alignItems: 'center' }}>
            AVG TURNOVERS / GAME<Tooltip text="Average number of times Mecatol Rex changes hands per game. A turnover occurs any time control switches to a different faction." />
          </div>
        </div>
      </div>

      <Rule />

      {/* Action types */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Action Type Breakdown</div>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 6 }}>
        On each turn, a player takes one action. <strong style={{ color: 'var(--ink-2)' }}>Tactical</strong> — activate a system (move fleets, take combat). <strong style={{ color: 'var(--ink-2)' }}>Component</strong> — use a faction ability, technology, or action card. <strong style={{ color: 'var(--ink-2)' }}>Pass</strong> — end your turns for the round.
      </div>
      {(() => {
        const { tacticalPct, componentPct, passPct } = gameStats.actionTypes;
        if (tacticalPct === null || componentPct === null || passPct === null) {
          return (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)' }}>
              Re-upload game files to enable action tracking.
            </div>
          );
        }
        return (
          <>
            {([['Tactical', tacticalPct], ['Component', componentPct], ['Pass', passPct]] as const).map(([label, pct]) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 40px', gap: 6, alignItems: 'center', padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>
              <span>{label}</span>
              <div style={{ background: 'var(--ink-4)', height: 6 }}>
                <div style={{ background: 'var(--cool)', height: 6, width: `${(pct ?? 0) * 100}%` }} />
              </div>
              <span style={{ textAlign: 'right' }}>{Math.round((pct ?? 0) * 100)}%</span>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Tactical Leaders</div>
              {gameStats.actionTypes.topTacticalFactions.map(factionId => (
                <div key={factionId} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>{factionId}</div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Component Leaders</div>
              {gameStats.actionTypes.topComponentFactions.map(factionId => (
                <div key={factionId} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>{factionId}</div>
              ))}
            </div>
          </div>
        </>
        );
      })()}

      <Rule />

      {/* VP source breakdown */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>VP Source Breakdown</div>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: 6 }}>
        <strong style={{ color: 'var(--ink-2)' }}>OBJ</strong> — Score Objective (public or secret) &nbsp;·&nbsp;
        <strong style={{ color: 'var(--ink-2)' }}>CUST</strong> — Custodians (Mecatol VP token) &nbsp;·&nbsp;
        <strong style={{ color: 'var(--ink-2)' }}>IMP</strong> — Imperial strategy card point &nbsp;·&nbsp;
        <strong style={{ color: 'var(--ink-2)' }}>SFT</strong> — Support for the Throne (faction political deal) &nbsp;·&nbsp;
        <strong style={{ color: 'var(--ink-2)' }}>RELIC</strong> — Relic fragment reward &nbsp;·&nbsp;
        <strong style={{ color: 'var(--ink-2)' }}>AGD</strong> — Agenda outcome &nbsp;·&nbsp;
        <strong style={{ color: 'var(--ink-2)' }}>RIDER</strong> — Agenda rider bet &nbsp;·&nbsp;
        <strong style={{ color: 'var(--ink-2)' }}>LGND</strong> — Legendary planet ability &nbsp;·&nbsp;
        <strong style={{ color: 'var(--ink-2)' }}>MAN</strong> — Manually recorded
      </div>
      {(() => {
        const OBJ_SOURCES = ['score_objective_stage1', 'score_objective_stage2', 'score_objective_secret'];
        const objRows = gameStats.vpSources.filter(s => OBJ_SOURCES.includes(s.source));
        const otherRows = gameStats.vpSources.filter(s => !OBJ_SOURCES.includes(s.source));
        const renderRow = (src: typeof gameStats.vpSources[number]) => {
          const pct = Math.round(src.sharePct * 100);
          const sparse = src.totalPoints === 0;
          return (
            <div key={src.source} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 80px', gap: 6, alignItems: 'center', padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', opacity: sparse ? 0.6 : 1 }}>
              <span>{SOURCE_LABEL[src.source] ?? src.source}</span>
              <div style={{ background: 'var(--ink-4)', height: 4 }}>
                <div style={{ background: 'var(--accent)', height: 4, width: `${src.sharePct * 100}%` }} />
              </div>
              <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--ink-3)' }}>{src.totalPoints} VP · </span>
                <span>{pct}%</span>
              </span>
            </div>
          );
        };
        return (
          <>
            {objRows.map(renderRow)}
            {objRows.length > 0 && otherRows.length > 0 && (
              <hr style={{ border: 'none', borderTop: '1px dashed var(--ink-4)', margin: '4px 0' }} />
            )}
            {otherRows.map(renderRow)}
          </>
        );
      })()}

      <Rule />

      {/* VP Source Diversity */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>VP Diversity · Winners vs. Losers</div>
      {gameStats.vpDiversity.avgWinnerDistinctSources === null ? (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)' }}>Requires at least one decided game.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>
          <div>
            <div style={{ color: 'var(--ink-3)', fontSize: 'var(--font-micro)', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
              Avg Distinct Sources<Tooltip text="Mean number of different VP categories (OBJ, CUST, SFT, etc.) a faction scored from. Higher = more balanced; winners tend to score from more categories than losers." />
            </div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-body)', fontWeight: 800 }}>
              <span style={{ color: 'var(--accent)' }}>{(gameStats.vpDiversity.avgWinnerDistinctSources ?? 0).toFixed(1)}</span>
              <span style={{ color: 'var(--ink-3)' }}> winners · </span>
              <span>{(gameStats.vpDiversity.avgLoserDistinctSources ?? 0).toFixed(1)}</span>
              <span style={{ color: 'var(--ink-3)' }}> losers</span>
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--ink-3)', fontSize: 'var(--font-micro)', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
              Concentration (HHI)<Tooltip text="Herfindahl-Hirschman Index: measures how concentrated a faction's VP sources are. Lower HHI = points spread across many categories. Higher HHI = relied on one engine. Winners typically show lower HHI than losers." />
            </div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-body)', fontWeight: 800 }}>
              <span style={{ color: 'var(--accent)' }}>{(gameStats.vpDiversity.avgWinnerHHI ?? 0).toFixed(2)}</span>
              <span style={{ color: 'var(--ink-3)' }}> winners · </span>
              <span>{(gameStats.vpDiversity.avgLoserHHI ?? 0).toFixed(2)}</span>
              <span style={{ color: 'var(--ink-3)' }}> losers</span>
            </div>
          </div>
        </div>
      )}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 4 }}>
        Lower HHI = points spread across more sources. Higher = concentrated on one engine.
      </div>

      <Rule />

      {/* Comeback */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px', display: 'flex', alignItems: 'center' }}>
        Comeback / Collapse<Tooltip text="How often the faction leading in VP at the end of Round 3 goes on to win. A low rate means early leads are fragile; a high rate means front-runners rarely collapse." />
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>
        {gameStats.comingFromBehind.gamesWithRound3Data === 0
          ? <span style={{ color: 'var(--ink-3)' }}>Requires 3+ rounds of data.</span>
          : <span>Round 3 leader wins: <strong>{gameStats.comingFromBehind.decidedGames} of {gameStats.comingFromBehind.gamesWithRound3Data}</strong> ({fmtPct(gameStats.comingFromBehind.round3LeaderWinRate)})</span>
        }
      </div>

      <Rule />

      {/* Stage II first scorer */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px', display: 'flex', alignItems: 'center' }}>
        Stage II First Scorer<Tooltip text="Stage II public objectives are worth 2–3 VP and are only revealed after Stage I is exhausted. How often does the first faction to score one go on to win?" />
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>
        {gameStats.stage2.gamesWithStage2 === 0
          ? <span style={{ color: 'var(--ink-3)' }}>No Stage II scoring data yet.</span>
          : <span>First Stage II scorer wins: <strong>{gameStats.stage2.firstStage2ScorerWins} of {gameStats.stage2.gamesWithStage2}</strong> ({fmtPct(gameStats.stage2.firstStage2ScorerWinRate)})</span>
        }
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 4 }}>
        Whether the first faction to crack a Stage II objective tends to close out the game.
      </div>

      <Rule />

      {/* Objective timing */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Objective Timing — VP per Round</div>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 4 }}>
        Average VP scored per round across all games. Taller bar = higher average scoring that round.
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 50, marginBottom: 2 }}>
        {Object.entries(gameStats.objectiveTiming.avgVpPerRound).sort(([a], [b]) => Number(a) - Number(b)).map(([round, vp]) => (
          <div key={round} style={{ flex: 1, textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>
            <div style={{ background: 'var(--ink)', width: '100%', height: (vp / maxVpRound) * 40 }} />
            <div style={{ color: 'var(--ink-3)' }}>R{round}</div>
            <div>{vp.toFixed(1)}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-4)', marginBottom: 12 }}>avg VP scored</div>

      <Rule />

      {/* Hero activations */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Hero Activations</div>
      {gameStats.heroActivations.length === 0 ? (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)' }}>No hero activation data recorded.</div>
      ) : gameStats.heroActivations.map(h => (
        <div key={h.leaderName} style={{ display: 'flex', gap: 6, padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-micro)' }}>{h.leaderName}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--ink-3)' }}>
            {h.avgActivationRound === null ? '—' : `avg round ${h.avgActivationRound.toFixed(1)}`} · {h.gamesActivated} game{h.gamesActivated !== 1 ? 's' : ''}
          </span>
        </div>
      ))}

      <Rule />

      {/* Relics — unified panel merging activity (gameStats.relics) and performance (relicStats.relics) */}
      {(() => {
        const perfMap = new Map(
          (relicStats?.relics ?? []).map(r => [r.relic, r])
        );
        const activityRelics = gameStats.relics;
        const perfOnlyRelics = (relicStats?.relics ?? []).filter(
          r => !activityRelics.some(a => a.relic === r.relic)
        );

        type MergedRelic = {
          relic: string;
          drawn: number;
          played: number;
          grantsVp: boolean;
        };

        const merged: MergedRelic[] = [
          ...activityRelics.map(a => {
            const perf = perfMap.get(a.relic);
            return {
              relic: a.relic,
              drawn: a.drawnCount,
              played: perf !== undefined ? perf.playCount : a.playedCount,
              grantsVp: a.grantsVp || (perf?.grantsVp ?? false),
            };
          }),
          ...perfOnlyRelics.map(p => ({
            relic: p.relic,
            drawn: p.gainCount,
            played: p.playCount,
            grantsVp: p.grantsVp,
          })),
        ];

        if (merged.length === 0) return null;

        return (
          <>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 2px' }}>Relics</div>
            {relicStats !== null && (
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-4)', marginBottom: 4 }}>
                {relicStats.gamesWithRelicVp} of {relicStats.totalGames} games had relic VP
              </div>
            )}
            {merged.map(r => (
              <div key={r.relic} style={{ display: 'flex', gap: 6, alignItems: 'baseline', padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-micro)' }}>{r.relic}</span>
                <span style={{ color: 'var(--ink-3)' }}>Drawn {r.drawn}× · Played {r.played}×</span>
                {r.grantsVp && <span style={{ color: 'var(--accent)', textTransform: 'uppercase', fontSize: 'var(--font-micro)', letterSpacing: '0.1em' }}>VP</span>}
              </div>
            ))}
          </>
        );
      })()}

      <Rule />

      {/* Agenda analysis */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Agenda Analysis · Top 5 by Impact</div>
      {gameStats.agendas.slice(0, 5).map(a => (
        <div key={a.agenda} style={{ display: 'flex', gap: 6, padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-micro)', flex: 1 }}>{a.agenda}</span>
          <span style={{ color: 'var(--ink-3)' }}>Pass {fmtPct(a.passRate)}</span>
          <span style={{ color: a.netVpSwing >= 0 ? 'var(--accent)' : 'var(--cool)' }}>
            {a.netVpSwing >= 0 ? '+' : ''}{a.netVpSwing} VP
          </span>
        </div>
      ))}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 4 }}>
        Elect-type agendas excluded from pass rate.
      </div>

      <Rule />

      {speakerStats !== null && speakerStats.gamesAnalyzed > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
            Speaker Order<Tooltip text="The speaker acts last in strategy card selection but first during the action phase, and controls agenda tiebreaks. Being the initial speaker (Round 1) may confer a structural advantage." />
          </div>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 6 }}>
            The Speaker token passes clockwise each round. The speaker acts last in the Strategy Phase but controls agenda tiebreaks.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 'var(--font-display-md)', lineHeight: 1 }}>
                {Math.round(speakerStats.initialSpeakerWinRate * 100)}%
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 2 }}>
                initial speaker<br />win rate
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 'var(--font-display-md)', lineHeight: 1 }}>
                {speakerStats.avgRoundsAsSpeakerWinner.toFixed(1)}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 2 }}>
                avg rounds as<br />speaker (winners)
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 'var(--font-display-md)', lineHeight: 1 }}>
                {speakerStats.avgRoundsAsSpeakerNonWinner.toFixed(1)}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 2 }}>
                avg rounds as<br />speaker (others)
              </div>
            </div>
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-4)', marginTop: 6 }}>
            {speakerStats.initialSpeakerWinCount} of {speakerStats.gamesAnalyzed} games won by initial speaker
          </div>
        </div>
      )}

    </section>
  );
}
