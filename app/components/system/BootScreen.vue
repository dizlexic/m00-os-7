<script setup lang="ts">
/**
 * BootScreen Component
 *
 * Displays the Mac OS 7 boot sequence with Happy Mac icon,
 * "Welcome to Macintosh" message, and loading progress bar.
 */

import { ref, onMounted, onUnmounted, computed } from 'vue'

interface Props {
  /** Boot sequence duration in milliseconds */
  duration?: number
  /** Whether to show the welcome message */
  showWelcome?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  duration: 3000,
  showWelcome: true
})

const emit = defineEmits<{
  /** Emitted when boot sequence completes */
  complete: []
}>()

// Reactive state
const progress = ref(0)
const isComplete = ref(false)

// Progress update interval
let progressInterval: ReturnType<typeof setInterval> | null = null

// Computed style for progress indicator
const progressStyle = computed(() => ({
  width: `${progress.value}%`
}))

// Start the boot sequence
function startBootSequence(): void {
  const updateInterval = 50 // Update every 50ms
  const progressIncrement = (100 * updateInterval) / props.duration

  progressInterval = setInterval(() => {
    progress.value = Math.min(progress.value + progressIncrement, 100)

    if (progress.value >= 100) {
      completeBootSequence()
    }
  }, updateInterval)
}

// Complete the boot sequence
function completeBootSequence(): void {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }

  if (!isComplete.value) {
    isComplete.value = true
    progress.value = 100
    emit('complete')
  }
}

// Lifecycle hooks
onMounted(() => {
  startBootSequence()
})

onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
})
</script>

<template>
  <div
    class="boot-screen"
    role="alert"
    aria-live="polite"
    aria-label="System boot in progress"
  >
    <div class="boot-screen__content">
      <!-- Happy Mac Icon -->
      <img
        data-testid="happy-mac"
        src="/assets/icons/system/happy-mac.png"
        alt="Happy Mac"
        class="boot-screen__icon"
      />

      <!-- Welcome Message -->
      <p
        v-if="showWelcome"
        data-testid="welcome-message"
        class="boot-screen__message"
      >
        Welcome to Macintosh
      </p>

      <!-- Progress Bar -->
      <div
        data-testid="progress-bar"
        class="boot-screen__progress-bar"
      >
        <div
          data-testid="progress-indicator"
          class="boot-screen__progress-indicator"
          :style="progressStyle"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.boot-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-gray-medium, #999999);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-boot-screen, 10000);
}

.boot-screen__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg, 16px);
}

.boot-screen__icon {
  width: 48px;
  height: 48px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.boot-screen__message {
  font-family: var(--font-system, 'Chicago', 'Geneva', sans-serif),serif;
  font-size: var(--font-size-md, 12px);
  color: var(--color-black, #000000);
  margin: 0;
  text-align: center;
}

.boot-screen__progress-bar {
  width: 200px;
  height: 12px;
  background-color: var(--color-white, #FFFFFF);
  border: 2px solid var(--color-black, #000000);
  border-radius: 2px;
  overflow: hidden;
}

.boot-screen__progress-indicator {
  height: 100%;
  background-color: var(--color-black, #000000);
  transition: width 50ms linear;
}
</style>
