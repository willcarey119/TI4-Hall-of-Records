interface TooltipProps {
  text: string;
}

export function Tooltip({ text }: TooltipProps) {
  return (
    <span
      title={text}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1.1em',
        height: '1.1em',
        borderRadius: '50%',
        border: '1px solid var(--ink-4)',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.75em',
        color: 'var(--ink-4)',
        cursor: 'help',
        flexShrink: 0,
        marginLeft: '0.3em',
        verticalAlign: 'middle',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      ?
    </span>
  );
}
