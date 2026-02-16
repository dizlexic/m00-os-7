import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuBar from '~/components/desktop/MenuBar.vue'
import { useWindowManager } from '~/composables/useWindowManager'

vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: vi.fn(() => ({
    windowList: [],
    activeWindow: {
      value: {
        id: 'paint-1',
        type: 'paint',
        title: 'Paint',
        menus: [
          {
            id: 'file',
            label: 'File',
            items: [{ id: 'new', label: 'New' }]
          }
        ]
      }
    },
    openWindow: vi.fn(),
    updateWindow: vi.fn(),
    bringToFront: vi.fn()
  }))
}))

describe('MenuBar Application Context Menu', () => {
  it('shows the application name as a clickable menu', async () => {
    const wrapper = mount(MenuBar, {
      props: {
        appName: 'Paint'
      }
    })

    const appMenu = wrapper.find('.menu-bar__app-name')
    expect(appMenu.exists()).toBe(true)
    expect(appMenu.text()).toBe('Paint')

    // Currently it's just a div, not a menu item that can open a dropdown
    // Let's check if it has the same classes as other menu items
    expect(appMenu.classes()).toContain('menu-bar__item')
  })

  it('opens the application context menu on click', async () => {
    const wrapper = mount(MenuBar, {
      props: {
        appName: 'Paint'
      }
    })

    const appMenu = wrapper.find('.menu-bar__app-name')
    await appMenu.trigger('click')

    expect(wrapper.vm.activeMenuId).toBe('app')
    expect(wrapper.find('.menu-dropdown').exists()).toBe(true)
  })
})
