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
    // Date Format: respect settings.dateFormat and settings.timezone
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: settings.timezone
      }
      const formatter = new Intl.DateTimeFormat('en-US', options)
      const parts = formatter.formatToParts(now)
      const day = parts.find(p => p.type === 'day')?.value || ''
      const month = parts.find(p => p.type === 'month')?.value || ''
      const year = parts.find(p => p.type === 'year')?.value || ''

      if (settings.dateFormat === 'DD/MM/YYYY') {
        displayValue.value = `${day}/${month}/${year}`
      } else if (settings.dateFormat === 'YYYY-MM-DD') {
        displayValue.value = `${year}-${month}-${day}`
      } else {
        displayValue.value = `${month}/${day}/${year}`
      }
    } catch (e) {
      // Fallback if timezone is invalid or not supported
      const day = now.getDate().toString().padStart(2, '0')
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      const year = now.getFullYear()
      displayValue.value = `${month}/${day}/${year}`
    }
  } else {
    // Time Format: "10:30:00 AM" or "22:30:00"
    try {
      const options: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        second: settings.showSeconds ? '2-digit' : undefined,
        hour12: settings.timeFormat === '12h',
        timeZone: settings.timezone,
        hourCycle: settings.timeFormat === '24h' ? 'h23' : 'h12'
      }
      displayValue.value = new Intl.DateTimeFormat('en-US', options).format(now)
    } catch (e) {
      displayValue.value = now.toLocaleTimeString()
    }
  }
}

// Watch for settings changes to update display immediately
watch(() => [settings.timeFormat, settings.showSeconds, settings.dateFormat, settings.timezone], () => {
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
