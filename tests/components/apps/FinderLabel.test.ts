import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Finder from '~/components/apps/Finder.vue'
import { LABEL_COLORS, LABEL_NAMES } from '~/types/filesystem'

// Mock useFileSystem
const mockFileSystem = {
  getChildren: vi.fn(() => []),
  getNode: vi.fn(),
  renameNode: vi.fn(),
  deleteNode: vi.fn(),
  getRoot: vi.fn(() => ({ id: 'root', name: 'Macintosh HD' })),
  getPathNodes: vi.fn(() => []),
  moveToTrash: vi.fn(),
  createFolder: vi.fn(),
  updateNode: vi.fn()
}

vi.mock('~/composables/useFileSystem', () => ({
  useFileSystem: () => mockFileSystem
}))

// Mock useWindowManager
vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => ({
    openWindow: vi.fn(),
    updateWindow: vi.fn(),
    getWindow: vi.fn(() => ({ id: 'win-1', data: {} }))
  })
}))

// Mock useDesktop
vi.mock('~/composables/useDesktop', () => ({
  useDesktop: () => ({
    showContextMenu: vi.fn()
  })
}))

// Mock useTrash
vi.mock('~/composables/useTrash', () => ({
  useTrash: () => ({
    restoreItem: vi.fn()
  })
}))

// Mock useRecentItems
vi.mock('~/composables/useRecentItems', () => ({
  useRecentItems: () => ({
    addRecentDoc: vi.fn()
  })
}))

describe('Finder.vue Label Support', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays label in list view', async () => {
    const itemWithLabel = {
      id: 'file-1',
      name: 'Labeled File',
      type: 'file',
      label: 1, // Essential (Orange)
      size: 1024,
      modifiedAt: Date.now()
    }

    mockFileSystem.getChildren.mockReturnValue([itemWithLabel])
    mockFileSystem.getNode.mockReturnValue({ id: 'root', name: 'Root' })

    const wrapper = mount(Finder, {
      props: {
        folderId: 'root'
      }
    })

    // Switch to list view
    const viewToggle = wrapper.find('.finder__view-toggle')
    await viewToggle.trigger('click')

    expect(wrapper.text()).toContain('Label')
    expect(wrapper.text()).toContain('Essential')

    const labelSpan = wrapper.find('.finder__item-name')
    expect(labelSpan.attributes('style')).toContain('background-color: #FF8000')
  })

  it('displays label in icon view', async () => {
    const itemWithLabel = {
      id: 'file-1',
      name: 'Labeled File',
      type: 'file',
      label: 2, // Hot (Red)
      size: 1024,
      modifiedAt: Date.now()
    }

    mockFileSystem.getChildren.mockReturnValue([itemWithLabel])
    mockFileSystem.getNode.mockReturnValue({ id: 'root', name: 'Root' })

    const wrapper = mount(Finder, {
      props: {
        folderId: 'root'
      }
    })

    const labelDiv = wrapper.find('.finder__item-label')
    expect(labelDiv.attributes('style')).toContain('background-color: #FF0000')
  })
})
