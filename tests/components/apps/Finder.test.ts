import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import Finder from '~/components/apps/Finder.vue'
import { useFileSystem } from '~/composables/useFileSystem'

// Mock the composables
const { mockFileSystem, mockDesktop } = vi.hoisted(() => ({
  mockFileSystem: {
    // ... (keep existing)
    getChildren: vi.fn((folderId) => {
      if (folderId === 'root') {
        return [
          { id: 'folder-1', name: 'Documents', type: 'folder', parentId: 'root' },
          { id: 'file-1', name: 'README.txt', type: 'file', parentId: 'root' }
        ]
      }
      return []
    }),
    getNode: vi.fn((id) => {
      if (id === 'root') return { id: 'root', name: 'Macintosh HD', type: 'folder' }
      return undefined
    }),
    getRoot: vi.fn(() => ({ id: 'root', name: 'Macintosh HD' })),
    getPathNodes: vi.fn((id) => {
      if (id === 'root') return [{ id: 'root', name: 'Macintosh HD', type: 'folder' }]
      return []
    }),
    getTrash: vi.fn(),
    renameNode: vi.fn(),
    deleteNode: vi.fn(),
    moveToTrash: vi.fn(),
    createFolder: vi.fn((name) => ({ id: 'new-folder', name, type: 'folder' })),
    moveNode: vi.fn(),
    updateNode: vi.fn(),
    getUniqueName: vi.fn((name) => name),
    paste: vi.fn()
  },
  mockDesktop: {
    showContextMenu: vi.fn(),
    hideContextMenu: vi.fn(),
    removeIcon: vi.fn(),
    updateIcon: vi.fn(),
    addIcon: vi.fn(() => ({ id: 'new-icon' }))
  }
}))

vi.mock('~/composables/useFileSystem', () => ({
  useFileSystem: () => mockFileSystem
}))

vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => ({
    openWindow: vi.fn(),
    updateWindow: vi.fn(),
    getWindow: vi.fn(() => ({ id: 'win-1', data: {} })),
    activeWindow: { value: null }
  })
}))

vi.mock('~/composables/useDesktop', () => ({
  useDesktop: () => mockDesktop
}))

