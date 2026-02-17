import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DesktopIcon from '~/components/desktop/DesktopIcon.vue'

// Mock useDesktop
const mockMoveIcon = vi.fn()
const mockSelectIcon = vi.fn()
const mockSetDragging = vi.fn()

vi.mock('~/composables/useDesktop', () => ({
  useDesktop: () => ({
    selectIcon: mockSelectIcon,
    toggleSelection: vi.fn(),
    moveIcon: mockMoveIcon,
    getIconById: vi.fn(),
    startRenaming: vi.fn(),
    finishRenaming: vi.fn(),
    cancelRenaming: vi.fn(),
    isDragging: { value: false },
    dropTargetId: { value: null },
    setDragging: mockSetDragging,
    setDropTarget: vi.fn()
  })
}))

// Mock useLabels, useWindowManager, useTrash, useRecentItems
vi.mock('~/composables/useLabels', () => ({
  useLabels: () => ({ labelColors: { value: {} } })
}))
vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => ({ openWindow: vi.fn() })
}))
vi.mock('~/composables/useTrash', () => ({
  useTrash: () => ({ moveToTrash: vi.fn() })
}))
vi.mock('~/composables/useRecentItems', () => ({
  useRecentItems: () => ({ addRecentDoc: vi.fn() })
}))

describe('DesktopIcon.vue Touch Support', () => {
  const defaultIcon = {
    id: 'test-icon',
    name: 'Test Icon',
    type: 'document' as const,
    position: { x: 100, y: 100 },
    isSelected: false,
    isRenaming: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls moveIcon on touchmove after touchstart', async () => {
    const wrapper = mount(DesktopIcon, {
      props: {
        icon: defaultIcon
      }
    })

    // Simulate touchstart
    await wrapper.trigger('touchstart', {
      touches: [{ clientX: 110, clientY: 110 }],
      stopPropagation: vi.fn()
    })

    expect(mockSelectIcon).toHaveBeenCalledWith('test-icon')
    expect(mockSetDragging).toHaveBeenCalledWith(true)

    // Simulate touchmove
    const touchMoveEvent = new CustomEvent('touchmove') as any
    touchMoveEvent.touches = [{ clientX: 150, clientY: 160 }]
    window.dispatchEvent(touchMoveEvent)

    expect(mockMoveIcon).toHaveBeenCalledWith('test-icon', {
      x: 140, // 100 + (150 - 110)
      y: 150  // 100 + (160 - 110)
    })
  })
})
