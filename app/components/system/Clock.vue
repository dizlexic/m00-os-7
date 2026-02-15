<script setup lang="ts">
/**
 * Clock Component
 *
 * Mac OS 7 style clock that displays current time and toggles to date on click.
 * Following project guidelines for P0 and P1 requirements.
 */

import { ref, onMounted, onUnmounted } from 'vue'

const showDate = ref(false)
const displayValue = ref('')

/**
 * Updates the display value based on current time or date.
 */
function updateDisplay(): void {
  const now = new Date()

  if (showDate.value) {
    // Date Format: "May 13, 1991"
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }
    displayValue.value = now.toLocaleDateString('en-US', options)
  } else {
    // Time Format: "10:30 AM"
    const hours = now.getHours()
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    displayValue.value = `${displayHours}:${minutes} ${ampm}`
  }
}

/**
 * Toggles between time and date display.
 */
function toggleDisplay(): void {
  showDate.value = !showDate.value
  updateDisplay()
}

let intervalId: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  updateDisplay()
  // Update every minute as per P0 requirement
  intervalId = setInterval(updateDisplay, 60000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
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
