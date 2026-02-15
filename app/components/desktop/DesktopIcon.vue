<script setup lang="ts">
/**
 * DesktopIcon Component
 *
 * Renders a single desktop icon with selection, drag-and-drop,
 * and double-click to open functionality.
 */

import { ref, computed, nextTick } from 'vue'
import type { DesktopIcon } from '~/types/desktop'
import type { WindowType } from '~/types/window'
import { useDesktop } from '~/composables/useDesktop'
import { useWindowManager } from '~/composables/useWindowManager'
import { useTrash } from '~/composables/useTrash'
import { useRecentItems } from '~/composables/useRecentItems'

interface Props {
  icon: DesktopIcon
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'contextmenu', event: MouseEvent): void
}>()

const {
  selectIcon,
  toggleSelection,
  moveIcon,
  getIconById,
  startRenaming,
  finishRenaming,
  cancelRenaming,
  isDragging: globalIsDragging,
  dropTargetId,
  setDragging,
  setDropTarget
} = useDesktop()

const { openWindow } = useWindowManager()
const { moveToTrash } = useTrash()
const { addRecentDoc } = useRecentItems()

// Local state
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const renameInput = ref<HTMLInputElement | null>(null)
const editingName = ref('')

// Computed styles
const iconStyle = computed(() => ({
  left: `${props.icon.position.x}px`,
  top: `${props.icon.position.y}px`
}))

// Double-click detection
let clickCount = 0
let clickTimer: ReturnType<typeof setTimeout> | null = null

// Event handlers
function handleMouseDown(event: MouseEvent): void {
  if (event.button !== 0) return
  if (props.icon.isRenaming) return

  event.stopPropagation()

  // Calculate drag offset from icon position
  dragOffset.value = {
    x: event.clientX - props.icon.position.x,
    y: event.clientY - props.icon.position.y
  }

  // Handle selection
  if (event.metaKey || event.ctrlKey) {
    toggleSelection(props.icon.id)
  } else if (!props.icon.isSelected) {
    selectIcon(props.icon.id)
  }

  // Start drag tracking
  isDragging.value = true
  setDragging(true)

  // Add global mouse event listeners
  window.addEventListener('mousemove', handleGlobalMouseMove)
  window.addEventListener('mouseup', handleGlobalMouseUp)
}

function handleGlobalMouseMove(event: MouseEvent): void {
  if (!isDragging.value) return

  const newPosition = {
    x: event.clientX - dragOffset.value.x,
    y: event.clientY - dragOffset.value.y
  }

  moveIcon(props.icon.id, newPosition)
}

function handleGlobalMouseUp(): void {
  if (isDragging.value) {
    isDragging.value = false
    setDragging(false)

    // Handle drop if we have a target
    if (dropTargetId.value && dropTargetId.value !== props.icon.id) {
      const targetIcon = getIconById(dropTargetId.value)
      if (targetIcon?.type === 'trash') {
        moveToTrash(props.icon.id)
      }
      // Reset drop target
      setDropTarget(null)
    }
  }

  window.removeEventListener('mousemove', handleGlobalMouseMove)
  window.removeEventListener('mouseup', handleGlobalMouseUp)
}

function handleMouseEnter(): void {
  if (globalIsDragging.value && !props.icon.isSelected) {
    setDropTarget(props.icon.id)
  }
}

function handleMouseLeave(): void {
  if (dropTargetId.value === props.icon.id) {
    setDropTarget(null)
  }
}

function handleClick(event: MouseEvent): void {
  if (event.button !== 0) return
  event.stopPropagation()

  clickCount++

  if (clickCount === 1) {
    // Single click - wait to see if it's a double click
    clickTimer = setTimeout(() => {
      clickCount = 0
      // Single click action already handled in mousedown
    }, 300)
  } else if (clickCount === 2) {
    // Double click
    if (clickTimer) {
      clearTimeout(clickTimer)
      clickTimer = null
    }
    clickCount = 0
    handleDoubleClick()
  }
}

