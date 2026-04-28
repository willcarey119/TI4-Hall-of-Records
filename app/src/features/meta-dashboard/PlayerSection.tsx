import { useMemo } from 'react';
import { useMeta } from './MetaContext';
import { Rule } from '../../shared';
import { usePlayerNames } from '../player-attribution/usePlayerNames';
import { buildPlayerStats, collectAllRawNames, type PlayerStat } from '../../lib/attribution/buildPlayerStats';

function NameRow({
  rawName,
  value,
  onSave,
}: {
  rawName: string;
  value: string;
  onSave: (val: string) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '3px 0',
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          color: 'var(--ink-2)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {rawName}
      </span>
      <input
        key={value}
        defaultValue={value}
        placeholder="first name"
        onBlur={e => { onSave(e.currentTarget.value); }}
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          border: '1px solid var(--rule)',
          background: 'var(--paper-2)',
          color: 'var(--ink)',
          padding: '2px 6px',
          width: 100,
          outline: 'none',
        }}
      />
    </div>
  );
}

function PlayerCard({ player }: { player: PlayerStat }) {
  const pct = Math.round(player.winRate * 100);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '6px 0',
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--ink)',
          flex: 1,
        }}
      >
        {player.canonicalName}
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          color: 'var(--ink-2)',
        }}
      >
        {player.gamesPlayed}g · {pct}% W
      </div>
      {player.favoriteFaction !== null && (
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color: 'var(--ink-3)',
            maxWidth: 120,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          fav: {player.favoriteFaction}
        </div>
      )}
    </div>
  );
}

export function PlayerSection() {
  const { games } = useMeta();
  const { nameMap, setName } = usePlayerNames();

  const allRawNames = useMemo(() => collectAllRawNames(games), [games]);
  const { players, totalRawNames } = useMemo(
    () => buildPlayerStats(games, nameMap),
    [games, nameMap],
  );

  return (
    <section
      id="players"
      data-section="players"
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}
    >
      <Rule weight="double" />
      <div
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--ink)',
          padding: '8px 0 2px',
        }}
      >
        PLAYERS
      </div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
          marginBottom: 12,
        }}
      >
        {totalRawNames} distinct names · assign first names to enable player records
      </div>

      <div style={{ marginBottom: players.length > 0 ? 16 : 0 }}>
        {allRawNames.length === 0 ? (
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: 'var(--ink-3)',
            }}
          >
            No games loaded.
          </div>
        ) : (
          allRawNames.map(rawName => (
            <NameRow
              key={rawName}
              rawName={rawName}
              value={nameMap[rawName] ?? ''}
              onSave={val => { setName(rawName, val); }}
            />
          ))
        )}
      </div>

      {players.length > 0 && (
        <>
          <Rule weight="thin" />
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--ink-3)',
              margin: '8px 0',
            }}
          >
            Player Records · best-effort · {players.length} player{players.length !== 1 ? 's' : ''}
          </div>
          {players.map(p => (
            <PlayerCard key={p.canonicalName} player={p} />
          ))}
        </>
      )}
    </section>
  );
}
