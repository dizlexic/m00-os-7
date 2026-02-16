import { describe, it, expect, vi } from 'vitest'
import { MAC_PATTERNS, createPatternCanvas, getPatternDataUrl } from '../../app/utils/paintPatterns'

describe('paintPatterns', () => {
  it('should have MAC_PATTERNS defined', () => {
    expect(MAC_PATTERNS).toBeDefined()
    expect(MAC_PATTERNS.length).toBeGreaterThan(0)
  })

  it('should create a canvas for a pattern', () => {
    // Mock document.createElement
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue({
        fillRect: vi.fn(),
        fillStyle: ''
      }),
      width: 0,
      height: 0
    }
    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue(mockCanvas)
    })

    const pattern = MAC_PATTERNS[0].data
    const canvas = createPatternCanvas(pattern)

    expect(canvas).toBeDefined()
    expect(document.createElement).toHaveBeenCalledWith('canvas')
    expect(mockCanvas.width).toBe(8)
    expect(mockCanvas.height).toBe(8)
  })

  it('should return data URL for a pattern', () => {
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue({
        fillRect: vi.fn(),
        fillStyle: ''
      }),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test'),
      width: 0,
      height: 0
    }
    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue(mockCanvas)
    })

    const pattern = MAC_PATTERNS[0].data
    const dataUrl = getPatternDataUrl(pattern)

    expect(dataUrl).toBe('data:image/png;base64,test')
    expect(mockCanvas.toDataURL).toHaveBeenCalled()
  })
})
