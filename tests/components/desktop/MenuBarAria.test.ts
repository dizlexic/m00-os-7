import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuBar from '~/components/desktop/MenuBar.vue'

// Mock composables
vi.mock('~/composables/useFileSystem', () => ({
  useFileSystem: () => ({
    createFolder: vi.fn(),
    getRoot: () => ({ id: 'root' }),
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

vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => ({
    windowList: { value: [] },
    activeWindow: { value: null },
    openWindow: vi.fn(),
    updateWindow: vi.fn(),
    bringToFront: vi.fn(),
    closeWindow: vi.fn()
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
    restoreItem: vi.fn(),
    items: { value: [] },
    emptyTrash: vi.fn()
  })
}))

vi.mock('~/composables/useUser', () => ({
  useUser: () => ({
    logout: vi.fn(),
    currentUser: { value: { username: 'testuser' } }
  })
}))

vi.mock('~/composables/useLabels', () => ({
  useLabels: () => ({
    getLabelMenuItems: () => []
  })
}))

describe('MenuBar.vue ARIA', () => {
  it('has ARIA role and labels for menu items', () => {
    const wrapper = mount(MenuBar, {
      props: {
        appName: 'Finder'
      }
    })

    const appleMenu = wrapper.find('.menu-bar__item--apple')
    expect(appleMenu.attributes('role')).toBe('menuitem')
    expect(appleMenu.attributes('aria-haspopup')).toBe('true')
    expect(appleMenu.attributes('aria-label')).toBe('Apple menu')

    const appMenu = wrapper.find('.menu-bar__app-name')
    expect(appMenu.attributes('role')).toBe('menuitem')
    expect(appMenu.attributes('aria-haspopup')).toBe('true')
    expect(appMenu.attributes('aria-label')).toBe('Application menu: Finder')
  })
})
