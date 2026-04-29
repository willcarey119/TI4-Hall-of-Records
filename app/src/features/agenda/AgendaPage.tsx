import { useState, useEffect, useMemo } from 'react';
import { loadAllGames } from '../../adapters/firestore';
import { buildAgendaStats } from '../../lib/aggregator';
import type { ParsedGame } from '../../lib/parser/types';
import { Kicker, Rule } from '../../shared';

export function AgendaPage() {
  const [games, setGames] = useState<ParsedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllGames()
      .then(g => { setGames(g); setLoading(false); })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load games');
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => buildAgendaStats(games), [games]);

  if (loading) {
    return <div style={{ padding: 24, fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}>Loading…</div>;
  }
  if (error !== null) {
    return <div style={{ padding: 24, color: 'var(--accent)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px' }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 48px' }}>
      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 28, fontStyle: 'italic', borderBottom: '3px double var(--rule)', paddingBottom: 8, marginBottom: 12 }}>
        The Senate Almanac
      </div>
      <Kicker>Agenda Analytics · {stats.gamesAnalyzed} games · {stats.totalResolutions} resolutions</Kicker>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, margin: '12px 0' }}>
        <div>
          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 32, lineHeight: 1 }}>
            {Math.round(stats.overallPassRate * 100)}%
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-3)', marginTop: 2 }}>overall pass rate</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 32, lineHeight: 1 }}>
            {stats.agendas.length}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-3)', marginTop: 2 }}>distinct agendas</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 32, lineHeight: 1 }}>
            {stats.totalResolutions > 0 ? (stats.totalResolutions / stats.gamesAnalyzed).toFixed(1) : '—'}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-3)', marginTop: 2 }}>avg per game</div>
        </div>
      </div>

      <Rule weight="double" />

      {stats.agendas.map(agenda => (
        <div key={agenda.name} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 14 }}>
              {agenda.name}
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-3)' }}>
              {agenda.appearances}× · {Math.round(agenda.passRate * 100)}% pass
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--paper-2)', marginTop: 3, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${agenda.passRate * 100}%`, background: 'var(--accent)', borderRadius: 2 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
