import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Desktop from '~/components/desktop/Desktop.vue'
import { useWindowManager } from '~/composables/useWindowManager'
import { useFileSystem } from '~/composables/useFileSystem'
import { useDesktop } from '~/composables/useDesktop'

// Mock useRecentItems
vi.mock('~/composables/useRecentItems', () => ({
  useRecentItems: () => ({
    addRecentDoc: vi.fn(),
    addRecentApp: vi.fn(),
    recentDocs: { value: [] },
    recentApps: { value: [] }
  })
}))

// Mock useSound
vi.mock('~/composables/useSound', () => ({
  useSound: () => ({
    playBeep: vi.fn()
  })
}))

// Mock useAlert
vi.mock('~/composables/useAlert', () => ({
  useAlert: () => ({
    showAlert: vi.fn()
  })
}))

describe('Trash Opening Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { initialize } = useFileSystem()
    await initialize()
    const { initializeDesktop } = useDesktop()
    initializeDesktop()
  })

  it('opens a finder window when trash is double-clicked and shows items', async () => {
    const { windowList, closeAllWindows } = useWindowManager()
    closeAllWindows()
    const { icons, initializeDesktop } = useDesktop()
    initializeDesktop()
    const { moveToTrash, createFolder, getRoot } = useFileSystem()

    // Create a folder and move it to trash
    const root = getRoot()
    const folder = createFolder('Test Folder', root.id)
    moveToTrash(folder.id)

    const trashIcon = icons.value.find(icon => icon.type === 'trash')
    expect(trashIcon).toBeDefined()

    // Find the Trash component in the Desktop
    const wrapper = mount(Desktop)
    
    // We need to find the specific DesktopIcon that represents the Trash
    const trashComponent = wrapper.findComponent({ name: 'Trash' })
    const desktopIcon = trashComponent.findComponent({ name: 'DesktopIcon' })

    // Simulate double click
    await desktopIcon.trigger('click')
    await desktopIcon.trigger('click')
    
    // Wait for any async effects
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(windowList.value.length).toBeGreaterThan(0)
    const openedWindow = windowList.value.find(w => w.type === 'finder' && w.title === 'Trash')
    expect(openedWindow).toBeDefined()

    // Check if Finder renders the item
    // Finder component inside the window
    const finder = wrapper.findComponent({ name: 'Finder' })
    expect(finder.exists()).toBe(true)
    expect(finder.text()).toContain('Test Folder')
  })
})
