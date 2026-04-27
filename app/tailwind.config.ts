import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep Space background tokens
        'space-bg': '#0a0e1a',
        'space-surface': '#131929',
        'space-border': '#1e2d45',
        'space-text': '#e2e8f0',
        'space-muted': '#64748b',
        // Faction color slots — values finalized in Phase 4
        'faction-blue': '#3b82f6',
        'faction-red': '#ef4444',
        'faction-green': '#22c55e',
        'faction-yellow': '#eab308',
        'faction-purple': '#a855f7',
        'faction-orange': '#f97316',
        'faction-pink': '#ec4899',
        'faction-cyan': '#06b6d4',
      },
      fontFamily: {
        display: ['Rajdhani', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
