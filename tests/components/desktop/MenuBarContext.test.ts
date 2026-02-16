import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import MenuBar from '~/components/desktop/MenuBar.vue'
import * as windowManager from '~/composables/useWindowManager'

// Mock useWindowManager
vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: vi.fn()
}))

describe('MenuBar Context-Specific Menus', () => {
  const mockActiveWindow = ref<any>(null)

  beforeEach(() => {
    vi.clearAllMocks()
    mockActiveWindow.value = null
    ;(windowManager.useWindowManager as any).mockReturnValue({
      activeWindow: mockActiveWindow,
      openWindow: vi.fn(),
      updateWindow: vi.fn()
    })
  })

  it('shows default menus when no window is active', () => {
    const wrapper = mount(MenuBar)
    expect(wrapper.text()).toContain('File')
    expect(wrapper.text()).toContain('Edit')
    expect(wrapper.text()).toContain('View')
    expect(wrapper.text()).toContain('Special')
  })

  it('shows custom menus from active window', async () => {
    mockActiveWindow.value = {
      id: 'test-window',
      type: 'custom',
      menus: [
        {
          id: 'custom-menu',
          label: 'Custom',
          items: [{ id: 'item1', label: 'Item 1', action: vi.fn() }]
        }
      ]
    }

    const wrapper = mount(MenuBar)
    expect(wrapper.text()).toContain('Custom')
    expect(wrapper.text()).not.toContain('View')
    expect(wrapper.text()).not.toContain('Special')
  })

  it('shows Finder menus when a finder window is active but has no custom menus', async () => {
    mockActiveWindow.value = {
      id: 'finder-window',
      type: 'finder',
      menus: undefined
    }

    const wrapper = mount(MenuBar)
    expect(wrapper.text()).toContain('View')
    expect(wrapper.text()).toContain('Special')
  })

  it('shows standard menus for other apps without custom menus', async () => {
    mockActiveWindow.value = {
      id: 'other-window',
      type: 'calculator',
      menus: undefined
    }

    const wrapper = mount(MenuBar)
    expect(wrapper.text()).toContain('File')
    expect(wrapper.text()).toContain('Edit')
    expect(wrapper.text()).toContain('Help')
    expect(wrapper.text()).not.toContain('View')
    expect(wrapper.text()).not.toContain('Special')
  })
})
