import { useNavigate } from 'react-router-dom';
import { Kicker, FactionChip, Rule, formatKicker, formatGameTitle, FontScaleControls } from '../../shared';
import { useGame } from './GameContext';

function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

const SECTIONS = [
  { id: 'recap',     label: 'Recap' },
  { id: 'vp-race',   label: 'VP Race' },
  { id: 'timeline',  label: 'Timeline' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'planets',   label: 'Planets' },
  { id: 'tech',      label: 'Tech' },
  { id: 'agenda',    label: 'Agenda' },
] as const;

interface FrozenHeaderProps {
  activeSection: string;
}

export function FrozenHeader({ activeSection }: FrozenHeaderProps) {
  const navigate = useNavigate();
  const { game } = useGame();

  if (game === null) return null;

  return (
    <div
      style={{
        background: 'var(--paper)',
        borderBottom: '2px solid var(--rule)',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Back link */}
      <div style={{ padding: '10px 16px 4px' }}>
        <button
          type="button"
          onClick={() => { navigate(-1); }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--ink-3)',
            padding: 0,
          }}
        >
          ← Archive
        </button>
      </div>

      {/* Masthead */}
      <div style={{ padding: '0 16px 8px' }}>
        <Rule weight="double" />
        <div style={{ paddingTop: '8px' }}>
          <Kicker text={formatKicker(game.playedAt, game.durationSeconds)}>
            {formatGameTitle(game.winner, game.finalScores)}
          </Kicker>
          <div style={{ marginTop: '6px' }}>
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
        <div style={{ marginTop: '8px' }}>
          <Rule weight="double" />
        </div>
      </div>

      {/* Nav bar */}
      <nav style={{ display: 'flex', overflowX: 'auto', padding: '0 12px' }}>
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => { scrollToSection(id); }}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '7px 12px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              color: activeSection === id ? 'var(--ink)' : 'var(--ink-3)',
              borderBottom:
                activeSection === id
                  ? '2px solid var(--ink)'
                  : '2px solid transparent',
              fontWeight: activeSection === id ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
        <FontScaleControls />
      </nav>
    </div>
  );
}
