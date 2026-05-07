import { FactionDot } from '../../shared';
import { getFactionBrandColor } from '../../lib/factions/factionBrandColors';
import type { MecatolTimeline } from '../../lib/planets/buildMecatolTimeline';

interface Props {
  timeline: MecatolTimeline;
  factions: { factionId: string; color: string }[];
}

interface ChangeEvent {
  round: number;
  type: 'first-claim' | 'seized' | 'lost' | 'retaken';
  newOwner: string;
  prevOwner: string | null;
}

function buildChangeLog(timeline: MecatolTimeline): ChangeEvent[] {
  const events: ChangeEvent[] = [];
  const seenOwners = new Set<string>();
  let firstClaimSeen = false;
  let prevOwner: string | null = null;

  for (const round of timeline.rounds) {
    if (round.factionId === null) {
      if (prevOwner !== null) {
        // Owner lost mecatol with no successor
        events.push({ round: round.round, type: 'lost', newOwner: prevOwner, prevOwner });
      }
      prevOwner = null;
      continue;
    }
    if (round.factionId !== prevOwner) {
      let type: ChangeEvent['type'];
      if (!firstClaimSeen) {
        type = 'first-claim';
        firstClaimSeen = true;
      } else if (seenOwners.has(round.factionId)) {
        type = 'retaken';
      } else {
        type = 'seized';
      }
      events.push({ round: round.round, type, newOwner: round.factionId, prevOwner });
      seenOwners.add(round.factionId);
    }
    prevOwner = round.factionId;
  }
  return events;
}

