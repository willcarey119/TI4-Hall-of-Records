import { Kicker } from '../../shared';

export function VpRaceSection() {
  return (
    <section
      id="vp-race"
      data-section="vp-race"
      style={{ padding: '14px 16px', borderBottom: '1px solid #ddd' }}
    >
      <Kicker text="VP Race">Victory Point Race</Kicker>
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
          Slope chart — Phase 2b
        </span>
      </div>
    </section>
  );
}
