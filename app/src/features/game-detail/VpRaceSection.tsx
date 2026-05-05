import { useMemo } from 'react';
import { useGame } from './GameContext';
import { useRoundFilter } from './RoundFilterContext';
import {
  buildVpRaceSeries,
  type FactionVpSeries,
  type VpRaceSummary,
} from '../../lib/vp/buildVpRaceSeries';
import {
  buildVpRaceEditorial,
  type VpRaceEditorial,
} from '../../lib/vp/buildVpRaceEditorial';
import { deriveRoundBoundaries } from '../../lib/aggregator/deriveRoundBoundaries';
import { Rule, FactionDot, SectionDesc } from '../../shared';
import { formatDuration } from '../../shared/formatters';
import { getFactionBrandColor } from '../../lib/factions/factionBrandColors';

const W = 400;
const H = 200;
const PX = 28; // left padding for VP labels
const PY = 14; // top/bottom padding

function xScale(round: number, totalRounds: number): number {
  // Anchor (round 0) sits at PX; the terminal round sits at W - 6.
  return PX + (round / Math.max(totalRounds, 1)) * (W - PX - 6);
}

function yScale(vp: number, victoryPoints: number): number {
  return H - PY - (vp / (victoryPoints + 1)) * (H - PY * 2);
}

function SlopeChart({ summary, scrubRound }: { summary: VpRaceSummary; scrubRound: number | null }) {
  const { series, victoryPoints, totalRounds } = summary;

  const gridVps = Array.from(
    { length: Math.floor(victoryPoints / 2) },
    (_, i) => (i + 1) * 2,
  ).filter(v => v <= victoryPoints);

  // X-axis tick per round, plus the round-0 anchor.
  const roundLabels = Array.from({ length: totalRounds + 1 }, (_, r) => ({
    x: xScale(r, totalRounds),
    label: r === 0 ? 'START' : `R${r}`,
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

      {/* X-axis round labels */}
      {roundLabels.map((tick, i) => (
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
      {series.map(s => <FactionPath key={s.factionId} s={s} summary={summary} scrubRound={scrubRound} />)}
    </svg>
  );
}

function FactionPath({ s, summary, scrubRound }: { s: FactionVpSeries; summary: VpRaceSummary; scrubRound: number | null }) {
  const { victoryPoints, totalRounds } = summary;
  // When scrubRound is set, truncate the series so the line only draws through that round.
  // The X-axis scale stays anchored to totalRounds — the unfilled portion remains visible.
  const points = scrubRound === null
    ? s.points
    : s.points.filter(p => p.round <= scrubRound);
  if (points.length < 2) return null;

  const pathD = points
    .map((p, i) => {
      const x = xScale(p.round, totalRounds);
      const y = yScale(p.cumulativeVp, victoryPoints);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const stroke = getFactionBrandColor(s.factionId, s.color);
  const sw = s.isWinner ? 2 : 1;
  const lastPt = points[points.length - 1];

  return (
    <g>
      <path
        d={pathD} fill="none"
        stroke={stroke} strokeWidth={sw}
        strokeLinejoin="round" strokeLinecap="round"
      />
      {points.map((p, i) => {
        const cx = xScale(p.round, totalRounds);
        const cy = yScale(p.cumulativeVp, victoryPoints);
        const isLast = i === points.length - 1;
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
          x={xScale(lastPt.round, totalRounds) + 4}
          y={yScale(lastPt.cumulativeVp, victoryPoints) + 3}
          fontFamily="'Newsreader', Georgia, serif" fontSize={9} fontWeight={700}
          fill={stroke}
        >
          {scrubRound === null ? s.finalVp : lastPt.cumulativeVp}
        </text>
      )}
    </g>
  );
}

export function VpRaceSection() {
  const { game } = useGame();
  const { scrubRound } = useRoundFilter();

  const composed = useMemo(() => {
    if (game === null) return null;
    const roundBoundaries = deriveRoundBoundaries(game.strategyCardEvents, game.factions.length);
    const summary = buildVpRaceSeries({
      vpEvents: game.vpEvents,
      factions: game.factions,
      finalScores: game.finalScores,
      options: game.options,
      roundBoundaries,
    });
    const editorial = buildVpRaceEditorial({
      factions: game.factions,
      finalScores: game.finalScores,
      options: game.options,
      totalRounds: summary.totalRounds,
    });
    return { summary, editorial };
  }, [game]);

  return (
    <section
      id="vp-race"
      data-section="vp-race"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      {composed !== null && game !== null && (
        <VpRaceContent
          summary={composed.summary}
          editorial={composed.editorial}
          factions={game.factions}
          gameDurationSeconds={game.durationSeconds}
          scrubRound={scrubRound}
        />
      )}
    </section>
  );
}

function VpRaceContent({
  summary,
  editorial,
  factions,
  gameDurationSeconds,
  scrubRound,
}: {
  summary: VpRaceSummary;
  editorial: VpRaceEditorial;
  factions: { factionId: string; color: string }[];
  gameDurationSeconds: number;
  scrubRound: number | null;
}) {
  const factionColorMap = Object.fromEntries(factions.map(f => [f.factionId, f.color]));

  return (
    <>
      {/* Kicker */}
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 'var(--font-micro)',
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
        <span>To {summary.victoryPoints} · {formatDuration(gameDurationSeconds)}</span>
      </div>

      {/* Headline */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 'var(--font-display-sm)',
          fontWeight: 800,
          fontStyle: 'italic',
          lineHeight: 1.1,
          margin: '4px 0 2px',
        }}
      >
        {editorial.headline}
      </div>

      {/* Deck */}
      <div style={{ fontSize: 'var(--font-micro)', color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
        {editorial.deckText}
      </div>

      <SectionDesc>
        Victory point trajectory across every round of this game. Each line tracks one faction's running VP total as they scored — revealing momentum shifts, who surged late, and how close the finish really was.
      </SectionDesc>

      <hr style={{ border: 'none', borderTop: '3px double var(--rule)', margin: '6px 0' }} />

      {/* SVG slope chart */}
      <SlopeChart summary={summary} scrubRound={scrubRound} />

      <Rule />

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginTop: 4 }}>
        {summary.series.map(s => {
          const brandColor = getFactionBrandColor(s.factionId, s.color);
          return (
          <div key={s.factionId} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-micro)' }}>
            <span
              style={{
                width: 16,
                height: s.isWinner ? 3 : 1.5,
                background: brandColor,
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontWeight: s.isWinner ? 700 : 400,
                color: brandColor,
              }}
            >
              {s.factionId}
            </span>
            <span style={{ color: 'var(--ink-3)', fontSize: 'var(--font-micro)' }}>{s.finalVp}</span>
            {/* player table color — distinguishes factions whose brand colors are visually close */}
            <FactionDot color={factionColorMap[s.factionId] ?? 'var(--ink-4)'} size={6} />
          </div>
          );
        })}
      </div>

      {/* Editorial prose with drop cap */}
      <p
        className="dropcap"
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 'var(--font-micro)',
          lineHeight: 1.55,
          color: 'var(--ink-2)',
          marginTop: 10,
          marginBottom: 0,
        }}
      >
        {editorial.editorialProse}
      </p>
    </>
  );
}
