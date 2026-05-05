import { useNavigate } from 'react-router-dom';
import type { ParsedGameSummary } from '../../adapters/firestore';
import { Kicker, FactionChip, FactionDot, formatGameTitle, formatKicker } from '../../shared';

const PHASE_LABELS: Record<string, string> = {
  strategy: 'Strategy',
  action:   'Action',
  status:   'Status',
  agenda:   'Agenda',
};

interface GameCardProps {
  game: ParsedGameSummary;
  variant?: 'row' | 'tile' | 'ladder' | 'storyline';
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

export function GameCard({ game, variant = 'row', selected, onToggle }: GameCardProps) {
  const navigate = useNavigate();

  // --- tile variant ---
  if (variant === 'tile') {
    const sorted = [...game.factions].sort(
      (a, b) => (game.finalScores[b.factionId] ?? 0) - (game.finalScores[a.factionId] ?? 0)
    );
    const winner = sorted[0];
    const runnerUp = sorted[1];
    const dateStr = game.playedAt ? new Date(game.playedAt).toLocaleDateString() : '—';
    return (
      <button
        type="button"
        onClick={() => { navigate(`/games/${game.gameId}`); }}
        style={{ ...baseCardStyle, border: '1px solid var(--rule)', padding: '10px 14px' }}
      >
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)' }}>{dateStr}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 'var(--font-display-md)', color: 'var(--ink)' }}>{game.finalScores[winner?.factionId ?? ''] ?? '—'}</span>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 'var(--font-display-sm)', color: 'var(--ink-3)' }}>–{game.finalScores[runnerUp?.factionId ?? ''] ?? '—'}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' as const }}>
          {game.factions.map(f => (
            <FactionChip
              key={f.factionId}
              factionId={f.factionId}
              color={f.color}
              score={game.finalScores[f.factionId]}
              winner={f.factionId === game.winner}
            />
          ))}
        </div>
      </button>
    );
  }

  // --- ladder variant ---
  if (variant === 'ladder') {
    const sorted = [...game.factions].sort(
      (a, b) => (game.finalScores[b.factionId] ?? 0) - (game.finalScores[a.factionId] ?? 0)
    );
    return (
      <div style={{ border: '1px solid var(--rule)', padding: '8px 12px' }}>
        {sorted.map((f, i) => (
          <div key={f.factionId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', borderBottom: i < sorted.length - 1 ? '1px solid var(--rule)' : 'none' }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', width: 16, flexShrink: 0 }}>{i + 1}</span>
            <FactionDot color={f.color} size={10} />
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-sm)', flex: 1, color: f.factionId === game.winner ? 'var(--accent)' : 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{f.factionId}</span>
            <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 'var(--font-body)', color: 'var(--ink)' }}>{game.finalScores[f.factionId] ?? '—'}</span>
          </div>
        ))}
      </div>
    );
  }

  // --- storyline variant ---
  if (variant === 'storyline') {
    const sorted = [...game.factions].sort(
      (a, b) => (game.finalScores[b.factionId] ?? 0) - (game.finalScores[a.factionId] ?? 0)
    );
    const winnerVp = game.finalScores[sorted[0]?.factionId ?? ''] ?? 0;
    const runnerVp = game.finalScores[sorted[1]?.factionId ?? ''] ?? 0;
    const spread = winnerVp - runnerVp;
    const tag = spread <= 1 ? 'PHOTO FINISH' : spread >= 5 ? 'BLOWOUT' : 'CONTESTED';
    const tagColor = spread <= 1 ? 'var(--cool)' : spread >= 5 ? 'var(--accent)' : 'var(--ink-3)';
    const winnerFaction = sorted[0];
    const dateStr = game.playedAt ? new Date(game.playedAt).toLocaleDateString() : '—';
    return (
      <button
        type="button"
        onClick={() => { navigate(`/games/${game.gameId}`); }}
        style={{ ...baseCardStyle, border: '1px solid var(--rule)', padding: '10px 14px' }}
      >
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, color: tagColor, letterSpacing: '0.1em' }}>{tag}</div>
        <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontStyle: 'italic', fontSize: 'var(--font-display-sm)', color: 'var(--ink)', marginTop: 4 }}>
          {winnerFaction?.factionId ?? '—'} takes the throne
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' as const }}>
          {game.factions.map(f => (
            <FactionChip
              key={f.factionId}
              factionId={f.factionId}
              color={f.color}
              score={game.finalScores[f.factionId]}
              winner={f.factionId === game.winner}
            />
          ))}
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 6 }}>{dateStr}</div>
      </button>
    );
  }

  // --- row variant (default) ---

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
  const phaseLabel = game.lastPhase !== undefined ? PHASE_LABELS[game.lastPhase] : undefined;

  return (
    <button
      type="button"
      onClick={() => { navigate(`/games/${game.gameId}`); }}
      className="hover:bg-paper-2"
      style={{
        ...baseCardStyle,
        border: '1px solid var(--ink-4)',
        background: 'var(--paper)',
      }}
    >
      <Kicker text={formatKicker(game.playedAt, game.durationSeconds)}>
        {formatGameTitle(game.winner, game.finalScores)}
      </Kicker>
      {phaseLabel !== undefined && (
        <span
          style={{
            display: 'block',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            color: 'var(--ink-3)',
            marginTop: '2px',
          }}
        >
          Ended: {phaseLabel}
        </span>
      )}
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
