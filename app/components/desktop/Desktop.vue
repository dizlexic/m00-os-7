<script setup lang="ts">
/**
 * Desktop Component
 *
 * Main desktop environment component that displays the background,
 * icons, windows, and handles desktop-level interactions.
 */

import { onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useDesktop } from '~/composables/useDesktop'
import { useWindowManager } from '~/composables/useWindowManager'
import { useSharedDesktop } from '~/composables/useSharedDesktop'
import DesktopIcon from './DesktopIcon.vue'
import Trash from './Trash.vue'
import Window from '~/components/window/Window.vue'
import Finder from '~/components/apps/Finder.vue'
import SimpleText from '~/components/apps/SimpleText.vue'
import Calculator from '~/components/apps/Calculator.vue'
import NotePad from '~/components/apps/NotePad.vue'
import Scrapbook from '~/components/apps/Scrapbook.vue'
import Puzzle from '~/components/apps/Puzzle.vue'
import Paint from '~/components/apps/Paint.vue'
import GetInfo from '~/components/apps/GetInfo.vue'
import ControlPanels from '~/components/apps/ControlPanels.vue'
import GeneralSettings from '~/components/apps/GeneralSettings.vue'
import SoundSettings from '~/components/apps/SoundSettings.vue'
import DateTimeSettings from '~/components/apps/DateTimeSettings.vue'
import NetworkSettings from '~/components/apps/NetworkSettings.vue'
import MouseSettings from '~/components/apps/MouseSettings.vue'
import UsersSettings from '~/components/apps/UsersSettings.vue'
import MonitorsSettings from '~/components/apps/MonitorsSettings.vue'
import LabelsSettings from '~/components/apps/LabelsSettings.vue'
import AboutMac from '~/components/apps/AboutMac.vue'
import ArticleViewer from '~/components/apps/ArticleViewer.vue'
import ImageViewer from '~/components/apps/ImageViewer.vue'
import Eliza from '~/components/apps/Eliza.vue'
import Chooser from '~/components/apps/Chooser.vue'
import Brickle from '~/components/games/Brickle.vue'
import Minesweeper from '~/components/games/Minesweeper.vue'
import Solitaire from '~/components/games/Solitaire.vue'
import Tetris from '~/components/games/Tetris.vue'
import Messenger from '~/components/apps/Messenger.vue'
import RemoteCursor from '~/components/stc/RemoteCursor.vue'
import { useFileSystem } from '~/composables/useFileSystem'
import { useClipboard } from '~/composables/useClipboard'
import { useLabels } from '~/composables/useLabels'
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
  cleanUpDesktop,
  addIcon,
  updateIcon
} = useDesktop()

const {
  windowList,
  activeWindow,
  openWindow,
  restoreWindows
} = useWindowManager()

const { getRoot, getNodeByPath, createFolder, moveToTrash, copyNode, createAlias, getUniqueName } = useFileSystem()
const { clipboard, copy, cut, paste } = useClipboard()
const { getLabelMenuItems } = useLabels()

// STC (Share the Computer) mode
const {
  settings: networkSettings,
  isInSession,
  remoteUsersList,
  sendCursorPosition
} = useSharedDesktop()

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

  // Broadcast cursor position when in STC session
  if (isInSession.value) {
    sendCursorPosition({ x: event.clientX, y: event.clientY })
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
        const root = getRoot()
        const folderName = getUniqueName('untitled folder', root.id)
        const newFolder = createFolder(folderName, root.id)

        const newIcon = addIcon({
          name: newFolder.name,
          type: 'folder',
          icon: '/assets/icons/system/folder.png',
          position: { x: event.clientX - 16, y: event.clientY - 16 },
          path: `Macintosh HD/${newFolder.name}`
        })

        nextTick(() => {
          updateIcon(newIcon.id, { isRenaming: true })
        })
      }
    },
    {
      id: 'paste',
      label: 'Paste',
      disabled: !clipboard.value,
      action: () => {
        paste(getRoot().id)
      }
    },
    { id: 'sep1', label: '', isSeparator: true },
    {
      id: 'clean-up',
      label: 'Clean Up Desktop',
      submenu: [
        { id: 'clean-by-kind', label: 'by Kind', action: () => cleanUpDesktop('kind') },
        { id: 'clean-by-name', label: 'by Name', action: () => cleanUpDesktop('name') }
      ]
    },
    {
      id: 'desktop-patterns',
      label: 'Desktop Patterns...',
      action: () => {
        openWindow({
          type: 'general-settings',
          title: 'General Controls',
          icon: '/assets/icons/system/preferences.png',
          size: { width: 400, height: 350 }
        })
      }
    }
  ]

  showContextMenu({ x: event.clientX, y: event.clientY }, items)
}

