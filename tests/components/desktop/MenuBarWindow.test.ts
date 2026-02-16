import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuBar from '~/components/desktop/MenuBar.vue'

// Mock useWindowManager
const mockWindowManager = {
  windowList: {
    value: [
      { id: 'win-1', title: 'Window 1', isActive: true },
      { id: 'win-2', title: 'Window 2', isActive: false }
    ]
  },
  activeWindow: { value: null },
  openWindow: vi.fn(),
  updateWindow: vi.fn(),
  bringToFront: vi.fn()
}

vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => mockWindowManager
}))

vi.mock('~/composables/useSettings', () => ({
  useSettings: () => ({
    settings: { value: { menuBlinking: false } },
    updateSetting: vi.fn()
  })
}))

vi.mock('~/composables/useRecentItems', () => ({
  useRecentItems: () => ({
    recentApps: { value: [] },
    recentDocs: { value: [] }
  })
}))

vi.mock('~/composables/useClipboard', () => ({
  useClipboard: () => ({
    clipboard: { value: null },
    copy: vi.fn(),
    cut: vi.fn(),
    paste: vi.fn()
  })
}))

vi.mock('~/composables/useDesktop', () => ({
  useDesktop: () => ({
    icons: { value: [] },
    cleanUpDesktop: vi.fn(),
    updateIcon: vi.fn(),
    addIcon: vi.fn()
  })
}))

vi.mock('~/composables/useAlert', () => ({
  useAlert: () => ({
    showAlert: vi.fn()
  })
}))

vi.mock('~/composables/useTrash', () => ({
  useTrash: () => ({
    items: { value: [] },
    confirmEmptyTrash: vi.fn()
  })
}))

vi.mock('~/composables/useUser', () => ({
  useUser: () => ({
    currentUser: { value: { username: 'testuser' } },
    logout: vi.fn()
  })
}))

vi.mock('~/composables/useLabels', () => ({
  useLabels: () => ({
    getLabelMenuItems: vi.fn(() => [])
  })
}))

vi.mock('~/composables/useFileSystem', () => ({
  useFileSystem: () => ({
    createFolder: vi.fn(),
    getRoot: vi.fn(),
    getNodeByPath: vi.fn(),
    emptyTrash: vi.fn(),
    getNode: vi.fn(),
    moveToTrash: vi.fn(),
    getTrash: vi.fn(),
    updateNode: vi.fn(),
    copyNode: vi.fn(),
    createAlias: vi.fn(),
    getUniqueName: vi.fn()
  })
}))

describe('MenuBar Window Menu', () => {
  it('shows Window menu when Finder is active', () => {
    const wrapper = mount(MenuBar, {
      props: {
        appName: 'Finder'
      }
    })
    
    expect(wrapper.text()).toContain('Window')
  })

  it('contains all open windows', async () => {
    const wrapper = mount(MenuBar, {
      props: {
        appName: 'Finder'
      }
    })

    // Click on Window menu
    const menuItems = wrapper.findAll('.menu-bar__item')
    const windowMenu = menuItems.find(m => m.text().includes('Window'))
    await windowMenu?.trigger('click')

    expect(wrapper.text()).toContain('Window 1')
    expect(wrapper.text()).toContain('Window 2')
  })

  it('calls bringToFront when a window is clicked', async () => {
    const wrapper = mount(MenuBar, {
      props: {
        appName: 'Finder'
      }
    })

    // Click on Window menu
    const menuItems = wrapper.findAll('.menu-bar__item')
    const windowMenu = menuItems.find(m => m.text().includes('Window'))
    await windowMenu?.trigger('click')

    // Find "Window 2" item
    // Note: It's in the dropdown, which might be a different component
    // But since it's all in the same wrapper...
    const items = wrapper.findAll('.menu-dropdown__item')
    const window2Item = items.find(i => i.text().includes('Window 2'))
    
    await window2Item?.trigger('click')

    expect(mockWindowManager.bringToFront).toHaveBeenCalledWith('win-2')
  })
})
