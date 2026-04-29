import { useMetaContext } from './MetaContext';
import { Kicker } from '../../shared';

const W = 480;
const H = 200;
const PAD = { top: 12, right: 12, bottom: 24, left: 28 };

export function ScoringPaceSection() {
  const { scoringPace } = useMetaContext();
  if (scoringPace === null || scoringPace.curves.length === 0) return null;

  const maxVp = Math.max(...scoringPace.curves.map(c => c.victoryPoints));
  if (maxVp === 0) return null;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  function toSvgX(t: number) { return PAD.left + t * innerW; }
  function toSvgY(vp: number) { return PAD.top + innerH - (vp / maxVp) * innerH; }

  function curveToPath(points: { t: number; vp: number }[]): string {
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.t).toFixed(1)} ${toSvgY(p.vp).toFixed(1)}`)
      .join(' ');
  }

  return (
    <section id="scoring-pace" data-section="scoring-pace" style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule)' }}>
      <Kicker>Scoring Pace</Kicker>
      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>
        Winner VP trajectory per game — normalized to game duration
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxWidth: W }}>
        {[0, Math.round(maxVp / 2), maxVp].map(v => (
          <text key={v} x={PAD.left - 4} y={toSvgY(v) + 3} textAnchor="end"
            style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, fill: 'var(--ink-4)' }}>
            {v}
          </text>
        ))}
        <line x1={PAD.left} y1={toSvgY(maxVp)} x2={PAD.left + innerW} y2={toSvgY(maxVp)}
          stroke="var(--rule)" strokeWidth={1} strokeDasharray="3 3" />
        {scoringPace.curves.map(curve => (
          <path
            key={curve.gameId}
            d={curveToPath(curve.points)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.5}
            opacity={0.5}
          />
        ))}
        <line x1={PAD.left} y1={PAD.top + innerH} x2={PAD.left + innerW} y2={PAD.top + innerH}
          stroke="var(--rule)" strokeWidth={1} />
        {['0%', '50%', '100%'].map((label, i) => (
          <text key={label} x={toSvgX(i * 0.5)} y={PAD.top + innerH + 12} textAnchor="middle"
            style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, fill: 'var(--ink-4)' }}>
            {label}
          </text>
        ))}
      </svg>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--ink-4)', marginTop: 4 }}>
        {scoringPace.curves.length} game{scoringPace.curves.length !== 1 ? 's' : ''} · {maxVp} VP threshold
      </div>
    </section>
  );
}
