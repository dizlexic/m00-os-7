<script setup lang="ts">
/**
 * MenuBar Component
 *
 * Mac OS 7 style menu bar with Apple menu, application menus, and clock.
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import Clock from '~/components/system/Clock.vue'
import MenuDropdown from '~/components/desktop/MenuDropdown.vue'
import { useFileSystem } from '~/composables/useFileSystem'
import { useWindowManager } from '~/composables/useWindowManager'

const { createFolder, getRoot, getNodeByPath, emptyTrash } = useFileSystem()
const { activeWindow } = useWindowManager()

interface MenuItem {
  id: string
  label: string
  shortcut?: string
  disabled?: boolean
  isSeparator?: boolean
  action?: () => void
  submenu?: MenuItem[]
}

interface Menu {
  id: string
  label: string
  items: MenuItem[]
}

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
const appleMenuItems: MenuItem[] = [
  { id: 'about', label: 'About This Macintosh', action: () => handleAbout() },
  { id: 'sep1', label: '', isSeparator: true },
  {
    id: 'control-panels',
    label: 'Control Panels',
    submenu: [
      { id: 'cp-apple-menu', label: 'Apple Menu Options' },
      { id: 'cp-color', label: 'Color' },
      { id: 'cp-date-time', label: 'Date & Time' },
      { id: 'cp-desktop-patterns', label: 'Desktop Patterns' },
      { id: 'cp-extensions', label: 'Extensions Manager' },
      { id: 'cp-memory', label: 'Memory' },
      { id: 'cp-monitors', label: 'Monitors' },
      { id: 'cp-mouse', label: 'Mouse' },
      { id: 'cp-sound', label: 'Sound' },
      { id: 'cp-startup-disk', label: 'Startup Disk' }
    ]
  },
  { id: 'sep2', label: '', isSeparator: true },
  { id: 'recent-apps', label: 'Recent Applications', disabled: true },
  { id: 'recent-docs', label: 'Recent Documents', disabled: true },
  { id: 'sep3', label: '', isSeparator: true },
  { id: 'shutdown', label: 'Shut Down', action: () => handleShutdown() }
]

const fileMenuItems: MenuItem[] = [
  { id: 'new-folder', label: 'New Folder', shortcut: '⌘N', action: () => handleNewFolder() },
  { id: 'open', label: 'Open', shortcut: '⌘O' },
  { id: 'sep1', label: '', isSeparator: true },
  { id: 'close', label: 'Close Window', shortcut: '⌘W' },
  { id: 'sep2', label: '', isSeparator: true },
  { id: 'get-info', label: 'Get Info', shortcut: '⌘I' },
  { id: 'sep3', label: '', isSeparator: true },
  { id: 'duplicate', label: 'Duplicate', shortcut: '⌘D', disabled: true },
  { id: 'make-alias', label: 'Make Alias', shortcut: '⌘M', disabled: true },
  { id: 'put-away', label: 'Put Away', shortcut: '⌘Y', disabled: true },
  { id: 'sep4', label: '', isSeparator: true },
  { id: 'find', label: 'Find...', shortcut: '⌘F' },
  { id: 'sep5', label: '', isSeparator: true },
  { id: 'page-setup', label: 'Page Setup...', disabled: true },
  { id: 'print', label: 'Print...', shortcut: '⌘P', disabled: true }
]

const editMenuItems: MenuItem[] = [
  { id: 'undo', label: 'Undo', shortcut: '⌘Z', disabled: true },
  { id: 'sep1', label: '', isSeparator: true },
  { id: 'cut', label: 'Cut', shortcut: '⌘X', disabled: true },
  { id: 'copy', label: 'Copy', shortcut: '⌘C', disabled: true },
  { id: 'paste', label: 'Paste', shortcut: '⌘V', disabled: true },
  { id: 'clear', label: 'Clear', disabled: true },
  { id: 'sep2', label: '', isSeparator: true },
  { id: 'select-all', label: 'Select All', shortcut: '⌘A' }
]

const viewMenuItems: MenuItem[] = [
  { id: 'by-icon', label: 'by Icon' },
  { id: 'by-name', label: 'by Name' },
  { id: 'by-date', label: 'by Date' },
  { id: 'by-size', label: 'by Size' },
  { id: 'by-kind', label: 'by Kind' },
  { id: 'sep1', label: '', isSeparator: true },
  { id: 'clean-up', label: 'Clean Up Desktop' }
]

const specialMenuItems: MenuItem[] = [
  { id: 'empty-trash', label: 'Empty Trash...', action: () => handleEmptyTrash() },
  { id: 'sep1', label: '', isSeparator: true },
  { id: 'eject', label: 'Eject', disabled: true },
  { id: 'erase-disk', label: 'Erase Disk...', disabled: true },
  { id: 'sep2', label: '', isSeparator: true },
  { id: 'restart', label: 'Restart' },
  { id: 'shut-down', label: 'Shut Down' }
]

const menus = computed<Menu[]>(() => [
  { id: 'file', label: 'File', items: fileMenuItems },
  { id: 'edit', label: 'Edit', items: editMenuItems },
  { id: 'view', label: 'View', items: viewMenuItems },
  { id: 'special', label: 'Special', items: specialMenuItems }
])

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
  console.warn('About This Macintosh')
  // TODO: Open About dialog
}

function handleShutdown(): void {
  console.warn('Shut Down')
  // TODO: Implement shutdown sequence
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

function handleEmptyTrash(): void {
  emptyTrash()
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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
