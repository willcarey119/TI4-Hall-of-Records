import type { ReactNode } from 'react';

interface KickerProps {
  text: string;
  children?: ReactNode;
}

export function Kicker({ text, children }: KickerProps) {
  return (
    <div>
      <span
        className="font-mono text-accent"
        style={{
          fontSize: 'var(--font-micro)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          borderBottom: '1px solid var(--accent)',
          paddingBottom: '1px',
          display: 'inline-block',
        }}
      >
        {text}
      </span>
      {children !== undefined && (
        <div
          className="font-display font-extrabold italic text-ink"
          style={{ fontSize: 'var(--font-display-sm)', lineHeight: 1.1, marginTop: '4px' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
