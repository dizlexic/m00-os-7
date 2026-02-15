import { ref, nextTick } from 'vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTrash } from '~/composables/useTrash'
import { useDesktop } from '~/composables/useDesktop'

// Define stable mocks outside the factory
const mockIcons = ref([
  { id: '1', name: 'File 1', type: 'document', path: '/file1', icon: 'file.png' },
  { id: 'trash-id', name: 'Trash', type: 'trash', path: '/trash', icon: '/assets/icons/system/trash-empty.png' }
])
const mockTrashItems = ref<any[]>([])

const mockRemoveIcon = vi.fn((id: string) => {
  mockIcons.value = mockIcons.value.filter(i => i.id !== id)
})
const mockUpdateIcon = vi.fn((id: string, updates: any) => {
  const icon = mockIcons.value.find(i => i.id === id)
  if (icon) Object.assign(icon, updates)
})

// Mock useDesktop
vi.mock('~/composables/useDesktop', () => {
  return {
    useDesktop: () => ({
      icons: mockIcons,
      removeIcon: mockRemoveIcon,
      updateIcon: mockUpdateIcon
    })
  }
})

// Mock useFileSystem
const mockFileSystem = {
  // ... (keep existing)
  state: ref({ nodes: {} as Record<string, any> }),
  getTrash: vi.fn(() => ({ id: 'trash-folder-id', name: 'Trash', type: 'folder', isSystem: true })),
  getChildren: vi.fn((id: string) => id === 'trash-folder-id' ? mockTrashItems.value : []),
  getNode: vi.fn((id: string) => mockFileSystem.state.value.nodes[id]),
  getRoot: vi.fn(() => ({ id: 'root', name: 'Macintosh HD', type: 'folder' })),
  moveToTrash: vi.fn((id: string) => {
    // Don't trash the trash icon itself
    if (id === 'trash-id') return
    const item = mockIcons.value.find(i => i.id === id)
    if (item) {
      mockTrashItems.value = [...mockTrashItems.value, item]
    }
  }),
  emptyTrash: vi.fn(() => {
    mockTrashItems.value = []
  }),
  moveNode: vi.fn(),
  updateNode: vi.fn()
}

vi.mock('~/composables/useFileSystem', () => ({
  useFileSystem: () => mockFileSystem
}))

const mockShowAlert = vi.fn((options: any) => {
  if (options.onClose) options.onClose('ok')
})

vi.mock('~/composables/useAlert', () => ({
  useAlert: () => ({
    showAlert: mockShowAlert,
    hideAlert: vi.fn()
  })
}))

describe('useTrash', () => {
  beforeEach(() => {
    // Reset icons
    mockIcons.value = [
      { id: '1', name: 'File 1', type: 'document', path: '/file1', icon: 'file.png' },
      { id: 'trash-id', name: 'Trash', type: 'trash', path: '/trash', icon: '/assets/icons/system/trash-empty.png' }
    ]
    mockTrashItems.value = []
    vi.clearAllMocks()
  })

  it('should be empty by default', () => {
    const { isEmpty, items } = useTrash()
    expect(isEmpty.value).toBe(true)
    expect(items.value).toHaveLength(0)
  })

  it('should move item to trash', () => {
    const { moveToTrash, isEmpty, items } = useTrash()
    const { removeIcon } = useDesktop()

    moveToTrash('1')

    expect(isEmpty.value).toBe(false)
    expect(items.value).toHaveLength(1)
    expect(items.value[0].name).toBe('File 1')
    expect(removeIcon).toHaveBeenCalledWith('1')
  })

  it('should not trash the trash itself', () => {
    const { moveToTrash, isEmpty } = useTrash()
    moveToTrash('trash-id')
    expect(isEmpty.value).toBe(true)
  })

  it('should update trash icon when items are added', async () => {
    const { moveToTrash, trashIcon } = useTrash()
    const { updateIcon } = useDesktop()

    moveToTrash('1')
    await nextTick()

    expect(trashIcon.value).toContain('trash-full.png')
    expect(updateIcon).toHaveBeenCalledWith('trash-id', expect.objectContaining({
      icon: expect.stringContaining('trash-full.png')
    }))
  })

  it('should empty the trash after confirmation', () => {
    const { moveToTrash, emptyTrash, isEmpty } = useTrash()
    moveToTrash('1')
    expect(isEmpty.value).toBe(false)

    emptyTrash()
    
    expect(mockShowAlert).toHaveBeenCalledWith(expect.objectContaining({
      type: 'caution',
      message: expect.stringContaining('permanently deleted')
    }))
    expect(isEmpty.value).toBe(true)
  })

  it('should restore item from trash (put away)', () => {
    const { restoreItem } = useTrash()

    // Setup node with metadata
    const node = {
      id: '1',
      name: 'File 1',
      parentId: 'trash-folder-id',
      metadata: { originalParentId: 'root' }
    }
    mockFileSystem.state.value.nodes = {
      '1': node,
      'root': { id: 'root', type: 'folder' }
    }

    restoreItem('1')

    expect(mockFileSystem.moveNode).toHaveBeenCalledWith('1', 'root')
    expect(mockFileSystem.updateNode).toHaveBeenCalledWith('1', expect.objectContaining({
      metadata: expect.not.objectContaining({ originalParentId: expect.anything() })
    }))
  })

  it('should restore to root if original parent is missing', () => {
    const { restoreItem } = useTrash()

    // Setup node with metadata but missing parent
    const node = {
      id: '1',
      name: 'File 1',
      parentId: 'trash-folder-id',
      metadata: { originalParentId: 'non-existent' }
    }
    mockFileSystem.state.value.nodes = {
      '1': node,
      'root': { id: 'root', name: 'Macintosh HD', type: 'folder' }
    }

    restoreItem('1')

    expect(mockFileSystem.moveNode).toHaveBeenCalledWith('1', 'root')
  })
})
