import { useState, useEffect, useRef } from 'react';
import { Rule, FontScaleControls } from '../../shared';
import { MetaProvider, useMeta } from './MetaContext';
import { useAuth } from '../../adapters/AuthContext';
import { FactionSection } from './FactionSection';
import { StrategyCardSection } from './StrategyCardSection';
import { TechSection } from './TechSection';
import { StatsSection } from './StatsSection';
import { PlayerSection } from './PlayerSection';
import { ScoringPaceSection } from './ScoringPaceSection';

const PUBLIC_SECTIONS = [
  { id: 'factions',     label: 'Factions' },
  { id: 'strategy',     label: 'Strategy' },
  { id: 'techs',        label: 'Techs'    },
  { id: 'stats',        label: 'Stats'    },
  { id: 'scoring-pace', label: 'Pace'     },
] as const;

const ARCHIVIST_SECTIONS = [
  ...PUBLIC_SECTIONS,
  { id: 'players', label: 'Players' },
] as const;

function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function MetaFrozenHeader({ activeSection, isAuthorized }: { activeSection: string; isAuthorized: boolean }) {
  const sections = isAuthorized ? ARCHIVIST_SECTIONS : PUBLIC_SECTIONS;
  return (
    <div
      style={{
        background: 'var(--paper)',
        borderBottom: '2px solid var(--rule)',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Masthead */}
      <div style={{ padding: '0 16px 8px' }}>
        <Rule weight="double" />
        <div style={{ paddingTop: '8px' }}>
          <div
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: 'var(--font-display-sm)',
              fontWeight: 700,
              color: 'var(--ink)',
              lineHeight: 1.1,
            }}
          >
            LEAGUE STATS
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--ink-3)',
              marginTop: '4px',
            }}
          >
            Twilight Imperium IV · All Games
          </div>
        </div>
        <div style={{ marginTop: '8px' }}>
          <Rule weight="double" />
        </div>
      </div>

      {/* Nav bar */}
      <nav style={{ display: 'flex', overflowX: 'auto', padding: '0 12px' }}>
        {sections.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => { scrollToSection(id); }}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '7px 12px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              color: activeSection === id ? 'var(--ink)' : 'var(--ink-3)',
              borderBottom:
                activeSection === id
                  ? '2px solid var(--ink)'
                  : '2px solid transparent',
              fontWeight: activeSection === id ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
        <FontScaleControls />
      </nav>
    </div>
  );
}

function MetaScrollBody({ onSectionChange, isAuthorized }: { onSectionChange: (id: string) => void; isAuthorized: boolean }) {
  const { loading, error } = useMeta();
  const callbackRef = useRef(onSectionChange);
  const sectionIds = (isAuthorized ? ARCHIVIST_SECTIONS : PUBLIC_SECTIONS).map(s => s.id);

  useEffect(() => {
    callbackRef.current = onSectionChange;
  });

  useEffect(() => {
    // Skip observer setup until sections are actually rendered
    if (loading || error !== null) return;

    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el === null) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const sectionId =
                (entry.target as HTMLElement).dataset['section'] ?? id;
              callbackRef.current(sectionId);
            }
          });
        },
        { threshold: 0.4 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((o) => { o.disconnect(); });
    };
  }, [loading, error, isAuthorized]);

  if (loading) {
    return (
      <div style={{ overflowY: 'scroll', flex: 1, padding: '32px 16px' }}>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--ink-3)',
          }}
        >
          Loading…
        </p>
      </div>
    );
  }

  if (error !== null) {
    return (
      <div style={{ overflowY: 'scroll', flex: 1, padding: '32px 16px' }}>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            color: 'var(--accent)',
            marginBottom: 8,
          }}
        >
          {error}
        </p>
        <button
          type="button"
          onClick={() => { window.location.reload(); }}
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            textDecoration: 'underline',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink-3)',
            padding: 0,
          }}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'scroll', flex: 1 }}>
      <FactionSection />
      <StrategyCardSection />
      <TechSection />
      <StatsSection />
      <ScoringPaceSection />
      {isAuthorized && <PlayerSection />}
    </div>
  );
}

export function MetaDashboardPage() {
  const [activeSection, setActiveSection] = useState<string>('factions');
  const { isAuthorized } = useAuth();

  return (
    <MetaProvider>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: 'var(--paper)',
        }}
      >
        <MetaFrozenHeader activeSection={activeSection} isAuthorized={isAuthorized} />
        <MetaScrollBody onSectionChange={setActiveSection} isAuthorized={isAuthorized} />
      </div>
    </MetaProvider>
  );
}
