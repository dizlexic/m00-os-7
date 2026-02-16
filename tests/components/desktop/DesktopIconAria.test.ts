import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DesktopIconComponent from '~/components/desktop/DesktopIcon.vue'

// Mock composables
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

vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => ({
    openWindow: vi.fn()
  })
}))

vi.mock('~/composables/useTrash', () => ({
  useTrash: () => ({
    moveToTrash: vi.fn()
  })
}))

vi.mock('~/composables/useRecentItems', () => ({
  useRecentItems: () => ({
    addRecentDoc: vi.fn()
  })
}))

describe('DesktopIcon.vue ARIA', () => {
  const defaultIcon = {
    id: 'test-1',
    name: 'My Document',
    type: 'document' as const,
    icon: '/test.png',
    position: { x: 0, y: 0 },
    isSelected: false,
    isRenaming: false
  }

  it('has correct ARIA role and label', () => {
    const wrapper = mount(DesktopIconComponent, {
      props: {
        icon: defaultIcon
      }
    })

    expect(wrapper.attributes('role')).toBe('button')
    expect(wrapper.attributes('aria-label')).toBe('My Document')
  })
})
