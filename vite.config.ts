import { defineConfig } from 'vitest/config'

// Production security headers. Caddy sets them in the portfolio repo (see
// docs/deployment-checklist.md); `npm run preview` sends the same ones to test the build.
const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
}

export default defineConfig({
  build: {
    // Never inline small fonts as data: URIs, so the CSP can stay at font-src 'self'.
    assetsInlineLimit: 0,
  },
  preview: {
    headers: securityHeaders,
  },
  test: {
    coverage: {
      // The spec's coverage bar applies to the pure logic only; UI is checked in the browser.
      include: ['src/engine/**/*.ts', 'src/view/camera.ts', 'src/i18n/lang.ts'],
      exclude: ['**/*.test.ts'],
      thresholds: { lines: 90 },
    },
  },
})
