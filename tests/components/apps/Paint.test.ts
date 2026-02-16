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
})
