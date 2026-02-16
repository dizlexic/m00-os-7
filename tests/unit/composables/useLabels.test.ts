import { describe, it, expect, vi } from 'vitest'
import { useLabels } from '~/composables/useLabels'
import { DEFAULT_LABEL_COLORS, DEFAULT_LABEL_NAMES } from '~/types/filesystem'

// Mock dependencies
vi.mock('~/composables/useSettings', () => ({
  useSettings: () => ({
    settings: {
      value: {
        labelNames: [...DEFAULT_LABEL_NAMES],
        labelColors: [...DEFAULT_LABEL_COLORS]
      }
    }
  })
}))
vi.mock('~/composables/useFileSystem', () => ({
  useFileSystem: () => ({
    getNode: vi.fn(),
    updateNode: vi.fn(),
    getNodeByPath: vi.fn()
  })
}))

vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => ({
    activeWindow: { value: null }
  })
}))

vi.mock('~/composables/useDesktop', () => ({
  useDesktop: () => ({
    icons: { value: [] },
    updateIcon: vi.fn()
  })
}))

describe('useLabels', () => {
  it('returns menu items with correct colors', () => {
    const { getLabelMenuItems } = useLabels()
    const items = getLabelMenuItems()

    expect(items).toHaveLength(DEFAULT_LABEL_NAMES.length)
    items.forEach((item, index) => {
      expect(item.label).toBe(DEFAULT_LABEL_NAMES[index])
      expect(item.color).toBe(DEFAULT_LABEL_COLORS[index])
    })
  })
})
