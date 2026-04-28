import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildRecapSummary } from '../../lib/recap/buildRecapSummary';
import { Rule, formatDate, formatDuration } from '../../shared';

export function RecapSection() {
  const { game } = useGame();

  const recap = useMemo(
    () => (game !== null ? buildRecapSummary(game) : null),
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
          fontSize: '8px',
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
          fontSize: 30,
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
          fontSize: '8px',
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
          fontSize: 26,
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
          fontSize: 11,
          textAlign: 'center',
          color: 'var(--ink-2)',
          marginTop: 4,
          lineHeight: 1.3,
        }}
      >
        {editorialDeck}
      </div>

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
              fontSize: '7px',
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
                  background: winner.color,
                  opacity: 0.7,
                  marginBottom: 4,
                }}
              />
              <div
                style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontWeight: 800,
                  fontSize: 14,
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
                  fontSize: 24,
                  color: 'var(--accent)',
                  lineHeight: 1,
                }}
              >
                {winner.finalVp} VP
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '8px',
                  color: 'var(--ink-3)',
                  marginTop: 3,
                }}
              >
                {winner.playerName}
              </div>
            </>
          ) : (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', color: 'var(--ink-3)' }}>
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
              fontSize: 9,
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
              fontSize: '7px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--ink-3)',
              marginBottom: 2,
            }}
          >
            Margin
          </div>
          <div
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontWeight: 800,
              fontSize: 24,
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
              fontSize: '7px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--ink-3)',
              marginBottom: 2,
            }}
          >
            Length
          </div>
          <div
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontWeight: 800,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            {durationStr}
          </div>
        </div>
      </div>

      <Rule />

      {/* Standings strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${standings.length}, 1fr)`,
          gap: 3,
        }}
      >
        {standings.map(s => (
          <div
            key={s.factionId}
            style={{
              textAlign: 'center',
              padding: '4px 2px',
              background: s.isWinner ? 'var(--paper-2)' : 'transparent',
              border: s.isWinner ? '1px solid var(--accent)' : '1px solid var(--ink-4)',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: s.color,
                margin: '0 auto 2px',
              }}
            />
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '7px',
                color: 'var(--ink-3)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {s.factionId.split(' ')[0] ?? s.factionId}
            </div>
            <div
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontWeight: 800,
                fontSize: 13,
                color: s.isWinner ? 'var(--accent)' : 'var(--ink)',
              }}
            >
              {s.finalVp}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
