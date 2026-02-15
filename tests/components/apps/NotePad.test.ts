import { nextTick } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NotePad from '~/components/apps/NotePad.vue'

// Mock the composables
const { mockFileSystem } = vi.hoisted(() => ({
  mockFileSystem: {
    getNode: vi.fn((id) => {
      if (id === 'notepad-file') {
        return {
          id: 'notepad-file',
          name: 'Note Pad File',
          type: 'file',
          content: JSON.stringify(['Page 1 content', 'Page 2 content']),
          parentId: 'system'
        }
      }
      return undefined
    }),
    updateFileContent: vi.fn(),
    createFile: vi.fn(() => 'new-notepad-file'),
    getNodeByPath: vi.fn((path) => {
        if (path === '/Macintosh HD/System Folder/Note Pad File') {
            return {
                id: 'notepad-file',
                name: 'Note Pad File',
                type: 'file',
                content: JSON.stringify(['Page 1 content', 'Page 2 content']),
                parentId: 'system'
            }
        }
        return null
    })
  }
}))

vi.mock('~/composables/useFileSystem', () => ({
  useFileSystem: () => mockFileSystem
}))

describe('NotePad.vue', () => {
  it('renders correctly and loads first page', async () => {
    const wrapper = mount(NotePad, {
      props: {
        isActive: true
      }
    })

    await nextTick()

    expect(wrapper.find('.note-pad').exists()).toBe(true)
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    // By default if no file is found it should probably have at least one empty page
    // In our mock it should load 'Page 1 content'
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Page 1 content')
  })

  it('navigates to the next page', async () => {
    const wrapper = mount(NotePad, {
      props: {
        isActive: true
      }
    })

    await nextTick()

    const nextButton = wrapper.find('[data-testid="next-page"]')
    await nextButton.trigger('click')

    const textarea = wrapper.find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Page 2 content')
  })

  it('navigates to the previous page', async () => {
    const wrapper = mount(NotePad, {
      props: {
        isActive: true
      }
    })

    await nextTick()

    // Go to second page first
    const nextButton = wrapper.find('[data-testid="next-page"]')
    await nextButton.trigger('click')

    // Go back to first page
    const prevButton = wrapper.find('[data-testid="prev-page"]')
    await prevButton.trigger('click')

    const textarea = wrapper.find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Page 1 content')
  })

  it('adds a new page when navigating past the last page', async () => {
    const wrapper = mount(NotePad, {
      props: {
        isActive: true
      }
    })

    await nextTick()

    // We have 2 pages in mock. Go to 2nd, then click next to add 3rd.
    await wrapper.find('[data-testid="next-page"]').trigger('click') // 2nd page
    await wrapper.find('[data-testid="next-page"]').trigger('click') // Should add 3rd page

    const textarea = wrapper.find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('')

    const pageIndicator = wrapper.find('.note-pad__page-indicator')
    expect(pageIndicator.text()).toContain('3')
  })

  it('deletes the current page', async () => {
    const wrapper = mount(NotePad, {
      props: {
        isActive: true
      }
    })

    await nextTick()

    // Page 1: 'Page 1 content', Page 2: 'Page 2 content'
    const deleteButton = wrapper.find('[data-testid="delete-page"]')
    await deleteButton.trigger('click')

    const textarea = wrapper.find('textarea')
    // After deleting Page 1, Page 2 should become Page 1
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Page 2 content')
    
    const pageIndicator = wrapper.find('.note-pad__page-indicator')
    expect(pageIndicator.text()).toContain('1')
  })

  it('keeps at least one page when deleting the only page', async () => {
    // Mock with only one page
    mockFileSystem.getNodeByPath.mockReturnValueOnce({
      id: 'notepad-file',
      name: 'Note Pad File',
      type: 'file',
      content: JSON.stringify(['Only page']),
      parentId: 'system'
    })

    const wrapper = mount(NotePad, {
      props: {
        isActive: true
      }
    })

    await nextTick()

    const deleteButton = wrapper.find('[data-testid="delete-page"]')
    await deleteButton.trigger('click')

    const textarea = wrapper.find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('')
    
    const pageIndicator = wrapper.find('.note-pad__page-indicator')
    expect(pageIndicator.text()).toContain('1')
  })
})
