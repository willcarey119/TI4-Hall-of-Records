export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function formatGameTitle(
  winner: string | null,
  finalScores: Record<string, number>
): string {
  if (winner === null) return 'Game Concluded';
  const score = finalScores[winner] ?? 0;
  return `${winner} Seizes the Throne at ${score} VP`;
}

export function formatKicker(playedAt: number, durationSeconds: number): string {
  return `${formatDate(playedAt)} · ${formatDuration(durationSeconds)}`;
}
