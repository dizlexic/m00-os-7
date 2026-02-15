import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useClipboard } from '~/composables/useClipboard'
import { useFileSystem } from '~/composables/useFileSystem'

// Mock useFileSystem
const mocks = {
  copyNode: vi.fn(),
  moveNode: vi.fn()
}

vi.mock('~/composables/useFileSystem', () => {
  return {
    useFileSystem: vi.fn(() => mocks)
  }
})

describe('useClipboard', () => {
  let clipboard: ReturnType<typeof useClipboard>
  let fs: any

  beforeEach(() => {
    vi.clearAllMocks()
    clipboard = useClipboard()
    clipboard.clear()
    fs = useFileSystem()
  })

  it('should start empty', () => {
    expect(clipboard.clipboard.value).toBeNull()
  })

  it('should store copy items', () => {
    clipboard.copy(['id1', 'id2'])
    expect(clipboard.clipboard.value).toEqual({
      ids: ['id1', 'id2'],
      action: 'copy'
    })
  })

  it('should store cut items', () => {
    clipboard.cut(['id1'])
    expect(clipboard.clipboard.value).toEqual({
      ids: ['id1'],
      action: 'cut'
    })
  })

  it('should call copyNode on paste when action is copy', () => {
    clipboard.copy(['id1'])
    clipboard.paste('target-id')

    expect(fs.copyNode).toHaveBeenCalledWith('id1', 'target-id')
    expect(clipboard.clipboard.value).not.toBeNull() // Copy doesn't clear clipboard
  })

  it('should call moveNode on paste when action is cut', () => {
    clipboard.cut(['id1'])
    clipboard.paste('target-id')

    expect(fs.moveNode).toHaveBeenCalledWith('id1', 'target-id')
    expect(clipboard.clipboard.value).toBeNull() // Cut clears clipboard
  })
})
