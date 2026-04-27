interface FactionChipProps {
  factionId: string;
  color: string;
  score?: number;
  winner?: boolean;
}

export function FactionChip({
  factionId,
  color,
  score,
  winner = false,
}: FactionChipProps) {
  return (
    <span
      className="font-mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '10px',
        border: `1px solid ${winner ? 'var(--accent)' : '#ccc'}`,
        padding: '2px 6px',
        margin: '2px',
        color: winner ? 'var(--accent)' : 'var(--ink)',
        fontWeight: winner ? 600 : 400,
        background: 'var(--paper)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      {factionId}
      {score !== undefined && (
        <>{winner ? ` ✦${score}` : ` ${score}`}</>
      )}
    </span>
  );
}
