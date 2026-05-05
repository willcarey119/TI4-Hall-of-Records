// app/src/features/game-detail/TechSection.tsx
import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildTechSummary } from '../../lib/tech/buildTechSummary';
import { deriveRoundBoundaries } from '../../lib/aggregator/deriveRoundBoundaries';
import { Label, Rule, FactionDot, TechPip, SectionDesc } from '../../shared';

export function TechSection() {
  const { game } = useGame();

  const summary = useMemo(
    () =>
      game
        ? buildTechSummary(
            game.techEvents,
            game.factions,
            deriveRoundBoundaries(game.strategyCardEvents, game.factions.length),
          )
        : null,
    [game],
  );

  if (game === null || summary === null) return null;

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
          fontSize: 'var(--font-micro)',
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
          fontSize: 'var(--font-subhead)',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 2,
        }}
      >
        The arms race.
      </div>
      <div style={{ fontSize: 'var(--font-micro)', color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
        {summary.deckText}
      </div>

      <SectionDesc>
        Technologies researched and held by each faction at game end. Colored pips indicate tech category: blue = Propulsion, red = Warfare, yellow = Cybernetic, green = Biotic. Italic techs are faction-specific.
      </SectionDesc>

      <Rule weight="double" />

      {/* Final Inventories */}
      <Label>Final Inventories</Label>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 'var(--font-micro)',
          color: 'var(--ink-4)',
          letterSpacing: '0.04em',
          marginBottom: 4,
        }}
      >
        Researched + starting techs · <span style={{ fontStyle: 'italic' }}>origin</span> badge = faction starting tech
      </div>
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
                    fontSize: 'var(--font-micro)',
                  }}
                >
                  {faction.factionId}
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 'var(--font-micro)',
                    color: 'var(--ink-3)',
                    marginLeft: 'auto',
                  }}
                >
                  {inv.techs.length} tech{inv.techs.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6, fontSize: 'var(--font-micro)' }}>
                {inv.techs.map((t, j) => (
                  <span key={j} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <TechPip color={t.color} />
                    {t.tech}
                    {t.origin === 'starting' && (
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 'var(--font-micro)',
                          border: '1px solid var(--ink-4)',
                          color: 'var(--ink-4)',
                          padding: '0 3px',
                          lineHeight: '12px',
                          display: 'inline-block',
                          letterSpacing: '0.04em',
                        }}
                      >
                        origin
                      </span>
                    )}
                  </span>
                ))}
              </div>
              {i < arr.length - 1 && <Rule />}
            </div>
          );
        })}

      <Rule />

      {/* Research Order — faction cards */}
      <Label>Research Order · By Faction</Label>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 'var(--font-micro)',
          color: 'var(--ink-4)',
          letterSpacing: '0.04em',
          marginBottom: 6,
        }}
      >
        Sequential research order per faction · starting techs shown dimmed at bottom
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 8,
        }}
      >
        {summary.inventories
          .filter(inv => inv.techs.length > 0)
          .map(inv => {
            const faction = game.factions.find(f => f.factionId === inv.factionId);
            if (faction === undefined) return null;
            const researched = inv.techs
              .filter(t => t.origin === 'research')
              .map((t, i) => {
                const ev = summary.timeline.find(
                  e => e.factionId === inv.factionId && e.tech === t.tech,
                );
                return { tech: t.tech, color: t.color, round: ev?.round ?? 0, seq: i + 1 };
              });
            const starting = inv.techs.filter(t => t.origin === 'starting');
            return (
              <div
                key={inv.factionId}
                style={{
                  border: '1px solid var(--rule)',
                  background: 'var(--paper-2)',
                  padding: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 8,
                    paddingBottom: 6,
                    borderBottom: '1px solid var(--ink-4)',
                  }}
                >
                  <FactionDot color={faction.color} size={8} />
                  <span
                    style={{
                      fontFamily: "'Newsreader', Georgia, serif",
                      fontWeight: 700,
                      fontSize: 12,
                      flex: 1,
                    }}
                  >
                    {faction.factionId}
                  </span>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      color: 'var(--ink-3)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {researched.length} researched
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {researched.map(t => (
                    <div
                      key={t.seq}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 9,
                          color: 'var(--ink-4)',
                          width: 12,
                          textAlign: 'right',
                          flexShrink: 0,
                        }}
                      >
                        {t.seq}
                      </span>
                      <TechPip color={t.color} size={6} />
                      <span
                        style={{
                          fontFamily: "'IBM Plex Sans', sans-serif",
                          fontSize: 10,
                          color: 'var(--ink-2)',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.tech}
                      </span>
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 9,
                          color: 'var(--ink-4)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.round === 0 ? '—' : `R${t.round}`}
                      </span>
                    </div>
                  ))}
                  {starting.length > 0 && (
                    <>
                      <div
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 8,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: 'var(--ink-4)',
                          padding: '4px 0 2px',
                          borderTop: '1px solid var(--ink-4)',
                          marginTop: 3,
                        }}
                      >
                        Starting Techs
                      </div>
                      {starting.map(t => (
                        <div
                          key={t.tech}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            opacity: 0.5,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: 9,
                              color: 'var(--ink-4)',
                              width: 12,
                              textAlign: 'right',
                              flexShrink: 0,
                            }}
                          >
                            —
                          </span>
                          <TechPip color={t.color} size={6} />
                          <span
                            style={{
                              fontFamily: "'IBM Plex Sans', sans-serif",
                              fontSize: 10,
                              color: 'var(--ink-2)',
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontStyle: 'italic',
                            }}
                          >
                            {t.tech}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
