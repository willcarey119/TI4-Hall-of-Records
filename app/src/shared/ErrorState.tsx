import React from 'react';

interface Props { message: string; detail?: string; onRetry?: () => void; }

export function ErrorState({ message, detail, onRetry }: Props) {
  return (
    <div style={{ padding: '16px', border: '1px solid var(--accent)' }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, color: 'var(--accent)', letterSpacing: '0.14em' }}>Stop the press</div>
      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontStyle: 'italic', fontSize: 'var(--font-display-sm)', color: 'var(--accent)', marginTop: 4 }}>
        {message}
      </div>
      {detail && (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-2)', marginTop: 8, padding: 8, background: 'var(--paper-2)', whiteSpace: 'pre-wrap' as const, wordBreak: 'break-all' as const }}>
          {detail}
        </div>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{ marginTop: 10, padding: '4px 12px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
