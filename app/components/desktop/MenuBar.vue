<script setup lang="ts">
/**
 * MenuBar Component
 *
 * Mac OS 7 style menu bar with Apple menu, application menus, and clock.
 */

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
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
import { useLabels } from '~/composables/useLabels'
import type { WindowType } from '~/types/window'
import type { RecentItem } from '~/types/recent'
import type { MenuItem, Menu } from '~/types/menu'

const { createFolder, getRoot, getNodeByPath, emptyTrash, getNode, moveToTrash, getTrash, updateNode, copyNode, createAlias, getUniqueName } = useFileSystem()
const { windowList, activeWindow, openWindow, updateWindow, bringToFront, closeWindow } = useWindowManager()
const { recentApps, recentDocs } = useRecentItems()
const { clipboard, copy, cut, paste } = useClipboard()
const { icons: desktopIcons, cleanUpDesktop, updateIcon, addIcon } = useDesktop()
const { showAlert } = useAlert()
const { restoreItem, items: trashItems, emptyTrash: confirmEmptyTrash } = useTrash()
const { logout, currentUser } = useUser()
const { getLabelMenuItems } = useLabels()

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
  { id: 'sep0', label: '', isSeparator: true },
  {
    id: 'chooser',
    label: 'Chooser',
    icon: '/assets/icons/apps/chooser.png',
    action: () => openWindow({
      type: 'chooser',
      title: 'Chooser',
      icon: '/assets/icons/apps/chooser.png',
      size: { width: 450, height: 400 },
      resizable: true,
      maximizable: false
    })
  },
  { id: 'sep1', label: '', isSeparator: true },
  {
    id: 'applications',
    label: 'Applications',
    icon: '/assets/icons/system/application.png',
    submenu: [
      {
        id: 'calculator',
        label: 'Calculator',
        icon: '/assets/icons/apps/calculator.png',
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
        icon: '/assets/icons/apps/notepad.png',
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
        icon: '/assets/icons/apps/scrapbook.png',
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
        icon: '/assets/icons/apps/puzzle.png',
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
        id: 'brickle',
        label: 'Brickle',
        icon: '/assets/icons/apps/brickle.png',
        action: () => openWindow({
          type: 'brickle',
          title: 'Brickle',
          icon: '/assets/icons/apps/brickle.png',
          size: { width: 400, height: 450 },
          resizable: false,
          maximizable: false
        })
      },
      {
        id: 'minesweeper',
        label: 'Minesweeper',
        icon: '/assets/icons/apps/minesweeper.png',
        action: () => openWindow({
          type: 'minesweeper',
          title: 'Minesweeper',
          icon: '/assets/icons/apps/minesweeper.png',
          size: { width: 240, height: 320 },
          resizable: false,
          maximizable: false
        })
      },
      {
        id: 'solitaire',
        label: 'Solitaire',
        icon: '/assets/icons/apps/solitaire.png',
        action: () => openWindow({
          type: 'solitaire',
          title: 'Solitaire',
          icon: '/assets/icons/apps/solitaire.png',
          size: { width: 400, height: 450 },
          resizable: true,
          maximizable: true
        })
      },
      {
        id: 'tetris',
        label: 'Tetris',
        icon: '/assets/icons/apps/tetris.png',
        action: () => openWindow({
          type: 'tetris',
          title: 'Tetris',
          icon: '/assets/icons/apps/tetris.png',
          size: { width: 350, height: 500 },
          resizable: false,
          maximizable: false
        })
      },
      {
        id: 'messenger',
        label: 'Messenger',
        icon: '/assets/icons/apps/chat.png',
        action: () => openWindow({
          type: 'messenger',
          title: 'Messenger',
          icon: '/assets/icons/apps/chat.png',
          size: { width: 450, height: 400 },
          resizable: true,
          maximizable: true,
          collapsible: true
        })
      },
      {
        id: 'paint',
        label: 'Paint',
        icon: '/assets/icons/apps/paint.png',
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
        icon: '/assets/icons/apps/eliza.png',
        action: () => openWindow({
          type: 'eliza',
          title: 'Eliza',
          icon: '/assets/icons/apps/eliza.png',
          size: { width: 450, height: 380 }
        })
      }
    ]
  },
  {
    id: 'control-panels',
    label: 'Control Panels',
    icon: '/assets/icons/system/preferences.png',
    action: () => handleControlPanels(),
    submenu: [
      { id: 'cp-network', label: 'Network', icon: '/assets/icons/system/cp-network.png', action: () => handleControlPanel('Network', 'network-settings', '/assets/icons/system/cp-network.png') },
      { id: 'cp-apple-menu', label: 'Apple Menu Options', icon: '/assets/icons/system/cp-apple-menu.png', action: () => handleControlPanel('Apple Menu Options', 'apple-menu-settings', '/assets/icons/system/cp-apple-menu.png') },
      { id: 'cp-color', label: 'Color', icon: '/assets/icons/system/cp-color.png', action: () => handleControlPanel('Color', 'color-settings', '/assets/icons/system/cp-color.png') },
      { id: 'cp-date-time', label: 'Date & Time', icon: '/assets/icons/system/cp-date-time.png', action: () => handleControlPanel('Date & Time', 'date-time-settings', '/assets/icons/system/cp-date-time.png') },
      { id: 'cp-desktop-patterns', label: 'Desktop Patterns', icon: '/assets/icons/system/cp-desktop-patterns.png', action: () => handleControlPanel('Desktop Patterns', 'desktop-patterns-settings', '/assets/icons/system/cp-desktop-patterns.png') },
      { id: 'cp-extensions', label: 'Extensions Manager', icon: '/assets/icons/system/cp-extensions.png', action: () => handleControlPanel('Extensions Manager', 'extensions-settings', '/assets/icons/system/cp-extensions.png') },
      { id: 'cp-memory', label: 'Memory', icon: '/assets/icons/system/cp-memory.png', action: () => handleControlPanel('Memory', 'memory-settings', '/assets/icons/system/cp-memory.png') },
      { id: 'cp-monitors', label: 'Monitors', icon: '/assets/icons/system/cp-monitors.png', action: () => handleControlPanel('Monitors', 'monitors-settings', '/assets/icons/system/cp-monitors.png') },
      { id: 'cp-mouse', label: 'Mouse', icon: '/assets/icons/system/cp-mouse.png', action: () => handleControlPanel('Mouse', 'mouse-settings', '/assets/icons/system/cp-mouse.png') },
      { id: 'cp-sound', label: 'Sound', icon: '/assets/icons/system/cp-sound.png', action: () => handleControlPanel('Sound', 'sound-settings', '/assets/icons/system/cp-sound.png') },
      { id: 'cp-startup-disk', label: 'Startup Disk', icon: '/assets/icons/system/cp-startup-disk.png', action: () => handleControlPanel('Startup Disk', 'startup-disk-settings', '/assets/icons/system/cp-startup-disk.png') }
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
      icon: app.icon,
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
      icon: doc.icon,
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
  { id: 'duplicate', label: 'Duplicate', shortcut: '⌘D', action: () => handleDuplicate() },
  { id: 'make-alias', label: 'Make Alias', shortcut: '⌘M', action: () => handleMakeAlias() },
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

const viewMenuItems = computed<MenuItem[]>(() => {
  const isFinder = !activeWindow.value || activeWindow.value.type === 'finder'
  if (!isFinder) return []

  const currentViewMode = activeWindow.value?.data?.viewMode || 'icon'
  const isDesktop = !activeWindow.value

  return [
    {
      id: 'by-icon',
      label: 'by Icon',
      checked: currentViewMode === 'icon',
      action: () => setViewMode('icon')
    },
    {
      id: 'by-small-icon',
      label: 'by Small Icon',
      checked: currentViewMode === 'small-icon',
      action: () => setViewMode('small-icon')
    },
    {
      id: 'by-name',
      label: 'by Name',
      checked: currentViewMode === 'name',
      disabled: isDesktop,
      action: () => setViewMode('name')
    },
    {
      id: 'by-size',
      label: 'by Size',
      checked: currentViewMode === 'size',
      disabled: isDesktop,
      action: () => setViewMode('size')
    },
    {
      id: 'by-kind',
      label: 'by Kind',
      checked: currentViewMode === 'kind',
      disabled: isDesktop,
      action: () => setViewMode('kind')
    },
    {
      id: 'by-label',
      label: 'by Label',
      checked: currentViewMode === 'label',
      disabled: isDesktop,
      action: () => setViewMode('label')
    },
    {
      id: 'by-date',
      label: 'by Date',
      checked: currentViewMode === 'date',
      disabled: isDesktop,
      action: () => setViewMode('date')
    },
    { id: 'sep1', label: '', isSeparator: true },
    {
      id: 'clean-up',
      label: isDesktop ? 'Clean Up Desktop' : 'Clean Up Window',
      action: () => handleCleanUp()
    }
  ]
})

const labelMenuItems = computed<MenuItem[]>(() => {
  return getLabelMenuItems()
})

const windowMenuItems = computed<MenuItem[]>(() => {
  return windowList.value.map(win => ({
    id: `window-${win.id}`,
    label: win.title,
    checked: win.isActive,
    action: () => bringToFront(win.id)
  }))
})

function setViewMode(mode: string): void {
  if (activeWindow.value && activeWindow.value.type === 'finder') {
    const currentData = activeWindow.value.data || {}
    updateWindow(activeWindow.value.id, {
      data: {
        ...currentData,
        viewMode: mode
      }
    })
  } else if (!activeWindow.value) {
    // Desktop ViewMode changes could be implemented here if needed
  }
}

function handleCleanUp(): void {
  if (activeWindow.value && activeWindow.value.type === 'finder') {
    // Window-level cleanup
    // For now, this is just a no-op as sorting is automatic in list views
    // and manual in icon view.
  } else if (!activeWindow.value) {
    cleanUpDesktop()
  }
}

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

const appMenuItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [
    { id: 'about-app', label: `About ${props.appName}...`, action: () => handleAboutApp() },
    { id: 'sep0', label: '', isSeparator: true },
  ]

  // If active window has app-specific items, add them here
  if (activeWindow.value && activeWindow.value.appMenu) {
    items.push(...activeWindow.value.appMenu)
    items.push({ id: 'sep-app', label: '', isSeparator: true })
  }

  items.push({
    id: 'quit',
    label: 'Quit',
    shortcut: '⌘Q',
    action: () => {
      if (activeWindow.value) {
        closeWindow(activeWindow.value.id)
      }
    }
  })

  return items
})

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
      { id: 'view', label: 'View', items: viewMenuItems.value },
      { id: 'label', label: 'Label', items: labelMenuItems.value },
      { id: 'special', label: 'Special', items: specialMenuItems.value },
      { id: 'window', label: 'Window', items: windowMenuItems.value },
      { id: 'help', label: 'Help', items: helpMenuItems }
    ]
  }

  // Standard menus for other apps that don't specify custom menus
  return [
    { id: 'file', label: 'File', items: fileMenuItems.value },
    { id: 'edit', label: 'Edit', items: editMenuItems.value },
    { id: 'window', label: 'Window', items: windowMenuItems.value },
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

function handleAboutApp(): void {
  if (activeWindow.value) {
    // If it's Finder, show About This Macintosh
    if (activeWindow.value.type === 'finder') {
      handleAbout()
      return
    }

    // Try to open about window for specific app
    openWindow({
      type: 'about',
      title: `About ${props.appName}`,
      icon: activeWindow.value.icon || '/assets/icons/system/finder.png',
      size: { width: 380, height: 220 },
      resizable: false,
      maximizable: false,
      data: {
        appName: props.appName,
        appType: activeWindow.value.type
      }
    })
  } else {
    handleAbout()
  }
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
  const isDesktop = !activeWindow.value

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

  const folderName = getUniqueName('untitled folder', parentId)
  const newFolder = createFolder(folderName, parentId)

  // If desktop is active (no window), add icon to desktop
  if (isDesktop && parentId === getRoot().id) {
    const newIcon = addIcon({
      name: newFolder.name,
      type: 'folder',
      icon: '/assets/icons/system/folder.png',
      position: { x: 50, y: 50 },
      path: `Macintosh HD/${newFolder.name}`
    })

    nextTick(() => {
      updateIcon(newIcon.id, { isRenaming: true })
    })
  }
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

function handleDuplicate(): void {
  if (activeWindow.value && activeWindow.value.type === 'finder') {
    const selectedId = (activeWindow.value.data as any)?.selectedItemId
    if (selectedId) {
      const node = getNode(selectedId)
      if (node && node.parentId) {
        copyNode(selectedId, node.parentId)
      }
    }
  } else if (!activeWindow.value) {
    const selectedIcons = desktopIcons.value.filter(icon => icon.isSelected && icon.type !== 'hard-drive' && icon.type !== 'trash')
    selectedIcons.forEach(icon => {
      if (icon.path) {
        const node = getNodeByPath(icon.path)
        if (node && node.parentId) {
          copyNode(node.id, node.parentId)
        }
      }
    })
  }
}

function handleMakeAlias(): void {
  if (activeWindow.value && activeWindow.value.type === 'finder') {
    const selectedId = (activeWindow.value.data as any)?.selectedItemId
    if (selectedId) {
      const node = getNode(selectedId)
      if (node && node.parentId) {
        createAlias(selectedId, node.parentId)
      }
    }
  } else if (!activeWindow.value) {
    const selectedIcons = desktopIcons.value.filter(icon => icon.isSelected && icon.type !== 'hard-drive' && icon.type !== 'trash')
    selectedIcons.forEach(icon => {
      if (icon.path) {
        const node = getNodeByPath(icon.path)
        if (node && node.parentId) {
          createAlias(node.id, node.parentId)
        }
      }
    })
  }
}

function handleKeyDown(event: KeyboardEvent) {
  // Don't trigger shortcuts if an input is focused, unless it's a textarea and we want to allow some shortcuts
  if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
    // Allow Cmd+A, Cmd+C, Cmd+X, Cmd+V in textareas if they are not handled by the app
    const isCmd = event.metaKey || event.ctrlKey
    if (!isCmd) return

    const key = event.key.toLowerCase()
    if (!['a', 'c', 'x', 'v'].includes(key)) return
  }

  const isCmd = event.metaKey || event.ctrlKey
  if (!isCmd) return

  const key = event.key.toLowerCase()

  // Special case for backspace (Move to Trash)
  if (key === 'backspace' && canCopy.value) {
    event.preventDefault()
    handleDelete()
    return
  }

  // Try to find a menu item with this shortcut
  for (const menu of menus.value) {
    if (findAndTriggerShortcut(menu.items, key, event)) return
  }

  // Also check Apple menu
  if (findAndTriggerShortcut(appleMenuItems, key, event)) return
}

function findAndTriggerShortcut(items: MenuItem[], key: string, event: KeyboardEvent): boolean {
  for (const item of items) {
    if (item.shortcut) {
      // Extract key from shortcut (e.g., "⌘N" -> "n")
      const shortcutKey = item.shortcut.replace('⌘', '').toLowerCase()
      if (shortcutKey === key) {
        if (!item.disabled && item.action) {
          event.preventDefault()
          item.action()
          return true
        }
      }
    }
    if (item.submenu) {
      if (findAndTriggerShortcut(item.submenu, key, event)) return true
    }
  }
  return false
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
    <div
      class="menu-bar__item menu-bar__app-name"
      :class="{ 'menu-bar__item--active': activeMenuId === 'app' }"
      @click="handleMenuClick('app')"
      @mouseenter="handleMenuHover('app')"
    >
      {{ appName }}

      <!-- App Menu Dropdown -->
      <MenuDropdown
        v-if="activeMenuId === 'app'"
        :items="appMenuItems"
        @item-click="handleMenuItemClick"
      />
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
