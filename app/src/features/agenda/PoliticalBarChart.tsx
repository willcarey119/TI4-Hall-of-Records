import { useState, useMemo } from 'react';
import type { AgendaCrossGameStat } from '../../lib/aggregator';
import { Label, Tooltip } from '../../shared';

const VOTE_FOR = '#2a6e3a';
const VOTE_AGAINST = '#a02020';

type Filter = 'all' | 'law' | 'directive' | 'passes' | 'fails' | 'contested';

interface AggregatedRow {
  agenda: string;
  agendaType: 'law' | 'directive' | 'elect';
  appearances: number;
  totalFor: number;
  totalAgainst: number;
  forPct: number;
  againstPct: number;
  passCount: number;
  failCount: number;
  electCount: number;
  modalOutcome: 'passed' | 'failed' | 'split' | 'elect';
  topElected: { faction: string; count: number }[];
}

function aggregate(stat: AgendaCrossGameStat): AggregatedRow {
  let totalFor = 0;
  let totalAgainst = 0;
  for (const a of stat.appearances_list) {
    totalFor += a.totalFor;
    totalAgainst += a.totalAgainst;
  }
  const totalVotes = totalFor + totalAgainst;
  const forPct = totalVotes > 0 ? totalFor / totalVotes : 0;
  const againstPct = totalVotes > 0 ? totalAgainst / totalVotes : 0;

  // Determine type from appearance outcome shape
  const isElect = stat.electCount > 0 && stat.passCount === 0 && stat.failCount === 0;
  // Only laws can pass and become permanent — but the stat doesn't carry that flag.
  // Fall back to a heuristic: if all binary appearances were the same, treat outcomes
  // accordingly. Set the badge based on counts.
  let modalOutcome: AggregatedRow['modalOutcome'] = 'split';
  if (isElect) modalOutcome = 'elect';
  else if (stat.passCount > stat.failCount) modalOutcome = 'passed';
  else if (stat.failCount > stat.passCount) modalOutcome = 'failed';

  // Top elected factions — only from elect-type appearances
  const electTally = new Map<string, number>();
  for (const a of stat.appearances_list) {
    if (a.electedFaction !== undefined) {
      electTally.set(a.electedFaction, (electTally.get(a.electedFaction) ?? 0) + 1);
    }
  }
  const topElected = [...electTally.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([faction, count]) => ({ faction, count }));

  return {
    agenda: stat.name,
    agendaType: isElect ? 'elect' : 'law', // we don't reliably know law vs directive without dictionary
    appearances: stat.appearances,
    totalFor,
    totalAgainst,
    forPct,
    againstPct,
    passCount: stat.passCount,
    failCount: stat.failCount,
    electCount: stat.electCount,
    modalOutcome,
    topElected,
  };
}

function applyFilter(row: AggregatedRow, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'passes') return row.passCount > row.failCount;
  if (filter === 'fails') return row.failCount > row.passCount;
  if (filter === 'contested') {
    if (row.modalOutcome === 'elect') return false;
    return Math.abs(row.forPct - row.againstPct) < 0.15;
  }
  // law/directive — treat elect rows as 'law' since we can't distinguish
  if (filter === 'law') return row.modalOutcome !== 'elect';
  if (filter === 'directive') return false; // no reliable signal
  return true;
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '3px 9px',
        border: '1px solid var(--ink-4)',
        background: active ? 'var(--ink)' : 'var(--paper-2)',
        color: active ? 'var(--paper)' : 'var(--ink-3)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function OutcomeBadge({ row }: { row: AggregatedRow }) {
  if (row.modalOutcome === 'elect') {
    return (
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '2px 5px',
          border: '1px solid var(--cool)',
          background: '#e8f0ff',
          color: 'var(--cool)',
          whiteSpace: 'nowrap',
          display: 'inline-block',
        }}
      >
        Elect
      </span>
    );
  }
  if (row.modalOutcome === 'passed') {
    return (
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '2px 5px',
          border: `1px solid ${VOTE_FOR}`,
          background: '#d8f0dc',
          color: VOTE_FOR,
          whiteSpace: 'nowrap',
          display: 'inline-block',
        }}
      >
        Passes
      </span>
    );
  }
  if (row.modalOutcome === 'failed') {
    return (
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '2px 5px',
          border: `1px solid ${VOTE_AGAINST}`,
          background: '#f5d8d8',
          color: VOTE_AGAINST,
          whiteSpace: 'nowrap',
          display: 'inline-block',
        }}
      >
        Fails
      </span>
    );
  }
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 8,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '2px 5px',
        border: '1px solid var(--ink-3)',
        background: 'var(--paper-3)',
        color: 'var(--ink-3)',
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      Split
    </span>
  );
}

