import { useMeta } from './MetaContext';
import { Kicker, SectionDesc, MultiLineChart } from '../../shared';
import type { ScoringPaceRoundSummary } from '../../lib/aggregator';
import { getFactionBrandColor } from '../../lib/factions/factionBrandColors';
import type { ParsedGame } from '../../lib/parser/types';
import { deriveRoundBoundaries } from '../../lib/aggregator';
import { buildRoundScores } from '../../lib/recap/buildRoundScores';

interface FactionPaceSeries { label: string; color: string; values: number[]; }

export function buildFactionAverageVpPace(games: ParsedGame[]): FactionPaceSeries[] {
  if (games.length === 0) return [];
  // For each game, get per-round cumulative VP per faction; then average across games.
  let maxRounds = 0;
  const perGame: Array<Map<string, number[]>> = [];
  for (const g of games) {
    const boundaries = deriveRoundBoundaries(g.strategyCardEvents, g.factions.length);
    if (boundaries.length === 0) continue;
    const rs = buildRoundScores(g.vpEvents, g.factions, boundaries);
    if (rs.length === 0) continue;
    if (rs.length > maxRounds) maxRounds = rs.length;
    const m = new Map<string, number[]>();
    for (const f of g.factions) m.set(f.factionId, [0]); // round 0 baseline
    for (const row of rs) {
      for (const f of g.factions) {
        const arr = m.get(f.factionId);
        if (arr === undefined) continue;
        arr.push(row.scores[f.factionId] ?? arr[arr.length - 1] ?? 0);
      }
    }
    perGame.push(m);
  }
  if (maxRounds === 0) return [];
  const len = maxRounds + 1; // include round 0
  const totals = new Map<string, number[]>();
  const counts = new Map<string, number[]>();
  for (const m of perGame) {
    for (const [fid, vals] of m) {
      let tot = totals.get(fid);
      let cnt = counts.get(fid);
      if (tot === undefined) { tot = new Array(len).fill(0); totals.set(fid, tot); }
      if (cnt === undefined) { cnt = new Array(len).fill(0); counts.set(fid, cnt); }
      for (let i = 0; i < len; i++) {
        // If this game ended earlier, hold its final value (cumulative VP doesn't go down)
        const v = vals[i] ?? vals[vals.length - 1] ?? 0;
        tot[i] = (tot[i] ?? 0) + v;
        cnt[i] = (cnt[i] ?? 0) + 1;
      }
    }
  }
  const series: FactionPaceSeries[] = [];
  for (const [fid, tot] of totals) {
    const cnt = counts.get(fid) ?? [];
    const values = tot.map((s, i) => {
      const c = cnt[i] ?? 0;
      return c > 0 ? s / c : 0;
    });
    series.push({
      label: fid,
      color: getFactionBrandColor(fid, 'var(--ink-3)'),
      values,
    });
  }
  series.sort((a, b) => (b.values[b.values.length - 1] ?? 0) - (a.values[a.values.length - 1] ?? 0));
  return series;
}

const W = 520;
const H = 160;
const PAD = { top: 16, right: 16, bottom: 24, left: 28 };

function xScale(round: number, maxRounds: number): number {
  const innerW = W - PAD.left - PAD.right;
  return PAD.left + (round / Math.max(maxRounds, 1)) * innerW;
}

function yScale(vp: number, victoryPoints: number): number {
  const innerH = H - PAD.top - PAD.bottom;
  return PAD.top + innerH - (vp / Math.max(victoryPoints, 1)) * innerH;
}

