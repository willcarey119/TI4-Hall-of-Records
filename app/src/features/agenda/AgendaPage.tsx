import { useState, useEffect, useMemo } from 'react';
import { loadAllGames } from '../../adapters/firestore';
import { buildAgendaCrossGame } from '../../lib/aggregator/buildAgendaCrossGame';
import type { ParsedGame } from '../../lib/parser/types';
import { Kicker, Rule, FontScaleControls } from '../../shared';
import { FactionVotingPanel } from './FactionVotingPanel';
import { AgendaCard } from './AgendaCard';

const monoMicro = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 'var(--font-micro)',
} as const;

interface StatBoxProps {
  label: string;
  value: string;
}

function StatBox({ label, value }: StatBoxProps) {
  return (
    <div style={{ background: 'var(--paper-2)', padding: 8, border: '1px solid var(--ink-4)' }}>
      <div style={{ ...monoMicro, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--ink-3)' }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-subhead)', fontWeight: 800 }}>
        {value}
      </div>
    </div>
  );
}

export function AgendaPage() {
  const [games, setGames] = useState<ParsedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadAllGames()
      .then(g => {
        if (cancelled) return;
        setGames(g);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load games');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const summary = useMemo(() => buildAgendaCrossGame(games), [games]);

  const totalVpSwung = summary.agendas.reduce(
    (sum, a) => sum + Object.values(a.vpDeltaByFaction).reduce((s, v) => s + Math.abs(v), 0),
    0
  );

  if (loading) {
    return <div style={{ padding: 24, ...monoMicro }}>Loading…</div>;
  }
  if (error !== null) {
    return <div style={{ padding: 24, color: 'var(--accent)', ...monoMicro }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '3px double var(--rule)', paddingBottom: 8, marginBottom: 12 }}>
        <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-display-md)', fontStyle: 'italic' }}>
          The Senate Almanac
        </div>
        <FontScaleControls />
      </div>
      <Kicker text={`Cross-game agenda analytics · ${summary.gamesAnalyzed} games`} />

      {/* Definitions section (A8) */}
      <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-caption)', color: 'var(--ink-2)', lineHeight: 1.5, margin: '10px 0 14px' }}>
        A binary agenda resolves as For or Against. An elect agenda names a winner.
        Pass rate counts binary resolutions only — elect-type agendas show '—'.
        VP impact tracks points gained or lost per faction from agenda outcomes.
      </p>

      {/* Top stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        <StatBox
          label="Pass Rate"
          value={summary.overallPassRate !== null ? `${Math.round(summary.overallPassRate * 100)}%` : '—'}
        />
        <StatBox
          label="Agendas"
          value={String(summary.agendas.length)}
        />
        <StatBox
          label="Resolutions"
          value={String(summary.totalResolutions)}
        />
        <StatBox
          label="VP Swung"
          value={String(totalVpSwung)}
        />
      </div>

      {/* Faction voting matrix (A4) */}
      <FactionVotingPanel summary={summary} />

      <Rule weight="double" />

      {/* Per-agenda cards */}
      {summary.agendas.map((a, i) => (
        <div key={a.name}>
          <AgendaCard stat={a} />
          {i < summary.agendas.length - 1 && <Rule />}
        </div>
      ))}
    </div>
  );
}
