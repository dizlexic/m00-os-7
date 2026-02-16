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

  describe('Clipboard Operations', () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    const mockReadText = vi.fn().mockResolvedValue('Pasted Text')

    beforeEach(() => {
      // Mock clipboard API using defineProperty
      mockWriteText.mockClear()
      mockReadText.mockClear()
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
          readText: mockReadText
        },
        writable: true,
        configurable: true
      })
    })

    it('should expose copy method that copies selected text', async () => {
      const wrapper = mount(SimpleText, {
        props: {
          fileId: 'file-1',
          isActive: true
        }
      })

      await nextTick()

      const textarea = wrapper.find('textarea').element as HTMLTextAreaElement
      
      // Select "Hello" from "Hello World"
      textarea.setSelectionRange(0, 5)
      
      // Call copy method
      await wrapper.vm.copyText()
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello')
      wrapper.unmount()
    })

    it('should expose cut method that cuts selected text', async () => {
      const wrapper = mount(SimpleText, {
        props: {
          fileId: 'file-1',
          isActive: true
        }
      })

      await nextTick()

      const textarea = wrapper.find('textarea').element as HTMLTextAreaElement
      
      // Select "Hello" from "Hello World"
      textarea.setSelectionRange(0, 5)
      
      // Call cut method
      await wrapper.vm.cutText()
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello')
      expect(textarea.value).toBe(' World')
      wrapper.unmount()
    })

    it('should expose paste method that pastes text at cursor', async () => {
      const wrapper = mount(SimpleText, {
        props: {
          fileId: 'file-1',
          isActive: true
        }
      })

      await nextTick()

      const textarea = wrapper.find('textarea').element as HTMLTextAreaElement
      
      // Position cursor at the end
      textarea.setSelectionRange(11, 11)
      
      // Call paste method
      await wrapper.vm.pasteText()
      
      expect(navigator.clipboard.readText).toHaveBeenCalled()
      expect(textarea.value).toBe('Hello WorldPasted Text')
      wrapper.unmount()
    })

    it('should replace selected text when pasting', async () => {
      const wrapper = mount(SimpleText, {
        props: {
          fileId: 'file-1',
          isActive: true
        }
      })

      await nextTick()

      const textarea = wrapper.find('textarea').element as HTMLTextAreaElement
      
      // Select "World" from "Hello World"
      textarea.setSelectionRange(6, 11)
      
      // Call paste method
      await wrapper.vm.pasteText()
      
      expect(textarea.value).toBe('Hello Pasted Text')
      wrapper.unmount()
    })

    it('should handle hasSelection method correctly', async () => {
      const wrapper = mount(SimpleText, {
        props: {
          fileId: 'file-1',
          isActive: true
        }
      })

      await nextTick()

      const textarea = wrapper.find('textarea').element as HTMLTextAreaElement
      
      // No selection initially
      textarea.setSelectionRange(0, 0)
      expect(wrapper.vm.hasSelection()).toBe(false)
      
      // Select some text
      textarea.setSelectionRange(0, 5)
      expect(wrapper.vm.hasSelection()).toBe(true)
      
      wrapper.unmount()
    })
  })
})
