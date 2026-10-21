import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      // The spec's coverage bar applies to the pure logic only; UI is checked in the browser.
      include: ['src/engine/**/*.ts', 'src/view/camera.ts', 'src/i18n/lang.ts'],
      exclude: ['**/*.test.ts'],
      thresholds: { lines: 90 },
    },
  },
})
