import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ParsedGame } from '../../lib/parser/types';
import {
  Mast,
  Rule,
  FactionChip,
  FactionDot,
  DivergingComparison,
  MultiLineChart,
  LoadingSkeleton,
  ErrorState,
} from '../../shared';
import { deriveRoundBoundaries } from '../../lib/aggregator/deriveRoundBoundaries';
import { buildVpRaceSeries } from '../../lib/vp/buildVpRaceSeries';

function formatShortDate(ms: number): string {
  if (!ms) return '—';
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function muteColor(hex: string): string {
  // Desaturate by blending toward gray. Accepts #RRGGBB; falls back to original if format unknown.
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m || m[1] === undefined) return hex;
  const v = m[1];
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  // blend 55% toward mid-gray
  const mix = (c: number) => Math.round(c * 0.45 + 128 * 0.55);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

const backLinkStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 'var(--font-micro)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--ink-3)',
  textDecoration: 'none',
  display: 'inline-block',
  marginBottom: '12px',
};

interface GameCardHeaderProps {
  label: string;
  game: ParsedGame;
  align?: 'left' | 'right';
}

function GameCardHeader({ label, game, align = 'left' }: GameCardHeaderProps) {
  const winnerFaction = game.factions.find((f) => f.factionId === game.winner);
  const winnerVp = game.winner !== null ? (game.finalScores[game.winner] ?? 0) : 0;
  const dateStr = game.playedAt ? new Date(game.playedAt).toLocaleDateString() : '—';
  return (
    <div
      style={{
        border: '1px solid var(--rule)',
        padding: '10px 12px',
        textAlign: align,
      }}
    >
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 'var(--font-micro)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 'var(--font-micro)',
          color: 'var(--ink-2)',
          marginTop: 2,
        }}
      >
        {dateStr}
      </div>
      <div
        style={{
          marginTop: 8,
          display: 'flex',
          gap: 6,
          alignItems: 'baseline',
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        }}
      >
        <span
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontWeight: 800,
            fontStyle: 'italic',
            fontSize: 'var(--font-display-sm)',
            color: 'var(--ink)',
          }}
        >
          {winnerFaction?.factionId ?? 'No winner'}
        </span>
        <span
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontWeight: 800,
            fontSize: 'var(--font-body)',
            color: 'var(--accent)',
          }}
        >
          {winnerVp} VP
        </span>
      </div>
      <div
        style={{
          marginTop: 8,
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        }}
      >
        {game.factions.map((f) => (
          <FactionChip
            key={f.factionId}
            factionId={f.factionId}
            color={f.color}
            score={game.finalScores[f.factionId] ?? 0}
            winner={f.factionId === game.winner}
          />
        ))}
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 'var(--font-micro)',
          color: 'var(--ink-3)',
          marginTop: 8,
        }}
      >
        {game.factions.length} factions · {Math.round(game.durationSeconds / 60)} min
      </div>
    </div>
  );
}

function gameMetrics(game: ParsedGame) {
  const maxRound =
    game.phaseSnapshots.length > 0
      ? Math.max(...game.phaseSnapshots.map((p) => p.round))
      : 0;
  const totalVp = Object.values(game.finalScores).reduce((s, v) => s + v, 0);
  const winnerVp =
    game.winner !== null ? (game.finalScores[game.winner] ?? 0) : 0;
  const planetControllers = new Set<string>(
    game.planetEvents.filter((p) => p.type === 'claim').map((p) => p.faction),
  );
  const techsResearched = game.techEvents.filter((t) => t.type === 'research').length;
  const durationMin = Math.round(game.durationSeconds / 60);
  return {
    rounds: maxRound,
    totalVp,
    winnerVp,
    agendas: game.agendaResolutions.length,
    planets: planetControllers.size,
    techs: techsResearched,
    durationMin,
  };
}

function buildSeries(game: ParsedGame, suffix: string, mute: boolean) {
  const boundaries = deriveRoundBoundaries(
    game.strategyCardEvents,
    game.factions.length,
  );
  const summary = buildVpRaceSeries({
    vpEvents: game.vpEvents,
    factions: game.factions,
    finalScores: game.finalScores,
    options: game.options,
    roundBoundaries: boundaries,
  });
  return summary.series.map((s) => ({
    label: suffix ? `${s.factionId} (${suffix})` : s.factionId,
    color: mute ? muteColor(s.color) : s.color,
    values: s.points.map((p) => p.cumulativeVp),
  }));
}

