import { Kicker } from '../../shared';

export function TimelineSection() {
  return (
    <section
      id="timeline"
      data-section="timeline"
      style={{ padding: '14px 16px', borderBottom: '1px solid #ddd' }}
    >
      <Kicker text="Timeline">Game Timeline</Kicker>
      <div
        style={{
          marginTop: '12px',
          border: '1px dashed var(--ink-4)',
          padding: '32px 16px',
          textAlign: 'center',
        }}
      >
        <span
          className="font-mono text-ink-4"
          style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
        >
          Action feed — Phase 2c
        </span>
      </div>
    </section>
  );
}
