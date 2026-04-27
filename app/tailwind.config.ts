import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper:      'var(--paper)',
        'paper-2':  'var(--paper-2)',
        rule:       'var(--rule)',
        ink:        'var(--ink)',
        'ink-2':    'var(--ink-2)',
        'ink-3':    'var(--ink-3)',
        'ink-4':    'var(--ink-4)',
        accent:     'var(--accent)',
        cool:       'var(--cool)',
        gold:       'var(--gold)',
        moss:       'var(--moss)',
      },
      fontFamily: {
        display:    ['Newsreader', 'Georgia', 'serif'],
        body:       ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono:       ['IBM Plex Mono', 'monospace'],
        annotation: ['Caveat', 'cursive'],
      },
    },
  },
  plugins: [],
} satisfies Config
