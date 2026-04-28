import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ParsedGame } from '../../lib/parser/types';
import { GameContext } from './GameContext';
import { FrozenHeader } from './FrozenHeader';
import { ScrollBody } from './ScrollBody';

export function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<ParsedGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('vp-race');

  useEffect(() => {
    if (gameId === undefined) return;

    let cancelled = false;

    import('../../adapters/firestore')
      .then(({ loadGame }) => loadGame(gameId))
      .then((g) => {
        if (!cancelled) {
          setGame(g);
          setLoading(false);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load game');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const missingGameId = gameId === undefined;

  if (loading) {
    return (
      <main
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '48px 16px',
        }}
      >
        <p
          className="font-mono text-ink-3"
          style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
        >
          Loading…
        </p>
      </main>
    );
  }

  if (missingGameId || error !== null) {
    const message = missingGameId ? 'No game ID in URL' : error;
    return (
      <main
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '48px 16px',
        }}
      >
        <p className="font-mono text-xs text-accent" style={{ marginBottom: '16px' }}>
          {message}
        </p>
        <button
          type="button"
          onClick={() => { navigate(-1); }}
          className="font-mono text-ink-3"
          style={{
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            textDecoration: 'underline',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ← Back to Archive
        </button>
      </main>
    );
  }

  return (
    <GameContext.Provider value={{ game: game!, loading: false, error: null }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: 'var(--paper)',
        }}
      >
        <FrozenHeader activeSection={activeSection} />
        <ScrollBody onSectionChange={setActiveSection} />
      </div>
    </GameContext.Provider>
  );
}
