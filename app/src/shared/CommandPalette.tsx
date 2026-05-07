import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ParsedGameSummary } from '../adapters/firestore';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [games, setGames] = useState<ParsedGameSummary[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'K' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  useEffect(() => {
    if (!open || games.length > 0) return;
    import('../adapters/firestore')
      .then(({ listGames }) => listGames().then(setGames))
      .catch(() => {});
  }, [open, games.length]);

  const matches = query.trim()
    ? games.filter(g =>
        g.factions.some(f => f.factionId.toLowerCase().includes(query.toLowerCase()))
      )
    : games.slice(0, 6);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'oklch(0.18 0.01 60 / 0.4)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 120,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--paper)', border: '2px solid var(--ink)',
          width: 480, maxHeight: 360, display: 'flex', flexDirection: 'column',
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Jump to game or faction…"
          style={{
            padding: '10px 14px',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 'var(--font-body)',
            border: 'none', borderBottom: '1px solid var(--rule)',
            background: 'transparent', outline: 'none', color: 'var(--ink)',
          }}
        />
        <div style={{ overflowY: 'auto' }}>
          {matches.map(g => (
            <button
              key={g.gameId}
              type="button"
              onClick={() => { navigate(`/games/${g.gameId}`); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 14px',
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 'var(--font-sm)',
                color: 'var(--ink)', background: 'none', border: 'none',
                borderBottom: '1px solid var(--rule)', cursor: 'pointer',
              }}
            >
              {g.winner ?? 'Game'} · {g.playedAt > 0 ? new Date(g.playedAt).toLocaleDateString() : '—'}
            </button>
          ))}
        </div>
        <div style={{
          padding: '4px 14px',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 'var(--font-micro)',
          color: 'var(--ink-4)',
          borderTop: '1px solid var(--rule)',
          textAlign: 'right' as const,
        }}>
          Ctrl+Shift+K · Esc to close
        </div>
      </div>
    </div>
  );
}
