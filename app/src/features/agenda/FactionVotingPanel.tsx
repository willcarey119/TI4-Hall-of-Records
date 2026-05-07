import type { AgendaCrossGameSummary, FactionAgendaVote } from '../../lib/aggregator/buildAgendaCrossGame';
import { getFactionBrandColor } from '../../lib/factions/factionBrandColors';

interface FactionVotingPanelProps {
  summary: AgendaCrossGameSummary;
  topN?: number;
}

const monoMicro = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 'var(--font-micro)',
} as const;

function abbrev(name: string, max = 15): string {
  return name.length <= max ? name : name.slice(0, max - 1) + '…';
}

type VoteLabel = 'FOR' | 'AGN' | 'ELC' | '—';

function dominantVote(fv: FactionAgendaVote): VoteLabel {
  const { forCount, againstCount, electCount } = fv;
  if (forCount > againstCount && forCount > electCount) return 'FOR';
  if (againstCount >= forCount && againstCount > electCount) return 'AGN';
  if (electCount > 0) return 'ELC';
  return '—';
}

function voteColor(label: VoteLabel): string {
  if (label === 'FOR') return 'var(--accent)';
  if (label === 'AGN') return 'var(--ink-2)';
  if (label === 'ELC') return 'var(--ink-3)';
  return 'var(--ink-4)';
}

export function FactionVotingPanel({ summary, topN = 8 }: FactionVotingPanelProps) {
  const topAgendas = summary.agendas.slice(0, topN);

  const hasData = topAgendas.length > 0;

  // Collect all faction IDs that appear in any of the top-N agendas
  const factionSet = new Set<string>();
  for (const agenda of topAgendas) {
    const voting = summary.factionVotingByAgenda[agenda.name];
    if (voting !== undefined) {
      for (const fv of voting.factions) {
        factionSet.add(fv.factionId);
      }
    }
  }
  const factions = Array.from(factionSet).sort();

  return (
    <div style={{ padding: '12px 0' }}>
      {/* Kicker */}
      <div
        style={{
          ...monoMicro,
          color: 'var(--ink-3)',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
          marginBottom: 8,
        }}
      >
        Faction Voting Patterns
      </div>

      {!hasData && (
        <div style={{ ...monoMicro, color: 'var(--ink-3)' }}>
          No voting data available.
        </div>
      )}

      {hasData && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                borderCollapse: 'collapse',
                ...monoMicro,
                color: 'var(--ink)',
              }}
            >
              <thead>
                <tr>
                  {/* Empty top-left corner */}
                  <th scope="col" style={{ padding: '2px 6px 2px 0', textAlign: 'left' }} />
                  {topAgendas.map((agenda) => (
                    <th
                      scope="col"
                      key={agenda.name}
                      title={agenda.name}
                      style={{
                        padding: '2px 4px',
                        fontWeight: 'normal',
                        color: 'var(--ink-2)',
                        textAlign: 'center',
                        whiteSpace: 'nowrap' as const,
                        maxWidth: 80,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {abbrev(agenda.name)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {factions.map((factionId) => (
                  <tr key={factionId}>
                    <th
                      scope="row"
                      style={{
                        padding: '2px 6px 2px 0',
                        color: getFactionBrandColor(factionId, 'var(--ink)'),
                        whiteSpace: 'nowrap' as const,
                        fontWeight: 700,
                        textAlign: 'left',
                      }}
                    >
                      {factionId}
                    </th>
                    {topAgendas.map((agenda) => {
                      const voting = summary.factionVotingByAgenda[agenda.name];
                      const fv =
                        voting !== undefined
                          ? voting.factions.find((f) => f.factionId === factionId)
                          : undefined;
                      const label: VoteLabel =
                        fv !== undefined
                          ? dominantVote(fv)
                          : '—';
                      return (
                        <td
                          key={agenda.name}
                          style={{
                            padding: '2px 6px',
                            textAlign: 'center',
                            color: voteColor(label),
                            fontWeight: label === 'FOR' ? 700 : 'normal',
                          }}
                        >
                          {label}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div
            aria-hidden="true"
            style={{
              ...monoMicro,
              color: 'var(--ink-3)',
              marginTop: 8,
            }}
          >
            {'FOR = voted For | AGN = voted Against | ELC = elected | — = abstained/no data'}
          </div>
        </>
      )}
    </div>
  );
}
