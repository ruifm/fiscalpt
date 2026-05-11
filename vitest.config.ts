import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['tests/e2e/**', 'node_modules/**', 'scripts/**'],
    hookTimeout: 30000,
    testTimeout: 30000,
    coverage: {
      include: ['src/lib/tax/**'],
      exclude: ['src/lib/tax/index.ts'],
      reporter: ['text', 'json-summary'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
