<script setup lang="ts">
/**
 * MenuBar Component
 *
 * Mac OS 7 style menu bar with Apple menu, application menus, and clock.
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import Clock from '~/components/system/Clock.vue'
import SharingIndicator from '~/components/stc/SharingIndicator.vue'
import MenuDropdown from '~/components/desktop/MenuDropdown.vue'
import { useFileSystem } from '~/composables/useFileSystem'
import { useWindowManager } from '~/composables/useWindowManager'
import { useRecentItems } from '~/composables/useRecentItems'
import { useClipboard } from '~/composables/useClipboard'
import { useDesktop } from '~/composables/useDesktop'
import { useAlert } from '~/composables/useAlert'
import { useTrash } from '~/composables/useTrash'
import { useUser } from '~/composables/useUser'
import type { WindowType } from '~/types/window'
import type { RecentItem } from '~/types/recent'
import type { MenuItem, Menu } from '~/types/menu'

const { createFolder, getRoot, getNodeByPath, emptyTrash, getNode, moveToTrash, getTrash } = useFileSystem()
const { activeWindow, openWindow, updateWindow } = useWindowManager()
const { recentApps, recentDocs } = useRecentItems()
const { clipboard, copy, cut, paste } = useClipboard()
const { icons: desktopIcons } = useDesktop()
const { showAlert } = useAlert()
const { restoreItem, items: trashItems, emptyTrash: confirmEmptyTrash } = useTrash()
const { logout, currentUser } = useUser()

// Props
interface Props {
  appName?: string
}

const props = withDefaults(defineProps<Props>(), {
  appName: 'Finder'
})

// State
const activeMenuId = ref<string | null>(null)

// Menus configuration
const appleMenuItems = computed<MenuItem[]>(() => [
  { id: 'about', label: 'About This Macintosh', action: () => handleAbout() },
  { id: 'sep1', label: '', isSeparator: true },
  {
    id: 'calculator',
    label: 'Calculator',
    action: () => openWindow({
      type: 'calculator',
      title: 'Calculator',
      icon: '/assets/icons/apps/calculator.png',
      size: { width: 182, height: 281 },
      resizable: false,
      maximizable: false
    })
  },
  {
    id: 'notepad',
    label: 'Note Pad',
    action: () => openWindow({
      type: 'notepad',
      title: 'Note Pad',
      icon: '/assets/icons/apps/notepad.png',
      size: { width: 300, height: 400 },
      resizable: true,
      maximizable: false
    })
  },
  {
    id: 'scrapbook',
    label: 'Scrapbook',
    action: () => openWindow({
      type: 'scrapbook',
      title: 'Scrapbook',
      icon: '/assets/icons/apps/scrapbook.png',
      size: { width: 350, height: 400 },
      resizable: true,
      maximizable: false
    })
  },
  {
    id: 'puzzle',
    label: 'Puzzle',
    action: () => openWindow({
      type: 'puzzle',
      title: 'Puzzle',
      icon: '/assets/icons/apps/puzzle.png',
      size: { width: 200, height: 240 },
      resizable: false,
      maximizable: false
    })
  },
  {
    id: 'paint',
    label: 'Paint',
    action: () => openWindow({
      type: 'paint',
      title: 'Paint',
      icon: '/assets/icons/apps/paint.png',
      size: { width: 700, height: 500 }
    })
  },
  {
    id: 'eliza',
    label: 'Eliza',
    action: () => openWindow({
      type: 'eliza',
      title: 'Eliza',
      icon: '/assets/icons/apps/eliza.png',
      size: { width: 450, height: 380 }
    })
  },
  {
    id: 'share-computer',
    label: 'Share Computer',
    action: () => handleControlPanel('Share Computer', 'stc-settings')
  },
  {
    id: 'control-panels',
    label: 'Control Panels',
    action: () => handleControlPanels(),
    submenu: [
      { id: 'cp-share-computer', label: 'Share Computer', action: () => handleControlPanel('Share Computer', 'stc-settings') },
      { id: 'cp-apple-menu', label: 'Apple Menu Options', action: () => handleControlPanel('Apple Menu Options', 'apple-menu-settings') },
      { id: 'cp-color', label: 'Color', action: () => handleControlPanel('Color', 'color-settings') },
      { id: 'cp-date-time', label: 'Date & Time', action: () => handleControlPanel('Date & Time', 'date-time-settings') },
      { id: 'cp-desktop-patterns', label: 'Desktop Patterns', action: () => handleControlPanel('Desktop Patterns', 'desktop-patterns-settings') },
      { id: 'cp-extensions', label: 'Extensions Manager', action: () => handleControlPanel('Extensions Manager', 'extensions-settings') },
      { id: 'cp-memory', label: 'Memory', action: () => handleControlPanel('Memory', 'memory-settings') },
      { id: 'cp-monitors', label: 'Monitors', action: () => handleControlPanel('Monitors', 'monitors-settings') },
      { id: 'cp-mouse', label: 'Mouse', action: () => handleControlPanel('Mouse', 'mouse-settings') },
      { id: 'cp-sound', label: 'Sound', action: () => handleControlPanel('Sound', 'sound-settings') },
      { id: 'cp-startup-disk', label: 'Startup Disk', action: () => handleControlPanel('Startup Disk', 'startup-disk-settings') }
    ]
  },
  { id: 'sep2', label: '', isSeparator: true },
  {
    id: 'recent-apps',
    label: 'Recent Applications',
    disabled: recentApps.value.length === 0,
    submenu: recentApps.value.map(app => ({
      id: `recent-app-${app.id}`,
      label: app.name,
      action: () => handleOpenRecentApp(app)
    }))
  },
  {
    id: 'recent-docs',
    label: 'Recent Documents',
    disabled: recentDocs.value.length === 0,
    submenu: recentDocs.value.map(doc => ({
      id: `recent-doc-${doc.id}`,
      label: doc.name,
      action: () => handleOpenRecentDoc(doc)
    }))
  },
  { id: 'sep3', label: '', isSeparator: true },
  { id: 'shutdown', label: 'Shut Down', action: () => handleShutdown() }
])

const canCopy = computed(() => {
  if (activeWindow.value) {
    if (activeWindow.value.type === 'finder') {
      return !!(activeWindow.value.data as any)?.selectedItemId
    }
  } else {
    // Desktop selection
    return desktopIcons.value.some(icon => icon.isSelected && icon.type !== 'hard-drive' && icon.type !== 'trash')
  }
  return false
})

const canPaste = computed(() => {
  if (activeWindow.value) {
    if (activeWindow.value.type === 'finder') {
      return !!clipboard.value
    }
  } else {
    // Desktop paste
    return !!clipboard.value
  }
  return false
})

const canPutAway = computed(() => {
  if (activeWindow.value?.type === 'finder') {
    const data = activeWindow.value.data as any
    const selectedId = data?.selectedItemId
    if (selectedId) {
      const node = getNode(selectedId)
      const trash = getTrash()
      return node?.parentId === trash?.id
    }
  }
  return false
})

const fileMenuItems = computed<MenuItem[]>(() => [
  { id: 'new-folder', label: 'New Folder', shortcut: '⌘N', action: () => handleNewFolder() },
  { id: 'open', label: 'Open', shortcut: '⌘O' },
  { id: 'sep1', label: '', isSeparator: true },
  { id: 'close', label: 'Close Window', shortcut: '⌘W' },
  { id: 'sep2', label: '', isSeparator: true },
  { id: 'get-info', label: 'Get Info', shortcut: '⌘I', action: () => handleGetInfo() },
  { id: 'sep3', label: '', isSeparator: true },
  { id: 'duplicate', label: 'Duplicate', shortcut: '⌘D', disabled: true },
  { id: 'make-alias', label: 'Make Alias', shortcut: '⌘M', disabled: true },
  { id: 'put-away', label: 'Put Away', shortcut: '⌘Y', disabled: !canPutAway.value, action: () => handlePutAway() },
  { id: 'sep4', label: '', isSeparator: true },
  { id: 'find', label: 'Find...', shortcut: '⌘F' },
  { id: 'go-to-folder', label: 'Go to Folder...', shortcut: '⌘G', action: () => handleGoToFolder() },
  { id: 'sep5', label: '', isSeparator: true },
  { id: 'page-setup', label: 'Page Setup...', disabled: true },
  { id: 'print', label: 'Print...', shortcut: '⌘P', disabled: true }
])

const editMenuItems = computed<MenuItem[]>(() => [
  { id: 'undo', label: 'Undo', shortcut: '⌘Z', disabled: true },
  { id: 'sep1', label: '', isSeparator: true },
  { id: 'cut', label: 'Cut', shortcut: '⌘X', disabled: !canCopy.value, action: () => handleCut() },
  { id: 'copy', label: 'Copy', shortcut: '⌘C', disabled: !canCopy.value, action: () => handleCopy() },
  { id: 'paste', label: 'Paste', shortcut: '⌘V', disabled: !canPaste.value, action: () => handlePaste() },
  { id: 'clear', label: 'Clear', disabled: !canCopy.value, action: () => handleDelete() },
  { id: 'sep2', label: '', isSeparator: true },
  { id: 'select-all', label: 'Select All', shortcut: '⌘A' }
])

const viewMenuItems: MenuItem[] = [
  { id: 'by-icon', label: 'by Icon' },
  { id: 'by-name', label: 'by Name' },
  { id: 'by-date', label: 'by Date' },
  { id: 'by-size', label: 'by Size' },
  { id: 'by-kind', label: 'by Kind' },
  { id: 'sep1', label: '', isSeparator: true },
  { id: 'clean-up', label: 'Clean Up Desktop' }
]

const specialMenuItems = computed<MenuItem[]>(() => [
  { id: 'empty-trash', label: 'Empty Trash...', action: () => confirmEmptyTrash() },
  { id: 'sep1', label: '', isSeparator: true },
  { id: 'eject', label: 'Eject', disabled: true },
  { id: 'erase-disk', label: 'Erase Disk...', disabled: true },
  { id: 'sep2', label: '', isSeparator: true },
  { id: 'restart', label: 'Restart', action: () => handleRestart() },
  { id: 'shut-down', label: 'Shut Down', action: () => handleShutdown() },
  { id: 'logout', label: `Logout ${currentUser.value?.username}...`, action: () => handleLogout() }
])

const helpMenuItems: MenuItem[] = [
  { id: 'about-help', label: 'About Help...', disabled: true },
  { id: 'sep1', label: '', isSeparator: true },
  { id: 'show-balloons', label: 'Show Balloons', disabled: true },
  { id: 'sep2', label: '', isSeparator: true },
  { id: 'macos-help', label: 'Mac OS Help', action: () => handleHelp() }
]

const menus = computed<Menu[]>(() => {
  // If active window has custom menus, use them
  if (activeWindow.value && activeWindow.value.menus && activeWindow.value.menus.length > 0) {
    return activeWindow.value.menus
  }

  // Determine if we should show Finder menus
  const isFinder = !activeWindow.value || activeWindow.value.type === 'finder'

  if (isFinder) {
    return [
      { id: 'file', label: 'File', items: fileMenuItems.value },
      { id: 'edit', label: 'Edit', items: editMenuItems.value },
      { id: 'view', label: 'View', items: viewMenuItems },
      { id: 'special', label: 'Special', items: specialMenuItems.value },
      { id: 'help', label: 'Help', items: helpMenuItems }
    ]
  }

  // Standard menus for other apps that don't specify custom menus
  return [
    { id: 'file', label: 'File', items: fileMenuItems.value },
    { id: 'edit', label: 'Edit', items: editMenuItems.value },
    { id: 'help', label: 'Help', items: helpMenuItems }
  ]
})

// Menu handlers
function handleMenuClick(menuId: string): void {
  if (activeMenuId.value === menuId) {
    activeMenuId.value = null
  } else {
    activeMenuId.value = menuId
  }
}

function handleMenuHover(menuId: string): void {
  if (activeMenuId.value !== null) {
    activeMenuId.value = menuId
  }
}

function handleMenuItemClick(item: MenuItem): void {
  if (item.disabled || item.isSeparator) return

  if (item.action) {
    item.action()
  }

  activeMenuId.value = null
}

function handleClickOutside(): void {
  activeMenuId.value = null
}

function handleAbout(): void {
  openWindow({
    type: 'about',
    title: 'About This Macintosh',
    icon: '/assets/icons/system/finder.png',
    size: { width: 380, height: 220 },
    resizable: false,
    maximizable: false
  })
}

function handleHelp(): void {
  openWindow({
    type: 'help',
    title: 'Mac OS Help',
    icon: '/assets/icons/system/help.png',
    size: { width: 600, height: 500 },
    resizable: true,
    maximizable: true,
    data: {
      path: 'help/index'
    }
  })
}

function handleShutdown(): void {
  showAlert({
    message: 'Are you sure you want to shut down your computer?',
    title: 'Shut Down',
    type: 'caution',
    buttons: [
      { label: 'Cancel', value: 'cancel' },
      { label: 'Shut Down', value: 'shutdown', isDefault: true }
    ],
    onClose: (value) => {
      if (value === 'shutdown') {
        // Redirect to a black screen or just reload
        window.location.reload()
      }
    }
  })
}

function handleRestart(): void {
  showAlert({
    message: 'Are you sure you want to restart your computer?',
    title: 'Restart',
    type: 'caution',
    buttons: [
      { label: 'Cancel', value: 'cancel' },
      { label: 'Restart', value: 'restart', isDefault: true }
    ],
    onClose: (value) => {
      if (value === 'restart') {
        window.location.reload()
      }
    }
  })
}

function handleLogout(): void {
  showAlert({
    message: `Are you sure you want to log out ${currentUser.value?.username}?`,
    title: 'Logout',
    type: 'caution',
    buttons: [
      { label: 'Cancel', value: 'cancel' },
      { label: 'Logout', value: 'logout', isDefault: true }
    ],
    onClose: async (value) => {
      if (value === 'logout') {
        await logout()
      }
    }
  })
}

function handleGoToFolder(): void {
  if (activeWindow.value && activeWindow.value.type === 'finder') {
    showAlert({
      message: 'Enter the path of the folder to open:',
      title: 'Go to Folder',
      showInput: true,
      inputPlaceholder: 'Macintosh HD/Documents',
      buttons: [
        { label: 'Cancel', value: 'cancel' },
        { label: 'Go', value: 'go', isDefault: true }
      ],
      onClose: (value, path) => {
        if (value === 'go' && path) {
          const node = getNodeByPath(path)
          if (node && node.type === 'folder') {
            updateWindow(activeWindow.value!.id, {
              title: node.name,
              data: {
                ...activeWindow.value!.data,
                folderId: node.id
              }
            })
          } else {
            showAlert({
              message: `The folder "${path}" could not be found.`,
              type: 'stop'
            })
          }
        }
      }
    })
  }
}

function handleNewFolder(): void {
  let parentId = getRoot().id

  if (activeWindow.value && activeWindow.value.type === 'finder') {
    const data = activeWindow.value.data as any
    if (data?.folderId) {
      parentId = data.folderId
    } else if (data?.path) {
      const node = getNodeByPath(data.path)
      if (node && node.type === 'folder') {
        parentId = node.id
      }
    }
  }

  createFolder('untitled folder', parentId)
}

function handlePutAway(): void {
  if (activeWindow.value?.type === 'finder') {
    const data = activeWindow.value.data as any
    const selectedId = data?.selectedItemId
    if (selectedId) {
      restoreItem(selectedId)
    }
  }
}

function handleCopy() {
  if (activeWindow.value?.type === 'finder') {
    const selectedId = (activeWindow.value.data as any)?.selectedItemId
    if (selectedId) {
      copy([selectedId])
    }
  } else if (!activeWindow.value) {
    const selectedIds = desktopIcons.value
      .filter(icon => icon.isSelected && icon.type !== 'hard-drive' && icon.type !== 'trash')
      .map(icon => icon.id)
    if (selectedIds.length > 0) {
      copy(selectedIds)
    }
  }
}

function handleCut() {
  if (activeWindow.value?.type === 'finder') {
    const selectedId = (activeWindow.value.data as any)?.selectedItemId
    if (selectedId) {
      cut([selectedId])
    }
  } else if (!activeWindow.value) {
    const selectedIds = desktopIcons.value
      .filter(icon => icon.isSelected && icon.type !== 'hard-drive' && icon.type !== 'trash')
      .map(icon => icon.id)
    if (selectedIds.length > 0) {
      cut(selectedIds)
    }
  }
}

function handlePaste() {
  if (activeWindow.value?.type === 'finder') {
    const folderId = (activeWindow.value.data as any)?.folderId
    if (folderId) {
      paste(folderId)
    }
  } else if (!activeWindow.value) {
    paste(getRoot().id)
  }
}

function handleDelete() {
  if (activeWindow.value?.type === 'finder') {
    const selectedId = (activeWindow.value.data as any)?.selectedItemId
    if (selectedId) {
      moveToTrash(selectedId)
    }
  } else if (!activeWindow.value) {
    const selectedIds = desktopIcons.value
      .filter(icon => icon.isSelected && icon.type !== 'hard-drive' && icon.type !== 'trash')
      .map(icon => icon.id)
    selectedIds.forEach(id => moveToTrash(id))
  }
}

function handleControlPanels(): void {
  openWindow({
    type: 'control-panels',
    title: 'Control Panels',
    icon: '/assets/icons/system/preferences.png',
    size: { width: 400, height: 300 }
  })
}

function handleControlPanel(title: string, type: string): void {
  openWindow({
    type: type as WindowType,
    title,
    icon: '/assets/icons/system/preferences.png',
    size: { width: 400, height: 350 },
    resizable: false,
    maximizable: false
  })
}

function handleOpenRecentApp(app: RecentItem): void {
  openWindow({
    type: app.type as WindowType,
    title: app.name,
    icon: app.icon
  })
}

function handleOpenRecentDoc(doc: RecentItem): void {
  // Most docs open in SimpleText in this clone
  openWindow({
    type: 'simpletext',
    title: doc.name,
    icon: doc.icon,
    data: doc.data
  })
}

function handleGetInfo(): void {
  if (activeWindow.value) {
    let nodeId: string | null = null

    if (activeWindow.value.type === 'finder') {
      const data = activeWindow.value.data as any
      nodeId = data?.selectedItemId || data?.folderId
    } else if (activeWindow.value.type === 'simpletext') {
      nodeId = (activeWindow.value.data as any)?.fileId
    }

    if (nodeId) {
      const node = getNode(nodeId)
      if (node) {
        openWindow({
          type: 'get-info',
          title: `Info: ${node.name}`,
          icon: '/assets/icons/system/document.png',
          data: { nodeId: node.id },
          size: { width: 300, height: 400 },
          resizable: false,
          maximizable: false
        })
      }
    }
  }
}

function handleKeyDown(event: KeyboardEvent) {
  // Don't trigger shortcuts if an input is focused
  if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
    return
  }

  const isCmd = event.metaKey || event.ctrlKey

  if (isCmd) {
    switch (event.key.toLowerCase()) {
      case 'c':
        if (canCopy.value) {
          event.preventDefault()
          handleCopy()
        }
        break
      case 'x':
        if (canCopy.value) {
          event.preventDefault()
          handleCut()
        }
        break
      case 'v':
        if (canPaste.value) {
          event.preventDefault()
          handlePaste()
        }
        break
      case 'n':
        event.preventDefault()
        handleNewFolder()
        break
      case 'g':
        event.preventDefault()
        handleGoToFolder()
        break
      case 'i':
        event.preventDefault()
        handleGetInfo()
        break
      case 'y':
        if (canPutAway.value) {
          event.preventDefault()
          handlePutAway()
        }
        break
      case 'backspace':
        if (canCopy.value) {
          event.preventDefault()
          handleDelete()
        }
        break
    }
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="menu-bar" @click.stop>
    <!-- Apple Menu -->
    <div
      class="menu-bar__item menu-bar__item--apple"
      :class="{ 'menu-bar__item--active': activeMenuId === 'apple' }"
      @click="handleMenuClick('apple')"
      @mouseenter="handleMenuHover('apple')"
    >
      <span class="menu-bar__apple-logo">&#63743;</span>

      <!-- Apple Menu Dropdown -->
      <MenuDropdown
        v-if="activeMenuId === 'apple'"
        :items="appleMenuItems"
        @item-click="handleMenuItemClick"
      />
    </div>

    <!-- Application Name -->
    <div class="menu-bar__app-name">
      {{ appName }}
    </div>

    <!-- Application Menus -->
    <div
      v-for="menu in menus"
      :key="menu.id"
      class="menu-bar__item"
      :class="{ 'menu-bar__item--active': activeMenuId === menu.id }"
      @click="handleMenuClick(menu.id)"
      @mouseenter="handleMenuHover(menu.id)"
    >
      {{ menu.label }}

      <!-- Menu Dropdown -->
      <MenuDropdown
        v-if="activeMenuId === menu.id"
        :items="menu.items"
        @item-click="handleMenuItemClick"
      />
    </div>

    <!-- Spacer -->
    <div class="menu-bar__spacer" />

    <!-- Sharing Indicator -->
    <SharingIndicator />

    <!-- Clock -->
    <Clock />
  </div>
</template>

<style scoped>
.menu-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--menu-bar-height, 20px);
  display: flex;
  align-items: center;
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-black);
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  z-index: var(--z-menu-bar);
  user-select: none;
}

.menu-bar__item {
  position: relative;
  padding: 0 var(--spacing-md);
  height: 100%;
  display: flex;
  align-items: center;
  cursor: default;
}

.menu-bar__item:hover,
.menu-bar__item--active {
  background-color: var(--color-black);
  color: var(--color-white);
}

.menu-bar__item--apple {
  padding: 0 var(--spacing-sm);
}

.menu-bar__apple-logo {
  font-size: 16px;
  line-height: 1;
}

.menu-bar__app-name {
  padding: 0 var(--spacing-md);
  font-weight: bold;
  height: 100%;
  display: flex;
  align-items: center;
}

.menu-bar__spacer {
  flex: 1;
}
</style>
