import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildPlanetSummary, type PlanetSummary, type FactionPlanetInventory } from '../../lib/planets/buildPlanetSummary';
import { buildMecatolTimeline } from '../../lib/planets/buildMecatolTimeline';
import { deriveRoundBoundaries } from '../../lib/aggregator/deriveRoundBoundaries';
import { MecatolWidget } from './MecatolWidget';
import { PlanetControlSlideshow } from './PlanetControlSlideshow';
import { Label, Rule, FactionDot, SectionDesc } from '../../shared';

function PlanetsContent({ summary }: { summary: PlanetSummary }) {
  const contestedNames = new Set(summary.contested.map(p => p.planet));

  return (
    <>
      {/* Kicker */}
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 'var(--font-micro)',
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
        <span>Planet Control · This Game</span>
        <span>
          {summary.totalControlled} controlled
          {summary.contested.length > 0 && ` · ${summary.contested.length} contested`}
        </span>
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
        Territory at game end.
      </div>

      {/* Deck */}
      <div style={{ fontSize: 'var(--font-micro)', color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
        {summary.deckText}
      </div>

      <SectionDesc>
        Territorial holdings at game end — which planets each faction controlled, with total resources and influence. Contested planets (changed hands during the game) are highlighted separately.
      </SectionDesc>

      <hr style={{ border: 'none', borderTop: '3px double var(--rule)', margin: '6px 0' }} />

      {/* Per-faction territory cards */}
      <Label>Final Control</Label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 8,
          marginTop: 6,
        }}
      >
        {summary.inventories.map(inv => (
          <FactionTerritoryCard
            key={inv.factionId}
            inv={inv}
            contestedNames={contestedNames}
          />
        ))}
      </div>
    </>
  );
}

function FactionTerritoryCard({
  inv,
  contestedNames,
}: {
  inv: FactionPlanetInventory;
  contestedNames: Set<string>;
}) {
  return (
    <div
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
        <FactionDot color={inv.color} size={8} />
        <span
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontWeight: 700,
            fontSize: 12,
            flex: 1,
          }}
        >
          {inv.factionId}
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--ink)',
          }}
        >
          {inv.totalPlanets}
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--ink-4)',
          }}
        >
          planet{inv.totalPlanets === 1 ? '' : 's'}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {inv.planets.map(p => {
          const isContested = contestedNames.has(p.planet);
          return (
            <div
              key={p.planet}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                padding: '2px 5px',
                background: 'var(--paper-3)',
                border: isContested ? '1px solid var(--accent)' : '1px solid var(--ink-4)',
                color: isContested ? 'var(--accent)' : 'var(--ink-2)',
                fontWeight: p.isMecatol ? 700 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {p.planet}
              {isContested && p.changeCount > 1 && (
                <span style={{ marginLeft: 3, fontSize: 8, opacity: 0.8 }}>
                  ×{p.changeCount}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PlanetsSection() {
  const { game } = useGame();

  const summary = useMemo(
    () => (game !== null ? buildPlanetSummary(game.planetEvents, game.factions) : null),
    [game],
  );

  const mecatolTimeline = useMemo(() => {
    if (game === null) return null;
    const roundBoundaries = deriveRoundBoundaries(game.strategyCardEvents, game.factions.length);
    return buildMecatolTimeline(game.planetEvents, game.factions, roundBoundaries);
  }, [game]);

  return (
    <section
      id="planets"
      data-section="planets"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      {mecatolTimeline !== null && (
        <MecatolWidget timeline={mecatolTimeline} factions={game!.factions} />
      )}
      {summary !== null && (
        <PlanetsContent summary={summary} />
      )}
      {game !== null && (
        <>
          <Rule weight="double" />
          <PlanetControlSlideshow game={game} />
        </>
      )}
    </section>
  );
}