export function MecatolWidget({ timeline, factions }: Props) {
  const colorMap: Record<string, string> = {};
  for (const f of factions) {
    colorMap[f.factionId] = f.color;
  }

  const claimedRounds = timeline.rounds.filter(r => r.factionId !== null);
  const lastRound = timeline.rounds[timeline.rounds.length - 1];
  const finalOwner = lastRound?.factionId ?? null;
  const firstClaimRound = claimedRounds[0]?.round ?? null;

  // Count handoffs (changes between two non-null owners)
  let turnovers = 0;
  let prev: string | null = null;
  for (const r of timeline.rounds) {
    if (r.factionId !== null && prev !== null && r.factionId !== prev) turnovers++;
    if (r.factionId !== null) prev = r.factionId;
  }

  const changeLog = buildChangeLog(timeline);

  if (!timeline.claimedInGame) {
    return (
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--ink-3)',
            borderBottom: '1px solid var(--rule)',
            paddingBottom: 3,
            marginBottom: 4,
          }}
        >
          Mecatol Rex · Control by Round
        </div>
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
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: 14,
        background: 'var(--paper-2)',
        border: '1px solid var(--rule)',
        padding: 14,
      }}
    >
      {/* Header — title + summary stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 10,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: 'var(--font-body)',
              fontWeight: 700,
              fontStyle: 'italic',
              lineHeight: 1.1,
            }}
          >
            Mecatol Rex.
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--ink-3)',
              marginTop: 2,
            }}
          >
            Seat of the Galactic Council
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-sm)', fontWeight: 700, lineHeight: 1 }}>
              {turnovers}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', marginTop: 2 }}>
              Turnovers
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 'var(--font-sm)',
                fontWeight: 700,
                lineHeight: 1,
                color: finalOwner !== null ? getFactionBrandColor(finalOwner, colorMap[finalOwner] ?? 'var(--ink)') : 'var(--ink-3)',
              }}
            >
              {finalOwner !== null ? (finalOwner.split(' ')[0] ?? finalOwner) : '—'}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', marginTop: 2 }}>
              Final Holder
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-sm)', fontWeight: 700, lineHeight: 1 }}>
              {firstClaimRound !== null ? `R${firstClaimRound}` : '—'}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', marginTop: 2 }}>
              First Claimed
            </div>
          </div>
        </div>
      </div>

      {/* Round-by-round strip with event badges */}
      <div style={{ display: 'flex', gap: 4, marginBottom: changeLog.length > 0 ? 12 : 0 }}>
        {timeline.rounds.map((entry, i) => {
          const prevOwner = i > 0 ? (timeline.rounds[i - 1]?.factionId ?? null) : null;
          const isUnclaimed = entry.factionId === null;
          const isFirstClaim = !isUnclaimed && prevOwner === null && i === 0 && entry.factionId === claimedRounds[0]?.factionId;
          const isFirstClaimMid = !isUnclaimed && prevOwner === null && i > 0 && claimedRounds[0]?.round === entry.round;
          const isHandoff = !isUnclaimed && prevOwner !== null && entry.factionId !== prevOwner;
          const isHeld = !isUnclaimed && prevOwner === entry.factionId;
          const isFinal = !isUnclaimed && entry.factionId === finalOwner && i === timeline.rounds.length - 1;
          const brandColor = entry.factionId !== null
            ? getFactionBrandColor(entry.factionId, colorMap[entry.factionId] ?? 'var(--ink-4)')
            : null;
          const abbrev = entry.factionId !== null ? (entry.factionId.split(' ')[0] ?? entry.factionId) : null;

          let badgeText = '';
          let badgeBg = '';
          let badgeColor = '';
          let badgeBorder = '';
          if (isFirstClaim || isFirstClaimMid) {
            badgeText = 'First';
            badgeBg = '#fbeaea';
            badgeColor = 'var(--accent)';
            badgeBorder = 'var(--accent)';
          } else if (isHandoff) {
            badgeText = 'Taken';
            badgeBg = '#dceeff';
            badgeColor = '#2a5a9a';
            badgeBorder = '#99bfe8';
          } else if (isHeld) {
            badgeText = 'Held';
            badgeBg = 'var(--paper-3)';
            badgeColor = 'var(--ink-4)';
            badgeBorder = 'var(--ink-4)';
          }

          return (
            <div key={entry.round} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 'var(--font-micro)',
                  color: 'var(--ink-4)',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}
              >
                R{entry.round}
              </div>
              <div
                style={{
                  background: 'var(--paper-3)',
                  border: isFinal ? '1px solid var(--accent)' : '1px solid var(--ink-4)',
                  padding: '6px 4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  flex: 1,
                  opacity: isUnclaimed ? 0.4 : 1,
                  minHeight: 60,
                }}
              >
                {brandColor !== null ? (
                  <FactionDot color={brandColor} size={10} />
                ) : (
                  <span style={{ width: 10, height: 10, fontSize: 'var(--font-micro)', color: 'var(--ink-4)' }}>—</span>
                )}
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 'var(--font-micro)',
                    color: 'var(--ink-2)',
                    textAlign: 'center',
                    lineHeight: 1.1,
                    wordBreak: 'break-word',
                  }}
                >
                  {abbrev ?? 'Unclaimed'}
                </span>
                {badgeText !== '' && (
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 'var(--font-micro)',
                      padding: '1px 3px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: badgeBg,
                      color: badgeColor,
                      border: `1px solid ${badgeBorder}`,
                    }}
                  >
                    {badgeText}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Change log */}
      {changeLog.length > 0 && (
        <div style={{ borderTop: '1px solid var(--ink-4)', paddingTop: 10 }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--ink-3)',
              marginBottom: 6,
            }}
          >
            Change Log
          </div>
          {changeLog.map((ev, i) => {
            const newColor = getFactionBrandColor(ev.newOwner, colorMap[ev.newOwner] ?? 'var(--ink)');
            const prevColor = ev.prevOwner !== null
              ? getFactionBrandColor(ev.prevOwner, colorMap[ev.prevOwner] ?? 'var(--ink)')
              : null;
            let narrative: React.ReactNode;
            if (ev.type === 'first-claim') {
              narrative = (
                <>
                  <strong style={{ color: newColor }}>{ev.newOwner}</strong> captured Mecatol Rex — first claim, Custodians VP awarded.
                </>
              );
            } else if (ev.type === 'seized') {
              narrative = ev.prevOwner !== null ? (
                <>
                  <strong style={{ color: newColor }}>{ev.newOwner}</strong> seized Mecatol Rex from <strong style={{ color: prevColor ?? 'var(--ink)' }}>{ev.prevOwner}</strong>.
                </>
              ) : (
                <>
                  <strong style={{ color: newColor }}>{ev.newOwner}</strong> claimed an unclaimed Mecatol Rex.
                </>
              );
            } else if (ev.type === 'retaken') {
              narrative = ev.prevOwner !== null ? (
                <>
                  <strong style={{ color: newColor }}>{ev.newOwner}</strong> retook Mecatol Rex from <strong style={{ color: prevColor ?? 'var(--ink)' }}>{ev.prevOwner}</strong>.
                </>
              ) : (
                <>
                  <strong style={{ color: newColor }}>{ev.newOwner}</strong> reclaimed Mecatol Rex.
                </>
              );
            } else {
              narrative = (
                <>
                  <strong style={{ color: newColor }}>{ev.newOwner}</strong> lost control of Mecatol Rex.
                </>
              );
            }
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                  marginBottom: 5,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: 'var(--font-micro)',
                }}
              >
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 'var(--font-micro)',
                    color: 'var(--ink-4)',
                    background: 'var(--paper-3)',
                    border: '1px solid var(--ink-4)',
                    padding: '1px 5px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  R{ev.round}
                </span>
                <span style={{ color: 'var(--ink-2)', lineHeight: 1.3 }}>
                  {narrative}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
