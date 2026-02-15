import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTrash } from '~/composables/useTrash'
import { useDesktop } from '~/composables/useDesktop'

// Define stable mocks outside the factory
const mockIcons = {
  value: [
    { id: '1', name: 'File 1', type: 'document', path: '/file1', icon: 'file.png' },
    { id: 'trash-id', name: 'Trash', type: 'trash', path: '/trash', icon: '/assets/icons/system/trash-empty.png' }
  ]
}
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

describe('useTrash', () => {
  beforeEach(() => {
    // Reset icons
    mockIcons.value = [
      { id: '1', name: 'File 1', type: 'document', path: '/file1', icon: 'file.png' },
      { id: 'trash-id', name: 'Trash', type: 'trash', path: '/trash', icon: '/assets/icons/system/trash-empty.png' }
    ]
    const { emptyTrash } = useTrash()
    emptyTrash()
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

  it('should update trash icon when items are added', () => {
    const { moveToTrash, trashIcon } = useTrash()
    const { updateIcon } = useDesktop()

    moveToTrash('1')

    expect(trashIcon.value).toContain('trash-full.png')
    expect(updateIcon).toHaveBeenCalledWith('trash-id', expect.objectContaining({
      icon: expect.stringContaining('trash-full.png')
    }))
  })

  it('should empty the trash', () => {
    const { moveToTrash, emptyTrash, isEmpty } = useTrash()
    moveToTrash('1')
    expect(isEmpty.value).toBe(false)

    emptyTrash()
    expect(isEmpty.value).toBe(true)
  })
})
