/**
 * Vitest Setup File
 * 
 * This file runs before each test file and sets up the testing environment.
 */

import { config } from '@vue/test-utils'

// Configure Vue Test Utils
config.global.stubs = {
  // Stub Nuxt components that might cause issues in tests
  NuxtLink: true,
  NuxtImg: true,
  ClientOnly: true
}

// Mock window.matchMedia for tests that use media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
})

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock
})

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock
})

// Add custom matchers or global test utilities here if needed
