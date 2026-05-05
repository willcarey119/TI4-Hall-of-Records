// app/src/features/game-detail/AgendaSection.tsx
import { useMemo } from 'react';
import { useGame } from './GameContext';
import { buildAgendaSummary, type AgendaDisplayEntry } from '../../lib/agenda/buildAgendaSummary';
import { Label, Rule, SectionDesc, FactionDot } from '../../shared';
import { getFactionBrandColor } from '../../lib/factions/factionBrandColors';
import type { ParsedGame } from '../../lib/parser/types';

const VOTE_FOR_BG = '#2a6e3a';
const VOTE_AGAINST_BG = '#a02020';

function VoteLegend() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        flexWrap: 'wrap',
        marginBottom: 12,
        padding: '6px 10px',
        background: 'var(--paper-2)',
        border: '1px solid var(--ink-4)',
      }}
    >
      <LegendItem swatch={VOTE_FOR_BG} label="For / elected" />
      <LegendItem swatch={VOTE_AGAINST_BG} label="Against" />
      <LegendItem swatch="var(--paper-3)" label="Abstained" outlined />
      <LegendItem swatch="#d8eaf8" label="Rider bet" outlined outlineColor="#9ac0e8" />
    </div>
  );
}

function LegendItem({
  swatch,
  label,
  outlined = false,
  outlineColor = 'var(--ink-4)',
}: {
  swatch: string;
  label: string;
  outlined?: boolean;
  outlineColor?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--ink-2)',
      }}
    >
      <span
        style={{
          width: 12,
          height: 10,
          background: swatch,
          ...(outlined ? { border: `1px solid ${outlineColor}` } : {}),
        }}
      />
      {label}
    </div>
  );
}

function TypeBadge({ entry, electedFaction }: { entry: AgendaDisplayEntry['entry']; electedFaction: string | undefined }) {
  let label = 'DIR';
  let bg = 'var(--paper-3)';
  let color = 'var(--ink-3)';
  let border = 'var(--ink-3)';

  if (entry?.type === 'law') {
    label = 'Law';
    bg = '#f5ead0';
    color = '#8a6020';
    border = '#8a6020';
  } else if (entry?.type === 'directive') {
    label = 'Directive';
  }
  if (electedFaction !== undefined) {
    label = 'Elect';
    bg = '#e8f0ff';
    color = 'var(--cool)';
    border = 'var(--cool)';
  }

  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 8,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        padding: '1px 5px',
        border: `1px solid ${border}`,
        background: bg,
        color,
      }}
    >
      {label}
    </span>
  );
}

function OutcomeBadge({ entry }: { entry: AgendaDisplayEntry }) {
  if (entry.electedFaction !== undefined) {
    return (
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '2px 7px',
          border: '1px solid var(--cool)',
          background: '#e8f0ff',
          color: 'var(--cool)',
          fontWeight: 700,
        }}
      >
        Elected: {entry.electedFaction}
      </span>
    );
  }
  if (entry.passed) {
    return (
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '2px 7px',
          border: `1px solid ${VOTE_FOR_BG}`,
          background: '#d8f0dc',
          color: VOTE_FOR_BG,
          fontWeight: 700,
        }}
      >
        Passed — For
      </span>
    );
  }
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '2px 7px',
        border: `1px solid ${VOTE_AGAINST_BG}`,
        background: '#f5d8d8',
        color: VOTE_AGAINST_BG,
        fontWeight: 700,
      }}
    >
      Failed — Against
    </span>
  );
}

function effectText(entry: AgendaDisplayEntry): string {
  const e = entry.entry;
  if (e === null) return '';
  if (e.elect === null) {
    return entry.passed ? e.forEffect : e.againstEffect;
  }
  return e.effect;
}

interface AgendaCardProps {
  entry: AgendaDisplayEntry;
  game: ParsedGame;
  vpDeltas: Map<number, Record<string, number>>;
}

