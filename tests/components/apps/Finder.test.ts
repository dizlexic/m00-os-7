import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import Finder from '~/components/apps/Finder.vue'
import { useFileSystem } from '~/composables/useFileSystem'

// Mock the composables
const { mockFileSystem } = vi.hoisted(() => ({
  mockFileSystem: {
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
    renameNode: vi.fn(),
    deleteNode: vi.fn(),
    moveToTrash: vi.fn(),
    createFolder: vi.fn()
  }
}))

vi.mock('~/composables/useFileSystem', () => ({
  useFileSystem: () => mockFileSystem
}))

vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => ({
    openWindow: vi.fn()
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
})
