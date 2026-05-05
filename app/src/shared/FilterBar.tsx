import React from 'react';

interface Segment { label: string; value: string; }

interface Props {
  segments?: Segment[];
  activeSegment?: string;
  onSegmentChange?: (v: string) => void;
  dropdownLabel?: string;
  dropdownOptions?: Segment[];
  dropdownValue?: string;
  onDropdownChange?: (v: string) => void;
}

export function FilterBar({
  segments = [], activeSegment, onSegmentChange,
  dropdownLabel, dropdownOptions = [], dropdownValue, onDropdownChange,
}: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '6px 16px',
      borderBottom: '1px solid var(--rule)',
      flexWrap: 'wrap' as const,
    }}>
      {segments.length > 0 && (
        <div style={{ display: 'flex', border: '1px solid var(--ink)' }}>
          {segments.map(({ label, value }, i) => (
            <button
              key={value}
              onClick={() => onSegmentChange?.(value)}
              style={{
                padding: '4px 10px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 'var(--font-micro)',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                background: activeSegment === value ? 'var(--ink)' : 'transparent',
                color: activeSegment === value ? 'var(--paper)' : 'var(--ink)',
                border: 'none',
                borderLeft: i > 0 ? '1px solid var(--ink)' : 'none',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {dropdownLabel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 'var(--font-micro)', textTransform: 'uppercase' as const, color: 'var(--ink-2)', letterSpacing: '0.1em' }}>
            {dropdownLabel}
          </span>
          <select
            value={dropdownValue}
            onChange={e => onDropdownChange?.(e.target.value)}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 'var(--font-micro)',
              border: '1px solid var(--rule)',
              background: 'var(--paper)',
              color: 'var(--ink)',
              padding: '3px 6px',
              cursor: 'pointer',
            }}
          >
            {dropdownOptions.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
