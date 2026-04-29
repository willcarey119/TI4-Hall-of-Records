interface RoundDistributionChartProps {
  distribution: Record<number, number>;
  label?: string;
}

export function RoundDistributionChart({ distribution }: RoundDistributionChartProps) {
  const roundNumbers = Object.keys(distribution)
    .map(Number)
    .sort((a, b) => a - b);

  if (roundNumbers.length === 0) {
    return null;
  }

  const counts = roundNumbers.map(r => distribution[r]);
  const maxCount = Math.max(...counts);
  const chartHeight = 80;
  const barHeightMax = chartHeight * 0.8;
  const barWidth = 20;
  const barGap = 12;
  const bottomPadding = 20;
  const topPadding = 16;
  const svgWidth = roundNumbers.length * (barWidth + barGap) + 16;
  const svgHeight = chartHeight + bottomPadding + topPadding;

  return (
    <svg
      width="100%"
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      style={{ display: 'block' }}
    >
      {roundNumbers.map((round, idx) => {
        const count = distribution[round];
        const barHeight = (count / maxCount) * barHeightMax;
        const x = 8 + idx * (barWidth + barGap);
        const barY = topPadding + (barHeightMax - barHeight);

        return (
          <g key={round}>
            <rect
              x={x}
              y={barY}
              width={barWidth}
              height={barHeight}
              fill="var(--ink-2)"
            />
            <text
              x={x + barWidth / 2}
              y={barY - 4}
              textAnchor="middle"
              dominantBaseline="hanging"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 'var(--font-micro)',
                fill: 'var(--ink)',
              }}
            >
              {count}
            </text>
            <text
              x={x + barWidth / 2}
              y={topPadding + barHeightMax + 8}
              textAnchor="middle"
              dominantBaseline="hanging"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 'var(--font-micro)',
                fill: 'var(--ink)',
              }}
            >
              R{round}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
