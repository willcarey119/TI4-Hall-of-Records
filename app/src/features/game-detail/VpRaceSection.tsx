import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildVpTimeline, type FactionVpSeries, type VpTimelineSummary } from '../../lib/vp/buildVpTimeline';
import { Rule } from '../../shared';
import { formatDuration } from '../../shared/formatters';

const W = 400;
const H = 200;
const PX = 28; // left padding for VP labels
const PY = 14; // top/bottom padding

function xScale(gameTimeSeconds: number, gameDurationSeconds: number): number {
  return PX + (gameTimeSeconds / Math.max(gameDurationSeconds, 1)) * (W - PX - 6);
}

function yScale(vp: number, victoryPoints: number): number {
  return H - PY - (vp / (victoryPoints + 1)) * (H - PY * 2);
}

function SlopeChart({ summary }: { summary: VpTimelineSummary }) {
  const { series, victoryPoints, gameDurationSeconds } = summary;

  const gridVps = Array.from(
    { length: Math.floor(victoryPoints / 2) },
    (_, i) => (i + 1) * 2,
  ).filter(v => v <= victoryPoints);

  // Format x-axis time labels at 0%, 25%, 50%, 75%, 100%
  const timeLabels = [0, 0.25, 0.5, 0.75, 1].map(frac => ({
    x: xScale(frac * gameDurationSeconds, gameDurationSeconds),
    label: formatDuration(Math.round(frac * gameDurationSeconds)),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {/* Horizontal VP gridlines */}
      {gridVps.map(v => (
        <g key={v}>
          <line
            x1={PX} y1={yScale(v, victoryPoints)}
            x2={W - 6} y2={yScale(v, victoryPoints)}
            stroke="var(--ink-4)" strokeWidth={0.5} strokeDasharray="2 3"
          />
          <text
            x={PX - 4} y={yScale(v, victoryPoints) + 3}
            textAnchor="end"
            fontFamily="'IBM Plex Mono', monospace" fontSize={7}
            fill="var(--ink-3)"
          >
            {v}
          </text>
        </g>
      ))}

      {/* Victory line */}
      <line
        x1={PX} y1={yScale(victoryPoints, victoryPoints)}
        x2={W - 6} y2={yScale(victoryPoints, victoryPoints)}
        stroke="var(--accent)" strokeWidth={1}
      />
      <text
        x={W - 6} y={yScale(victoryPoints, victoryPoints) - 3}
        textAnchor="end"
        fontFamily="'IBM Plex Mono', monospace" fontSize={7}
        fill="var(--accent)"
      >
        VICTORY · {victoryPoints}
      </text>

      {/* X-axis time labels */}
      {timeLabels.map((tick, i) => (
        <text
          key={i} x={tick.x} y={H - 2}
          textAnchor="middle"
          fontFamily="'IBM Plex Mono', monospace" fontSize={7}
          fill="var(--ink-4)"
        >
          {tick.label}
        </text>
      ))}

      {/* Faction paths */}
      {series.map(s => <FactionPath key={s.factionId} s={s} summary={summary} />)}
    </svg>
  );
}

function FactionPath({ s, summary }: { s: FactionVpSeries; summary: VpTimelineSummary }) {
  const { victoryPoints, gameDurationSeconds } = summary;
  if (s.points.length < 2) return null;

  const pathD = s.points
    .map((p, i) => {
      const x = xScale(p.gameTimeSeconds, gameDurationSeconds);
      const y = yScale(p.cumulativeVp, victoryPoints);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Intentional editorial design: winner highlighted in accent, others in neutral ink.
  // Faction identity is communicated via the legend's color dots, not the line strokes.
  // This creates clear visual hierarchy and matches the newspaper/almanac aesthetic.
  const stroke = s.isWinner ? 'var(--accent)' : 'var(--ink-3)';
  const sw = s.isWinner ? 2 : 1;
  const lastPt = s.points[s.points.length - 1];

  return (
    <g>
      <path
        d={pathD} fill="none"
        stroke={stroke} strokeWidth={sw}
        strokeLinejoin="round" strokeLinecap="round"
      />
      {s.points.map((p, i) => {
        const cx = xScale(p.gameTimeSeconds, gameDurationSeconds);
        const cy = yScale(p.cumulativeVp, victoryPoints);
        const isLast = i === s.points.length - 1;
        return (
          <circle
            key={i}
            cx={cx} cy={cy}
            r={isLast ? 3 : 1.5}
            fill={stroke}
          />
        );
      })}
      {lastPt !== undefined && (
        <text
          x={xScale(lastPt.gameTimeSeconds, gameDurationSeconds) + 4}
          y={yScale(lastPt.cumulativeVp, victoryPoints) + 3}
          fontFamily="'Newsreader', Georgia, serif" fontSize={9} fontWeight={700}
          fill={stroke}
        >
          {s.finalVp}
        </text>
      )}
    </g>
  );
}

export function VpRaceSection() {
  const { game } = useGame();

  const summary = useMemo(
    () =>
      game !== null
        ? buildVpTimeline(
            game.vpEvents,
            game.factions,
            game.finalScores,
            game.options,
            game.durationSeconds,
          )
        : null,
    [game],
  );

  return (
    <section
      id="vp-race"
      data-section="vp-race"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      {summary !== null && game !== null && (
        <VpRaceContent summary={summary} factions={game.factions} />
      )}
    </section>
  );
}

function VpRaceContent({
  summary,
  factions,
}: {
  summary: VpTimelineSummary;
  factions: { factionId: string; color: string }[];
}) {
  const factionColorMap = Object.fromEntries(factions.map(f => [f.factionId, f.color]));

  return (
    <>
      {/* Kicker */}
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--rule)',
          paddingBottom: 3,
          marginBottom: 6,
        }}
      >
        <span>VP Race · This Game</span>
        <span>To {summary.victoryPoints} · {formatDuration(summary.gameDurationSeconds)}</span>
      </div>

      {/* Headline */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 22,
          fontWeight: 800,
          fontStyle: 'italic',
          lineHeight: 1.1,
          margin: '4px 0 2px',
        }}
      >
        {summary.headline}
      </div>

      {/* Deck */}
      <div style={{ fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
        {summary.deckText}
      </div>

      <hr style={{ border: 'none', borderTop: '3px double var(--rule)', margin: '6px 0' }} />

      {/* SVG slope chart */}
      <SlopeChart summary={summary} />

      <Rule />

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: 4 }}>
        {summary.series.map(s => (
          <div key={s.factionId} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
            <span
              style={{
                width: 16,
                height: s.isWinner ? 3 : 1.5,
                background: s.isWinner ? 'var(--accent)' : 'var(--ink-3)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontWeight: s.isWinner ? 700 : 400,
                color: s.isWinner ? 'var(--accent)' : 'var(--ink-2)',
              }}
            >
              {s.factionId}
            </span>
            <span style={{ color: 'var(--ink-3)', fontSize: 9 }}>{s.finalVp}</span>
            {/* color dot */}
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: factionColorMap[s.factionId] ?? 'var(--ink-4)',
                display: 'inline-block',
              }}
            />
          </div>
        ))}
      </div>

      {/* Editorial prose with drop cap */}
      <p
        className="dropcap"
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 10,
          lineHeight: 1.55,
          color: 'var(--ink-2)',
          marginTop: 10,
          marginBottom: 0,
        }}
      >
        {summary.editorialProse}
      </p>
    </>
  );
}
