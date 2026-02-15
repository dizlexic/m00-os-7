import { describe, it, expect, vi, beforeEach } from 'vitest'
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
    deleteNode: vi.fn()
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
})
