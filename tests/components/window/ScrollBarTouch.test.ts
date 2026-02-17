import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ScrollBar from '~/components/window/ScrollBar.vue'

describe('ScrollBar.vue Touch Support', () => {
  const defaultProps = {
    orientation: 'vertical' as const,
    modelValue: 0,
    totalSize: 1000,
    viewportSize: 200,
    isActive: true
  }

  it('updates modelValue on touchmove after touchstart on thumb', async () => {
    const wrapper = mount(ScrollBar, {
      props: defaultProps
    })

    const thumb = wrapper.find('.scrollbar__thumb')

    // Simulate touchstart on thumb
    // thumbPosition is 0 initially
    await thumb.trigger('touchstart', {
      touches: [{ clientX: 0, clientY: 0 }],
      stopPropagation: vi.fn()
    })

    // Simulate touchmove
    // trackSize = 200 - 32 = 168
    // thumbSize = (200 / 1000) * 168 = 33.6
    // trackRange = 168 - 33.6 = 134.4
    // scrollMax = 1000 - 200 = 800
    // If we move 134.4px down, we should be at 800

    const touchMoveEvent = new CustomEvent('touchmove') as any
    touchMoveEvent.touches = [{ clientX: 0, clientY: 67.2 }] // half of trackRange
    window.dispatchEvent(touchMoveEvent)

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBeCloseTo(400)
  })
})
