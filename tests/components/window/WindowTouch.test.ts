import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Window from '~/components/window/Window.vue'

// Mock useWindowManager
const mockMoveWindow = vi.fn()
const mockResizeWindow = vi.fn()
const mockActivateWindow = vi.fn()

vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => ({
    activateWindow: mockActivateWindow,
    closeWindow: vi.fn(),
    minimizeWindow: vi.fn(),
    maximizeWindow: vi.fn(),
    collapseWindow: vi.fn(),
    moveWindow: mockMoveWindow,
    resizeWindow: mockResizeWindow
  })
}))

describe('Window.vue Touch Support', () => {
  const defaultWindow = {
    id: 'test-window',
    title: 'Test Window',
    state: 'normal' as const,
    position: { x: 100, y: 100 },
    size: { width: 400, height: 300 },
    zIndex: 100,
    isActive: true,
    resizable: true,
    collapsible: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls moveWindow on touchmove after touchstart on title bar', async () => {
    const wrapper = mount(Window, {
      props: {
        window: defaultWindow
      }
    })

    const titleBar = wrapper.findComponent({ name: 'WindowTitleBar' })

    // Simulate touchstart
    await titleBar.trigger('touchstart', {
      touches: [{ clientX: 150, clientY: 110 }],
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    })

    // Simulate touchmove
    const touchMoveEvent = new CustomEvent('touchmove') as any
    touchMoveEvent.touches = [{ clientX: 200, clientY: 160 }]
    window.dispatchEvent(touchMoveEvent)

    expect(mockMoveWindow).toHaveBeenCalledWith('test-window', {
      x: 150, // 100 + (200 - 150)
      y: 150  // 100 + (160 - 110)
    })
  })

  it('calls resizeWindow on touchmove after touchstart on resize handle', async () => {
    const wrapper = mount(Window, {
      props: {
        window: defaultWindow
      }
    })

    const resizeHandle = wrapper.find('.window__resize-handle')

    // Simulate touchstart
    await resizeHandle.trigger('touchstart', {
      touches: [{ clientX: 500, clientY: 400 }],
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    })

    // Simulate touchmove
    const touchMoveEvent = new CustomEvent('touchmove') as any
    touchMoveEvent.touches = [{ clientX: 550, clientY: 460 }]
    window.dispatchEvent(touchMoveEvent)

    expect(mockResizeWindow).toHaveBeenCalledWith('test-window', {
      width: 450, // 400 + (550 - 500)
      height: 360 // 300 + (460 - 400)
    })
  })
})