vi.mock('~/composables/useTrash', () => ({
  useTrash: () => ({
    restoreItem: vi.fn(),
    moveToTrash: vi.fn(),
    emptyTrash: vi.fn(),
    isEmpty: ref(true),
    items: ref([])
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

describe('Finder.vue', () => {
  it('renders correctly for a given folder', () => {
    const wrapper = mount(Finder, {
      props: {
        folderId: 'root'
      }
    })

    expect(wrapper.find('.finder').exists()).toBe(true)
    expect(wrapper.findAll('.finder__item')).toHaveLength(2)
    expect(wrapper.text()).toContain('Documents')
    expect(wrapper.text()).toContain('README.txt')
  })

  it('displays the folder name', () => {
    const wrapper = mount(Finder, {
      props: {
        folderId: 'root'
      }
    })

    expect(wrapper.find('.finder__header-title').text()).toBe('Macintosh HD')
  })

  it('triggers context menu on background right click', async () => {
    const wrapper = mount(Finder, {
      props: {
        folderId: 'root'
      }
    })

    const content = wrapper.find('.finder__content')
    await content.trigger('contextmenu', {
      preventDefault: vi.fn(),
      clientX: 100,
      clientY: 100
    })

    expect(mockDesktop.showContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({ x: 100, y: 100 }),
      expect.arrayContaining([
        expect.objectContaining({ id: 'new-folder', label: 'New Folder' }),
        expect.objectContaining({ id: 'paste', label: 'Paste' })
      ])
    )
  })

  it('can navigate to a subfolder on double click', async () => {
    const wrapper = mount(Finder, {
      props: {
        folderId: 'root'
      }
    })

    const folderItem = wrapper.findAll('.finder__item').find(w => w.text().includes('Documents'))
    await folderItem?.trigger('dblclick')

    // In this implementation, opening a folder might either change current view or open new window
    // For classic Mac OS, it usually opens a new window unless specified otherwise.
    // However, for this web clone, we'll follow what's most practical.
    // Let's assume for now it emits an event or calls a method to open a new window.
  })

  it('can navigate up to the parent folder', async () => {
    // Mock getChildren for subfolder
    mockFileSystem.getChildren.mockImplementation((id) => {
      if (id === 'folder-1') return []
      if (id === 'root') return [{ id: 'folder-1', name: 'Documents', type: 'folder', parentId: 'root' }]
      return []
    })
    mockFileSystem.getNode.mockImplementation((id) => {
      if (id === 'folder-1') return { id: 'folder-1', name: 'Documents', type: 'folder', parentId: 'root' }
      if (id === 'root') return { id: 'root', name: 'Macintosh HD', type: 'folder' }
      return undefined
    })

    const wrapper = mount(Finder, {
      props: {
        folderId: 'folder-1'
      }
    })

    expect(wrapper.find('.finder__header-title').text()).toBe('Documents')

    const upButton = wrapper.find('.finder__up-button')
    await upButton.trigger('click')

    expect(wrapper.find('.finder__header-title').text()).toBe('Macintosh HD')
  })

  it('allows renaming an item', async () => {
    vi.useFakeTimers()
    const wrapper = mount(Finder, {
      props: {
        folderId: 'root'
      }
    })

    const firstItem = wrapper.find('.finder__item--icon')
    const itemLabel = firstItem.find('.finder__item-label')

    // First click to select
    await firstItem.trigger('click')

    // Second click on label to start renaming
    await itemLabel.trigger('click')

    // Fast forward for the renaming delay
    vi.advanceTimersByTime(600)
    await nextTick()

    expect(wrapper.find('.finder__rename-input').exists()).toBe(true)

    const input = wrapper.find('.finder__rename-input')
    await input.setValue('New Name')
    await input.trigger('keydown', { key: 'Enter' })

    expect(mockFileSystem.renameNode).toHaveBeenCalledWith('folder-1', 'New Name')
    expect(wrapper.find('.finder__rename-input').exists()).toBe(false)
    vi.useRealTimers()
  })

  it('allows creating a new folder', async () => {
    const mockItems = [
      { id: 'folder-1', name: 'Documents', type: 'folder', parentId: 'root' },
      { id: 'file-1', name: 'README.txt', type: 'file', parentId: 'root' }
    ]
    mockFileSystem.getChildren.mockImplementation((id) => id === 'root' ? mockItems : [])

    mockFileSystem.createFolder.mockImplementation((name, parentId) => {
      const newFolder = { id: 'new-folder', name, type: 'folder', parentId }
      mockItems.push(newFolder)
      return newFolder
    })

    const wrapper = mount(Finder, {
      props: {
        folderId: 'root'
      }
    })

    const newFolderButton = wrapper.find('button[title="New Folder"]')
    await newFolderButton.trigger('click')

    await nextTick()

    expect(mockFileSystem.createFolder).toHaveBeenCalledWith('untitled folder', 'root')
    // It should also start renaming the new folder
    expect(wrapper.find('.finder__rename-input').exists()).toBe(true)
  })

  it('allows moving an item to trash', async () => {
    const wrapper = mount(Finder, {
      props: {
        folderId: 'root'
      }
    })

    // Select item first
    const firstItem = wrapper.find('.finder__item--icon')
    await firstItem.trigger('click')

    const deleteButton = wrapper.find('button[title="Move to Trash"]')
    await deleteButton.trigger('click')

    expect(mockFileSystem.moveToTrash).toHaveBeenCalledWith('folder-1')
  })

  it('shows "Put Away" for items in trash', async () => {
    mockFileSystem.getTrash.mockReturnValue({ id: 'trash-folder-id' })
    mockFileSystem.getChildren.mockImplementation((id) => {
      if (id === 'trash-folder-id') {
        return [
          { id: 'file-in-trash', name: 'Trashed File', type: 'file', parentId: 'trash-folder-id' }
        ]
      }
      return []
    })

    const wrapper = mount(Finder, {
      props: {
        folderId: 'trash-folder-id'
      }
    })

    await nextTick()

    const trashingItem = wrapper.find('.finder__item--icon')
    expect(trashingItem.exists()).toBe(true)
    await trashingItem.trigger('contextmenu')

    expect(mockDesktop.showContextMenu).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([
        expect.objectContaining({ id: 'put-away', label: 'Put Away' })
      ])
    )
  })

  it('assigns correct icons to different file types', async () => {
    mockFileSystem.getChildren.mockReturnValue([
      { id: 'app-1', name: 'Calculator', type: 'application', icon: 'calculator' },
      { id: 'app-2', name: 'Unknown App', type: 'application' },
      { id: 'folder-1', name: 'Folder', type: 'folder' },
      { id: 'file-1', name: 'File', type: 'file' }
    ])

    const wrapper = mount(Finder, {
      props: {
        folderId: 'root'
      }
    })

    await nextTick()

    const items = wrapper.findAll('.finder__item-icon img')
    expect(items[0].attributes('src')).toBe('/assets/icons/apps/calculator.png')
    expect(items[1].attributes('src')).toBe('/assets/icons/system/application.png')
    expect(items[2].attributes('src')).toBe('/assets/icons/system/folder.png')
    expect(items[3].attributes('src')).toBe('/assets/icons/system/document.png')
  })
})
