import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuBar from '~/components/desktop/MenuBar.vue'

describe('MenuBar.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(MenuBar)
    expect(wrapper.find('.menu-bar').exists()).toBe(true)
    expect(wrapper.find('.menu-bar__apple-logo').exists()).toBe(true)
    expect(wrapper.text()).toContain('Finder')
  })

  it('displays application name from props', () => {
    const wrapper = mount(MenuBar, {
      props: {
        appName: 'Calculator'
      }
    })
    expect(wrapper.text()).toContain('Calculator')
  })

  it('opens Apple menu on click', async () => {
    const wrapper = mount(MenuBar)
    await wrapper.find('.menu-bar__item--apple').trigger('click')
    expect(wrapper.find('.menu-dropdown').exists()).toBe(true)
    expect(wrapper.text()).toContain('About This Macintosh')
  })

  it('opens other menus on click', async () => {
    const wrapper = mount(MenuBar)
    const menus = wrapper.findAll('.menu-bar__item')
    // Find "File" menu
    const fileMenu = menus.find(m => m.text().includes('File'))
    await fileMenu?.trigger('click')
    expect(wrapper.find('.menu-dropdown').exists()).toBe(true)
    expect(wrapper.text()).toContain('New Folder')
  })

  it('closes menu when clicking outside', async () => {
    const wrapper = mount(MenuBar, {
      attachTo: document.body
    })
    await wrapper.find('.menu-bar__item--apple').trigger('click')
    expect(wrapper.find('.menu-dropdown').exists()).toBe(true)

    // Simulate click outside
    document.dispatchEvent(new MouseEvent('click'))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.menu-dropdown').exists()).toBe(false)
  })

  it('supports hierarchical submenus', async () => {
    const wrapper = mount(MenuBar)
    await wrapper.find('.menu-bar__item--apple').trigger('click')

    // Find "Control Panels" item
    const controlPanelsItem = wrapper.findAll('.menu-dropdown__item')
      .find(i => i.text().includes('Control Panels'))

    expect(controlPanelsItem?.exists()).toBe(true)
    expect(controlPanelsItem?.classes()).toContain('menu-dropdown__item--has-submenu')

    // Trigger mouseenter to open submenu
    await controlPanelsItem?.trigger('mouseenter')

    // Check if submenu is visible
    const submenus = wrapper.findAll('.menu-dropdown--submenu')
    expect(submenus.length).toBeGreaterThan(0)

    // Check if a specific control panel is present
    expect(wrapper.text()).toContain('Apple Menu Options')
    expect(wrapper.text()).toContain('Date & Time')
  })
})
