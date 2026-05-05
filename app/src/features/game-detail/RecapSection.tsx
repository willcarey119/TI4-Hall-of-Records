import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildRecapSummary } from '../../lib/recap/buildRecapSummary';
import { Rule, formatDate, formatDuration, FactionDot, SectionDesc, Tooltip } from '../../shared';
import { getFactionBrandColor } from '../../lib/factions/factionBrandColors';
import { buildRoundScores } from '../../lib/recap/buildRoundScores';
import { deriveRoundBoundaries } from '../../lib/aggregator';
import { FactionSnapshotCards } from './FactionSnapshotCards';

export function RecapSection() {
  const { game } = useGame();

  const recap = useMemo(
    () => (game !== null ? buildRecapSummary(game) : null),
    [game],
  );

  const roundScores = useMemo(
    () =>
      game !== null
        ? buildRoundScores(
            game.vpEvents,
            game.factions,
            deriveRoundBoundaries(game.strategyCardEvents, game.factions.length),
          )
        : [],
    [game],
  );

  if (recap === null || game === null) return null;

  const { winner, standings, totalRounds, durationSeconds, vpMargin, editorialHeadline, editorialDeck } = recap;

  const dateStr = formatDate(game.playedAt);
  const durationStr = formatDuration(durationSeconds);

  const editorialProse =
    winner !== null
      ? `${winner.factionId} reached ${winner.finalVp} victory points after ${totalRounds} rounds. The campaign ran ${durationStr}, with ${standings.length} empires competing for control of the galaxy. Victory came by a margin of ${vpMargin} point${vpMargin === 1 ? '' : 's'} over the runner-up.`
      : `After ${totalRounds} rounds and ${durationStr}, no empire reached the victory threshold. The galaxy remains contested.`;

  return (
    <section
      id="recap"
      data-section="recap"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      {/* Header strip */}
      <div
        style={{
          borderTop: '4px double var(--rule)',
          borderBottom: '1px solid var(--rule)',
          padding: '4px 0',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 'var(--font-micro)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>FINAL EDITION</span>
        <span>Vol. I</span>
        <span>{dateStr}</span>
      </div>

      {/* Masthead */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 'var(--font-display-lg)',
          fontStyle: 'italic',
          textAlign: 'center',
          padding: '8px 0',
          borderBottom: '3px double var(--rule)',
          lineHeight: 1.1,
        }}
      >
        The Galactic Chronicle
      </div>

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
          paddingTop: 6,
          paddingBottom: 3,
        }}
      >
        <span>The Final Tally · Round {totalRounds > 0 ? totalRounds : '—'}</span>
        <span>{durationStr} · {standings.length} empires · {winner !== null ? '1 throne' : 'no throne'}</span>
      </div>

      {/* Headline */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 'var(--font-display-md)',
          fontWeight: 800,
          textAlign: 'center',
          lineHeight: 1.05,
          marginTop: 4,
        }}
      >
        {editorialHeadline}
      </div>

      {/* Deck */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontStyle: 'italic',
          fontSize: 'var(--font-micro)',
          textAlign: 'center',
          color: 'var(--ink-2)',
          marginTop: 4,
          lineHeight: 1.3,
        }}
      >
        {editorialDeck}
      </div>

      <SectionDesc>
        Final standings and VP breakdown for this game. Each faction's total is split by source — public objectives, secret objectives, Imperial Strategy, and agenda bonuses — so you can see exactly how the win was built.
      </SectionDesc>

      <hr style={{ border: 'none', borderTop: '3px double var(--rule)', margin: '8px 0' }} />

      {/* 3-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          alignItems: 'flex-start',
        }}
      >
        {/* Col 1: Winner block */}
        <div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--ink-3)',
              marginBottom: 4,
            }}
          >
            Winner
          </div>
          {winner !== null ? (
            <>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: getFactionBrandColor(winner.factionId, winner.color),
                  opacity: 0.7,
                  marginBottom: 4,
                }}
              />
              <div
                style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontWeight: 800,
                  fontSize: 'var(--font-body)',
                  lineHeight: 1.1,
                  marginBottom: 2,
                }}
              >
                {winner.factionId}
              </div>
              <div
                style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontWeight: 800,
                  fontSize: 'var(--font-display-sm)',
                  color: 'var(--accent)',
                  lineHeight: 1,
                }}
              >
                {winner.finalVp} VP
              </div>
            </>
          ) : (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)' }}>
              No victor
            </div>
          )}
        </div>

        {/* Col 2: Drop cap prose */}
        <div>
          <p
            className="dropcap"
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: 'var(--font-micro)',
              lineHeight: 1.45,
              color: 'var(--ink-2)',
              margin: 0,
            }}
          >
            {editorialProse}
          </p>
        </div>

        {/* Col 3: Margin + Length */}
        <div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--ink-3)',
              marginBottom: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Margin<Tooltip text="Victory point gap between the winner and the second-place faction at game end." />
          </div>
          <div
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontWeight: 800,
              fontSize: 'var(--font-display-sm)',
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            {winner !== null ? `${vpMargin} VP` : '—'}
          </div>
          <Rule />
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--ink-3)',
              marginBottom: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Length<Tooltip text="Wall-clock time from session start to final score, as recorded by TI Assistant's built-in timer." />
          </div>
          <div
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontWeight: 800,
              fontSize: 'var(--font-subhead)',
              lineHeight: 1,
            }}
          >
            {durationStr}
          </div>
        </div>
      </div>

      <Rule />

      {/* Faction snapshot cards (replaces flat standings strip) */}
      <FactionSnapshotCards game={game} />

      {roundScores.length > 0 && (
        <>
          <Rule />
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', color: 'var(--ink-3)', fontWeight: 'normal', paddingRight: 8, whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>Rd<Tooltip text="VP scored by each faction per round. Numbers are cumulative — each cell shows total points at end of that round." /></span>
                  </th>
                  {standings.map(s => (
                    <th key={s.factionId} style={{ textAlign: 'center', color: 'var(--ink-3)', fontWeight: 'normal', paddingBottom: 2 }}>
                      <FactionDot color={s.color} size={5} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roundScores.map(row => (
                  <tr key={row.round}>
                    <td style={{ color: 'var(--ink-3)', paddingRight: 8 }}>R{row.round}</td>
                    {standings.map(s => (
                      <td
                        key={s.factionId}
                        style={{
                          textAlign: 'center',
                          fontWeight: 800,
                          color: s.isWinner ? 'var(--accent)' : 'var(--ink)',
                        }}
                      >
                        {row.scores[s.factionId] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
