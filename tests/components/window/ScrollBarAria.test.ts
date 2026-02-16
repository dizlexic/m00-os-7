import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ScrollBar from '~/components/window/ScrollBar.vue'

describe('ScrollBar.vue ARIA', () => {
  it('has ARIA labels for vertical scrollbar', () => {
    const wrapper = mount(ScrollBar, {
      props: {
        orientation: 'vertical',
        modelValue: 0,
        totalSize: 1000,
        viewportSize: 200
      }
    })

    const upArrow = wrapper.find('.scrollbar__arrow--start')
    expect(upArrow.attributes('aria-label')).toBe('Scroll up')

    const downArrow = wrapper.find('.scrollbar__arrow--end')
    expect(downArrow.attributes('aria-label')).toBe('Scroll down')

    const track = wrapper.find('.scrollbar__track')
    expect(track.attributes('role')).toBe('scrollbar')
    expect(track.attributes('aria-orientation')).toBe('vertical')
    expect(track.attributes('aria-valuemin')).toBe('0')
    expect(track.attributes('aria-valuemax')).toBe('800')
    expect(track.attributes('aria-valuenow')).toBe('0')
  })

  it('has ARIA labels for horizontal scrollbar', () => {
    const wrapper = mount(ScrollBar, {
      props: {
        orientation: 'horizontal',
        modelValue: 100,
        totalSize: 1000,
        viewportSize: 200
      }
    })

    const leftArrow = wrapper.find('.scrollbar__arrow--start')
    expect(leftArrow.attributes('aria-label')).toBe('Scroll left')

    const rightArrow = wrapper.find('.scrollbar__arrow--end')
    expect(rightArrow.attributes('aria-label')).toBe('Scroll right')

    const track = wrapper.find('.scrollbar__track')
    expect(track.attributes('aria-orientation')).toBe('horizontal')
    expect(track.attributes('aria-valuenow')).toBe('100')
  })
})
