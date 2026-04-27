interface RuleProps {
  weight?: 'thin' | 'thick' | 'double';
}

export function Rule({ weight = 'thin' }: RuleProps) {
  const borderTop =
    weight === 'double'
      ? '3px double var(--rule)'
      : weight === 'thick'
        ? '2px solid var(--rule)'
        : '1px solid var(--rule)';

  return <hr style={{ border: 'none', margin: 0, borderTop }} />;
}
