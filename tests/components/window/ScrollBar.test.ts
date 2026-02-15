import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ScrollBar from '~/components/window/ScrollBar.vue'

describe('ScrollBar.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(ScrollBar, {
      props: {
        orientation: 'vertical',
        modelValue: 0,
        totalSize: 1000,
        viewportSize: 200
      }
    })
    expect(wrapper.find('.scrollbar').exists()).toBe(true)
    expect(wrapper.find('.scrollbar--vertical').exists()).toBe(true)
    expect(wrapper.find('.scrollbar__thumb').exists()).toBe(true)
  })

  it('calculates thumb size correctly', () => {
    const wrapper = mount(ScrollBar, {
      props: {
        orientation: 'vertical',
        modelValue: 0,
        totalSize: 1000, // total
        viewportSize: 200 // viewport
      }
    })
    // viewport 200, arrows 16*2=32. track = 168.
    // ratio = 200/1000 = 0.2
    // thumb = 0.2 * 168 = 33.6
    const thumb = wrapper.find('.scrollbar__thumb')
    expect(thumb.attributes('style')).toContain('height: 33.6px')
  })

  it('emits update:modelValue on arrow click', async () => {
    const wrapper = mount(ScrollBar, {
      props: {
        orientation: 'vertical',
        modelValue: 50,
        totalSize: 1000,
        viewportSize: 200
      }
    })
    
    await wrapper.find('.scrollbar__arrow--end').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([70]) // 50 + 20
  })

  it('emits update:modelValue on track click (page down)', async () => {
    const wrapper = mount(ScrollBar, {
      props: {
        orientation: 'vertical',
        modelValue: 0,
        totalSize: 1000,
        viewportSize: 200
      }
    })
    
    // Mock getBoundingClientRect for track
    const track = wrapper.find('.scrollbar__track')
    vi.spyOn(track.element, 'getBoundingClientRect').mockReturnValue({
      top: 16,
      left: 0,
      bottom: 184,
      right: 16,
      width: 16,
      height: 168,
      x: 0,
      y: 16,
      toJSON: () => {}
    } as DOMRect)

    // Click at the bottom of the track (e.g., y=150 relative to viewport, so 150+16=166)
    await track.trigger('mousedown', {
      clientY: 166
    })
    
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([200]) // 0 + 200 (page size)
  })
})
