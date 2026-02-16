<script setup lang="ts">
/**
 * MonitorsSettings Component
 *
 * Control panel for display/monitor settings like color depth
 * and resolution display (mock).
 */
import { computed } from 'vue'
import { useSettings } from '~/composables/useSettings'

const { settings, updateSetting } = useSettings()

interface ColorDepthOption {
  id: string
  name: string
  colors: string
  description: string
}

const colorDepthOptions: ColorDepthOption[] = [
  { id: '2', name: 'Black & White', colors: '2', description: '1-bit' },
  { id: '4', name: '4 Colors', colors: '4', description: '2-bit' },
  { id: '16', name: '16 Colors', colors: '16', description: '4-bit' },
  { id: '256', name: '256 Colors', colors: '256', description: '8-bit' },
  { id: 'thousands', name: 'Thousands', colors: '32,768', description: '16-bit' },
  { id: 'millions', name: 'Millions', colors: '16.7M', description: '24-bit' }
]

const resolutionOptions = [
  { id: '512x384', name: '512 × 384' },
  { id: '640x480', name: '640 × 480' },
  { id: '800x600', name: '800 × 600' },
  { id: '832x624', name: '832 × 624' },
  { id: '1024x768', name: '1024 × 768' }
]

// Get current screen resolution for display
const currentResolution = computed(() => {
  if (typeof window !== 'undefined') {
    return `${window.screen.width} × ${window.screen.height}`
  }
  return '640 × 480'
})

// Get current color depth setting or default
const currentColorDepth = computed(() => {
  return settings.value?.colorDepth || '256'
})

function selectColorDepth(depthId: string) {
  updateSetting('colorDepth', depthId)
}
</script>

<template>
  <div class="monitors-settings">
    <div class="monitors-settings__section">
      <h3 class="monitors-settings__title">Monitor</h3>
      <div class="monitors-settings__monitor-container">
        <div class="monitors-settings__monitor-preview">
          <div class="monitors-settings__monitor-screen">
            <div class="monitors-settings__monitor-content">
              <div class="monitors-settings__monitor-menubar"></div>
              <div class="monitors-settings__monitor-desktop"></div>
            </div>
          </div>
          <div class="monitors-settings__monitor-stand"></div>
          <div class="monitors-settings__monitor-base"></div>
        </div>
        <div class="monitors-settings__monitor-label">Built-in Display</div>
      </div>
    </div>

    <div class="monitors-settings__section">
      <h3 class="monitors-settings__title">Color Depth</h3>
      <div class="monitors-settings__color-depth-grid">
        <div
          v-for="option in colorDepthOptions"
          :key="option.id"
          class="monitors-settings__color-depth-option"
          :class="{ 'monitors-settings__color-depth-option--active': currentColorDepth === option.id }"
          @click="selectColorDepth(option.id)"
        >
          <div class="monitors-settings__color-depth-name">{{ option.name }}</div>
          <div class="monitors-settings__color-depth-desc">{{ option.description }}</div>
        </div>
      </div>
    </div>

    <div class="monitors-settings__section">
      <h3 class="monitors-settings__title">Resolution</h3>
      <div class="monitors-settings__resolution-info">
        <div class="monitors-settings__resolution-current">
          <span class="monitors-settings__resolution-label">Current:</span>
          <span class="monitors-settings__resolution-value">{{ currentResolution }}</span>
        </div>
        <div class="monitors-settings__resolution-note">
          Resolution is determined by your browser window size.
        </div>
      </div>
      <div class="monitors-settings__resolution-options">
        <div
          v-for="res in resolutionOptions"
          :key="res.id"
          class="monitors-settings__resolution-option"
          :class="{ 'monitors-settings__resolution-option--disabled': true }"
          :title="'Resolution options are for display only'"
        >
          {{ res.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.monitors-settings {
  padding: var(--spacing-md);
  background-color: var(--color-gray-light);
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  overflow-y: auto;
}

.monitors-settings__section {
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  padding: var(--spacing-md);
  box-shadow: 1px 1px 0 var(--color-white) inset;
}

.monitors-settings__title {
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-gray-light);
  padding-bottom: var(--spacing-xs);
}

/* Monitor Preview */
.monitors-settings__monitor-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-sm);
}

.monitors-settings__monitor-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.monitors-settings__monitor-screen {
  width: 80px;
  height: 60px;
  background-color: var(--color-gray-medium);
  border: 2px solid var(--color-black);
  border-radius: 4px 4px 0 0;
  padding: 4px;
  box-shadow: inset 1px 1px 0 var(--color-white), inset -1px -1px 0 var(--color-gray-dark);
}

.monitors-settings__monitor-content {
  width: 100%;
  height: 100%;
  background-color: var(--color-gray-light);
  border: 1px solid var(--color-black);
}

.monitors-settings__monitor-menubar {
  height: 4px;
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-black);
}

.monitors-settings__monitor-desktop {
  height: calc(100% - 5px);
  background-color: var(--color-gray-medium);
}

.monitors-settings__monitor-stand {
  width: 20px;
  height: 8px;
  background-color: var(--color-gray-medium);
  border-left: 1px solid var(--color-black);
  border-right: 1px solid var(--color-black);
}

.monitors-settings__monitor-base {
  width: 40px;
  height: 4px;
  background-color: var(--color-gray-medium);
  border: 1px solid var(--color-black);
  border-radius: 0 0 2px 2px;
}

.monitors-settings__monitor-label {
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-sm);
  color: var(--color-black);
}

/* Color Depth Options */
.monitors-settings__color-depth-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.monitors-settings__color-depth-option {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-black);
  background-color: var(--color-white);
  cursor: pointer;
  text-align: center;
}

.monitors-settings__color-depth-option:hover {
  background-color: var(--color-gray-light);
}

.monitors-settings__color-depth-option--active {
  background-color: var(--color-highlight);
  color: var(--color-highlight-text);
}

.monitors-settings__color-depth-option--active:hover {
  background-color: var(--color-highlight);
}

.monitors-settings__color-depth-name {
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  font-weight: bold;
}

.monitors-settings__color-depth-desc {
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  opacity: 0.8;
}

/* Resolution Info */
.monitors-settings__resolution-info {
  margin-bottom: var(--spacing-md);
}

.monitors-settings__resolution-current {
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  margin-bottom: var(--spacing-xs);
}

.monitors-settings__resolution-label {
  font-weight: bold;
}

.monitors-settings__resolution-value {
  margin-left: var(--spacing-sm);
}

.monitors-settings__resolution-note {
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  color: var(--color-gray-dark);
  font-style: italic;
}

.monitors-settings__resolution-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.monitors-settings__resolution-option {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-gray-medium);
  background-color: var(--color-gray-light);
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
}

.monitors-settings__resolution-option--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
