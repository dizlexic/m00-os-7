import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MonitorsSettings from '~/components/apps/MonitorsSettings.vue'
import { useSettings } from '~/composables/useSettings'

import { ref } from 'vue'

const mockUpdateSetting = vi.fn()
const mockSettings = ref({
  colorDepth: '256',
  monitorResolution: '640x480'
})

vi.mock('~/composables/useSettings', () => ({
  useSettings: () => ({
    settings: mockSettings,
    updateSetting: mockUpdateSetting
  })
}))

describe('MonitorsSettings.vue', () => {
  beforeEach(() => {
    mockUpdateSetting.mockClear()
  })

  it('renders correctly', () => {
    const wrapper = mount(MonitorsSettings)
    expect(wrapper.find('.monitors-settings').exists()).toBe(true)
  })

  it('displays color depth section', () => {
    const wrapper = mount(MonitorsSettings)
    expect(wrapper.text()).toContain('Color Depth')
  })

  it('displays color depth options', () => {
    const wrapper = mount(MonitorsSettings)
    const colorDepthOptions = wrapper.findAll('.monitors-settings__color-depth-option')
    expect(colorDepthOptions.length).toBeGreaterThan(0)
  })

  it('updates color depth on selection', async () => {
    const { updateSetting } = useSettings()
    const wrapper = mount(MonitorsSettings)
    const colorDepthOptions = wrapper.findAll('.monitors-settings__color-depth-option')
    await colorDepthOptions[1].trigger('click')
    expect(updateSetting).toHaveBeenCalledWith('colorDepth', expect.any(String))
  })

  it('highlights the currently selected color depth', () => {
    mockSettings.value.colorDepth = '256'
    const wrapper = mount(MonitorsSettings)
    const activeOption = wrapper.find('.monitors-settings__color-depth-option--active')
    expect(activeOption.exists()).toBe(true)
  })

  it('displays monitor resolution section', () => {
    const wrapper = mount(MonitorsSettings)
    expect(wrapper.text()).toContain('Resolution')
  })

  it('displays current screen resolution', () => {
    const wrapper = mount(MonitorsSettings)
    // Should display some resolution info
    const resolutionInfo = wrapper.find('.monitors-settings__resolution-info')
    expect(resolutionInfo.exists()).toBe(true)
  })

  it('displays monitor arrangement section (mock)', () => {
    const wrapper = mount(MonitorsSettings)
    expect(wrapper.text()).toContain('Monitor')
  })

  it('displays a mock monitor preview', () => {
    const wrapper = mount(MonitorsSettings)
    const monitorPreview = wrapper.find('.monitors-settings__monitor-preview')
    expect(monitorPreview.exists()).toBe(true)
  })
})
