import React from 'react';
import type { ParsedGame, VpEvent, TechEvent, FactionSetup } from '../../lib/parser/types';
import type { RoundScoreRow } from '../../lib/recap/buildRoundScores';
import { getObjectivePoints } from '../../lib/parser/objectives';
import { lookupTechColor, type TechColor } from '../../lib/parser/techs';
import { buildPlanetSummary } from '../../lib/planets/buildPlanetSummary';
import { getFactionBrandColor } from '../../lib/factions/factionBrandColors';
import { FactionDot, Tooltip } from '../../shared';

type SourceTag = 'stage1' | 'stage2' | 'secret' | 'imperial' | 'custodians' | 'sft' | 'agenda' | 'rider' | 'relic' | 'legendary' | 'manual' | 'other';

const SOURCE_PIP_COLOR: Record<SourceTag, string> = {
  stage1: 'var(--ink-3)',
  stage2: 'var(--ink-2)',
  secret: 'var(--accent)',
  imperial: '#b06020',
  custodians: 'var(--cool)',
  sft: '#1a8c8c',
  agenda: '#7a4a2a',
  rider: '#2a5a8c',
  relic: '#7a5020',
  legendary: '#c8a060',
  manual: 'var(--ink-3)',
  other: 'var(--ink-4)',
};

const TECH_CAT_COLOR: Record<TechColor, string> = {
  blue: 'var(--cool)',
  red: 'var(--accent)',
  yellow: 'var(--gold)',
  green: 'var(--moss)',
  unit: 'var(--ink-3)',
};

const TECH_CAT_LABEL: Record<TechColor, string> = {
  blue: 'Prop',
  red: 'War',
  yellow: 'Cyb',
  green: 'Bio',
  unit: 'Unit',
};

function classifyVpSource(ev: VpEvent): { tag: SourceTag; label: string } {
  switch (ev.source) {
    case 'score_objective': {
      const def = getObjectivePoints(ev.objective);
      if (def?.stage === 'II') return { tag: 'stage2', label: ev.objective };
      if (def?.stage === 'secret') return { tag: 'secret', label: 'Secret Objective' };
      return { tag: 'stage1', label: ev.objective };
    }
    case 'imperial_point':
      return { tag: 'imperial', label: 'Imperial Point' };
    case 'custodians':
      return { tag: 'custodians', label: 'Custodians VP' };
    case 'support_for_throne':
      return { tag: 'sft', label: 'Support for the Throne' };
    case 'agenda':
      return { tag: 'agenda', label: ev.objective };
    case 'rider':
      return { tag: 'rider', label: 'Agenda Rider' };
    case 'relic':
      return { tag: 'relic', label: ev.objective };
    case 'legendary_planet':
      return { tag: 'legendary', label: ev.objective };
    case 'manual':
      return { tag: 'manual', label: ev.objective || 'Manual VP' };
    default:
      return { tag: 'other', label: ev.objective };
  }
}

interface CardData {
  faction: FactionSetup;
  rank: number;
  finalVp: number;
  isWinner: boolean;
  vpEvents: VpEvent[];
  researchedTechs: TechEvent[];
  techCategoryCounts: Record<TechColor, number>;
  planetNames: string[];
  contestedPlanets: Set<string>;
  legendaryPlanets: Set<string>;
}

function buildCardData(game: ParsedGame): CardData[] {
  const planetSummary = buildPlanetSummary(game.planetEvents, game.factions);
  const contested = new Set(planetSummary.contested.map(p => p.planet));

  // Sort factions by final VP descending (winner first)
  const ranked = [...game.factions]
    .map(f => ({ faction: f, finalVp: game.finalScores[f.factionId] ?? 0 }))
    .sort((a, b) => b.finalVp - a.finalVp);

  return ranked.map((entry, idx) => {
    const factionId = entry.faction.factionId;
    const inv = planetSummary.inventories.find(i => i.factionId === factionId);
    const planetNames = inv?.planets.map(p => p.planet) ?? [];
    const factionVpEvents = game.vpEvents.filter(e => e.faction === factionId);
    const researchedTechs = game.techEvents.filter(
      e => e.faction === factionId && e.type === 'research',
    );
    const techCategoryCounts: Record<TechColor, number> = {
      blue: 0, red: 0, yellow: 0, green: 0, unit: 0,
    };
    for (const t of researchedTechs) {
      const c = lookupTechColor(t.tech);
      techCategoryCounts[c]++;
    }
    return {
      faction: entry.faction,
      rank: idx + 1,
      finalVp: entry.finalVp,
      isWinner: game.winner === factionId,
      vpEvents: factionVpEvents,
      researchedTechs,
      techCategoryCounts,
      planetNames,
      contestedPlanets: contested,
      legendaryPlanets: new Set<string>(), // planet metadata not available in parser
    };
  });
}

