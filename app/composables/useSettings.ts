import { ref, watch, readonly } from 'vue'
import { useUser } from '~/composables/useUser'

export interface Settings {
  desktopPattern: string;
  theme: 'classic' | 'dark' | 'high-contrast';
  soundVolume: number;
  highlightColor: string;
  timeFormat: '12h' | '24h';
  showSeconds: boolean;
  dateFormat: string;
  timezone: string;
}

const defaultSettings: Settings = {
  desktopPattern: 'default',
  theme: 'classic',
  soundVolume: 75,
  highlightColor: '#000080',
  timeFormat: '12h',
  showSeconds: false,
  dateFormat: 'MM/DD/YYYY',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
}

const settings = ref<Settings>({ ...defaultSettings })

export function useSettings() {
  const { isAuthenticated } = useUser()

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    settings.value[key] = value
    saveSettingsToServer()
  }

  const saveSettingsToServer = async () => {
    if (!isAuthenticated.value) return
    try {
      await $fetch('/api/settings', {
        method: 'POST',
        body: { settings: settings.value }
      })
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }

  const fetchSettingsFromServer = async () => {
    if (!isAuthenticated.value) return
    try {
      const response = await $fetch<{ settings: Partial<Settings> }>('/api/settings')
      if (response.settings) {
        settings.value = { ...defaultSettings, ...response.settings }
      }
    } catch (e) {
      console.error('Failed to fetch settings:', e)
    }
  }

  const resetSettings = () => {
    settings.value = { ...defaultSettings }
  }

  return {
    settings: readonly(settings),
    updateSetting,
    fetchSettingsFromServer,
    resetSettings
  }
}
