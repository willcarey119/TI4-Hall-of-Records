import { useState, useRef, useLayoutEffect } from 'react';

interface TooltipProps {
  text: string;
}

export function Tooltip({ text }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const bubbleRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!visible || bubbleRef.current === null) {
      setOffsetX(0);
      return;
    }
    const rect = bubbleRef.current.getBoundingClientRect();
    const pad = 8;
    if (rect.right > window.innerWidth - pad) {
      setOffsetX(-(rect.right - (window.innerWidth - pad)));
    } else if (rect.left < pad) {
      setOffsetX(pad - rect.left);
    } else {
      setOffsetX(0);
    }
  }, [visible]);

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '0.3em', verticalAlign: 'middle' }}
      onMouseEnter={() => { setVisible(true); }}
      onMouseLeave={() => { setVisible(false); }}
      onFocus={() => { setVisible(true); }}
      onBlur={() => { setVisible(false); }}
    >
      <span
        role="img"
        aria-label="more information"
        tabIndex={0}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '1.1em',
          height: '1.1em',
          borderRadius: '50%',
          border: '1px solid var(--ink-4)',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.75em',
          color: 'var(--ink-4)',
          cursor: 'help',
          flexShrink: 0,
          userSelect: 'none',
          outline: 'none',
        }}
      >
        ?
      </span>
      {visible && (
        <span
          ref={bubbleRef}
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: `translateX(calc(-50% + ${offsetX}px))`,
            background: 'var(--paper)',
            border: '1px solid var(--rule)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            padding: '6px 10px',
            maxWidth: 260,
            width: 'max-content',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 'var(--font-micro)',
            color: 'var(--ink-2)',
            lineHeight: 1.5,
            zIndex: 99,
            pointerEvents: 'none',
            whiteSpace: 'normal',
            textTransform: 'none',
            letterSpacing: 0,
            fontWeight: 400,
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
