<script setup lang="ts">
/**
 * RemoteCursor Component
 *
 * Displays a remote user's cursor on the shared desktop.
 * Shows cursor position, style, color, and optionally the username label.
 */
import { computed } from 'vue'
import type { RemoteUser, CursorStyle } from '~/types/stc'

interface Props {
  /** Remote user data */
  user: RemoteUser
  /** Whether to show the username label */
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: true
})

/** Cursor SVG paths for different styles */
const cursorPaths: Record<CursorStyle, string> = {
  arrow: 'M0,0 L0,16 L4,12 L7,19 L9,18 L6,11 L12,11 Z',
  hand: 'M8,0 L8,8 L6,8 L6,10 L4,10 L4,12 L2,12 L2,16 L14,16 L14,10 L12,10 L12,6 L10,6 L10,4 L8,4 Z',
  crosshair: 'M7,0 L9,0 L9,6 L16,6 L16,8 L9,8 L9,16 L7,16 L7,8 L0,8 L0,6 L7,6 Z',
  pointer: 'M5,0 L5,14 L8,11 L11,17 L13,16 L10,10 L14,10 Z'
}

/** Computed cursor style */
const cursorStyle = computed(() => ({
  left: `${props.user.position.x}px`,
  top: `${props.user.position.y}px`,
  '--cursor-color': props.user.cursor.color
}))

/** Get the SVG path for the cursor style */
const cursorPath = computed(() => cursorPaths[props.user.cursor.style] || cursorPaths.arrow)

/** Check if user is active (activity within last 30 seconds) */
const isActive = computed(() => {
  const thirtySecondsAgo = Date.now() - 30000
  return props.user.lastActivity > thirtySecondsAgo
})
</script>

<template>
  <div
    class="remote-cursor"
    :class="{ 'remote-cursor--inactive': !isActive }"
    :style="cursorStyle"
  >
    <!-- Cursor SVG -->
    <svg
      class="remote-cursor__icon"
      width="20"
      height="20"
      viewBox="0 0 16 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Shadow/outline -->
      <path
        :d="cursorPath"
        fill="black"
        transform="translate(1, 1)"
        opacity="0.3"
      />
      <!-- Main cursor -->
      <path
        :d="cursorPath"
        :fill="user.cursor.color"
        stroke="white"
        stroke-width="1"
      />
    </svg>

    <!-- Username label -->
    <div
      v-if="showLabel"
      class="remote-cursor__label"
      :style="{ backgroundColor: user.cursor.color }"
    >
      {{ user.username }}
    </div>
  </div>
</template>

<style scoped>
.remote-cursor {
  position: absolute;
  pointer-events: none;
  z-index: 10000;
  transform: translate(0, 0);
  transition: left 0.05s linear, top 0.05s linear;
}

.remote-cursor--inactive {
  opacity: 0.5;
}

.remote-cursor__icon {
  display: block;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
}

.remote-cursor__label {
  position: absolute;
  left: 16px;
  top: 14px;
  padding: 2px 6px;
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  color: white;
  white-space: nowrap;
  border-radius: 2px;
  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Ensure good contrast for light cursor colors */
.remote-cursor__label {
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}
</style>
