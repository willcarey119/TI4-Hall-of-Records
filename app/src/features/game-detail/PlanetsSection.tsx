import { Kicker } from '../../shared';

export function PlanetsSection() {
  return (
    <section
      id="planets"
      data-section="planets"
      style={{ padding: '14px 16px' }}
    >
      <Kicker text="Planets">Planet Ledger</Kicker>
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
          Planet ledger — Phase 2c
        </span>
      </div>
    </section>
  );
}
