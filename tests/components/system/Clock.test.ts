/**
 * Clock Component Tests
 *
 * Tests for the Mac OS 7 style clock component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import Clock from '~/components/system/Clock.vue'

describe('Clock.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.useFakeTimers()
    // Set a fixed time for testing: 1991-05-13 10:30:00 AM
    const date = new Date(1991, 4, 13, 10, 30, 0)
    vi.setSystemTime(date)
  })

  afterEach(() => {
    vi.useRealTimers()
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('should render the clock container', () => {
    wrapper = mount(Clock)
    expect(wrapper.find('.clock').exists()).toBe(true)
  })

  it('should display the current time in 12-hour format', async () => {
    wrapper = mount(Clock)
    await wrapper.vm.$nextTick()
    // 10:30 AM
    expect(wrapper.text()).toContain('10:30 AM')
  })

  it('should update the time automatically every minute', async () => {
    wrapper = mount(Clock)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('10:30 AM')

    // Advance time by 1 minute
    vi.advanceTimersByTime(60 * 1000)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('10:31 AM')
  })

  it('should toggle to date display when clicked', async () => {
    wrapper = mount(Clock)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('10:30 AM')

    await wrapper.find('.clock').trigger('click')

    // We'll use a format like "Mon, May 13, 1991" or "5/13/91"
    // Let's go with "May 13, 1991" for now as a baseline
    expect(wrapper.text()).toContain('May 13, 1991')
  })

  it('should toggle back to time when clicked again', async () => {
    wrapper = mount(Clock)
    await wrapper.find('.clock').trigger('click') // show date
    expect(wrapper.text()).toContain('1991')

    await wrapper.find('.clock').trigger('click') // show time
    expect(wrapper.text()).toContain('10:30 AM')
  })

  it('should have appropriate ARIA attributes', () => {
    wrapper = mount(Clock)
    expect(wrapper.find('.clock').attributes('role')).toBe('timer')
    expect(wrapper.find('.clock').attributes('aria-live')).toBe('polite')
  })
})
