import { useState, useEffect, useCallback } from 'react';
import type { ParsedGameSummary } from '../../adapters/firestore';
import { Mast, Rule, Label } from '../../shared';
import { UploadPage } from '../upload/UploadPage';
import { GameCard } from './GameCard';

export function HomePage() {
  const [games, setGames] = useState<ParsedGameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(() => {
    import('../../adapters/firestore')
      .then(({ listGames }) => listGames())
      .then((result) => {
        setGames(result);
        setError(null);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load archive');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return (
    <main
      style={{
        maxWidth: '640px',
        margin: '0 auto',
        padding: '48px 16px',
      }}
    >
      <Mast
        title="Hall of Records"
        subtitle="Twilight Imperium IV · Game Archive"
      />

      <div style={{ marginBottom: '16px' }}>
        <a
          href="/meta"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--accent)',
            textDecoration: 'none',
          }}
        >
          League Stats →
        </a>
      </div>

      {/* Upload section */}
      <section style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '8px' }}>
          <Label>File Dispatch</Label>
        </div>
        <UploadPage onSaved={() => { fetchGames(); }} />
      </section>

      <Rule weight="thick" />

      {/* Archive section */}
      <section style={{ marginTop: '24px' }}>
        <div style={{ marginBottom: '12px' }}>
          <Label>
            {loading
              ? 'Archive'
              : `Archive — ${games.length} game${games.length !== 1 ? 's' : ''}`}
          </Label>
        </div>

        {loading && (
          <p
            className="font-mono text-ink-3"
            style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            Loading…
          </p>
        )}

        {!loading && error !== null && (
          <p className="font-mono text-xs text-accent">{error}</p>
        )}

        {!loading && error === null && games.length === 0 && (
          <p className="font-mono text-xs text-ink-3">
            No games yet — upload one above.
          </p>
        )}

        {!loading && error === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {games.map((game) => (
              <GameCard key={game.gameId} game={game} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
