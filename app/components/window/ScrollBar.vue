<script setup lang="ts">
/**
 * ScrollBar Component
 *
 * Custom Mac OS 7 style scrollbar with arrows, track, and draggable thumb.
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  orientation: 'vertical' | 'horizontal'
  modelValue: number // current scroll position
  totalSize: number // total content size
  viewportSize: number // visible size
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: true
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const isDragging = ref(false)
const dragStartPosition = ref(0)
const dragStartScrollValue = ref(0)

// Scrollbar dimensions (fixed 16px as per Mac OS 7)
const SCROLLBAR_SIZE = 16
const ARROW_BUTTON_SIZE = 16

const scrollMax = computed(() => Math.max(0, props.totalSize - props.viewportSize))

// Calculate thumb size and position
const trackSize = computed(() => props.viewportSize - (ARROW_BUTTON_SIZE * 2))
const thumbSize = computed(() => {
  if (props.totalSize <= props.viewportSize) return 0
  const size = Math.max(ARROW_BUTTON_SIZE, (props.viewportSize / props.totalSize) * trackSize.value)
  return size
})

const thumbPosition = computed(() => {
  if (scrollMax.value <= 0) return 0
  const ratio = props.modelValue / scrollMax.value
  return ratio * (trackSize.value - thumbSize.value)
})

// Styles
const thumbStyle = computed(() => {
  if (props.orientation === 'vertical') {
    return {
      top: `${thumbPosition.value}px`,
      height: `${thumbSize.value}px`,
      width: '100%'
    }
  } else {
    return {
      left: `${thumbPosition.value}px`,
      width: `${thumbSize.value}px`,
      height: '100%'
    }
  }
})

// Handlers
function handleArrowClick(direction: -1 | 1): void {
  const step = 20 // pixels per click
  updateScroll(props.modelValue + direction * step)
}

function handleTrackClick(event: MouseEvent): void {
  // Page up/down
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const clickPos = props.orientation === 'vertical'
    ? event.clientY - rect.top
    : event.clientX - rect.left

  if (clickPos < thumbPosition.value) {
    updateScroll(props.modelValue - props.viewportSize)
  } else if (clickPos > thumbPosition.value + thumbSize.value) {
    updateScroll(props.modelValue + props.viewportSize)
  }
}

function handleThumbMouseDown(event: MouseEvent): void {
  if (event.button !== 0) return
  event.stopPropagation()

  isDragging.value = true
  dragStartPosition.value = props.orientation === 'vertical' ? event.clientY : event.clientX
  dragStartScrollValue.value = props.modelValue

  window.addEventListener('mousemove', handleThumbMouseMove)
  window.addEventListener('mouseup', handleThumbMouseUp)
}

function handleThumbMouseMove(event: MouseEvent): void {
  if (!isDragging.value) return

  const currentPos = props.orientation === 'vertical' ? event.clientY : event.clientX
  const delta = currentPos - dragStartPosition.value

  const trackRange = trackSize.value - thumbSize.value
  if (trackRange <= 0) return

  const scrollDelta = (delta / trackRange) * scrollMax.value
  updateScroll(dragStartScrollValue.value + scrollDelta)
}

function handleThumbMouseUp(): void {
  isDragging.value = false
  window.removeEventListener('mousemove', handleThumbMouseMove)
  window.removeEventListener('mouseup', handleThumbMouseUp)
}

function updateScroll(value: number): void {
  const clampedValue = Math.max(0, Math.min(scrollMax.value, value))
  emit('update:modelValue', clampedValue)
}

onUnmounted(() => {
  handleThumbMouseUp()
})
</script>

<template>
  <div
    class="scrollbar"
    :class="[`scrollbar--${orientation}`, { 'scrollbar--inactive': !isActive }]"
  >
    <!-- Arrow Start -->
    <button
      class="scrollbar__arrow scrollbar__arrow--start"
      :class="orientation === 'vertical' ? 'scrollbar__arrow--up' : 'scrollbar__arrow--left'"
      @click="handleArrowClick(-1)"
    >
      <svg
        v-if="orientation === 'vertical'"
        width="8"
        height="5"
        viewBox="0 0 8 5"
        class="scrollbar__arrow-svg"
      >
        <path d="M4 0 L8 5 L0 5 Z" fill="currentColor" />
      </svg>
      <svg
        v-else
        width="5"
        height="8"
        viewBox="0 0 5 8"
        class="scrollbar__arrow-svg"
      >
        <path d="M0 4 L5 0 L5 8 Z" fill="currentColor" />
      </svg>
    </button>

    <!-- Track -->
    <div
      class="scrollbar__track"
      @mousedown="handleTrackClick"
    >
      <!-- Thumb -->
      <div
        v-if="thumbSize > 0"
        class="scrollbar__thumb"
        :style="thumbStyle"
        @mousedown="handleThumbMouseDown"
      >
        <div class="scrollbar__thumb-pattern" />
      </div>
    </div>

    <!-- Arrow End -->
    <button
      class="scrollbar__arrow scrollbar__arrow--end"
      :class="orientation === 'vertical' ? 'scrollbar__arrow--down' : 'scrollbar__arrow--right'"
      @click="handleArrowClick(1)"
    >
      <svg
        v-if="orientation === 'vertical'"
        width="8"
        height="5"
        viewBox="0 0 8 5"
        class="scrollbar__arrow-svg"
      >
        <path d="M0 0 L8 0 L4 5 Z" fill="currentColor" />
      </svg>
      <svg
        v-else
        width="5"
        height="8"
        viewBox="0 0 5 8"
        class="scrollbar__arrow-svg"
      >
        <path d="M0 0 L5 4 L0 8 Z" fill="currentColor" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.scrollbar {
  display: flex;
  background-color: var(--color-gray-light);
  border: 1px solid var(--color-black);
  user-select: none;
}

.scrollbar--vertical {
  flex-direction: column;
  width: 16px;
  height: 100%;
}

.scrollbar--horizontal {
  flex-direction: row;
  height: 16px;
  width: 100%;
}

.scrollbar__arrow {
  width: 16px;
  height: 16px;
  padding: 0;
  margin: 0;
  background-color: var(--color-white);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  color: var(--color-black);
}

.scrollbar__arrow:active {
  background-color: var(--color-black);
  color: var(--color-white);
}

.scrollbar__arrow-svg {
  display: block;
  shape-rendering: crispEdges;
}

.scrollbar__arrow--start {
  border-bottom: 1px solid var(--color-black);
}

.scrollbar--horizontal .scrollbar__arrow--start {
  border-bottom: none;
  border-right: 1px solid var(--color-black);
}

.scrollbar__arrow--end {
  border-top: 1px solid var(--color-black);
}

.scrollbar--horizontal .scrollbar__arrow--end {
  border-top: none;
  border-left: 1px solid var(--color-black);
}

.scrollbar__track {
  flex: 1;
  position: relative;
  background-image: radial-gradient(var(--color-gray-medium) 1px, transparent 1px);
  background-size: 2px 2px;
}

.scrollbar__thumb {
  position: absolute;
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  box-shadow:
    inset 1px 1px 0 var(--color-white),
    inset -1px -1px 0 var(--color-gray-dark);
  cursor: default;
}

.scrollbar__thumb-pattern {
  width: 100%;
  height: 100%;
  /* Optional Mac OS 7 thumb pattern (3 lines) */
}

.scrollbar--inactive .scrollbar__thumb {
  display: none;
}

.scrollbar--inactive .scrollbar__track {
  background-image: none;
  background-color: var(--color-white);
}

</style>