function AgendaCard({ entry, game, vpDeltas }: AgendaCardProps) {
  const factionMap: Record<string, { color: string; brand: string }> = {};
  for (const f of game.factions) {
    factionMap[f.factionId] = { color: f.color, brand: getFactionBrandColor(f.factionId, f.color) };
  }

  const isElect = entry.electedFaction !== undefined;
  const maxVotes = Math.max(1, ...entry.votes.map(v => v.votes));
  const ridersByFaction = new Set(entry.riders.map(r => r.faction));
  const vpDelta = vpDeltas.get(entry.timestamp) ?? {};

  // Order votes: by vote count descending, then alpha; abstained at end
  const factionsWithVotes = new Set(entry.votes.map(v => v.faction));
  const allFactionRows = [
    ...entry.votes
      .slice()
      .sort((a, b) => b.votes - a.votes),
    ...game.factions
      .filter(f => !factionsWithVotes.has(f.factionId))
      .map(f => ({ faction: f.factionId, outcome: 'Abstain', votes: 0 })),
  ];

  return (
    <div
      style={{
        border: '1px solid var(--rule)',
        background: 'var(--paper-2)',
        marginBottom: 10,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 12px 8px',
          borderBottom: '1px solid var(--ink-4)',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 3 }}>
            <TypeBadge entry={entry.entry} electedFaction={entry.electedFaction} />
          </div>
          <div
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: 14,
              fontWeight: 700,
              fontStyle: 'italic',
              lineHeight: 1.2,
              marginBottom: 4,
            }}
          >
            &ldquo;{entry.agenda}.&rdquo;
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
            <OutcomeBadge entry={entry} />
            {effectText(entry) !== '' && (
              <span
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: 10,
                  color: 'var(--ink-3)',
                  fontStyle: 'italic',
                  lineHeight: 1.35,
                  flex: 1,
                  minWidth: 200,
                }}
              >
                {effectText(entry)}
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color: 'var(--ink-4)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          R{entry.round} · A{entry.indexInRound}
        </div>
      </div>

      {/* Body — vote rows */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {allFactionRows.map((v) => {
          const fm = factionMap[v.faction];
          if (fm === undefined) return null;
          const isFor = v.outcome === 'For';
          const isAgainst = !isFor && v.outcome !== 'Abstain';
          const isAbstain = v.outcome === 'Abstain' || v.votes === 0;
          const hasRider = ridersByFaction.has(v.faction);
          const widthPct = isAbstain ? 100 : (v.votes / maxVotes) * 100;

          let barBg = 'var(--paper-3)';
          if (isFor) barBg = isElect ? VOTE_FOR_BG : VOTE_FOR_BG;
          else if (isAgainst) barBg = VOTE_AGAINST_BG;

          let outcomeTag: { text: string; bg: string; color: string; border: string } | null = null;
          if (!isAbstain && !isElect) {
            const won = isFor === entry.passed;
            outcomeTag = won
              ? { text: 'Won', bg: '#d8f0dc', color: VOTE_FOR_BG, border: '#88c098' }
              : { text: 'Lost', bg: '#f5d8d8', color: VOTE_AGAINST_BG, border: '#e09090' };
          }

          return (
            <div key={v.faction} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FactionDot color={fm.brand} size={8} />
              <div
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: 10,
                  color: 'var(--ink-2)',
                  width: 130,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {v.faction}
              </div>
              <div style={{ flex: 1, background: 'var(--ink-4)', height: 14, display: 'flex' }}>
                {isAbstain ? (
                  <div style={{ width: '100%', background: 'var(--paper-3)', border: '1px solid var(--ink-4)', height: '100%' }} />
                ) : (
                  <div
                    style={{
                      width: `${widthPct}%`,
                      background: barBg,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: 3,
                    }}
                  >
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: '#fff', whiteSpace: 'nowrap' }}>
                      {v.votes} {isFor ? 'For' : isAgainst ? 'Against' : 'votes'}
                    </span>
                  </div>
                )}
              </div>
              {isAbstain && (
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 8,
                    color: 'var(--ink-4)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Abstained
                </span>
              )}
              {hasRider && (
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 8,
                    padding: '0 4px',
                    background: '#d8eaf8',
                    border: '1px solid #9ac0e8',
                    color: '#2a5a8c',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Rider
                </span>
              )}
              {outcomeTag !== null && (
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 8,
                    padding: '0 4px',
                    background: outcomeTag.bg,
                    border: `1px solid ${outcomeTag.border}`,
                    color: outcomeTag.color,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {outcomeTag.text}
                </span>
              )}
            </div>
          );
        })}

        {/* Total row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            paddingTop: 5,
            borderTop: '1px solid var(--ink-4)',
            marginTop: 2,
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--ink-3)',
              width: 144,
              flexShrink: 0,
            }}
          >
            Total
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              gap: 6,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
            }}
          >
            <span style={{ color: VOTE_FOR_BG, fontWeight: 700 }}>{entry.totalFor} For</span>
            <span style={{ color: 'var(--ink-4)' }}>·</span>
            <span style={{ color: VOTE_AGAINST_BG, fontWeight: 700 }}>{entry.totalAgainst} Against</span>
          </div>
        </div>

        {/* VP beneficiary strip */}
        {Object.keys(vpDelta).length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
              marginTop: 6,
              paddingTop: 6,
              borderTop: '1px solid var(--ink-4)',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ink-3)',
              }}
            >
              VP Awarded
            </span>
            {Object.entries(vpDelta).map(([factionId, delta]) => {
              const fm = factionMap[factionId];
              const isLoss = delta < 0;
              return (
                <div
                  key={factionId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 10,
                    color: 'var(--ink-2)',
                    background: isLoss ? '#f5d8d8' : 'var(--paper-3)',
                    border: `1px solid ${isLoss ? '#e09090' : 'var(--ink-4)'}`,
                    padding: '1px 7px',
                  }}
                >
                  <FactionDot color={fm?.brand ?? '#aaa'} size={6} />
                  {factionId}
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      color: isLoss ? VOTE_AGAINST_BG : 'var(--accent)',
                      fontWeight: 700,
                    }}
                  >
                    {delta > 0 ? '+' : ''}{delta}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function AgendaSection() {
  const { game } = useGame();

  const summary = useMemo(
    () =>
      game
        ? buildAgendaSummary(game.agendaResolutions, game.vpEvents)
        : null,
    [game],
  );

  // Build VP deltas per agenda timestamp from agenda-sourced vpEvents
  const vpDeltasByTimestamp = useMemo(() => {
    const m = new Map<number, Record<string, number>>();
    if (game === null) return m;
    for (const ev of game.vpEvents) {
      if (ev.source !== 'agenda') continue;
      const existing = m.get(ev.timestamp) ?? {};
      existing[ev.faction] = (existing[ev.faction] ?? 0) + ev.points;
      m.set(ev.timestamp, existing);
    }
    return m;
  }, [game]);

  if (game === null || summary === null) return null;

  const passedCount = summary.entries.filter((e) => e.passed).length;

  return (
    <section
      id="agenda"
      data-section="agenda"
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
        <span>The Galactic Senate · Record</span>
        <span>{summary.entries.length} agendas · {passedCount} passed</span>
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
        Laws of the Realm.
      </div>
      <div style={{ fontSize: 'var(--font-sm)', color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 4 }}>
        {summary.deckText}
      </div>

      <SectionDesc>
        Political agendas voted on during this game's Galactic Senate phases. Each card shows how factions voted, what passed or failed, and any VP gained or lost as a result.
      </SectionDesc>

      <Rule weight="double" />

      {summary.entries.length === 0 ? (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            color: 'var(--ink-3)',
            padding: '8px 0',
          }}
        >
          No agendas resolved this game.
        </div>
      ) : (
        <>
          <VoteLegend />
          {summary.entries.map((entry) => (
            <AgendaCard
              key={`${entry.round}-${entry.indexInRound}-${entry.agenda}-${entry.timestamp}`}
              entry={entry}
              game={game}
              vpDeltas={vpDeltasByTimestamp}
            />
          ))}
        </>
      )}

      {/* Net Beneficiaries */}
      {summary.netBeneficiaries.length > 0 && (
        <>
          <Rule />
          <Label>Net Beneficiaries (VP)</Label>
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', lineHeight: 1.5, margin: '2px 0 6px' }}>
            Net VP delta per faction from all agenda outcomes combined this game. Positive = net gain from agenda results; negative = net loss.
          </p>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
            {summary.netBeneficiaries.map(({ factionId, vpDelta }) => (
              <span
                key={factionId}
                style={{
                  background: 'var(--paper-2)',
                  padding: '1px 5px',
                  border: '1px solid var(--ink-4)',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 'var(--font-micro)',
                  opacity: vpDelta < 0 ? 0.6 : 1,
                }}
              >
                {factionId} {vpDelta > 0 ? '+' : ''}{vpDelta}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
