import { FontScaleControls, SubSectionNav, LoadingSkeleton, ErrorState } from '../../shared';
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

function MetaFrozenHeader() {
  return (
    <div
      style={{
        background: 'var(--paper)',
        borderBottom: '2px solid var(--rule)',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Compact masthead */}
      <header style={{
        borderTop: '3px double var(--rule)',
        borderBottom: '1px solid var(--rule)',
        padding: '6px 16px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontWeight: 800, fontStyle: 'italic',
          fontSize: 'var(--font-display-sm)',
        }}>HoR</span>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 'var(--font-micro)',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
          color: 'var(--ink-2)',
        }}>League Stats</span>
        <span style={{ marginLeft: 'auto' }}>
          <FontScaleControls />
        </span>
      </header>
    </div>
  );
}

function MetaScrollBody({ isAuthorized }: { isAuthorized: boolean }) {
  const { loading, error } = useMeta();

  if (loading) {
    return (
      <div style={{ overflowY: 'scroll', flex: 1 }}>
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (error !== null) {
    return (
      <div style={{ overflowY: 'scroll', flex: 1, padding: '32px 16px' }}>
        <ErrorState
          message={error}
          onRetry={() => { window.location.reload(); }}
        />
      </div>
    );
  }

  const visibleSections = (isAuthorized ? ARCHIVIST_SECTIONS : PUBLIC_SECTIONS).map(s => ({ id: s.id, label: s.label }));

  return (
    <div style={{ overflowY: 'scroll', flex: 1 }}>
      <SubSectionNav sections={visibleSections} />
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
        <MetaFrozenHeader />
        <MetaScrollBody isAuthorized={isAuthorized} />
      </div>
    </MetaProvider>
  );
}
