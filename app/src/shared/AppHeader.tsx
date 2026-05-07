import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../adapters/AuthContext';
import { Rule, FontScaleControls, CommandPalette } from './index';
import { UploadPage } from '../features/upload/UploadPage';

const NAV_ITEMS = [
  { to: '/',       label: 'Games',  end: true  },
  { to: '/meta',   label: 'League', end: false },
  { to: '/agenda', label: 'Agenda', end: false },
] as const;

interface AppHeaderProps {
  onGameSaved?: () => void;
}

export function AppHeader({ onGameSaved }: AppHeaderProps) {
  const { isAuthorized, authLoading, signIn, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleSaved() {
    setDrawerOpen(false);
    onGameSaved?.();
  }

  return (
    <header style={{ background: 'var(--paper)', flexShrink: 0, zIndex: 20 }}>
      {/* ── Masthead ──────────────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '12px 16px 0' }}>
        <Rule weight="double" />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            padding: '10px 0 4px',
            gap: 12,
          }}
        >
          {/* Title */}
          <div>
            <h1
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: 'var(--font-display-lg)',
                fontWeight: 800,
                fontStyle: 'italic',
                color: 'var(--ink)',
                lineHeight: 1.0,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              TI4 · Hall of Records
            </h1>
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 'var(--font-micro)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--ink-3)',
                margin: '4px 0 0',
              }}
            >
              Twilight Imperium IV · Private League Archive
            </p>
          </div>
          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, paddingBottom: 2 }}>
            <FontScaleControls />
            {!authLoading && (
              isAuthorized ? (
                <button
                  type="button"
                  onClick={() => { void signOut(); }}
                  style={monoMicro({ color: 'var(--ink-3)' })}
                >
                  Sign out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { void signIn(); }}
                  style={monoMicro({ color: 'var(--ink-3)' })}
                >
                  Archivist →
                </button>
              )
            )}
          </div>
        </div>
        <Rule weight="double" />
      </div>

      {/* ── Nav tabs ──────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--rule)',
        }}
      >
        <nav style={{ display: 'flex', flex: 1 }}>
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 'var(--font-micro)',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.1em',
                padding: '8px 14px',
                textDecoration: 'none',
                whiteSpace: 'nowrap' as const,
                display: 'inline-block',
                borderBottom: isActive ? '2px solid var(--ink)' : '2px solid transparent',
                color: isActive ? 'var(--ink)' : 'var(--ink-3)',
                fontWeight: isActive ? 600 : 400,
                marginBottom: -1,
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Upload toggle — only for archivist */}
        {isAuthorized && (
          <button
            type="button"
            onClick={() => { setDrawerOpen(o => !o); }}
            style={{
              ...monoMicro({ color: drawerOpen ? 'var(--accent)' : 'var(--ink-3)' }),
              padding: '6px 10px',
              border: '1px solid currentColor',
              borderRadius: 2,
              marginLeft: 8,
              cursor: 'pointer',
              background: 'none',
            }}
          >
            {drawerOpen ? '✕ Close' : '↑ Upload'}
          </button>
        )}
      </div>

      {/* ── Upload drawer ─────────────────────────────────────── */}
      {isAuthorized && drawerOpen && (
        <div
          style={{
            borderBottom: '2px solid var(--rule)',
            background: 'var(--paper-2)',
          }}
        >
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 16px 20px' }}>
            <UploadPage onSaved={handleSaved} />
          </div>
        </div>
      )}

      <CommandPalette />
    </header>
  );
}

function monoMicro(extra?: React.CSSProperties): React.CSSProperties {
  return {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 'var(--font-micro)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    ...extra,
  };
}
