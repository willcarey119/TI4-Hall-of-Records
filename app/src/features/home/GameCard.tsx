import { useNavigate } from 'react-router-dom';
import type { ParsedGameSummary } from '../../adapters/firestore';
import { Kicker, FactionChip, formatGameTitle, formatKicker } from '../../shared';

interface GameCardProps {
  game: ParsedGameSummary;
}

export function GameCard({ game }: GameCardProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => { navigate(`/games/${game.gameId}`); }}
      style={{
        width: '100%',
        textAlign: 'left',
        border: '1px solid #d0cbc5',
        padding: '12px',
        background: 'var(--paper)',
        cursor: 'pointer',
        display: 'block',
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
