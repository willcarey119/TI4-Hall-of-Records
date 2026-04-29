import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildTimelineFeed, type TimelineFeedItem } from '../../lib/timeline/buildTimelineFeed';
import { Rule, FactionDot } from '../../shared';

/** Format a raw timestamp (ms) as relative game time h:mm */
function formatGameTime(timestamp: number, firstTimestamp: number): string {
  const secs = Math.max(0, Math.floor((timestamp - firstTimestamp) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

const TYPE_ICON: Record<string, string> = {
  vp: '✦',
  agenda: '⚖',
  objective: '◆',
  planet: '⌖',
};

function FeedItem({
  item,
  factionColorMap,
  firstTimestamp,
}: {
  item: TimelineFeedItem;
  factionColorMap: Record<string, string>;
  firstTimestamp: number;
}) {
  const timeLabel = formatGameTime(item.timestamp, firstTimestamp);
  const color = item.isHighlight ? 'var(--ink)' : 'var(--ink-3)';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 10px 1fr',
        gap: 5,
        alignItems: 'flex-start',
        padding: '4px 0',
        borderBottom: '1px dotted var(--ink-4)',
      }}
    >
      {/* Time */}
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          color: 'var(--ink-4)',
          paddingTop: 1,
        }}
      >
        {timeLabel}
      </span>

      {/* Icon or faction dot */}
      {item.factionId !== null ? (
        <FactionDot color={factionColorMap[item.factionId] ?? 'var(--ink-4)'} />
      ) : (
        <span style={{ fontSize: 8, color: 'var(--ink-3)', paddingTop: 1 }}>
          {TYPE_ICON[item.type] ?? '·'}
        </span>
      )}

      {/* Label + sublabel */}
      <div>
        <span
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: 11,
            fontWeight: item.isHighlight ? 700 : 400,
            color,
          }}
        >
          {item.label}
        </span>
        {item.subLabel !== null && (
          <span
            style={{
              display: 'block',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 8,
              color: 'var(--ink-3)',
              marginTop: 1,
            }}
          >
            {item.subLabel}
          </span>
        )}
      </div>
    </div>
  );
}

export function TimelineSection() {
  const { game } = useGame();

  const summary = useMemo(
    () =>
      game !== null
        ? buildTimelineFeed(
            game.vpEvents,
            game.agendaResolutions,
            game.objectiveReveals,
            game.planetEvents,
          )
        : null,
    [game],
  );

  const factionColorMap = useMemo(
    () =>
      game !== null
        ? Object.fromEntries(game.factions.map(f => [f.factionId, f.color]))
        : {},
    [game],
  );

  // First event timestamp for relative time display
  const firstTimestamp = summary?.items[0]?.timestamp ?? 0;

  return (
    <section
      id="timeline"
      data-section="timeline"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      {summary !== null && (
        <>
          {/* Kicker */}
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 8,
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
            <span>Chronicle · This Game</span>
            <span>{summary.items.length} events · {summary.highlightCount} highlights</span>
          </div>

          {/* Headline */}
          <div
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: 22,
              fontWeight: 800,
              fontStyle: 'italic',
              lineHeight: 1.1,
              margin: '4px 0 2px',
            }}
          >
            Turn by turn.
          </div>

          {/* Deck */}
          <div style={{ fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
            {summary.deckText}
          </div>

          <hr style={{ border: 'none', borderTop: '3px double var(--rule)', margin: '6px 0' }} />

          {/* Event legend */}
          <div style={{ display: 'flex', gap: 10, fontSize: 9, marginBottom: 6, flexWrap: 'wrap' }}>
            {[
              { icon: '✦', label: 'VP scored',          color: 'var(--ink)' },
              { icon: '⚖', label: 'Agenda',             color: 'var(--ink)' },
              { icon: '◆', label: 'Objective revealed', color: 'var(--ink-3)' },
              { icon: '⌖', label: 'Mecatol Rex',        color: 'var(--ink)' },
            ].map(({ icon, label, color }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ color, fontSize: 8 }}>{icon}</span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: 'var(--ink-3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {label}
                </span>
              </span>
            ))}
          </div>

          <Rule />

          {/* Feed */}
          {summary.items.length === 0 ? (
            <div
              style={{
                fontSize: 10,
                color: 'var(--ink-3)',
                fontStyle: 'italic',
                padding: '8px 0',
              }}
            >
              No events recorded.
            </div>
          ) : (
            <div>
              {summary.items.map((item, i) => (
                <FeedItem
                  key={i}
                  item={item}
                  factionColorMap={factionColorMap}
                  firstTimestamp={firstTimestamp}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
