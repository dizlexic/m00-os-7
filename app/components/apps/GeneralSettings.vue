<script setup lang="ts">
/**
 * GeneralSettings Component
 *
 * Control panel for general system settings like desktop pattern
 * and highlight color.
 */
import { useSettings } from '~/composables/useSettings'

const { settings, updateSetting } = useSettings()

const patterns = [
  { id: 'default', name: 'Default', path: '' },
  { id: 'blueprint', name: 'Blueprint', path: '/assets/patterns/blueprint.png' },
  { id: 'bricks', name: 'Bricks', path: '/assets/patterns/bricks.png' },
  { id: 'checkerboard', name: 'Checkerboard', path: '/assets/patterns/checkerboard.png' },
  { id: 'circuit', name: 'Circuit', path: '/assets/patterns/circuit.png' },
  { id: 'diagonal', name: 'Diagonal', path: '/assets/patterns/diagonal.png' },
  { id: 'gray-dither', name: 'Gray Dither', path: '/assets/patterns/gray-dither.png' },
  { id: 'maze', name: 'Maze', path: '/assets/patterns/maze.png' },
  { id: 'polka-dots', name: 'Polka Dots', path: '/assets/patterns/polka-dots.png' },
  { id: 'stripes-vertical', name: 'Stripes', path: '/assets/patterns/stripes-vertical.png' },
  { id: 'waves', name: 'Waves', path: '/assets/patterns/waves.png' }
]

const colors = [
  { name: 'Classic Blue', value: '#000080' },
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Cyan', value: '#00FFFF' },
  { name: 'Magenta', value: '#FF00FF' },
  { name: 'Yellow', value: '#FFFF00' }
]

function selectPattern(patternId: string) {
  updateSetting('desktopPattern', patternId)
}

function selectColor(color: string) {
  updateSetting('highlightColor', color)
}

function updateFontSize(size: 'small' | 'standard' | 'large') {
  updateSetting('fontSize', size)
}

function toggleMenuBlinking() {
  updateSetting('menuBlinking', !settings.value.menuBlinking)
}
</script>

<template>
  <div class="general-settings">
    <div class="general-settings__section">
      <h3 class="general-settings__title">Desktop Pattern</h3>
      <div class="general-settings__patterns-grid">
        <div
          v-for="pattern in patterns"
          :key="pattern.id"
          class="general-settings__pattern"
          :class="{ 'general-settings__pattern--active': settings.desktopPattern === pattern.id }"
          :title="pattern.name"
          @click="selectPattern(pattern.id)"
        >
          <div
            class="general-settings__pattern-preview"
            :style="{
              backgroundImage: pattern.path ? `url(${pattern.path})` : 'none',
              backgroundColor: pattern.id === 'default' ? '#999999' : 'transparent'
            }"
          ></div>
        </div>
      </div>
    </div>

    <div class="general-settings__section">
      <h3 class="general-settings__title">Highlight Color</h3>
      <div class="general-settings__colors-grid">
        <div
          v-for="color in colors"
          :key="color.value"
          class="general-settings__color"
          :class="{ 'general-settings__color--active': settings.highlightColor === color.value }"
          :style="{ backgroundColor: color.value }"
          :title="color.name"
          @click="selectColor(color.value)"
        ></div>
      </div>
    </div>

    <div class="general-settings__section">
      <h3 class="general-settings__title">System Font Size</h3>
      <div class="general-settings__font-sizes">
        <label class="mac-radio">
          <input
            type="radio"
            name="fontSize"
            class="sr-only"
            :checked="settings.fontSize === 'small'"
            @change="updateFontSize('small')"
          />
          <div
            class="mac-radio__circle"
            :class="{ 'mac-radio__circle--selected': settings.fontSize === 'small' }"
          ></div>
          <span>Small (9pt)</span>
        </label>
        <label class="mac-radio">
          <input
            type="radio"
            name="fontSize"
            class="sr-only"
            :checked="settings.fontSize === 'standard'"
            @change="updateFontSize('standard')"
          />
          <div
            class="mac-radio__circle"
            :class="{ 'mac-radio__circle--selected': settings.fontSize === 'standard' }"
          ></div>
          <span>Standard (12pt)</span>
        </label>
        <label class="mac-radio">
          <input
            type="radio"
            name="fontSize"
            class="sr-only"
            :checked="settings.fontSize === 'large'"
            @change="updateFontSize('large')"
          />
          <div
            class="mac-radio__circle"
            :class="{ 'mac-radio__circle--selected': settings.fontSize === 'large' }"
          ></div>
          <span>Large (14pt)</span>
        </label>
      </div>
    </div>

    <div class="general-settings__section">
      <h3 class="general-settings__title">Menu Blinking</h3>
      <div class="general-settings__blinking">
        <label class="mac-checkbox">
          <input
            type="checkbox"
            class="sr-only"
            :checked="settings.menuBlinking"
            @change="toggleMenuBlinking"
          />
          <div
            class="mac-checkbox__box"
            :class="{ 'mac-checkbox__box--checked': settings.menuBlinking }"
          ></div>
          <span>Blink menu items when selected</span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.general-settings {
  padding: var(--spacing-md);
  background-color: var(--color-gray-light);
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  overflow-y: auto;
}

.general-settings__section {
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  padding: var(--spacing-md);
  box-shadow: 1px 1px 0 var(--color-white) inset;
}

.general-settings__title {
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-gray-light);
  padding-bottom: var(--spacing-xs);
}

.general-settings__patterns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
  gap: var(--spacing-sm);
}

.general-settings__pattern {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-black);
  cursor: pointer;
  padding: 1px;
}

.general-settings__pattern--active {
  outline: 2px solid var(--color-highlight);
}

.general-settings__pattern-preview {
  width: 100%;
  height: 100%;
  background-repeat: repeat;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.general-settings__colors-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.general-settings__color {
  width: 24px;
  height: 24px;
  border: 1px solid var(--color-black);
  cursor: pointer;
}

.general-settings__color--active {
  outline: 2px solid var(--color-highlight);
}

.general-settings__font-sizes,
.general-settings__blinking {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.mac-radio,
.mac-checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  padding: 2px;
}

.mac-radio:focus-within,
.mac-checkbox:focus-within {
  outline: 1px solid var(--color-highlight);
}
</style>
