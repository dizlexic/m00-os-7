import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuBar from '~/components/desktop/MenuBar.vue'
import { DEFAULT_LABEL_NAMES } from '~/types/filesystem'

describe('MenuBar Label Menu', () => {
  it('shows Label menu when Finder is active', () => {
    const wrapper = mount(MenuBar, {
      props: {
        appName: 'Finder'
      }
    })

    expect(wrapper.text()).toContain('Label')
  })

  it('contains all label options', async () => {
    const wrapper = mount(MenuBar, {
      props: {
        appName: 'Finder'
      }
    })

    // Click on Label menu
    const menuItems = wrapper.findAll('.menu-bar__item')
    const labelMenu = menuItems.find(m => m.text().includes('Label'))
    await labelMenu?.trigger('click')

    DEFAULT_LABEL_NAMES.forEach(name => {
      expect(wrapper.text()).toContain(name)
    })
  })
})
