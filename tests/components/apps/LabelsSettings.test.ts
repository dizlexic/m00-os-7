import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LabelsSettings from '~/components/apps/LabelsSettings.vue'
import { DEFAULT_LABEL_NAMES, DEFAULT_LABEL_COLORS } from '~/types/filesystem'

const mockUpdateSetting = vi.fn()

vi.mock('~/composables/useSettings', () => ({
  useSettings: () => ({
    settings: {
      value: {
        labelNames: [...DEFAULT_LABEL_NAMES],
        labelColors: [...DEFAULT_LABEL_COLORS]
      }
    },
    updateSetting: mockUpdateSetting
  })
}))

describe('LabelsSettings.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders 7 rows for editable labels', () => {
    const wrapper = mount(LabelsSettings)
    const rows = wrapper.findAll('.labels-settings__row')
    expect(rows).toHaveLength(7)
  })

  it('updates label name on input', async () => {
    const wrapper = mount(LabelsSettings)
    const firstInput = wrapper.find('input')

    await firstInput.setValue('New Essential')

    expect(mockUpdateSetting).toHaveBeenCalledWith('labelNames', expect.arrayContaining(['New Essential']))
  })

  it('shows color picker on color box click', async () => {
    const wrapper = mount(LabelsSettings)
    const firstColorBox = wrapper.find('.labels-settings__color-box')

    await firstColorBox.trigger('click')

    const colorPicker = wrapper.find('.labels-settings__color-picker')
    expect(colorPicker.exists()).toBe(true)
  })

  it('updates color on color option click', async () => {
    const wrapper = mount(LabelsSettings)

    // Open picker
    await wrapper.find('.labels-settings__color-box').trigger('click')

    // Select first color option
    const firstOption = wrapper.find('.labels-settings__color-option')
    await firstOption.trigger('click')

    expect(mockUpdateSetting).toHaveBeenCalledWith('labelColors', expect.any(Array))
    expect(wrapper.find('.labels-settings__color-picker').exists()).toBe(false)
  })
})
