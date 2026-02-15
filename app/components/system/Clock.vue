<script setup lang="ts">
/**
 * Clock Component
 *
 * Mac OS 7 style clock that displays current time and toggles to date on click.
 * Following project guidelines for P0 and P1 requirements.
 */

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useSettings } from '~/composables/useSettings'

const { settings } = useSettings()

const showDate = ref(false)
const displayValue = ref('')

/**
 * Updates the display value based on current time or date.
 */
function updateDisplay(): void {
  const now = new Date()

  if (showDate.value) {
    // Date Format: respect settings.dateFormat
    const now = new Date()
    const day = now.getDate().toString().padStart(2, '0')
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const year = now.getFullYear()

    if (settings.dateFormat === 'DD/MM/YYYY') {
      displayValue.value = `${day}/${month}/${year}`
    } else if (settings.dateFormat === 'YYYY-MM-DD') {
      displayValue.value = `${year}-${month}-${day}`
    } else {
      displayValue.value = `${month}/${day}/${year}`
    }
  } else {
    // Time Format: "10:30:00 AM" or "22:30:00"
    let hours = now.getHours()
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const seconds = now.getSeconds().toString().padStart(2, '0')
    const timeStr = `${minutes}${settings.showSeconds ? ':' + seconds : ''}`

    if (settings.timeFormat === '12h') {
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      displayValue.value = `${displayHours}:${timeStr} ${ampm}`
    } else {
      const displayHours = hours.toString().padStart(2, '0')
      displayValue.value = `${displayHours}:${timeStr}`
    }
  }
}

// Watch for settings changes to update display immediately
watch(() => [settings.timeFormat, settings.showSeconds, settings.dateFormat], () => {
  updateDisplay()

  // If showing seconds, we need faster updates
  if (settings.showSeconds) {
    startTimer(1000)
  } else {
    startTimer(60000)
  }
})

let intervalId: ReturnType<typeof setInterval> | null = null

function startTimer(ms: number) {
  if (intervalId) {
    clearInterval(intervalId)
  }
  intervalId = setInterval(updateDisplay, ms)
}

onMounted(() => {
  updateDisplay()
  // Initial timer based on settings
  startTimer(settings.showSeconds ? 1000 : 60000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

/**
 * Toggles between time and date display.
 */
function toggleDisplay(): void {
  showDate.value = !showDate.value
  updateDisplay()
}
</script>

<template>
  <div
    class="clock"
    role="timer"
    aria-live="polite"
    data-testid="clock"
    @click="toggleDisplay"
  >
    {{ displayValue }}
  </div>
</template>

<style scoped>
.clock {
  padding: 0 var(--spacing-md);
  height: 100%;
  display: flex;
  align-items: center;
  cursor: default;
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  user-select: none;
}

.clock:hover {
  background-color: var(--color-black);
  color: var(--color-white);
}
</style>
