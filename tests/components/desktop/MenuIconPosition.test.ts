import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuDropdown from '~/components/desktop/MenuDropdown.vue'

describe('MenuDropdown Icon Positioning', () => {
  const itemsWithIcons = [
    {
      id: 'item1',
      label: 'Item 1',
      icon: '/assets/icons/apps/calculator.png',
      checked: true
    },
    {
      id: 'item2',
      label: 'Item 2',
      icon: '/assets/icons/apps/paint.png',
      checked: false
    }
  ]

  it('positions icons before checkmarks and labels', () => {
    const wrapper = mount(MenuDropdown, {
      props: {
        items: itemsWithIcons
      }
    })

    const firstItem = wrapper.findAll('.menu-dropdown__item')[0]
    const children = firstItem.findAll(':scope > *')

    // Index 0: icon container
    // Index 1: checkmark
    // Index 2: label
    expect(children[0].classes()).toContain('menu-dropdown__icon-container')
    expect(children[1].classes()).toContain('menu-dropdown__check')
    expect(children[2].classes()).toContain('menu-dropdown__label')

    // Check if icon is rendered inside container
    expect(children[0].find('img').exists()).toBe(true)
    expect(children[0].find('img').attributes('src')).toBe('/assets/icons/apps/calculator.png')

    // Check checkmark content
    expect(children[1].text()).toBe('✓')
  })

  it('aligns labels even if some items lack icons', () => {
    const itemsMixed = [
      { id: 'item1', label: 'Item 1', icon: '/assets/icons/apps/calculator.png' },
      { id: 'item2', label: 'Item 2' } // No icon
    ]

    const wrapper = mount(MenuDropdown, {
      props: {
        items: itemsMixed
      }
    })

    const items = wrapper.findAll('.menu-dropdown__item')

    // Both items should have an icon container for alignment
    expect(items[0].find('.menu-dropdown__icon-container').exists()).toBe(true)
    expect(items[1].find('.menu-dropdown__icon-container').exists()).toBe(true)

    // But second item's icon container should be empty (no img)
    expect(items[0].find('.menu-dropdown__icon-container img').exists()).toBe(true)
    expect(items[1].find('.menu-dropdown__icon-container img').exists()).toBe(false)
  })

  it('does not show icon container if no items in the menu have icons', () => {
    const itemsNoIcons = [
      { id: 'item1', label: 'Item 1' },
      { id: 'item2', label: 'Item 2' }
    ]

    const wrapper = mount(MenuDropdown, {
      props: {
        items: itemsNoIcons
      }
    })

    expect(wrapper.find('.menu-dropdown__icon-container').exists()).toBe(false)
  })
})
