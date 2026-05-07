import { Link } from 'react-router-dom';
import { Kicker, FactionChip, Rule, formatKicker, formatGameTitle, FontScaleControls } from '../../shared';
import { useGame } from './GameContext';
import { useRoundFilter } from './RoundFilterContext';
import { deriveRoundBoundaries } from '../../lib/aggregator';
import { buildGameCsv } from '../../lib/csv/buildGameCsv';
import { downloadCsv } from '../../lib/csv/downloadCsv';

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
  const { game } = useGame();
  const { scrubRound, setScrubRound } = useRoundFilter();

  if (game === null) return null;

  const totalRounds = game.phaseSnapshots.length > 0
    ? Math.max(...game.phaseSnapshots.map(s => s.round))
    : 0;

  return (
    <div
      style={{
        background: 'var(--paper)',
        borderBottom: '2px solid var(--rule)',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
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
        {totalRounds > 0 && (
          <div style={{ display: 'flex', gap: 2, padding: '4px 0', flexWrap: 'wrap' }}>
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => { setScrubRound(r === scrubRound ? null : r); }}
                style={{
                  padding: '2px 8px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 'var(--font-micro)',
                  background: scrubRound === r ? 'var(--ink)' : 'var(--paper-2)',
                  color: scrubRound === r ? 'var(--paper)' : 'var(--ink-3)',
                  border: '1px solid var(--rule)',
                  cursor: 'pointer',
                }}
              >
                R{r}
              </button>
            ))}
          </div>
        )}
        {scrubRound !== null && (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
            Showing through round {scrubRound} · click R{scrubRound} again for full game
          </div>
        )}
        <div style={{ marginTop: '8px' }}>
          <Rule weight="double" />
        </div>
      </div>

      {/* Nav bar */}
      <nav style={{ display: 'flex', overflowX: 'auto', padding: '0 12px' }}>
        {/* Back to archive */}
        <Link
          to="/"
          aria-label="Archive"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '7px 12px 7px 4px',
            color: 'var(--ink-4)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            borderBottom: '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          ← Archive
        </Link>
        <span style={{ color: 'var(--ink-4)', padding: '7px 0', fontSize: 'var(--font-micro)' }}>·</span>
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
        <button
          type="button"
          onClick={() => {
            const bounds = deriveRoundBoundaries(game.strategyCardEvents, game.factions.length);
            const date = new Date(game.playedAt).toISOString().slice(0, 10);
            downloadCsv(`${date}-${game.gameId.slice(0, 8)}.csv`, buildGameCsv(game, bounds));
          }}
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '7px 10px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            color: 'var(--ink-4)',
            borderBottom: '2px solid transparent',
          }}
          title="Download round-by-round VP as CSV"
        >
          ↓ CSV
        </button>
      </nav>
    </div>
  );
}
