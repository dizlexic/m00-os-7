import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import MenuBar from '~/components/desktop/MenuBar.vue'

// Mock composables
const mockWindowManager = {
  activeWindow: ref(null),
  openWindow: vi.fn(),
  updateWindow: vi.fn(),
  getWindow: vi.fn()
}

const mockDesktop = {
  icons: ref([]),
  cleanUpDesktop: vi.fn()
}

vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => mockWindowManager
}))

vi.mock('~/composables/useDesktop', () => ({
  useDesktop: () => mockDesktop
}))

vi.mock('~/composables/useFileSystem', () => ({
  useFileSystem: () => ({
    createFolder: vi.fn(),
    getRoot: vi.fn(() => ({ id: 'root' })),
    getNodeByPath: vi.fn(),
    emptyTrash: vi.fn(),
    getNode: vi.fn(),
    moveToTrash: vi.fn(),
    getTrash: vi.fn()
  })
}))

vi.mock('~/composables/useRecentItems', () => ({
  useRecentItems: () => ({
    recentApps: ref([]),
    recentDocs: ref([])
  })
}))

vi.mock('~/composables/useClipboard', () => ({
  useClipboard: () => ({
    clipboard: ref(null),
    copy: vi.fn(),
    cut: vi.fn(),
    paste: vi.fn()
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
    items: ref([]),
    emptyTrash: vi.fn()
  })
}))

vi.mock('~/composables/useUser', () => ({
  useUser: () => ({
    logout: vi.fn(),
    currentUser: ref({ username: 'testuser' })
  })
}))

vi.mock('~/composables/useSharedDesktop', () => ({
  useSharedDesktop: () => ({
    settings: ref({ showRemoteCursors: false, showCursorLabels: false }),
    isInSession: ref(false),
    remoteUsersList: ref([]),
    sendCursorPosition: vi.fn()
  })
}))

describe('MenuBar.vue Finder integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWindowManager.activeWindow.value = null
  })

  it('shows "Clean Up Desktop" when no window is active', async () => {
    const wrapper = mount(MenuBar)

    // Open View menu
    const viewMenu = wrapper.findAll('.menu-bar__item').find(m => m.text().includes('View'))
    await viewMenu?.trigger('click')

    expect(wrapper.text()).toContain('Clean Up Desktop')
  })

  it('shows "Clean Up Window" when a Finder window is active', async () => {
    mockWindowManager.activeWindow.value = { id: 'win-1', type: 'finder', data: {} } as any
    const wrapper = mount(MenuBar)

    const viewMenu = wrapper.findAll('.menu-bar__item').find(m => m.text().includes('View'))
    await viewMenu?.trigger('click')

    expect(wrapper.text()).toContain('Clean Up Window')
  })

  it('updates view mode when a View menu item is clicked', async () => {
    mockWindowManager.activeWindow.value = { id: 'win-1', type: 'finder', data: { viewMode: 'icon' } } as any
    const wrapper = mount(MenuBar)

    const viewMenu = wrapper.findAll('.menu-bar__item').find(m => m.text().includes('View'))
    await viewMenu?.trigger('click')

    const byNameItem = wrapper.findAll('.menu-dropdown__item').find(i => i.text().includes('by Name'))
    await byNameItem?.trigger('click')

    expect(mockWindowManager.updateWindow).toHaveBeenCalledWith('win-1', expect.objectContaining({
      data: expect.objectContaining({ viewMode: 'name' })
    }))
  })

  it('shows checkmark for the current view mode', async () => {
    mockWindowManager.activeWindow.value = { id: 'win-1', type: 'finder', data: { viewMode: 'kind' } } as any
    const wrapper = mount(MenuBar)

    const viewMenu = wrapper.findAll('.menu-bar__item').find(m => m.text().includes('View'))
    await viewMenu?.trigger('click')

    const kindItem = wrapper.findAll('.menu-dropdown__item').find(i => i.text().includes('by Kind'))
    expect(kindItem?.find('.menu-dropdown__check').text()).toBe('✓')

    const nameItem = wrapper.findAll('.menu-dropdown__item').find(i => i.text().includes('by Name'))
    expect(nameItem?.find('.menu-dropdown__check').text()).toBe('')
  })
})
