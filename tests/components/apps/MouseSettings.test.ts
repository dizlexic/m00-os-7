import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MouseSettings from '~/components/apps/MouseSettings.vue'
import { ref } from 'vue'

// Mock data
const mockSettings = ref({
  cursor: { style: 'arrow' as const, color: '#000000' },
  showRemoteCursors: true,
  showCursorLabels: true
})

const mockUpdateSettings = vi.fn()

vi.mock('~/composables/useSharedDesktop', () => ({
  useSharedDesktop: () => ({
    settings: mockSettings,
    updateSettings: mockUpdateSettings
  })
}))

describe('MouseSettings.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSettings.value = {
      cursor: { style: 'arrow', color: '#000000' },
      showRemoteCursors: true,
      showCursorLabels: true
    }
  })

  it('renders correctly', () => {
    const wrapper = mount(MouseSettings)
    expect(wrapper.find('.mouse-settings').exists()).toBe(true)
  })

  it('displays the title', () => {
    const wrapper = mount(MouseSettings)
    expect(wrapper.find('.mouse-settings__title').text()).toBe('Mouse Settings')
  })

  it('displays cursor style options', () => {
    const wrapper = mount(MouseSettings)
    const styleButtons = wrapper.findAll('.mouse-settings__cursor-style-btn')
    expect(styleButtons.length).toBe(4) // arrow, hand, crosshair, pointer
  })

  it('displays cursor color options', () => {
    const wrapper = mount(MouseSettings)
    const colorButtons = wrapper.findAll('.mouse-settings__color-btn')
    expect(colorButtons.length).toBe(8) // 8 colors in CURSOR_COLORS
  })

  it('updates cursor style when clicked', async () => {
    const wrapper = mount(MouseSettings)
    const styleButtons = wrapper.findAll('.mouse-settings__cursor-style-btn')
    await styleButtons[1].trigger('click') // Click 'Hand' button
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      cursor: expect.objectContaining({ style: 'hand' })
    })
  })

  it('updates cursor color when clicked', async () => {
    const wrapper = mount(MouseSettings)
    const colorButtons = wrapper.findAll('.mouse-settings__color-btn')
    await colorButtons[1].trigger('click') // Click second color
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      cursor: expect.objectContaining({ color: expect.any(String) })
    })
  })

  it('toggles show remote cursors setting', async () => {
    const wrapper = mount(MouseSettings)
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.trigger('change')
    expect(mockUpdateSettings).toHaveBeenCalledWith({ showRemoteCursors: false })
  })

  it('toggles show cursor labels setting', async () => {
    const wrapper = mount(MouseSettings)
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    await checkboxes[1].trigger('change')
    expect(mockUpdateSettings).toHaveBeenCalledWith({ showCursorLabels: false })
  })
})
