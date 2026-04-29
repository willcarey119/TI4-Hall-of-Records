import { useState, useEffect, useCallback } from 'react';
import type { ParsedGameSummary } from '../../adapters/firestore';
import { useAuth } from '../../adapters/AuthContext';
import { Mast, Rule, Label } from '../../shared';
import { UploadPage } from '../upload/UploadPage';
import { GameCard } from './GameCard';

const monoSm: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
};

export function HomePage() {
  const { isAuthorized, signIn, signOut, authLoading } = useAuth();
  const [games, setGames] = useState<ParsedGameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection / delete state
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchGames = useCallback(() => {
    setLoading(true);
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
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 16px' }}>
      <Mast title="Hall of Records" subtitle="Twilight Imperium IV · Game Archive" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
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
        {/* Archivist sign-in control — unobtrusive but always reachable */}
        {!authLoading && (
          isAuthorized ? (
            <button
              type="button"
              onClick={() => { void signOut(); }}
              style={{ ...monoSm, color: 'var(--ink-4)' }}
            >
              Sign out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { void signIn(); }}
              style={{ ...monoSm, color: 'var(--ink-4)' }}
            >
              Archivist →
            </button>
          )
        )}
      </div>

      {/* Upload section — visible to authorized archivist only */}
      {isAuthorized && (
        <section style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '8px' }}>
            <Label>File Dispatch</Label>
          </div>
          <UploadPage onSaved={() => { fetchGames(); }} />
        </section>
      )}

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
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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

        {loading && (
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)' }}>
            Loading…
          </p>
        )}

        {!loading && error !== null && (
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--accent)' }}>{error}</p>
        )}

        {!loading && error === null && games.length === 0 && (
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-3)' }}>
            No games yet — upload one above.
          </p>
        )}

        {!loading && error === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {games.map((game) => (
              <GameCard
                key={game.gameId}
                game={game}
                {...(selectMode
                  ? { selected: selected.has(game.gameId), onToggle: () => { toggleSelect(game.gameId); } }
                  : {})}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
