import type { Config } from 'tailwindcss'

// NOTE (2026-04-27): The "Deep Space" tokens below are the original Phase 0
// placeholder. They are STALE.
//
// The visual direction was changed to "newspaper / almanac editorial" — see
// `D:\_TI4 App\design_handoff_ti4_tracker\README.md` for the full handoff.
// The Phase 1b/2 styling work will replace these tokens with the design's
// CSS custom properties:
//
//   --paper, --paper-2          warm newsprint backgrounds
//   --rule                      rule lines
//   --ink, --ink-{2,3,4}        primary → tertiary text
//   --accent                    faded vermillion ("stop press")
//   --cool                      faded ink-blue secondary accent
//   --gold, --moss              tech color tokens
//
// Fonts to add: Newsreader (display), IBM Plex Sans (body), IBM Plex Mono
// (data/labels), Caveat (margin annotations).
//
// Until that work happens, the tokens below are inert — nothing imports them
// because no UI components exist yet. Remove this comment once the swap lands.

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // STALE — Phase 0 placeholder. Replace with newspaper/almanac tokens
        // (see design_handoff_ti4_tracker/wireframes.css) during Phase 1b/2.
        'space-bg': '#0a0e1a',
        'space-surface': '#131929',
        'space-border': '#1e2d45',
        'space-text': '#e2e8f0',
        'space-muted': '#64748b',
        // Faction color slots — replace with the official 25-faction palette
        // (TI4 base + PoK + Codex + Discordant Stars).
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
        // STALE — replace with Newsreader (display), IBM Plex Sans (body),
        // IBM Plex Mono (data/labels), Caveat (margin annotations).
        display: ['Rajdhani', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
