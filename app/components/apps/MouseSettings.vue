<script setup lang="ts">
/**
 * MouseSettings Component
 *
 * Control panel for mouse and cursor settings.
 * Allows users to customize cursor appearance and behavior.
 */
import { useSharedDesktop } from '~/composables/useSharedDesktop'
import { CURSOR_COLORS, CURSOR_COLOR_NAMES, CURSOR_STYLES } from '~/types/stc'
import type { CursorStyle, CursorColor } from '~/types/stc'

const {
  settings,
  updateSettings
} = useSharedDesktop()

/** Handle cursor style change */
function handleCursorStyleChange(style: CursorStyle) {
  updateSettings({
    cursor: { ...settings.value.cursor, style }
  })
}

/** Handle cursor color change */
function handleCursorColorChange(color: CursorColor | string) {
  updateSettings({
    cursor: { ...settings.value.cursor, color }
  })
}

/** Handle show labels toggle */
function handleToggleLabels() {
  updateSettings({ showCursorLabels: !settings.value.showCursorLabels })
}

/** Handle show remote cursors toggle */
function handleToggleRemoteCursors() {
  updateSettings({ showRemoteCursors: !settings.value.showRemoteCursors })
}

/** Get cursor style display name */
function getCursorStyleName(style: CursorStyle): string {
  const names: Record<CursorStyle, string> = {
    arrow: 'Arrow',
    hand: 'Hand',
    crosshair: 'Crosshair',
    pointer: 'Pointer'
  }
  return names[style]
}
</script>

<template>
  <div class="mouse-settings">
    <!-- Header -->
    <div class="mouse-settings__header">
      <h3 class="mouse-settings__title">Mouse Settings</h3>
      <p class="mouse-settings__description">
        Customize your cursor and mouse interaction settings.
      </p>
    </div>

    <!-- Cursor Settings Section -->
    <div class="mouse-settings__section">
      <h4 class="mouse-settings__section-title">Cursor Appearance</h4>

      <!-- Cursor Style -->
      <div class="mouse-settings__row">
        <label class="mouse-settings__label">Cursor Style</label>
        <div class="mouse-settings__cursor-styles">
          <button
            v-for="style in CURSOR_STYLES"
            :key="style"
            class="mouse-settings__cursor-style-btn"
            :class="{ 'mouse-settings__cursor-style-btn--active': settings.cursor.style === style }"
            :title="getCursorStyleName(style)"
            @click="handleCursorStyleChange(style)"
          >
            {{ getCursorStyleName(style) }}
          </button>
        </div>
      </div>

      <!-- Cursor Color -->
      <div class="mouse-settings__row">
        <label class="mouse-settings__label">Cursor Color</label>
        <div class="mouse-settings__cursor-colors">
          <button
            v-for="color in CURSOR_COLORS"
            :key="color"
            class="mouse-settings__color-btn"
            :class="{ 'mouse-settings__color-btn--active': settings.cursor.color === color }"
            :style="{ backgroundColor: color }"
            :title="CURSOR_COLOR_NAMES[color]"
            @click="handleCursorColorChange(color)"
          ></button>
        </div>
      </div>
    </div>

    <!-- Display Settings Section -->
    <div class="mouse-settings__section">
      <h4 class="mouse-settings__section-title">Remote Interaction</h4>

      <div class="mouse-settings__row">
        <label class="mouse-settings__checkbox-label">
          <input
            type="checkbox"
            :checked="settings.showRemoteCursors"
            @change="handleToggleRemoteCursors"
          />
          Show remote cursors
        </label>
      </div>

      <div class="mouse-settings__row">
        <label class="mouse-settings__checkbox-label">
          <input
            type="checkbox"
            :checked="settings.showCursorLabels"
            @change="handleToggleLabels"
          />
          Show username labels on cursors
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mouse-settings {
  padding: var(--spacing-md);
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-white);
}

.mouse-settings__header {
  margin-bottom: var(--spacing-lg);
}

.mouse-settings__title {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-lg);
  font-weight: bold;
}

.mouse-settings__description {
  margin: 0;
  color: var(--color-gray-dark);
  font-size: var(--font-size-sm);
}

.mouse-settings__section {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-gray-light);
}

.mouse-settings__section:last-child {
  border-bottom: none;
}

.mouse-settings__section-title {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-md);
  font-weight: bold;
}

.mouse-settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.mouse-settings__label {
  font-weight: bold;
  min-width: 120px;
}

.mouse-settings__cursor-styles {
  display: flex;
  gap: var(--spacing-xs);
}

.mouse-settings__cursor-style-btn {
  padding: 4px 8px;
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  background: var(--color-white);
  border: 1px solid var(--color-black);
  cursor: pointer;
}

.mouse-settings__cursor-style-btn:hover {
  background: var(--color-gray-light);
}

.mouse-settings__cursor-style-btn--active {
  background: var(--color-highlight);
  color: var(--color-highlight-text);
}

.mouse-settings__cursor-colors {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.mouse-settings__color-btn {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-white);
  outline: 1px solid var(--color-black);
  cursor: pointer;
  padding: 0;
}

.mouse-settings__color-btn:hover {
  transform: scale(1.1);
}

.mouse-settings__color-btn--active {
  border-color: var(--color-black);
  outline-width: 2px;
}

.mouse-settings__checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.mouse-settings__checkbox-label input {
  margin: 0;
}
</style>
