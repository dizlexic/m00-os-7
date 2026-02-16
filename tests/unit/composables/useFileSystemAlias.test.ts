import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFileSystem } from '~/composables/useFileSystem'

// Mock useUser
vi.mock('~/composables/useUser', () => ({
  useUser: () => ({
    isAuthenticated: { value: false }
  })
}))

describe('useFileSystem createAlias', () => {
  it('should create an alias with italic label and correct name', async () => {
    const { createFile, getChildren, createAlias, getRoot } = useFileSystem()
    const root = getRoot()
    
    const originalFile = createFile('Original', root.id, 'content')
    
    const aliasId = createAlias(originalFile.id, root.id)
    const alias = getChildren(root.id).find(c => c.id === aliasId)
    
    expect(alias?.name).toBe('Original alias')
    expect(alias?.type).toBe('alias')
    expect(alias?.metadata?.targetId).toBe(originalFile.id)
  })

  it('should handle unique naming for multiple aliases', async () => {
    const { createFile, createAlias, getChildren, getRoot } = useFileSystem()
    const root = getRoot()
    
    const original = createFile('Doc', root.id, 'content')
    
    const a1Id = createAlias(original.id, root.id)
    const a2Id = createAlias(original.id, root.id)
    
    const a1 = getChildren(root.id).find(c => c.id === a1Id)
    const a2 = getChildren(root.id).find(c => c.id === a2Id)
    
    expect(a1?.name).toBe('Doc alias')
    expect(a2?.name).toBe('Doc alias 2')
  })
})
