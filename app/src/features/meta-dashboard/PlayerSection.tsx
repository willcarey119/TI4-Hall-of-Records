import { useMemo } from 'react';
import { useMeta } from './MetaContext';
import { Rule, SectionDesc } from '../../shared';
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
          fontSize: 'var(--font-micro)',
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
          fontSize: 'var(--font-micro)',
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

function PlayerCard({ player, isTop }: { player: PlayerStat; isTop: boolean }) {
  const pct = Math.round(player.winRate * 100);
  const wins = Math.round(player.winRate * player.gamesPlayed);
  const isInactive = player.gamesPlayed <= 1;
  return (
    <div
      style={{
        background: 'var(--paper-2)',
        border: '1px solid var(--ink-4)',
        borderLeft: isTop ? '3px solid var(--accent)' : '1px solid var(--ink-4)',
        padding: '10px 12px',
        opacity: isInactive ? 0.7 : 1,
      }}
    >
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginBottom: 2 }}>
        {player.gamesPlayed} game{player.gamesPlayed !== 1 ? 's' : ''} played
      </div>
      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 18, lineHeight: 1.1, marginBottom: 6 }}>
        {player.canonicalName}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 18, lineHeight: 1, color: isTop ? 'var(--accent)' : 'var(--ink)' }}>
            {pct}%
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>win rate</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 800, fontSize: 18, lineHeight: 1 }}>
            {wins}W
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>wins</div>
        </div>
      </div>
      {player.favoriteFaction !== null && (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', color: 'var(--ink-3)', marginTop: 6 }}>
          Most played: <span style={{ fontFamily: "'Newsreader', Georgia, serif" }}>{player.favoriteFaction}</span>
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
          fontSize: 'var(--font-subhead)',
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
          fontSize: 'var(--font-micro)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-3)',
          marginBottom: 6,
        }}
      >
        {totalRawNames} distinct names · assign first names to enable player records
      </div>
      <SectionDesc>
        Players who have participated in this league, linked to their faction histories and win records. Names are pulled from TI Assistant exports and grouped by first name.
      </SectionDesc>

      <div style={{ marginBottom: players.length > 0 ? 16 : 0 }}>
        {allRawNames.length === 0 ? (
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
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

      {players.length > 0 && (() => {
        const sorted = [...players].sort((a, b) => {
          if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
          return b.winRate - a.winRate;
        });
        const topRate = Math.max(...sorted.filter(p => p.gamesPlayed >= 2).map(p => p.winRate), 0);
        return (
          <>
            <Rule weight="thin" />
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 'var(--font-micro)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--ink-3)',
                margin: '8px 0',
              }}
            >
              Player Records · best-effort · {players.length} player{players.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {sorted.map(p => (
                <PlayerCard
                  key={p.canonicalName}
                  player={p}
                  isTop={p.gamesPlayed >= 2 && p.winRate === topRate && topRate > 0}
                />
              ))}
            </div>
          </>
        );
      })()}
    </section>
  );
}
