import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import Finder from '~/components/apps/Finder.vue'
import { useFileSystem } from '~/composables/useFileSystem'
import { useWindowManager } from '~/composables/useWindowManager'

// Mock data
const { mockFileSystem, mockWindowManager } = vi.hoisted(() => ({
  mockFileSystem: {
    getChildren: vi.fn(),
    getNode: vi.fn(),
    getRoot: vi.fn(() => ({ id: 'root', name: 'Macintosh HD' })),
    getPathNodes: vi.fn(() => []),
    getTrash: vi.fn(),
    renameNode: vi.fn(),
    deleteNode: vi.fn(),
    moveToTrash: vi.fn(),
    createFolder: vi.fn(),
  },
  mockWindowManager: {
    openWindow: vi.fn(),
    updateWindow: vi.fn(),
    getWindow: vi.fn(() => ({ id: 'win-1', data: {} })),
    activeWindow: { value: null }
  }
}))

vi.mock('~/composables/useFileSystem', () => ({
  useFileSystem: () => mockFileSystem
}))

vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => mockWindowManager
}))

vi.mock('~/composables/useRecentItems', () => ({
  useRecentItems: () => ({
    addRecentDoc: vi.fn()
  })
}))

vi.mock('~/composables/useDesktop', () => ({
  useDesktop: () => ({
    showContextMenu: vi.fn()
  })
}))

vi.mock('~/composables/useTrash', () => ({
  useTrash: () => ({
    restoreItem: vi.fn()
  })
}))

describe('Finder.vue View Modes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFileSystem.getChildren.mockReturnValue([
      { id: 'b', name: 'Zebra', type: 'folder', size: 0, modifiedAt: 1000 },
      { id: 'a', name: 'Apple', type: 'file', size: 5000, modifiedAt: 2000 },
      { id: 'c', name: 'Banana', type: 'file', size: 2000, modifiedAt: 1500 }
    ])
    mockFileSystem.getNode.mockImplementation((id) => ({ id, name: id, type: 'folder' }))
  })

  it('switches between icon and list views', async () => {
    const wrapper = mount(Finder, {
      props: { folderId: 'root', windowId: 'win-1' }
    })

    // Default is icon view
    expect(wrapper.find('.finder__content--list').exists()).toBe(false)
    expect(wrapper.findAll('.finder__item--icon')).toHaveLength(3)

    // Simulate view change via window data
    mockWindowManager.getWindow.mockReturnValue({ id: 'win-1', data: { viewMode: 'name' } })
    // We need to trigger the watch. Since it watches a function that calls getWindow, 
    // we might need to trigger some reactivity or just wait.
    // In the component: watch(() => useWindowManager().getWindow(props.windowId || '')?.data?.viewMode, ...)
    
    // For testing, we can also just set the internal viewMode if we could, 
    // but better to test the watch.
    // To trigger the watch in Vitest with mocked composables, 
    // we might need to make getWindow return a reactive object or use a ref.
    
    // Let's try changing it directly via the toggle button if it still exists
    const toggleButton = wrapper.find('.finder__view-toggle')
    await toggleButton.trigger('click')
    
    expect(wrapper.find('.finder__content--list').exists()).toBe(true)
    expect(wrapper.findAll('.finder__item--list')).toHaveLength(3)
  })

  it('sorts items by name', async () => {
    const wrapper = mount(Finder, {
      props: { folderId: 'root', windowId: 'win-1' }
    })

    // Switch to list view sorted by name
    await wrapper.find('.finder__view-toggle').trigger('click') 
    // Note: toggleViewMode switches 'icon' -> 'name' in our new implementation
    
    await nextTick()
    
    const itemNames = wrapper.findAll('.finder__item-name').map(w => w.text())
    expect(itemNames).toEqual(['Apple', 'Banana', 'Zebra'])
  })

  it('sorts items by size', async () => {
    const wrapper = mount(Finder, {
      props: { folderId: 'root', windowId: 'win-1' }
    })

    // We can't easily click headers in icon view, so we must be in list view
    await wrapper.find('.finder__view-toggle').trigger('click')
    await nextTick()

    // Click Size header
    await wrapper.find('.finder__list-col--size').trigger('click')
    await nextTick()

    const itemNames = wrapper.findAll('.finder__item-name').map(w => w.text())
    // Sizes were: Apple (5000), Banana (2000), Zebra (0)
    expect(itemNames).toEqual(['Apple', 'Banana', 'Zebra'])
  })

  it('sorts items by date', async () => {
    const wrapper = mount(Finder, {
      props: { folderId: 'root', windowId: 'win-1' }
    })

    await wrapper.find('.finder__view-toggle').trigger('click')
    await nextTick()

    // Click Date header
    await wrapper.find('.finder__list-col--date').trigger('click')
    await nextTick()

    const itemNames = wrapper.findAll('.finder__item-name').map(w => w.text())
    // Dates were: Zebra (1000), Apple (2000), Banana (1500)
    // Sorted descending by date: Apple, Banana, Zebra
    expect(itemNames).toEqual(['Apple', 'Banana', 'Zebra'])
  })

  it('renders small-icon view', async () => {
    const wrapper = mount(Finder, {
      props: { folderId: 'root', windowId: 'win-1' }
    })

    await nextTick();
    (wrapper.vm as any).viewMode = 'small-icon'
    await nextTick()

    expect(wrapper.find('.finder__content--small-icon').exists()).toBe(true)
    expect(wrapper.findAll('.finder__item--small-icon')).toHaveLength(3)
  })
})
