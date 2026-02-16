import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WindowTitleBar from '~/components/window/WindowTitleBar.vue'

describe('WindowTitleBar.vue', () => {
  it('has ARIA labels for buttons', () => {
    const wrapper = mount(WindowTitleBar, {
      props: {
        title: 'Test Window',
        isActive: true,
        closable: true,
        maximizable: true,
        collapsible: true
      }
    })

    const closeButton = wrapper.find('.title-bar__button--close')
    expect(closeButton.attributes('aria-label')).toBe('Close window')

    const zoomButton = wrapper.find('.title-bar__button--zoom')
    expect(zoomButton.attributes('aria-label')).toBe('Zoom window')

    const collapseButton = wrapper.find('.title-bar__button--collapse')
    expect(collapseButton.attributes('aria-label')).toBe('Collapse window')
  })

  it('updates collapse ARIA label when collapsed', () => {
    const wrapper = mount(WindowTitleBar, {
      props: {
        title: 'Test Window',
        isActive: true,
        collapsible: true,
        isCollapsed: true
      }
    })

    const collapseButton = wrapper.find('.title-bar__button--collapse')
    expect(collapseButton.attributes('aria-label')).toBe('Expand window')
  })
})
