import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RemoteCursor from '~/components/stc/RemoteCursor.vue'
import type { RemoteUser } from '~/types/stc'

describe('RemoteCursor.vue', () => {
  const createMockUser = (overrides: Partial<RemoteUser> = {}): RemoteUser => ({
    id: 'user-123',
    username: 'TestUser',
    position: { x: 100, y: 200 },
    cursor: {
      style: 'arrow',
      color: '#FF0000'
    },
    isActive: true,
    lastActivity: Date.now(),
    ...overrides
  })

  it('renders correctly with user data', () => {
    const user = createMockUser()
    const wrapper = mount(RemoteCursor, {
      props: { user }
    })

    expect(wrapper.find('.remote-cursor').exists()).toBe(true)
  })

  it('positions cursor at user position', () => {
    const user = createMockUser({ position: { x: 150, y: 250 } })
    const wrapper = mount(RemoteCursor, {
      props: { user }
    })

    const cursor = wrapper.find('.remote-cursor')
    expect(cursor.attributes('style')).toContain('left: 150px')
    expect(cursor.attributes('style')).toContain('top: 250px')
  })

  it('displays username label by default', () => {
    const user = createMockUser({ username: 'JohnDoe' })
    const wrapper = mount(RemoteCursor, {
      props: { user }
    })

    const label = wrapper.find('.remote-cursor__label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('JohnDoe')
  })

  it('hides username label when showLabel is false', () => {
    const user = createMockUser()
    const wrapper = mount(RemoteCursor, {
      props: { user, showLabel: false }
    })

    expect(wrapper.find('.remote-cursor__label').exists()).toBe(false)
  })

  it('applies cursor color to label background', () => {
    const user = createMockUser({ cursor: { style: 'arrow', color: '#00FF00' } })
    const wrapper = mount(RemoteCursor, {
      props: { user }
    })

    const label = wrapper.find('.remote-cursor__label')
    const style = label.attributes('style')
    // Accept either hex or rgb format
    expect(style).toMatch(/background-color:\s*(#00FF00|rgb\(0,\s*255,\s*0\))/i)
  })

  it('renders SVG cursor icon', () => {
    const user = createMockUser()
    const wrapper = mount(RemoteCursor, {
      props: { user }
    })

    expect(wrapper.find('.remote-cursor__icon').exists()).toBe(true)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('applies inactive class when user is inactive', () => {
    const thirtyOneSecondsAgo = Date.now() - 31000
    const user = createMockUser({ lastActivity: thirtyOneSecondsAgo })
    const wrapper = mount(RemoteCursor, {
      props: { user }
    })

    expect(wrapper.find('.remote-cursor--inactive').exists()).toBe(true)
  })

  it('does not apply inactive class when user is active', () => {
    const user = createMockUser({ lastActivity: Date.now() })
    const wrapper = mount(RemoteCursor, {
      props: { user }
    })

    expect(wrapper.find('.remote-cursor--inactive').exists()).toBe(false)
  })

  it('renders different cursor styles', () => {
    const styles = ['arrow', 'hand', 'crosshair', 'pointer'] as const

    for (const style of styles) {
      const user = createMockUser({ cursor: { style, color: '#FF0000' } })
      const wrapper = mount(RemoteCursor, {
        props: { user }
      })

      // Should render without errors for each style
      expect(wrapper.find('.remote-cursor').exists()).toBe(true)
      expect(wrapper.find('path').exists()).toBe(true)
    }
  })
})