function Row({ row }: { row: AggregatedRow }) {
  const isElect = row.modalOutcome === 'elect';
  const closeLabel = !isElect && Math.abs(row.forPct - row.againstPct) < 0.15;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr 80px',
        alignItems: 'center',
        borderBottom: '1px solid var(--ink-4)',
        background: 'var(--paper-2)',
      }}
    >
      <div
        style={{
          padding: '7px 10px',
          borderRight: '1px solid var(--ink-4)',
        }}
      >
        <div
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {row.agenda}
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 8,
            color: 'var(--ink-4)',
            marginTop: 2,
          }}
        >
          {row.appearances} appearance{row.appearances === 1 ? '' : 's'}
        </div>
      </div>

      <div style={{ padding: '0 10px', position: 'relative' }}>
        {isElect ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 18 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'var(--ink-3)' }}>
              Most elected:
            </span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {row.topElected.length === 0 ? (
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-4)' }}>—</span>
              ) : (
                row.topElected.map(({ faction, count }) => (
                  <span
                    key={faction}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      background: 'var(--paper-3)',
                      border: '1px solid var(--ink-4)',
                      padding: '1px 6px',
                    }}
                  >
                    {faction} × {count}
                  </span>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            <div style={{ height: 18, display: 'flex', alignItems: 'stretch', position: 'relative' }}>
              <div
                style={{
                  width: `${row.forPct * 100}%`,
                  background: VOTE_FOR,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  paddingLeft: 4,
                }}
              >
                {!closeLabel && row.forPct > 0.1 && (
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.95)', whiteSpace: 'nowrap' }}>
                    {Math.round(row.forPct * 100)}%
                  </span>
                )}
              </div>
              <div
                style={{
                  width: `${row.againstPct * 100}%`,
                  background: VOTE_AGAINST,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 4,
                }}
              >
                {!closeLabel && row.againstPct > 0.1 && (
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.95)', whiteSpace: 'nowrap' }}>
                    {Math.round(row.againstPct * 100)}%
                  </span>
                )}
              </div>
              {/* 50% center hairline */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: 'var(--ink-3)',
                  pointerEvents: 'none',
                }}
              />
            </div>
            {closeLabel && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'var(--ink-3)', marginTop: 2 }}>
                <span style={{ color: VOTE_FOR }}>{Math.round(row.forPct * 100)}% For</span>
                <span style={{ color: VOTE_AGAINST }}>{Math.round(row.againstPct * 100)}% Against</span>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ padding: '7px 8px', borderLeft: '1px solid var(--ink-4)', textAlign: 'center' }}>
        <OutcomeBadge row={row} />
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color: 'var(--ink-3)',
            marginTop: 2,
          }}
        >
          {row.passCount > 0 || row.failCount > 0
            ? `${row.passCount}/${row.passCount + row.failCount}`
            : `${row.electCount}/${row.electCount}`}
        </div>
      </div>
    </div>
  );
}

interface Props {
  agendas: AgendaCrossGameStat[];
}

export function PoliticalBarChart({ agendas }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const rows = useMemo(() => {
    return agendas
      .map(aggregate)
      .filter(r => applyFilter(r, filter))
      .sort((a, b) => b.forPct - a.forPct);
  }, [agendas, filter]);

  if (agendas.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <Label>
        Resolution Record · Political Bar
        <Tooltip text="Each row shows the cross-game vote split. Green grows from the left edge (For), red from the right (Against). The center hairline marks 50% — bars crossing it indicate a landslide; bars near it show contested votes." />
      </Label>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, marginBottom: 8 }}>
        <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
        <FilterChip label="Usually Passes" active={filter === 'passes'} onClick={() => setFilter('passes')} />
        <FilterChip label="Usually Fails" active={filter === 'fails'} onClick={() => setFilter('fails')} />
        <FilterChip label="Contested" active={filter === 'contested'} onClick={() => setFilter('contested')} />
      </div>

      {/* Axis labels */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 80px', marginBottom: 2 }}>
        <div />
        <div style={{ position: 'relative', height: 16, padding: '0 10px' }}>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: VOTE_FOR,
              position: 'absolute',
              right: 'calc(50% + 8px)',
            }}
          >
            ← For
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 8,
              color: 'var(--ink-3)',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            50%
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: VOTE_AGAINST,
              position: 'absolute',
              left: 'calc(50% + 8px)',
            }}
          >
            Against →
          </span>
        </div>
        <div />
      </div>

      <div style={{ border: '1px solid var(--ink-4)' }}>
        {rows.length === 0 ? (
          <div
            style={{
              padding: 16,
              textAlign: 'center',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: 'var(--ink-3)',
            }}
          >
            No agendas match this filter.
          </div>
        ) : (
          rows.map(r => <Row key={r.agenda} row={r} />)
        )}
      </div>
    </div>
  );
}
