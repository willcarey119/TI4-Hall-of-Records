interface MastProps {
  title: string;
  subtitle: string;
}

export function Mast({ title, subtitle }: MastProps) {
  return (
    <div
      style={{
        borderTop: '3px double var(--rule)',
        borderBottom: '3px double var(--rule)',
        padding: '10px 0',
        marginBottom: '16px',
      }}
    >
      <h1
        className="font-display font-extrabold italic text-ink"
        style={{ fontSize: 'var(--font-display-md)', lineHeight: 1.05, margin: 0 }}
      >
        {title}
      </h1>
      <p
        className="font-mono text-ink-3"
        style={{
          fontSize: 'var(--font-micro)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginTop: '3px',
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}
