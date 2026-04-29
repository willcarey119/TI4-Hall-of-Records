import { useNavigate } from 'react-router-dom';
import { Kicker, FactionChip, Rule, formatKicker, formatGameTitle, useFontScale } from '../../shared';
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
  const { scale, atMin, atMax, up, down } = useFontScale();

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
            fontSize: '9px',
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
              fontSize: 'calc(9px * var(--font-scale))',
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
        {/* Font scale controls */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2, paddingRight: 4 }}>
          <button
            type="button"
            onClick={down}
            disabled={atMin}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '9px',
              border: '1px solid var(--ink-4)',
              background: 'none',
              cursor: atMin ? 'default' : 'pointer',
              color: atMin ? 'var(--ink-4)' : 'var(--ink-3)',
              padding: '2px 5px',
              lineHeight: 1,
            }}
          >
            A–
          </button>
          <button
            type="button"
            onClick={up}
            disabled={atMax}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '11px',
              border: '1px solid var(--ink-4)',
              background: 'none',
              cursor: atMax ? 'default' : 'pointer',
              color: atMax ? 'var(--ink-4)' : 'var(--ink-3)',
              padding: '2px 5px',
              lineHeight: 1,
            }}
          >
            A+
          </button>
        </div>
      </nav>
    </div>
  );
}
