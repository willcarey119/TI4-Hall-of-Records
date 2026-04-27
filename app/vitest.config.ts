import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
      // Phase 1a parser layer is fully tested (141 tests including integration
      // against all 6 real game exports). 90% lines/functions/statements;
      // branches at 80% — defensive typeof guards in parseGame.ts payload
      // extraction are hard to exercise without malformed payloads.
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 80,
        statements: 90,
      },
    },
  },
})
