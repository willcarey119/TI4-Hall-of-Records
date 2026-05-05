import React from 'react';
import { useMeta } from './MetaContext';
import { Rule, formatDuration, SectionDesc, Tooltip, StatCard, Kicker } from '../../shared';

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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <StatCard variant="anchor" label="Total games" value={String(gameStats.totalGames)} />
          <Tooltip text="Count of complete game sessions with valid parsed data in this archive." />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <StatCard variant="anchor" label="Avg duration" value={formatDuration(Math.round(gameStats.avgDurationSeconds))} />
          <Tooltip text="Mean wall-clock time per game from session start to final score, as recorded by TI Assistant." />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <StatCard variant="anchor" label="Avg winning VP" value={gameStats.avgWinningVp === null ? '—' : gameStats.avgWinningVp.toFixed(1)} />
          <Tooltip text="Mean final victory point total of the winning faction across all games." />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <StatCard variant="anchor" label="Avg players" value={gameStats.avgPlayersPerGame.toFixed(1)} />
          <Tooltip text="Mean number of factions per game. TI4 supports 3–8 players." />
        </div>
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
      <div style={{ border: '1px solid var(--rule)', padding: '12px 16px', marginBottom: 12 }}>
        <Kicker text="Mecatol Rex" />
        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-body)', color: 'var(--ink-2)', lineHeight: 1.5, margin: '6px 0 10px' }}>
          The galaxy's central planet. Capturing it claims the Custodians token — one point, awarded once per game. Holding it at round end grants influence over the agenda phase. Contested aggressively — and frequently traded.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <StatCard variant="anchor" label="First claimer wins" value={fmtPct(gameStats.mecatol.firstClaimerWinRate)} />
            <span style={{ position: 'absolute', top: 8, right: 8 }}><Tooltip text="How often the faction that first captures Mecatol Rex goes on to win the game." /></span>
          </div>
          <div style={{ position: 'relative' }}>
            <StatCard variant="anchor" label="Avg first claim" value={gameStats.mecatol.avgFirstClaimRound === null ? '—' : `Rnd ${gameStats.mecatol.avgFirstClaimRound.toFixed(1)}`} />
            <span style={{ position: 'absolute', top: 8, right: 8 }}><Tooltip text="Average round number when Mecatol Rex is first captured across all games." /></span>
          </div>
          <div style={{ position: 'relative' }}>
            <StatCard variant="anchor" label="Avg turnovers / game" value={`${gameStats.mecatol.avgTurnover.toFixed(1)}×`} />
            <span style={{ position: 'absolute', top: 8, right: 8 }}><Tooltip text="Average number of times Mecatol Rex changes hands per game. A turnover occurs any time control switches to a different faction." /></span>
          </div>
        </div>
      </div>

      <Rule />

      {/* Imperial Strategy Card · Mecatol Correlation */}
      {gameStats.imperialMecatol.totalActivations > 0 && (
        <>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 2px' }}>
            Imperial Strategy Card · Mecatol Correlation
          </div>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 8, fontStyle: 'italic' }}>
            How often the Imperial card holder controlled Mecatol Rex when they played the primary — and what happened when they didn't.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
            {([
              { label: 'Total activations', value: String(gameStats.imperialMecatol.totalActivations), color: 'var(--ink)' },
              { label: 'Owned Mecatol → scored VP', value: String(gameStats.imperialMecatol.scoredVp), color: 'var(--accent)' },
              { label: 'Had Mecatol at pick, contested away', value: String(gameStats.imperialMecatol.contestedAway), color: '#e67e22' },
              { label: 'No Mecatol involvement', value: String(gameStats.imperialMecatol.noMecatol), color: 'var(--ink-3)' },
            ] as const).map(cell => (
              <div key={cell.label} style={{ background: 'var(--paper-2)', padding: 8, border: '1px solid var(--ink-4)' }}>
                <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-subhead)', fontWeight: 800, color: cell.color }}>{cell.value}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2, lineHeight: 1.3 }}>{cell.label}</div>
              </div>
            ))}
          </div>
          {([
            { label: 'Scored VP', n: gameStats.imperialMecatol.scoredVp, color: 'var(--accent)' },
            { label: 'Contested away', n: gameStats.imperialMecatol.contestedAway, color: '#e67e22' },
            { label: 'No Mecatol', n: gameStats.imperialMecatol.noMecatol, color: 'var(--ink-3)' },
          ] as const).map(row => {
            const pct = gameStats.imperialMecatol.totalActivations > 0
              ? row.n / gameStats.imperialMecatol.totalActivations
              : 0;
            return (
              <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 44px', gap: 6, alignItems: 'center', padding: '2px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>
                <span style={{ color: row.color }}>{row.label}</span>
                <div style={{ background: 'var(--ink-4)', height: 4 }}>
                  <div style={{ background: row.color, height: 4, width: `${pct * 100}%` }} />
                </div>
                <span style={{ textAlign: 'right' }}>{Math.round(pct * 100)}%</span>
              </div>
            );
          })}
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, marginTop: 8, borderTop: '1px solid var(--rule)', paddingTop: 6 }}>
            <strong style={{ color: '#e67e22' }}>Contested away</strong> — owned Mecatol at card selection, lost control before playing the primary.<br />
            <strong style={{ color: 'var(--ink-3)' }}>No Mecatol involvement</strong> — never held Mecatol that round. Could be a strategic block, failed capture, or disinterest — the data cannot distinguish these.
          </div>
          <Rule />
        </>
      )}

      {/* Action types */}
      <div style={{ border: '1px solid var(--rule)', padding: '12px 16px', marginBottom: 12 }}>
        <Kicker text="Action Type Breakdown" />
        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-body)', color: 'var(--ink-2)', lineHeight: 1.5, margin: '6px 0 10px' }}>
          On each turn, a player takes one action. <strong style={{ color: 'var(--ink)' }}>Tactical</strong> — activate a system (move fleets, take combat). <strong style={{ color: 'var(--ink)' }}>Component</strong> — use a faction ability, technology, or action card. <strong style={{ color: 'var(--ink)' }}>Pass</strong> — end your turns for the round.
        </p>
        {(() => {
          const { tacticalPct, componentPct, passPct } = gameStats.actionTypes;
          if (tacticalPct === null || componentPct === null || passPct === null) {
            return (
              <div style={{ background: 'var(--paper-2)', border: '1px solid var(--rule)', padding: '8px 12px', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-body)', color: 'var(--ink-2)', fontStyle: 'italic' }}>
                Re-upload game files to enable action tracking.
              </div>
            );
          }
          return (
            <>
              {([['Tactical', tacticalPct], ['Component', componentPct], ['Pass', passPct]] as const).map(([label, pct]) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 48px', gap: 8, alignItems: 'center', padding: '3px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)' }}>
                  <span style={{ color: 'var(--ink)' }}>{label}</span>
                  <div style={{ background: 'var(--ink-4)', height: 6 }}>
                    <div style={{ background: 'var(--cool)', height: 6, width: `${(pct ?? 0) * 100}%` }} />
                  </div>
                  <span style={{ textAlign: 'right', color: 'var(--ink)' }}>{Math.round((pct ?? 0) * 100)}%</span>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tactical Leaders</div>
                  {gameStats.actionTypes.topTacticalFactions.map(factionId => (
                    <div key={factionId} style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-body)', color: 'var(--ink)' }}>{factionId}</div>
                  ))}
                </div>
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Component Leaders</div>
                  {gameStats.actionTypes.topComponentFactions.map(factionId => (
                    <div key={factionId} style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-body)', color: 'var(--ink)' }}>{factionId}</div>
                  ))}
                </div>
              </div>
            </>
          );
        })()}
      </div>

      <Rule />

      {/* VP source breakdown */}
      <div style={{ border: '1px solid var(--rule)', padding: '12px 16px', marginBottom: 12 }}>
        <Kicker text="VP Source Breakdown" />
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-body)', color: 'var(--ink-2)', lineHeight: 1.7, margin: '6px 0 10px' }}>
          <strong style={{ color: 'var(--ink)' }}>OBJ</strong> — Score Objective (public or secret) &nbsp;·&nbsp;
          <strong style={{ color: 'var(--ink)' }}>CUST</strong> — Custodians (Mecatol VP token) &nbsp;·&nbsp;
          <strong style={{ color: 'var(--ink)' }}>IMP</strong> — Imperial strategy card point &nbsp;·&nbsp;
          <strong style={{ color: 'var(--ink)' }}>SFT</strong> — Support for the Throne (faction political deal) &nbsp;·&nbsp;
          <strong style={{ color: 'var(--ink)' }}>RELIC</strong> — Relic fragment reward &nbsp;·&nbsp;
          <strong style={{ color: 'var(--ink)' }}>AGD</strong> — Agenda outcome &nbsp;·&nbsp;
          <strong style={{ color: 'var(--ink)' }}>RIDER</strong> — Agenda rider bet &nbsp;·&nbsp;
          <strong style={{ color: 'var(--ink)' }}>LGND</strong> — Legendary planet ability &nbsp;·&nbsp;
          <strong style={{ color: 'var(--ink)' }}>MAN</strong> — Manually recorded
        </div>
        {(() => {
          const OBJ_SOURCES = ['score_objective_stage1', 'score_objective_stage2', 'score_objective_secret'];
          const objRows = gameStats.vpSources.filter(s => OBJ_SOURCES.includes(s.source));
          const otherRows = gameStats.vpSources.filter(s => !OBJ_SOURCES.includes(s.source));
          const renderRow = (src: typeof gameStats.vpSources[number]) => {
            const pct = Math.round(src.sharePct * 100);
            const sparse = src.totalPoints === 0;
            return (
              <div key={src.source} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 80px', gap: 6, alignItems: 'center', padding: '3px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', opacity: sparse ? 0.6 : 1 }}>
                <span style={{ color: 'var(--ink)' }}>{SOURCE_LABEL[src.source] ?? src.source}</span>
                <div style={{ background: 'var(--ink-4)', height: 4 }}>
                  <div style={{ background: 'var(--accent)', height: 4, width: `${src.sharePct * 100}%` }} />
                </div>
                <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--ink-2)' }}>{src.totalPoints} VP · </span>
                  <span style={{ color: 'var(--ink)' }}>{pct}%</span>
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
      </div>

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

      {/* Comeback — 2 cards */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px', display: 'flex', alignItems: 'center' }}>
        Comeback / Collapse<Tooltip text="How often the faction leading in VP at the end of Round 3 goes on to win. A low rate means early leads are fragile; a high rate means front-runners rarely collapse." />
      </div>
      {gameStats.comingFromBehind.gamesWithRound3Data === 0 ? (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginBottom: 8 }}>Requires 3+ rounds of data.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, maxWidth: 460, marginBottom: 12 }}>
          <div style={{ background: 'var(--paper-2)', border: '1px solid var(--ink-4)', borderLeft: '3px solid var(--accent)', padding: '10px 12px' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginBottom: 2 }}>R3 leader win rate</div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 22, lineHeight: 1, color: 'var(--accent)' }}>{fmtPct(gameStats.comingFromBehind.round3LeaderWinRate)}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 4 }}>{gameStats.comingFromBehind.decidedGames} of {gameStats.comingFromBehind.gamesWithRound3Data} decided games</div>
          </div>
          <div style={{ background: 'var(--paper-2)', border: '1px solid var(--ink-4)', padding: '10px 12px' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginBottom: 2 }}>Comebacks recorded</div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 22, lineHeight: 1, color: 'var(--ink-3)' }}>{gameStats.comingFromBehind.gamesWithRound3Data - gameStats.comingFromBehind.decidedGames}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 4 }}>games where R3 leader lost</div>
          </div>
        </div>
      )}

      <Rule />

      {/* Stage II first scorer — 2 cards */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px', display: 'flex', alignItems: 'center' }}>
        Stage II First Scorer<Tooltip text="Stage II public objectives are worth 2–3 VP and are only revealed after Stage I is exhausted. How often does the first faction to score one go on to win?" />
      </div>
      {gameStats.stage2.gamesWithStage2 === 0 ? (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginBottom: 8 }}>No Stage II scoring data yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, maxWidth: 460, marginBottom: 12 }}>
          <div style={{ background: 'var(--paper-2)', border: '1px solid var(--ink-4)', borderLeft: '3px solid var(--accent)', padding: '10px 12px' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginBottom: 2 }}>First Stage II scorer wins</div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 22, lineHeight: 1, color: 'var(--accent)' }}>{fmtPct(gameStats.stage2.firstStage2ScorerWinRate)}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 4 }}>{gameStats.stage2.firstStage2ScorerWins} of {gameStats.stage2.gamesWithStage2} games with Stage II</div>
            <div style={{ background: 'var(--ink-4)', height: 4, marginTop: 6 }}>
              <div style={{ background: 'var(--accent)', height: 4, width: `${(gameStats.stage2.firstStage2ScorerWinRate ?? 0) * 100}%` }} />
            </div>
          </div>
          <div style={{ background: 'var(--paper-2)', border: '1px solid var(--ink-4)', padding: '10px 12px' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginBottom: 2 }}>Stage II scoring</div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{gameStats.stage2.gamesWithStage2}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 4 }}>games reached Stage II</div>
          </div>
        </div>
      )}

      <Rule />

      {/* Objective timing — card per round */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Objective Timing — VP per Round</div>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 6 }}>
        Average VP scored per round across all games. Higher number = bigger scoring round.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 6, marginBottom: 12 }}>
        {Object.entries(gameStats.objectiveTiming.avgVpPerRound).sort(([a], [b]) => Number(a) - Number(b)).map(([round, vp]) => {
          const isPeak = vp === maxVpRound;
          return (
            <div key={round} style={{ background: 'var(--paper-2)', border: '1px solid var(--ink-4)', padding: 8, textAlign: 'center' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)' }}>Round {round}</div>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 22, lineHeight: 1, color: isPeak ? 'var(--accent)' : 'var(--ink)' }}>{vp.toFixed(1)}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)', marginTop: 2 }}>avg VP scored</div>
              <div style={{ background: 'var(--ink-4)', height: 4, marginTop: 6 }}>
                <div style={{ background: isPeak ? 'var(--accent)' : 'var(--ink-2)', height: 4, width: `${(vp / maxVpRound) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <Rule />

      {/* Hero activations — card per hero */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Hero Activations</div>
      {gameStats.heroActivations.length === 0 ? (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)' }}>No hero activation data recorded.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6 }}>
          {gameStats.heroActivations.map(h => {
            const isInactive = h.gamesActivated === 0;
            return (
              <div key={h.leaderName} style={{ background: 'var(--paper-2)', border: '1px solid var(--ink-4)', padding: 8, opacity: isInactive ? 0.5 : 1 }}>
                <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 12, lineHeight: 1.2, marginBottom: 4 }}>{h.leaderName}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>{h.gamesActivated}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>games</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>
                      {h.avgActivationRound === null ? '—' : `R${h.avgActivationRound.toFixed(1)}`}
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>avg round</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Rule />

      {/* Relics — card per relic */}
      {(() => {
        const perfMap = new Map(
          (relicStats?.relics ?? []).map(r => [r.relic, r])
        );
        const activityRelics = gameStats.relics;
        const perfOnlyRelics = (relicStats?.relics ?? []).filter(
          r => !activityRelics.some(a => a.relic === r.relic)
        );

        type MergedRelic = { relic: string; drawn: number; played: number; grantsVp: boolean };

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
          ...perfOnlyRelics.map(p => ({ relic: p.relic, drawn: p.gainCount, played: p.playCount, grantsVp: p.grantsVp })),
        ];

        if (merged.length === 0) return null;

        return (
          <>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 2px' }}>Relics</div>
            {relicStats !== null && (
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-4)', marginBottom: 6 }}>
                {relicStats.gamesWithRelicVp} of {relicStats.totalGames} games had relic VP
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 6, marginBottom: 10 }}>
              {merged.map(r => {
                const isInactive = r.drawn === 0;
                return (
                  <div key={r.relic} style={{ background: 'var(--paper-2)', border: '1px solid var(--ink-4)', padding: 8, opacity: isInactive ? 0.5 : 1 }}>
                    <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 12, lineHeight: 1.2, marginBottom: 6 }}>{r.relic}</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div>
                        <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>{r.drawn}×</div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>drawn</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 16, lineHeight: 1, color: r.played > 0 ? 'var(--ink)' : 'var(--ink-3)' }}>{r.played}×</div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>played</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {r.grantsVp ? (
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '1px 5px', border: '1px solid var(--accent)', color: 'var(--accent)', display: 'inline-block' }}>VP</span>
                      ) : (
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-4)' }}>No VP</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}

      <Rule />

      {/* Agenda analysis — card per agenda */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', margin: '8px 0 4px' }}>Agenda Analysis · Top 5 by Impact</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6, marginBottom: 10 }}>
        {gameStats.agendas.slice(0, 5).map(a => {
          const passPct = a.passRate === null ? null : Math.round(a.passRate * 100);
          const isElect = a.passRate === null;
          return (
            <div key={a.agenda} style={{ background: 'var(--paper-2)', border: '1px solid var(--ink-4)', padding: 8 }}>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 12, lineHeight: 1.2, marginBottom: 6 }}>{a.agenda}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>
                    {isElect ? '—' : `${passPct}%`}
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                    {isElect ? 'elect type' : 'pass rate'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 16, lineHeight: 1, color: a.netVpSwing > 0 ? 'var(--accent)' : 'var(--ink-3)' }}>
                    {a.netVpSwing >= 0 ? '+' : ''}{a.netVpSwing} VP
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>net swing</div>
                </div>
              </div>
              {!isElect && (
                <div style={{ background: 'var(--ink-4)', height: 4, marginTop: 6 }}>
                  <div style={{ background: (passPct ?? 0) >= 60 ? 'var(--accent)' : 'var(--ink-2)', height: 4, width: `${passPct ?? 0}%` }} />
                </div>
              )}
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)', marginTop: 5 }}>Resolved {a.timesResolved}×</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginBottom: 10 }}>
        Elect-type agendas excluded from pass rate.
      </div>

      <Rule />

      {/* Speaker Order — 3 cards */}
      {speakerStats !== null && speakerStats.gamesAnalyzed > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
            Speaker Order<Tooltip text="The speaker acts last in strategy card selection but first during the action phase, and controls agenda tiebreaks. Being the initial speaker (Round 1) may confer a structural advantage." />
          </div>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 6 }}>
            The Speaker token passes clockwise each round. The speaker acts last in the Strategy Phase but controls agenda tiebreaks.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 580 }}>
            <StatCard
              variant="rate"
              label="Initial speaker wins"
              value=""
              numerator={speakerStats.initialSpeakerWinCount}
              denominator={speakerStats.gamesAnalyzed}
            />
            <StatCard
              variant="anchor"
              label="Avg rounds — winners"
              value={speakerStats.avgRoundsAsSpeakerWinner.toFixed(1)}
              caption="rounds held speaker token"
            />
            <StatCard
              variant="anchor"
              label="Avg rounds — others"
              value={speakerStats.avgRoundsAsSpeakerNonWinner.toFixed(1)}
              caption="rounds held speaker token"
            />
          </div>
        </div>
      )}

    </section>
  );
}
