import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rule } from '../../shared';
import { MetaProvider } from './MetaContext';
import { FactionSection } from './FactionSection';
import { StrategyCardSection } from './StrategyCardSection';
import { TechSection } from './TechSection';
import { StatsSection } from './StatsSection';

const META_SECTIONS = [
  { id: 'factions', label: 'Factions' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'techs',    label: 'Techs'    },
  { id: 'stats',    label: 'Stats'    },
] as const;

type MetaSectionId = typeof META_SECTIONS[number]['id'];

const SECTION_IDS = META_SECTIONS.map(s => s.id) as MetaSectionId[];

function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function MetaFrozenHeader({ activeSection }: { activeSection: string }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: 'var(--paper)',
        borderBottom: '2px solid var(--rule)',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Back link */}
      <div style={{ padding: '10px 16px 4px' }}>
        <button
          type="button"
          onClick={() => { navigate(-1); }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--ink-3)',
            padding: 0,
          }}
        >
          ← Archive
        </button>
      </div>

      {/* Masthead */}
      <div style={{ padding: '0 16px 8px' }}>
        <Rule weight="double" />
        <div style={{ paddingTop: '8px' }}>
          <div
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--ink)',
              lineHeight: 1.1,
            }}
          >
            League Stats
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '9px',
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
        {META_SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => { scrollToSection(id); }}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '9px',
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
      </nav>
    </div>
  );
}

function MetaScrollBody({ onSectionChange }: { onSectionChange: (id: string) => void }) {
  const callbackRef = useRef(onSectionChange);
  useEffect(() => {
    callbackRef.current = onSectionChange;
  });

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTION_IDS.forEach((id) => {
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
  }, []);

  return (
    <div style={{ overflowY: 'scroll', flex: 1 }}>
      <FactionSection />
      <StrategyCardSection />
      <TechSection />
      <StatsSection />
    </div>
  );
}

export function MetaDashboardPage() {
  const [activeSection, setActiveSection] = useState<string>('factions');

  return (
    <MetaProvider>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: 'var(--paper)',
        }}
      >
        <MetaFrozenHeader activeSection={activeSection} />
        <MetaScrollBody onSectionChange={setActiveSection} />
      </div>
    </MetaProvider>
  );
}
