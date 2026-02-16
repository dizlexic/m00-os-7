import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDesktop } from '~/composables/useDesktop'

// Mock useSettings
vi.mock('~/composables/useSettings', () => ({
  useSettings: () => ({
    settings: {
      value: {
        desktopPattern: 'default',
        highlightColor: '#000080'
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

  it('cleans up desktop by sorting strictly by name', () => {
    const { addIcon, cleanUpDesktop, icons, initializeDesktop } = useDesktop()
    initializeDesktop()

    // In kind-first sort, folder comes before document
    // If sorting by name only, 'Apple Document' should come before 'Zebra Folder'
    addIcon({ name: 'Zebra Folder', type: 'folder', icon: '', position: { x: 0, y: 0 } })
    addIcon({ name: 'Apple Document', type: 'document', icon: '', position: { x: 0, y: 0 } })

    cleanUpDesktop('name')

    const appleIndex = icons.value.findIndex(i => i.name === 'Apple Document')
    const zebraIndex = icons.value.findIndex(i => i.name === 'Zebra Folder')

    expect(appleIndex).toBeLessThan(zebraIndex)
  })

  it('cleans up desktop by sorting by kind (default)', () => {
    const { addIcon, cleanUpDesktop, icons, initializeDesktop } = useDesktop()
    initializeDesktop()

    addIcon({ name: 'Zebra Folder', type: 'folder', icon: '', position: { x: 0, y: 0 } })
    addIcon({ name: 'Apple Document', type: 'document', icon: '', position: { x: 0, y: 0 } })

    // Default should be by kind
    cleanUpDesktop()

    const zebraIndex = icons.value.findIndex(i => i.name === 'Zebra Folder')
    const appleIndex = icons.value.findIndex(i => i.name === 'Apple Document')

    // Folder comes before document
    expect(zebraIndex).toBeLessThan(appleIndex)
  })
})
