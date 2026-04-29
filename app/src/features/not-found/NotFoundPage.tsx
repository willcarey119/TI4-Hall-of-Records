import { Link } from 'react-router-dom';
import { Mast, Rule } from '../../shared';

export function NotFoundPage() {
  return (
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 16px' }}>
      <Mast title="Hall of Records" subtitle="Twilight Imperium IV · Game Archive" />

      <Rule weight="thick" />

      <section style={{ marginTop: '32px', textAlign: 'center' }}>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--ink-3)',
            margin: 0,
          }}
        >
          Error 404
        </p>
        <h2
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: '32px',
            fontStyle: 'italic',
            fontWeight: 800,
            color: 'var(--ink)',
            lineHeight: 1.1,
            margin: '8px 0 12px',
          }}
        >
          Page Not Found
        </h2>
        <p
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: '14px',
            color: 'var(--ink-2)',
            lineHeight: 1.5,
            maxWidth: '440px',
            margin: '0 auto 24px',
          }}
        >
          The dispatch you sought is not in our archives. Perhaps a typed
          coordinate, perhaps a record long since retired.
        </p>
        <Link
          to="/"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--accent)',
            textDecoration: 'none',
          }}
        >
          ← Return to the Hall
        </Link>
      </section>
    </main>
  );
}
