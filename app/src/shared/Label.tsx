import type { ReactNode } from 'react';

interface LabelProps {
  children: ReactNode;
}

export function Label({ children }: LabelProps) {
  return (
    <span
      className="font-mono uppercase tracking-widest text-ink-3"
      style={{ fontSize: 'var(--font-micro)' }}
    >
      {children}
    </span>
  );
}
