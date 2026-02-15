<script setup lang="ts">
/**
 * Window Component
 *
 * Mac OS 7 style window with title bar, content area, and resize handle.
 */

import { ref, computed } from 'vue'
import type { WindowInstance } from '~/types/window'
import { useWindowManager } from '~/composables/useWindowManager'
import WindowTitleBar from './WindowTitleBar.vue'

interface Props {
  window: WindowInstance
}

const props = defineProps<Props>()

const {
  activateWindow,
  closeWindow,
  minimizeWindow,
  maximizeWindow,
  collapseWindow,
  moveWindow,
  resizeWindow
} = useWindowManager()

// Drag state
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// Resize state
const isResizing = ref(false)
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })

// Computed styles
const windowStyle = computed(() => ({
  left: `${props.window.position.x}px`,
  top: `${props.window.position.y}px`,
  width: `${props.window.size.width}px`,
  height: `${props.window.size.height}px`,
  zIndex: props.window.zIndex,
  display: props.window.state === 'minimized' ? 'none' : 'flex'
}))

// Event handlers
function handleMouseDown(event: MouseEvent): void {
  // Activate window on any click
  if (!props.window.isActive) {
    activateWindow(props.window.id)
  }
}

function handleTitleBarMouseDown(event: MouseEvent): void {
  if (event.button !== 0) return

  event.preventDefault()
  isDragging.value = true

  dragOffset.value = {
    x: event.clientX - props.window.position.x,
    y: event.clientY - props.window.position.y
  }

  window.addEventListener('mousemove', handleDragMove)
  window.addEventListener('mouseup', handleDragEnd)
}

function handleDragMove(event: MouseEvent): void {
  if (!isDragging.value) return

  moveWindow(props.window.id, {
    x: event.clientX - dragOffset.value.x,
    y: event.clientY - dragOffset.value.y
  })
}

function handleDragEnd(): void {
  isDragging.value = false
  window.removeEventListener('mousemove', handleDragMove)
  window.removeEventListener('mouseup', handleDragEnd)
}

function handleResizeMouseDown(event: MouseEvent): void {
  if (event.button !== 0) return
  if (!props.window.resizable) return
  if (props.window.state === 'collapsed') return

  event.preventDefault()
  event.stopPropagation()

  isResizing.value = true
  resizeStart.value = {
    x: event.clientX,
    y: event.clientY,
    width: props.window.size.width,
    height: props.window.size.height
  }

  window.addEventListener('mousemove', handleResizeMove)
  window.addEventListener('mouseup', handleResizeEnd)
}

function handleResizeMove(event: MouseEvent): void {
  if (!isResizing.value) return

  const deltaX = event.clientX - resizeStart.value.x
  const deltaY = event.clientY - resizeStart.value.y

  resizeWindow(props.window.id, {
    width: resizeStart.value.width + deltaX,
    height: resizeStart.value.height + deltaY
  })
}

function handleResizeEnd(): void {
  isResizing.value = false
  window.removeEventListener('mousemove', handleResizeMove)
  window.removeEventListener('mouseup', handleResizeEnd)
}

function handleClose(): void {
  closeWindow(props.window.id)
}

function handleMinimize(): void {
  minimizeWindow(props.window.id)
}

function handleMaximize(): void {
  maximizeWindow(props.window.id)
}

function handleCollapse(): void {
  collapseWindow(props.window.id)
}

function handleTitleBarDoubleClick(): void {
  if (props.window.collapsible) {
    collapseWindow(props.window.id)
  }
}
</script>

<template>
  <div
    class="window"
    :class="{
      'window--active': window.isActive,
      'window--inactive': !window.isActive,
      'window--dragging': isDragging,
      'window--resizing': isResizing,
      'window--collapsed': window.state === 'collapsed',
      'window--maximized': window.state === 'maximized'
    }"
    :style="windowStyle"
    @mousedown="handleMouseDown"
  >
    <!-- Title Bar -->
    <WindowTitleBar
      :title="window.title"
      :is-active="window.isActive"
      :closable="window.closable"
      :minimizable="window.minimizable"
      :maximizable="window.maximizable"
      :collapsible="window.collapsible"
      :is-collapsed="window.state === 'collapsed'"
      @mousedown="handleTitleBarMouseDown"
      @dblclick="handleTitleBarDoubleClick"
      @close="handleClose"
      @minimize="handleMinimize"
      @maximize="handleMaximize"
      @collapse="handleCollapse"
    />

    <!-- Content Area -->
    <div
      v-if="window.state !== 'collapsed'"
      class="window__content"
    >
      <slot />
    </div>

    <!-- Resize Handle -->
    <div
      v-if="window.resizable && window.state !== 'collapsed'"
      class="window__resize-handle"
      @mousedown="handleResizeMouseDown"
    >
      <div class="window__resize-lines" />
    </div>
  </div>
</template>

<style scoped>
.window {
  position: absolute;
  display: flex;
  flex-direction: column;
  background-color: var(--color-window-bg, #CCCCCC);
  border: 1px solid var(--color-black);
  box-shadow: 1px 1px 0 var(--color-black);
  min-width: 100px;
  min-height: 50px;
}

.window--active {
  box-shadow: 2px 2px 0 var(--color-black);
}

.window--dragging {
  opacity: 0.9;
  cursor: grabbing;
}

.window--resizing {
  cursor: se-resize;
}

.window__content {
  flex: 1;
  overflow: auto;
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  margin: 0 1px 1px 1px;
}

.window--collapsed .window__content {
  display: none;
}

.window__resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: se-resize;
  background-color: var(--color-window-bg, #CCCCCC);
  border-left: 1px solid var(--color-black);
  border-top: 1px solid var(--color-black);
}

.window__resize-lines {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 10px;
  height: 10px;
  background:
    linear-gradient(135deg,
      transparent 30%,
      var(--color-gray-dark) 30%,
      var(--color-gray-dark) 35%,
      transparent 35%,
      transparent 45%,
      var(--color-gray-dark) 45%,
      var(--color-gray-dark) 50%,
      transparent 50%,
      transparent 60%,
      var(--color-gray-dark) 60%,
      var(--color-gray-dark) 65%,
      transparent 65%,
      transparent 75%,
      var(--color-gray-dark) 75%,
      var(--color-gray-dark) 80%,
      transparent 80%
    );
}

/* Scrollbar styling for window content */
.window__content::-webkit-scrollbar {
  width: 16px;
  height: 16px;
}

.window__content::-webkit-scrollbar-track {
  background-color: var(--color-gray-light);
  border: 1px solid var(--color-black);
}

.window__content::-webkit-scrollbar-thumb {
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
}

.window__content::-webkit-scrollbar-button {
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  height: 16px;
  width: 16px;
}
</style>
