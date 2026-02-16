import { nextTick } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Paint from '~/components/apps/Paint.vue'

// Mock the canvas
const mockCtx = {
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  putImageData: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(600 * 400 * 4),
    width: 600,
    height: 400
  })),
  setLineDash: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  clip: vi.fn(),
  closePath: vi.fn(),
  translate: vi.fn(),
  strokeRect: vi.fn(),
  getContext: vi.fn(() => mockCtx),
  lineCap: 'round',
  lineJoin: 'round',
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1
}

// Mock HTMLCanvasElement
// @ts-ignore
HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx)
// @ts-ignore
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,test')

// Mock the composables
const { mockFileSystem } = vi.hoisted(() => ({
  mockFileSystem: {
    getNode: vi.fn((id) => {
      if (id === 'image-1') {
        return {
          id: 'image-1',
          name: 'My Painting',
          type: 'image',
          content: 'data:image/png;base64,test',
          parentId: 'root'
        }
      }
      return undefined
    }),
    updateFileContent: vi.fn()
  }
}))

vi.mock('~/composables/useFileSystem', () => ({
  useFileSystem: () => mockFileSystem
}))

const { mockWindowManager } = vi.hoisted(() => ({
  mockWindowManager: {
    updateWindow: vi.fn(),
    closeWindow: vi.fn()
  }
}))

vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => mockWindowManager
}))

describe('Paint.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Need to mock Image since it's used in loadFile
    // @ts-ignore
    global.Image = class {
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
      set src(value) {}
    }
  })

  it('renders correctly', () => {
    const wrapper = mount(Paint, {
      props: {
        isActive: true
      }
    })
    expect(wrapper.find('.paint').exists()).toBe(true)
    expect(wrapper.find('canvas').exists()).toBe(true)
  })

  it('loads file content on mount if fileId is provided', async () => {
    mount(Paint, {
      props: {
        fileId: 'image-1',
        isActive: true
      }
    })

    await nextTick()
    // Wait for Image.onload
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(mockFileSystem.getNode).toHaveBeenCalledWith('image-1')
    expect(mockCtx.drawImage).toHaveBeenCalled()
  })

  it('updates window menus when active', async () => {
    mount(Paint, {
      props: {
        windowId: 'win-1',
        isActive: true
      }
    })

    await nextTick()
    expect(mockWindowManager.updateWindow).toHaveBeenCalledWith('win-1', expect.objectContaining({
      menus: expect.any(Array)
    }))
  })

  it('allows rectangular selection', async () => {
    const wrapper = mount(Paint, {
      props: { isActive: true }
    })

    // Select Marquee tool
    await wrapper.find('button[title="Marquee"]').trigger('click')

    const canvas = wrapper.find('canvas')

    // Mock getBoundingClientRect
    // @ts-ignore
    canvas.element.getBoundingClientRect = vi.fn(() => ({ left: 0, top: 0, width: 600, height: 400 }))

    // Start selection
    await canvas.trigger('mousedown', { clientX: 100, clientY: 100 })
    // Move to size selection
    await canvas.trigger('mousemove', { clientX: 200, clientY: 200 })
    // Finalize
    await canvas.trigger('mouseup')

    expect(mockCtx.getImageData).toHaveBeenCalled()
    expect(mockCtx.strokeRect).toHaveBeenCalled()
  })

  it('performs undo operation', async () => {
    const wrapper = mount(Paint, {
      props: { isActive: true }
    })

    // Perform a drawing action
    const canvas = wrapper.find('canvas')
    // Mock getBoundingClientRect
    // @ts-ignore
    canvas.element.getBoundingClientRect = vi.fn(() => ({ left: 0, top: 0, width: 600, height: 400 }))

    await canvas.trigger('mousedown', { clientX: 50, clientY: 50 })
    await canvas.trigger('mouseup')

    // Clear mocks before undo
    mockCtx.putImageData.mockClear()

    // Call undo directly
    // @ts-ignore
    wrapper.vm.undo()

    expect(mockCtx.putImageData).toHaveBeenCalled()
  })
})
