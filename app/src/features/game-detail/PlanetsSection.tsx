import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildPlanetSummary, type PlanetSummary, type FactionPlanetInventory } from '../../lib/planets/buildPlanetSummary';
import { Label, Rule, FactionDot } from '../../shared';

function PlanetsContent({
  summary,
  factionColorMap,
}: {
  summary: PlanetSummary;
  factionColorMap: Record<string, string>;
}) {
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

      <hr style={{ border: 'none', borderTop: '3px double var(--rule)', margin: '6px 0' }} />

      {/* Mecatol Rex callout */}
      {summary.mecatol !== null && (
        <>
          <Label>Mecatol Rex</Label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 0 6px',
              fontSize: 'var(--font-micro)',
            }}
          >
            <FactionDot color={factionColorMap[summary.mecatol.factionId] ?? 'var(--ink-4)'} />
            <span
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontWeight: 700,
              }}
            >
              {summary.mecatol.factionId}
            </span>
            {summary.mecatol.changeCount >= 1 && (
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 'var(--font-micro)',
                  background: 'var(--paper-2)',
                  border: '1px solid var(--rule)',
                  padding: '0 4px',
                  color: 'var(--ink-3)',
                }}
              >
                changed hands {summary.mecatol.changeCount}&times;
              </span>
            )}
          </div>
          <Rule />
        </>
      )}

      {/* Per-faction inventories */}
      <Label>Final Control</Label>
      <div style={{ marginTop: 4 }}>
        {summary.inventories.map((inv, i, arr) => (
          <FactionInventory
            key={inv.factionId}
            inv={inv}
            isLast={i === arr.length - 1}
            contestedNames={contestedNames}
          />
        ))}
      </div>
    </>
  );
}

function FactionInventory({
  inv,
  isLast,
  contestedNames,
}: {
  inv: FactionPlanetInventory;
  isLast: boolean;
  contestedNames: Set<string>;
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '5px 0 3px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <FactionDot color={inv.color} />
          <span
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontWeight: 700,
              fontSize: 'var(--font-sm)',
            }}
          >
            {inv.factionId}
          </span>
        </div>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            color: 'var(--ink-3)',
          }}
        >
          {inv.totalPlanets} planets
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2px 6px',
          paddingBottom: 4,
          fontSize: 'var(--font-micro)',
          color: 'var(--ink-2)',
        }}
      >
        {inv.planets
          .filter(p => !p.isMecatol)
          .map(p => (
            <span
              key={p.planet}
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                color: contestedNames.has(p.planet) ? 'var(--accent)' : 'var(--ink-2)',
              }}
            >
              {p.planet}
              {contestedNames.has(p.planet) && (
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 'var(--font-micro)',
                    marginLeft: 2,
                    color: 'var(--accent)',
                  }}
                >
                  &times;{p.changeCount}
                </span>
              )}
            </span>
          ))}
      </div>
      {!isLast && <Rule />}
    </div>
  );
}

export function PlanetsSection() {
  const { game } = useGame();

  const summary = useMemo(
    () => (game !== null ? buildPlanetSummary(game.planetEvents, game.factions) : null),
    [game],
  );

  const factionColorMap = useMemo(
    () =>
      game !== null
        ? Object.fromEntries(game.factions.map(f => [f.factionId, f.color]))
        : {},
    [game],
  );

  return (
    <section
      id="planets"
      data-section="planets"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      {summary !== null && (
        <PlanetsContent summary={summary} factionColorMap={factionColorMap} />
      )}
    </section>
  );
}