const sectionLabelStyle = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 'var(--font-micro)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: 'var(--ink-4)',
  marginBottom: 4,
};

function rankBadgeText(rank: number): string {
  if (rank === 1) return '#1 — 1st Place';
  if (rank === 2) return '#2 — 2nd Place';
  if (rank === 3) return '#3 — 3rd Place';
  return `#${rank}`;
}

function FactionCard({ data, vpThreshold }: { data: CardData; vpThreshold: number }) {
  const { faction, rank, finalVp, isWinner, vpEvents, researchedTechs, techCategoryCounts, planetNames, contestedPlanets } = data;
  const brandColor = getFactionBrandColor(faction.factionId, faction.color);
  const vpPct = Math.min(100, (finalVp / vpThreshold) * 100);
  const vpBarColor = isWinner ? brandColor : rank === 2 ? 'var(--ink-2)' : 'var(--ink-3)';

  // Top 2 most recently researched techs
  const topTechs = researchedTechs
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 2);
  const overflowTechs = Math.max(0, researchedTechs.length - topTechs.length);

  // Visible planet chips: cap at 6 with overflow indicator
  const visiblePlanets = planetNames.slice(0, 6);
  const hiddenPlanets = Math.max(0, planetNames.length - visiblePlanets.length);

  return (
    <div
      style={{
        border: isWinner ? '1.5px solid var(--ink-3)' : '1px solid var(--rule)',
        background: 'var(--paper-2)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {isWinner && (
        <div
          style={{
            position: 'absolute',
            top: 9,
            right: -20,
            background: 'var(--accent)',
            color: '#fff',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '2px 26px',
            transform: 'rotate(45deg)',
            transformOrigin: 'top right',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          Winner
        </div>
      )}

      {/* VP section */}
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--ink-4)' }}>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: isWinner ? 'var(--accent)' : 'var(--ink-4)',
            marginBottom: 2,
          }}
        >
          {rankBadgeText(rank)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
          <FactionDot color={brandColor} size={8} />
          <div
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: 'var(--font-sm)',
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {faction.factionId}
          </div>
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            color: 'var(--ink-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginLeft: 13,
            marginBottom: 8,
          }}
        >
          {faction.playerName || '—'}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 4 }}>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-display-md)',
              fontWeight: 700,
              lineHeight: 1,
              color: isWinner ? 'var(--accent)' : 'var(--ink)',
            }}
          >
            {finalVp}
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
              color: 'var(--ink-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            VP · {vpThreshold} goal
          </span>
        </div>
        <div style={{ background: 'var(--ink-4)', height: 3, marginBottom: 6 }}>
          <div style={{ height: 3, width: `${vpPct}%`, background: vpBarColor }} />
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2, padding: 0, margin: 0 }}>
          {vpEvents.length === 0 ? (
            <li style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-4)', fontStyle: 'italic' }}>
              No VP scored
            </li>
          ) : (
            vpEvents.map((ev, i) => {
              const { tag, label } = classifyVpSource(ev);
              return (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 'var(--font-micro)',
                    color: 'var(--ink-2)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: SOURCE_PIP_COLOR[tag],
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                  </span>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 'var(--font-micro)',
                      color: 'var(--ink-3)',
                      whiteSpace: 'nowrap',
                      marginLeft: 4,
                    }}
                  >
                    {ev.points} pt
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Tech section */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--ink-4)' }}>
        <div style={sectionLabelStyle}>Technology · {researchedTechs.length} researched</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: researchedTechs.length > 0 ? 5 : 0 }}>
          {(['blue', 'red', 'yellow', 'green', 'unit'] as TechColor[])
            .filter(c => techCategoryCounts[c] > 0)
            .map(c => (
              <div
                key={c}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 'var(--font-micro)',
                  color: 'var(--ink-3)',
                  background: 'var(--paper-3)',
                  border: '1px solid var(--ink-4)',
                  padding: '1px 5px',
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: TECH_CAT_COLOR[c], display: 'inline-block' }} />
                {techCategoryCounts[c]} {TECH_CAT_LABEL[c]}
              </div>
            ))}
        </div>
        {topTechs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {topTechs.map((t, i) => {
              const c = lookupTechColor(t.tech);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-2)' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: TECH_CAT_COLOR[c], flexShrink: 0 }} />
                  {t.tech}
                </div>
              );
            })}
            {overflowTechs > 0 && (
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', opacity: 0.5 }}>
                + {overflowTechs} more
              </div>
            )}
          </div>
        )}
      </div>

      {/* Territory section */}
      <div style={{ padding: '8px 12px' }}>
        <div style={sectionLabelStyle}>Territory · {planetNames.length} planet{planetNames.length === 1 ? '' : 's'}</div>
        {planetNames.length === 0 ? (
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-4)', fontStyle: 'italic' }}>
            No planets held
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {visiblePlanets.map(p => {
              const isContested = contestedPlanets.has(p);
              const isMecatol = p === 'Mecatol Rex';
              return (
                <div
                  key={p}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 'var(--font-micro)',
                    padding: '1px 5px',
                    background: isMecatol ? 'var(--paper-3)' : 'var(--paper-3)',
                    border: isContested ? '1px solid var(--accent)' : '1px solid var(--ink-4)',
                    color: isContested ? 'var(--accent)' : 'var(--ink-2)',
                    fontWeight: isMecatol ? 700 : 400,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p}
                </div>
              );
            })}
            {hiddenPlanets > 0 && (
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 'var(--font-micro)',
                  padding: '1px 5px',
                  background: 'var(--paper-3)',
                  border: '1px solid var(--ink-4)',
                  color: 'var(--ink-3)',
                  fontStyle: 'italic',
                }}
              >
                + {hiddenPlanets} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function FactionSnapshotCards({
  game,
  roundScores = [],
  scrubRound = null,
}: {
  game: ParsedGame;
  roundScores?: RoundScoreRow[];
  scrubRound?: number | null;
}) {
  const cards = buildCardData(game);
  if (cards.length === 0) return null;

  // Shared grid template: row-label gutter + N data columns (one per faction, VP-desc order)
  const gridTemplateColumns = `36px repeat(${cards.length}, minmax(0, 1fr))`;
  const showRoundScores = roundScores.length > 0;

  const cellBase = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 'var(--font-micro)',
    textAlign: 'center' as const,
    padding: '3px 2px',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns, gap: 8, alignItems: 'stretch' }}>
      {/* Row 1: cards (skip the row-label gutter) */}
      <div />
      {cards.map(c => (
        <FactionCard key={c.faction.factionId} data={c} vpThreshold={game.vpThreshold} />
      ))}

      {/* Round scores grid — shares the same column template */}
      {showRoundScores && (
        <>
          {/* Header row: "Rd" label + faction dots */}
          <div
            style={{
              ...cellBase,
              textAlign: 'left',
              color: 'var(--ink-3)',
              borderTop: '1px solid var(--rule)',
              paddingTop: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            Rd<Tooltip text="VP scored by each faction per round. Numbers are cumulative — each cell shows total points at end of that round." />
          </div>
          {cards.map(c => (
            <div
              key={`hd-${c.faction.factionId}`}
              style={{
                ...cellBase,
                color: 'var(--ink-3)',
                borderTop: '1px solid var(--rule)',
                paddingTop: 6,
              }}
            >
              <FactionDot
                color={getFactionBrandColor(c.faction.factionId, c.faction.color)}
                size={5}
              />
            </div>
          ))}

          {/* Data rows */}
          {roundScores.map(row => (
            <RoundScoreRowFragment
              key={row.round}
              row={row}
              cards={cards}
              cellStyle={cellBase}
              dimmed={scrubRound !== null && row.round > scrubRound}
            />
          ))}
        </>
      )}
    </div>
  );
}

function RoundScoreRowFragment({
  row,
  cards,
  cellStyle,
  dimmed = false,
}: {
  row: RoundScoreRow;
  cards: CardData[];
  cellStyle: React.CSSProperties;
  dimmed?: boolean;
}) {
  const opacity = dimmed ? 0.3 : 1;
  return (
    <>
      <div style={{ ...cellStyle, textAlign: 'left', color: 'var(--ink-3)', opacity }}>
        R{row.round}
      </div>
      {cards.map(c => (
        <div
          key={`${row.round}-${c.faction.factionId}`}
          style={{
            ...cellStyle,
            fontWeight: 800,
            color: c.isWinner ? 'var(--accent)' : 'var(--ink)',
            opacity,
          }}
        >
          {row.scores[c.faction.factionId] ?? 0}
        </div>
      ))}
    </>
  );
}
