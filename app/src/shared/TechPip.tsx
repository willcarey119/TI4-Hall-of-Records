import type { TechColor } from '../lib/parser/techs';

export const TECH_COLOR_VAR: Record<TechColor, string> = {
  green:  'var(--moss)',
  blue:   'var(--cool)',
  yellow: 'var(--gold)',
  red:    'var(--accent)',
  unit:   'var(--ink-2)',
};

interface Props {
  color: TechColor;
  size?: number;
}

export function TechPip({ color, size = 8 }: Props) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: TECH_COLOR_VAR[color],
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    />
  );
}
