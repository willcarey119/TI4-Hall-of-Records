// app/src/features/game-detail/TechSection.tsx
import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildTechSummary } from '../../lib/tech/buildTechSummary';
import type { TechColor } from '../../lib/parser/techs';
import { Label, Rule } from '../../shared';

const COLOR_VAR: Record<TechColor, string> = {
  green:  'var(--moss)',
  blue:   'var(--cool)',
  yellow: 'var(--gold)',
  red:    'var(--accent)',
  unit:   'var(--ink-2)',
};

function TechPip({ color }: { color: TechColor }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: COLOR_VAR[color],
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    />
  );
}

function FactionDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    />
  );
}

export function TechSection() {
  const { game } = useGame();

  const summary = useMemo(
    () =>
      game
        ? buildTechSummary(game.techEvents, game.factions, game.phaseSnapshots)
        : null,
    [game],
  );

  if (game === null || summary === null) return null;

  const factionColorMap: Record<string, string> = {};
  for (const f of game.factions) {
    factionColorMap[f.factionId] = f.color;
  }

  return (
    <section
      id="tech"
      data-section="tech"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      {/* Kicker */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
          borderBottom: '1px solid var(--ink-4)',
          paddingBottom: 3,
          marginBottom: 6,
        }}
      >
        <span>Technology · This Game</span>
        <span>{summary.totalResearched} researched</span>
      </div>

      {/* Headline + Deck */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 17,
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 2,
        }}
      >
        The arms race.
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
        {summary.deckText}
      </div>

      <Rule weight="double" />

      {/* Research Order */}
      <Label>Research Order</Label>
      <div
        style={{
          borderLeft: '2px solid var(--cool)',
          paddingLeft: 8,
          marginBottom: 8,
        }}
      >
        {summary.timeline.length === 0 ? (
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              color: 'var(--ink-3)',
              padding: '4px 0',
            }}
          >
            No technologies researched.
          </div>
        ) : (
          summary.timeline.map((entry, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr 8px',
                gap: 4,
                alignItems: 'center',
                padding: '2px 0',
                borderBottom: '1px dotted var(--ink-4)',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
              }}
            >
              <span style={{ color: 'var(--ink-3)' }}>
                {entry.round === 0 ? '—' : `R${entry.round}`}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Newsreader', Georgia, serif", fontSize: 10 }}>
                <FactionDot color={factionColorMap[entry.factionId] ?? '#aaa'} />
                {entry.tech}
              </span>
              <TechPip color={entry.color} />
            </div>
          ))
        )}
      </div>

      <Rule />

      {/* Final Inventories */}
      <Label>Final Inventories</Label>
      {summary.inventories
        .filter((inv) => {
          const faction = game.factions.find(f => f.factionId === inv.factionId);
          return faction !== undefined && inv.techs.length > 0;
        })
        .map((inv, i, arr) => {
          const faction = game.factions.find(f => f.factionId === inv.factionId)!;
          return (
            <div key={inv.factionId}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 5,
                  margin: '5px 0 2px',
                }}
              >
                <FactionDot color={faction.color} />
                <span
                  style={{
                    fontFamily: "'Newsreader', Georgia, serif",
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                >
                  {faction.factionId}
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 8,
                    color: 'var(--ink-3)',
                    marginLeft: 'auto',
                  }}
                >
                  {inv.techs.length} tech{inv.techs.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6, fontSize: 10 }}>
                {inv.techs.map((t, j) => (
                  <span key={j} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <TechPip color={t.color} />
                    {t.tech}
                    {t.origin === 'starting' && (
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 7,
                          border: '1px solid var(--cool)',
                          color: 'var(--cool)',
                          padding: '0 3px',
                          lineHeight: '12px',
                          display: 'inline-block',
                        }}
                      >
                        start
                      </span>
                    )}
                  </span>
                ))}
              </div>
              {i < arr.length - 1 && <Rule />}
            </div>
          );
        })}
    </section>
  );
}
