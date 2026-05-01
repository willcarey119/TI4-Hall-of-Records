import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/',       label: 'Games'  },
  { to: '/meta',   label: 'Meta'   },
  { to: '/agenda', label: 'Agenda' },
] as const;

const baseStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 'var(--font-micro)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  padding: '8px 14px',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  display: 'inline-block',
  borderBottom: '2px solid transparent',
  color: 'var(--ink-3)',
};

const activeStyle: React.CSSProperties = {
  ...baseStyle,
  color: 'var(--ink)',
  borderBottom: '2px solid var(--ink)',
  fontWeight: 600,
};

export function AppNav() {
  return (
    <nav
      style={{
        display: 'flex',
        background: 'var(--paper)',
        borderBottom: '1px solid var(--rule)',
        flexShrink: 0,
        paddingLeft: 4,
      }}
    >
      {NAV_ITEMS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => (isActive ? activeStyle : baseStyle)}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
