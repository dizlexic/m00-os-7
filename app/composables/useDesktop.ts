/**
 * useDesktop Composable
 *
 * Manages the desktop environment state including icons, selection, and background.
 */

import { ref, computed, readonly, watch } from 'vue'
import type {
  DesktopIcon,
  DesktopPattern,
  DesktopState,
  Position,
  MarqueeSelection,
  ContextMenuState
} from '~/types/desktop'
import { DEFAULT_PATTERNS, DEFAULT_GRID_SIZE } from '~/types/desktop'
import { useSettings } from '~/composables/useSettings'

/** Generate unique ID */
function generateId(): string {
  return `icon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/** Snap position to grid */
function snapToGrid(position: Position, gridSize: number): Position {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  }
}

// State
const icons = ref<DesktopIcon[]>([])
const selectedIds = ref<string[]>([])
const backgroundPattern = ref<DesktopPattern>(DEFAULT_PATTERNS[0])
const gridSize = ref<number>(DEFAULT_GRID_SIZE)
const showGrid = ref<boolean>(false)

// Marquee selection state
const marquee = ref<MarqueeSelection>({
  isActive: false,
  start: { x: 0, y: 0 },
  current: { x: 0, y: 0 }
})

// Context menu state
const contextMenu = ref<ContextMenuState>({
  isVisible: false,
  position: { x: 0, y: 0 },
  items: []
})

// Drag and drop state
const isDragging = ref<boolean>(false)
const dropTargetId = ref<string | null>(null)

/**
 * useDesktop composable
 */
export function useDesktop() {
  // Computed properties
  const selectedIcons = computed(() =>
    icons.value.filter(icon => selectedIds.value.includes(icon.id))
  )

  const hasSelection = computed(() => selectedIds.value.length > 0)

  const desktopState = computed<DesktopState>(() => ({
    icons: icons.value,
    selectedIds: selectedIds.value,
    backgroundPattern: backgroundPattern.value,
    gridSize: gridSize.value,
    showGrid: showGrid.value
  }))

  // Icon management
  function addIcon(icon: Omit<DesktopIcon, 'id' | 'isSelected' | 'isRenaming'>): DesktopIcon {
    const newIcon: DesktopIcon = {
      ...icon,
      id: generateId(),
      isSelected: false,
      isRenaming: false,
      position: snapToGrid(icon.position, gridSize.value)
    }
    icons.value.push(newIcon)
    return newIcon
  }

  function removeIcon(id: string): void {
    const index = icons.value.findIndex(icon => icon.id === id)
    if (index !== -1) {
      icons.value.splice(index, 1)
      // Also remove from selection
      const selIndex = selectedIds.value.indexOf(id)
      if (selIndex !== -1) {
        selectedIds.value.splice(selIndex, 1)
      }
    }
  }

  function updateIcon(id: string, updates: Partial<DesktopIcon>): void {
    const icon = icons.value.find(i => i.id === id)
    if (icon) {
      Object.assign(icon, updates)
      // Snap position to grid if position was updated
      if (updates.position) {
        icon.position = snapToGrid(updates.position, gridSize.value)
      }
    }
  }

  function moveIcon(id: string, position: Position): void {
    updateIcon(id, { position: snapToGrid(position, gridSize.value) })
  }

  function getIconById(id: string): DesktopIcon | undefined {
    return icons.value.find(icon => icon.id === id)
  }

  // Selection management
  function selectIcon(id: string, addToSelection: boolean = false): void {
    if (addToSelection) {
      // Multi-select (Cmd/Ctrl + click)
      if (!selectedIds.value.includes(id)) {
        selectedIds.value.push(id)
      }
    } else {
      // Single select
      selectedIds.value = [id]
    }

    // Update icon state
    icons.value.forEach(icon => {
      icon.isSelected = selectedIds.value.includes(icon.id)
    })
  }

  function deselectIcon(id: string): void {
    const index = selectedIds.value.indexOf(id)
    if (index !== -1) {
      selectedIds.value.splice(index, 1)
      const icon = icons.value.find(i => i.id === id)
      if (icon) {
        icon.isSelected = false
      }
    }
  }

  function selectAll(): void {
    selectedIds.value = icons.value.map(icon => icon.id)
    icons.value.forEach(icon => {
      icon.isSelected = true
    })
  }

  function deselectAll(): void {
    selectedIds.value = []
    icons.value.forEach(icon => {
      icon.isSelected = false
      icon.isRenaming = false
    })
  }

  function toggleSelection(id: string): void {
    if (selectedIds.value.includes(id)) {
      deselectIcon(id)
    } else {
      selectIcon(id, true)
    }
  }

  // Marquee selection
  function startMarquee(position: Position): void {
    marquee.value = {
      isActive: true,
      start: position,
      current: position
    }
  }

  function updateMarquee(position: Position): void {
    if (marquee.value.isActive) {
      marquee.value.current = position

      // Calculate marquee bounds
      const minX = Math.min(marquee.value.start.x, position.x)
      const maxX = Math.max(marquee.value.start.x, position.x)
      const minY = Math.min(marquee.value.start.y, position.y)
      const maxY = Math.max(marquee.value.start.y, position.y)

      // Select icons within marquee
      const newSelection: string[] = []
      icons.value.forEach(icon => {
        const iconCenterX = icon.position.x + 16 // Half icon width
        const iconCenterY = icon.position.y + 16 // Half icon height

        if (iconCenterX >= minX && iconCenterX <= maxX &&
            iconCenterY >= minY && iconCenterY <= maxY) {
          newSelection.push(icon.id)
        }
      })

      selectedIds.value = newSelection
      icons.value.forEach(icon => {
        icon.isSelected = newSelection.includes(icon.id)
      })
    }
  }

  function endMarquee(): void {
    marquee.value.isActive = false
  }

  // Context menu
  function showContextMenu(position: Position, items: ContextMenuState['items']): void {
    contextMenu.value = {
      isVisible: true,
      position,
      items
    }
  }

  function hideContextMenu(): void {
    contextMenu.value.isVisible = false
  }

  // Background management
  function setBackgroundPattern(pattern: DesktopPattern): void {
    backgroundPattern.value = pattern
  }

  function setGridSize(size: number): void {
    gridSize.value = size
  }

  function toggleGrid(): void {
    showGrid.value = !showGrid.value
  }

  // Drag and drop
  function setDragging(dragging: boolean): void {
    isDragging.value = dragging
  }

  function setDropTarget(id: string | null): void {
    dropTargetId.value = id
  }

  // Icon renaming
  function startRenaming(id: string): void {
    // First deselect all and stop any other renaming
    icons.value.forEach(icon => {
      icon.isRenaming = false
    })

    const icon = icons.value.find(i => i.id === id)
    if (icon) {
      icon.isRenaming = true
      icon.isSelected = true
      selectedIds.value = [id]
    }
  }

  function finishRenaming(id: string, newName: string): void {
    const icon = icons.value.find(i => i.id === id)
    if (icon) {
      icon.name = newName.trim() || icon.name
      icon.isRenaming = false
    }
  }

  function cancelRenaming(id: string): void {
    const icon = icons.value.find(i => i.id === id)
    if (icon) {
      icon.isRenaming = false
    }
  }

  // Clean up desktop (arrange icons)
  function cleanUpDesktop(): void {
    const sortedIcons = [...icons.value].sort((a, b) => {
      // Sort by type first, then by name
      if (a.type !== b.type) {
        const typeOrder = ['hard-drive', 'folder', 'application', 'document', 'alias', 'trash']
        return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
      }
      return a.name.localeCompare(b.name)
    })

    // Arrange in grid from top-right
    const startX = window.innerWidth - gridSize.value - 20
    const startY = 20 // Near top menu bar
    let currentX = startX
    let currentY = startY

    sortedIcons.forEach(icon => {
      icon.position = { x: currentX, y: currentY }
      currentY += gridSize.value

      // Move to next column if we reach bottom
      if (currentY + gridSize.value > window.innerHeight - 40) {
        currentY = startY
        currentX -= gridSize.value
      }
    })

    icons.value = sortedIcons
  }

  // Initialize with default icons
  function initializeDesktop(): void {
    const { settings } = useSettings()

    // Sync background pattern with settings
    const currentPattern = DEFAULT_PATTERNS.find(p => p.id === settings.value.desktopPattern) || DEFAULT_PATTERNS[0]
    backgroundPattern.value = currentPattern

    // Watch for settings changes
    watch(() => settings.value.desktopPattern, (newPatternId) => {
      const pattern = DEFAULT_PATTERNS.find(p => p.id === newPatternId)
      if (pattern) {
        backgroundPattern.value = pattern
      }
    })

    // Watch for highlight color changes
    watch(() => settings.value.highlightColor, (newColor) => {
      document.documentElement.style.setProperty('--color-highlight', newColor)
    }, { immediate: true })

    // Clear existing icons
    icons.value = []
    selectedIds.value = []

    // Add default desktop icons
    const defaultIcons: Omit<DesktopIcon, 'id' | 'isSelected' | 'isRenaming'>[] = [
      {
        name: 'Macintosh HD',
        type: 'hard-drive',
        icon: '/assets/icons/system/hard-drive.png',
        position: { x: window.innerWidth - 100, y: 20 },
        path: 'Macintosh HD'
      },
      {
        name: 'Readme',
        type: 'document',
        icon: '/assets/icons/system/document.png',
        position: { x: window.innerWidth - 100, y: 100 },
        path: 'articles/welcome',
        opensWith: 'article'
      },
      {
        name: 'Trash',
        type: 'trash',
        icon: '/assets/icons/system/trash-empty.png',
        position: { x: window.innerWidth - 100, y: window.innerHeight - 120 },
        path: 'Macintosh HD/Trash'
      }
    ]

    defaultIcons.forEach(icon => addIcon(icon))
  }

  return {
    // State (readonly)
    icons: readonly(icons),
    selectedIds: readonly(selectedIds),
    backgroundPattern: readonly(backgroundPattern),
    gridSize: readonly(gridSize),
    showGrid: readonly(showGrid),
    marquee: readonly(marquee),
    contextMenu: readonly(contextMenu),
    isDragging: readonly(isDragging),
    dropTargetId: readonly(dropTargetId),

    // Computed
    selectedIcons,
    hasSelection,
    desktopState,

    // Icon management
    addIcon,
    removeIcon,
    updateIcon,
    moveIcon,
    getIconById,

    // Selection
    selectIcon,
    deselectIcon,
    selectAll,
    deselectAll,
    toggleSelection,

    // Marquee
    startMarquee,
    updateMarquee,
    endMarquee,

    // Context menu
    showContextMenu,
    hideContextMenu,

    // Background
    setBackgroundPattern,
    setGridSize,
    toggleGrid,

    // Drag and drop
    setDragging,
    setDropTarget,

    // Renaming
    startRenaming,
    finishRenaming,
    cancelRenaming,

    // Utilities
    cleanUpDesktop,
    initializeDesktop,

    // Constants
    DEFAULT_PATTERNS
  }
}
