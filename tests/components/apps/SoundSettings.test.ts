import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SoundSettings from '~/components/apps/SoundSettings.vue'
import { ref } from 'vue'

const mockUpdateSetting = vi.fn((key, value) => {
  mockSettings.value[key] = value
})
const mockSettings = ref({
  soundVolume: 75,
  alertSound: 'beep'
})

vi.mock('~/composables/useSettings', () => ({
  useSettings: () => ({
    settings: mockSettings,
    updateSetting: mockUpdateSetting
  })
}))

const mockPlaySystemSound = vi.fn()
const mockPlayBeep = vi.fn()

vi.mock('~/composables/useSound', () => ({
  useSound: () => ({
    playSystemSound: mockPlaySystemSound,
    playBeep: mockPlayBeep
  })
}))

describe('SoundSettings.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSettings.value = {
      soundVolume: 75,
      alertSound: 'beep'
    }
  })

  it('renders correctly', () => {
    const wrapper = mount(SoundSettings)
    expect(wrapper.find('.sound-settings').exists()).toBe(true)
  })

  it('displays current volume', () => {
    const wrapper = mount(SoundSettings)
    expect(wrapper.find('.sound-settings__volume-value').text()).toBe('75')
    const slider = wrapper.find('.sound-settings__slider') as any
    expect(slider.element.value).toBe('75')
  })

  it('updates volume setting on change', async () => {
    const wrapper = mount(SoundSettings)
    const slider = wrapper.find('.sound-settings__slider')
    await slider.setValue(50)
    expect(mockUpdateSetting).toHaveBeenCalledWith('soundVolume', 50)
  })

  it('displays sound list', () => {
    const wrapper = mount(SoundSettings)
    const items = wrapper.findAll('.sound-settings__sound-item')
    expect(items.length).toBeGreaterThan(0)
  })

  it('updates alert sound setting on click', async () => {
    const wrapper = mount(SoundSettings)
    const items = wrapper.findAll('.sound-settings__sound-item')
    // Index 1 should be 'quack'
    await items[1].trigger('click')
    expect(mockUpdateSetting).toHaveBeenCalledWith('alertSound', 'quack')
    expect(mockPlaySystemSound).toHaveBeenCalledWith('quack')
  })

  it('plays beep when Test Sound is clicked and alertSound is beep', async () => {
    const wrapper = mount(SoundSettings)
    await wrapper.find('.mac-button').trigger('click')
    expect(mockPlayBeep).toHaveBeenCalled()
  })
})
