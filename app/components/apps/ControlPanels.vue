<script setup lang="ts">
/**
 * ControlPanels Component
 *
 * Displays a list of available control panels for system settings.
 * Styled to look like a Finder window in icon view.
 */
import { useWindowManager } from '~/composables/useWindowManager'

const { openWindow } = useWindowManager()

interface ControlPanelItem {
  id: string
  name: string
  icon: string
  type: string
}

const controlPanels: ControlPanelItem[] = [
  {
    id: 'general',
    name: 'General Controls',
    icon: '/assets/icons/system/preferences.png',
    type: 'general-settings'
  },
  {
    id: 'date-time',
    name: 'Date & Time',
    icon: '/assets/icons/system/preferences.png',
    type: 'date-time-settings'
  },
  {
    id: 'sound',
    name: 'Sound',
    icon: '/assets/icons/system/preferences.png',
    type: 'sound-settings'
  },
  {
    id: 'monitors',
    name: 'Monitors',
    icon: '/assets/icons/system/preferences.png',
    type: 'monitors-settings'
  },
  {
    id: 'mouse',
    name: 'Mouse',
    icon: '/assets/icons/system/preferences.png',
    type: 'mouse-settings'
  }
]

function openControlPanel(panel: ControlPanelItem) {
  openWindow({
    type: panel.type,
    title: panel.name,
    icon: panel.icon,
    width: 400,
    height: 300,
    resizable: false,
    maximizable: false
  })
}
</script>

<template>
  <div class="control-panels">
    <div
      v-for="panel in controlPanels"
      :key="panel.id"
      class="control-panels__item"
      @dblclick="openControlPanel(panel)"
    >
      <div class="control-panels__item-icon">
        <img :src="panel.icon" :alt="panel.name" draggable="false" />
      </div>
      <div class="control-panels__item-label">
        {{ panel.name }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.control-panels {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  grid-gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-white);
  height: 100%;
  overflow-y: auto;
  user-select: none;
}

.control-panels__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: default;
  padding: var(--spacing-xs);
  border: 1px solid transparent;
}

.control-panels__item:hover {
  background-color: var(--color-gray-light);
}

.control-panels__item-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-xs);
}

.control-panels__item-icon img {
  max-width: 32px;
  max-height: 32px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.control-panels__item-label {
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  text-align: center;
  word-wrap: break-word;
}
</style>
