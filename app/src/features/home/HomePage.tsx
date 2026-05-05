import { useState, useEffect, useCallback } from 'react';
import type { ParsedGameSummary } from '../../adapters/firestore';
import { useAuth } from '../../adapters/AuthContext';
import { Rule, Label, LoadingSkeleton, ErrorState, EmptyState } from '../../shared';
import { GameCard } from './GameCard';

const monoSm: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 'var(--font-micro)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
};

export function HomePage() {
  const { isAuthorized } = useAuth();
  const [games, setGames] = useState<ParsedGameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection / delete state
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  function toggleSelect(gameId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) next.delete(gameId);
      else next.add(gameId);
      return next;
    });
  }

  function enterSelectMode() {
    setSelectMode(true);
    setSelected(new Set());
    setConfirmDelete(false);
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
    setConfirmDelete(false);
  }

  async function handleDelete() {
    if (selected.size === 0) return;
    setDeleting(true);
    setError(null);
    try {
      const { deleteGames } = await import('../../adapters/firestore');
      await deleteGames([...selected]);
      exitSelectMode();
      fetchGames();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  const n = selected.size;
  const archiveLabel = selectMode
    ? n > 0
      ? `${n} of ${games.length} selected`
      : 'Select games to remove'
    : loading
      ? 'Archive'
      : `Archive — ${games.length} game${games.length !== 1 ? 's' : ''}`;

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
    <main style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 16px 64px' }}>

      {/* Welcome blurb — visible to all visitors */}
      <section style={{ marginBottom: '28px' }}>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 'var(--font-body)',
            color: 'var(--ink-2)',
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          This is the Hall of Records for a private Twilight Imperium IV playgroup.
          Every session is parsed from{' '}
          <a
            href="https://ti-assistant.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}
          >
            TI Assistant
          </a>{' '}
          exports and stored here for replay analysis and cross-game statistics.
          Click any game below to explore its full detail — VP trajectory, timeline of events,
          faction dossiers, planet control, tech research, and agenda votes.
          Visit{' '}
          <a href="/meta" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            League Stats
          </a>{' '}
          for aggregate faction, strategy card, and tech data across all sessions.
          Visit{' '}
          <a href="/agenda" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Senate Almanac
          </a>{' '}
          for cross-game agenda analytics — pass rates, faction voting patterns, and VP impact of each law.
        </p>
      </section>

      <Rule weight="thick" />

      {/* Archive section */}
      <section style={{ marginTop: '24px' }}>
        {/* Archive header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
          <Label>{archiveLabel}</Label>
          {!loading && games.length > 0 && isAuthorized && (
            selectMode ? (
              <button
                type="button"
                onClick={exitSelectMode}
                style={{ ...monoSm, color: 'var(--ink-3)' }}
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={enterSelectMode}
                style={{ ...monoSm, color: 'var(--ink-3)' }}
              >
                Manage
              </button>
            )
          )}
        </div>

        {/* Delete controls (shown in select mode when ≥1 selected) */}
        {selectMode && n > 0 && (
          <div style={{ marginBottom: '12px' }}>
            {confirmDelete ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Remove {n} game{n !== 1 ? 's' : ''} permanently?
                </span>
                <button
                  type="button"
                  onClick={() => { void handleDelete(); }}
                  disabled={deleting}
                  style={{ ...monoSm, color: 'var(--accent)' }}
                >
                  {deleting ? 'Removing…' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => { setConfirmDelete(false); }}
                  disabled={deleting}
                  style={{ ...monoSm, color: 'var(--ink-3)' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setConfirmDelete(true); }}
                style={{ ...monoSm, color: 'var(--accent)' }}
              >
                Delete {n} game{n !== 1 ? 's' : ''} →
              </button>
            )}
          </div>
        )}

        {loading && <LoadingSkeleton rows={4} />}

        {!loading && error !== null && (
          <ErrorState
            message={error}
            onRetry={fetchGames}
          />
        )}

        {!loading && error === null && games.length === 0 && <EmptyState />}

        {!loading && error === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {games.map((game, idx) => (
              <GameCard
                key={game.gameId}
                game={game}
                variant={!selectMode && idx === 0 ? 'storyline' : 'row'}
                {...(selectMode
                  ? { selected: selected.has(game.gameId), onToggle: () => { toggleSelect(game.gameId); } }
                  : {})}
              />
            ))}
          </div>
        )}
      </section>
    </main>
    </div>
  );
}
