import { useState, useEffect, useCallback } from 'react';
import type { ParsedGameSummary } from '../../adapters/firestore';
import { Mast, Rule, Label } from '../../shared';
import { UploadPage } from '../upload/UploadPage';
import { GameCard } from './GameCard';

export function HomePage() {
  const [games, setGames] = useState<ParsedGameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { listGames } = await import('../../adapters/firestore');
      const result = await listGames();
      setGames(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load archive');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchGames();
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

      {/* Upload section */}
      <section style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '8px' }}>
          <Label>File Dispatch</Label>
        </div>
        <UploadPage onSaved={() => { void fetchGames(); }} />
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
