<script setup lang="ts">
/**
 * Desktop Component
 *
 * Main desktop environment component that displays the background,
 * icons, windows, and handles desktop-level interactions.
 */

import { onMounted, onUnmounted, computed } from 'vue'
import { useDesktop } from '~/composables/useDesktop'
import { useWindowManager } from '~/composables/useWindowManager'
import DesktopIcon from './DesktopIcon.vue'
import Trash from './Trash.vue'
import Window from '~/components/window/Window.vue'
import Finder from '~/components/apps/Finder.vue'
import SimpleText from '~/components/apps/SimpleText.vue'
import Calculator from '~/components/apps/Calculator.vue'
import GetInfo from '~/components/apps/GetInfo.vue'
import ControlPanels from '~/components/apps/ControlPanels.vue'
import GeneralSettings from '~/components/apps/GeneralSettings.vue'
import SoundSettings from '~/components/apps/SoundSettings.vue'
import DateTimeSettings from '~/components/apps/DateTimeSettings.vue'
import { useFileSystem } from '~/composables/useFileSystem'
import ContextMenu from './ContextMenu.vue'
import type { MenuItem } from '~/types/menu'

const {
  icons,
  backgroundPattern,
  marquee,
  contextMenu,
  deselectAll,
  startMarquee,
  updateMarquee,
  endMarquee,
  showContextMenu,
  hideContextMenu,
  initializeDesktop,
  cleanUpDesktop
} = useDesktop()

const {
  windowList,
  openWindow
} = useWindowManager()

const { getRoot, getNodeByPath, createFolder } = useFileSystem()

/**
 * Get folder ID for Finder window
 */
function getFolderId(win: any): string {
  if (win.data?.folderId) return win.data.folderId

  if (win.data?.path) {
    const node = getNodeByPath(win.data.path)
    if (node && node.type === 'folder') return node.id
  }

  return getRoot().id
}

// Compute background style
const backgroundStyle = computed(() => {
  const pattern = backgroundPattern.value
  if (pattern.isSolid) {
    return { backgroundColor: pattern.pattern }
  }
  return { background: pattern.pattern }
})

// Compute marquee style
const marqueeStyle = computed(() => {
  if (!marquee.value.isActive) return {}

  const minX = Math.min(marquee.value.start.x, marquee.value.current.x)
  const minY = Math.min(marquee.value.start.y, marquee.value.current.y)
  const width = Math.abs(marquee.value.current.x - marquee.value.start.x)
  const height = Math.abs(marquee.value.current.y - marquee.value.start.y)

  return {
    left: `${minX}px`,
    top: `${minY}px`,
    width: `${width}px`,
    height: `${height}px`
  }
})

// Event handlers
function handleMouseDown(event: MouseEvent): void {
  // Only handle left click on desktop background
  if (event.button !== 0) return
  if ((event.target as HTMLElement).closest('.desktop-icon')) return

  // Deselect all icons when clicking on desktop
  deselectAll()
  hideContextMenu()

  // Start marquee selection
  startMarquee({ x: event.clientX, y: event.clientY })
}

function handleMouseMove(event: MouseEvent): void {
  if (marquee.value.isActive) {
    updateMarquee({ x: event.clientX, y: event.clientY })
  }
}

function handleMouseUp(): void {
  endMarquee()
}

function handleContextMenu(event: MouseEvent): void {
  event.preventDefault()

  // If clicking on an icon, we might want a different menu later
  if ((event.target as HTMLElement).closest('.desktop-icon')) return

  const items: MenuItem[] = [
    {
      id: 'new-folder',
      label: 'New Folder',
      action: () => {
        createFolder('untitled folder', getRoot().id)
      }
    },
    {
      id: 'clean-up',
      label: 'Clean Up Desktop',
      action: () => {
        cleanUpDesktop()
      }
    },
    { id: 'sep1', label: '', isSeparator: true },
    {
      id: 'desktop-patterns',
      label: 'Desktop Patterns...',
      action: () => {
        openWindow({
          type: 'general-settings',
          title: 'General Controls',
          icon: '/assets/icons/system/preferences.png',
          width: 400,
          height: 300
        })
      }
    }
  ]

  showContextMenu({ x: event.clientX, y: event.clientY }, items)
}

function handleMenuItemClick(item: MenuItem): void {
  if (item.action) {
    item.action()
  }
  hideContextMenu()
}

function handleKeyDown(event: KeyboardEvent): void {
  // Handle keyboard shortcuts
  if (event.key === 'Escape') {
    deselectAll()
    hideContextMenu()
  }
}

// Lifecycle
onMounted(() => {
  initializeDesktop()
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div
    class="desktop"
    :style="backgroundStyle"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @contextmenu="handleContextMenu"
  >
    <!-- Desktop Icons -->
    <template v-for="icon in icons" :key="icon.id">
      <Trash v-if="icon.type === 'trash'" :icon="icon" />
      <DesktopIcon v-else :icon="icon" />
    </template>

    <Window
      v-for="win in windowList"
      :key="win.id"
      :window="win"
    >
      <Finder
        v-if="win.type === 'finder'"
        :folder-id="getFolderId(win)"
        :window-id="win.id"
      />

      <SimpleText
        v-else-if="win.type === 'simpletext'"
        :file-id="(win.data as any)?.fileId"
        :is-active="win.isActive"
      />

      <Calculator
        v-else-if="win.type === 'calculator'"
      />

      <GetInfo
        v-else-if="win.type === 'get-info'"
        :node-id="(win.data as any)?.nodeId"
      />

      <ControlPanels
        v-else-if="win.type === 'control-panels'"
      />

      <GeneralSettings
        v-else-if="win.type === 'general-settings'"
      />

      <SoundSettings
        v-else-if="win.type === 'sound-settings'"
      />

      <DateTimeSettings
        v-else-if="win.type === 'date-time-settings'"
      />

      <!-- Window content will be rendered based on window type -->
      <div v-else class="window-placeholder">
        <p>{{ win.title }}</p>
        <p>Type: {{ win.type }}</p>
      </div>
    </Window>

    <!-- Marquee Selection -->
    <div
      v-if="marquee.isActive"
      class="desktop__marquee"
      :style="marqueeStyle"
    />

    <!-- Context Menu -->
    <ContextMenu
      v-if="contextMenu.isVisible"
      :items="contextMenu.items"
      :position="contextMenu.position"
      @item-click="handleMenuItemClick"
      @close="hideContextMenu"
    />
  </div>
</template>

<style scoped>
.desktop {
  position: fixed;
  top: var(--menu-bar-height, 20px);
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  user-select: none;
}

.desktop__marquee {
  position: absolute;
  border: 1px dashed var(--color-black);
  background-color: rgba(0, 0, 128, 0.1);
  pointer-events: none;
  z-index: var(--z-desktop-icons);
}

.window-placeholder {
  padding: var(--spacing-lg);
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  color: var(--color-black);
}

.window-placeholder p {
  margin: var(--spacing-sm) 0;
}
</style>
