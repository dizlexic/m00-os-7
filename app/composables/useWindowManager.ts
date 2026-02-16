/**
 * useWindowManager Composable
 *
 * Manages the window system including opening, closing, focusing,
 * and arranging windows.
 */

import { ref, computed, readonly } from 'vue'
import { useRecentItems } from '~/composables/useRecentItems'
import type { Position, Size } from '~/types/desktop'
import type {
  WindowConfig,
  WindowInstance,
  WindowState,
  WindowType
} from '~/types/window'
import {
  DEFAULT_WINDOW_SIZES,
  DEFAULT_MIN_SIZE,
  DEFAULT_MAX_SIZE,
  CASCADE_OFFSET,
  INITIAL_WINDOW_POSITION,
  MAX_WINDOWS,
  TITLE_BAR_HEIGHT
} from '~/types/window'

/** Generate unique window ID */
function generateWindowId(): string {
  return `window-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// State
const windows = ref<Map<string, WindowInstance>>(new Map())
const activeWindowId = ref<string | null>(null)
const topZIndex = ref(100)
const cascadePosition = ref<Position>({ ...INITIAL_WINDOW_POSITION })

/**
 * useWindowManager composable
 */
export function useWindowManager() {
  // Computed properties
  const windowList = computed(() => Array.from(windows.value.values()))

  const activeWindow = computed(() =>
    activeWindowId.value ? windows.value.get(activeWindowId.value) : null
  )

  const windowCount = computed(() => windows.value.size)

  const sortedWindows = computed(() =>
    [...windowList.value].sort((a, b) => a.zIndex - b.zIndex)
  )

  // Window creation
  function openWindow(config: WindowConfig): string {
    if (windows.value.size >= MAX_WINDOWS) {
      throw new Error(`Maximum number of windows (${MAX_WINDOWS}) exceeded`)
    }

    const id = generateWindowId()
    const defaultSize = DEFAULT_WINDOW_SIZES[config.type] || DEFAULT_WINDOW_SIZES.generic

    // Calculate position (cascade or specified)
    let position: Position
    if (config.position) {
      position = { ...config.position }
    } else {
      position = { ...cascadePosition.value }
      // Update cascade position for next window
      cascadePosition.value = {
        x: cascadePosition.value.x + CASCADE_OFFSET.x,
        y: cascadePosition.value.y + CASCADE_OFFSET.y
      }
      // Reset cascade if it goes too far
      if (cascadePosition.value.x > 300 || cascadePosition.value.y > 300) {
        cascadePosition.value = { ...INITIAL_WINDOW_POSITION }
      }
    }

    // Increment z-index
    topZIndex.value++

    const windowInstance: WindowInstance = {
      id,
      type: config.type,
      title: config.title,
      position,
      size: config.size || { ...defaultSize },
      minSize: config.minSize || { ...DEFAULT_MIN_SIZE },
      maxSize: config.maxSize || { ...DEFAULT_MAX_SIZE },
      state: 'normal',
      zIndex: topZIndex.value,
      isActive: true,
      resizable: config.resizable ?? true,
      closable: config.closable ?? true,
      minimizable: config.minimizable ?? true,
      maximizable: config.maximizable ?? true,
      collapsible: config.collapsible ?? true,
      data: config.data,
      icon: config.icon,
      menus: config.menus,
      createdAt: Date.now()
    }

    // Deactivate current active window
    if (activeWindowId.value) {
      const currentActive = windows.value.get(activeWindowId.value)
      if (currentActive) {
        currentActive.isActive = false
      }
    }

    windows.value.set(id, windowInstance)
    activeWindowId.value = id

    // Track recent apps
    trackRecentApp(config)

    return id
  }

  const { addRecentApp } = useRecentItems()

  function trackRecentApp(config: WindowConfig): void {
    const trackableApps: WindowType[] = [
      'simpletext',
      'calculator',
      'notepad',
      'scrapbook',
      'puzzle',
      'paint',
      'eliza',
      'messenger',
      'control-panels'
    ]

    if (trackableApps.includes(config.type)) {
      const appNames: Record<string, string> = {
        simpletext: 'SimpleText',
        calculator: 'Calculator',
        notepad: 'Note Pad',
        scrapbook: 'Scrapbook',
        puzzle: 'Puzzle',
        paint: 'Paint',
        eliza: 'Eliza',
        messenger: 'Messenger',
        'control-panels': 'Control Panels'
      }

      addRecentApp({
        id: config.type,
        name: appNames[config.type] || config.title,
        type: config.type,
        icon: config.icon
      })
    }
  }

  function closeWindow(id: string): void {
    const window = windows.value.get(id)
    if (!window) return

    windows.value.delete(id)

    // If closed window was active, activate the top window
    if (activeWindowId.value === id) {
      const topWindow = sortedWindows.value[sortedWindows.value.length - 1]
      if (topWindow) {
        activateWindow(topWindow.id)
      } else {
        activeWindowId.value = null
      }
    }
  }

  function closeAllWindows(): void {
    windows.value.clear()
    activeWindowId.value = null
    topZIndex.value = 100
    cascadePosition.value = { ...INITIAL_WINDOW_POSITION }
  }

  // Window focus/activation
  function activateWindow(id: string): void {
    const window = windows.value.get(id)
    if (!window) return

    // Deactivate current active window
    if (activeWindowId.value && activeWindowId.value !== id) {
      const currentActive = windows.value.get(activeWindowId.value)
      if (currentActive) {
        currentActive.isActive = false
      }
    }

    // Bring to front
    topZIndex.value++
    window.zIndex = topZIndex.value
    window.isActive = true
    activeWindowId.value = id
  }

  function bringToFront(id: string): void {
    activateWindow(id)
  }

  function sendToBack(id: string): void {
    const window = windows.value.get(id)
    if (!window) return

    // Find minimum z-index
    let minZIndex = Infinity
    windows.value.forEach(w => {
      if (w.id !== id && w.zIndex < minZIndex) {
        minZIndex = w.zIndex
      }
    })

    window.zIndex = minZIndex > 0 ? minZIndex - 1 : 0

    // Activate the new top window
    const topWindow = sortedWindows.value[sortedWindows.value.length - 1]
    if (topWindow && topWindow.id !== id) {
      activateWindow(topWindow.id)
    }
  }

  // Window state changes
  function minimizeWindow(id: string): void {
    const window = windows.value.get(id)
    if (!window || !window.minimizable) return

    window.state = 'minimized'
    window.isActive = false

    // Activate next window
    if (activeWindowId.value === id) {
      const visibleWindows = sortedWindows.value.filter(w => w.state !== 'minimized')
      const topVisible = visibleWindows[visibleWindows.length - 1]
      if (topVisible) {
        activateWindow(topVisible.id)
      } else {
        activeWindowId.value = null
      }
    }
  }

  function maximizeWindow(id: string): void {
    const window = windows.value.get(id)
    if (!window || !window.maximizable) return

    if (window.state === 'maximized') {
      // Restore to previous size
      restoreWindow(id)
    } else {
      // Save current position and size
      window.previousPosition = { ...window.position }
      window.previousSize = { ...window.size }

      // Maximize
      window.state = 'maximized'
      window.position = { x: 0, y: TITLE_BAR_HEIGHT + 20 } // Below menu bar
      window.size = {
        width: window.maxSize.width === 9999 ? globalThis.innerWidth || 1024 : window.maxSize.width,
        height: window.maxSize.height === 9999 ? (globalThis.innerHeight || 768) - TITLE_BAR_HEIGHT - 20 : window.maxSize.height
      }
    }

    activateWindow(id)
  }

  function collapseWindow(id: string): void {
    const window = windows.value.get(id)
    if (!window || !window.collapsible) return

    if (window.state === 'collapsed') {
      // Restore
      window.state = 'normal'
      if (window.previousSize) {
        window.size = { ...window.previousSize }
      }
    } else {
      // Collapse (shade)
      window.previousSize = { ...window.size }
      window.state = 'collapsed'
      window.size = { width: window.size.width, height: TITLE_BAR_HEIGHT }
    }

    activateWindow(id)
  }

  function restoreWindow(id: string): void {
    const window = windows.value.get(id)
    if (!window) return

    if (window.state === 'minimized' || window.state === 'maximized' || window.state === 'collapsed') {
      window.state = 'normal'

      if (window.previousPosition) {
        window.position = { ...window.previousPosition }
      }
      if (window.previousSize) {
        window.size = { ...window.previousSize }
      }
    }

    activateWindow(id)
  }

  // Window movement and resizing
  function moveWindow(id: string, position: Position): void {
    const window = windows.value.get(id)
    if (!window) return

    // Constrain to screen bounds
    const maxX = (globalThis.innerWidth || 1024) - 50
    const maxY = (globalThis.innerHeight || 768) - 50

    window.position = {
      x: Math.max(0, Math.min(position.x, maxX)),
      y: Math.max(TITLE_BAR_HEIGHT + 20, Math.min(position.y, maxY))
    }
  }

  function resizeWindow(id: string, size: Size): void {
    const window = windows.value.get(id)
    if (!window || !window.resizable) return

    window.size = {
      width: Math.max(window.minSize.width, Math.min(size.width, window.maxSize.width)),
      height: Math.max(window.minSize.height, Math.min(size.height, window.maxSize.height))
    }
  }

  // Window arrangement
  function cascadeWindows(): void {
    let x = INITIAL_WINDOW_POSITION.x
    let y = INITIAL_WINDOW_POSITION.y

    sortedWindows.value.forEach(window => {
      if (window.state !== 'minimized') {
        window.position = { x, y }
        window.state = 'normal'
        x += CASCADE_OFFSET.x
        y += CASCADE_OFFSET.y
      }
    })

    cascadePosition.value = { x, y }
  }

  function tileWindows(): void {
    const visibleWindows = windowList.value.filter(w => w.state !== 'minimized')
    if (visibleWindows.length === 0) return

    const screenWidth = globalThis.innerWidth || 1024
    const screenHeight = (globalThis.innerHeight || 768) - TITLE_BAR_HEIGHT - 20
    const startY = TITLE_BAR_HEIGHT + 20

    const cols = Math.ceil(Math.sqrt(visibleWindows.length))
    const rows = Math.ceil(visibleWindows.length / cols)
    const tileWidth = Math.floor(screenWidth / cols)
    const tileHeight = Math.floor(screenHeight / rows)

    visibleWindows.forEach((window, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)

      window.position = {
        x: col * tileWidth,
        y: startY + row * tileHeight
      }
      window.size = {
        width: Math.max(window.minSize.width, tileWidth - 4),
        height: Math.max(window.minSize.height, tileHeight - 4)
      }
      window.state = 'normal'
    })
  }

  // Window queries
  function getWindow(id: string): WindowInstance | undefined {
    return windows.value.get(id)
  }

  function getWindowsByType(type: WindowType): WindowInstance[] {
    return windowList.value.filter(w => w.type === type)
  }

  function hasWindow(id: string): boolean {
    return windows.value.has(id)
  }

  // Update window properties
  function updateWindow(id: string, updates: Partial<WindowInstance>): void {
    const window = windows.value.get(id)
    if (!window) return

    Object.assign(window, updates)
  }

  function setWindowTitle(id: string, title: string): void {
    updateWindow(id, { title })
  }

  return {
    // State (readonly)
    windows: readonly(windows),
    activeWindowId: readonly(activeWindowId),

    // Computed
    windowList,
    activeWindow,
    windowCount,
    sortedWindows,

    // Window lifecycle
    openWindow,
    closeWindow,
    closeAllWindows,

    // Focus management
    activateWindow,
    bringToFront,
    sendToBack,

    // State changes
    minimizeWindow,
    maximizeWindow,
    collapseWindow,
    restoreWindow,

    // Movement and resizing
    moveWindow,
    resizeWindow,

    // Arrangement
    cascadeWindows,
    tileWindows,

    // Queries
    getWindow,
    getWindowsByType,
    hasWindow,

    // Updates
    updateWindow,
    setWindowTitle
  }
}
