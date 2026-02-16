import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuBar from '~/components/desktop/MenuBar.vue'

describe('MenuBar Apple Menu', () => {
  it('has correctly structured Apple menu', async () => {
    const wrapper = mount(MenuBar)
    await wrapper.find('.menu-bar__item--apple').trigger('click')

    const menuItems = wrapper.findAll('.menu-dropdown__item:not(.menu-dropdown__item--separator)')
    const menuItemLabels = menuItems.map(i => i.find('.menu-dropdown__label').text().trim())

    // Network should NOT be in the top-level menu
    expect(menuItemLabels).not.toContain('Network')

    // Applications should be in the top-level menu
    expect(menuItemLabels).toContain('Applications')

    // Check order
    const chooserIndex = menuItemLabels.indexOf('Chooser')
    const applicationsIndex = menuItemLabels.indexOf('Applications')
    const controlPanelsIndex = menuItemLabels.indexOf('Control Panels')

    expect(chooserIndex).toBeGreaterThan(-1)
    expect(applicationsIndex).toBeGreaterThan(chooserIndex)
    expect(controlPanelsIndex).toBeGreaterThan(applicationsIndex)

    // Check Applications submenu
    const applicationsItem = menuItems.find(i => i.find('.menu-dropdown__label').text().includes('Applications'))
    expect(applicationsItem?.classes()).toContain('menu-dropdown__item--has-submenu')

    await applicationsItem?.trigger('mouseenter')

    // The submenu should contain applications
    expect(wrapper.text()).toContain('Calculator')
    expect(wrapper.text()).toContain('Paint')
    expect(wrapper.text()).toContain('Tetris')

    // Check Control Panels submenu contains Network
    const controlPanelsItem = menuItems.find(i => i.find('.menu-dropdown__label').text().includes('Control Panels'))
    await controlPanelsItem?.trigger('mouseenter')

    expect(wrapper.text()).toContain('Network')
  })
})
