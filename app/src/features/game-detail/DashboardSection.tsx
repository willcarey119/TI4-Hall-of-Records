import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildDashboardSummary } from '../../lib/dashboard/buildDashboardSummary';
import type { FactionDashboard } from '../../lib/dashboard/buildDashboardSummary';
import { Label, Rule, FactionDot, TechPip, SectionDesc } from '../../shared';

function FactionCard({ fd }: { fd: FactionDashboard }) {
  return (
    <div>
      {/* Faction header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '5px 0 3px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <FactionDot color={fd.color} />
          <span
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontWeight: 700,
              fontSize: 'var(--font-sm)',
              color: fd.isWinner ? 'var(--accent)' : 'var(--ink)',
            }}
          >
            {fd.factionId}
          </span>
          {fd.isWinner && (
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 'var(--font-micro)',
                background: 'var(--accent)',
                color: 'var(--paper)',
                padding: '0 3px',
                lineHeight: '11px',
                display: 'inline-block',
                height: 11,
              }}
            >
              WINNER
            </span>
          )}
        </div>
        <span
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontWeight: 800,
            fontSize: 'var(--font-subhead)',
            color: fd.isWinner ? 'var(--accent)' : 'var(--ink)',
          }}
        >
          {fd.finalVp}{' '}
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
              color: 'var(--ink-3)',
              fontWeight: 400,
            }}
          >
            VP
          </span>
        </span>
      </div>

      {/* Objectives scored */}
      {fd.objectivesScored.length > 0 && (
        <div style={{ marginBottom: 4 }}>
          <Label>Objectives</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 4px', marginTop: 2 }}>
            {fd.objectivesScored.map((obj, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 'var(--font-micro)',
                  border: `1px solid ${obj.points >= 2 ? 'var(--ink)' : 'var(--ink-4)'}`,
                  background: obj.points >= 2 ? 'var(--ink)' : 'var(--paper-2)',
                  color: obj.points >= 2 ? 'var(--paper)' : 'var(--ink-2)',
                  padding: '0 3px',
                  lineHeight: '13px',
                  display: 'inline-block',
                }}
              >
                {obj.objective}{obj.points > 1 ? ` +${obj.points}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Techs */}
      {(fd.techsResearched.length > 0 || fd.startingTechs.length > 0) && (
        <div style={{ marginBottom: 4 }}>
          <Label>Techs</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px', marginTop: 2 }}>
            {fd.startingTechs.map((t, i) => (
              <span key={`s${i}`} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 'var(--font-micro)' }}>
                <TechPip color={t.color} size={6} />
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", color: 'var(--ink-3)', fontStyle: 'italic' }}>
                  {t.tech}
                </span>
              </span>
            ))}
            {fd.techsResearched.map((t, i) => (
              <span key={`r${i}`} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 'var(--font-micro)' }}>
                <TechPip color={t.color} size={6} />
                <span style={{ fontFamily: "'Newsreader', Georgia, serif" }}>{t.tech}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Planet count */}
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-sm)', color: 'var(--ink-3)' }}>
        {fd.planetsControlled} planet{fd.planetsControlled !== 1 ? 's' : ''} at game end
      </div>
    </div>
  );
}

export function DashboardSection() {
  const { game } = useGame();

  const summary = useMemo(
    () =>
      game !== null
        ? buildDashboardSummary(
            game.vpEvents,
            game.planetEvents,
            game.techEvents,
            game.factions,
            game.finalScores,
            game.options,
          )
        : null,
    [game],
  );

  return (
    <section
      id="dashboard"
      data-section="dashboard"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      {summary !== null && game !== null && (
        <>
          {/* Kicker */}
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-sm)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--ink-3)',
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--rule)',
              paddingBottom: 3,
              marginBottom: 6,
            }}
          >
            <span>Player Dossiers · This Game</span>
            <span>{summary.factions.length} factions · {summary.totalVpAwarded} VP total</span>
          </div>

          {/* Headline */}
          <div
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: 'var(--font-display-sm)',
              fontWeight: 800,
              fontStyle: 'italic',
              lineHeight: 1.1,
              margin: '4px 0 2px',
            }}
          >
            The final standings.
          </div>

          {/* Deck */}
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
            {summary.winner !== null
              ? `${summary.winner} claimed victory.`
              : `No faction reached the victory threshold.`}
          </div>

          <SectionDesc>
            Per-faction snapshot of this game: objectives scored, technologies researched, and planet holdings at game end. Starting techs are shown in grey; techs acquired during play are in full color.
          </SectionDesc>

          {/* Tech pip key */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 6, flexWrap: 'wrap', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)' }}>
            {([
              { color: 'blue',   label: 'Propulsion' },
              { color: 'red',    label: 'Warfare' },
              { color: 'yellow', label: 'Cybernetic' },
              { color: 'green',  label: 'Biotic' },
            ] as const).map(({ color, label }) => (
              <span key={color} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <TechPip color={color} size={6} />
                {label}
              </span>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '3px double var(--rule)', margin: '6px 0' }} />

          {/* Faction cards */}
          {summary.factions.map((fd, i, arr) => (
            <div key={fd.factionId}>
              <FactionCard fd={fd} />
              {i < arr.length - 1 && <Rule />}
            </div>
          ))}
        </>
      )}
    </section>
  );
}
