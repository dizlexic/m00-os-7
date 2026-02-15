<script setup lang="ts">
/**
 * MenuBar Component
 *
 * Mac OS 7 style menu bar with Apple menu, application menus, and clock.
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

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
const currentTime = ref('')

// Menus configuration
const appleMenuItems: MenuItem[] = [
  { id: 'about', label: 'About This Macintosh', action: () => handleAbout() },
  { id: 'sep1', label: '', isSeparator: true },
  { id: 'control-panels', label: 'Control Panels', submenu: [] },
  { id: 'sep2', label: '', isSeparator: true },
  { id: 'recent-apps', label: 'Recent Applications', disabled: true },
  { id: 'recent-docs', label: 'Recent Documents', disabled: true },
  { id: 'sep3', label: '', isSeparator: true },
  { id: 'shutdown', label: 'Shut Down', action: () => handleShutdown() }
]

const fileMenuItems: MenuItem[] = [
  { id: 'new-folder', label: 'New Folder', shortcut: '⌘N' },
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
  { id: 'empty-trash', label: 'Empty Trash...' },
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

// Time formatting
function updateTime(): void {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  currentTime.value = `${displayHours}:${minutes} ${ampm}`
}

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

// Lifecycle
let timeInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
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
      <div v-if="activeMenuId === 'apple'" class="menu-bar__dropdown">
        <div
          v-for="item in appleMenuItems"
          :key="item.id"
          class="menu-bar__dropdown-item"
          :class="{
            'menu-bar__dropdown-item--separator': item.isSeparator,
            'menu-bar__dropdown-item--disabled': item.disabled
          }"
          @click="handleMenuItemClick(item)"
        >
          <template v-if="!item.isSeparator">
            <span class="menu-bar__dropdown-label">{{ item.label }}</span>
            <span v-if="item.shortcut" class="menu-bar__dropdown-shortcut">
              {{ item.shortcut }}
            </span>
          </template>
        </div>
      </div>
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
      <div v-if="activeMenuId === menu.id" class="menu-bar__dropdown">
        <div
          v-for="item in menu.items"
          :key="item.id"
          class="menu-bar__dropdown-item"
          :class="{
            'menu-bar__dropdown-item--separator': item.isSeparator,
            'menu-bar__dropdown-item--disabled': item.disabled
          }"
          @click="handleMenuItemClick(item)"
        >
          <template v-if="!item.isSeparator">
            <span class="menu-bar__dropdown-label">{{ item.label }}</span>
            <span v-if="item.shortcut" class="menu-bar__dropdown-shortcut">
              {{ item.shortcut }}
            </span>
          </template>
        </div>
      </div>
    </div>

    <!-- Spacer -->
    <div class="menu-bar__spacer" />

    <!-- Clock -->
    <div class="menu-bar__clock">
      {{ currentTime }}
    </div>
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

.menu-bar__clock {
  padding: 0 var(--spacing-md);
  height: 100%;
  display: flex;
  align-items: center;
}

.menu-bar__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  box-shadow: 2px 2px 0 var(--color-black);
  z-index: var(--z-dropdown);
}

.menu-bar__dropdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  color: var(--color-black);
  cursor: default;
}

.menu-bar__dropdown-item:hover:not(.menu-bar__dropdown-item--separator):not(.menu-bar__dropdown-item--disabled) {
  background-color: var(--color-highlight);
  color: var(--color-highlight-text);
}

.menu-bar__dropdown-item--separator {
  height: 1px;
  padding: 0;
  margin: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-gray-medium);
}

.menu-bar__dropdown-item--disabled {
  color: var(--color-gray-medium);
}

.menu-bar__dropdown-label {
  flex: 1;
}

.menu-bar__dropdown-shortcut {
  margin-left: var(--spacing-lg);
  color: inherit;
  opacity: 0.7;
}

.menu-bar__dropdown-item:hover:not(.menu-bar__dropdown-item--separator):not(.menu-bar__dropdown-item--disabled) .menu-bar__dropdown-shortcut {
  opacity: 1;
}
</style>
