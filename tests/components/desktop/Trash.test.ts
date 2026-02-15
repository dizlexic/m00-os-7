import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Trash from '~/components/desktop/Trash.vue'
import DesktopIcon from '~/components/desktop/DesktopIcon.vue'

// Mock useTrash
const mockMoveToTrash = vi.fn()
const mockEmptyTrash = vi.fn()
const mockItems = { value: [] }
const mockIsEmpty = { value: true }

vi.mock('~/composables/useTrash', () => ({
  useTrash: () => ({
    moveToTrash: mockMoveToTrash,
    emptyTrash: mockEmptyTrash,
    items: mockItems,
    isEmpty: mockIsEmpty,
    trashIcon: { value: '/assets/icons/system/trash-empty.png' }
  })
}))

// Mock useDesktop
const mockShowContextMenu = vi.fn()
vi.mock('~/composables/useDesktop', () => ({
  useDesktop: () => ({
    showContextMenu: mockShowContextMenu,
    isDragging: { value: false },
    dropTargetId: { value: null },
    setDragging: vi.fn(),
    setDropTarget: vi.fn(),
    selectIcon: vi.fn(),
    toggleSelection: vi.fn(),
    moveIcon: vi.fn(),
    startRenaming: vi.fn(),
    finishRenaming: vi.fn(),
    cancelRenaming: vi.fn()
  })
}))

// Mock useWindowManager
vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => ({
    openWindow: vi.fn()
  })
}))

describe('Trash.vue', () => {
  const defaultIcon = {
    id: 'trash-id',
    name: 'Trash',
    type: 'trash',
    icon: '/assets/icons/system/trash-empty.png',
    position: { x: 0, y: 0 },
    path: '/trash'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsEmpty.value = true
    mockItems.value = []
  })

  it('renders DesktopIcon with correct props', () => {
    const wrapper = mount(Trash, {
      props: { icon: defaultIcon }
    })
    
    const desktopIcon = wrapper.findComponent(DesktopIcon)
    expect(desktopIcon.exists()).toBe(true)
    expect(desktopIcon.props('icon')).toEqual(defaultIcon)
  })

  it('handles drop event', async () => {
    const wrapper = mount(Trash, {
      props: { icon: defaultIcon }
    })

    const event = {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: vi.fn().mockReturnValue('dragged-id')
      }
    } as any

    await wrapper.find('.trash-wrapper').trigger('drop', event)

    expect(mockMoveToTrash).toHaveBeenCalledWith('dragged-id')
  })

  it('shows context menu on right click', async () => {
    const wrapper = mount(Trash, {
      props: { icon: defaultIcon }
    })

    const desktopIcon = wrapper.findComponent(DesktopIcon)
    await desktopIcon.trigger('contextmenu', { clientX: 100, clientY: 200, preventDefault: vi.fn() })

    expect(mockShowContextMenu).toHaveBeenCalledWith(expect.objectContaining({
      position: { x: 100, y: 200 },
      items: expect.arrayContaining([
        expect.objectContaining({ label: 'Open' }),
        expect.objectContaining({ label: 'Empty Trash...' })
      ])
    }))
  })
})
