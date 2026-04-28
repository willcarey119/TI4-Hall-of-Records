export function getVictoryPointThreshold(options: Record<string, unknown>): number {
  const v = options['victory-points'] ?? options['victoryPoints'];
  return typeof v === 'number' ? v : 10;
}