function handleDoubleClick(): void {
  // Track recent doc if it's a document
  if (props.icon.type === 'document') {
    addRecentDoc({
      id: props.icon.id,
      name: props.icon.name,
      type: 'file',
      icon: props.icon.icon,
      data: {
        path: props.icon.path
      }
    })
  }

  // Map icon type to window type
  const iconTypeToWindowType: Record<string, WindowType> = {
    'folder': 'finder',
    'hard-drive': 'finder',
    'document': 'simpletext',
    'application': 'generic',
    'trash': 'finder'
  }

  const windowType = iconTypeToWindowType[props.icon.type] || 'generic'

  // Open a window for this icon
  openWindow({
    type: windowType,
    title: props.icon.name,
    icon: props.icon.icon,
    data: {
      path: props.icon.path,
      iconType: props.icon.type
    }
  })
}

function handleLabelClick(event: MouseEvent): void {
  event.stopPropagation()

  // If already selected, start renaming after a delay
  if (props.icon.isSelected && !props.icon.isRenaming) {
    setTimeout(() => {
      if (props.icon.isSelected) {
        startRename()
      }
    }, 500)
  }
}

function startRename(): void {
  editingName.value = props.icon.name
  startRenaming(props.icon.id)

  nextTick(() => {
    if (renameInput.value) {
      renameInput.value.focus()
      renameInput.value.select()
    }
  })
}

function handleRenameKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    finishRenaming(props.icon.id, editingName.value)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelRenaming(props.icon.id)
  }
}

function handleRenameBlur(): void {
  if (props.icon.isRenaming) {
    finishRenaming(props.icon.id, editingName.value)
  }
}

function handleContextMenu(event: MouseEvent): void {
  event.preventDefault()
  event.stopPropagation()

  // Select icon if not already selected
  if (!props.icon.isSelected) {
    selectIcon(props.icon.id)
  }

  emit('contextmenu', event)
}
</script>

<template>
  <div
    class="desktop-icon"
    :class="{
      'desktop-icon--selected': icon.isSelected,
      'desktop-icon--dragging': isDragging,
      'desktop-icon--drop-target': dropTargetId === icon.id
    }"
    :style="iconStyle"
    @mousedown="handleMouseDown"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
    @contextmenu="handleContextMenu"
  >
    <!-- Icon Image -->
    <div class="desktop-icon__image">
      <img
        :src="icon.icon"
        :alt="icon.name"
        draggable="false"
      >
    </div>

    <!-- Icon Label -->
    <div
      class="desktop-icon__label"
      :class="{ 'desktop-icon__label--selected': icon.isSelected }"
      @click="handleLabelClick"
    >
      <template v-if="icon.isRenaming">
        <input
          ref="renameInput"
          v-model="editingName"
          type="text"
          class="desktop-icon__rename-input"
          @keydown="handleRenameKeyDown"
          @blur="handleRenameBlur"
          @click.stop
        >
      </template>
      <template v-else>
        {{ icon.name }}
      </template>
    </div>
  </div>
</template>

<style scoped>
.desktop-icon {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 72px;
  padding: var(--spacing-xs);
  cursor: default;
  user-select: none;
  z-index: var(--z-desktop-icons);
}

.desktop-icon--dragging {
  opacity: 0.7;
  cursor: grabbing;
}

.desktop-icon__image {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-xs);
}

.desktop-icon__image img {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.desktop-icon--selected .desktop-icon__image,
.desktop-icon--drop-target .desktop-icon__image {
  /* Invert colors for selected or drop target icon */
  filter: invert(1);
}

.desktop-icon__label {
  max-width: 72px;
  padding: 1px 4px;
  font-size: var(--font-size-sm);
  text-align: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.2;
  color: var(--color-white);
  text-shadow:
    1px 1px 0 var(--color-black),
    -1px -1px 0 var(--color-black),
    1px -1px 0 var(--color-black),
    -1px 1px 0 var(--color-black);
}

.desktop-icon__label--selected {
  background-color: var(--color-highlight);
  color: var(--color-highlight-text);
  text-shadow: none;
}

.desktop-icon__rename-input {
  width: 100%;
  max-width: 72px;
  padding: 1px 2px;
  font-size: var(--font-size-sm);
  font-family: var(--font-system);
  text-align: center;
  border: 1px solid var(--color-black);
  background-color: var(--color-white);
  color: var(--color-black);
  outline: none;
}

.desktop-icon__rename-input:focus {
  box-shadow: 0 0 0 1px var(--color-highlight);
}
</style>
