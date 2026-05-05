import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ParsedGameSummary } from '../../adapters/firestore';

interface CompareLauncherProps {
  games: ParsedGameSummary[];
}

function optionLabel(g: ParsedGameSummary): string {
  const dateStr = g.playedAt ? new Date(g.playedAt).toLocaleDateString() : '—';
  const winner = g.winner ?? 'No winner';
  return `${dateStr} — ${winner}`;
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 'var(--font-micro)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--ink-3)',
  display: 'block',
  marginBottom: 4,
};

const selectStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Sans', sans-serif",
  fontSize: 'var(--font-body)',
  width: '100%',
  padding: '6px 8px',
  border: '1px solid var(--rule)',
  background: 'var(--paper)',
  color: 'var(--ink)',
};

const buttonStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 'var(--font-micro)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  padding: '8px 14px',
  border: '1px solid var(--accent)',
  background: 'transparent',
  color: 'var(--accent)',
  cursor: 'pointer',
};

const buttonDisabledStyle: React.CSSProperties = {
  ...buttonStyle,
  opacity: 0.4,
  cursor: 'not-allowed',
};

export function CompareLauncher({ games }: CompareLauncherProps) {
  const navigate = useNavigate();
  const defaultA = games[0]?.gameId ?? '';
  const defaultB = games[1]?.gameId ?? '';
  const [a, setA] = useState(defaultA);
  const [b, setB] = useState(defaultB);

  const sameSelected = a === b;

  function handleCompare() {
    if (sameSelected) return;
    if (a === '' || b === '') return;
    navigate(`/compare/${encodeURIComponent(a)}/${encodeURIComponent(b)}`);
  }

  return (
    <div
      style={{
        border: '1px solid var(--rule)',
        padding: '12px 14px',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label htmlFor="compare-a" style={labelStyle}>
            Game A
          </label>
          <select
            id="compare-a"
            value={a}
            onChange={(e) => { setA(e.target.value); }}
            style={selectStyle}
          >
            {games.map((g) => (
              <option key={g.gameId} value={g.gameId}>
                {optionLabel(g)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="compare-b" style={labelStyle}>
            Game B
          </label>
          <select
            id="compare-b"
            value={b}
            onChange={(e) => { setB(e.target.value); }}
            style={selectStyle}
          >
            {games.map((g) => (
              <option key={g.gameId} value={g.gameId}>
                {optionLabel(g)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {sameSelected && (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
              color: 'var(--ink-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Pick two different games
          </span>
        )}
        <button
          type="button"
          onClick={handleCompare}
          disabled={sameSelected}
          style={sameSelected ? buttonDisabledStyle : buttonStyle}
        >
          Compare →
        </button>
      </div>
    </div>
  );
}
