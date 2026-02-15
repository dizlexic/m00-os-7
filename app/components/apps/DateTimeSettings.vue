<script setup lang="ts">
/**
 * DateTimeSettings Component
 *
 * Control panel for system date and time settings.
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useSettings } from '~/composables/useSettings'

const { settings, updateSetting } = useSettings()

const currentTime = ref(new Date())
let timer: any

const availableTimezones = computed(() => {
  try {
    // @ts-ignore
    return Intl.supportedValuesOf('timeZone')
  } catch (e) {
    return ['UTC']
  }
})

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

const formattedTime = computed(() => {
  try {
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      second: settings.value.showSeconds ? '2-digit' : undefined,
      hour12: settings.value.timeFormat === '12h',
      timeZone: settings.value.timezone
    }
    return new Intl.DateTimeFormat('en-US', options).format(currentTime.value)
  } catch (e) {
    return currentTime.value.toLocaleTimeString()
  }
})

const formattedDate = computed(() => {
  try {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: settings.value.timezone
    }
    return new Intl.DateTimeFormat('en-US', options).format(currentTime.value)
  } catch (e) {
    return currentTime.value.toLocaleDateString()
  }
})

function setTimeFormat(format: '12h' | '24h') {
  updateSetting('timeFormat', format)
}

function toggleSeconds() {
  updateSetting('showSeconds', !settings.value.showSeconds)
}

function toggleDayOfWeek() {
  updateSetting('showDayOfWeek', !settings.value.showDayOfWeek)
}

function toggleDaylightSaving() {
  updateSetting('daylightSaving', !settings.value.daylightSaving)
}
</script>

<template>
  <div class="datetime-settings">
    <div class="datetime-settings__section">
      <h3 class="datetime-settings__title">Current Date & Time</h3>
      <div class="datetime-settings__display">
        <div class="datetime-settings__time">{{ formattedTime }}</div>
        <div class="datetime-settings__date">{{ formattedDate }}</div>
      </div>
    </div>

    <div class="datetime-settings__section">
      <h3 class="datetime-settings__title">Time Format</h3>
      <div class="datetime-settings__options">
        <label class="mac-radio">
          <div
            class="mac-radio__circle"
            :class="{ 'mac-radio__circle--selected': settings.timeFormat === '12h' }"
            @click="setTimeFormat('12h')"
          ></div>
          <span @click="setTimeFormat('12h')">12 Hour</span>
        </label>
        <label class="mac-radio">
          <div
            class="mac-radio__circle"
            :class="{ 'mac-radio__circle--selected': settings.timeFormat === '24h' }"
            @click="setTimeFormat('24h')"
          ></div>
          <span @click="setTimeFormat('24h')">24 Hour</span>
        </label>
      </div>
      <div class="datetime-settings__options">
        <label class="mac-checkbox">
          <div
            class="mac-checkbox__box"
            :class="{ 'mac-checkbox__box--checked': settings.showSeconds }"
            @click="toggleSeconds"
          ></div>
          <span @click="toggleSeconds">Show seconds</span>
        </label>
        <label class="mac-checkbox">
          <div
            class="mac-checkbox__box"
            :class="{ 'mac-checkbox__box--checked': settings.showDayOfWeek }"
            @click="toggleDayOfWeek"
          ></div>
          <span @click="toggleDayOfWeek">Show day of week</span>
        </label>
      </div>
    </div>

    <div class="datetime-settings__section">
      <h3 class="datetime-settings__title">Date Format</h3>
      <div class="datetime-settings__options">
        <select
          class="mac-input"
          :value="settings.dateFormat"
          @change="(e) => updateSetting('dateFormat', (e.target as HTMLSelectElement).value)"
        >
          <option value="MM/DD/YYYY">12/31/1999</option>
          <option value="DD/MM/YYYY">31/12/1999</option>
          <option value="YYYY-MM-DD">1999-12-31</option>
        </select>
      </div>
    </div>

    <div class="datetime-settings__section">
      <h3 class="datetime-settings__title">Time Zone</h3>
      <div class="datetime-settings__options">
        <select
          class="mac-input"
          :value="settings.timezone"
          @change="(e) => updateSetting('timezone', (e.target as HTMLSelectElement).value)"
        >
          <option v-for="tz in availableTimezones" :key="tz" :value="tz">
            {{ tz }}
          </option>
        </select>
      </div>
      <div class="datetime-settings__options" style="margin-top: var(--spacing-md)">
        <label class="mac-checkbox">
          <div
            class="mac-checkbox__box"
            :class="{ 'mac-checkbox__box--checked': settings.daylightSaving }"
            @click="toggleDaylightSaving"
          ></div>
          <span @click="toggleDaylightSaving">Daylight Saving Time</span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.datetime-settings {
  padding: var(--spacing-md);
  background-color: var(--color-gray-light);
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  overflow-y: auto;
}

.datetime-settings__section {
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  padding: var(--spacing-md);
  box-shadow: 1px 1px 0 var(--color-white) inset;
}

.datetime-settings__title {
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-gray-light);
  padding-bottom: var(--spacing-xs);
}

.datetime-settings__display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--color-gray-light);
  border: 1px solid var(--color-black);
  box-shadow: inset 1px 1px 0 var(--color-gray-dark);
}

.datetime-settings__time {
  font-family: var(--font-system);
  font-size: var(--font-size-xl);
  font-weight: bold;
  margin-bottom: var(--spacing-xs);
}

.datetime-settings__date {
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
}

.datetime-settings__options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.datetime-settings__options:last-child {
  margin-bottom: 0;
}
</style>
