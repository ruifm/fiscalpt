import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['tests/e2e/**', 'node_modules/**', 'scripts/**'],
    coverage: {
      include: ['src/lib/tax/**'],
      reporter: ['text', 'json-summary'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
