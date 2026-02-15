import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Desktop from '~/components/desktop/Desktop.vue'
import { useDesktop } from '~/composables/useDesktop'

const mockUseDesktop = {
  icons: [],
  backgroundPattern: { value: { id: 'default', pattern: '#999', isSolid: true } },
  marquee: { value: { isActive: false } },
  contextMenu: { value: { isVisible: false, position: { x: 0, y: 0 }, items: [] } },
  deselectAll: vi.fn(),
  startMarquee: vi.fn(),
  updateMarquee: vi.fn(),
  endMarquee: vi.fn(),
  showContextMenu: vi.fn(),
  hideContextMenu: vi.fn(),
  initializeDesktop: vi.fn(),
  cleanUpDesktop: vi.fn()
}

// Mock useDesktop
vi.mock('~/composables/useDesktop', () => ({
  useDesktop: vi.fn(() => mockUseDesktop)
}))

// Mock useWindowManager
vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => ({
    windowList: []
  })
}))

// Mock useFileSystem
vi.mock('~/composables/useFileSystem', () => ({
  useFileSystem: () => ({
    getRoot: () => ({ id: 'root' }),
    getNodeByPath: vi.fn()
  })
}))

describe('Desktop.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(Desktop)
    expect(wrapper.find('.desktop').exists()).toBe(true)
  })

  it('triggers context menu on right click', async () => {
    const wrapper = mount(Desktop)
    const desktop = wrapper.find('.desktop')

    await desktop.trigger('contextmenu', {
      preventDefault: vi.fn(),
      clientX: 100,
      clientY: 200
    })

    expect(mockUseDesktop.showContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({ x: 100, y: 200 }),
      expect.any(Array)
    )
  })

  it('hides context menu on left click', async () => {
    const wrapper = mount(Desktop)
    const desktop = wrapper.find('.desktop')

    await desktop.trigger('mousedown', { button: 0 })

    expect(mockUseDesktop.hideContextMenu).toHaveBeenCalled()
  })
})
