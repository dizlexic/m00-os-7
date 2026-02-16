import { ref, watch, readonly } from 'vue'
import { useUser } from '~/composables/useUser'
import { DEFAULT_LABEL_COLORS, DEFAULT_LABEL_NAMES } from '~/types/filesystem'

export interface Settings {
  desktopPattern: string;
  theme: 'classic' | 'dark' | 'high-contrast';
  soundVolume: number;
  alertSound: string;
  highlightColor: string;
  timeFormat: '12h' | '24h';
  showSeconds: boolean;
  showDayOfWeek: boolean;
  dateFormat: string;
  timezone: string;
  daylightSaving: boolean;
  appData?: Record<string, any>;
  fontSize: 'small' | 'standard' | 'large';
  menuBlinking: boolean;
  labelNames: string[];
  labelColors: string[];
}

export interface SystemSettings {
  allowGuestLogin: boolean;
}

const defaultSettings: Settings = {
  desktopPattern: 'default',
  theme: 'classic',
  soundVolume: 75,
  alertSound: 'beep',
  highlightColor: '#000080',
  timeFormat: '12h',
  showSeconds: false,
  showDayOfWeek: false,
  dateFormat: 'MM/DD/YYYY',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  daylightSaving: false,
  fontSize: 'standard',
  menuBlinking: true,
  labelNames: [...DEFAULT_LABEL_NAMES],
  labelColors: [...DEFAULT_LABEL_COLORS]
}

const settings = ref<Settings>({ ...defaultSettings })
const systemSettings = ref<SystemSettings>({
  allowGuestLogin: true
})

export function useSettings() {
  const { isAuthenticated, user } = useUser()

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    settings.value[key] = value
    saveSettingsToServer()
  }

  const updateAppData = (key: string, value: any) => {
    if (!settings.value.appData) {
      settings.value.appData = {}
    }
    settings.value.appData[key] = value
    saveSettingsToServer()
  }

  const updateSystemSetting = async <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    if (user.value?.role !== 'admin') return

    systemSettings.value[key] = value
    try {
      await $fetch('/api/system-settings', {
        method: 'PATCH',
        body: { [key]: value }
      })
    } catch (e) {
      console.error('Failed to update system setting:', e)
    }
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

  const fetchSystemSettings = async () => {
    try {
      const response = await $fetch<{ settings: SystemSettings }>('/api/system-settings')
      if (response.settings) {
        systemSettings.value = response.settings
      }
    } catch (e) {
      console.error('Failed to fetch system settings:', e)
    }
  }

  const resetSettings = () => {
    settings.value = { ...defaultSettings }
  }

  return {
    settings: readonly(settings),
    systemSettings: readonly(systemSettings),
    updateSetting,
    updateAppData,
    updateSystemSetting,
    fetchSettingsFromServer,
    fetchSystemSettings,
    resetSettings
  }
}
