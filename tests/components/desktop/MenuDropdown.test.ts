import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuDropdown from '~/components/desktop/MenuDropdown.vue'
import type { MenuItem } from '~/types/menu'

describe('MenuDropdown.vue Color Support', () => {
  it('renders color rectangle for menu items with color', () => {
    const items: MenuItem[] = [
      { id: '1', label: 'Red Item', color: '#FF0000' },
      { id: '2', label: 'None Item', color: 'transparent' },
      { id: '3', label: 'No Color Item' }
    ]

    const wrapper = mount(MenuDropdown, {
      props: { items }
    })

    const colors = wrapper.findAll('.menu-dropdown__color')
    expect(colors).toHaveLength(2)

    // Red item
    expect(colors[0].attributes('style')).toContain('background-color: #FF0000')
    expect(colors[0].classes()).not.toContain('menu-dropdown__color--none')

    // None item
    expect(colors[1].classes()).toContain('menu-dropdown__color--none')
    // background-color should be transparent as per style binding
    expect(colors[1].attributes('style')).toContain('background-color: transparent')
  })

  it('renders checkmark and color rectangle together', () => {
    const items: MenuItem[] = [
      { id: '1', label: 'Checked Color', color: '#00FF00', checked: true }
    ]

    const wrapper = mount(MenuDropdown, {
      props: { items }
    })

    expect(wrapper.find('.menu-dropdown__check').text()).toBe('✓')
    expect(wrapper.find('.menu-dropdown__color').exists()).toBe(true)
    expect(wrapper.find('.menu-dropdown__color').attributes('style')).toContain('background-color: #00FF00')
  })
})