function WinnerPaceChart({ data }: { data: ScoringPaceRoundSummary }) {
  const { roundCurves, maxRounds, victoryPoints, highlightGameId } = data;

  const innerH = H - PAD.top - PAD.bottom;
  const innerW = W - PAD.left - PAD.right;

  const yTicks = [0, Math.round(victoryPoints / 2), victoryPoints];

  const xTicks = Array.from({ length: maxRounds + 1 }, (_, r) => ({
    x: xScale(r, maxRounds),
    label: r === 0 ? 'START' : `R${r}`,
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {/* Y-axis gridlines and labels */}
      {yTicks.map(v => (
        <g key={v}>
          {v > 0 && (
            <line
              x1={PAD.left} y1={yScale(v, victoryPoints)}
              x2={PAD.left + innerW} y2={yScale(v, victoryPoints)}
              stroke="var(--ink-4)" strokeWidth={v === victoryPoints ? 0 : 0.5}
              strokeDasharray={v === victoryPoints ? undefined : '2 3'}
            />
          )}
          <text
            x={PAD.left - 4} y={yScale(v, victoryPoints) + 3}
            textAnchor="end"
            fontFamily="'IBM Plex Mono', monospace" fontSize={7}
            fill={v === victoryPoints ? 'var(--accent)' : 'var(--ink-4)'}
          >
            {v}
          </text>
        </g>
      ))}

      {/* Victory threshold line */}
      <line
        x1={PAD.left} y1={yScale(victoryPoints, victoryPoints)}
        x2={PAD.left + innerW} y2={yScale(victoryPoints, victoryPoints)}
        stroke="var(--accent)" strokeWidth={1}
      />
      <text
        x={PAD.left + innerW} y={yScale(victoryPoints, victoryPoints) - 3}
        textAnchor="end"
        fontFamily="'IBM Plex Mono', monospace" fontSize={7}
        fill="var(--accent)"
      >
        VICTORY · {victoryPoints}
      </text>

      {/* X-axis baseline */}
      <line
        x1={PAD.left} y1={PAD.top + innerH}
        x2={PAD.left + innerW} y2={PAD.top + innerH}
        stroke="var(--rule)" strokeWidth={1}
      />

      {/* X-axis round labels */}
      {xTicks.map((tick, i) => (
        <text
          key={i}
          x={tick.x} y={H - 4}
          textAnchor="middle"
          fontFamily="'IBM Plex Mono', monospace" fontSize={7}
          fill="var(--ink-4)"
        >
          {tick.label}
        </text>
      ))}

      {/* Winner VP curves — muted lines first, highlight on top */}
      {roundCurves
        .filter(c => c.gameId !== highlightGameId)
        .map(curve => {
          const d = curve.points
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.round, maxRounds).toFixed(1)} ${yScale(p.vp, victoryPoints).toFixed(1)}`)
            .join(' ');
          return (
            <path
              key={curve.gameId}
              d={d}
              fill="none"
              stroke="var(--ink-3)"
              strokeWidth={1.5}
              opacity={0.45}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}

      {/* Highlighted curve (highest peak VP) */}
      {roundCurves
        .filter(c => c.gameId === highlightGameId)
        .map(curve => {
          const d = curve.points
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.round, maxRounds).toFixed(1)} ${yScale(p.vp, victoryPoints).toFixed(1)}`)
            .join(' ');
          return (
            <path
              key={curve.gameId}
              d={d}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}
    </svg>
  );
}

export function ScoringPaceSection() {
  const { scoringPaceRounds, games } = useMeta();
  const sectionStyle = { padding: '14px 16px', borderBottom: '1px solid var(--rule)' };

  if (
    scoringPaceRounds === null ||
    scoringPaceRounds.roundCurves.length === 0 ||
    scoringPaceRounds.maxRounds === 0
  ) {
    return <section id="scoring-pace" data-section="scoring-pace" style={sectionStyle} />;
  }

  return (
    <section id="scoring-pace" data-section="scoring-pace" style={sectionStyle}>
      <Kicker text="Winner scoring pace · by round" />
      <div style={{
        fontFamily: "'Newsreader', Georgia, serif",
        fontStyle: 'italic',
        fontSize: 'var(--font-micro)',
        color: 'var(--ink-3)',
        marginBottom: 8,
      }}>
        Each line = one game's winner trajectory
      </div>
      <SectionDesc>
        How quickly winners accumulated VP round by round across all sessions. Each line is one game's winner — the red line is the fastest win on record. Steep early lines mean aggressive first-turn scoring; flat lines mean slow starts and late surges.
      </SectionDesc>
      <WinnerPaceChart data={scoringPaceRounds} />
      <div style={{
        display: 'flex',
        gap: 16,
        marginTop: 6,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 'var(--font-micro)',
        color: 'var(--ink-4)',
      }}>
        <span>
          <span style={{ color: 'var(--accent)' }}>—</span> fastest winner
        </span>
        <span>
          <span style={{ color: 'var(--ink-3)', opacity: 0.65 }}>—</span> other games
        </span>
        <span style={{ marginLeft: 'auto' }}>
          {scoringPaceRounds.roundCurves.length} game{scoringPaceRounds.roundCurves.length !== 1 ? 's' : ''}
          {' · '}to {scoringPaceRounds.victoryPoints} VP
        </span>
      </div>

      {/* Per-faction average VP across rounds (V1.3a) */}
      {games.length > 0 && (() => {
        const series = buildFactionAverageVpPace(games);
        if (series.length === 0) return null;
        return (
          <div style={{ marginTop: 16 }}>
            <Kicker text="Per-faction average">VP accumulation by faction</Kicker>
            <div style={{ marginTop: 6 }}>
              <MultiLineChart
                title="Average cumulative VP at end of each round"
                series={series}
                yMax={scoringPaceRounds.victoryPoints}
              />
            </div>
          </div>
        );
      })()}
    </section>
  );
}
