import { nextTick } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SimpleText from '~/components/apps/SimpleText.vue'

// Mock the composables
const { mockFileSystem } = vi.hoisted(() => ({
  mockFileSystem: {
    getNode: vi.fn((id) => {
      if (id === 'file-1') {
        return {
          id: 'file-1',
          name: 'README.txt',
          type: 'file',
          content: 'Hello World',
          parentId: 'root'
        }
      }
      return undefined
    }),
    renameNode: vi.fn(),
    updateFileContent: vi.fn(),
    deleteNode: vi.fn()
  }
}))

vi.mock('~/composables/useFileSystem', () => ({
  useFileSystem: () => mockFileSystem
}))

describe('SimpleText.vue', () => {
  it('renders correctly with file content', async () => {
    const wrapper = mount(SimpleText, {
      props: {
        fileId: 'file-1'
      }
    })

    await nextTick()

    expect(wrapper.find('.simple-text').exists()).toBe(true)
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Hello World')
  })

  it('renders empty when no fileId is provided', () => {
    const wrapper = mount(SimpleText, {
      props: {
        fileId: undefined
      }
    })

    const textarea = wrapper.find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('')
  })

  it('updates file name in parent window if implemented', () => {
    // This might be handled by the window manager or the component itself calling renameNode
  })

  it('saves file content on Cmd+S when active', async () => {
    const wrapper = mount(SimpleText, {
      props: {
        fileId: 'file-1',
        isActive: true
      }
    })
    
    await nextTick()
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('Updated Content')
    
    // Simulate Cmd+S
    const event = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true,
      bubbles: true
    })
    window.dispatchEvent(event)
    
    expect(mockFileSystem.updateFileContent).toHaveBeenCalledWith('file-1', 'Updated Content')
    wrapper.unmount()
  })

  it('does not save file content on Cmd+S when inactive', async () => {
    mockFileSystem.updateFileContent.mockClear()
    const wrapper = mount(SimpleText, {
      props: {
        fileId: 'file-1',
        isActive: false
      }
    })
    
    await nextTick()
    
    const textarea = wrapper.find('textarea')
    await textarea.setValue('Updated Content')
    
    // Simulate Cmd+S
    const event = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true,
      bubbles: true
    })
    window.dispatchEvent(event)
    
    expect(mockFileSystem.updateFileContent).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
