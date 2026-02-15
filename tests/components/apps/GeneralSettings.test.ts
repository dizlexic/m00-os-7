import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GeneralSettings from '~/components/apps/GeneralSettings.vue'
import { useSettings } from '~/composables/useSettings'

import { ref } from 'vue'

const mockUpdateSetting = vi.fn()
const mockSettings = ref({
  desktopPattern: 'default',
  highlightColor: '#000080'
})

vi.mock('~/composables/useSettings', () => ({
  useSettings: () => ({
    settings: mockSettings,
    updateSetting: mockUpdateSetting
  })
}))

describe('GeneralSettings.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(GeneralSettings)
    expect(wrapper.find('.general-settings').exists()).toBe(true)
  })

  it('displays pattern options', () => {
    const wrapper = mount(GeneralSettings)
    const patterns = wrapper.findAll('.general-settings__pattern')
    expect(patterns.length).toBeGreaterThan(0)
  })

  it('updates pattern on click', async () => {
    const { updateSetting } = useSettings()
    const wrapper = mount(GeneralSettings)
    const patterns = wrapper.findAll('.general-settings__pattern')
    await patterns[1].trigger('click')
    expect(updateSetting).toHaveBeenCalledWith('desktopPattern', expect.any(String))
  })

  it('displays color options', () => {
    const wrapper = mount(GeneralSettings)
    const colors = wrapper.findAll('.general-settings__color')
    expect(colors.length).toBeGreaterThan(0)
  })

  it('updates color on click', async () => {
    const { updateSetting } = useSettings()
    const wrapper = mount(GeneralSettings)
    const colors = wrapper.findAll('.general-settings__color')
    await colors[1].trigger('click')
    expect(updateSetting).toHaveBeenCalledWith('highlightColor', expect.any(String))
  })
})
