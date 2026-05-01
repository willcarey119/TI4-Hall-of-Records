interface SectionDescProps {
  children: React.ReactNode;
}

export function SectionDesc({ children }: SectionDescProps) {
  return (
    <p
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: 'var(--font-caption, var(--font-sm))',
        color: 'var(--ink-3)',
        lineHeight: 1.6,
        margin: '6px 0 16px',
        fontStyle: 'italic',
      }}
    >
      {children}
    </p>
  );
}