function handleIconContextMenu(event: MouseEvent, icon: any): void {
  const items: MenuItem[] = [
    {
      id: 'cut',
      label: 'Cut',
      disabled: icon.isSystem,
      action: () => {
        cut([icon.id])
      }
    },
    {
      id: 'copy',
      label: 'Copy',
      action: () => {
        copy([icon.id])
      }
    },
    { id: 'sep1', label: '', isSeparator: true },
    {
      id: 'duplicate',
      label: 'Duplicate',
      disabled: icon.isSystem || icon.type === 'hard-drive' || icon.type === 'trash',
      action: () => {
        if (icon.path) {
          const node = getNodeByPath(icon.path)
          if (node && node.parentId) {
            copyNode(node.id, node.parentId)
          }
        }
      }
    },
    {
      id: 'make-alias',
      label: 'Make Alias',
      disabled: icon.isSystem || icon.type === 'trash',
      action: () => {
        if (icon.path) {
          const node = getNodeByPath(icon.path)
          if (node && node.parentId) {
            createAlias(node.id, node.parentId)
          }
        }
      }
    },
    {
      id: 'label',
      label: 'Label',
      submenu: getLabelMenuItems(undefined, icon.id)
    },
    { id: 'sep2', label: '', isSeparator: true },
    {
      id: 'get-info',
      label: 'Get Info',
      action: () => {
        openWindow({
          type: 'get-info',
          title: `Info: ${icon.name}`,
          icon: icon.icon,
          data: { nodeId: icon.id },
          size: { width: 300, height: 400 },
          resizable: false,
          maximizable: false
        })
      }
    },
    {
      id: 'move-to-trash',
      label: 'Move to Trash',
      disabled: icon.isSystem || icon.type === 'trash' || icon.type === 'hard-drive',
      action: () => {
        moveToTrash(icon.id)
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
    return
  }

  // Handle arrow keys for icon navigation
  const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
  if (arrowKeys.includes(event.key)) {
    handleArrowKey(event)
  }
}

function handleArrowKey(event: KeyboardEvent): void {
  if (icons.value.length === 0) return

  // If nothing selected, select first icon
  if (!activeWindow.value && selectedIds.value.length === 0) {
    const firstIcon = icons.value[0]
    selectIcon(firstIcon.id)
    focusSelectedIcon()
    return
  }

  // Only navigate desktop icons if no window is active or if we are specifically focusing desktop
  if (activeWindow.value) return

  const currentId = selectedIds.value[selectedIds.value.length - 1]
  const currentIcon = icons.value.find(i => i.id === currentId)
  if (!currentIcon) return

  let bestIcon: any = null
  let minDistance = Infinity

  icons.value.forEach(icon => {
    if (icon.id === currentId) return

    const dx = icon.position.x - currentIcon.position.x
    const dy = icon.position.y - currentIcon.position.y

    let isMatch = false
    // Proximity search in the direction of the arrow
    if (event.key === 'ArrowUp' && dy < 0 && Math.abs(dx) < 100) isMatch = true
    if (event.key === 'ArrowDown' && dy > 0 && Math.abs(dx) < 100) isMatch = true
    if (event.key === 'ArrowLeft' && dx < 0 && Math.abs(dy) < 100) isMatch = true
    if (event.key === 'ArrowRight' && dx > 0 && Math.abs(dy) < 100) isMatch = true

    if (isMatch) {
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < minDistance) {
        minDistance = distance
        bestIcon = icon
      }
    }
  })

  if (bestIcon) {
    selectIcon(bestIcon.id)
    focusSelectedIcon()
  }
}

function focusSelectedIcon() {
  nextTick(() => {
    const element = document.querySelector('.desktop-icon--selected') as HTMLElement
    element?.focus()
  })
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
      <DesktopIcon v-else :icon="icon" @contextmenu="handleIconContextMenu($event, icon)" />
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
        :window-id="win.id"
        :is-active="win.isActive"
      />

      <Calculator
        v-else-if="win.type === 'calculator'"
      />

      <NotePad
        v-else-if="win.type === 'notepad'"
      />

      <Scrapbook
        v-else-if="win.type === 'scrapbook'"
      />

      <Puzzle
        v-else-if="win.type === 'puzzle'"
        :window-id="win.id"
      />

      <Paint
        v-else-if="win.type === 'paint'"
        :file-id="(win.data as any)?.fileId"
        :window-id="win.id"
        :is-active="win.isActive"
      />

      <GetInfo
        v-else-if="win.type === 'get-info'"
        :node-id="(win.data as any)?.nodeId"
      />

      <ControlPanels
        v-else-if="win.type === 'control-panels'"
      />

      <GeneralSettings
        v-else-if="win.type === 'general-settings' || win.type === 'desktop-patterns-settings'"
      />

      <SoundSettings
        v-else-if="win.type === 'sound-settings'"
      />

      <DateTimeSettings
        v-else-if="win.type === 'date-time-settings'"
      />

      <NetworkSettings
        v-else-if="win.type === 'network-settings'"
      />

      <MouseSettings
        v-else-if="win.type === 'mouse-settings'"
      />

      <UsersSettings
        v-else-if="win.type === 'users-settings'"
      />

      <MonitorsSettings
        v-else-if="win.type === 'monitors-settings'"
      />

      <LabelsSettings
        v-else-if="win.type === 'labels-settings'"
      />

      <AboutMac
        v-else-if="win.type === 'about'"
      />

      <ArticleViewer
        v-else-if="win.type === 'article' || win.type === 'help'"
        :path="win.data?.path"
      />

      <ImageViewer
        v-else-if="win.type === 'imageviewer'"
        :file-id="(win.data as any)?.fileId"
        :is-active="win.isActive"
      />

      <Eliza
        v-else-if="win.type === 'eliza'"
      />

      <Chooser
        v-else-if="win.type === 'chooser'"
      />

      <Brickle
        v-else-if="win.type === 'brickle'"
        :window-id="win.id"
        :is-active="win.isActive"
      />

      <Minesweeper
        v-else-if="win.type === 'minesweeper'"
        :window-id="win.id"
        :is-active="win.isActive"
      />

      <Solitaire
        v-else-if="win.type === 'solitaire'"
        :window-id="win.id"
        :is-active="win.isActive"
      />

      <Tetris
        v-else-if="win.type === 'tetris'"
        :window-id="win.id"
        :is-active="win.isActive"
      />

      <Messenger
        v-else-if="win.type === 'messenger'"
        :window-id="win.id"
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

    <!-- Remote Cursors (Network Mode) -->
    <template v-if="isInSession && networkSettings.showRemoteCursors">
      <RemoteCursor
        v-for="user in remoteUsersList"
        :key="user.id"
        :user="user"
        :show-label="networkSettings.showCursorLabels"
      />
    </template>
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
  background-color: var(--color-highlight);
  opacity: 0.2;
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
