import { useFontScale } from './useFontScale';

export function FontScaleControls() {
  const { atMin, atMax, up, down } = useFontScale();

  return (
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2, paddingRight: 4 }}>
      <button
        type="button"
        onClick={down}
        disabled={atMin}
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '9px',
          border: '1px solid var(--ink-4)',
          background: 'none',
          cursor: atMin ? 'default' : 'pointer',
          color: atMin ? 'var(--ink-4)' : 'var(--ink-3)',
          padding: '2px 5px',
          lineHeight: 1,
        }}
      >
        A–
      </button>
      <button
        type="button"
        onClick={up}
        disabled={atMax}
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '11px',
          border: '1px solid var(--ink-4)',
          background: 'none',
          cursor: atMax ? 'default' : 'pointer',
          color: atMax ? 'var(--ink-4)' : 'var(--ink-3)',
          padding: '2px 5px',
          lineHeight: 1,
        }}
      >
        A+
      </button>
    </div>
  );
}
