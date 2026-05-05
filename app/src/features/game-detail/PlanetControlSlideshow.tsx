import { useEffect, useMemo, useState } from 'react';
import type { ParsedGame } from '../../lib/parser/types';
import { buildTerritoryByRound, deriveRoundBoundaries } from '../../lib/aggregator';
import { getFactionBrandColor } from '../../lib/factions/factionBrandColors';
import { FactionDot, Label } from '../../shared';

const SPEED_OPTIONS: { label: string; ms: number }[] = [
  { label: 'Slow', ms: 2500 },
  { label: 'Normal', ms: 1500 },
  { label: 'Fast', ms: 800 },
];

interface Props {
  game: ParsedGame;
}

export function PlanetControlSlideshow({ game }: Props) {
  const territoryByRound = useMemo(() => {
    const boundaries = deriveRoundBoundaries(game.strategyCardEvents, game.factions.length);
    return buildTerritoryByRound(game.planetEvents, game.factions, boundaries);
  }, [game]);

  const totalRounds = territoryByRound.length;
  const [roundIdx, setRoundIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(1500);

  useEffect(() => {
    if (!playing) return;
    if (roundIdx >= totalRounds - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setRoundIdx(i => i + 1), speedMs);
    return () => clearTimeout(timer);
  }, [playing, roundIdx, totalRounds, speedMs]);

  if (totalRounds === 0) return null;

  const handlePlay = () => {
    if (roundIdx >= totalRounds - 1) setRoundIdx(0);
    setPlaying(p => !p);
  };

  const handleSeek = (i: number) => {
    setRoundIdx(i);
    setPlaying(false);
  };

  const current = territoryByRound[roundIdx];
  if (current === undefined) return null;

  const factionColorMap: Record<string, string> = {};
  for (const f of game.factions) {
    factionColorMap[f.factionId] = getFactionBrandColor(f.factionId, f.color);
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <Label>Planet Control · Round by Round</Label>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 6,
          marginBottom: 10,
          padding: '8px 10px',
          background: 'var(--paper-2)',
          border: '1px solid var(--rule)',
        }}
      >
        <button
          onClick={handlePlay}
          aria-label={playing ? 'Pause' : 'Play'}
          style={{
            width: 28,
            height: 28,
            border: '1px solid var(--ink-3)',
            background: 'var(--ink)',
            color: 'var(--paper)',
            cursor: 'pointer',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            padding: 0,
          }}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <div style={{ display: 'flex', gap: 3, flex: 1 }}>
          {territoryByRound.map((rt, i) => (
            <button
              key={rt.round}
              onClick={() => handleSeek(i)}
              style={{
                flex: 1,
                height: 26,
                border: i === roundIdx ? '1px solid var(--ink)' : '1px solid var(--ink-4)',
                background: i === roundIdx ? 'var(--ink)' : 'var(--paper-3)',
                color: i === roundIdx ? 'var(--paper)' : 'var(--ink-3)',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              R{rt.round}
            </button>
          ))}
        </div>
        <select
          value={speedMs}
          onChange={(e) => setSpeedMs(Number(e.target.value))}
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            background: 'var(--paper-3)',
            border: '1px solid var(--ink-4)',
            color: 'var(--ink)',
            padding: '3px 5px',
            cursor: 'pointer',
          }}
        >
          {SPEED_OPTIONS.map(opt => (
            <option key={opt.ms} value={opt.ms}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Round heading */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: 24,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          Round {current.round}
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--ink-3)',
          }}
        >
          End-of-round territory snapshot
        </div>
      </div>

      {/* Per-faction round cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 8,
        }}
      >
        {current.factions.map(ft => {
          const hasChanges = ft.gained.length > 0 || ft.lost.length > 0;
          const net = ft.gained.length - ft.lost.length;
          const showBadge = hasChanges && roundIdx > 0;
          let badgeText = `${ft.gained.length > 0 ? `+${ft.gained.length}` : ''}${ft.gained.length > 0 && ft.lost.length > 0 ? ' / ' : ''}${ft.lost.length > 0 ? `-${ft.lost.length}` : ''}`;
          if (badgeText === '') badgeText = '±0';
          let badgeColor = 'var(--ink-3)';
          let badgeBg = 'var(--paper-3)';
          if (net > 0) { badgeColor = '#1a6e2e'; badgeBg = '#d6f0dc'; }
          if (net < 0) { badgeColor = '#8a1a1a'; badgeBg = '#f5d6d6'; }

          return (
            <div
              key={ft.factionId}
              style={{
                border: hasChanges ? '1px solid var(--ink-3)' : '1px solid var(--rule)',
                background: 'var(--paper-2)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 10px',
                  borderBottom: '1px solid var(--ink-4)',
                }}
              >
                <FactionDot color={factionColorMap[ft.factionId] ?? '#aaa'} size={8} />
                <span
                  style={{
                    fontFamily: "'Newsreader', Georgia, serif",
                    fontWeight: 700,
                    fontSize: 11,
                    flex: 1,
                  }}
                >
                  {ft.factionId}
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {ft.planetCount}
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: '7px 10px' }}>
                {showBadge && (
                  <div style={{ marginBottom: 5 }}>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 9,
                        padding: '1px 5px',
                        border: `1px solid ${badgeColor}`,
                        color: badgeColor,
                        background: badgeBg,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {badgeText} planet{Math.abs(net) === 1 ? '' : 's'}
                    </span>
                  </div>
                )}
                {ft.planets.length === 0 && ft.lost.length === 0 ? (
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      color: 'var(--ink-4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    — No planets held —
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {ft.planets.map(p => {
                      const isGained = ft.gained.includes(p);
                      return (
                        <div
                          key={p}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 10,
                            padding: '1px 3px',
                            background: isGained ? '#d6f0dc' : 'transparent',
                            color: isGained ? '#1a6e2e' : 'var(--ink-2)',
                            fontWeight: isGained ? 600 : 400,
                            transition: 'background 0.3s',
                          }}
                        >
                          <span style={{ flex: 1 }}>{p}</span>
                          {isGained && (
                            <span
                              style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: 8,
                                color: '#1a6e2e',
                                marginLeft: 4,
                              }}
                            >
                              ▲ Gained
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {ft.lost.map(p => (
                      <div
                        key={`lost-${p}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 10,
                          padding: '1px 3px',
                          background: '#f5d6d6',
                          color: '#8a1a1a',
                          textDecoration: 'line-through',
                          opacity: 0.7,
                          transition: 'background 0.3s',
                        }}
                      >
                        <span style={{ flex: 1 }}>{p}</span>
                        <span
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 8,
                            color: '#8a1a1a',
                            marginLeft: 4,
                            textDecoration: 'none',
                          }}
                        >
                          ▼ Lost
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
