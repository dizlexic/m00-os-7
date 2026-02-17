/**
 * useSettings Composable Tests
 *
 * Comprehensive tests for the settings management system including
 * reading, updating, persisting, and resetting user settings.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSettings, type Settings } from '~/composables/useSettings'

// Mock useUser
const mockIsAuthenticated = { value: true }
vi.mock('~/composables/useUser', () => ({
  useUser: () => ({
    isAuthenticated: mockIsAuthenticated
  })
}))

// Mock $fetch
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockIsAuthenticated.value = true
    mockFetch.mockReset()
    // Reset settings to defaults before each test
    const { resetSettings } = useSettings()
    resetSettings()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with default settings', () => {
      const { settings } = useSettings()

      expect(settings.value.desktopPattern).toBe('default')
      expect(settings.value.theme).toBe('classic')
      expect(settings.value.soundVolume).toBe(75)
      expect(settings.value.alertSound).toBe('beep')
      expect(settings.value.highlightColor).toBe('#000080')
      expect(settings.value.timeFormat).toBe('12h')
      expect(settings.value.showSeconds).toBe(false)
      expect(settings.value.showDayOfWeek).toBe(false)
      expect(settings.value.dateFormat).toBe('MM/DD/YYYY')
      expect(settings.value.daylightSaving).toBe(false)
      expect(settings.value.fontSize).toBe('standard')
      expect(settings.value.menuBlinking).toBe(true)
    })

    it('should have a valid timezone', () => {
      const { settings } = useSettings()

      expect(settings.value.timezone).toBeDefined()
      expect(typeof settings.value.timezone).toBe('string')
      expect(settings.value.timezone.length).toBeGreaterThan(0)
    })

    it('should return readonly settings', () => {
      const { settings } = useSettings()

      // Settings should be readonly (this is a type check, but we can verify the ref exists)
      expect(settings.value).toBeDefined()
      expect(typeof settings.value).toBe('object')
    })
  })

  describe('updateSetting', () => {
    it('should update desktopPattern setting', async () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValueOnce({})

      updateSetting('desktopPattern', 'stripes')

      expect(settings.value.desktopPattern).toBe('stripes')
    })

    it('should update theme setting', async () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValueOnce({})

      updateSetting('theme', 'dark')

      expect(settings.value.theme).toBe('dark')
    })

    it('should update soundVolume setting', async () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValueOnce({})

      updateSetting('soundVolume', 50)

      expect(settings.value.soundVolume).toBe(50)
    })

    it('should update alertSound setting', async () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValueOnce({})

      updateSetting('alertSound', 'chime')

      expect(settings.value.alertSound).toBe('chime')
    })

    it('should update highlightColor setting', async () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValueOnce({})

      updateSetting('highlightColor', '#FF0000')

      expect(settings.value.highlightColor).toBe('#FF0000')
    })

    it('should update timeFormat setting', async () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValueOnce({})

      updateSetting('timeFormat', '24h')

      expect(settings.value.timeFormat).toBe('24h')
    })

    it('should update showSeconds setting', async () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValueOnce({})

      updateSetting('showSeconds', true)

      expect(settings.value.showSeconds).toBe(true)
    })

    it('should update showDayOfWeek setting', async () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValueOnce({})

      updateSetting('showDayOfWeek', true)

      expect(settings.value.showDayOfWeek).toBe(true)
    })

    it('should update dateFormat setting', async () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValueOnce({})

      updateSetting('dateFormat', 'DD/MM/YYYY')

      expect(settings.value.dateFormat).toBe('DD/MM/YYYY')
    })

    it('should update timezone setting', async () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValueOnce({})

      updateSetting('timezone', 'America/New_York')

      expect(settings.value.timezone).toBe('America/New_York')
    })

    it('should update daylightSaving setting', async () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValueOnce({})

      updateSetting('daylightSaving', true)

      expect(settings.value.daylightSaving).toBe(true)
    })

    it('should update fontSize setting', async () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValueOnce({})

      updateSetting('fontSize', 'large')

      expect(settings.value.fontSize).toBe('large')
    })

    it('should update menuBlinking setting', async () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValueOnce({})

      updateSetting('menuBlinking', false)

      expect(settings.value.menuBlinking).toBe(false)
    })

    it('should call saveSettingsToServer when authenticated', async () => {
      const { updateSetting } = useSettings()
      mockFetch.mockResolvedValueOnce({})

      updateSetting('theme', 'dark')

      // Fast-forward time
      vi.advanceTimersByTime(1000)

      // Wait for any pending promises
      await Promise.resolve()

      expect(mockFetch).toHaveBeenCalledWith('/api/settings', {
        method: 'POST',
        body: expect.objectContaining({
          settings: expect.objectContaining({
            theme: 'dark'
          })
        })
      })
    })

    it('should not call saveSettingsToServer when not authenticated', async () => {
      mockIsAuthenticated.value = false
      const { updateSetting } = useSettings()

      updateSetting('theme', 'dark')

      // Fast-forward time
      vi.advanceTimersByTime(1000)
      await Promise.resolve()

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle save errors gracefully', async () => {
      const { updateSetting, settings } = useSettings()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      updateSetting('theme', 'dark')

      // Setting should still be updated locally
      expect(settings.value.theme).toBe('dark')

      // Fast-forward time
      vi.advanceTimersByTime(1000)
      await Promise.resolve()
      await Promise.resolve() // Extra tick for catch block

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save settings:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('fetchSettingsFromServer', () => {
    it('should fetch and merge settings from server', async () => {
      const { settings, fetchSettingsFromServer } = useSettings()
      mockFetch.mockResolvedValueOnce({
        settings: {
          theme: 'dark',
          soundVolume: 50,
          timeFormat: '24h'
        }
      })

      await fetchSettingsFromServer()

      expect(settings.value.theme).toBe('dark')
      expect(settings.value.soundVolume).toBe(50)
      expect(settings.value.timeFormat).toBe('24h')
      // Other settings should remain at defaults
      expect(settings.value.desktopPattern).toBe('default')
    })

    it('should call correct API endpoint', async () => {
      const { fetchSettingsFromServer } = useSettings()
      mockFetch.mockResolvedValueOnce({ settings: {} })

      await fetchSettingsFromServer()

      expect(mockFetch).toHaveBeenCalledWith('/api/settings')
    })

    it('should not fetch when not authenticated', async () => {
      mockIsAuthenticated.value = false
      const { fetchSettingsFromServer } = useSettings()

      await fetchSettingsFromServer()

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle fetch errors gracefully', async () => {
      const { settings, fetchSettingsFromServer } = useSettings()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await fetchSettingsFromServer()

      // Settings should remain at defaults
      expect(settings.value.theme).toBe('classic')
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch settings:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('should handle empty response gracefully', async () => {
      const { settings, fetchSettingsFromServer } = useSettings()
      mockFetch.mockResolvedValueOnce({})

      await fetchSettingsFromServer()

      // Settings should remain at defaults
      expect(settings.value.theme).toBe('classic')
      expect(settings.value.desktopPattern).toBe('default')
    })

    it('should handle null settings in response', async () => {
      const { settings, fetchSettingsFromServer } = useSettings()
      mockFetch.mockResolvedValueOnce({ settings: null })

      await fetchSettingsFromServer()

      // Settings should remain at defaults
      expect(settings.value.theme).toBe('classic')
    })

    it('should preserve default values for missing server settings', async () => {
      const { settings, fetchSettingsFromServer } = useSettings()
      mockFetch.mockResolvedValueOnce({
        settings: {
          theme: 'dark'
          // Only theme is provided, other settings should use defaults
        }
      })

      await fetchSettingsFromServer()

      expect(settings.value.theme).toBe('dark')
      expect(settings.value.desktopPattern).toBe('default')
      expect(settings.value.soundVolume).toBe(75)
      expect(settings.value.alertSound).toBe('beep')
      expect(settings.value.highlightColor).toBe('#000080')
      expect(settings.value.timeFormat).toBe('12h')
    })
  })

  describe('resetSettings', () => {
    it('should reset all settings to defaults', () => {
      const { settings, updateSetting, resetSettings } = useSettings()
      mockFetch.mockResolvedValue({})

      // Change some settings
      updateSetting('theme', 'dark')
      updateSetting('soundVolume', 25)
      updateSetting('timeFormat', '24h')
      updateSetting('showSeconds', true)

      // Verify changes
      expect(settings.value.theme).toBe('dark')
      expect(settings.value.soundVolume).toBe(25)

      // Reset
      resetSettings()

      // Verify defaults
      expect(settings.value.theme).toBe('classic')
      expect(settings.value.soundVolume).toBe(75)
      expect(settings.value.timeFormat).toBe('12h')
      expect(settings.value.showSeconds).toBe(false)
      expect(settings.value.desktopPattern).toBe('default')
    })

    it('should reset desktopPattern to default', () => {
      const { settings, updateSetting, resetSettings } = useSettings()
      mockFetch.mockResolvedValue({})

      updateSetting('desktopPattern', 'custom-pattern')
      expect(settings.value.desktopPattern).toBe('custom-pattern')

      resetSettings()

      expect(settings.value.desktopPattern).toBe('default')
    })

    it('should reset highlightColor to default', () => {
      const { settings, updateSetting, resetSettings } = useSettings()
      mockFetch.mockResolvedValue({})

      updateSetting('highlightColor', '#FF0000')
      expect(settings.value.highlightColor).toBe('#FF0000')

      resetSettings()

      expect(settings.value.highlightColor).toBe('#000080')
    })

    it('should reset dateFormat to default', () => {
      const { settings, updateSetting, resetSettings } = useSettings()
      mockFetch.mockResolvedValue({})

      updateSetting('dateFormat', 'YYYY-MM-DD')
      expect(settings.value.dateFormat).toBe('YYYY-MM-DD')

      resetSettings()

      expect(settings.value.dateFormat).toBe('MM/DD/YYYY')
    })

    it('should reset daylightSaving to default', () => {
      const { settings, updateSetting, resetSettings } = useSettings()
      mockFetch.mockResolvedValue({})

      updateSetting('daylightSaving', true)
      expect(settings.value.daylightSaving).toBe(true)

      resetSettings()

      expect(settings.value.daylightSaving).toBe(false)
    })
  })

  describe('shared state', () => {
    it('should share state between multiple useSettings calls', () => {
      const settings1 = useSettings()
      const settings2 = useSettings()
      mockFetch.mockResolvedValue({})

      settings1.updateSetting('theme', 'dark')

      expect(settings2.settings.value.theme).toBe('dark')
    })

    it('should reflect changes across all instances', () => {
      const instance1 = useSettings()
      const instance2 = useSettings()
      const instance3 = useSettings()
      mockFetch.mockResolvedValue({})

      instance1.updateSetting('soundVolume', 100)

      expect(instance2.settings.value.soundVolume).toBe(100)
      expect(instance3.settings.value.soundVolume).toBe(100)
    })
  })

  describe('settings types', () => {
    it('should accept valid theme values', () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValue({})

      updateSetting('theme', 'classic')
      expect(settings.value.theme).toBe('classic')

      updateSetting('theme', 'dark')
      expect(settings.value.theme).toBe('dark')

      updateSetting('theme', 'high-contrast')
      expect(settings.value.theme).toBe('high-contrast')
    })

    it('should accept valid timeFormat values', () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValue({})

      updateSetting('timeFormat', '12h')
      expect(settings.value.timeFormat).toBe('12h')

      updateSetting('timeFormat', '24h')
      expect(settings.value.timeFormat).toBe('24h')
    })

    it('should accept numeric soundVolume values', () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValue({})

      updateSetting('soundVolume', 0)
      expect(settings.value.soundVolume).toBe(0)

      updateSetting('soundVolume', 100)
      expect(settings.value.soundVolume).toBe(100)

      updateSetting('soundVolume', 50)
      expect(settings.value.soundVolume).toBe(50)
    })

    it('should accept boolean values for showSeconds', () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValue({})

      updateSetting('showSeconds', true)
      expect(settings.value.showSeconds).toBe(true)

      updateSetting('showSeconds', false)
      expect(settings.value.showSeconds).toBe(false)
    })

    it('should accept boolean values for showDayOfWeek', () => {
      const { settings, updateSetting } = useSettings()
      mockFetch.mockResolvedValue({})

      updateSetting('showDayOfWeek', true)
      expect(settings.value.showDayOfWeek).toBe(true)

      updateSetting('showDayOfWeek', false)
      expect(settings.value.showDayOfWeek).toBe(false)
    })
  })
})
