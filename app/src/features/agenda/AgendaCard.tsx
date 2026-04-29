import type { AgendaCrossGameStat } from '../../lib/aggregator/buildAgendaCrossGame';
import { lookupAgenda } from '../../lib/parser/agendas';
import { getFactionBrandColor } from '../../lib/factions/factionBrandColors';
import { Rule } from '../../shared';
import { EffectBlock } from './_shared/AgendaPrimitives';
import { AgendaAppearance } from './AgendaAppearance';

interface AgendaCardProps {
  stat: AgendaCrossGameStat;
}

const monoMicro = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 'var(--font-micro)',
  color: 'var(--ink-3)',
} as const;

export function AgendaCard({ stat }: AgendaCardProps) {
  const catalogEntry = lookupAgenda(stat.name) ?? null;
  const passRateStr = stat.passRate === null
    ? '—'
    : `${Math.round(stat.passRate * 100)}%`;

  const vpEntries = Object.entries(stat.vpDeltaByFaction);

  return (
    <div style={{ padding: '12px 0' }}>
      {/* Kicker row */}
      <div style={{ ...monoMicro, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4 }}>
        {stat.appearances} appearances · {passRateStr} pass rate
      </div>

      {/* Agenda name */}
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 'var(--font-display-sm)',
          fontWeight: 800,
          fontStyle: 'italic',
          lineHeight: 1.1,
          marginBottom: 4,
        }}
      >
        {stat.name}
      </div>

      {/* Type badges */}
      {catalogEntry !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
              padding: '0 3px',
              lineHeight: '11px',
              display: 'inline-block',
              height: 11,
              ...(catalogEntry.type === 'law'
                ? { background: 'var(--ink)', color: 'var(--paper)' }
                : { border: '1px solid var(--ink-3)', color: 'var(--ink-3)' }),
            }}
          >
            {catalogEntry.type === 'law' ? 'LAW' : 'DIR'}
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
              color: 'var(--ink-3)',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.05em',
            }}
          >
            {catalogEntry.expansion}
          </span>
        </div>
      )}

      {/* Effect text */}
      <EffectBlock entry={catalogEntry} />

      {/* VP net row */}
      {vpEntries.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', margin: '4px 0' }}>
          <span style={{ ...monoMicro, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
            Net VP impact:
          </span>
          {vpEntries.map(([faction, delta]) => (
            <span
              key={faction}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 'var(--font-micro)',
                color: getFactionBrandColor(faction, 'var(--ink)'),
                fontWeight: 700,
              }}
            >
              {faction} {delta > 0 ? '+' : ''}{delta}
            </span>
          ))}
        </div>
      )}

      {/* Appearances list */}
      <Rule />
      {stat.appearances_list.map((a, i) => (
        <div key={`${a.gameId}-${a.round}-${a.indexInRound}`}>
          <AgendaAppearance appearance={a} />
          {i < stat.appearances_list.length - 1 && <Rule />}
        </div>
      ))}
    </div>
  );
}
