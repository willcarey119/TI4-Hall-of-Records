export function EmptyState() {
  return (
    <div style={{ padding: '32px 16px', textAlign: 'center' as const, borderTop: '1px solid var(--rule)' }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, color: 'var(--accent)', letterSpacing: '0.14em' }}>Vol. 0 · No. 0</div>
      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontStyle: 'italic', fontSize: 'var(--font-display-sm)', color: 'var(--ink)', marginTop: 6 }}>
        The presses await ink.
      </div>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-body)', color: 'var(--ink-2)', marginTop: 6 }}>
        No games uploaded yet. Drop a TI Assistant export below to begin.
      </div>
      <div style={{ margin: '16px auto', width: 220, height: 80, border: '2px dashed var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center' as const }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', textTransform: 'uppercase' as const }}>Drop JSON here</span>
      </div>
    </div>
  );
}
