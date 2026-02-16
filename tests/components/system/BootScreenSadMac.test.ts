import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BootScreen from '~/components/system/BootScreen.vue'

// Mock useSound
vi.mock('~/composables/useSound', () => ({
  useSound: () => ({
    playStartupChime: vi.fn()
  })
}))

describe('BootScreen.vue - Sad Mac functionality', () => {
  it('renders Happy Mac by default', () => {
    const wrapper = mount(BootScreen)
    expect(wrapper.find('[data-testid="happy-mac"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="sad-mac"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="progress-bar"]').exists()).toBe(true)
  })

  it('renders Sad Mac when hasError is true', () => {
    const wrapper = mount(BootScreen, {
      props: {
        hasError: true,
        errorCode: '0000000F'
      }
    })
    expect(wrapper.find('[data-testid="happy-mac"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="sad-mac"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="error-screen"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('0000000F')
    expect(wrapper.find('[data-testid="progress-bar"]').exists()).toBe(false)
    expect(wrapper.classes()).toContain('boot-screen--error')
  })

  it('does not start progress interval if hasError is true', () => {
    vi.useFakeTimers()
    const wrapper = mount(BootScreen, {
      props: {
        hasError: true
      }
    })
    
    vi.advanceTimersByTime(1000)
    // Progress should stay 0
    // We can't easily check internal 'progress' ref without exposing it or checking style
    // But progress-bar should not even be in the DOM
    expect(wrapper.find('[data-testid="progress-bar"]').exists()).toBe(false)
    vi.useRealTimers()
  })
})