export function ComparePage() {
  const { gameA, gameB } = useParams<{ gameA: string; gameB: string }>();
  const [a, setA] = useState<ParsedGame | null>(null);
  const [b, setB] = useState<ParsedGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gameA === undefined || gameB === undefined) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    import('../../adapters/firestore')
      .then(({ loadGame }) => Promise.all([loadGame(gameA), loadGame(gameB)]))
      .then(([ga, gb]) => {
        if (!cancelled) {
          setA(ga);
          setB(gb);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load games');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [gameA, gameB]);

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px 64px' }}>
        <Link to="/" style={backLinkStyle}>
          ← Archive
        </Link>

        <Mast title="Compared" subtitle="Two games, side by side" />

        {loading && <LoadingSkeleton rows={6} />}

        {!loading && error !== null && <ErrorState message={error} />}

        {!loading && error === null && a !== null && b !== null && (
          <ComparisonBody a={a} b={b} />
        )}
      </main>
    </div>
  );
}

interface BodyProps {
  a: ParsedGame;
  b: ParsedGame;
}

function ComparisonBody({ a, b }: BodyProps) {
  const winnerColorA =
    a.factions.find((f) => f.factionId === a.winner)?.color ?? 'var(--ink-3)';
  const winnerColorB =
    b.factions.find((f) => f.factionId === b.winner)?.color ?? 'var(--ink-3)';

  const labelA = `Game A · ${formatShortDate(a.playedAt)}`;
  const labelB = `Game B · ${formatShortDate(b.playedAt)}`;

  const mA = gameMetrics(a);
  const mB = gameMetrics(b);

  const seriesA = buildSeries(a, '', false);
  const seriesB = buildSeries(b, '', false);

  const factionsInB = new Set(b.factions.map((f) => f.factionId));
  const sharedFactions = a.factions.filter((f) => factionsInB.has(f.factionId));

  return (
    <>
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <GameCardHeader label="Game A" game={a} align="left" />
        <GameCardHeader label="Game B" game={b} align="right" />
      </section>

      <Rule />

      <section style={{ marginTop: 16, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <MultiLineChart title={labelA} series={seriesA} />
          <MultiLineChart title={labelB} series={seriesB} />
        </div>
      </section>

      <section style={{ marginBottom: 20 }}>
        <DivergingComparison
          entityA={{ label: labelA, color: winnerColorA }}
          entityB={{ label: labelB, color: winnerColorB }}
          rows={[
            { metric: 'Game length (rounds)', a: mA.rounds, b: mB.rounds },
            { metric: 'Total VP scored', a: mA.totalVp, b: mB.totalVp },
            { metric: 'Winner VP', a: mA.winnerVp, b: mB.winnerVp },
            { metric: 'Agendas voted', a: mA.agendas, b: mB.agendas },
            { metric: 'Planets controlled', a: mA.planets, b: mB.planets },
            { metric: 'Techs researched', a: mA.techs, b: mB.techs },
            { metric: 'Duration (min)', a: mA.durationMin, b: mB.durationMin },
          ]}
        />
      </section>

      <section>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--ink-3)',
            marginBottom: 8,
          }}
        >
          Faction-by-faction VP
        </div>
        {sharedFactions.length > 0 ? (
          <DivergingComparison
            entityA={{ label: labelA, color: winnerColorA }}
            entityB={{ label: labelB, color: winnerColorB }}
            rows={sharedFactions.map((f) => ({
              metric: f.factionId,
              a: a.finalScores[f.factionId] ?? 0,
              b: b.finalScores[f.factionId] ?? 0,
            }))}
          />
        ) : (
          <p
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'var(--font-body)',
              color: 'var(--ink-2)',
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <FactionDot color={winnerColorA} size={8} />
            <FactionDot color={winnerColorB} size={8} />
            No shared factions between these games.
          </p>
        )}
      </section>
    </>
  );
}
