import { useState, useEffect, useMemo } from 'react';
import { loadAllGames } from '../../adapters/firestore';
import { buildAgendaCrossGame } from '../../lib/aggregator/buildAgendaCrossGame';
import type { ParsedGame } from '../../lib/parser/types';
import { Kicker, Rule, FontScaleControls, SectionDesc, Tooltip } from '../../shared';
import { FactionVotingPanel } from './FactionVotingPanel';
import { AgendaCard } from './AgendaCard';
import { PoliticalBarChart } from './PoliticalBarChart';

const monoMicro = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 'var(--font-micro)',
} as const;

interface StatBoxProps {
  label: string;
  value: string;
  tooltip?: string;
}

function StatBox({ label, value, tooltip }: StatBoxProps) {
  return (
    <div style={{ background: 'var(--paper-2)', padding: 8, border: '1px solid var(--ink-4)' }}>
      <div style={{ ...monoMicro, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--ink-3)', display: 'flex', alignItems: 'center' }}>
        {label}
        {tooltip !== undefined && <Tooltip text={tooltip} />}
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
    <div style={{ height: '100%', overflowY: 'auto' }}>
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '3px double var(--rule)', paddingBottom: 8, marginBottom: 12 }}>
        <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-display-md)', fontStyle: 'italic' }}>
          The Senate Almanac
        </div>
        <FontScaleControls />
      </div>
      <Kicker text={`Cross-game agenda analytics · ${summary.gamesAnalyzed} games`} />

      <SectionDesc>
        Every political agenda voted on across all recorded sessions, aggregated by outcome and VP impact. Each round of TI4 ends with a Galactic Senate phase where players vote on laws and directives — this page tracks how those votes went.
      </SectionDesc>

      {/* Definitions section (A8) */}
      <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-caption)', color: 'var(--ink-2)', lineHeight: 1.5, margin: '0 0 14px' }}>
        A <strong>binary agenda</strong> resolves as For or Against (law or directive).
        An <strong>elect agenda</strong> names a specific winner (a faction, planet, or player).
        Pass rate applies to binary agendas only — elect-type agendas show '—'.
        VP impact tracks points gained or lost per faction as a direct result of agenda outcomes.
      </p>

      {/* Top stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        <StatBox
          label="Pass Rate"
          value={summary.overallPassRate !== null ? `${Math.round(summary.overallPassRate * 100)}%` : '—'}
          tooltip="How often binary agendas pass (For wins). Elect-type agendas are excluded."
        />
        <StatBox
          label="Agendas"
          value={String(summary.agendas.length)}
          tooltip="Distinct agenda cards that have been resolved at least once across all sessions."
        />
        <StatBox
          label="Resolutions"
          value={String(summary.totalResolutions)}
          tooltip="Total number of agenda votes resolved across all games and all rounds."
        />
        <StatBox
          label="VP Swung"
          value={String(totalVpSwung)}
          tooltip="Total victory points transferred between factions as a direct result of agenda outcomes."
        />
      </div>

      {/* Political bar chart — cross-game vote split per agenda */}
      <PoliticalBarChart agendas={summary.agendas} />

      <Rule weight="double" />

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
    </div>
  );
}
