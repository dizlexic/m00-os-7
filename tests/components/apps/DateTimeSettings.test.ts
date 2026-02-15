import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DateTimeSettings from '~/components/apps/DateTimeSettings.vue'
import { reactive } from 'vue'

const mockSettings = reactive({
  timeFormat: '12h',
  showSeconds: false,
  dateFormat: 'MM/DD/YYYY',
  timezone: 'UTC'
} as any)

const mockUpdateSetting = vi.fn((key, value) => {
  mockSettings[key] = value
})

vi.mock('~/composables/useSettings', () => ({
  useSettings: () => ({
    settings: mockSettings,
    updateSetting: mockUpdateSetting
  })
}))

describe('DateTimeSettings.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 2026-02-15 12:00:00 UTC
    vi.setSystemTime(new Date('2026-02-15T12:00:00Z'))
    mockUpdateSetting.mockClear()
    mockSettings.timeFormat = '12h'
    mockSettings.showSeconds = false
    mockSettings.dateFormat = 'MM/DD/YYYY'
    mockSettings.timezone = 'UTC'
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders correctly', () => {
    const wrapper = mount(DateTimeSettings)
    expect(wrapper.find('.datetime-settings').exists()).toBe(true)
  })

  it('displays current time and date', () => {
    const wrapper = mount(DateTimeSettings)
    // Since we mock settings.timezone as 'UTC' and system time is 12:00 UTC
    // we expect it to show something related to 12:00
    // Note: The component might use toLocaleString which depends on the environment
    expect(wrapper.find('.datetime-settings__time').text()).toBeTruthy()
    expect(wrapper.find('.datetime-settings__date').text()).toContain('2026')
  })

  it('updates settings when time format is changed', async () => {
    const wrapper = mount(DateTimeSettings)
    const radios = wrapper.findAll('.mac-radio__circle')
    // 12h is at index 0, 24h is at index 1
    await radios[1].trigger('click')
    expect(mockUpdateSetting).toHaveBeenCalledWith('timeFormat', '24h')
  })

  it('updates settings when show seconds is toggled', async () => {
    const wrapper = mount(DateTimeSettings)
    const checkbox = wrapper.find('.mac-checkbox__box')
    await checkbox.trigger('click')
    expect(mockUpdateSetting).toHaveBeenCalledWith('showSeconds', true)
  })

  it('updates settings when date format is changed', async () => {
    const wrapper = mount(DateTimeSettings)
    const dateSelect = wrapper.find('select')
    await dateSelect.setValue('YYYY-MM-DD')
    expect(mockUpdateSetting).toHaveBeenCalledWith('dateFormat', 'YYYY-MM-DD')
  })

  it('shows timezone selector and updates setting', async () => {
    const wrapper = mount(DateTimeSettings)
    // We expect a new select for timezone
    const selects = wrapper.findAll('select')
    // If it's the second select
    const timezoneSelect = selects.find(s => s.html().includes('timezone') || selects.indexOf(s) === 1)
    
    expect(timezoneSelect?.exists()).toBe(true)
    await timezoneSelect?.setValue('America/New_York')
    expect(mockUpdateSetting).toHaveBeenCalledWith('timezone', 'America/New_York')
  })
})
