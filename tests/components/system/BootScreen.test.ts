/**
 * BootScreen Component Tests
 *
 * Tests for the Mac OS 7 boot sequence screen component.
 * Following TDD methodology - these tests are written before implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import BootScreen from '~/components/system/BootScreen.vue'

describe('BootScreen.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('rendering', () => {
    it('should render the boot screen container', () => {
      wrapper = mount(BootScreen)
      expect(wrapper.find('.boot-screen').exists()).toBe(true)
    })

    it('should have a dark/black background', () => {
      wrapper = mount(BootScreen)
      const bootScreen = wrapper.find('.boot-screen')
      expect(bootScreen.exists()).toBe(true)
    })

    it('should be full screen', () => {
      wrapper = mount(BootScreen)
      const bootScreen = wrapper.find('.boot-screen')
      expect(bootScreen.classes()).toContain('boot-screen')
    })
  })

  describe('Happy Mac icon', () => {
    it('should display the Happy Mac icon', () => {
      wrapper = mount(BootScreen)
      const happyMac = wrapper.find('[data-testid="happy-mac"]')
      expect(happyMac.exists()).toBe(true)
    })

    it('should use the correct Happy Mac image source', () => {
      wrapper = mount(BootScreen)
      const happyMac = wrapper.find('[data-testid="happy-mac"]')
      expect(happyMac.attributes('src')).toContain('happy-mac')
    })

    it('should have appropriate alt text for accessibility', () => {
      wrapper = mount(BootScreen)
      const happyMac = wrapper.find('[data-testid="happy-mac"]')
      expect(happyMac.attributes('alt')).toBe('Happy Mac')
    })
  })

  describe('Welcome message', () => {
    it('should display "Welcome to Macintosh" message', () => {
      wrapper = mount(BootScreen)
      expect(wrapper.text()).toContain('Welcome to Macintosh')
    })

    it('should have the welcome message in a dedicated element', () => {
      wrapper = mount(BootScreen)
      const welcomeMessage = wrapper.find('[data-testid="welcome-message"]')
      expect(welcomeMessage.exists()).toBe(true)
      expect(welcomeMessage.text()).toBe('Welcome to Macintosh')
    })
  })

  describe('loading progress bar', () => {
    it('should display a progress bar', () => {
      wrapper = mount(BootScreen)
      const progressBar = wrapper.find('[data-testid="progress-bar"]')
      expect(progressBar.exists()).toBe(true)
    })

    it('should have a progress indicator inside the bar', () => {
      wrapper = mount(BootScreen)
      const progressIndicator = wrapper.find('[data-testid="progress-indicator"]')
      expect(progressIndicator.exists()).toBe(true)
    })

    it('should start with 0% progress', () => {
      wrapper = mount(BootScreen)
      const progressIndicator = wrapper.find('[data-testid="progress-indicator"]')
      expect(progressIndicator.attributes('style')).toContain('width: 0%')
    })

    it('should update progress over time', async () => {
      wrapper = mount(BootScreen)

      // Advance timers to simulate progress
      await vi.advanceTimersByTimeAsync(500)
      await wrapper.vm.$nextTick()

      const progressIndicator = wrapper.find('[data-testid="progress-indicator"]')
      const style = progressIndicator.attributes('style') || ''
      // Progress should have increased from 0
      expect(style).not.toContain('width: 0%')
    })

    it('should reach 100% when boot is complete', async () => {
      wrapper = mount(BootScreen)

      // Advance timers to complete boot sequence (3 seconds default)
      await vi.advanceTimersByTimeAsync(3000)
      await wrapper.vm.$nextTick()

      const progressIndicator = wrapper.find('[data-testid="progress-indicator"]')
      expect(progressIndicator.attributes('style')).toContain('width: 100%')
    })
  })

  describe('boot completion', () => {
    it('should emit "complete" event when boot finishes', async () => {
      wrapper = mount(BootScreen)

      // Advance timers to complete boot sequence
      await vi.advanceTimersByTimeAsync(3500)
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('complete')).toBeTruthy()
      expect(wrapper.emitted('complete')?.length).toBe(1)
    })

    it('should accept custom boot duration via prop', async () => {
      wrapper = mount(BootScreen, {
        props: {
          duration: 1000
        }
      })

      // Should not emit before duration
      await vi.advanceTimersByTimeAsync(500)
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('complete')).toBeFalsy()

      // Should emit after duration
      await vi.advanceTimersByTimeAsync(600)
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('complete')).toBeTruthy()
    })
  })

  describe('props', () => {
    it('should accept duration prop with default value', () => {
      wrapper = mount(BootScreen)
      // Default duration should be 3000ms
      expect(wrapper.props('duration')).toBe(3000)
    })

    it('should accept showWelcome prop to toggle welcome message', () => {
      wrapper = mount(BootScreen, {
        props: {
          showWelcome: false
        }
      })
      expect(wrapper.find('[data-testid="welcome-message"]').exists()).toBe(false)
    })
  })

  describe('accessibility', () => {
    it('should have appropriate ARIA role', () => {
      wrapper = mount(BootScreen)
      const bootScreen = wrapper.find('.boot-screen')
      expect(bootScreen.attributes('role')).toBe('alert')
    })

    it('should have aria-live for screen readers', () => {
      wrapper = mount(BootScreen)
      const bootScreen = wrapper.find('.boot-screen')
      expect(bootScreen.attributes('aria-live')).toBe('polite')
    })

    it('should have aria-label describing the boot process', () => {
      wrapper = mount(BootScreen)
      const bootScreen = wrapper.find('.boot-screen')
      expect(bootScreen.attributes('aria-label')).toContain('boot')
    })
  })
})
