import { useNavigate } from 'react-router-dom';
import type { ParsedGameSummary } from '../../adapters/firestore';
import { Kicker, FactionChip, formatGameTitle, formatKicker } from '../../shared';

interface GameCardProps {
  game: ParsedGameSummary;
  /** When provided, the card renders in selection mode — clicking toggles instead of navigating. */
  selected?: boolean;
  onToggle?: () => void;
}

const baseCardStyle: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  padding: '12px',
  cursor: 'pointer',
  display: 'block',
};

export function GameCard({ game, selected, onToggle }: GameCardProps) {
  const navigate = useNavigate();

  if (onToggle !== undefined) {
    // Selection mode: clicking toggles; visual checkbox replaces navigation affordance.
    return (
      <button
        type="button"
        onClick={onToggle}
        style={{
          ...baseCardStyle,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          border: `1px solid ${selected === true ? 'var(--accent)' : 'var(--ink-4)'}`,
          background: selected === true ? 'var(--paper-2)' : 'var(--paper)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            flexShrink: 0,
            color: selected === true ? 'var(--accent)' : 'var(--ink-3)',
            lineHeight: 1.4,
            userSelect: 'none',
          }}
        >
          {selected === true ? '[×]' : '[ ]'}
        </span>
        <div style={{ flex: 1 }}>
          <Kicker text={formatKicker(game.playedAt, game.durationSeconds)}>
            {formatGameTitle(game.winner, game.finalScores)}
          </Kicker>
          <div style={{ marginTop: '8px' }}>
            {game.factions.map((f) => (
              <FactionChip
                key={f.factionId}
                factionId={f.factionId}
                color={f.color}
                score={game.finalScores[f.factionId] ?? 0}
                winner={f.factionId === game.winner}
              />
            ))}
          </div>
        </div>
      </button>
    );
  }

  // Default mode: clicking navigates to game detail.
  return (
    <button
      type="button"
      onClick={() => { navigate(`/games/${game.gameId}`); }}
      style={{
        ...baseCardStyle,
        border: '1px solid var(--ink-4)',
        background: 'var(--paper)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper-2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper)';
      }}
    >
      <Kicker text={formatKicker(game.playedAt, game.durationSeconds)}>
        {formatGameTitle(game.winner, game.finalScores)}
      </Kicker>
      <div style={{ marginTop: '8px' }}>
        {game.factions.map((f) => (
          <FactionChip
            key={f.factionId}
            factionId={f.factionId}
            color={f.color}
            score={game.finalScores[f.factionId] ?? 0}
            winner={f.factionId === game.winner}
          />
        ))}
      </div>
    </button>
  );
}
