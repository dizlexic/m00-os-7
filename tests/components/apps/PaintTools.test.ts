import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Paint from '~/components/apps/Paint.vue'

// Mocking canvas context
const mockCtx = {
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  closePath: vi.fn(),
  putImageData: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(400 * 600 * 4), width: 600, height: 400 })),
  createPattern: vi.fn(),
  setLineDash: vi.fn(),
  strokeRect: vi.fn(),
  fillRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  clip: vi.fn(),
  ellipse: vi.fn(),
}

describe('Paint.vue - Polygon and Arc tools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
      if (type === '2d') return mockCtx as any
      return null
    })
  })

  it('allows drawing a polygon', async () => {
    const wrapper = mount(Paint)
    const canvas = wrapper.find('canvas')
    
    // Mock getBoundingClientRect
    // @ts-ignore
    canvas.element.getBoundingClientRect = vi.fn(() => ({ left: 0, top: 0, width: 600, height: 400 }))

    // Select polygon tool
    const polygonTool = wrapper.find('[title="Polygon"]')
    await polygonTool.trigger('click')
    
    // First click
    await canvas.trigger('mousedown', { clientX: 100, clientY: 100 })
    expect(mockCtx.getImageData).toHaveBeenCalled()
    
    // Second click
    await canvas.trigger('mousedown', { clientX: 200, clientY: 100 })
    
    // Mouse move (preview)
    await canvas.trigger('mousemove', { clientX: 150, clientY: 150 })
    expect(mockCtx.putImageData).toHaveBeenCalled()
    expect(mockCtx.lineTo).toHaveBeenCalledWith(150, 150)
    
    // Third click
    await canvas.trigger('mousedown', { clientX: 150, clientY: 200 })
    
    // Double click to finish
    await canvas.trigger('dblclick')
    expect(mockCtx.closePath).toHaveBeenCalled()
    expect(mockCtx.stroke).toHaveBeenCalled()
  })

  it('allows drawing an arc', async () => {
    const wrapper = mount(Paint)
    const canvas = wrapper.find('canvas')
    
    // Mock getBoundingClientRect
    // @ts-ignore
    canvas.element.getBoundingClientRect = vi.fn(() => ({ left: 0, top: 0, width: 600, height: 400 }))

    // Select arc tool
    const arcTool = wrapper.find('[title="Arc"]')
    await arcTool.trigger('click')
    
    // Start drag
    await canvas.trigger('mousedown', { clientX: 100, clientY: 100 })
    
    // Drag to bottom right
    await canvas.trigger('mousemove', { clientX: 200, clientY: 200 })
    expect(mockCtx.ellipse).toHaveBeenCalled()
    
    // Finish drag
    await canvas.trigger('mouseup')
    expect(mockCtx.stroke).toHaveBeenCalled()
  })
})
