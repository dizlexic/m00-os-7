import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    // Test environment
    environment: 'happy-dom',

    // Global test APIs (describe, it, expect, etc.)
    globals: true,

    // Test file patterns
    include: ['tests/**/*.{test,spec}.{js,ts}'],

    // Exclude patterns
    exclude: ['node_modules', '.nuxt', 'dist', 'tests/e2e/**'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['app/**/*.{ts,vue}'],
      exclude: [
        'app/**/*.d.ts',
        'app/**/*.test.ts',
        'app/**/*.spec.ts'
      ]
    },

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Reporter
    reporters: ['verbose'],

    // Timeout
    testTimeout: 10000
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '@': fileURLToPath(new URL('./app', import.meta.url))
    }
  }
})
