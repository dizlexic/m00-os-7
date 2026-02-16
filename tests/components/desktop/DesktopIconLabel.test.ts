import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DesktopIconComponent from '~/components/desktop/DesktopIcon.vue'
import { LABEL_COLORS } from '~/types/filesystem'

// Mock useDesktop
vi.mock('~/composables/useDesktop', () => ({
  useDesktop: () => ({
    selectIcon: vi.fn(),
    toggleSelection: vi.fn(),
    moveIcon: vi.fn(),
    getIconById: vi.fn(),
    startRenaming: vi.fn(),
    finishRenaming: vi.fn(),
    cancelRenaming: vi.fn(),
    isDragging: { value: false },
    dropTargetId: { value: null },
    setDragging: vi.fn(),
    setDropTarget: vi.fn()
  })
}))

// Mock useWindowManager
vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => ({
    openWindow: vi.fn()
  })
}))

// Mock useTrash
vi.mock('~/composables/useTrash', () => ({
  useTrash: () => ({
    moveToTrash: vi.fn()
  })
}))

// Mock useRecentItems
vi.mock('~/composables/useRecentItems', () => ({
  useRecentItems: () => ({
    addRecentDoc: vi.fn()
  })
}))

describe('DesktopIcon.vue Label Display', () => {
  const defaultIcon = {
    id: 'test-1',
    name: 'Test Icon',
    type: 'document' as const,
    icon: '/test.png',
    position: { x: 0, y: 0 },
    isSelected: false,
    isRenaming: false
  }

  it('renders without label background by default', () => {
    const wrapper = mount(DesktopIconComponent, {
      props: {
        icon: { ...defaultIcon, label: 0 }
      }
    })

    const label = wrapper.find('.desktop-icon__label')
    expect(label.attributes('style')).toBeUndefined()
  })

  it('renders with label background when label is set', () => {
    const wrapper = mount(DesktopIconComponent, {
      props: {
        icon: { ...defaultIcon, label: 2 } // Hot (Red)
      }
    })

    const label = wrapper.find('.desktop-icon__label')
    expect(label.attributes('style')).toContain('background-color: #FF0000')
  })

  it('does not show label background when selected', () => {
    const wrapper = mount(DesktopIconComponent, {
      props: {
        icon: { ...defaultIcon, label: 2, isSelected: true }
      }
    })

    const label = wrapper.find('.desktop-icon__label')
    // When selected, labelBackgroundStyle should return {}
    expect(label.attributes('style')).toBeUndefined()
  })
})
