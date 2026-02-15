/**
 * Clock Component Tests
 *
 * Tests for the Mac OS 7 style clock component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import Clock from '~/components/system/Clock.vue'
import { ref, nextTick, reactive } from 'vue'

// Mock useSettings
const mockSettings = ref({
  timeFormat: '12h',
  showSeconds: false,
  showDayOfWeek: false,
  dateFormat: 'MM/DD/YYYY',
  timezone: 'UTC',
  daylightSaving: false
})

vi.mock('~/composables/useSettings', () => ({
  useSettings: () => ({
    settings: mockSettings
  })
}))

describe('Clock.vue', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.useFakeTimers()
    // Set a fixed time for testing: 1991-05-13 10:30:00 UTC
    const date = new Date('1991-05-13T10:30:00Z')
    vi.setSystemTime(date)
    mockSettings.value = {
      timeFormat: '12h',
      showSeconds: false,
      showDayOfWeek: false,
      dateFormat: 'MM/DD/YYYY',
      timezone: 'UTC',
      daylightSaving: false
    }
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

    // Expect numeric date based on default MM/DD/YYYY
    expect(wrapper.text()).toContain('05/13/1991')
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

  it('should respect the timezone setting', async () => {
    wrapper = mount(Clock)
    await nextTick()
    expect(wrapper.text()).toContain('10:30 AM')

    // Change timezone to Tokyo (UTC+9)
    mockSettings.value.timezone = 'Asia/Tokyo'
    await nextTick()

    // 10:30 UTC -> 19:30 Tokyo
    // In 12h format: 7:30 PM
    expect(wrapper.text()).toContain('7:30 PM')
  })

  it('should show the day of the week when enabled', async () => {
    mockSettings.value.showDayOfWeek = true
    wrapper = mount(Clock)
    await nextTick()
    
    // 1991-05-13 is a Monday
    expect(wrapper.text()).toContain('Mon')
  })
})
