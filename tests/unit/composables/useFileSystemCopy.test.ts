import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFileSystem } from '~/composables/useFileSystem'

// Mock useUser
vi.mock('~/composables/useUser', () => ({
  useUser: () => ({
    isAuthenticated: { value: false }
  })
}))

describe('useFileSystem copyNode naming', () => {
  it('should generate a unique name when duplicating in the same folder', async () => {
    const { createFolder, createFile, getChildren, copyNode, getRoot } = useFileSystem()
    const root = getRoot()
    
    const originalFile = createFile('Test File', root.id, 'content')
    expect(originalFile.name).toBe('Test File')
    
    const copy1Id = copyNode(originalFile.id, root.id)
    const copy1 = getChildren(root.id).find(c => c.id === copy1Id)
    expect(copy1?.name).toBe('Test File copy')
    
    const copy2Id = copyNode(originalFile.id, root.id)
    const copy2 = getChildren(root.id).find(c => c.id === copy2Id)
    expect(copy2?.name).toBe('Test File copy 2')
  })
})
