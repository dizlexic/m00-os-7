import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuBar from '~/components/desktop/MenuBar.vue'
import { useFileSystem } from '~/composables/useFileSystem'
import { useAlert } from '~/composables/useAlert'
import { useTrash } from '~/composables/useTrash'

// Mock dependencies
vi.mock('~/composables/useRecentItems', () => ({
  useRecentItems: () => ({
    recentApps: { value: [] },
    recentDocs: { value: [] }
  })
}))

describe('Empty Trash Confirmation', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { initialize, emptyTrash } = useFileSystem()
    await initialize()
    emptyTrash()
    const { hideAlert } = useAlert()
    hideAlert()
  })

  it('shows confirmation alert when emptying non-empty trash', async () => {
    const { createFolder, getRoot, moveToTrash } = useFileSystem()
    const { alertState } = useAlert()
    const root = getRoot()
    const folder = createFolder('To Trash', root.id)
    moveToTrash(folder.id)

    const wrapper = mount(MenuBar)

    // Open Special menu
    const menuItems = wrapper.findAll('.menu-bar__item')
    const specialMenuItem = menuItems.find(item => item.text().includes('Special'))
    expect(specialMenuItem).toBeDefined()
    await specialMenuItem!.trigger('click')

    // Find "Empty Trash" item in the dropdown
    const dropdown = wrapper.findComponent({ name: 'MenuDropdown' })
    expect(dropdown.exists()).toBe(true)

    // In MenuDropdown, we emit 'item-click' with the MenuItem object
    const emptyTrashItem = (dropdown.props('items') as any[]).find(i => i.id === 'empty-trash')
    expect(emptyTrashItem).toBeDefined()

    await dropdown.vm.$emit('item-click', emptyTrashItem)

    expect(alertState.value.isVisible).toBe(true)
    expect(alertState.value.message).toContain('The Trash contains 1 item')
    expect(alertState.value.type).toBe('caution')

    // Clean up
    const { hideAlert } = useAlert()
    hideAlert()
  })

  it('does not show confirmation when trash is empty', async () => {
    const { alertState } = useAlert()
    const wrapper = mount(MenuBar)

    // Open Special menu
    const menuItems = wrapper.findAll('.menu-bar__item')
    const specialMenuItem = menuItems.find(item => item.text().includes('Special'))
    await specialMenuItem!.trigger('click')

    const dropdown = wrapper.findComponent({ name: 'MenuDropdown' })
    const emptyTrashItem = (dropdown.props('items') as any[]).find(i => i.id === 'empty-trash')

    await dropdown.vm.$emit('item-click', emptyTrashItem)

    expect(alertState.value.isVisible).toBe(false)
  })
})
