import type { CSSProperties } from 'react';

interface Props {
  color: string;
  size?: number;
  style?: CSSProperties;
}

export function FactionDot({ color, size = 7, style }: Props) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
}
