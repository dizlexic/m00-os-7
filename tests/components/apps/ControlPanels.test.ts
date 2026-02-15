import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ControlPanels from '~/components/apps/ControlPanels.vue'

vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => ({
    openWindow: vi.fn()
  })
}))

describe('ControlPanels.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(ControlPanels)
    expect(wrapper.find('.control-panels').exists()).toBe(true)
  })

  it('displays a list of control panels', () => {
    const wrapper = mount(ControlPanels)
    const items = wrapper.findAll('.control-panels__item')
    expect(items.length).toBeGreaterThan(0)
  })

  it('displays General Controls icon', () => {
    const wrapper = mount(ControlPanels)
    expect(wrapper.text()).toContain('General Controls')
  })

  it('displays Date & Time icon', () => {
    const wrapper = mount(ControlPanels)
    expect(wrapper.text()).toContain('Date & Time')
  })
})
