// src/features/upload/GamePreview.tsx
import type { ParsedGame } from '../../lib/parser/types';
import { WarningList } from './WarningList';

interface GamePreviewProps {
  game: ParsedGame;
  onSave: () => void;
  saving: boolean;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function GamePreview({ game, onSave, saving }: GamePreviewProps) {
  return (
    <div className="space-y-4 border-2 border-ink p-6">
      {/* Header */}
      <div className="border-b-2 border-ink pb-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
          Game Preview
        </p>
        <p className="font-display text-xl font-bold text-ink">
          {formatDate(game.playedAt)}
        </p>
        <p className="font-mono text-xs text-ink-3">
          Duration: {formatDuration(game.durationSeconds)}
        </p>
      </div>

      {/* Score table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-4">
            <th className="pb-1 text-left font-mono text-[10px] uppercase tracking-widest text-ink-3">
              Faction
            </th>
            <th className="pb-1 text-right font-mono text-[10px] uppercase tracking-widest text-ink-3">
              VP
            </th>
          </tr>
        </thead>
        <tbody>
          {game.factions.map((f) => {
            const score = game.finalScores[f.factionId] ?? 0;
            const isWinner = f.factionId === game.winner;
            return (
              <tr key={f.factionId} className="border-b border-ink-4/40">
                <td className={['py-1', isWinner ? 'font-semibold text-accent' : 'text-ink'].join(' ')}>
                  {f.factionId}
                  {isWinner && (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-accent">
                      winner
                    </span>
                  )}
                </td>
                <td className="py-1 text-right font-mono text-ink">{score}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Warnings */}
      <WarningList warnings={game.warnings} />

      {/* Save button */}
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className={[
          'w-full border-2 py-3 font-mono text-xs uppercase tracking-widest transition-colors',
          saving
            ? 'cursor-not-allowed border-ink-4 text-ink-4'
            : 'border-ink bg-ink text-paper hover:border-accent hover:bg-accent',
        ].join(' ')}
      >
        {saving ? 'Saving…' : 'Save to Records'}
      </button>
    </div>
  );
}
