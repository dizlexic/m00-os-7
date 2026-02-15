import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFileSystem } from '~/composables/useFileSystem'
import { useTrash } from '~/composables/useTrash'

describe('Put Away Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { initialize } = useFileSystem()
    await initialize()
  })

  it('restores an item to its original location using Put Away', () => {
    const { createFolder, getRoot, moveToTrash, getNode } = useFileSystem()
    const { restoreItem } = useTrash()

    const root = getRoot()
    const originalFolder = createFolder('Original Folder', root.id)
    const item = createFolder('Item to Trash', originalFolder.id)

    expect(item.parentId).toBe(originalFolder.id)

    // Move to trash
    moveToTrash(item.id)
    
    const trashedItem = getNode(item.id)
    const { getTrash } = useFileSystem()
    expect(trashedItem?.parentId).toBe(getTrash()?.id)
    expect(trashedItem?.metadata?.originalParentId).toBe(originalFolder.id)

    // Put Away
    restoreItem(item.id)

    const restoredItem = getNode(item.id)
    expect(restoredItem?.parentId).toBe(originalFolder.id)
    expect(restoredItem?.metadata?.originalParentId).toBeUndefined()
  })

  it('falls back to root if original parent is missing', () => {
    const { createFolder, getRoot, moveToTrash, getNode, deleteNode } = useFileSystem()
    const { restoreItem } = useTrash()

    const root = getRoot()
    const originalFolder = createFolder('Original Folder', root.id)
    const item = createFolder('Item to Trash', originalFolder.id)

    // Move to trash
    moveToTrash(item.id)
    
    // Delete original folder
    deleteNode(originalFolder.id)

    // Put Away
    restoreItem(item.id)

    const restoredItem = getNode(item.id)
    expect(restoredItem?.parentId).toBe(root.id)
  })
})
