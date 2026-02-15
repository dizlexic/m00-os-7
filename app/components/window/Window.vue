<script setup lang="ts">
/**
 * Window Component
 *
 * Mac OS 7 style window with title bar, content area, and resize handle.
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { WindowInstance } from '~/types/window'
import { useWindowManager } from '~/composables/useWindowManager'
import WindowTitleBar from './WindowTitleBar.vue'
import ScrollBar from './ScrollBar.vue'

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

// Scroll state
const contentRef = ref<HTMLElement | null>(null)
const scrollX = ref(0)
const scrollY = ref(0)
const contentTotalWidth = ref(0)
const contentTotalHeight = ref(0)
const contentVisibleWidth = ref(0)
const contentVisibleHeight = ref(0)

function updateContentSizes(): void {
  if (contentRef.value) {
    contentTotalWidth.value = contentRef.value.scrollWidth
    contentTotalHeight.value = contentRef.value.scrollHeight
    contentVisibleWidth.value = contentRef.value.clientWidth
    contentVisibleHeight.value = contentRef.value.clientHeight
    scrollX.value = contentRef.value.scrollLeft
    scrollY.value = contentRef.value.scrollTop
  }
}

function handleContentScroll(): void {
  if (contentRef.value) {
    scrollX.value = contentRef.value.scrollLeft
    scrollY.value = contentRef.value.scrollTop
  }
}

watch(scrollX, (newVal) => {
  if (contentRef.value && contentRef.value.scrollLeft !== newVal) {
    contentRef.value.scrollLeft = newVal
  }
})

watch(scrollY, (newVal) => {
  if (contentRef.value && contentRef.value.scrollTop !== newVal) {
    contentRef.value.scrollTop = newVal
  }
})

// Update sizes when window size changes
watch(() => props.window.size, () => {
  setTimeout(updateContentSizes, 0)
}, { deep: true })

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateContentSizes()
  if (contentRef.value) {
    resizeObserver = new ResizeObserver(updateContentSizes)
    resizeObserver.observe(contentRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

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
      class="window__body"
    >
      <div
        ref="contentRef"
        class="window__content"
        @scroll="handleContentScroll"
      >
        <slot />
      </div>

      <!-- Vertical ScrollBar -->
      <ScrollBar
        orientation="vertical"
        v-model="scrollY"
        :total-size="contentTotalHeight"
        :viewport-size="contentVisibleHeight"
        :is-active="window.isActive"
        class="window__scrollbar-v"
      />

      <!-- Horizontal ScrollBar -->
      <ScrollBar
        orientation="horizontal"
        v-model="scrollX"
        :total-size="contentTotalWidth"
        :viewport-size="contentVisibleWidth"
        :is-active="window.isActive"
        class="window__scrollbar-h"
      />

      <!-- Scrollbar Corner -->
      <div class="window__scrollbar-corner" />
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

.window__body {
  flex: 1;
  position: relative;
  display: grid;
  grid-template-columns: 1fr 16px;
  grid-template-rows: 1fr 16px;
  overflow: hidden;
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  margin: 0 1px 1px 1px;
}

.window__content {
  grid-area: 1 / 1 / 2 / 2;
  overflow: scroll;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.window__content::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.window__scrollbar-v {
  grid-area: 1 / 2 / 2 / 3;
  border-top: none;
  border-right: none;
  border-bottom: none;
}

.window__scrollbar-h {
  grid-area: 2 / 1 / 3 / 2;
  border-left: none;
  border-right: none;
  border-bottom: none;
}

.window__scrollbar-corner {
  grid-area: 2 / 2 / 3 / 3;
  background-color: var(--color-white);
  border-top: 1px solid var(--color-black);
  border-left: 1px solid var(--color-black);
}

.window--collapsed .window__body {
  display: none;
}

.window__resize-handle {
  position: absolute;
  right: 1px;
  bottom: 1px;
  width: 16px;
  height: 16px;
  z-index: 10;
  cursor: se-resize;
  background-color: var(--color-white);
  border-left: 1px solid var(--color-black);
  border-top: 1px solid var(--color-black);
  display: flex;
  align-items: center;
  justify-content: center;
}

.window:not(.window--active) .window__resize-lines {
  display: none;
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
</style>
