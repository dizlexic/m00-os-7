import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Window from '~/components/window/Window.vue'
import { WindowState } from '~/types/window'

describe('Window.vue', () => {
  const defaultWindow = {
    id: 'test-window',
    title: 'Test Window',
    state: 'normal' as const,
    position: { x: 100, y: 100 },
    size: { width: 400, height: 300 },
    zIndex: 100,
    isActive: true,
    resizable: true
  }

  it('renders correctly', () => {
    const wrapper = mount(Window, {
      props: {
        window: defaultWindow
      }
    })
    expect(wrapper.find('.window').exists()).toBe(true)
    expect(wrapper.find('.title-bar__title').text()).toBe('Test Window')
    expect(wrapper.find('.window__content').exists()).toBe(true)
  })

  it('applies active class when window is active', () => {
    const wrapper = mount(Window, {
      props: {
        window: { ...defaultWindow, isActive: true }
      }
    })
    expect(wrapper.classes()).toContain('window--active')
  })

  it('hides content when collapsed', () => {
    const wrapper = mount(Window, {
      props: {
        window: { ...defaultWindow, state: 'collapsed' as const }
      }
    })
    expect(wrapper.find('.window__body').exists()).toBe(false)
  })

  it('renders custom scrollbars', () => {
    const wrapper = mount(Window, {
      props: {
        window: defaultWindow
      }
    })
    expect(wrapper.find('.window__scrollbar-v').exists()).toBe(true)
    expect(wrapper.find('.window__scrollbar-h').exists()).toBe(true)
  })

  it('renders resize handle when resizable', () => {
    const wrapper = mount(Window, {
      props: {
        window: { ...defaultWindow, resizable: true }
      }
    })
    expect(wrapper.find('.window__resize-handle').exists()).toBe(true)
  })

  it('hides resize handle when not resizable', () => {
    const wrapper = mount(Window, {
      props: {
        window: { ...defaultWindow, resizable: false }
      }
    })
    expect(wrapper.find('.window__resize-handle').exists()).toBe(false)
  })

  it('stops propagation on mousedown to prevent desktop marquee selection', async () => {
    const wrapper = mount(Window, {
      props: {
        window: defaultWindow
      }
    })
    const event = {
      stopPropagation: vi.fn(),
      button: 0
    }
    // Root mousedown
    await wrapper.trigger('mousedown', event)
    expect(event.stopPropagation).toHaveBeenCalled()
  })

  it('stops propagation on title bar mousedown', async () => {
    const wrapper = mount(Window, {
      props: {
        window: defaultWindow
      }
    })
    const event = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
      button: 0
    }
    const titleBar = wrapper.findComponent({ name: 'WindowTitleBar' })
    await titleBar.trigger('mousedown', event)
    expect(event.stopPropagation).toHaveBeenCalled()
  })
})
