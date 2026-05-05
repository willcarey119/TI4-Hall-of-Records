import React, { useEffect, useState } from 'react';

interface Section { id: string; label: string; }

export function SubSectionNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observers = sections.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry?.isIntersecting) setActive(id); },
        { rootMargin: '-40% 0px -55% 0px' }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, [sections]);

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'var(--paper)',
      borderBottom: '1px solid var(--rule)',
      display: 'flex', gap: 0, overflowX: 'auto',
    }}>
      {sections.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            padding: '8px 14px',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 'var(--font-micro)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            color: active === id ? 'var(--ink)' : 'var(--ink-2)',
            borderBottom: active === id ? '2px solid var(--ink)' : '2px solid transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
