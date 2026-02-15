import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDesktop } from '~/composables/useDesktop'

// Mock useSettings
vi.mock('~/composables/useSettings', () => ({
  useSettings: () => ({
    settings: {
      value: {
        desktopPattern: 'default'
      }
    }
  })
}))

describe('useDesktop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with default state', () => {
    const { icons, contextMenu, marquee } = useDesktop()
    expect(icons.value).toBeDefined()
    expect(contextMenu.value.isVisible).toBe(false)
    expect(marquee.value.isActive).toBe(false)
  })

  it('shows context menu', () => {
    const { showContextMenu, contextMenu } = useDesktop()
    const position = { x: 100, y: 200 }
    const items = [
      { id: 'item1', label: 'Item 1', action: vi.fn() }
    ]

    showContextMenu(position, items)

    expect(contextMenu.value.isVisible).toBe(true)
    expect(contextMenu.value.position).toEqual(position)
    expect(contextMenu.value.items).toEqual(items)
  })

  it('hides context menu', () => {
    const { showContextMenu, hideContextMenu, contextMenu } = useDesktop()
    showContextMenu({ x: 0, y: 0 }, [])
    expect(contextMenu.value.isVisible).toBe(true)

    hideContextMenu()
    expect(contextMenu.value.isVisible).toBe(false)
  })
})
