import { FactionDot } from '../../shared';
import { getFactionBrandColor } from '../../lib/factions/factionBrandColors';
import type { MecatolTimeline } from '../../lib/planets/buildMecatolTimeline';

interface Props {
  timeline: MecatolTimeline;
  factions: { factionId: string; color: string }[];
}

export function MecatolWidget({ timeline, factions }: Props) {
  return (
    <div style={{ marginBottom: 12 }}>
      {/* Kicker */}
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 'var(--font-micro)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
          borderBottom: '1px solid var(--rule)',
          paddingBottom: 3,
          marginBottom: 6,
        }}
      >
        Mecatol Rex · Control by Round
      </div>

      {!timeline.claimedInGame ? (
        <p
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 'var(--font-sm)',
            color: 'var(--ink-3)',
            margin: '4px 0',
          }}
        >
          Mecatol Rex was never contested this game.
        </p>
      ) : (
        <MecatolStrip timeline={timeline} factions={factions} />
      )}
    </div>
  );
}

function MecatolStrip({
  timeline,
  factions,
}: {
  timeline: MecatolTimeline;
  factions: { factionId: string; color: string }[];
}) {
  const colorMap: Record<string, string> = {};
  for (const f of factions) {
    colorMap[f.factionId] = f.color;
  }

  const lastRound = timeline.rounds[timeline.rounds.length - 1];
  const finalOwner = lastRound?.factionId ?? null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        overflowX: 'auto',
        paddingBottom: 2,
      }}
    >
      {timeline.rounds.map((entry, i) => {
        const prevOwner = i > 0 ? (timeline.rounds[i - 1]?.factionId ?? null) : null;
        const isHandoff = i > 0 && entry.factionId !== prevOwner && entry.factionId !== null;
        const isFinal = entry.factionId !== null && entry.factionId === finalOwner && i === timeline.rounds.length - 1;
        const brandColor =
          entry.factionId !== null
            ? getFactionBrandColor(entry.factionId, colorMap[entry.factionId] ?? 'var(--ink-4)')
            : null;
        const abbrev = entry.factionId !== null ? entry.factionId.split(' ')[0] : null;

        return (
          <div
            key={entry.round}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '4px 6px',
              minWidth: 44,
              background: isHandoff ? 'var(--paper-2)' : 'transparent',
              border: isFinal ? '1px solid var(--accent)' : '1px solid transparent',
              borderRadius: 2,
            }}
          >
            {/* Round label */}
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 'var(--font-micro)',
                color: 'var(--ink-3)',
                lineHeight: 1,
              }}
            >
              R{entry.round}
            </span>

            {/* Faction dot or dash */}
            {brandColor !== null ? (
              <FactionDot color={brandColor} size={8} />
            ) : (
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 'var(--font-micro)',
                  color: 'var(--ink-4)',
                  lineHeight: 1,
                }}
              >
                —
              </span>
            )}

            {/* Faction abbreviation */}
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 'var(--font-micro)',
                color: entry.factionId !== null ? 'var(--ink-2)' : 'var(--ink-4)',
                lineHeight: 1,
                textAlign: 'center',
                maxWidth: 40,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: isFinal ? 700 : 400,
              }}
            >
              {abbrev ?? '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
